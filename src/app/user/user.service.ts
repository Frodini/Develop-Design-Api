import { Service } from "typedi";
import { UserRepository } from "./user.repository";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { User } from "./user.model";

@Service()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(user: User): Promise<number> {
    if (
      user.role === "Doctor" &&
      (!user.specialties || user.specialties.length === 0)
    ) {
      throw new Error("Doctors must have at least one specialty.");
    }

    if (user.role === "Doctor") {
      const specialtiesValid = await this.userRepository.validateSpecialties(
        user.specialties!
      );
      if (!specialtiesValid) {
        throw new Error("Invalid specialties provided.");
      }
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userId = await this.userRepository.createUser({
      ...user,
      password: hashedPassword,
      specialties: undefined, // No guardar especialidades en la tabla `users`
    });

    if (user.role === "Doctor") {
      await this.userRepository.associateDoctorSpecialties(
        userId,
        user.specialties!
      );
    }

    return userId;
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
          expiresIn: "1h",
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

  async searchUsers(filters: {
    role?: string;
    name?: string;
  }): Promise<User[]> {
    return this.userRepository.searchUsers(filters);
  }
}
