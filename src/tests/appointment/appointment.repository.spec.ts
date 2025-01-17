import { AppointmentRepository } from "../../app/appointment/appointment.repository";
import { DatabaseService } from "../../database/database.service";
import { Appointment } from "../../app/appointment/appoinment.model";

jest.mock("../../database/database.service");

describe("AppointmentRepository", () => {
  let appointmentRepository: AppointmentRepository;
  let dbServiceMock: jest.Mocked<DatabaseService>;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
    };
    dbServiceMock = new DatabaseService() as jest.Mocked<DatabaseService>;
    dbServiceMock.connect.mockResolvedValue(mockDb);

    appointmentRepository = new AppointmentRepository(dbServiceMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createAppointment", () => {
    it("should insert an appointment and return its ID", async () => {
      mockDb.run.mockResolvedValue({ lastID: 1 });

      const appointment: Appointment = {
        patientId: 2,
        doctorId: 3,
        date: "2023-10-10",
        time: "10:00",
        reason: "Consultation",
        status: "Scheduled",
      };

      const result = await appointmentRepository.createAppointment(appointment);

      expect(result).toBe(1);
      expect(mockDb.run).toHaveBeenCalledWith(
        `INSERT INTO appointments (patientId, doctorId, date, time, reason, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [2, 3, "2023-10-10", "10:00", "Consultation", "Scheduled"]
      );
    });
  });

  describe("getAppointmentById", () => {
    it("should return the appointment if found", async () => {
      const mockRow = {
        id: 1,
        patientId: 2,
        doctorId: 3,
        date: "2023-10-10",
        time: "10:00",
        reason: "Consultation",
        status: "Scheduled",
      };
      mockDb.get.mockResolvedValue(mockRow);

      const result = await appointmentRepository.getAppointmentById(1);

      expect(result).toEqual(mockRow);
      expect(mockDb.get).toHaveBeenCalledWith(
        `SELECT * FROM appointments WHERE id = ?`,
        [1]
      );
    });

    it("should return null if no appointment is found", async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await appointmentRepository.getAppointmentById(999);

      expect(result).toBeNull();
      expect(mockDb.get).toHaveBeenCalledWith(
        `SELECT * FROM appointments WHERE id = ?`,
        [999]
      );
    });
  });

  describe("updateAppointmentStatus", () => {
    it("should update the status of an appointment", async () => {
      mockDb.run.mockResolvedValue(undefined);

      await appointmentRepository.updateAppointmentStatus(1, "Cancelled");

      expect(mockDb.run).toHaveBeenCalledWith(
        `UPDATE appointments SET status = ? WHERE id = ?`,
        ["Cancelled", 1]
      );
    });
  });

  describe("getDoctorSchedule", () => {
    it("should return the doctor's schedule", async () => {
      const mockSchedule = [
        { id: 1, patientId: 2, date: "2023-10-10", time: "10:00" },
      ];
      mockDb.all.mockResolvedValue(mockSchedule);

      const result = await appointmentRepository.getDoctorSchedule(3);

      expect(result).toEqual(mockSchedule);
      expect(mockDb.all).toHaveBeenCalledWith(
        `SELECT * FROM appointments WHERE doctorId = ? AND status = 'Scheduled' ORDER BY date, time`,
        [3]
      );
    });
  });
});
