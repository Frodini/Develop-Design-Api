import { Router, Request, Response } from "express";
import { Service } from "typedi";
import { AuditLogService } from "../audit-log/audit-log.service";
import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { AppointmentService } from "./appoinment.service";

@Service()
export class AppointmentController {
  public router: Router;

  constructor(
    private appointmentService: AppointmentService,
    private auditLogService: AuditLogService
  ) {
    this.router = Router();
    this.routes();
  }

  private routes() {
    // Crear cita (solo pacientes)
    this.router.post(
      "/",
      authenticateToken,
      authorizeRoles(["Patient"]),
      async (req: Request, res: Response): Promise<void> => {
        try {
          const loggedUserId = (req as any).user.userId;

          // Asegurarse de que el paciente autenticado está creando su propia cita
          if (req.body.patientId !== loggedUserId) {
            res.status(403).json({
              error:
                "Forbidden: Patients can only create their own appointments",
            });
            return;
          }

          const appointmentId = await this.appointmentService.createAppointment(
            req.body
          );

          // Registrar acción en audit-log
          await this.auditLogService.log(
            loggedUserId,
            "CREATE_APPOINTMENT",
            `Created appointment with ID ${appointmentId}`
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

    // Cancelar cita (solo pacientes)
    this.router.delete(
      "/:appointmentId",
      authenticateToken,
      authorizeRoles(["Patient"]),
      async (req: Request, res: Response): Promise<void> => {
        try {
          const { appointmentId } = req.params;
          const loggedUserId = (req as any).user.userId;

          // Verificar si el paciente autenticado es el propietario de la cita
          const appointment = await this.appointmentService.getAppointmentById(
            Number(appointmentId)
          );
          if (!appointment || appointment.patientId !== loggedUserId) {
            res.status(403).json({
              error:
                "Forbidden: Patients can only cancel their own appointments",
            });
            return;
          }

          await this.appointmentService.cancelAppointment(
            Number(appointmentId)
          );

          // Registrar acción en audit-log
          await this.auditLogService.log(
            loggedUserId,
            "CANCEL_APPOINTMENT",
            `Cancelled appointment with ID ${appointmentId}`
          );

          res
            .status(200)
            .json({ message: "Appointment cancelled successfully" });
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );

    // Reprogramar cita (solo pacientes)
    this.router.put(
      "/:appointmentId",
      authenticateToken,
      authorizeRoles(["Patient"]),
      async (req: Request, res: Response): Promise<void> => {
        try {
          const { appointmentId } = req.params;
          const { newDate, newTime } = req.body;
          const loggedUserId = (req as any).user.userId;

          // Verificar si el paciente autenticado es el propietario de la cita
          const appointment = await this.appointmentService.getAppointmentById(
            Number(appointmentId)
          );
          if (!appointment || appointment.patientId !== loggedUserId) {
            res.status(403).json({
              error:
                "Forbidden: Patients can only reschedule their own appointments",
            });
            return;
          }

          await this.appointmentService.rescheduleAppointment(
            Number(appointmentId),
            newDate,
            newTime
          );

          // Registrar acción en audit-log
          await this.auditLogService.log(
            loggedUserId,
            "RESCHEDULE_APPOINTMENT",
            `Rescheduled appointment with ID ${appointmentId} to ${newDate} at ${newTime}`
          );

          res
            .status(200)
            .json({ message: "Appointment rescheduled successfully" });
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );

    // Consultar agenda del doctor (solo doctores y administradores)
    this.router.get(
      "/doctors/:doctorId/schedule",
      authenticateToken,
      authorizeRoles(["Doctor", "Admin"]),
      async (req: Request, res: Response): Promise<void> => {
        try {
          const { doctorId } = req.params;
          const loggedUserId = (req as any).user.userId;

          // Verificar si el doctor autenticado está consultando su propia agenda (excepto Admin)
          if (
            (req as any).user.role === "Doctor" &&
            Number(doctorId) !== loggedUserId
          ) {
            res.status(403).json({
              error: "Forbidden: Doctors can only access their own schedule",
            });
            return;
          }

          const schedule = await this.appointmentService.getDoctorSchedule(
            Number(doctorId)
          );

          // Registrar acción en audit-log
          await this.auditLogService.log(
            loggedUserId,
            "GET_DOCTOR_SCHEDULE",
            `Fetched schedule for doctor with ID ${doctorId}`
          );

          res.status(200).json(schedule);
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );
  }
}
