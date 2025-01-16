import request from "supertest";
import { Container } from "typedi";
import express, { Express } from "express";
import { AuditLogService } from "../../app/audit-log/audit-log.service";
import { AuditLogController } from "../../app/audit-log/audit-log.controller";
import { AuditLogRepository } from "../../app/audit-log/audit-log.repository";
import { authenticateToken } from "../../app/middleware/auth.middleware";
import { authorizeRoles } from "../../app/middleware/role.middleware";

jest.mock("../../app/audit-log/audit-log.service");
jest.mock("../../app/middleware/auth.middleware", () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
}));

jest.mock("../../app/middleware/role.middleware", () => ({
  authorizeRoles: jest.fn(
    () => (req: any, res: any, next: () => any) => next()
  ),
}));

describe("AuditLogController", () => {
  let app: Express;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    const auditLogRepositoryMock = {} as jest.Mocked<AuditLogRepository>;
    auditLogService = new AuditLogService(
      auditLogRepositoryMock
    ) as jest.Mocked<AuditLogService>;
    Container.set(AuditLogService, auditLogService);

    const auditLogController = new AuditLogController(auditLogService);
    app.use("/audit-logs", auditLogController.router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch audit logs with valid token and admin role", async () => {
    (authenticateToken as jest.Mock).mockImplementation((req, res, next) =>
      next()
    );
    (authorizeRoles as jest.Mock).mockImplementation(
      () => (req: any, res: any, next: () => any) => next()
    );

    const logs = [
      {
        id: 1,
        userId: 1,
        action: "test action",
        details: "test details",
        timestamp: "2023-01-01T00:00:00Z",
      },
    ];
    auditLogService.getLogs.mockResolvedValue(logs);

    const response = await request(app).get("/audit-logs");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(logs);
    expect(auditLogService.getLogs).toHaveBeenCalled();
  });

  it("should return 500 if there is an error fetching audit logs", async () => {
    (authenticateToken as jest.Mock).mockImplementation((req, res, next) =>
      next()
    );
    (authorizeRoles as jest.Mock).mockImplementation(
      () => (req: any, res: any, next: () => any) => next()
    );

    auditLogService.getLogs.mockRejectedValue(
      new Error("Error fetching audit logs")
    );

    const response = await request(app).get("/audit-logs");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Error fetching audit logs" });
    expect(auditLogService.getLogs).toHaveBeenCalled();
  });
});
