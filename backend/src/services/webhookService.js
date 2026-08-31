/**
 * backend/src/services/webhookService.js
 * Durable event store, deduplication logic, and idempotency handler for payment webhooks.
 */

import { WebhookEvent } from '../models/WebhookEvent.js';
import { AuditLog } from '../models/AuditLog.js';
import { computePayloadHash } from '../utils/crypto.js';
import { logger } from '../observability/logger.js';
import { processStoredWebhookEvent } from './paymentProcessingService.js';

/**
 * Persists and deduplicates incoming verified webhook events.
 * Returns immediately after durable storage to keep webhook latency under 100ms.
 */
export async function processWebhookEvent({
  merchantId = 'merch_default',
  provider = 'razorpay',
  providerEventId,
  eventType,
  rawPayload,
  signatureVerified = true,
  correlationId
}) {
  const payloadHash = computePayloadHash(rawPayload);
  const effectiveEventId = providerEventId || `evt_hash_${payloadHash.substring(0, 16)}`;

  // 1. Idempotency / Duplicate Check
  const existingEvent = await WebhookEvent.findOne({
    merchantId,
    provider,
    providerEventId: effectiveEventId
  });

  if (existingEvent) {
    logger.warn('Duplicate webhook event received — ignoring processing', {
      correlationId,
      providerEventId: effectiveEventId,
      eventType
    });

    // Write immutable audit log for duplicate delivery
    await AuditLog.create({
      merchantId,
      correlationId,
      eventType: 'DUPLICATE_EVENT_IGNORED',
      actor: 'system',
      message: `Duplicate webhook event [${effectiveEventId}] safely ignored`,
      metadata: {
        provider,
        providerEventId: effectiveEventId,
        eventType,
        originalReceivedAt: existingEvent.receivedAt
      }
    });

    return {
      isDuplicate: true,
      event: existingEvent,
      message: 'Duplicate event acknowledged and safely ignored'
    };
  }

  // 2. Durable Event Persistence
  let newEvent;
  try {
    newEvent = await WebhookEvent.create({
      merchantId,
      provider,
      providerEventId: effectiveEventId,
      eventType,
      payloadHash,
      rawPayload,
      signatureVerified,
      processingStatus: 'received',
      correlationId,
      receivedAt: new Date()
    });

    logger.info(`📥 Webhook Event stored durably [${effectiveEventId}] (${eventType})`, {
      correlationId,
      merchantId,
      providerEventId: effectiveEventId
    });

    // 3. Trigger Ingestion Pipeline (Normalizing, Risk Engine & Case Creation)
    setImmediate(async () => {
      try {
        await processStoredWebhookEvent(newEvent, correlationId);
      } catch (err) {
        logger.error('Async webhook payment pipeline failed', {
          error: err.message,
          stack: err.stack,
          correlationId
        });
      }
    });

    return {
      isDuplicate: false,
      event: newEvent,
      message: 'Webhook event received and stored durably'
    };
  } catch (err) {
    if (err.code === 11000) {
      logger.warn('Concurrent duplicate caught by unique index', { correlationId, providerEventId: effectiveEventId });
      return {
        isDuplicate: true,
        message: 'Duplicate event caught by concurrency guard'
      };
    }
    throw err;
  }
}
