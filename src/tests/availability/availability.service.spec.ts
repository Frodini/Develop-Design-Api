import { AvailabilityService } from "../../app/availability/availability.service";
import { AvailabilityRepository } from "../../app/availability/availability.repository";
import { Availability } from "../../app/availability/availability.model";
import { DatabaseService } from "../../database/database.service";

jest.mock("../../app/availability/availability.repository");

describe("AvailabilityService", () => {
  let availabilityService: AvailabilityService;
  let availabilityRepository: jest.Mocked<AvailabilityRepository>;

  beforeEach(() => {
    const dbServiceMock = {} as jest.Mocked<DatabaseService>;
    availabilityRepository = new AvailabilityRepository(
      dbServiceMock
    ) as jest.Mocked<AvailabilityRepository>;
    availabilityService = new AvailabilityService(availabilityRepository);
  });

  describe("setAvailability", () => {
    it("should call availabilityRepository.setAvailability with correct arguments", async () => {
      const mockAvailability: Availability = {
        doctorId: 1,
        date: "2023-01-01",
        timeSlots: ["09:00-10:00", "10:00-11:00"],
      };

      await availabilityService.setAvailability(mockAvailability);

      expect(availabilityRepository.setAvailability).toHaveBeenCalledWith(
        mockAvailability
      );
    });
  });

  describe("getAvailability", () => {
    it("should call availabilityRepository.getAvailability and return availability", async () => {
      const mockAvailability: Availability = {
        doctorId: 1,
        date: "2023-01-01",
        timeSlots: ["09:00-10:00", "10:00-11:00"],
      };
      availabilityRepository.getAvailability.mockResolvedValue(
        mockAvailability
      );

      const result = await availabilityService.getAvailability(1, "2023-01-01");

      expect(result).toEqual(mockAvailability);
      expect(availabilityRepository.getAvailability).toHaveBeenCalledWith(
        1,
        "2023-01-01"
      );
    });

    it("should return null if no availability is found", async () => {
      availabilityRepository.getAvailability.mockResolvedValue(null);

      const result = await availabilityService.getAvailability(1, "2023-01-01");

      expect(result).toBeNull();
      expect(availabilityRepository.getAvailability).toHaveBeenCalledWith(
        1,
        "2023-01-01"
      );
    });
  });
});
