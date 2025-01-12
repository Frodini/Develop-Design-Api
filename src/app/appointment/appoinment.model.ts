export interface Appointment {
  id?: number;
  patientId: number;
  doctorId: number;
  date: string; // Formato: YYYY-MM-DD
  time: string; // Formato: HH:mm
  reason?: string;
  status?: "Scheduled" | "Cancelled" | "Rescheduled";
}
