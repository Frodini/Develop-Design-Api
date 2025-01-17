import { AuditLog } from "../../app/audit-log/audit-log.model";
import { AuditLogRepository } from "../../app/audit-log/audit-log.repository";
import { DatabaseService } from "../../database/database.service";

jest.mock("../../database/database.service");

describe("AuditLogRepository", () => {
  let auditLogRepository: AuditLogRepository;
  let dbService: jest.Mocked<DatabaseService>;
  let dbMock: any;

  beforeEach(() => {
    dbService = new DatabaseService() as jest.Mocked<DatabaseService>;
    auditLogRepository = new AuditLogRepository(dbService);

    dbMock = {
      run: jest.fn(),
      all: jest.fn(),
    };

    dbService.connect.mockResolvedValue(dbMock);
  });

  it("should log an action with details", async () => {
    const auditLog: AuditLog = {
      userId: 1,
      action: "test action",
      details: "test details",
    };

    await auditLogRepository.logAction(auditLog);

    expect(dbService.connect).toHaveBeenCalled();
    expect(dbMock.run).toHaveBeenCalledWith(
      `INSERT INTO audit_log (userId, action, details) VALUES (?, ?, ?)`,
      [auditLog.userId, auditLog.action, auditLog.details]
    );
  });

  it("should log an action without details", async () => {
    const auditLog: AuditLog = { userId: 1, action: "test action" };

    await auditLogRepository.logAction(auditLog);

    expect(dbService.connect).toHaveBeenCalled();
    expect(dbMock.run).toHaveBeenCalledWith(
      `INSERT INTO audit_log (userId, action, details) VALUES (?, ?, ?)`,
      [auditLog.userId, auditLog.action, null]
    );
  });

  it("should get logs", async () => {
    const logs = [
      {
        id: 1,
        userId: 1,
        action: "test action",
        details: "test details",
        timestamp: "2023-01-01T00:00:00Z",
      },
    ];
    dbMock.all.mockResolvedValue(logs);

    const result = await auditLogRepository.getLogs();

    expect(dbService.connect).toHaveBeenCalled();
    expect(dbMock.all).toHaveBeenCalledWith(
      `SELECT id, userId, action, details, timestamp FROM audit_log ORDER BY timestamp DESC`
    );
    expect(result).toEqual(logs);
  });
});
