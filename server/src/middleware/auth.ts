import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface AuthPayload {
  role: "trainer" | "client";
  clientId?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireTrainer(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "trainer") {
    return res.status(403).json({ error: "Trainer access required" });
  }
  next();
}

export function requireOwnClient(paramName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === "trainer") return next();
    const paramId = Number(req.params[paramName]);
    if (req.user?.role === "client" && req.user.clientId === paramId) {
      return next();
    }
    return res.status(403).json({ error: "Access denied" });
  };
}
