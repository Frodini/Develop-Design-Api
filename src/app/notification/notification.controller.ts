import { Service } from "typedi";
import { authenticateToken } from "../middleware/auth.middleware";
import { Router, Request, Response } from "express";
import { NotificationService } from "./notification.service";

@Service()
export class NotificationController {
  public router: Router;

  constructor(private notificationService: NotificationService) {
    this.router = Router();
    this.routes();
  }

  private routes() {
    this.router.get(
      "/",
      authenticateToken,
      async (req: Request, res: Response) => {
        try {
          const userId = (req as any).user.userId;
          const notifications =
            await this.notificationService.getNotificationsByUserId(userId);
          res.status(200).json(notifications);
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      }
    );
  }
}
