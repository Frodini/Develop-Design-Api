import { AuditLogRepository } from "../../app/audit-log/audit-log.repository";
import { AuditLogService } from "../../app/audit-log/audit-log.service";
import { DatabaseService } from "../../database/database.service";

jest.mock("../../app/audit-log/audit-log.repository");

describe("AuditLogService", () => {
  let auditLogService: AuditLogService;
  let auditLogRepository: jest.Mocked<AuditLogRepository>;

  beforeEach(() => {
    const dbServiceMock = {} as jest.Mocked<DatabaseService>;
    auditLogRepository = new AuditLogRepository(
      dbServiceMock
    ) as jest.Mocked<AuditLogRepository>;
    auditLogService = new AuditLogService(auditLogRepository);
  });

  it("should log an action", async () => {
    const userId = 1;
    const action = "test action";
    const details = "test details";

    await auditLogService.log(userId, action, details);

    expect(auditLogRepository.logAction).toHaveBeenCalledWith({
      userId,
      action,
      details,
    });
  });

  it("should get logs", async () => {
    const logs = [
      { userId: 1, action: "test action", details: "test details" },
    ];
    auditLogRepository.getLogs.mockResolvedValue(logs);

    const result = await auditLogService.getLogs();

    expect(result).toEqual(logs);
    expect(auditLogRepository.getLogs).toHaveBeenCalled();
  });
});
