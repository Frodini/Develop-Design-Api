import { Service } from "typedi";
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";
import path from "path";

@Service() // Este decorador es crucial para que `typedi` registre el servicio
export class DatabaseService {
  private db: Database | null = null;

  async connect(): Promise<Database> {
    if (this.db) return this.db;

    this.db = await open({
      filename: path.resolve(__dirname, "../data/database.db"),
      driver: sqlite3.Database,
    });

    await this.db.exec("PRAGMA foreign_keys = ON");
    return this.db;
  }

  async initializeDatabase(): Promise<void> {
    const db = await this.connect();

    const tableCreationScripts = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('Patient', 'Doctor', 'Admin'))
        );

        CREATE TABLE IF NOT EXISTS specialties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS doctor_specialties (
            doctorId INTEGER NOT NULL,
            specialtyId INTEGER NOT NULL,
            PRIMARY KEY (doctorId, specialtyId),
            FOREIGN KEY (doctorId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (specialtyId) REFERENCES specialties(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER NOT NULL,
            doctorId INTEGER NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            reason TEXT,
            status TEXT DEFAULT 'Scheduled',
            FOREIGN KEY (patientId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (doctorId) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS medical_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER NOT NULL,
            doctorId INTEGER NOT NULL,
            diagnosis TEXT,
            notes TEXT,
            FOREIGN KEY (patientId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (doctorId) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS record_test_results (
            recordId INTEGER NOT NULL,
            type TEXT NOT NULL,
            result TEXT NOT NULL,
            FOREIGN KEY (recordId) REFERENCES medical_records(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS availability (
            doctorId INTEGER NOT NULL,
            date TEXT NOT NULL,
            timeSlots TEXT NOT NULL,
            PRIMARY KEY (doctorId, date),
            FOREIGN KEY (doctorId) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            action TEXT NOT NULL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            details TEXT,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
        `;

    await db.exec(tableCreationScripts);
  }
}
