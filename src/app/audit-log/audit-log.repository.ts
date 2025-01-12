import { Service } from "typedi";
import { DatabaseService } from "../../database/database.service";
import { AuditLog } from "./audit-log.model";

@Service()
export class AuditLogRepository {
  constructor(private dbService: DatabaseService) {}

  async logAction(auditLog: AuditLog): Promise<void> {
    const db = await this.dbService.connect();
    await db.run(
      `INSERT INTO audit_log (userId, action, details) VALUES (?, ?, ?)`,
      [auditLog.userId, auditLog.action, auditLog.details || null]
    );
  }

  async getLogs(): Promise<any[]> {
    const db = await this.dbService.connect();
    return await db.all(
      `SELECT id, userId, action, details, timestamp FROM audit_log ORDER BY timestamp DESC`
    );
  }
}
