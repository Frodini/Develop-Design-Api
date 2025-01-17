import request from "supertest";
import express, { json } from "express";
import { Container } from "typedi";
import { DepartmentService } from "../../app/department/department.service";
import { AuditLogService } from "../../app/audit-log/audit-log.service";
import { DepartmentController } from "../../app/department/department.controller";
import { authenticateToken } from "../../app/middleware/auth.middleware";

jest.mock("../../app/middleware/auth.middleware", () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { userId: 1 }; // Simulate an authenticated user
    next();
  }),
}));

jest.mock("../../app/audit-log/audit-log.service");
jest.mock("../../app/department/department.service");

describe("DepartmentController", () => {
  let app: express.Application;
  let departmentService: jest.Mocked<DepartmentService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeAll(() => {
    app = express();
    app.use(json());

    // Mock services
    departmentService = {
      getAllDepartments: jest.fn(),
    } as unknown as jest.Mocked<DepartmentService>;

    auditLogService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    // Set up the controller
    const departmentController = new DepartmentController(
      departmentService,
      auditLogService
    );
    app.use("/departments", departmentController.router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /departments", () => {
    it("should return a list of departments", async () => {
      const mockDepartments = [
        { id: 1, name: "Emergency" },
        { id: 2, name: "Radiology" },
      ];
      departmentService.getAllDepartments.mockResolvedValue(mockDepartments);

      const response = await request(app)
        .get("/departments")
        .set("Authorization", "Bearer valid_token"); // Simulate a valid token

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDepartments);
      expect(departmentService.getAllDepartments).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalledWith(
        1,
        "LIST_DEPARTMENTS",
        "Listed all departments"
      );
    });

    it("should return 500 if an error occurs", async () => {
      departmentService.getAllDepartments.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .get("/departments")
        .set("Authorization", "Bearer valid_token"); // Simulate a valid token

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Database error" });
      expect(departmentService.getAllDepartments).toHaveBeenCalled();
      expect(auditLogService.log).not.toHaveBeenCalled();
    });

    it("should return 401 if no token is provided", async () => {
      (authenticateToken as jest.Mock).mockImplementationOnce(
        (req, res, next) => {
          res.status(401).json({ message: "Unauthorized" });
        }
      );

      const response = await request(app).get("/departments");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Unauthorized" });
      expect(departmentService.getAllDepartments).not.toHaveBeenCalled();
      expect(auditLogService.log).not.toHaveBeenCalled();
    });
  });
});
