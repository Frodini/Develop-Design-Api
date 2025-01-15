import { Router, Request, Response } from "express";
import { Service } from "typedi";
import { DepartmentService } from "./department.service";
import { authenticateToken } from "../middleware/auth.middleware";
import { AuditLogService } from "../audit-log/audit-log.service";

@Service()
export class DepartmentController {
  public router: Router;

  constructor(
    private departmentService: DepartmentService,
    private auditLogService: AuditLogService
  ) {
    this.router = Router();
    this.routes();
  }

  private routes() {
    this.router.get(
      "/",
      authenticateToken,
      async (req: Request, res: Response) => {
        try {
          const departments = await this.departmentService.getAllDepartments();

          const loggedUserId = (req as any).user.userId;
          await this.auditLogService.log(
            loggedUserId,
            "LIST_DEPARTMENTS",
            "Listed all departments"
          );

          res.status(200).json(departments);
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      }
    );
  }
}
