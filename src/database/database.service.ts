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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patientId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (doctorId) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS medical_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientId INTEGER NOT NULL,
            doctorId INTEGER NOT NULL,
            diagnosis TEXT NOT NULL,
            prescriptions TEXT, -- JSON con una lista de recetas
            notes TEXT,
            ongoingTreatments TEXT, -- JSON con una lista de tratamientos
            FOREIGN KEY (patientId) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (doctorId) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS record_test_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recordId INTEGER NOT NULL,
            type TEXT NOT NULL, -- Tipo de prueba (ej: "Blood Test")
            result TEXT NOT NULL, -- Resultado de la prueba
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

    try {
      // Insertar especialidades
      await db.exec(`
                INSERT INTO specialties (name) VALUES
                ('Cardiology'),
                ('Dermatology'),
                ('Pediatrics'),
                ('Neurology');
            `);

      // Insertar departamentos
      await db.exec(`
                INSERT INTO departments (name) VALUES
                ('Emergency'),
                ('Outpatient'),
                ('Inpatient'),
                ('Surgery');
            `);

      // Asociar doctores con especialidades
      await db.exec(`
                INSERT INTO doctor_specialties (doctorId, specialtyId) VALUES
                (2, 1), -- Jane Smith: Cardiology
                (2, 3), -- Jane Smith: Pediatrics
                (4, 2); -- Robert Brown: Dermatology
            `);

      // Establecer disponibilidad de doctores
      await db.exec(`
                INSERT INTO availability (doctorId, date, timeSlots) VALUES
                (2, '2025-01-15', '["09:00", "10:00", "11:00"]'),
                (4, '2025-01-16', '["14:00", "15:00", "16:00"]');
            `);

      // Insertar citas
      await db.exec(`
                INSERT INTO appointments (patientId, doctorId, date, time, reason, status) VALUES
                (1, 2, '2025-01-15', '09:00', 'Consulta general', 'Scheduled'),
                (1, 2, '2025-01-15', '10:00', 'Consulta de seguimiento', 'Scheduled'),
                (1, 4, '2025-01-16', '14:00', 'Consulta dermatológica', 'Scheduled');
            `);

      // Insertar registros en audit_log
      await db.exec(`
                INSERT INTO audit_log (userId, action, details) VALUES
                (1, 'CREATE_APPOINTMENT', 'Created appointment with ID 1'),
                (1, 'CREATE_APPOINTMENT', 'Created appointment with ID 2'),
                (2, 'SET_AVAILABILITY', 'Set availability for doctor ID 2 on 2025-01-15'),
                (4, 'SET_AVAILABILITY', 'Set availability for doctor ID 4 on 2025-01-16'),
                (1, 'LIST_SPECIALTIES', 'Listed all specialties'),
                (1, 'FILTER_DOCTORS_BY_SPECIALTY', 'Filtered doctors by specialty ID 1');
            `);
    } catch (error: any) {}
    await db.exec(tableCreationScripts);
  }
}
