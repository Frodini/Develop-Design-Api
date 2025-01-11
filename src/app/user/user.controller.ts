import { RequestHandler, Router } from "express";
import { Service } from "typedi";
import { UserService } from "./user.service";
import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { check, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

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

  constructor(private userService: UserService) {
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
        check("specialties")
          .optional()
          .isArray()
          .withMessage("Specialties must be an array of numbers"),
        handleValidationErrors, // Usamos la función local
      ],
      async (req: Request, res: Response) => {
        try {
          const userId = await this.userService.createUser(req.body);
          res
            .status(201)
            .json({ userId, message: "User created successfully" });
        } catch (error: any) {
          res.status(400).json({ error: error.message });
        }
      }
    );

    this.router.post("/login", async (req, res) => {
      try {
        const { email, password } = req.body;
        const token = await this.userService.authenticateUser(email, password);

        if (token) {
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
      authenticateToken, // Middleware de autenticación
      authorizeRoles(["Admin", "Patient"]), // Middleware de autorización
      [
        // Validadores
        check("name")
          .optional()
          .isString()
          .withMessage("Name must be a string"),
        check("email").optional().isEmail().withMessage("Invalid email format"),
        check("password")
          .optional()
          .isLength({ min: 6 })
          .withMessage("Password must be at least 6 characters long"),
        handleValidationErrors, // Middleware para manejar errores de validación
      ],
      async (req: Request, res: Response) => {
        try {
          const { userId } = req.params;
          await this.userService.updateUser(Number(userId), req.body);
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

          // Un paciente solo puede consultar su propio perfil
          if (
            (req as any).user.role === "Patient" &&
            Number(userId) !== loggedUserId
          ) {
            res.status(403).json({
              error: "Forbidden: You cannot access other users' data",
            });
            return; // Importante: termina la ejecución después de enviar una respuesta
          }

          const user = await this.userService.getUserById(Number(userId));
          if (user) {
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
          res.status(200).json({ message: "User deleted successfully" });
        } catch (error) {
          res.status(400).json({ error: "Error deleting user" });
        }
      }
    );
  }
}
