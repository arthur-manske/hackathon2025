import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";
import { PatientRepository } from "../repository/PatientRepository";
import { Patient } from "../entities/Patient";

export async function patientAuthChecker(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  req.patient = null;

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
    if (!patient) {
      next();
      return;
    }
    req.patient = patient;
    next();
  } catch (e) {
    console.error(e);
    next();
  }
}