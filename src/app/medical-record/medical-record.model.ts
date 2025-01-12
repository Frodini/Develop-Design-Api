export interface MedicalRecord {
  id?: number;
  patientId: number;
  doctorId: number;
  diagnosis: string;
  prescriptions?: string[]; // Lista de recetas
  notes?: string;
  ongoingTreatments?: string[]; // Lista de tratamientos
  testResults?: TestResult[]; // Resultados de pruebas médicas
}

export interface TestResult {
  type: string;
  result: string;
}
