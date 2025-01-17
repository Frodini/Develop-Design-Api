import request from "supertest";
import express from "express";
import { UserController } from "../../app/user/user.controller";
import { UserService } from "../../app/user/user.service";
import { AuditLogService } from "../../app/audit-log/audit-log.service";
import { authenticateToken } from "../../app/middleware/auth.middleware";
import { authorizeRoles } from "../../app/middleware/role.middleware";
import { validationResult } from "express-validator";

jest.mock("../../app/middleware/auth.middleware", () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
}));

jest.mock("../../app/middleware/role.middleware", () => ({
  authorizeRoles: jest.fn(
    () => (req: any, res: any, next: () => any) => next()
  ),
}));

jest.mock("express-validator", () => ({
  ...jest.requireActual("express-validator"),
  validationResult: jest.fn(),
}));

describe("UserController", () => {
  let app: express.Application;
  let userService: jest.Mocked<UserService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(() => {
    jest.clearAllMocks();

    userService = {
      createUser: jest.fn(),
      authenticateUser: jest.fn(),
      updateUser: jest.fn(),
      getUserById: jest.fn(),
      searchUsers: jest.fn(),
      deleteUser: jest.fn(),
      getSpecialtiesByDoctorId: jest.fn(),
      getUserByEmail: jest.fn(),
    } as unknown as jest.Mocked<UserService>;

    auditLogService = {
      log: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    const userController = new UserController(userService, auditLogService);

    app = express();
    app.use(express.json());

    (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
      (req as any).user = { userId: 1, role: "Admin" };
      next();
    });

    (authorizeRoles as jest.Mock).mockImplementation(
      () => (req: any, res: any, next: () => any) => next()
    );

    app.use("/users", userController.router);
  });

  describe("POST /users", () => {
    it("should create a new user", async () => {
      userService.createUser.mockResolvedValue(1);
      userService.getSpecialtiesByDoctorId.mockResolvedValue([]);

      (validationResult as unknown as jest.Mock).mockImplementation(() => ({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([]),
      }));

      const response = await request(app).post("/users").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "Patient",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        userId: 1,
        message: "User created successfully",
        specialties: [],
      });
      expect(userService.createUser).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "Patient",
      });
    });

    it("should return 400 if validation fails", async () => {
      (validationResult as unknown as jest.Mock).mockImplementation(() => ({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest
          .fn()
          .mockReturnValue([{ msg: "Invalid email format", param: "email" }]),
      }));

      const response = await request(app).post("/users").send({
        email: "invalid-email",
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        { msg: "Invalid email format", param: "email" },
      ]);
    });
  });

  describe("POST /users/login", () => {
    it("should return a token if credentials are valid", async () => {
      userService.authenticateUser.mockResolvedValue("valid_token");
      userService.getUserByEmail.mockResolvedValue({ id: 1 } as any);

      const response = await request(app).post("/users/login").send({
        email: "john.doe@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ token: "valid_token" });
      expect(userService.authenticateUser).toHaveBeenCalledWith(
        "john.doe@example.com",
        "password123"
      );
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it("should return 401 if credentials are invalid", async () => {
      userService.authenticateUser.mockResolvedValue(null);

      const response = await request(app).post("/users/login").send({
        email: "john.doe@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: "Invalid credentials" });
    });
  });

  describe("PUT /users/:userId", () => {
    it("should update a user", async () => {
      userService.updateUser.mockResolvedValue(undefined);

      (validationResult as unknown as jest.Mock).mockImplementation(() => ({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([]),
      }));

      const response = await request(app).put("/users/1").send({
        name: "Updated Name",
        email: "updated@example.com",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "User updated successfully" });
      expect(userService.updateUser).toHaveBeenCalledWith(1, {
        name: "Updated Name",
        email: "updated@example.com",
      });
    });

    it("should return 400 if validation fails", async () => {
      (validationResult as unknown as jest.Mock).mockImplementation(() => ({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest
          .fn()
          .mockReturnValue([{ msg: "Invalid email format", param: "email" }]),
      }));

      const response = await request(app).put("/users/1").send({
        email: "not-an-email",
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        { msg: "Invalid email format", param: "email" },
      ]);
    });
  });

  describe("GET /users", () => {
    it("should return a list of users", async () => {
      userService.searchUsers.mockResolvedValue([
        { id: 1, name: "John Doe", email: "john.doe@example.com" },
      ] as any);

      const response = await request(app).get("/users");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        { id: 1, name: "John Doe", email: "john.doe@example.com" },
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
      } as any);

      const response = await request(app).get("/users/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
      });
      expect(userService.getUserById).toHaveBeenCalledWith(1);
    });

    it("should return 404 if user is not found", async () => {
      userService.getUserById.mockResolvedValue(null);

      const response = await request(app).get("/users/999");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "User not found" });
    });
  });

  describe("DELETE /users/:userId", () => {
    it("should delete a user", async () => {
      userService.deleteUser.mockResolvedValue(undefined);

      const response = await request(app).delete("/users/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "User deleted successfully" });
      expect(userService.deleteUser).toHaveBeenCalledWith(1);
      expect(auditLogService.log).toHaveBeenCalled();
    });
  });
});
