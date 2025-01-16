import request from "supertest";
import express, { json } from "express";
import { Container } from "typedi";
import { NotificationService } from "../../app/notification/notification.service";
import { NotificationController } from "../../app/notification/notification.controller";

jest.mock("../../app/middleware/auth.middleware", () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { userId: 1 }; // Simulated authenticated user
    next();
  }),
}));

describe("NotificationController", () => {
  let app: express.Application;
  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    jest.clearAllMocks();

    notificationService = {
      getNotificationsByUserId: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    Container.set(NotificationService, notificationService);

    const notificationController = new NotificationController(
      notificationService
    );

    app = express();
    app.use(json());
    app.use("/notifications", notificationController.router);
  });

  describe("GET /notifications", () => {
    it("should return notifications for the authenticated user", async () => {
      const mockNotifications = [
        { id: 1, recipientId: 1, message: "Notification 1" },
        { id: 2, recipientId: 1, message: "Notification 2" },
      ];
      notificationService.getNotificationsByUserId.mockResolvedValue(
        mockNotifications
      );

      const response = await request(app)
        .get("/notifications")
        .set("Authorization", "Bearer valid_token");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNotifications);
      expect(notificationService.getNotificationsByUserId).toHaveBeenCalledWith(
        1
      );
    });

    it("should return 500 if the service throws an error", async () => {
      notificationService.getNotificationsByUserId.mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .get("/notifications")
        .set("Authorization", "Bearer valid_token");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: "Database error" });
      expect(notificationService.getNotificationsByUserId).toHaveBeenCalledWith(
        1
      );
    });
  });
});
