import { UserRepository } from "../../app/user/user.repository";
import { DatabaseService } from "../../database/database.service";
import { User } from "../../app/user/user.model";

describe("UserRepository", () => {
  let userRepository: UserRepository;
  let dbServiceMock: jest.Mocked<DatabaseService>;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
    };

    dbServiceMock = {
      connect: jest.fn().mockResolvedValue(mockDb),
    } as unknown as jest.Mocked<DatabaseService>;

    userRepository = new UserRepository(dbServiceMock);
  });

  describe("createUser", () => {
    it("should create a user and return the last inserted ID", async () => {
      mockDb.run.mockResolvedValue({ lastID: 1 });

      const user: User = {
        name: "Test User",
        email: "test@user.com",
        password: "hashed_password",
        role: "Patient",
      };

      const userId = await userRepository.createUser(user);

      expect(userId).toBe(1);
      expect(mockDb.run).toHaveBeenCalledWith(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [user.name, user.email, user.password, user.role]
      );
    });
  });

  describe("getUserById", () => {
    it("should return a user by ID", async () => {
      const user: User = {
        id: 1,
        name: "Test User",
        email: "test@user.com",
        password: "hashed_password",
        role: "Patient",
      };

      mockDb.get.mockResolvedValue(user);

      const result = await userRepository.getUserById(1);

      expect(result).toEqual(user);
      expect(mockDb.get).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE id = ?",
        [1]
      );
    });

    it("should return null if the user is not found", async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await userRepository.getUserById(999);

      expect(result).toBeNull();
      expect(mockDb.get).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE id = ?",
        [999]
      );
    });
  });

  describe("getUserByEmail", () => {
    it("should return a user by email", async () => {
      const user: User = {
        id: 1,
        name: "Test User",
        email: "test@user.com",
        password: "hashed_password",
        role: "Patient",
      };

      mockDb.get.mockResolvedValue(user);

      const result = await userRepository.getUserByEmail("test@user.com");

      expect(result).toEqual(user);
      expect(mockDb.get).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE email = ?",
        ["test@user.com"]
      );
    });

    it("should return null if the user is not found", async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await userRepository.getUserByEmail(
        "nonexistent@user.com"
      );

      expect(result).toBeNull();
      expect(mockDb.get).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE email = ?",
        ["nonexistent@user.com"]
      );
    });
  });

  describe("updateUser", () => {
    it("should update user information", async () => {
      mockDb.run.mockResolvedValue(undefined);

      const user: Partial<User> = {
        name: "Updated User",
        email: "updated@user.com",
        password: "new_hashed_password",
      };

      await userRepository.updateUser(1, user);

      expect(mockDb.run).toHaveBeenCalledWith(
        "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?",
        [user.name, user.email, user.password, 1]
      );
    });
  });

  describe("searchUsersWithPagination", () => {
    it("should return paginated users with filters", async () => {
      const users: User[] = [
        {
          id: 1,
          name: "Test User",
          email: "test@user.com",
          password: "hashed_password",
          role: "Patient",
        },
      ];

      mockDb.all.mockResolvedValue(users);

      const filters = { role: "Patient", name: "Test" };
      const options = { limit: 10, offset: 0, sort: "name" };

      const result = await userRepository.searchUsersWithPagination(
        filters,
        options
      );

      expect(result).toEqual(users);
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM users"),
        ["Patient", "%Test%", 10, 0]
      );
    });
  });

  describe("validateSpecialties", () => {
    it("should return true if all specialties are valid", async () => {
      mockDb.all.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await userRepository.validateSpecialties([1, 2]);

      expect(result).toBe(true);
      expect(mockDb.all).toHaveBeenCalledWith(
        "SELECT id FROM specialties WHERE id IN (?, ?)",
        [1, 2]
      );
    });

    it("should return false if any specialties are invalid", async () => {
      mockDb.all.mockResolvedValue([{ id: 1 }]);

      const result = await userRepository.validateSpecialties([1, 2]);

      expect(result).toBe(false);
      expect(mockDb.all).toHaveBeenCalledWith(
        "SELECT id FROM specialties WHERE id IN (?, ?)",
        [1, 2]
      );
    });
  });

  describe("associateDoctorSpecialties", () => {
    it("should associate specialties with a doctor", async () => {
      mockDb.get.mockResolvedValue({ id: 1 });
      mockDb.all.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockDb.run.mockResolvedValue(undefined);

      await userRepository.associateDoctorSpecialties(1, [1, 2]);

      expect(mockDb.run).toHaveBeenCalledTimes(2);
      expect(mockDb.run).toHaveBeenCalledWith(
        "INSERT INTO doctor_specialties (doctorId, specialtyId) VALUES (?, ?)",
        [1, 1]
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        "INSERT INTO doctor_specialties (doctorId, specialtyId) VALUES (?, ?)",
        [1, 2]
      );
    });

    it("should throw an error if the doctor does not exist", async () => {
      mockDb.get.mockResolvedValue(null);

      await expect(
        userRepository.associateDoctorSpecialties(1, [1, 2])
      ).rejects.toThrow("Doctor not found or invalid role.");
    });

    it("should throw an error if some specialties are invalid", async () => {
      mockDb.get.mockResolvedValue({ id: 1 });
      mockDb.all.mockResolvedValue([{ id: 1 }]);

      await expect(
        userRepository.associateDoctorSpecialties(1, [1, 2])
      ).rejects.toThrow("Some specialties do not exist.");
    });
  });

  describe("deleteUser", () => {
    it("should delete a user by ID", async () => {
      mockDb.run.mockResolvedValue(undefined);

      await userRepository.deleteUser(1);

      expect(mockDb.run).toHaveBeenCalledWith(
        "DELETE FROM users WHERE id = ?",
        [1]
      );
    });
  });
});
