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

  // Crear una cita
  async createAppointment(appointment: Appointment): Promise<number> {
    const appointmentId = await this.appointmentRepository.createAppointment(
      appointment
    );

    // Crear notificaciones para el paciente y el doctor
    await this.notificationService.createNotification({
      recipientId: appointment.patientId,
      message: `Tu cita con el doctor ${appointment.doctorId} ha sido agendada para ${appointment.date} a las ${appointment.time}`,
    });

    await this.notificationService.createNotification({
      recipientId: appointment.doctorId,
      message: `Tienes una nueva cita con el paciente ${appointment.patientId} el ${appointment.date} a las ${appointment.time}`,
    });

    return appointmentId;
  }

  // Cancelar una cita
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

    // Crear notificaciones para el paciente y el doctor
    await this.notificationService.createNotification({
      recipientId: appointment.patientId,
      message: `Tu cita con el doctor ${appointment.doctorId} programada para ${appointment.date} a las ${appointment.time} ha sido cancelada.`,
    });

    await this.notificationService.createNotification({
      recipientId: appointment.doctorId,
      message: `La cita con el paciente ${appointment.patientId} programada para ${appointment.date} a las ${appointment.time} ha sido cancelada.`,
    });
  }

  // Reprogramar una cita
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

    // Actualizar estado de la cita original
    await this.appointmentRepository.updateAppointmentStatus(
      appointmentId,
      "Rescheduled"
    );

    // Crear una nueva cita reprogramada
    await this.appointmentRepository.createAppointment({
      ...appointment,
      date: newDate,
      time: newTime,
      status: "Scheduled",
    });

    // Crear notificaciones para el paciente y el doctor
    await this.notificationService.createNotification({
      recipientId: appointment.patientId,
      message: `Tu cita con el doctor ${appointment.doctorId} ha sido reprogramada para ${newDate} a las ${newTime}.`,
    });

    await this.notificationService.createNotification({
      recipientId: appointment.doctorId,
      message: `La cita con el paciente ${appointment.patientId} ha sido reprogramada para ${newDate} a las ${newTime}.`,
    });
  }

  // Obtener agenda del doctor
  async getDoctorSchedule(doctorId: number): Promise<any[]> {
    return this.appointmentRepository.getDoctorSchedule(doctorId);
  }

  // Obtener una cita por ID
  async getAppointmentById(appointmentId: number): Promise<Appointment | null> {
    return this.appointmentRepository.getAppointmentById(appointmentId);
  }
}
