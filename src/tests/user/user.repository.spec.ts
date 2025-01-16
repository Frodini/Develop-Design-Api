import { User } from "../../app/user/user.model";
import { UserRepository } from "../../app/user/user.repository";
import { DatabaseService } from "../../database/database.service";

jest.mock("../../database/database.service");

describe("UserRepository", () => {
  let userRepository: UserRepository;
  let dbServiceMock: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    dbServiceMock = {
      connect: jest.fn(),
    } as unknown as jest.Mocked<DatabaseService>;
    userRepository = new UserRepository(dbServiceMock);
  });

  describe("createUser", () => {
    it("should create a user and return its ID", async () => {
      const mockDb = {
        run: jest.fn().mockResolvedValue({ lastID: 1 }),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const user: User = {
        name: "John Doe",
        email: "john@example.com",
        password: "securepassword",
        role: "Patient",
      };

      const result = await userRepository.createUser(user);

      expect(result).toBe(1);
      expect(mockDb.run).toHaveBeenCalledWith(
        `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
        ["John Doe", "john@example.com", "securepassword", "Patient"]
      );
    });
  });

  describe("getUserById", () => {
    it("should return a user if found", async () => {
      const mockDb = {
        get: jest.fn().mockResolvedValue({
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          password: "securepassword",
          role: "Patient",
        }),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const result = await userRepository.getUserById(1);

      expect(result).toEqual({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: "securepassword",
        role: "Patient",
      });
      expect(mockDb.get).toHaveBeenCalledWith(
        `SELECT * FROM users WHERE id = ?`,
        [1]
      );
    });

    it("should return null if user is not found", async () => {
      const mockDb = {
        get: jest.fn().mockResolvedValue(null),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const result = await userRepository.getUserById(999);

      expect(result).toBeNull();
      expect(mockDb.get).toHaveBeenCalledWith(
        `SELECT * FROM users WHERE id = ?`,
        [999]
      );
    });
  });

  describe("validateSpecialties", () => {
    it("should return true if all specialties exist", async () => {
      const mockDb = {
        all: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const result = await userRepository.validateSpecialties([1, 2]);

      expect(result).toBe(true);
      expect(mockDb.all).toHaveBeenCalledWith(
        `SELECT id FROM specialties WHERE id IN (?, ?)`,
        [1, 2]
      );
    });

    it("should return false if some specialties do not exist", async () => {
      const mockDb = {
        all: jest.fn().mockResolvedValue([{ id: 1 }]),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const result = await userRepository.validateSpecialties([1, 2]);

      expect(result).toBe(false);
      expect(mockDb.all).toHaveBeenCalledWith(
        `SELECT id FROM specialties WHERE id IN (?, ?)`,
        [1, 2]
      );
    });
  });

  describe("deleteUser", () => {
    it("should delete a user by ID", async () => {
      const mockDb = {
        run: jest.fn().mockResolvedValue(undefined), // Simula la respuesta de la base de datos
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      await userRepository.deleteUser(1);

      expect(mockDb.run).toHaveBeenCalledWith(
        `DELETE FROM users WHERE id = ?`,
        [1]
      );
    });
  });

  describe("searchUsersWithPagination", () => {
    it("should return users with pagination", async () => {
      const mockDb = {
        all: jest.fn().mockResolvedValue([
          {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            password: "securepassword",
            role: "Patient",
          },
        ]),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const filters = { role: "Patient", name: "John" };
      const options = { limit: 10, offset: 0, sort: "name" };

      const result = await userRepository.searchUsersWithPagination(
        filters,
        options
      );

      expect(result).toEqual([
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          password: "securepassword",
          role: "Patient",
        },
      ]);
      expect(mockDb.all).toHaveBeenCalledWith(
        `SELECT * FROM users WHERE role = ? AND name LIKE ? ORDER BY name LIMIT ? OFFSET ?`,
        ["Patient", "%John%", 10, 0]
      );
    });
  });
});
