import { Router } from "express";
import { OrderController } from "../controllers/order.controller.js";

const router = Router();

router.post("/", OrderController.create);
router.get("/by-reference/:referenceCode", OrderController.getByReferenceCode);
router.get("/user/:userId", OrderController.listByUser);

export default router;