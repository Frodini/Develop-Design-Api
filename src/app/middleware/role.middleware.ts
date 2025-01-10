import { Request, Response, NextFunction } from "express";

export const authorizeRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!roles.includes(user.role)) {
      res
        .status(403)
        .json({
          message: "Forbidden: You do not have access to this resource",
        });
      return;
    }

    next();
  };
};
