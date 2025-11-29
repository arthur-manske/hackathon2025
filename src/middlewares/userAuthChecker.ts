import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";
import { UserRepository } from "../repository/UserRepository";

export async function userAuthChecker(req: Request, res: Response, next: NextFunction) {
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
      req.body.user = user;
    } catch (e) {
      console.error("token ruim horrivel", e);
    }

    next();
}