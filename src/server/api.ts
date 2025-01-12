import { Router } from "express";
import { Service } from "typedi";
import { UserController } from "../app/user/user.controller";
import { AuditLogController } from "../app/audit-log/audit-log.controller";
import { AppointmentController } from "../app/appointment/appoinment.controller";

@Service()
export class Api {
  private apiRouter: Router;

  constructor(
    private userController: UserController,
    private auditLogController: AuditLogController,
    private appointmentController: AppointmentController
  ) {
    this.apiRouter = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Rutas de usuario
    this.apiRouter.use("/users", this.userController.router);
    this.apiRouter.use("/audit-log", this.auditLogController.router); // Rutas de auditoría
    this.apiRouter.use("/appointments", this.appointmentController.router);

    // Aquí puedes agregar otros módulos, como:
    // this.apiRouter.use("/appointments", this.appointmentsController.router);
  }

  public getApiRouter(): Router {
    return this.apiRouter;
  }
}
