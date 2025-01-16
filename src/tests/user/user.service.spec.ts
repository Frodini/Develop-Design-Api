import { UserService } from "../../app/user/user.service";
import { UserRepository } from "../../app/user/user.repository";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { User } from "../../app/user/user.model";

jest.mock("../../app/user/user.repository");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("UserService", () => {
  let userService: UserService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = {
      createUser: jest.fn(),
      validateSpecialties: jest.fn(),
      associateDoctorSpecialties: jest.fn(),
      getSpecialtiesByDoctorId: jest.fn(),
      getUserByEmail: jest.fn(),
      updateUser: jest.fn(),
      getUserById: jest.fn(),
      searchUsersWithPagination: jest.fn(),
      deleteUser: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    userService = new UserService(userRepository);
  });

  describe("createUser", () => {
    it("should throw an error if a doctor is created without specialties", async () => {
      await expect(
        userService.createUser({
          id: 1,
          email: "test@doctor.com",
          password: "password",
          role: "Doctor",
        } as User)
      ).rejects.toThrow("Doctors must have at least one specialty.");
    });

    it("should throw an error if invalid specialties are provided", async () => {
      userRepository.validateSpecialties.mockResolvedValue(false);

      await expect(
        userService.createUser({
          id: 1,
          email: "test@doctor.com",
          password: "password",
          role: "Doctor",
          specialties: [101, 999],
        } as User)
      ).rejects.toThrow("Invalid specialties provided.");
    });

    it("should hash the password before saving the user", async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");
      userRepository.createUser.mockResolvedValue(1);

      const userId = await userService.createUser({
        id: 1,
        email: "test@user.com",
        password: "password",
        role: "User",
      } as unknown as User);

      expect(userId).toBe(1);
      expect(bcrypt.hash).toHaveBeenCalledWith("password", 10);
      expect(userRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ password: "hashed_password" })
      );
    });

    it("should create a doctor and associate specialties", async () => {
      userRepository.validateSpecialties.mockResolvedValue(true);
      userRepository.createUser.mockResolvedValue(1);

      await userService.createUser({
        id: 1,
        email: "test@doctor.com",
        password: "password",
        role: "Doctor",
        specialties: [101, 102],
      } as User);

      expect(userRepository.associateDoctorSpecialties).toHaveBeenCalledWith(
        1,
        [101, 102]
      );
    });
  });

  describe("getSpecialtiesByDoctorId", () => {
    it("should return specialties for a valid doctor ID", async () => {
      const specialties = [{ id: 101, name: "Cardiology" }];
      userRepository.getSpecialtiesByDoctorId.mockResolvedValue(specialties);

      const result = await userService.getSpecialtiesByDoctorId(1);

      expect(result).toEqual(specialties);
      expect(userRepository.getSpecialtiesByDoctorId).toHaveBeenCalledWith(1);
    });
  });

  describe("authenticateUser", () => {
    it("should return a valid JWT for correct email and password", async () => {
      userRepository.getUserByEmail.mockResolvedValue({
        id: 1,
        email: "test@user.com",
        password: "hashed_password",
        role: "User",
      } as unknown as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("valid_token");

      const token = await userService.authenticateUser(
        "test@user.com",
        "password"
      );

      expect(token).toBe("valid_token");
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1, role: "User" },
        "tu_secreto",
        { expiresIn: "24h" }
      );
    });

    it("should return null for incorrect email", async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);

      const token = await userService.authenticateUser(
        "invalid@user.com",
        "password"
      );

      expect(token).toBeNull();
    });

    it("should return null for incorrect password", async () => {
      userRepository.getUserByEmail.mockResolvedValue({
        id: 1,
        email: "test@user.com",
        password: "hashed_password",
        role: "User",
      } as unknown as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const token = await userService.authenticateUser(
        "test@user.com",
        "wrongpassword"
      );

      expect(token).toBeNull();
    });
  });

  describe("updateUser", () => {
    it("should hash the password if provided", async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue("new_hashed_password");

      await userService.updateUser(1, { password: "new_password" });

      expect(bcrypt.hash).toHaveBeenCalledWith("new_password", 10);
      expect(userRepository.updateUser).toHaveBeenCalledWith(1, {
        password: "new_hashed_password",
      });
    });

    it("should update user details successfully", async () => {
      await userService.updateUser(1, { name: "Updated Name" });

      expect(userRepository.updateUser).toHaveBeenCalledWith(1, {
        name: "Updated Name",
      });
    });
  });

  describe("getUserById", () => {
    it("should return a user for a valid ID", async () => {
      const user = {
        id: 1,
        email: "test@user.com",
        role: "User",
      } as unknown as User;
      userRepository.getUserById.mockResolvedValue(user);

      const result = await userService.getUserById(1);

      expect(result).toEqual(user);
      expect(userRepository.getUserById).toHaveBeenCalledWith(1);
    });

    it("should return null for an invalid ID", async () => {
      userRepository.getUserById.mockResolvedValue(null);

      const result = await userService.getUserById(999);

      expect(result).toBeNull();
    });
  });

  describe("searchUsers", () => {
    it("should return paginated results with the correct filters", async () => {
      const users = [
        {
          id: 1,
          email: "test@user.com",
          name: "Test User",
          password: "hashed_password",
          role: "Patient" as "Patient",
        },
      ];

      userRepository.searchUsersWithPagination.mockResolvedValue(users);

      const result = await userService.searchUsers(
        { role: "User", name: "test" },
        { page: 1, limit: 10, sort: "name" }
      );

      expect(result).toEqual(users); // Ensure the expected and received objects are identical
      expect(userRepository.searchUsersWithPagination).toHaveBeenCalledWith(
        { role: "User", name: "test" },
        { limit: 10, offset: 0, sort: "name" } // Verify pagination arguments
      );
    });
  });

  describe("deleteUser", () => {
    it("should throw an error if the user does not exist", async () => {
      userRepository.getUserById.mockResolvedValue(null);

      await expect(userService.deleteUser(999)).rejects.toThrow(
        "User not found"
      );
    });

    it("should delete the user successfully", async () => {
      userRepository.getUserById.mockResolvedValue({
        id: 1,
        email: "test@user.com",
      } as User);

      await userService.deleteUser(1);

      expect(userRepository.deleteUser).toHaveBeenCalledWith(1);
    });
  });

  describe("getUserByEmail", () => {
    it("should return a user for a valid email", async () => {
      const user = {
        id: 1,
        email: "test@user.com",
        role: "User",
      } as unknown as User;
      userRepository.getUserByEmail.mockResolvedValue(user);

      const result = await userService.getUserByEmail("test@user.com");

      expect(result).toEqual(user);
    });

    it("should return null for an invalid email", async () => {
      userRepository.getUserByEmail.mockResolvedValue(null);

      const result = await userService.getUserByEmail("invalid@user.com");

      expect(result).toBeNull();
    });
  });
});
