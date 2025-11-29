// src/routes/patient.routes.ts
import { Router } from "express";
import { PatientController } from "../controllers/PatientController";

let router: Router = Router();

// Rotas públicas
router.get("/",              PatientController.listAll);
router.get("/next-patient",  PatientController.nextPatient);
router.get("/:id",           PatientController.findById);
router.post("/",             PatientController.create);

// Rotas que exigem identificação de paciente (opcional, por exemplo, para updates/remover)
// Se futuramente quiser middleware de autenticação ou autorização, pode adicionar igual ao UserRouter
// Exemplo de placeholders:
// router.use(patientAuthMiddleware);

router.put("/:id",            PatientController.update);
router.delete("/:id",         PatientController.delete);

export default router;