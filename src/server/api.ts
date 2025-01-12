import { Router } from "express";
import { Service } from "typedi";
import { UserController } from "../app/user/user.controller";
import { AuditLogController } from "../app/audit-log/audit-log.controller";
import { AppointmentController } from "../app/appointment/appoinment.controller";
import { AvailabilityController } from "../app/availability/availabilty.controller";
import { SpecialtyController } from "../app/specialty/specialty.controller";
import { DepartmentController } from "../app/department/department.controller";
import { MedicalRecordController } from "../app/medical-record/medical-record.controller";

@Service()
export class Api {
  private apiRouter: Router;

  constructor(
    private userController: UserController,
    private auditLogController: AuditLogController,
    private appointmentController: AppointmentController,
    private availabilityController: AvailabilityController,
    private specialtyController: SpecialtyController,
    private departmentController: DepartmentController,
    private medicalRecordController: MedicalRecordController
  ) {
    this.apiRouter = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Rutas de usuario
    this.apiRouter.use("/users", this.userController.router);
    this.apiRouter.use("/audit-log", this.auditLogController.router); // Rutas de auditoría
    this.apiRouter.use("/appointments", this.appointmentController.router);
    this.apiRouter.use("/", this.availabilityController.router);
    this.apiRouter.use("/specialties", this.specialtyController.router);
    this.apiRouter.use("/departments", this.departmentController.router);
    this.apiRouter.use("/medical-records", this.medicalRecordController.router);
  }

  public getApiRouter(): Router {
    return this.apiRouter;
  }
}
