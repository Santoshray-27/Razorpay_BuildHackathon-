/**
 * backend/src/routes/webhookRoutes.js
 * Routing for Razorpay webhooks and local dev fixtures.
 * Uses express.raw({ type: 'application/json' }) strictly for the Razorpay route to preserve raw bytes for HMAC verification.
 */

import { Router } from 'express';
import express from 'express';
import * as webhookController from '../controllers/webhookController.js';

const router = Router();

// Route-level RAW body parsing for Razorpay Webhooks (crucial for HMAC signature match)
router.post(
  '/razorpay',
  express.raw({ type: 'application/json', limit: '2mb' }),
  webhookController.handleRazorpayWebhook
);

// Route-level JSON parsing for dev test fixtures
router.post(
  '/dev-fixture',
  express.json({ limit: '2mb' }),
  webhookController.handleDevFixture
);

export default router;
