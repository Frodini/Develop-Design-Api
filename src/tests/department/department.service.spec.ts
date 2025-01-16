import { DepartmentRepository } from "../../app/department/department.repository";
import { DepartmentService } from "../../app/department/department.service";
import { DatabaseService } from "../../database/database.service";

jest.mock("../../app/department/department.repository");

describe("DepartmentService", () => {
  let departmentService: DepartmentService;
  let departmentRepository: jest.Mocked<DepartmentRepository>;

  beforeEach(() => {
    departmentRepository = new DepartmentRepository(
      {} as DatabaseService
    ) as jest.Mocked<DepartmentRepository>;
    departmentService = new DepartmentService(departmentRepository);
  });

  describe("getAllDepartments", () => {
    it("should return a list of departments", async () => {
      const mockDepartments = [
        { id: 1, name: "Emergency" },
        { id: 2, name: "Radiology" },
      ];
      departmentRepository.getAllDepartments.mockResolvedValue(mockDepartments);

      const result = await departmentService.getAllDepartments();

      expect(result).toEqual(mockDepartments);
      expect(departmentRepository.getAllDepartments).toHaveBeenCalledTimes(1);
    });

    it("should handle empty department list", async () => {
      departmentRepository.getAllDepartments.mockResolvedValue([]);

      const result = await departmentService.getAllDepartments();

      expect(result).toEqual([]);
      expect(departmentRepository.getAllDepartments).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if the repository fails", async () => {
      const errorMessage = "Database error";
      departmentRepository.getAllDepartments.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(departmentService.getAllDepartments()).rejects.toThrow(
        errorMessage
      );
      expect(departmentRepository.getAllDepartments).toHaveBeenCalledTimes(1);
    });
  });
});
