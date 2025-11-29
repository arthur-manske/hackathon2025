import { Request, Response, NextFunction } from "express";

import { AppDataSource } from "../config/data-source";

import { User } from "../entities/User";

import { AuthService } from "../services/AuthService";

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
    if (!header || !header.startsWith("Bearer "))
      return next();

    const decoded: any = AuthService.fromToken(header.split(" ")[1]);
    if (!decoded) return next();

    try {
        const user = AppDataSource.getRepository(User).findOne({where: {uuid: decoded.uuid}});
        if (!user) return next();

        req.user = await user;
        next();
    } catch (e) {
        console.error("token ruim horrivel " + e);
        return next;
    }
  }
}