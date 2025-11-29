import { Request, Response, NextFunction } from "express";

import { AppDataSource } from "../config/data-source";

import { Patient } from "../entities/Patient";

import { AuthService } from "../services/AuthService";

declare global {
  namespace Express {
    interface Request {
      patient?: Patient;
    }
  }
}

export function patientAuthChecker() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return next();
    }

    const decoded: any = AuthService.fromToken(header.split(" ")[1]);
    if (!decoded) return next();

    try {
        const patient = AppDataSource.getRepository('patients').findOne({where: {uuid: decoded.uuid}});
        if (!patient) return res.status(401).json({message: "Token inválida."});

        req.patient = await patient;
        next();
    } catch (e) {
        console.error(e);
        return next();
    }
  }
}