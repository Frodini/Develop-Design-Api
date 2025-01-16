import "reflect-metadata";
import request from "supertest";
import express, { json } from "express";
import { Container } from "typedi";
import { AuditLogService } from "../../app/audit-log/audit-log.service";
import { UserService } from "../../app/user/user.service";
import { UserController } from "../../app/user/user.controller";
import { UserRepository } from "../../app/user/user.repository";
import { DatabaseService } from "../../database/database.service";
import { AuditLogRepository } from "../../app/audit-log/audit-log.repository";

// Mock dependencies
jest.mock("../../app/user/user.repository");
jest.mock("../../app/audit-log/audit-log.service");
jest.mock("../../app/middleware/auth.middleware", () => ({
  authenticateToken: (
    req: { user: { userId: number; role: string } },
    res: any,
    next: () => void
  ) => {
    req.user = { userId: 1, role: "Admin" }; // Simula un usuario autenticado
    next();
  },
}));

jest.mock("../../app/middleware/role.middleware", () => ({
  authorizeRoles: () => (req: any, res: any, next: () => void) => {
    next(); // Permite todas las solicitudes
  },
}));

describe("UserController", () => {
  let app: express.Application;
  let userService: jest.Mocked<UserService>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let userRepository: jest.Mocked<UserRepository>;
  let originalConsoleError: any;

  beforeEach(() => {
    jest.clearAllMocks();
    originalConsoleError = console.error;
    console.error = jest.fn();

    const dbServiceMock = {} as jest.Mocked<DatabaseService>;
    userRepository = new UserRepository(
      dbServiceMock
    ) as jest.Mocked<UserRepository>;
    const auditLogRepositoryMock = {} as jest.Mocked<AuditLogRepository>;
    auditLogService = new AuditLogService(
      auditLogRepositoryMock
    ) as jest.Mocked<AuditLogService>;

    userService = {
      createUser: jest.fn(),
      authenticateUser: jest.fn(),
      searchUsers: jest.fn(),
      getUserById: jest.fn(),
      deleteUser: jest.fn(),
      updateUser: jest.fn(),
      getUserByEmail: jest.fn(),
      getSpecialtiesByDoctorId: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    const userController = new UserController(userService, auditLogService);

    app = express();
    app.use(json());
    app.use("/users", userController.router);
  });

  describe("POST /users", () => {
    it("should create a user and return its ID", async () => {
      userService.createUser = jest.fn().mockResolvedValue(1);
      auditLogService.log.mockResolvedValue();

      const response = await request(app).post("/users").send({
        name: "John Doe",
        email: "john.doe@example.com",
        password: "securepassword",
        role: "Patient",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        userId: 1,
        message: "User created successfully",
        specialties: [],
      });
      expect(userService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "John Doe",
          email: "john.doe@example.com",
        })
      );
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it("should return 400 for invalid input", async () => {
      const response = await request(app).post("/users").send({
        email: "invalid-email",
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("POST /users/login", () => {
    it("should return a token for valid credentials", async () => {
      userService.authenticateUser.mockResolvedValue("valid_token");
      userService.getUserByEmail.mockResolvedValue({
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        role: "Patient",
        password: "securepassword",
      });

      const response = await request(app)
        .post("/users/login")
        .send({ email: "john.doe@example.com", password: "password123" });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe("valid_token");
      expect(userService.authenticateUser).toHaveBeenCalledWith(
        "john.doe@example.com",
        "password123"
      );
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it("should return 401 for invalid credentials", async () => {
      userService.authenticateUser.mockResolvedValue(null);

      const response = await request(app)
        .post("/users/login")
        .send({ email: "invalid@example.com", password: "wrongpassword" });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });
  });

  describe("GET /users", () => {
    it("should return a list of users", async () => {
      userService.searchUsers.mockResolvedValue([
        {
          id: 1,
          name: "John Doe",
          email: "john.doe@example.com",
          role: "Patient",
          password: "securepassword",
        },
      ]);

      const response = await request(app)
        .get("/users")
        .set("Authorization", "Bearer valid_token");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          id: 1,
          name: "John Doe",
          email: "john.doe@example.com",
          role: "Patient",
          password: "securepassword",
        },
      ]);
      expect(userService.searchUsers).toHaveBeenCalled();
    });
  });

  describe("GET /users/:userId", () => {
    it("should return a user by ID", async () => {
      userService.getUserById.mockResolvedValue({
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        role: "Patient",
        password: "securepassword",
      });

      const response = await request(app)
        .get("/users/1")
        .set("Authorization", "Bearer valid_token");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        role: "Patient",
        password: "securepassword",
      });
      expect(userService.getUserById).toHaveBeenCalledWith(1);
    });
  });

  describe("DELETE /users/:userId", () => {
    it("should delete a user by ID", async () => {
      userService.deleteUser.mockResolvedValue();

      const response = await request(app)
        .delete("/users/1")
        .set("Authorization", "Bearer valid_token");

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User deleted successfully");
      expect(userService.deleteUser).toHaveBeenCalledWith(1);
    });
  });

  describe("POST /users", () => {
    it("should return 400 if userService.createUser throws an error", async () => {
      userService.createUser.mockRejectedValue(new Error("Database error"));

      const response = await request(app).post("/users").send({
        name: "John Doe",
        email: "john.doe@example.com",
        password: "securepassword",
        role: "Patient",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Database error");
    });
  });

  describe("DELETE /users/:userId", () => {
    it("should return 400 if user does not exist", async () => {
      userService.deleteUser.mockRejectedValue(
        new Error("Error deleting user")
      );

      const response = await request(app)
        .delete("/users/999")
        .set("Authorization", "Bearer valid_token");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Error deleting user");
    });

    it("should return 400 if userService.deleteUser throws an error", async () => {
      userService.deleteUser.mockRejectedValue(
        new Error("Error deleting user")
      );

      const response = await request(app)
        .delete("/users/1")
        .set("Authorization", "Bearer valid_token");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Error deleting user");
    });
  });

  describe("Input Validation", () => {
    it("should return 400 for missing fields", async () => {
      const response = await request(app).post("/users").send({
        email: "john.doe@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it("should return 400 for invalid password length", async () => {
      const response = await request(app).post("/users").send({
        name: "John Doe",
        email: "john.doe@example.com",
        password: "123", // Contraseña demasiado corta
        role: "Patient",
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });
});
