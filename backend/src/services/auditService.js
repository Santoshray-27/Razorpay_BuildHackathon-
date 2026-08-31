/**
 * backend/src/services/auditService.js
 * Central reusable service for writing and retrieving immutable audit trail entries.
 * Every significant system action, AI recommendation, policy decision, and worker execution logs here.
 */

import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../observability/logger.js';

/**
 * Creates an immutable audit log entry.
 * @param {object} params
 * @param {string} params.merchantId - Merchant tenant ID
 * @param {string} [params.recoveryCaseId] - Associated RecoveryCase ID
 * @param {string} [params.paymentId] - Associated Payment ID
 * @param {string} params.correlationId - Distributed trace/correlation ID
 * @param {string} params.eventType - Categorized event name (e.g., PAYMENT_STORED, REVENUE_RISK_DETECTED)
 * @param {'system'|'ai'|'policy_engine'|'human'|'worker'} params.actor - Actor responsible for event
 * @param {string} params.message - Human-readable explanation
 * @param {object} [params.metadata] - Sanitized contextual snapshot
 * @returns {Promise<AuditLog>}
 */
export async function logAuditEvent({
  merchantId,
  recoveryCaseId = null,
  paymentId = null,
  correlationId,
  eventType,
  actor,
  message,
  metadata = {}
}) {
  try {
    const entry = await AuditLog.create({
      merchantId,
      recoveryCaseId,
      paymentId,
      correlationId: correlationId || 'unknown',
      eventType,
      actor,
      message,
      metadata
    });

    logger.debug(`[AUDIT] [${eventType}] by [${actor}]: ${message}`, {
      correlationId,
      merchantId,
      recoveryCaseId,
      paymentId
    });

    return entry;
  } catch (error) {
    logger.error('Failed to persist audit log entry', {
      error: error.message,
      correlationId,
      eventType
    });
    // Never crash the primary pipeline if audit log write fails
    return null;
  }
}

/**
 * Retrieves the full chronological audit timeline for a recovery case.
 * @param {string} merchantId
 * @param {string} recoveryCaseId
 */
export async function getCaseAuditTimeline(merchantId, recoveryCaseId) {
  return AuditLog.find({ merchantId, recoveryCaseId })
    .sort({ createdAt: 1 })
    .lean();
}

/**
 * Retrieves recent audit logs for a merchant.
 * @param {string} merchantId
 * @param {number} [limit=100]
 */
export async function getMerchantAuditLogs(merchantId, limit = 100) {
  return AuditLog.find({ merchantId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
