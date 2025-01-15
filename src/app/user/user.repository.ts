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

  async getUserById(userId: number): Promise<User | null> {
    const db = await this.dbService.connect();
    const row = await db.get(`SELECT * FROM users WHERE id = ?`, [userId]);
    return row || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await this.dbService.connect();
    const row = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);
    return row || null;
  }

  async updateUser(userId: number, user: Partial<User>): Promise<void> {
    const db = await this.dbService.connect();
    await db.run(
      `UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?`,
      [user.name, user.email, user.password, userId]
    );
  }

  async searchUsersWithPagination(
    filters: { role?: string; name?: string },
    options: { limit: number; offset: number; sort: string }
  ): Promise<User[]> {
    const db = await this.dbService.connect();
    const { limit, offset, sort } = options;

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

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";
    return db.all(
      `SELECT * FROM users ${whereClause} ORDER BY ${sort} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
  }

  async validateSpecialties(specialtyIds: number[]): Promise<boolean> {
    const db = await this.dbService.connect();
    const placeholders = specialtyIds.map(() => "?").join(", ");
    const result = await db.all(
      `SELECT id FROM specialties WHERE id IN (${placeholders})`,
      specialtyIds
    );

    return result.length === specialtyIds.length;
  }

  async associateDoctorSpecialties(
    doctorId: number,
    specialtyIds: number[]
  ): Promise<void> {
    const db = await this.dbService.connect();

    const doctor = await db.get(
      `SELECT id FROM users WHERE id = ? AND role = 'Doctor'`,
      [doctorId]
    );
    if (!doctor) {
      throw new Error("Doctor not found or invalid role.");
    }

    const placeholders = specialtyIds.map(() => "?").join(", ");
    const validSpecialties = await db.all(
      `SELECT id FROM specialties WHERE id IN (${placeholders})`,
      specialtyIds
    );
    if (validSpecialties.length !== specialtyIds.length) {
      throw new Error("Some specialties do not exist.");
    }

    const queries = specialtyIds.map((specialtyId) =>
      db.run(
        `INSERT INTO doctor_specialties (doctorId, specialtyId) VALUES (?, ?)`,
        [doctorId, specialtyId]
      )
    );
    await Promise.all(queries);
  }

  async getSpecialtiesByDoctorId(doctorId: number): Promise<any[]> {
    const db = await this.dbService.connect();
    return await db.all(
      `SELECT specialties.id, specialties.name 
       FROM doctor_specialties 
       JOIN specialties ON doctor_specialties.specialtyId = specialties.id 
       WHERE doctor_specialties.doctorId = ?`,
      [doctorId]
    );
  }

  async deleteUser(userId: number): Promise<void> {
    const db = await this.dbService.connect();
    await db.run(`DELETE FROM users WHERE id = ?`, [userId]);
  }
}
