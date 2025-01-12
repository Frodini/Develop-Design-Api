import { Service } from "typedi";
import { DatabaseService } from "../../database/database.service";
import { Appointment } from "./appoinment.model";

@Service()
export class AppointmentRepository {
  constructor(private dbService: DatabaseService) {}

  async createAppointment(appointment: Appointment): Promise<number> {
    const db = await this.dbService.connect();
    const result = await db.run(
      `INSERT INTO appointments (patientId, doctorId, date, time, reason, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        appointment.patientId,
        appointment.doctorId,
        appointment.date,
        appointment.time,
        appointment.reason || null,
        "Scheduled",
      ]
    );
    return result.lastID!;
  }

  async getAppointmentById(appointmentId: number): Promise<Appointment | null> {
    const db = await this.dbService.connect();
    const row = await db.get(`SELECT * FROM appointments WHERE id = ?`, [
      appointmentId,
    ]);
    return row || null;
  }

  async updateAppointmentStatus(
    appointmentId: number,
    status: string
  ): Promise<void> {
    const db = await this.dbService.connect();
    await db.run(`UPDATE appointments SET status = ? WHERE id = ?`, [
      status,
      appointmentId,
    ]);
  }

  async getDoctorSchedule(doctorId: number): Promise<any[]> {
    const db = await this.dbService.connect();
    return await db.all(
      `SELECT * FROM appointments WHERE doctorId = ? AND status = 'Scheduled' ORDER BY date, time`,
      [doctorId]
    );
  }
}
