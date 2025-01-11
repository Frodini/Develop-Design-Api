import { Request, Response, NextFunction } from "express";

// Usa el tipo extendido de Request
interface AuthenticatedRequest extends Request {
  user?: { userId: number; role: string };
}

export const authorizeRoles = (roles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: "Forbidden: You do not have access to this resource",
      });
      return;
    }

    next();
  };
};
