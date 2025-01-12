import { Service } from "typedi";
import { AuditLogRepository } from "./audit-log.repository";
import { AuditLog } from "./audit-log.model";

@Service()
export class AuditLogService {
  constructor(private auditLogRepository: AuditLogRepository) {}

  async log(userId: number, action: string, details?: string): Promise<void> {
    await this.auditLogRepository.logAction({ userId, action, details });
  }

  async getLogs(): Promise<any[]> {
    return await this.auditLogRepository.getLogs();
  }
}
