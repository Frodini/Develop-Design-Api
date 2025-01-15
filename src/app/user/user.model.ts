export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: "Patient" | "Doctor" | "Admin";
  specialties?: number[]; // IDs de especialidades (opcional para doctores)
}
