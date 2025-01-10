import { Router } from "express";
import { Service } from "typedi";
import { UserService } from "./user.service";
import { authenticateToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

@Service()
export class UserController {
  public router: Router;

  constructor(private userService: UserService) {
    this.router = Router();
    this.routes();
  }

  private routes() {
    // Crear usuario
    this.router.post("/", async (req, res) => {
      try {
        const userId = await this.userService.createUser(req.body);
        res.status(201).json({ userId, message: "User created successfully" });
      } catch (error) {
        res.status(400).json({ error: "Error creating user" });
      }
    });

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
      authenticateToken,
      authorizeRoles(["Admin", "Patient"]),
      async (req, res): Promise<void> => {
        try {
          const { userId } = req.params;
          const loggedUserId = (req as any).user.userId;

          // Validar que el usuario tiene permiso para actualizar
          if (
            (req as any).user.role === "Patient" &&
            Number(userId) !== loggedUserId
          ) {
            res
              .status(403)
              .json({ error: "Forbidden: You cannot update other users" });
            return;
          }

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
          const users = await this.userService.searchUsers(req.query);
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
  }
}
