import { Router } from "express";
import { Service } from "typedi";
import { UserService } from "./user.service";
import { authenticateToken } from "../middleware/auth.middleware";

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

    // Inicio de sesión
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

    // Actualizar usuario
    this.router.put("/:userId", authenticateToken, async (req, res) => {
      try {
        const { userId } = req.params;
        await this.userService.updateUser(Number(userId), req.body);
        res.status(200).json({ message: "User updated successfully" });
      } catch (error) {
        res.status(400).json({ error: "Error updating user" });
      }
    });

    // Consultar y gestionar usuarios
    this.router.get("/", authenticateToken, async (req, res) => {
      try {
        const users = await this.userService.searchUsers(req.query);
        res.status(200).json(users);
      } catch (error) {
        res.status(500).json({ error: "Error fetching users" });
      }
    });

    // Consultar perfil (individual)
    this.router.get("/:userId", authenticateToken, async (req, res) => {
      try {
        const user = await this.userService.getUserById(
          Number(req.params.userId)
        );
        if (user) {
          res.status(200).json(user);
        } else {
          res.status(404).json({ error: "User not found" });
        }
      } catch (error) {
        res.status(500).json({ error: "Error fetching user" });
      }
    });
  }
}
