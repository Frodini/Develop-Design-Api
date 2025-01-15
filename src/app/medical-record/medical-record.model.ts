export interface MedicalRecord {
  id?: number;
  patientId: number;
  doctorId: number;
  diagnosis: string;
  prescriptions?: string[];
  notes?: string;
  ongoingTreatments?: string[];
  testResults?: TestResult[];
}

export interface TestResult {
  type: string;
  result: string;
}
