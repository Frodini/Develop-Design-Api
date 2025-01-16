import { SpecialtyRepository } from "../../app/specialty/specialty.repository";
import { SpecialtyService } from "../../app/specialty/specialty.service";
import { DatabaseService } from "../../database/database.service";

jest.mock("../../app/specialty/specialty.repository");

describe("SpecialtyService", () => {
  let specialtyService: SpecialtyService;
  let specialtyRepository: jest.Mocked<SpecialtyRepository>;
  let dbServiceMock: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    dbServiceMock = {} as jest.Mocked<DatabaseService>; // Mock the DatabaseService
    specialtyRepository = new SpecialtyRepository(
      dbServiceMock
    ) as jest.Mocked<SpecialtyRepository>;
    specialtyService = new SpecialtyService(specialtyRepository);
  });

  describe("getAllSpecialties", () => {
    it("should return all specialties", async () => {
      const mockSpecialties = [
        { id: 1, name: "Cardiology" },
        { id: 2, name: "Neurology" },
      ];
      specialtyRepository.getAllSpecialties.mockResolvedValue(mockSpecialties);

      const result = await specialtyService.getAllSpecialties();

      expect(result).toEqual(mockSpecialties);
      expect(specialtyRepository.getAllSpecialties).toHaveBeenCalledTimes(1);
    });
  });

  describe("associateDoctorSpecialties", () => {
    it("should associate a doctor with specialties", async () => {
      const doctorId = 1;
      const specialtyIds = [1, 2];

      specialtyRepository.associateDoctorSpecialties.mockResolvedValue();

      await specialtyService.associateDoctorSpecialties(doctorId, specialtyIds);

      expect(
        specialtyRepository.associateDoctorSpecialties
      ).toHaveBeenCalledWith(doctorId, specialtyIds);
    });
  });

  describe("getDoctorsBySpecialty", () => {
    it("should return doctors by specialty", async () => {
      const specialtyId = 1;
      const mockDoctors = [
        { id: 1, name: "Dr. Smith" },
        { id: 2, name: "Dr. Brown" },
      ];
      specialtyRepository.getDoctorsBySpecialty.mockResolvedValue(mockDoctors);

      const result = await specialtyService.getDoctorsBySpecialty(specialtyId);

      expect(result).toEqual(mockDoctors);
      expect(specialtyRepository.getDoctorsBySpecialty).toHaveBeenCalledWith(
        specialtyId
      );
    });
  });
});
