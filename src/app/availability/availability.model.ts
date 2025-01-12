export interface Availability {
  doctorId: number;
  date: string; // Formato: YYYY-MM-DD
  timeSlots: string[]; // Ejemplo: ["09:00", "10:00", "11:00"]
}
