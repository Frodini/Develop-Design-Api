import { Service } from "typedi";
import { DatabaseService } from "../../database/database.service";
import { Availability } from "./availability.model";

@Service()
export class AvailabilityRepository {
  constructor(private dbService: DatabaseService) {}

  async setAvailability(availability: Availability): Promise<void> {
    const db = await this.dbService.connect();
    await db.run(
      `INSERT OR REPLACE INTO availability (doctorId, date, timeSlots) VALUES (?, ?, ?)`,
      [
        availability.doctorId,
        availability.date,
        JSON.stringify(availability.timeSlots),
      ]
    );
  }

  async getAvailability(
    doctorId: number,
    date: string
  ): Promise<Availability | null> {
    const db = await this.dbService.connect();
    const row = await db.get(
      `SELECT * FROM availability WHERE doctorId = ? AND date = ?`,
      [doctorId, date]
    );
    return row
      ? {
          doctorId: row.doctorId,
          date: row.date,
          timeSlots: JSON.parse(row.timeSlots),
        }
      : null;
  }
}
