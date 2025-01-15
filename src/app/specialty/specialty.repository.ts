import { Service } from "typedi";
import { DatabaseService } from "../../database/database.service";
import { Specialty } from "./specialty.model";

@Service()
export class SpecialtyRepository {
  constructor(private dbService: DatabaseService) {}

  async getAllSpecialties(): Promise<Specialty[]> {
    const db = await this.dbService.connect();
    return await db.all(`SELECT * FROM specialties`);
  }

  async associateDoctorSpecialties(
    doctorId: number,
    specialtyIds: number[]
  ): Promise<void> {
    const db = await this.dbService.connect();
    const queries = specialtyIds.map((specialtyId) =>
      db.run(
        `INSERT INTO doctor_specialties (doctorId, specialtyId) VALUES (?, ?)`,
        [doctorId, specialtyId]
      )
    );
    await Promise.all(queries);
  }

  async getDoctorsBySpecialty(specialtyId: number): Promise<any[]> {
    const db = await this.dbService.connect();
    return await db.all(
      `SELECT users.id AS doctorId, users.name AS doctorName 
       FROM doctor_specialties 
       JOIN users ON doctor_specialties.doctorId = users.id 
       WHERE doctor_specialties.specialtyId = ? AND users.role = 'Doctor'`,
      [specialtyId]
    );
  }
}
