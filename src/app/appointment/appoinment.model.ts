export interface Appointment {
  id?: number;
  patientId: number;
  doctorId: number;
  date: string;
  time: string;
  reason?: string;
  status?: "Scheduled" | "Cancelled" | "Rescheduled";
}
