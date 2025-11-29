import { Router } from "express";
import { PatientController } from "../controllers/PatientController";

let router: Router = Router();

router.get("/",              PatientController.listAll);
router.get("/next-patient",  PatientController.nextPatient);
router.get("/:uuid",           PatientController.findByUUID);
router.post("/",             PatientController.create);

// router.use(patientAuthMiddleware);

router.put("/:uuid",            PatientController.update);
router.delete("/:uuid",         PatientController.delete);

export default router;