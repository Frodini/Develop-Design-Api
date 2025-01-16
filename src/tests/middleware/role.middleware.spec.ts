import { Request, Response, NextFunction } from "express";
import { authorizeRoles } from "../../app/middleware/role.middleware";

interface AuthenticatedRequest extends Request {
  user?: { userId: number; role: string };
}

describe("authorizeRoles middleware", () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {}; // Initialize request object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn(); // Mock next function
  });

  it("should return 401 if user is not authenticated", () => {
    const middleware = authorizeRoles(["Admin"]);

    middleware(req as AuthenticatedRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if user does not have the required role", () => {
    req.user = { userId: 1, role: "User" }; // User with a non-authorized role
    const middleware = authorizeRoles(["Admin"]);

    middleware(req as AuthenticatedRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden: You do not have access to this resource",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next if user has the required role", () => {
    req.user = { userId: 1, role: "Admin" }; // User with an authorized role
    const middleware = authorizeRoles(["Admin"]);

    middleware(req as AuthenticatedRequest, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should call next if user has one of the required roles", () => {
    req.user = { userId: 1, role: "Editor" }; // User with one of the authorized roles
    const middleware = authorizeRoles(["Admin", "Editor"]);

    middleware(req as AuthenticatedRequest, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
