import { NotificationService } from "../../app/notification/notification.service";
import { DatabaseService } from "../../database/database.service";
import { Notification } from "../../app/notification/notification.model";

jest.mock("../../database/database.service");

describe("NotificationService", () => {
  let notificationService: NotificationService;
  let dbServiceMock: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    dbServiceMock = {
      connect: jest.fn(),
    } as unknown as jest.Mocked<DatabaseService>;
    notificationService = new NotificationService(dbServiceMock);
  });

  describe("createNotification", () => {
    it("should create a notification and return its ID", async () => {
      const mockDb = {
        run: jest.fn().mockResolvedValue({ lastID: 1 }),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const notification: Notification = {
        recipientId: 1,
        message: "You have a new message",
      };

      const result = await notificationService.createNotification(notification);

      expect(result).toBe(1);
      expect(mockDb.run).toHaveBeenCalledWith(
        `INSERT INTO notifications (recipientId, message) VALUES (?, ?)`,
        [1, "You have a new message"]
      );
    });

    it("should throw an error if the database operation fails", async () => {
      const mockDb = {
        run: jest.fn().mockRejectedValue(new Error("Database error")),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const notification: Notification = {
        recipientId: 1,
        message: "You have a new message",
      };

      await expect(
        notificationService.createNotification(notification)
      ).rejects.toThrow("Database error");

      expect(mockDb.run).toHaveBeenCalledWith(
        `INSERT INTO notifications (recipientId, message) VALUES (?, ?)`,
        [1, "You have a new message"]
      );
    });
  });

  describe("getNotificationsByUserId", () => {
    it("should return notifications for a given user ID", async () => {
      const mockNotifications: Notification[] = [
        { id: 1, recipientId: 1, message: "Notification 1" },
        { id: 2, recipientId: 1, message: "Notification 2" },
      ];
      const mockDb = {
        all: jest.fn().mockResolvedValue(mockNotifications),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const result = await notificationService.getNotificationsByUserId(1);

      expect(result).toEqual(mockNotifications);
      expect(mockDb.all).toHaveBeenCalledWith(
        `SELECT * FROM notifications WHERE recipientId = ?`,
        [1]
      );
    });

    it("should return an empty array if no notifications exist for the user", async () => {
      const mockDb = {
        all: jest.fn().mockResolvedValue([]),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      const result = await notificationService.getNotificationsByUserId(1);

      expect(result).toEqual([]);
      expect(mockDb.all).toHaveBeenCalledWith(
        `SELECT * FROM notifications WHERE recipientId = ?`,
        [1]
      );
    });

    it("should throw an error if the database operation fails", async () => {
      const mockDb = {
        all: jest.fn().mockRejectedValue(new Error("Database error")),
      };
      dbServiceMock.connect.mockResolvedValue(mockDb as any);

      await expect(
        notificationService.getNotificationsByUserId(1)
      ).rejects.toThrow("Database error");

      expect(mockDb.all).toHaveBeenCalledWith(
        `SELECT * FROM notifications WHERE recipientId = ?`,
        [1]
      );
    });
  });
});
