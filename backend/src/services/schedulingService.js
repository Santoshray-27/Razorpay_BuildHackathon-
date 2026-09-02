/**
 * backend/src/services/schedulingService.js
 * Reliable Action Scheduling Service.
 * Ensures only APPROVED cases are scheduled, creates unique idempotency keys,
 * compresses delays in DEMO_MODE, and pushes strictly ID-only payloads to BullMQ.
 */

import { RecoveryCase } from '../models/RecoveryCase.js';
import { RecoveryAction } from '../models/RecoveryAction.js';
import { Payment } from '../models/Payment.js';
import { getRecoveryActionsQueue } from '../jobs/queues.js';
import { logAuditEvent } from './auditService.js';
import { evaluatePolicy } from '../policies/recoveryPolicy.js';
import { buildCustomerContext } from './customerContextService.js';
import { env } from '../config/env.js';
import { logger } from '../observability/logger.js';

import { isRedisConnected } from '../config/redis.js';

/**
 * Schedules an approved recovery case into BullMQ queue.
 */
export async function scheduleApprovedAction(merchantId, caseId, correlationId) {
  const recoveryCase = await RecoveryCase.findOne({ _id: caseId, merchantId }).populate('paymentId');
  if (!recoveryCase) {
    const error = new Error('Recovery case not found');
    error.statusCode = 404;
    error.code = 'RECOVERY_CASE_NOT_FOUND';
    throw error;
  }

  if (recoveryCase.status !== 'approved') {
    const error = new Error(`Cannot schedule case in status '${recoveryCase.status}'. Case must be in 'approved' status.`);
    error.statusCode = 400;
    error.code = 'INVALID_STATUS_FOR_SCHEDULING';
    throw error;
  }

  // 1. Re-verify Policy Engine Safety Checks Before Enqueueing
  const customerContext = await buildCustomerContext(merchantId, recoveryCase.customerId);
  const recheckPolicy = evaluatePolicy({
    payment: recoveryCase.paymentId,
    recoveryCase,
    customerContext,
    recommendation: recoveryCase.latestRecommendation || {},
    humanAuthorized: recoveryCase.status === 'approved'
  });

  if (recheckPolicy.decision !== 'APPROVED') {
    recoveryCase.status = recheckPolicy.decision === 'PENDING_APPROVAL' ? 'pending_approval' : 'stopped';
    await recoveryCase.save();

    await logAuditEvent({
      merchantId,
      recoveryCaseId: caseId,
      paymentId: recoveryCase.paymentId?._id,
      correlationId,
      eventType: 'SCHEDULING_BLOCKED_BY_POLICY',
      actor: 'policy_engine',
      message: `Scheduling blocked upon re-check: ${recheckPolicy.reason}`,
      metadata: { decision: recheckPolicy.decision }
    });

    const error = new Error(`Scheduling rejected by policy re-check: ${recheckPolicy.reason}`);
    error.statusCode = 400;
    error.code = 'POLICY_RECHECK_FAILED';
    throw error;
  }

  let actionType = recoveryCase.latestPolicyDecision?.finalAction || recoveryCase.latestRecommendation?.recommended_action || 'RETRY_LATER';
  if (actionType === 'HUMAN_REVIEW') {
    actionType = 'RETRY_LATER';
  }
  const retryCount = recoveryCase.retryCount || 0;
  const idempotencyKey = `act_${caseId}_${retryCount}_${actionType}`;

  // 2. Persist RecoveryAction BEFORE Enqueueing
  let recoveryAction = await RecoveryAction.findOne({ idempotencyKey });
  if (!recoveryAction) {
    recoveryAction = await RecoveryAction.create({
      merchantId,
      recoveryCaseId: caseId,
      idempotencyKey,
      actionType,
      status: 'scheduled',
      executionMode: recoveryCase.executionMode,
      correlationId
    });
  }

  // 3. Compute Delay (with DEMO_MODE compression)
  const scheduledHours = Number(recoveryCase.latestPolicyDecision?.scheduledAfterHours) || Number(recoveryCase.latestRecommendation?.retry_after_hours) || 0;
  let delayMs = 0;

  if (scheduledHours > 0) {
    if (env.DEMO_COMPRESSION_ENABLED) {
      delayMs = 30 * 1000;
      logger.info(`⏱️ [DEMO_MODE] Compressed ${scheduledHours}h delay to 30s for demo observation.`);
    } else {
      delayMs = scheduledHours * 60 * 60 * 1000;
    }
  }

  const scheduledFor = new Date(Date.now() + delayMs);
  recoveryAction.scheduledFor = scheduledFor;
  await recoveryAction.save();

  // 4. Enqueue Job to BullMQ (Safe graceful fallback if Redis offline)
  try {
    if (isRedisConnected()) {
      const queue = getRecoveryActionsQueue();
      await queue.add(
        'execute-recovery-action',
        {
          recoveryCaseId: caseId,
          recoveryActionId: recoveryAction._id.toString(),
          correlationId
        },
        {
          delay: delayMs,
          jobId: idempotencyKey
        }
      );
    } else {
      logger.info('Redis connection not active. Job persisted in database and scheduled.');
    }
  } catch (queueErr) {
    logger.warn('BullMQ job enqueue skipped or deferred (Redis offline or test mode)', {
      error: queueErr.message,
      idempotencyKey
    });
  }

  // 5. Update RecoveryCase Status to SCHEDULED
  recoveryCase.status = 'scheduled';
  await recoveryCase.save();

  // 6. Audit Log: Job Scheduled
  await logAuditEvent({
    merchantId,
    recoveryCaseId: caseId,
    paymentId: recoveryCase.paymentId?._id,
    correlationId,
    eventType: 'RECOVERY_JOB_SCHEDULED',
    actor: 'system',
    message: `Recovery Action [${actionType}] scheduled for ${scheduledFor.toISOString()} (Delay: ${delayMs / 1000}s) with Idempotency Key [${idempotencyKey}]`,
    metadata: {
      actionId: recoveryAction._id,
      actionType,
      delaySeconds: delayMs / 1000,
      isDemoCompressed: env.DEMO_COMPRESSION_ENABLED,
      idempotencyKey
    }
  });

  return { recoveryCase, recoveryAction };
}
