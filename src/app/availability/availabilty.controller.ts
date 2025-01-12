import { Router, Request, Response } from "express";
import { Service } from "typedi";
import { AvailabilityService } from "./availability.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

@Service()
export class AvailabilityController {
  public router: Router;

  constructor(
    private availabilityService: AvailabilityService,
    private auditLogService: AuditLogService
  ) {
    this.router = Router();
    this.routes();
  }

  private routes() {
    // Establecer disponibilidad (solo doctores)
    this.router.post(
      "/doctors/:doctorId/availability",
      authenticateToken,
      authorizeRoles(["Doctor"]),
      async (req: Request, res: Response): Promise<void> => {
        try {
          const { doctorId } = req.params;
          const { date, timeSlots } = req.body;

          // Validar que el doctor autenticado está configurando su propia disponibilidad
          const loggedUserId = (req as any).user.userId;
          if (Number(doctorId) !== loggedUserId) {
            res.status(403).json({
              error: "Forbidden: Doctors can only set their own availability",
            });
          }

          // Establecer disponibilidad
          await this.availabilityService.setAvailability({
            doctorId: Number(doctorId),
            date,
            timeSlots,
          });

          // Registrar acción en audit-log
          await this.auditLogService.log(
            loggedUserId,
            "SET_AVAILABILITY",
            `Set availability for doctor ID ${doctorId} on ${date} with time slots ${timeSlots.join(
              ", "
            )}`
          );

          res.status(200).json({ message: "Availability set successfully" });
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );
  }
}
