import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { authenticateToken } from "../../app/middleware/auth.middleware";

jest.mock("jsonwebtoken");

interface AuthenticatedRequest extends Request {
  user?: { userId: number; role: string };
}

describe("authenticateToken middleware", () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} }; // Initialize with empty headers
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should return 401 if no token is provided", () => {
    authenticateToken(req as AuthenticatedRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if token is invalid", () => {
    req.headers = { authorization: "Bearer invalid_token" };

    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(new Error("Invalid token"), null);
    });

    authenticateToken(req as AuthenticatedRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next and set req.user if token is valid", () => {
    req.headers = { ...req.headers, authorization: "Bearer valid_token" };

    const mockUser = { userId: 1, role: "Admin" };
    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, mockUser);
    });

    authenticateToken(req as AuthenticatedRequest, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(mockUser);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
