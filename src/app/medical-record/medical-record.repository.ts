import { Service } from "typedi";
import { DatabaseService } from "../../database/database.service";
import { MedicalRecord, TestResult } from "./medical-record.model";

@Service()
export class MedicalRecordRepository {
  constructor(private dbService: DatabaseService) {}

  async createMedicalRecord(record: MedicalRecord): Promise<number> {
    const db = await this.dbService.connect();
    const result = await db.run(
      `INSERT INTO medical_records (patientId, doctorId, diagnosis, prescriptions, notes, ongoingTreatments)
            VALUES (?, ?, ?, ?, ?, ?)`,
      [
        record.patientId,
        record.doctorId,
        record.diagnosis,
        JSON.stringify(record.prescriptions || []),
        record.notes || null,
        JSON.stringify(record.ongoingTreatments || []),
      ]
    );

    if (record.testResults) {
      const recordId = result.lastID!;
      for (const test of record.testResults) {
        await db.run(
          `INSERT INTO record_test_results (recordId, type, result) VALUES (?, ?, ?)`,
          [recordId, test.type, test.result]
        );
      }
    }

    return result.lastID!;
  }

  async updateMedicalRecord(
    recordId: number,
    record: Partial<MedicalRecord>
  ): Promise<void> {
    const db = await this.dbService.connect();
    await db.run(
      `UPDATE medical_records
            SET diagnosis = ?, prescriptions = ?, notes = ?, ongoingTreatments = ?
            WHERE id = ?`,
      [
        record.diagnosis,
        JSON.stringify(record.prescriptions || []),
        record.notes || null,
        JSON.stringify(record.ongoingTreatments || []),
        recordId,
      ]
    );

    if (record.testResults) {
      await db.run(`DELETE FROM record_test_results WHERE recordId = ?`, [
        recordId,
      ]);
      for (const test of record.testResults) {
        await db.run(
          `INSERT INTO record_test_results (recordId, type, result) VALUES (?, ?, ?)`,
          [recordId, test.type, test.result]
        );
      }
    }
  }

  async getMedicalRecordById(recordId: number): Promise<MedicalRecord | null> {
    const db = await this.dbService.connect();
    const record = await db.get(`SELECT * FROM medical_records WHERE id = ?`, [
      recordId,
    ]);
    if (!record) return null;

    const testResults = await db.all(
      `SELECT type, result FROM record_test_results WHERE recordId = ?`,
      [recordId]
    );

    return {
      ...record,
      prescriptions: JSON.parse(record.prescriptions || "[]"),
      ongoingTreatments: JSON.parse(record.ongoingTreatments || "[]"),
      testResults,
    };
  }
}
