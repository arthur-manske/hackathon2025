import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { AuthService } from "../services/AuthService";
import { UserRepository } from "../repository/UserRepository";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function userAuthChecker() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      next();
      return;
    }

    const decoded: any = AuthService.fromToken(header.split(" ")[1]);
    if (!decoded) {
      next();
      return;
    }

    try {
      const user = await new UserRepository().findByUUID(decoded.uuid);
      
      if (!user) {
        next();
        return;
      }
      req.user = user;
    } catch (e) {
      console.error("token ruim horrivel", e);
    }

    next();
  };
}