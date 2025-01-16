import { Container } from "typedi";
import { jest } from "@jest/globals";
import { AppointmentService } from "../../app/appointment/appoinment.service";
import { AppointmentRepository } from "../../app/appointment/appointment.repository";
import { NotificationService } from "../../app/notification/notification.service";
import { Appointment } from "../../app/appointment/appoinment.model";

describe("AppointmentService", () => {
  let appointmentService: AppointmentService;
  let appointmentRepository: jest.Mocked<AppointmentRepository>;
  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    appointmentRepository = {
      createAppointment: jest.fn(),
      getAppointmentById: jest.fn(),
      updateAppointmentStatus: jest.fn(),
      getDoctorSchedule: jest.fn(),
    } as unknown as jest.Mocked<AppointmentRepository>;

    notificationService = {
      createNotification: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    Container.set(AppointmentRepository, appointmentRepository);
    Container.set(NotificationService, notificationService);

    appointmentService = new AppointmentService(
      appointmentRepository,
      notificationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createAppointment", () => {
    it("should create an appointment and send notifications", async () => {
      const appointment: Appointment = {
        id: 1,
        patientId: 2,
        doctorId: 3,
        date: "2023-10-10",
        time: "10:00",
        status: "Scheduled",
      };

      appointmentRepository.createAppointment.mockResolvedValue(1);

      const appointmentId = await appointmentService.createAppointment(
        appointment
      );

      expect(appointmentId).toBe(1);
      expect(appointmentRepository.createAppointment).toHaveBeenCalledWith(
        appointment
      );
      expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe("cancelAppointment", () => {
    it("should cancel an appointment and send notifications", async () => {
      const appointment: Appointment = {
        id: 1,
        patientId: 2,
        doctorId: 3,
        date: "2023-10-10",
        time: "10:00",
        status: "Scheduled",
      };

      appointmentRepository.getAppointmentById.mockResolvedValue(appointment);

      await appointmentService.cancelAppointment(1);

      expect(appointmentRepository.updateAppointmentStatus).toHaveBeenCalledWith(
        1,
        "Cancelled"
      );
      expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
    });

    it("should throw an error if the appointment is not found", async () => {
      appointmentRepository.getAppointmentById.mockResolvedValue(null);

      await expect(
        appointmentService.cancelAppointment(1)
      ).rejects.toThrowError("Appointment not found");

      expect(appointmentRepository.updateAppointmentStatus).not.toHaveBeenCalled();
      expect(notificationService.createNotification).not.toHaveBeenCalled();
    });
  });

  describe("rescheduleAppointment", () => {
    it("should reschedule an appointment and send notifications", async () => {
      const appointment: Appointment = {
        id: 1,
        patientId: 2,
        doctorId: 3,
        date: "2023-10-10",
        time: "10:00",
        status: "Scheduled",
      };

      appointmentRepository.getAppointmentById.mockResolvedValue(appointment);

      await appointmentService.rescheduleAppointment(
        1,
        "2023-10-11",
        "11:00"
      );

      expect(appointmentRepository.updateAppointmentStatus).toHaveBeenCalledWith(
        1,
        "Rescheduled"
      );
      expect(appointmentRepository.createAppointment).toHaveBeenCalledWith({
        ...appointment,
        date: "2023-10-11",
        time: "11:00",
        status: "Scheduled",
      });
      expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
    });

    it("should throw an error if the appointment is not found", async () => {
      appointmentRepository.getAppointmentById.mockResolvedValue(null);

      await expect(
        appointmentService.rescheduleAppointment(1, "2023-10-11", "11:00")
      ).rejects.toThrowError("Appointment not found");

      expect(appointmentRepository.updateAppointmentStatus).not.toHaveBeenCalled();
      expect(notificationService.createNotification).not.toHaveBeenCalled();
    });
  });

  describe("getDoctorSchedule", () => {
    it("should return the doctor's schedule", async () => {
      const schedule = [{ id: 1, date: "2023-10-10", time: "10:00" }];
      appointmentRepository.getDoctorSchedule.mockResolvedValue(schedule);

      const result = await appointmentService.getDoctorSchedule(3);

      expect(result).toEqual(schedule);
      expect(appointmentRepository.getDoctorSchedule).toHaveBeenCalledWith(3);
    });
  });

  describe("getAppointmentById", () => {
    it("should return the appointment by ID", async () => {
      const appointment: Appointment = {
        id: 1,
        patientId: 2,
        doctorId: 3,
        date: "2023-10-10",
        time: "10:00",
        status: "Scheduled",
      };

      appointmentRepository.getAppointmentById.mockResolvedValue(appointment);

      const result = await appointmentService.getAppointmentById(1);

      expect(result).toEqual(appointment);
      expect(appointmentRepository.getAppointmentById).toHaveBeenCalledWith(1);
    });

    it("should return null if the appointment is not found", async () => {
      appointmentRepository.getAppointmentById.mockResolvedValue(null);

      const result = await appointmentService.getAppointmentById(1);

      expect(result).toBeNull();
      expect(appointmentRepository.getAppointmentById).toHaveBeenCalledWith(1);
    });
  });
});
