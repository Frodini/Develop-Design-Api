import request from "supertest";
import express, { json } from "express";
import { Container } from "typedi";
import { AvailabilityService } from "../../app/availability/availability.service";
import { AuditLogService } from "../../app/audit-log/audit-log.service";
import { authenticateToken } from "../../app/middleware/auth.middleware";
import { authorizeRoles } from "../../app/middleware/role.middleware";
import { AvailabilityController } from "../../app/availability/availabilty.controller";

jest.mock("../../app/middleware/auth.middleware", () => ({
  authenticateToken: (req: any, res: any, next: () => void) => {
    req.user = { userId: 1, role: "Doctor" }; // Simulate authenticated user
    next();
  },
}));

jest.mock("../../app/middleware/role.middleware", () => ({
  authorizeRoles: () => (req: any, res: any, next: () => void) => next(),
}));

describe("AvailabilityController", () => {
  let app: express.Application;
  let availabilityService: jest.Mocked<AvailabilityService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeAll(() => {
    app = express();
    app.use(json());

    // Create mock services
    availabilityService = {
      setAvailability: jest.fn(),
      getAvailability: jest.fn(),
    } as unknown as jest.Mocked<AvailabilityService>;

    auditLogService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    // Register mocked services with Typedi
    Container.set(AvailabilityService, availabilityService);
    Container.set(AuditLogService, auditLogService);

    const availabilityController = new AvailabilityController(
      availabilityService,
      auditLogService
    );

    app.use("/availability", availabilityController.router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("POST /availability/doctors/:doctorId/availability", () => {
    it("should set availability for the doctor", async () => {
      availabilityService.setAvailability.mockResolvedValue();
      auditLogService.log.mockResolvedValue();

      const response = await request(app)
        .post("/availability/doctors/1/availability")
        .send({
          date: "2023-01-01",
          timeSlots: ["09:00-10:00", "10:00-11:00"],
        })
        .set("Authorization", "Bearer valid_token");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Availability set successfully");
      expect(availabilityService.setAvailability).toHaveBeenCalledWith({
        doctorId: 1,
        date: "2023-01-01",
        timeSlots: ["09:00-10:00", "10:00-11:00"],
      });
      expect(auditLogService.log).toHaveBeenCalledWith(
        1,
        "SET_AVAILABILITY",
        "Set availability for doctor ID 1 on 2023-01-01 with time slots 09:00-10:00, 10:00-11:00"
      );
    });

    it("should return 403 if the doctor tries to set availability for another doctor", async () => {
      const response = await request(app)
        .post("/availability/doctors/2/availability")
        .send({
          date: "2023-01-01",
          timeSlots: ["09:00-10:00", "10:00-11:00"],
        })
        .set("Authorization", "Bearer valid_token");

      expect(response.status).toBe(403);
      expect(response.body.error).toBe(
        "Forbidden: Doctors can only set their own availability"
      );
      expect(availabilityService.setAvailability).not.toHaveBeenCalled();
    });

    it("should return 500 if an error occurs while setting availability", async () => {
      availabilityService.setAvailability.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .post("/availability/doctors/1/availability")
        .send({
          date: "2023-01-01",
          timeSlots: ["09:00-10:00", "10:00-11:00"],
        })
        .set("Authorization", "Bearer valid_token");

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(
        "An error occurred while setting availability"
      );
      expect(availabilityService.setAvailability).toHaveBeenCalled();
    });
  });
});
