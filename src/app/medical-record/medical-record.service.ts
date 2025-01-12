import { Service } from "typedi";
import { MedicalRecordRepository } from "./medical-record.repository";
import { MedicalRecord } from "./medical-record.model";

@Service()
export class MedicalRecordService {
  constructor(private medicalRecordRepository: MedicalRecordRepository) {}

  async createMedicalRecord(record: MedicalRecord): Promise<number> {
    return this.medicalRecordRepository.createMedicalRecord(record);
  }

  async updateMedicalRecord(
    recordId: number,
    record: Partial<MedicalRecord>
  ): Promise<void> {
    await this.medicalRecordRepository.updateMedicalRecord(recordId, record);
  }

  async getMedicalRecordById(
    recordId: number,
    userId: number,
    userRole: string
  ): Promise<MedicalRecord | null> {
    const record = await this.medicalRecordRepository.getMedicalRecordById(
      recordId
    );

    if (!record) return null;

    if (userRole === "Patient" && record.patientId !== userId) {
      throw new Error("Forbidden: Unauthorized access to this record");
    }

    return record;
  }
}
