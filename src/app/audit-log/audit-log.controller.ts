import { Router, Request, Response } from "express";
import { Service } from "typedi";
import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { AuditLogService } from "./audit-log.service";

@Service()
export class AuditLogController {
  public router: Router;

  constructor(private auditLogService: AuditLogService) {
    this.router = Router();
    this.routes();
  }

  private routes() {
    // Endpoint para obtener los registros de auditoría
    this.router.get(
      "/",
      authenticateToken,
      authorizeRoles(["Admin"]), // Solo los administradores pueden acceder
      async (req: Request, res: Response) => {
        try {
          const logs = await this.auditLogService.getLogs();
          res.status(200).json(logs);
        } catch (error) {
          res.status(500).json({ error: "Error fetching audit logs" });
        }
      }
    );
  }
}
