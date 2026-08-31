/**
 * backend/src/routes/recoveryRoutes.js
 * Express routing definitions for recovery cases, AI analysis, policy evaluations, approvals, and scheduling.
 */

import { Router } from 'express';
import * as recoveryController from '../controllers/recoveryController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// All recovery routes require merchant authentication
router.use(authenticate);

// Listing & details
router.get('/cases', recoveryController.listRecoveryCases);
router.get('/pending-approvals', recoveryController.getPendingApprovals);
router.get('/:id', recoveryController.getRecoveryCase);

// Workflows & intelligence
router.post('/:id/analyze', recoveryController.analyzeCase);
router.post('/:id/evaluate-policy', recoveryController.evaluatePolicyForCase);

// Scheduling & Execution
router.post('/:id/schedule', recoveryController.scheduleCaseAction);
router.post('/:id/execute', recoveryController.executeCaseActionDirect);

// Human-in-the-Loop review actions (Role gated to merchant_admin & merchant_operator)
router.post(
  '/:id/approve',
  requireRole(['merchant_admin', 'merchant_operator']),
  recoveryController.approveCase
);

router.post(
  '/:id/reject',
  requireRole(['merchant_admin', 'merchant_operator']),
  recoveryController.rejectCase
);

router.post(
  '/:id/stop',
  requireRole(['merchant_admin', 'merchant_operator']),
  recoveryController.stopCase
);

export default router;
