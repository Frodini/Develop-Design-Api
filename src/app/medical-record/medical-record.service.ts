import { Service } from "typedi";
import { MedicalRecordRepository } from "./medical-record.repository";
import { MedicalRecord } from "./medical-record.model";
import { NotificationService } from "../notification/notification.service";

@Service()
export class MedicalRecordService {
  constructor(
    private medicalRecordRepository: MedicalRecordRepository,
    private notificationService: NotificationService
  ) {}

  async createMedicalRecord(record: MedicalRecord): Promise<number> {
    const recordId = await this.medicalRecordRepository.createMedicalRecord(
      record
    );

    await this.notificationService.createNotification({
      recipientId: record.patientId,
      message: `A new medical record has been created for you by doctor ID ${record.doctorId}.`,
    });

    return recordId;
  }

  async updateMedicalRecord(
    recordId: number,
    record: Partial<MedicalRecord>
  ): Promise<void> {
    const existingRecord =
      await this.medicalRecordRepository.getMedicalRecordById(recordId);

    if (!existingRecord) {
      throw new Error("Medical record not found");
    }

    await this.medicalRecordRepository.updateMedicalRecord(recordId, record);

    await this.notificationService.createNotification({
      recipientId: existingRecord.patientId,
      message: `Your medical record (ID ${recordId}) has been updated by doctor ID ${existingRecord.doctorId}.`,
    });
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
