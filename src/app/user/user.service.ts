import { Service } from "typedi";
import { UserRepository } from "./user.repository";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { User } from "./user.model";

@Service()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(user: User): Promise<number> {
    if (user.role === "Doctor") {
      if (!user.specialties || user.specialties.length === 0) {
        throw new Error("Doctors must have at least one specialty.");
      }

      const specialtiesValid = await this.userRepository.validateSpecialties(
        user.specialties
      );
      if (!specialtiesValid) {
        throw new Error("Invalid specialties provided.");
      }
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userId = await this.userRepository.createUser({
      ...user,
      password: hashedPassword,
    });

    if (user.role === "Doctor") {
      await this.userRepository.associateDoctorSpecialties(
        userId,
        user.specialties!
      );
    }
    return userId;
  }

  async getSpecialtiesByDoctorId(doctorId: number): Promise<any[]> {
    return this.userRepository.getSpecialtiesByDoctorId(doctorId);
  }

  async authenticateUser(
    email: string,
    password: string
  ): Promise<string | null> {
    const user = await this.userRepository.getUserByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        "tu_secreto",
        {
          expiresIn: "24h",
        }
      );
      return token;
    }
    return null;
  }

  async updateUser(userId: number, user: Partial<User>): Promise<void> {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
    await this.userRepository.updateUser(userId, user);
  }

  async getUserById(userId: number): Promise<User | null> {
    return this.userRepository.getUserById(userId);
  }

  async searchUsers(
    filters: { role?: string; name?: string },
    options: { page: number; limit: number; sort: string }
  ): Promise<User[]> {
    const { page, limit, sort } = options;

    const offset = (page - 1) * limit;
    return this.userRepository.searchUsersWithPagination(filters, {
      limit,
      offset,
      sort,
    });
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    await this.userRepository.deleteUser(userId);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.getUserByEmail(email);
  }
}
