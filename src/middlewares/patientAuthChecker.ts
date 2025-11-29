import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Patient } from "../entities/Patient";
import { AuthService } from "../services/AuthService";
import { PatientRepository } from "../repository/PatientRepository";

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
      next();
      return;
    }

    const decoded: any = AuthService.fromToken(header.split(" ")[1]);
    if (!decoded) {
      next();
      return;
    }

    try {
      const patient = await new PatientRepository().findByUUID(decoded.uuid);
      if (!patient) return res.status(401).json({ message: "Token inválido." });
      req.patient = patient;
      next();
    } catch (e) {
      console.error(e);
      next();
    }
  };
}