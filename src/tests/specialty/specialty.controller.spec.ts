import request from "supertest";
import express, { json } from "express";
import { Container } from "typedi";
import { SpecialtyService } from "../../app/specialty/specialty.service";
import { AuditLogService } from "../../app/audit-log/audit-log.service";
import { SpecialtyController } from "../../app/specialty/specialty.controller";
import { authenticateToken } from "../../app/middleware/auth.middleware";
import { authorizeRoles } from "../../app/middleware/role.middleware";

jest.mock("../../app/middleware/auth.middleware");
jest.mock("../../app/middleware/role.middleware");

describe("SpecialtyController", () => {
  let app: express.Application;
  let specialtyService: jest.Mocked<SpecialtyService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    jest.clearAllMocks();

    specialtyService = {
      getAllSpecialties: jest.fn(),
      associateDoctorSpecialties: jest.fn(),
      getDoctorsBySpecialty: jest.fn(),
    } as unknown as jest.Mocked<SpecialtyService>;

    auditLogService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    Container.set(SpecialtyService, specialtyService);
    Container.set(AuditLogService, auditLogService);

    (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
      (req as any).user = { userId: 1, role: "Doctor" };
      next();
    });

    (authorizeRoles as jest.Mock).mockImplementation(
      () => (req: any, res: any, next: () => void) => {
        next();
      }
    );

    const specialtyController = new SpecialtyController(
      specialtyService,
      auditLogService
    );

    app = express();
    app.use(json());
    app.use("/specialties", specialtyController.router);
  });

  describe("GET /specialties", () => {
    it("should list all specialties", async () => {
      specialtyService.getAllSpecialties.mockResolvedValue([
        { id: 1, name: "Cardiology" },
      ]);

      const response = await request(app).get("/specialties");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, name: "Cardiology" }]);
      expect(specialtyService.getAllSpecialties).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it("should return 500 if an error occurs", async () => {
      specialtyService.getAllSpecialties.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app).get("/specialties");

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Database error");
    });
  });

  describe("POST /specialties/doctors/:doctorId", () => {
    it("should associate specialties with a doctor", async () => {
      const response = await request(app)
        .post("/specialties/doctors/1")
        .send({ specialtyIds: [1, 2] });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Specialties associated successfully");
      expect(specialtyService.associateDoctorSpecialties).toHaveBeenCalledWith(
        1,
        [1, 2]
      );
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it("should return 403 if doctorId does not match logged-in user", async () => {
      (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
        (req as any).user = { userId: 2, role: "Doctor" };
        next();
      });

      const response = await request(app)
        .post("/specialties/doctors/1")
        .send({ specialtyIds: [1, 2] });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Forbidden: Unauthorized access");
    });

    it("should return 400 if an error occurs while associating specialties", async () => {
      specialtyService.associateDoctorSpecialties.mockRejectedValue(
        new Error("Failed to associate specialties")
      );

      const response = await request(app)
        .post("/specialties/doctors/1")
        .send({ specialtyIds: [1, 2] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Failed to associate specialties");
      expect(specialtyService.associateDoctorSpecialties).toHaveBeenCalledWith(
        1,
        [1, 2]
      );
    });
  });

  describe("GET /specialties/:specialtyId/doctors", () => {
    it("should list doctors for a given specialty", async () => {
      specialtyService.getDoctorsBySpecialty.mockResolvedValue([
        { doctorId: 1, doctorName: "Dr. Smith" },
      ]);

      const response = await request(app).get("/specialties/1/doctors");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ doctorId: 1, doctorName: "Dr. Smith" }]);
      expect(specialtyService.getDoctorsBySpecialty).toHaveBeenCalledWith(1);
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it("should return 404 if no doctors are found", async () => {
      specialtyService.getDoctorsBySpecialty.mockResolvedValue([]);

      const response = await request(app).get("/specialties/1/doctors");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("No doctors found for this specialty");
    });

    it("should return 500 if an error occurs", async () => {
      specialtyService.getDoctorsBySpecialty.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app).get("/specialties/1/doctors");

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Database error");
    });
  });
});
