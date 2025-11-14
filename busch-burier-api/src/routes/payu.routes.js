import { Router } from 'express';
import PayUController from '../controllers/payu.controller.js';

const router = Router();

// POST /payu/prepare
router.post('/prepare', PayUController.prepare);

// 🔹 nuevo: POST /payu/confirm (webhook)
router.post('/confirm', PayUController.confirm);

export default router;