/**
 * backend/src/routes/paymentRoutes.js
 * Express routing for protected merchant payments.
 */

import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All payment routes require JWT authentication
router.use(authenticate);

router.get('/', paymentController.listPayments);
router.get('/:id', paymentController.getPayment);

export default router;
