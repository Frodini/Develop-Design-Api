import { Service } from "typedi";
import { AppointmentRepository } from "./appointment.repository";
import { Appointment } from "./appoinment.model";
import { NotificationService } from "../notification/notification.service";

@Service()
export class AppointmentService {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private notificationService: NotificationService
  ) {}

  async createAppointment(appointment: Appointment): Promise<number> {
    const appointmentId = await this.appointmentRepository.createAppointment(
      appointment
    );

    await this.notificationService.createNotification({
      recipientId: appointment.patientId,
      message: `Your appointment with doctor ${appointment.doctorId} has been scheduled for ${appointment.date} at ${appointment.time}`,
    });

    await this.notificationService.createNotification({
      recipientId: appointment.doctorId,
      message: `You have a new appointment with patient ${appointment.patientId} on ${appointment.date} at ${appointment.time}`,
    });

    return appointmentId;
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

    await this.notificationService.createNotification({
      recipientId: appointment.patientId,
      message: `Your appointment with doctor ${appointment.doctorId} scheduled for ${appointment.date} at ${appointment.time} has been canceled.`,
    });

    await this.notificationService.createNotification({
      recipientId: appointment.doctorId,
      message: `The appointment with patient ${appointment.patientId} scheduled for ${appointment.date} at ${appointment.time} has been canceled.`,
    });
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

    await this.notificationService.createNotification({
      recipientId: appointment.patientId,
      message: `Your appointment wit the doctor ${appointment.doctorId} has been rescheduled for ${newDate} at ${newTime}.`,
    });

    await this.notificationService.createNotification({
      recipientId: appointment.doctorId,
      message: `The appointment with the patient ${appointment.patientId} has been rescheduled for ${newDate} at ${newTime}.`,
    });
  }

  async getDoctorSchedule(doctorId: number): Promise<any[]> {
    return this.appointmentRepository.getDoctorSchedule(doctorId);
  }

  async getAppointmentById(appointmentId: number): Promise<Appointment | null> {
    return this.appointmentRepository.getAppointmentById(appointmentId);
  }
}
