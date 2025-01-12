import { Router, Request, Response } from "express";
import { Service } from "typedi";
import { authenticateToken } from "../middleware/auth.middleware";
import { AppointmentService } from "./appoinment.service";

@Service()
export class AppointmentController {
  public router: Router;

  constructor(private appointmentService: AppointmentService) {
    this.router = Router();
    this.routes();
  }

  private routes() {
    this.router.post(
      "/",
      authenticateToken,
      async (req: Request, res: Response) => {
        try {
          const appointmentId = await this.appointmentService.createAppointment(
            req.body
          );
          res.status(201).json({
            appointmentId,
            message: "Appointment created successfully",
          });
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );

    this.router.delete(
      "/:appointmentId",
      authenticateToken,
      async (req: Request, res: Response) => {
        try {
          await this.appointmentService.cancelAppointment(
            Number(req.params.appointmentId)
          );
          res
            .status(200)
            .json({ message: "Appointment cancelled successfully" });
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );

    this.router.put(
      "/:appointmentId",
      authenticateToken,
      async (req: Request, res: Response) => {
        try {
          const { newDate, newTime } = req.body;
          await this.appointmentService.rescheduleAppointment(
            Number(req.params.appointmentId),
            newDate,
            newTime
          );
          res
            .status(200)
            .json({ message: "Appointment rescheduled successfully" });
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );

    this.router.get(
      "/doctors/:doctorId/schedule",
      authenticateToken,
      async (req: Request, res: Response) => {
        try {
          const schedule = await this.appointmentService.getDoctorSchedule(
            Number(req.params.doctorId)
          );
          res.status(200).json(schedule);
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );
  }
}
