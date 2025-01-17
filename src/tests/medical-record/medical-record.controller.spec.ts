import request from "supertest";
import express from "express";
import { MedicalRecordController } from "../../app/medical-record/medical-record.controller";
import { MedicalRecordService } from "../../app/medical-record/medical-record.service";
import { AuditLogService } from "../../app/audit-log/audit-log.service";
import { NotificationService } from "../../app/notification/notification.service";
import { authenticateToken } from "../../app/middleware/auth.middleware";
import { authorizeRoles } from "../../app/middleware/role.middleware";

jest.mock("../../app/middleware/auth.middleware");
jest.mock("../../app/middleware/role.middleware");

describe("MedicalRecordController", () => {
  let app: express.Application;
  let medicalRecordService: jest.Mocked<MedicalRecordService>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    jest.clearAllMocks();

    medicalRecordService = {
      createMedicalRecord: jest.fn(),
      updateMedicalRecord: jest.fn(),
      getMedicalRecordById: jest.fn(),
    } as unknown as jest.Mocked<MedicalRecordService>;

    auditLogService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
      (req as any).user = { userId: 1, role: "Doctor" }; // Mock user context
      next();
    });

    (authorizeRoles as jest.Mock).mockImplementation(
      () => (req: any, res: any, next: () => void) => next()
    );

    const medicalRecordController = new MedicalRecordController(
      medicalRecordService,
      auditLogService
    );

    app = express();
    app.use(express.json());
    app.use("/medical-records", medicalRecordController.router);
  });

  describe("POST /medical-records", () => {
    it("should create a medical record", async () => {
      medicalRecordService.createMedicalRecord.mockResolvedValue(1);
      auditLogService.log.mockResolvedValue(undefined);

      const response = await request(app)
        .post("/medical-records")
        .send({
          patientId: 1,
          doctorId: 1,
          diagnosis: "Sample diagnosis",
          prescriptions: ["Medicine A"],
          notes: "Sample notes",
          ongoingTreatments: ["Treatment A"],
          testResults: [{ type: "Blood Test", result: "Normal" }],
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        recordId: 1,
        message: "Medical record created successfully",
      });
      expect(medicalRecordService.createMedicalRecord).toHaveBeenCalled();
    });

    it("should return 400 if an error occurs", async () => {
      medicalRecordService.createMedicalRecord.mockRejectedValue(
        new Error("Test error")
      );

      const response = await request(app)
        .post("/medical-records")
        .send({ patientId: 1, details: "Test details" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Test error" });
    });
  });

  describe("PUT /medical-records/:recordId", () => {
    it("should update a medical record", async () => {
      medicalRecordService.updateMedicalRecord.mockResolvedValue(undefined);
      auditLogService.log.mockResolvedValue(undefined);

      const response = await request(app)
        .put("/medical-records/1")
        .send({ details: "Updated details" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        recordId: 1,
        message: "Medical record updated successfully",
      });
      expect(medicalRecordService.updateMedicalRecord).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it("should return 400 if an error occurs", async () => {
      medicalRecordService.updateMedicalRecord.mockRejectedValue(
        new Error("Test error")
      );

      const response = await request(app)
        .put("/medical-records/1")
        .send({ details: "Updated details" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: "Test error" });
    });
  });

  describe("GET /medical-records/:recordId", () => {
    it("should get a medical record by ID", async () => {
      medicalRecordService.getMedicalRecordById.mockResolvedValue({
        id: 1,
        patientId: 1,
        doctorId: 1,
        diagnosis: "Sample diagnosis",
        prescriptions: ["Medicine A"],
        notes: "Sample notes",
        ongoingTreatments: ["Treatment A"],
        testResults: [{ type: "Blood Test", result: "Normal" }],
      });

      auditLogService.log.mockResolvedValue(undefined);

      const response = await request(app).get("/medical-records/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 1,
        patientId: 1,
        doctorId: 1,
        diagnosis: "Sample diagnosis",
        prescriptions: ["Medicine A"],
        notes: "Sample notes",
        ongoingTreatments: ["Treatment A"],
        testResults: [{ type: "Blood Test", result: "Normal" }],
      });
      expect(medicalRecordService.getMedicalRecordById).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it("should return 404 if medical record is not found", async () => {
      medicalRecordService.getMedicalRecordById.mockResolvedValue(null);

      const response = await request(app).get("/medical-records/1");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Medical record not found" });
    });

    it("should return 403 if an error occurs", async () => {
      medicalRecordService.getMedicalRecordById.mockRejectedValue(
        new Error("Test error")
      );

      const response = await request(app).get("/medical-records/1");

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: "Test error" });
    });
  });
});
