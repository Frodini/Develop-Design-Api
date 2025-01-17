import { MedicalRecordService } from "../../app/medical-record/medical-record.service";
import { MedicalRecordRepository } from "../../app/medical-record/medical-record.repository";
import { NotificationService } from "../../app/notification/notification.service";
import { MedicalRecord } from "../../app/medical-record/medical-record.model";
import { Container } from "typedi";

describe("MedicalRecordService", () => {
  let medicalRecordService: MedicalRecordService;
  let medicalRecordRepository: jest.Mocked<MedicalRecordRepository>;
  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    medicalRecordRepository = {
      createMedicalRecord: jest.fn(),
      updateMedicalRecord: jest.fn(),
      getMedicalRecordById: jest.fn(),
    } as unknown as jest.Mocked<MedicalRecordRepository>;

    notificationService = {
      createNotification: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    Container.set(MedicalRecordRepository, medicalRecordRepository);
    Container.set(NotificationService, notificationService);

    medicalRecordService = new MedicalRecordService(
      medicalRecordRepository,
      notificationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createMedicalRecord", () => {
    it("should create a medical record and send a notification", async () => {
      const record: MedicalRecord = {
        id: 1,
        patientId: 1,
        doctorId: 2,
        diagnosis: "Diagnosis",
        ongoingTreatments: ["Treatment"],
      };

      medicalRecordRepository.createMedicalRecord.mockResolvedValue(1);

      const recordId = await medicalRecordService.createMedicalRecord(record);

      expect(recordId).toBe(1);
      expect(medicalRecordRepository.createMedicalRecord).toHaveBeenCalledWith(
        record
      );
      expect(notificationService.createNotification).toHaveBeenCalledWith({
        recipientId: 1,
        message: `A new medical record has been created for you by doctor ID 2.`,
      });
    });
  });

  describe("updateMedicalRecord", () => {
    it("should update a medical record and send a notification", async () => {
      const recordId = 1;
      const existingRecord: MedicalRecord = {
        id: 1,
        patientId: 1,
        doctorId: 2,
        diagnosis: "Old Diagnosis",
        ongoingTreatments: ["Old Treatment"],
      };

      medicalRecordRepository.getMedicalRecordById.mockResolvedValue(
        existingRecord
      );

      await medicalRecordService.updateMedicalRecord(recordId, {
        diagnosis: "New Diagnosis",
      });

      expect(medicalRecordRepository.updateMedicalRecord).toHaveBeenCalledWith(
        recordId,
        { diagnosis: "New Diagnosis" }
      );
      expect(notificationService.createNotification).toHaveBeenCalledWith({
        recipientId: 1,
        message: `Your medical record (ID 1) has been updated by doctor ID 2.`,
      });
    });

    it("should throw an error if the medical record is not found", async () => {
      medicalRecordRepository.getMedicalRecordById.mockResolvedValue(null);

      await expect(
        medicalRecordService.updateMedicalRecord(1, { diagnosis: "Updated" })
      ).rejects.toThrow("Medical record not found");
    });
  });

  describe("getMedicalRecordById", () => {
    it("should return the medical record for a valid doctor or patient", async () => {
      const record: MedicalRecord = {
        id: 1,
        patientId: 1,
        doctorId: 2,
        diagnosis: "Diagnosis",
        ongoingTreatments: ["Treatment"],
      };

      medicalRecordRepository.getMedicalRecordById.mockResolvedValue(record);

      const result = await medicalRecordService.getMedicalRecordById(
        1,
        1,
        "Patient"
      );

      expect(result).toEqual(record);
    });

    it("should throw an error if a patient tries to access another patient's record", async () => {
      const record: MedicalRecord = {
        id: 1,
        patientId: 1,
        doctorId: 2,
        diagnosis: "Diagnosis",
        ongoingTreatments: ["Treatment"],
      };

      medicalRecordRepository.getMedicalRecordById.mockResolvedValue(record);

      await expect(
        medicalRecordService.getMedicalRecordById(1, 2, "Patient")
      ).rejects.toThrow("Forbidden: Unauthorized access to this record");
    });

    it("should return null if the record does not exist", async () => {
      medicalRecordRepository.getMedicalRecordById.mockResolvedValue(null);

      const result = await medicalRecordService.getMedicalRecordById(
        1,
        1,
        "Patient"
      );

      expect(result).toBeNull();
    });
  });
});
