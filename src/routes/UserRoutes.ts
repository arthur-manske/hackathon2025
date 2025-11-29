import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { userAuthChecker } from "../middlewares/userAuthChecker";

const router: Router = Router();

router.post("/login",  UserController.login);
router.post("/logout", userAuthChecker, UserController.logout);

router.use(userAuthChecker);

router.get("/",        UserController.query);
router.post("/",       UserController.create);
router.patch("/:uuid",   UserController.update);
router.delete("/:uuid",UserController.delete);

export default router;