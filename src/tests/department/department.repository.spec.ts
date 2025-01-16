import { DepartmentRepository } from "../../app/department/department.repository";
import { DatabaseService } from "../../database/database.service";

jest.mock("../../database/database.service");

describe("DepartmentRepository", () => {
  let departmentRepository: DepartmentRepository;
  let dbServiceMock: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    dbServiceMock = {
      connect: jest.fn(),
    } as unknown as jest.Mocked<DatabaseService>;
    departmentRepository = new DepartmentRepository(dbServiceMock);
  });

  describe("getAllDepartments", () => {
    it("should return all departments", async () => {
      const mockDb = {
        all: jest.fn().mockResolvedValue([
          { id: 1, name: "Emergency" },
          { id: 2, name: "Radiology" },
        ]),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const result = await departmentRepository.getAllDepartments();

      expect(result).toEqual([
        { id: 1, name: "Emergency" },
        { id: 2, name: "Radiology" },
      ]);
      expect(mockDb.all).toHaveBeenCalledWith("SELECT * FROM departments");
    });

    it("should return an empty list if no departments are found", async () => {
      const mockDb = {
        all: jest.fn().mockResolvedValue([]),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const result = await departmentRepository.getAllDepartments();

      expect(result).toEqual([]);
      expect(mockDb.all).toHaveBeenCalledWith("SELECT * FROM departments");
    });

    it("should throw an error if the database connection fails", async () => {
      const errorMessage = "Failed to connect to the database";
      dbServiceMock.connect.mockRejectedValue(new Error(errorMessage));

      await expect(departmentRepository.getAllDepartments()).rejects.toThrow(
        errorMessage
      );
      expect(dbServiceMock.connect).toHaveBeenCalled();
    });
  });
});
