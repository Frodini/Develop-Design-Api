import request from "supertest";
import express, { json } from "express";
import { Container } from "typedi";
import { AppointmentService } from "../../app/appointment/appoinment.service";
import { AuditLogService } from "../../app/audit-log/audit-log.service";
import { AppointmentController } from "../../app/appointment/appoinment.controller";
import { authenticateToken } from "../../app/middleware/auth.middleware";
import { authorizeRoles } from "../../app/middleware/role.middleware";

jest.mock("../../app/middleware/auth.middleware");
jest.mock("../../app/middleware/role.middleware");

describe("AppointmentController", () => {
  let app: express.Application;
  let appointmentService: jest.Mocked<AppointmentService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    jest.clearAllMocks();

    appointmentService = {
      createAppointment: jest.fn(),
      cancelAppointment: jest.fn(),
      rescheduleAppointment: jest.fn(),
      getDoctorSchedule: jest.fn(),
      getAppointmentById: jest.fn(),
    } as unknown as jest.Mocked<AppointmentService>;

    auditLogService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    Container.set(AppointmentService, appointmentService);
    Container.set(AuditLogService, auditLogService);

    (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
      (req as any).user = { userId: 1, role: "Patient" };
      next();
    });

    (authorizeRoles as jest.Mock).mockImplementation(
      () => (req: any, res: any, next: () => void) => next()
    );

    const appointmentController = new AppointmentController(
      appointmentService,
      auditLogService
    );

    app = express();
    app.use(json());
    app.use("/appointments", appointmentController.router);
  });

  describe("POST /appointments", () => {
    it("should create an appointment", async () => {
      appointmentService.createAppointment.mockResolvedValue(1);

      const response = await request(app).post("/appointments").send({
        patientId: 1,
        doctorId: 2,
        date: "2023-10-10",
        time: "10:00",
        reason: "Consultation",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        appointmentId: 1,
        message: "Appointment created successfully",
      });
      expect(appointmentService.createAppointment).toHaveBeenCalledWith({
        patientId: 1,
        doctorId: 2,
        date: "2023-10-10",
        time: "10:00",
        reason: "Consultation",
      });
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it("should return 403 if patientId does not match logged-in user", async () => {
      const response = await request(app).post("/appointments").send({
        patientId: 2,
        doctorId: 2,
        date: "2023-10-10",
        time: "10:00",
        reason: "Consultation",
      });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe(
        "Forbidden: Patients can only create their own appointments"
      );
    });
  });

  describe("DELETE /appointments/:appointmentId", () => {
    it("should cancel an appointment", async () => {
      appointmentService.getAppointmentById.mockResolvedValue({
        id: 1,
        patientId: 1,
        doctorId: 2,
        date: "2023-10-10",
        time: "10:00",
        status: "Scheduled",
      });

      const response = await request(app).delete("/appointments/1");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Appointment cancelled successfully");
      expect(appointmentService.cancelAppointment).toHaveBeenCalledWith(1);
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it("should return 403 if patient does not own the appointment", async () => {
      appointmentService.getAppointmentById.mockResolvedValue({
        id: 1,
        patientId: 2,
        doctorId: 2,
        date: "2023-10-10",
        time: "10:00",
        status: "Scheduled",
      });

      const response = await request(app).delete("/appointments/1");

      expect(response.status).toBe(403);
      expect(response.body.error).toBe(
        "Forbidden: Patients can only cancel their own appointments"
      );
    });
  });

  describe("PUT /appointments/:appointmentId", () => {
    it("should reschedule an appointment", async () => {
      appointmentService.getAppointmentById.mockResolvedValue({
        id: 1,
        patientId: 1,
        doctorId: 2,
        date: "2023-10-10",
        time: "10:00",
        status: "Scheduled",
      });

      const response = await request(app)
        .put("/appointments/1")
        .send({ newDate: "2023-10-11", newTime: "11:00" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "Appointment rescheduled successfully"
      );
      expect(appointmentService.rescheduleAppointment).toHaveBeenCalledWith(
        1,
        "2023-10-11",
        "11:00"
      );
      expect(auditLogService.log).toHaveBeenCalled();
    });
  });

  describe("GET /appointments/doctors/:doctorId/schedule", () => {
    it("should get a doctor's schedule", async () => {
      (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
        (req as any).user = { userId: 2, role: "Doctor" };
        next();
      });

      appointmentService.getDoctorSchedule.mockResolvedValue([
        { id: 1, date: "2023-10-10", time: "10:00" },
      ]);

      const response = await request(app).get(
        "/appointments/doctors/2/schedule"
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 1, date: "2023-10-10", time: "10:00" },
      ]);
      expect(appointmentService.getDoctorSchedule).toHaveBeenCalledWith(2);
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it("should return 403 if doctorId does not match logged-in doctor", async () => {
      (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
        (req as any).user = { userId: 3, role: "Doctor" };
        next();
      });

      const response = await request(app).get(
        "/appointments/doctors/2/schedule"
      );

      expect(response.status).toBe(403);
      expect(response.body.error).toBe(
        "Forbidden: Doctors can only access their own schedule"
      );
    });
  });
});
