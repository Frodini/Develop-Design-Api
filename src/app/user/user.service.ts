import { Service } from "typedi";
import { UserRepository } from "./user.repository";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { User } from "./user.model";

@Service()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(user: User): Promise<number> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    return this.userRepository.createUser({
      ...user,
      password: hashedPassword,
    });
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
