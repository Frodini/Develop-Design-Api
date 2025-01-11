import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

// Extiende el tipo Request para incluir la propiedad `user`
interface AuthenticatedRequest extends Request {
  user?: { userId: number; role: string }; // Ajusta el tipo según lo que contiene `user`
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access denied" });
    return;
  }

  jwt.verify(token, "tu_secreto", (err, user) => {
    if (err) {
      res.status(403).json({ message: "Invalid token" });
      return;
    }
    req.user = user as { userId: number; role: string }; // Adjunta el usuario tipado al objeto `req`
    next();
  });
};
