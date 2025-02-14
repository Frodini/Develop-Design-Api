import { RequestHandler, Router } from "express";
import { Service } from "typedi";
import { UserService } from "./user.service";
import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { check, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { AuditLogService } from "../audit-log/audit-log.service";

const handleValidationErrors: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

@Service()
export class UserController {
  public router: Router;

  constructor(
    private userService: UserService,
    private auditLogService: AuditLogService
  ) {
    this.router = Router();
    this.routes();
  }

  private routes() {
    // Crear usuario
    this.router.post(
      "/",
      [
        check("name").isString().withMessage("Name must be a string"),
        check("email").isEmail().withMessage("Invalid email format"),
        check("password")
          .isLength({ min: 6 })
          .withMessage("Password must be at least 6 characters long"),
        check("role")
          .isIn(["Patient", "Doctor", "Admin"])
          .withMessage("Invalid role"),
        handleValidationErrors,
      ],
      async (req: Request, res: Response) => {
        try {
          const userId = await this.userService.createUser(req.body);

          let specialties = [];
          if (req.body.role === "Doctor") {
            specialties = await this.userService.getSpecialtiesByDoctorId(
              userId
            );
          }

          if (userId > 0) {
            await this.auditLogService.log(
              userId,
              "CREATE_USER",
              `Created user with ID ${userId}`
            );
          }

          res.status(201).json({
            userId,
            message: "User created successfully",
            specialties,
          });
        } catch (error: any) {
          console.error("Error creating user:", error.message);
          res.status(400).json({ error: error.message });
        }
      }
    );

    this.router.post("/login", async (req, res) => {
      try {
        const { email, password } = req.body;
        const token = await this.userService.authenticateUser(email, password);

        if (token) {
          const user = await this.userService.getUserByEmail(email);
          const loggedUserId = user?.id || 0;

          await this.auditLogService.log(
            loggedUserId,
            "LOGIN",
            `User with email ${email} logged in successfully`
          );

          res.status(200).json({ token });
        } else {
          res.status(401).json({ error: "Invalid credentials" });
        }
      } catch (error) {
        res.status(500).json({ error: "Error logging in" });
      }
    });

    this.router.put(
      "/:userId",
      authenticateToken,
      authorizeRoles(["Admin", "Patient"]),
      [
        check("name")
          .optional()
          .isString()
          .withMessage("Name must be a string"),
        check("email").optional().isEmail().withMessage("Invalid email format"),
        check("password")
          .optional()
          .isLength({ min: 6 })
          .withMessage("Password must be at least 6 characters long"),
        handleValidationErrors,
      ],
      async (req: Request, res: Response) => {
        try {
          const { userId } = req.params;
          await this.userService.updateUser(Number(userId), req.body);

          const loggedUserId = (req as any).user.userId;
          await this.auditLogService.log(
            loggedUserId,
            "UPDATE_USER",
            `Updated user with ID ${userId}`
          );

          res.status(200).json({ message: "User updated successfully" });
        } catch (error) {
          res.status(400).json({ error: "Error updating user" });
        }
      }
    );

    this.router.get(
      "/",
      authenticateToken,
      authorizeRoles(["Admin"]),
      async (req, res) => {
        try {
          const { page = 1, limit = 10, sort = "id" } = req.query;
          const filters = {
            role: req.query.role as string | undefined,
            name: req.query.name as string | undefined,
          };

          const users = await this.userService.searchUsers(filters, {
            page: Number(page),
            limit: Number(limit),
            sort: sort as string,
          });

          const loggedUserId = (req as any).user.userId;
          await this.auditLogService.log(
            loggedUserId,
            "GET_USERS",
            `Fetched users with filters`
          );

          res.status(200).json(users);
        } catch (error) {
          res.status(500).json({ error: "Error fetching users" });
        }
      }
    );

    this.router.get(
      "/:userId",
      authenticateToken,
      authorizeRoles(["Admin", "Patient"]),
      async (req, res): Promise<void> => {
        try {
          const { userId } = req.params;
          const loggedUserId = (req as any).user.userId;

          if (
            (req as any).user.role === "Patient" &&
            Number(userId) !== loggedUserId
          ) {
            res.status(403).json({
              error: "Forbidden: You cannot access other users' data",
            });
            return;
          }

          const user = await this.userService.getUserById(Number(userId));
          if (user) {
            await this.auditLogService.log(
              loggedUserId,
              "GET_USER",
              `Fetched user with ID ${userId}`
            );

            res.status(200).json(user);
          } else {
            res.status(404).json({ error: "User not found" });
          }
        } catch (error) {
          res.status(500).json({ error: "Error fetching user" });
        }
      }
    );

    this.router.delete(
      "/:userId",
      authenticateToken,
      authorizeRoles(["Admin"]),
      async (req, res) => {
        try {
          const { userId } = req.params;
          await this.userService.deleteUser(Number(userId));

          const loggedUserId = (req as any).user.userId;
          await this.auditLogService.log(
            loggedUserId,
            "DELETE_USER",
            `Deleted user with ID ${userId}`
          );

          res.status(200).json({ message: "User deleted successfully" });
        } catch (error) {
          res.status(400).json({ error: "Error deleting user" });
        }
      }
    );
  }
}
