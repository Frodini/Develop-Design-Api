import { SpecialtyRepository } from "../../app/specialty/specialty.repository";
import { DatabaseService } from "../../database/database.service";

jest.mock("../../database/database.service");

describe("SpecialtyRepository", () => {
  let specialtyRepository: SpecialtyRepository;
  let dbServiceMock: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    dbServiceMock = {
      connect: jest.fn(),
    } as unknown as jest.Mocked<DatabaseService>;

    specialtyRepository = new SpecialtyRepository(dbServiceMock);
  });

  describe("getAllSpecialties", () => {
    it("should return all specialties", async () => {
      const mockDb = {
        all: jest.fn().mockResolvedValue([
          { id: 1, name: "Cardiology" },
          { id: 2, name: "Neurology" },
        ]),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const result = await specialtyRepository.getAllSpecialties();

      expect(result).toEqual([
        { id: 1, name: "Cardiology" },
        { id: 2, name: "Neurology" },
      ]);
      expect(mockDb.all).toHaveBeenCalledWith(`SELECT * FROM specialties`);
    });
  });

  describe("associateDoctorSpecialties", () => {
    it("should associate a doctor with specialties", async () => {
      const mockDb = {
        run: jest.fn().mockResolvedValue(undefined),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const doctorId = 1;
      const specialtyIds = [1, 2];

      await specialtyRepository.associateDoctorSpecialties(
        doctorId,
        specialtyIds
      );

      expect(mockDb.run).toHaveBeenCalledTimes(specialtyIds.length);
      specialtyIds.forEach((specialtyId) => {
        expect(mockDb.run).toHaveBeenCalledWith(
          `INSERT INTO doctor_specialties (doctorId, specialtyId) VALUES (?, ?)`,
          [doctorId, specialtyId]
        );
      });
    });
  });

  describe("getDoctorsBySpecialty", () => {
    it("should return doctors associated with a specialty", async () => {
      const mockDb = {
        all: jest.fn().mockResolvedValue([
          { doctorId: 1, doctorName: "Dr. Smith" },
          { doctorId: 2, doctorName: "Dr. Jones" },
        ]),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const specialtyId = 1;
      const result = await specialtyRepository.getDoctorsBySpecialty(
        specialtyId
      );

      expect(result).toEqual([
        { doctorId: 1, doctorName: "Dr. Smith" },
        { doctorId: 2, doctorName: "Dr. Jones" },
      ]);

      // Normalize and compare SQL query strings
      const expectedQuery = `
        SELECT users.id AS doctorId, users.name AS doctorName 
        FROM doctor_specialties 
        JOIN users ON doctor_specialties.doctorId = users.id 
        WHERE doctor_specialties.specialtyId = ? AND users.role = 'Doctor'
      `
        .replace(/\s+/g, " ")
        .trim();

      const actualQuery = mockDb.all.mock.calls[0][0]
        .replace(/\s+/g, " ")
        .trim();

      // Compare normalized queries
      expect(actualQuery).toBe(expectedQuery);

      // Ensure the parameters are correct
      const actualParams = mockDb.all.mock.calls[0][1];
      expect(actualParams).toEqual([specialtyId]);
    });
  });
});
