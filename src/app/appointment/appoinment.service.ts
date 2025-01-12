import { Service } from "typedi";
import { AppointmentRepository } from "./appointment.repository";
import { Appointment } from "./appoinment.model";

@Service()
export class AppointmentService {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async createAppointment(appointment: Appointment): Promise<number> {
    // Aquí podrías agregar validaciones, como verificar disponibilidad
    return this.appointmentRepository.createAppointment(appointment);
  }

  async cancelAppointment(appointmentId: number): Promise<void> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    await this.appointmentRepository.updateAppointmentStatus(
      appointmentId,
      "Cancelled"
    );
  }

  async rescheduleAppointment(
    appointmentId: number,
    newDate: string,
    newTime: string
  ): Promise<void> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    // Reprogramar la cita
    await this.appointmentRepository.updateAppointmentStatus(
      appointmentId,
      "Rescheduled"
    );
    await this.appointmentRepository.createAppointment({
      ...appointment,
      date: newDate,
      time: newTime,
      status: "Scheduled",
    });
  }

  async getDoctorSchedule(doctorId: number): Promise<any[]> {
    return this.appointmentRepository.getDoctorSchedule(doctorId);
  }

  async getAppointmentById(appointmentId: number): Promise<Appointment | null> {
    return this.appointmentRepository.getAppointmentById(appointmentId);
  }
}
