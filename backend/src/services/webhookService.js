/**
 * backend/src/services/webhookService.js
 * Durable event store, deduplication logic, and idempotency handler for payment webhooks.
 */

import { WebhookEvent } from '../models/WebhookEvent.js';
import { AuditLog } from '../models/AuditLog.js';
import { computePayloadHash } from '../utils/crypto.js';
import { logger } from '../observability/logger.js';

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

    // 3. Asynchronous handoff placeholder for Phase 3 (Payment & Case Engine)
    setImmediate(async () => {
      try {
        await handleAsyncEventProcessing(newEvent, correlationId);
      } catch (err) {
        logger.error('Async webhook handoff failed', { error: err.message, correlationId });
      }
    });

    return {
      isDuplicate: false,
      event: newEvent,
      message: 'Webhook event received and stored durably'
    };
  } catch (err) {
    if (err.code === 11000) {
      // Race condition caught by MongoDB unique compound index
      logger.warn('Concurrent duplicate caught by unique index', { correlationId, providerEventId: effectiveEventId });
      return {
        isDuplicate: true,
        message: 'Duplicate event caught by concurrency guard'
      };
    }
    throw err;
  }
}

/**
 * Placeholder for Phase 3 Event Normalization & Recovery Case creation.
 * In Phase 2, this records that the event is queued for downstream analysis.
 */
export async function handleAsyncEventProcessing(webhookEvent, correlationId) {
  // Marked as received. Phase 3 will attach the Risk Engine, Payment upsert, and Case state machine.
  logger.debug(`[Queue Handoff Placeholder] Ready for Phase 3 processing: ${webhookEvent.providerEventId}`, {
    correlationId
  });
}
