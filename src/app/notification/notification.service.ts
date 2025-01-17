import { Service } from "typedi";
import { DatabaseService } from "../../database/database.service";
import { Notification } from "./notification.model";

@Service()
export class NotificationService {
  constructor(private dbService: DatabaseService) {}

  async createNotification(notification: Notification): Promise<number> {
    const db = await this.dbService.connect();
    const result = await db.run(
      `INSERT INTO notifications (recipientId, message) VALUES (?, ?)`,
      [notification.recipientId, notification.message]
    );
    return result.lastID!;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    const db = await this.dbService.connect();
    const notifications = await db.all<Notification[]>(
      `SELECT * FROM notifications WHERE recipientId = ?`,
      [userId]
    );
    return notifications;
  }
}
