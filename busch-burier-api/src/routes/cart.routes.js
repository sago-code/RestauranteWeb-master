import { Router } from "express";
import { CartController } from "../controllers/cart.controller.js";

const router = Router();

// Activo por userId
router.put("/active", CartController.upsertActive);
router.get("/active/:userId", CartController.getActive);
router.delete("/active/:userId", CartController.declineActive);
router.post("/active/:userId/pay", CartController.payActive);

// Rutas para carritos por ID (invitados o por id explícito)
router.post("/", CartController.create);
router.get("/:id", CartController.getOne);
router.put("/:id", CartController.updateItems);
router.delete("/:id", CartController.decline);
router.post("/:id/pay", CartController.pay);

// Invitados / por ID
router.post("/", CartController.create);
router.get("/:id", CartController.getOne);
router.put("/:id", CartController.updateItems);
router.delete("/:id", CartController.decline);
router.post("/:id/pay", CartController.pay);

// Adoptar carrito invitado -> usuario
router.put("/:id/attach/:userId", CartController.attachToUser);

export default router;