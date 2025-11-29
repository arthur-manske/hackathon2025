import { Router } from "express";
import { PatientController } from "../controllers/PatientController";

import { patientAuthChecker } from "../middlewares/patientAuthChecker";
import { userAuthChecker }    from "../middlewares/userAuthChecker";

const router: Router = Router();

router.post("/login",  PatientController.login);
router.post("/logout", patientAuthChecker, PatientController.logout);
router.get("/next-patient", PatientController.nextPatient);

router.use(patientAuthChecker);
router.use(userAuthChecker);

router.get("/", PatientController.query);

router.post("/",        userAuthChecker, PatientController.create);
router.patch("/:uuid",  userAuthChecker, PatientController.update);
router.delete("/:uuid", userAuthChecker, PatientController.delete);

export default router;