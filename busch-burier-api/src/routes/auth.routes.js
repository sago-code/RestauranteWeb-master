import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", AuthController.loginWithEmailAndPassword);
router.post("/login-google", AuthController.loginGoogle);

export default router;