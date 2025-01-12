import { Router } from "express";
import { Service } from "typedi";
import { UserController } from "../app/user/user.controller";
import { AuditLogController } from "../app/audit-log/audit-log.controller";
import { AppointmentController } from "../app/appointment/appoinment.controller";
import { AvailabilityController } from "../app/availability/availabilty.controller";

@Service()
export class Api {
  private apiRouter: Router;

  constructor(
    private userController: UserController,
    private auditLogController: AuditLogController,
    private appointmentController: AppointmentController,
    private availabilityController: AvailabilityController
  ) {
    this.apiRouter = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Rutas de usuario
    this.apiRouter.use("/users", this.userController.router);
    this.apiRouter.use("/audit-log", this.auditLogController.router); // Rutas de auditoría
    this.apiRouter.use("/appointments", this.appointmentController.router);
    this.apiRouter.use("/availability", this.availabilityController.router);
  }

  public getApiRouter(): Router {
    return this.apiRouter;
  }
}
