import { Router, Request, Response } from "express";
import { Service } from "typedi";
import { SpecialtyService } from "./specialty.service";
import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { AuditLogService } from "../audit-log/audit-log.service";

@Service()
export class SpecialtyController {
  public router: Router;

  constructor(
    private specialtyService: SpecialtyService,
    private auditLogService: AuditLogService
  ) {
    this.router = Router();
    this.routes();
  }

  private routes() {
    // Listar todas las especialidades
    this.router.get(
      "/",
      authenticateToken,
      async (req: Request, res: Response) => {
        try {
          const specialties = await this.specialtyService.getAllSpecialties();

          // Registrar acción en audit-log
          const loggedUserId = (req as any).user.userId;
          await this.auditLogService.log(
            loggedUserId,
            "LIST_SPECIALTIES",
            "Listed all specialties"
          );

          res.status(200).json(specialties);
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      }
    );

    // Asociar especialidades a un doctor
    this.router.post(
      "/doctors/:doctorId",
      authenticateToken,
      authorizeRoles(["Doctor"]),
      async (req: Request, res: Response): Promise<void> => {
        try {
          const { doctorId } = req.params;
          const { specialtyIds } = req.body;

          const loggedUserId = (req as any).user.userId;
          if (Number(doctorId) !== loggedUserId) {
            res.status(403).json({ error: "Forbidden: Unauthorized access" });
          }

          await this.specialtyService.associateDoctorSpecialties(
            Number(doctorId),
            specialtyIds
          );

          // Registrar acción en audit-log
          await this.auditLogService.log(
            loggedUserId,
            "ASSOCIATE_SPECIALTIES",
            `Associated specialties ${specialtyIds.join(
              ", "
            )} to doctor ID ${doctorId}`
          );

          res
            .status(200)
            .json({ message: "Specialties associated successfully" });
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );

    // Filtrar doctores por especialidad
    this.router.get(
      "/:specialtyId/doctors",
      authenticateToken,
      async (req: Request, res: Response): Promise<void> => {
        try {
          const { specialtyId } = req.params;
          const doctors = await this.specialtyService.getDoctorsBySpecialty(
            Number(specialtyId)
          );

          if (!doctors || doctors.length === 0) {
            res
              .status(404)
              .json({ error: "No doctors found for this specialty" });
          }

          // Registrar acción en audit-log
          const loggedUserId = (req as any).user.userId;
          await this.auditLogService.log(
            loggedUserId,
            "FILTER_DOCTORS_BY_SPECIALTY",
            `Filtered doctors by specialty ID ${specialtyId}`
          );

          // Formatear respuesta, si es necesario
          res.status(200).json(doctors);
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      }
    );
  }
}
