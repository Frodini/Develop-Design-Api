import { Router } from "express";
import { Service } from "typedi";
import { UserService } from "./user.service";

@Service()
export class UserController {
  public router: Router;

  constructor(private userService: UserService) {
    this.router = Router();
    this.routes();
  }

  private routes() {
    this.router.post("/", async (req, res) => {
      try {
        const userId = await this.userService.createUser(req.body);
        res.status(201).json({ userId, message: "User created successfully" });
      } catch (error) {
        res.status(400).json({ error: "Error creating user" });
      }
    });

    this.router.put("/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        await this.userService.updateUser(Number(userId), req.body);
        res.status(200).json({ message: "User updated successfully" });
      } catch (error) {
        res.status(400).json({ error: "Error updating user" });
      }
    });

    this.router.get("/:userId", async (req, res) => {
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

    this.router.get("/", async (req, res) => {
      try {
        const filters = req.query;
        const users = await this.userService.searchUsers(filters);
        res.status(200).json(users);
      } catch (error) {
        res.status(500).json({ error: "Error searching users" });
      }
    });
  }
}
