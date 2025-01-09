import { Service } from "typedi";
import { DatabaseService } from "../../database/database.service";
import { User } from "./user.model";

@Service()
export class UserRepository {
  constructor(private dbService: DatabaseService) {}

  async createUser(user: User): Promise<number> {
    const db = await this.dbService.connect();
    const result = await db.run(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      [user.name, user.email, user.password, user.role]
    );
    return result.lastID!;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await this.dbService.connect();
    const row = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);
    return row || null;
  }

  async getUserById(userId: number): Promise<User | null> {
    const db = await this.dbService.connect();
    const row = await db.get(`SELECT * FROM users WHERE id = ?`, [userId]);
    return row || null;
  }

  async updateUser(userId: number, user: Partial<User>): Promise<void> {
    const db = await this.dbService.connect();
    await db.run(
      `UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?`,
      [user.name, user.email, user.password, userId]
    );
  }

  async searchUsers(filters: {
    role?: string;
    name?: string;
    email?: string;
  }): Promise<User[]> {
    const db = await this.dbService.connect();
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.role) {
      conditions.push(`role = ?`);
      params.push(filters.role);
    }
    if (filters.name) {
      conditions.push(`name LIKE ?`);
      params.push(`%${filters.name}%`);
    }
    if (filters.email) {
      conditions.push(`email LIKE ?`);
      params.push(`%${filters.email}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";
    return await db.all(`SELECT * FROM users ${whereClause}`, params);
  }
}
