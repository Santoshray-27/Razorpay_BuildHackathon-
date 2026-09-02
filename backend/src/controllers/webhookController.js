/**
 * backend/src/controllers/webhookController.js
 * Controller handling Razorpay Webhook HMAC verification, parsing, and development fixtures.
 */

import { verifyWebhookSignature } from '../utils/crypto.js';
import { razorpayWebhookSchema, devFixtureSchema } from '../validators/webhookValidator.js';
import * as webhookService from '../services/webhookService.js';
import { processStoredWebhookEvent } from '../services/paymentProcessingService.js';
import { env } from '../config/env.js';
import { logger } from '../observability/logger.js';

/**
 * Handles incoming Razorpay Test Mode webhooks with HMAC-SHA256 signature verification.
 */
export async function handleRazorpayWebhook(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const eventIdHeader = req.headers['x-razorpay-event-id'];
    const rawBody = req.body; // Buffer from express.raw()

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_WEBHOOK_SECRET || 'placeholder_until_santosh_creates_webhook';

    // 1. Signature Verification
    const isSignatureValid = verifyWebhookSignature(
      rawBody,
      signature,
      secret
    );

    if (!isSignatureValid) {
      logger.warn('⚠️ Webhook signature verification failed', {
        correlationId: req.correlationId,
        receivedSignature: signature ? `${signature.substring(0, 10)}...` : 'missing'
      });

      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Razorpay webhook signature verification failed',
          correlationId: req.correlationId
        }
      });
    }

    // 2. Parse Raw Buffer to JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody.toString('utf8'));
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MALFORMED_JSON',
          message: 'Unable to parse webhook payload as JSON',
          correlationId: req.correlationId
        }
      });
    }

    // 3. Validate Payload Structure with Zod
    const validationResult = razorpayWebhookSchema.safeParse(parsedBody);
    if (!validationResult.success) {
      logger.warn('Webhook payload schema mismatch', {
        correlationId: req.correlationId,
        issues: validationResult.error.issues
      });
    }

    const payloadData = validationResult.success ? validationResult.data : parsedBody;
    const eventType = payloadData.event || 'unknown';
    const providerEventId = eventIdHeader || payloadData.id || undefined;
    const merchantId = payloadData.account_id || 'merch_default';

    // 4. Durable Store & Deduplication
    const result = await webhookService.processWebhookEvent({
      merchantId,
      provider: 'razorpay',
      providerEventId,
      eventType,
      rawPayload: payloadData,
      signatureVerified: true,
      correlationId: req.correlationId
    });

    // 5. Fast 200 Response
    res.status(200).json({
      success: true,
      data: {
        status: result.isDuplicate ? 'ignored_duplicate' : 'accepted',
        eventId: result.event?.providerEventId || providerEventId,
        message: result.message
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Development-only fixture endpoint for testing without live Razorpay account.
 * Blocked in production.
 */
export async function handleDevFixture(req, res, next) {
  try {
    if (env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Dev fixtures are disabled in production environment',
          correlationId: req.correlationId
        }
      });
    }

    const validation = devFixtureSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid dev fixture payload',
          details: validation.error.issues,
          correlationId: req.correlationId
        }
      });
    }

    const fixture = validation.data;
    const providerEventId = fixture.event_id || `evt_dev_${fixture.payment_id}`;

    const syntheticRazorpayPayload = {
      entity: 'event',
      account_id: fixture.merchantId,
      event: `payment.${fixture.status}`,
      payload: {
        payment: {
          entity: {
            id: fixture.payment_id,
            amount: fixture.amount,
            currency: fixture.currency,
            status: fixture.status,
            method: fixture.payment_method,
            error_reason: fixture.failure_reason,
            customer_id: fixture.customer_id || `cust_${fixture.payment_id.substring(4)}`,
            email: fixture.customer_email || 'demo_customer@razorrecover.internal',
            contact: fixture.customer_phone || '+919876543210',
            created_at: Math.floor(Date.now() / 1000)
          }
        }
      },
      created_at: Math.floor(Date.now() / 1000)
    };

    const result = await webhookService.processWebhookEvent({
      merchantId: fixture.merchantId,
      provider: 'simulator',
      providerEventId,
      eventType: `payment.${fixture.status}`,
      rawPayload: syntheticRazorpayPayload,
      signatureVerified: true,
      correlationId: req.correlationId
    });

    let pipelineResult = null;
    if (!result.isDuplicate && result.event) {
      try {
        pipelineResult = await processStoredWebhookEvent(result.event, req.correlationId);
      } catch (err) {
        logger.error('Dev fixture pipeline processing error', { error: err.message, correlationId: req.correlationId });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        status: result.isDuplicate ? 'ignored_duplicate' : 'accepted',
        eventId: providerEventId,
        paymentId: pipelineResult?.payment?._id || null,
        caseId: pipelineResult?.recoveryCase?._id || null,
        message: result.message,
        fixtureData: syntheticRazorpayPayload
      },
      correlationId: req.correlationId
    });
  } catch (error) {
    next(error);
  }
}
