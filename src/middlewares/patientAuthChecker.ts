import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";
import { PatientRepository } from "../repository/PatientRepository";

export async function patientAuthChecker(req: Request, res: Response, next: NextFunction) {
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
      req.body.patient = patient;
      next();
    } catch (e) {
      console.error(e);
      next();
    }
}