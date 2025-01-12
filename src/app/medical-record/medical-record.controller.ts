import { Router, Request, Response } from "express";
import { Service } from "typedi";
import { MedicalRecordService } from "./medical-record.service";
import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

@Service()
export class MedicalRecordController {
  public router: Router;

  constructor(private medicalRecordService: MedicalRecordService) {
    this.router = Router();
    this.routes();
  }

  private routes() {
    this.router.post(
      "/",
      authenticateToken,
      authorizeRoles(["Doctor"]),
      async (req: Request, res: Response) => {
        try {
          const recordId = await this.medicalRecordService.createMedicalRecord(
            req.body
          );
          res
            .status(201)
            .json({ recordId, message: "Medical record created successfully" });
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );

    this.router.put(
      "/:recordId",
      authenticateToken,
      authorizeRoles(["Doctor"]),
      async (req: Request, res: Response) => {
        try {
          const { recordId } = req.params;
          await this.medicalRecordService.updateMedicalRecord(
            Number(recordId),
            req.body
          );
          res.status(200).json({
            recordId: Number(recordId),
            message: "Medical record updated successfully",
          });
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );

    this.router.get(
      "/:recordId",
      authenticateToken,
      async (req: Request, res: Response): Promise<void> => {
        try {
          const { recordId } = req.params;
          const userId = (req as any).user.userId;
          const userRole = (req as any).user.role;

          const record = await this.medicalRecordService.getMedicalRecordById(
            Number(recordId),
            userId,
            userRole
          );

          if (!record) {
            res.status(404).json({ error: "Medical record not found" });
          }

          res.status(200).json(record);
        } catch (error: any) {
          res.status(403).json({ error: error.message });
        }
      }
    );
  }
}
