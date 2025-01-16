import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { UserService } from "../../app/user/user.service";
import { UserRepository } from "../../app/user/user.repository";
import { User } from "../../app/user/user.model";

jest.mock("../../app/user/user.repository");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("UserService", () => {
  let userService: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let dbServiceMock: jest.Mocked<any>;

  beforeEach(() => {
    dbServiceMock = {
      connect: jest.fn(),
    };

    userRepository = new UserRepository(
      dbServiceMock
    ) as jest.Mocked<UserRepository>;
    userService = new UserService(userRepository);
  });

  describe("createUser", () => {
    it("should create a doctor with valid specialties", async () => {
      const user: User = {
        name: "Dr. Jane",
        email: "jane@doctor.com",
        password: "password123",
        role: "Doctor",
        specialties: [1, 2],
      };

      userRepository.validateSpecialties.mockResolvedValue(true);
      userRepository.createUser.mockResolvedValue(1);

      const result = await userService.createUser(user);

      expect(result).toBe(1);
      expect(userRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Dr. Jane",
          email: "jane@doctor.com",
        })
      );
      expect(userRepository.associateDoctorSpecialties).toHaveBeenCalledWith(
        1,
        [1, 2]
      );
    });

    it("should throw an error if a doctor has no specialties", async () => {
      const user: User = {
        name: "Dr. Jane",
        email: "jane@doctor.com",
        password: "password123",
        role: "Doctor",
        specialties: [],
      };

      await expect(userService.createUser(user)).rejects.toThrow(
        "Doctors must have at least one specialty."
      );
    });
  });

  describe("authenticateUser", () => {
    it("should return a token for valid credentials", async () => {
      const user: User = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: "hashedpassword",
        role: "Patient",
      };

      userRepository.getUserByEmail.mockResolvedValue(user);
      jest.mock("bcrypt", () => ({
        compare: jest.fn(),
        hash: jest.fn(),
      }));

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      jest.mock("jsonwebtoken", () => ({
        sign: jest.fn(),
      }));

      (jwt.sign as jest.Mock).mockReturnValue("valid_token");

      const token = await userService.authenticateUser(
        "john@example.com",
        "password123"
      );

      expect(token).toBe("valid_token");
      expect(userRepository.getUserByEmail).toHaveBeenCalledWith(
        "john@example.com"
      );
    });

    it("should return null for invalid credentials", async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);

      const token = await userService.authenticateUser(
        "invalid@example.com",
        "wrongpassword"
      );

      expect(token).toBeNull();
    });
  });

  describe("updateUser", () => {
    it("should hash password before updating", async () => {
      jest.mock("bcrypt", () => ({
        compare: jest.fn(),
        hash: jest.fn(),
      }));

      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword");

      userRepository.updateUser.mockResolvedValue();

      await userService.updateUser(1, { password: "newpassword" });

      expect(bcrypt.hash).toHaveBeenCalledWith("newpassword", 10);
      expect(userRepository.updateUser).toHaveBeenCalledWith(1, {
        password: "hashedpassword",
      });
    });
  });

  describe("getUserById", () => {
    it("should return the user by ID", async () => {
      const user: User = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: "",
        role: "Patient",
      };
      userRepository.getUserById.mockResolvedValue(user);

      const result = await userService.getUserById(1);

      expect(result).toEqual(user);
      expect(userRepository.getUserById).toHaveBeenCalledWith(1);
    });
  });

  describe("searchUsers", () => {
    it("should return a paginated list of users", async () => {
      const users: User[] = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          password: "",
          role: "Patient",
        },
      ];
      userRepository.searchUsersWithPagination.mockResolvedValue(users);

      const result = await userService.searchUsers(
        { role: "Patient" },
        { page: 1, limit: 10, sort: "name" }
      );

      expect(result).toEqual(users);
      expect(userRepository.searchUsersWithPagination).toHaveBeenCalledWith(
        { role: "Patient" },
        { limit: 10, offset: 0, sort: "name" }
      );
    });
  });

  describe("deleteUser", () => {
    it("should delete a user if found", async () => {
      const user: User = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        password: "",
        role: "Patient",
      };
      userRepository.getUserById.mockResolvedValue(user);
      userRepository.deleteUser.mockResolvedValue();

      await userService.deleteUser(1);

      expect(userRepository.deleteUser).toHaveBeenCalledWith(1);
    });

    it("should throw an error if user is not found", async () => {
      userRepository.getUserById.mockResolvedValue(null);

      await expect(userService.deleteUser(999)).rejects.toThrow(
        "User not found"
      );
    });
  });
});
