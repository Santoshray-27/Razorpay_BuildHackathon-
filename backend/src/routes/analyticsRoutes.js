/**
 * backend/src/routes/analyticsRoutes.js
 * Express routing definitions for merchant analytics.
 */

import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

router.get('/overview', analyticsController.getOverview);
router.get('/recovery', analyticsController.getRecoveryAnalytics);
router.get('/failures', analyticsController.getFailureAnalytics);
router.get('/funnel', analyticsController.getFunnelAnalytics);

export default router;
