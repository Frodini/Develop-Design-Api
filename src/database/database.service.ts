import { Service } from "typedi";
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";
import path from "path";

@Service()
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
            name TEXT NOT NULL UNIQUE
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
            diagnosis TEXT,
            prescriptions TEXT, -- Lista de recetas en formato JSON
            notes TEXT,
            testResults TEXT, -- Lista de resultados de pruebas en formato JSON
            ongoingTreatments TEXT, -- Lista de tratamientos en formato JSON
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

        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipientId INTEGER NOT NULL, -- Usuario que recibe la notificación
            message TEXT NOT NULL, -- Contenido de la notificación
            read BOOLEAN DEFAULT FALSE, -- Estado de lectura
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora de creación
            FOREIGN KEY (recipientId) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            action TEXT NOT NULL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            details TEXT,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT, -- Identificador único para cada departamento
            name TEXT NOT NULL UNIQUE             -- Nombre del departamento, único y obligatorio
        );
        `;

    await db.exec(tableCreationScripts);

    const defaultValuesScripts = `
        INSERT INTO specialties (name)
        SELECT 'Cardiology' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Cardiology');
        INSERT INTO specialties (name)
        SELECT 'Dermatology' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Dermatology');
        INSERT INTO specialties (name)
        SELECT 'Neurology' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Neurology');
        INSERT INTO specialties (name)
        SELECT 'Pediatrics' WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE name = 'Pediatrics');

        INSERT INTO departments (name)
        SELECT 'Emergency' WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Emergency');
        INSERT INTO departments (name)
        SELECT 'Surgery' WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Surgery');
        INSERT INTO departments (name)
        SELECT 'Radiology' WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Radiology');
        INSERT INTO departments (name)
        SELECT 'Pediatrics' WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Pediatrics');
    `;

    await db.exec(defaultValuesScripts);
  }
}
