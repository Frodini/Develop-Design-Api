import { MedicalRecordRepository } from "../../app/medical-record/medical-record.repository";
import { DatabaseService } from "../../database/database.service";
import { MedicalRecord } from "../../app/medical-record/medical-record.model";

describe("MedicalRecordRepository", () => {
  let medicalRecordRepository: MedicalRecordRepository;
  let dbServiceMock: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    dbServiceMock = {
      connect: jest.fn(),
    } as unknown as jest.Mocked<DatabaseService>;

    medicalRecordRepository = new MedicalRecordRepository(dbServiceMock);
  });

  describe("createMedicalRecord", () => {
    it("should create a medical record with test results", async () => {
      const mockDb = {
        run: jest.fn().mockResolvedValue({ lastID: 1 }),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const record: MedicalRecord = {
        patientId: 1,
        doctorId: 2,
        diagnosis: "Test Diagnosis",
        prescriptions: ["Prescription 1"],
        notes: "Test Notes",
        ongoingTreatments: ["Treatment 1"],
        testResults: [
          { type: "Blood Test", result: "Normal" },
          { type: "X-Ray", result: "Clear" },
        ],
      };

      const recordId = await medicalRecordRepository.createMedicalRecord(
        record
      );

      expect(recordId).toBe(1);
      expect(mockDb.run).toHaveBeenCalledTimes(3);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO medical_records"),
        expect.any(Array)
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO record_test_results"),
        [1, "Blood Test", "Normal"]
      );
    });

    it("should create a medical record without test results", async () => {
      const mockDb = {
        run: jest.fn().mockResolvedValue({ lastID: 1 }),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const record: MedicalRecord = {
        patientId: 1,
        doctorId: 2,
        diagnosis: "Test Diagnosis",
        prescriptions: ["Prescription 1"],
        notes: "Test Notes",
        ongoingTreatments: ["Treatment 1"],
        testResults: undefined, // No test results
      };

      const recordId = await medicalRecordRepository.createMedicalRecord(
        record
      );

      expect(recordId).toBe(1);
      expect(mockDb.run).toHaveBeenCalledTimes(1);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO medical_records"),
        expect.any(Array)
      );
    });

    it("should create a medical record with an empty array for test results", async () => {
      const mockDb = {
        run: jest.fn().mockResolvedValue({ lastID: 1 }),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const record: MedicalRecord = {
        patientId: 1,
        doctorId: 2,
        diagnosis: "Test Diagnosis",
        prescriptions: ["Prescription 1"],
        notes: "Test Notes",
        ongoingTreatments: ["Treatment 1"],
        testResults: [], // Empty test results
      };

      const recordId = await medicalRecordRepository.createMedicalRecord(
        record
      );

      expect(recordId).toBe(1);
      expect(mockDb.run).toHaveBeenCalledTimes(1);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO medical_records"),
        expect.any(Array)
      );
    });
  });

  describe("updateMedicalRecord", () => {
    it("should update a medical record with new test results", async () => {
      const mockDb = {
        run: jest.fn().mockResolvedValue(undefined),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const record: Partial<MedicalRecord> = {
        diagnosis: "Updated Diagnosis",
        prescriptions: ["Updated Prescription"],
        notes: "Updated Notes",
        ongoingTreatments: ["Updated Treatment"],
        testResults: [
          { type: "MRI", result: "No Issues" },
          { type: "Blood Test", result: "Slightly Elevated" },
        ],
      };

      await medicalRecordRepository.updateMedicalRecord(1, record);

      expect(mockDb.run).toHaveBeenCalledTimes(4);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE medical_records"),
        expect.any(Array)
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM record_test_results"),
        [1]
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO record_test_results"),
        [1, "MRI", "No Issues"]
      );
    });

    it("should update a medical record without modifying test results", async () => {
      const mockDb = {
        run: jest.fn().mockResolvedValue(undefined),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const record: Partial<MedicalRecord> = {
        diagnosis: "Updated Diagnosis",
        prescriptions: ["Updated Prescription"],
        notes: "Updated Notes",
        ongoingTreatments: ["Updated Treatment"],
        testResults: undefined, // No test results provided
      };

      await medicalRecordRepository.updateMedicalRecord(1, record);

      expect(mockDb.run).toHaveBeenCalledTimes(1);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE medical_records"),
        expect.any(Array)
      );
    });
  });

  describe("getMedicalRecordById", () => {
    it("should return a medical record with test results", async () => {
      const mockDb = {
        get: jest.fn().mockResolvedValue({
          id: 1,
          patientId: 1,
          doctorId: 2,
          diagnosis: "Test Diagnosis",
          prescriptions: JSON.stringify(["Prescription 1"]),
          notes: "Test Notes",
          ongoingTreatments: JSON.stringify(["Treatment 1"]),
        }),
        all: jest.fn().mockResolvedValue([
          { type: "Blood Test", result: "Normal" },
          { type: "X-Ray", result: "Clear" },
        ]),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const result = await medicalRecordRepository.getMedicalRecordById(1);

      expect(result).toEqual({
        id: 1,
        patientId: 1,
        doctorId: 2,
        diagnosis: "Test Diagnosis",
        prescriptions: ["Prescription 1"],
        notes: "Test Notes",
        ongoingTreatments: ["Treatment 1"],
        testResults: [
          { type: "Blood Test", result: "Normal" },
          { type: "X-Ray", result: "Clear" },
        ],
      });
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM medical_records WHERE id = ?"),
        [1]
      );
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT type, result FROM record_test_results WHERE recordId = ?"
        ),
        [1]
      );
    });

    it("should return null when the record does not exist", async () => {
      const mockDb = {
        get: jest.fn().mockResolvedValue(null),
        all: jest.fn(),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const result = await medicalRecordRepository.getMedicalRecordById(999);

      expect(result).toBeNull();
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM medical_records WHERE id = ?"),
        [999]
      );
      expect(mockDb.all).not.toHaveBeenCalled();
    });

    it("should return a medical record without test results if none exist", async () => {
      const mockDb = {
        get: jest.fn().mockResolvedValue({
          id: 1,
          patientId: 1,
          doctorId: 2,
          diagnosis: "Test Diagnosis",
          prescriptions: JSON.stringify(["Prescription 1"]),
          notes: "Test Notes",
          ongoingTreatments: JSON.stringify(["Treatment 1"]),
        }),
        all: jest.fn().mockResolvedValue([]), // No test results
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const result = await medicalRecordRepository.getMedicalRecordById(1);

      expect(result).toEqual({
        id: 1,
        patientId: 1,
        doctorId: 2,
        diagnosis: "Test Diagnosis",
        prescriptions: ["Prescription 1"],
        notes: "Test Notes",
        ongoingTreatments: ["Treatment 1"],
        testResults: [],
      });
      expect(mockDb.get).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM medical_records WHERE id = ?"),
        [1]
      );
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT type, result FROM record_test_results WHERE recordId = ?"
        ),
        [1]
      );
    });
  });
});
