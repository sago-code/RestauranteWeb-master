import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";

const router = Router();

router.post("/", UserController.createUser);
router.get("/:uid", UserController.getOne);
router.put("/:uid", UserController.update);

export default router;
