import { Router, Request, Response } from "express";
import { Service } from "typedi";
import { SpecialtyService } from "./specialty.service";
import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

@Service()
export class SpecialtyController {
  public router: Router;

  constructor(private specialtyService: SpecialtyService) {
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
          res.status(200).json(specialties);
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      }
    );

    // Asociar especialidades a un doctor
    this.router.post(
      "/doctors/:doctorId/specialties",
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
      async (req: Request, res: Response) => {
        try {
          const { specialtyId } = req.params;
          const doctors = await this.specialtyService.getDoctorsBySpecialty(
            Number(specialtyId)
          );
          res.status(200).json(doctors);
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      }
    );
  }
}
