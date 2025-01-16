import { AvailabilityRepository } from "../../app/availability/availability.repository";
import { DatabaseService } from "../../database/database.service";
import { Availability } from "../../app/availability/availability.model";

jest.mock("../../database/database.service");

describe("AvailabilityRepository", () => {
  let availabilityRepository: AvailabilityRepository;
  let dbServiceMock: jest.Mocked<DatabaseService>;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
    };
    dbServiceMock = {
      connect: jest.fn().mockResolvedValue(mockDb),
    } as unknown as jest.Mocked<DatabaseService>;

    availabilityRepository = new AvailabilityRepository(dbServiceMock);
  });

  describe("setAvailability", () => {
    it("should insert or replace availability in the database", async () => {
      const mockAvailability: Availability = {
        doctorId: 1,
        date: "2023-01-01",
        timeSlots: ["09:00-10:00", "10:00-11:00"],
      };

      await availabilityRepository.setAvailability(mockAvailability);

      expect(dbServiceMock.connect).toHaveBeenCalled();
      expect(mockDb.run).toHaveBeenCalledWith(
        `INSERT OR REPLACE INTO availability (doctorId, date, timeSlots) VALUES (?, ?, ?)`,
        [
          mockAvailability.doctorId,
          mockAvailability.date,
          JSON.stringify(mockAvailability.timeSlots),
        ]
      );
    });
  });

  describe("getAvailability", () => {
    it("should return availability if it exists in the database", async () => {
      const mockRow = {
        doctorId: 1,
        date: "2023-01-01",
        timeSlots: JSON.stringify(["09:00-10:00", "10:00-11:00"]),
      };
      mockDb.get.mockResolvedValue(mockRow);

      const result = await availabilityRepository.getAvailability(
        1,
        "2023-01-01"
      );

      expect(dbServiceMock.connect).toHaveBeenCalled();
      expect(mockDb.get).toHaveBeenCalledWith(
        `SELECT * FROM availability WHERE doctorId = ? AND date = ?`,
        [1, "2023-01-01"]
      );
      expect(result).toEqual({
        doctorId: 1,
        date: "2023-01-01",
        timeSlots: ["09:00-10:00", "10:00-11:00"],
      });
    });

    it("should return null if availability does not exist in the database", async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await availabilityRepository.getAvailability(
        1,
        "2023-01-01"
      );

      expect(dbServiceMock.connect).toHaveBeenCalled();
      expect(mockDb.get).toHaveBeenCalledWith(
        `SELECT * FROM availability WHERE doctorId = ? AND date = ?`,
        [1, "2023-01-01"]
      );
      expect(result).toBeNull();
    });
  });
});
