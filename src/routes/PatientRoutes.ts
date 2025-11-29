// src/routes/patient.routes.ts
import { Router } from "express";
import { PatientController } from "../controllers/PatientController";

let router: Router = Router();

// Rotas públicas
router.get("/",              PatientController.listAll);
router.get("/next-patient",  PatientController.nextPatient);
router.get("/:id",           PatientController.findById);
router.post("/",             PatientController.create);

// router.use(patientAuthMiddleware);

router.put("/:id",            PatientController.update);
router.delete("/:id",         PatientController.delete);

export default router;