/**
 * backend/src/jobs/recoveryWorker.js
 * BullMQ Worker implementation for the "recovery-actions" queue.
 * Enforces action lock guards, idempotent execution, and precise audit trails.
 */

import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { RecoveryCase } from '../models/RecoveryCase.js';
import { RecoveryAction } from '../models/RecoveryAction.js';
import { Payment } from '../models/Payment.js';
import { buildCustomerContext, updateCustomerPaymentMetrics } from '../services/customerContextService.js';
import { logAuditEvent } from '../services/auditService.js';
import { executeMockAction } from '../providers/mockRecoveryProvider.js';
import { logger } from '../observability/logger.js';

/**
 * Core processor for individual recovery action jobs.
 */
export async function processRecoveryActionJob(job) {
  const { recoveryCaseId, recoveryActionId, correlationId } = job.data;

  logger.info(`⚙️ Processing Recovery Job [${job.id}] for Case [${recoveryCaseId}]`, { correlationId });

  const recoveryCase = await RecoveryCase.findById(recoveryCaseId);
  const recoveryAction = await RecoveryAction.findById(recoveryActionId);
  const payment = recoveryCase ? await Payment.findById(recoveryCase.paymentId) : null;

  if (!recoveryCase || !recoveryAction || !payment) {
    logger.warn('Job references missing entity records. Aborting.', { recoveryCaseId, recoveryActionId });
    return { success: false, reason: 'MISSING_ENTITIES' };
  }

  // Check if case is already in a terminal state
  if (['recovered', 'stopped', 'expired'].includes(recoveryCase.status)) {
    logger.info(`Case [${recoveryCaseId}] is already in terminal state [${recoveryCase.status}]. Skipping execution.`);
    recoveryAction.status = 'cancelled';
    await recoveryAction.save();
    return { success: false, reason: 'CASE_ALREADY_TERMINAL' };
  }

  // 1. Acquire Active Action Lock
  if (recoveryCase.activeActionLock) {
    logger.warn(`Action lock active on Case [${recoveryCaseId}]. Deferring concurrent run.`);
    throw new Error('ACTIVE_ACTION_LOCK_ENGAGED');
  }

  recoveryCase.activeActionLock = true;
  recoveryCase.status = 'executing';
  await recoveryCase.save();

  recoveryAction.status = 'running';
  await recoveryAction.save();

  await logAuditEvent({
    merchantId: recoveryCase.merchantId,
    recoveryCaseId: recoveryCase._id,
    paymentId: payment._id,
    correlationId,
    eventType: 'RECOVERY_ACTION_STARTED',
    actor: 'worker',
    message: `Worker acquired execution lock and started [${recoveryAction.actionType}]`,
    metadata: { actionId: recoveryAction._id, actionType: recoveryAction.actionType }
  });

  try {
    const customerContext = await buildCustomerContext(recoveryCase.merchantId, recoveryCase.customerId);

    // 2. Execute Action via Safe Executor
    const executionResult = await executeMockAction({
      actionType: recoveryAction.actionType,
      recoveryCase,
      payment,
      customerContext,
      executionMode: recoveryCase.executionMode
    });

    // 3. Persist Execution Result
    recoveryAction.status = executionResult.recovered ? 'succeeded' : 'failed';
    recoveryAction.executedAt = new Date();
    recoveryAction.result = executionResult;
    await recoveryAction.save();

    await logAuditEvent({
      merchantId: recoveryCase.merchantId,
      recoveryCaseId: recoveryCase._id,
      paymentId: payment._id,
      correlationId,
      eventType: 'RECOVERY_ACTION_EXECUTED',
      actor: 'worker',
      message: `Action [${recoveryAction.actionType}] completed with outcome [${executionResult.outcome}]. Mode: [${executionResult.executionMode}]`,
      metadata: executionResult
    });

    // 4. Handle Outcome State Changes
    if (executionResult.recovered) {
      // SUCCESS: Mark Payment & Case as RECOVERED
      payment.status = 'recovered';
      await payment.save();

      recoveryCase.status = 'recovered';
      recoveryCase.recoveredAmountPaise = executionResult.recoveredAmountPaise;
      recoveryCase.recoveredAt = new Date();
      await recoveryCase.save();

      // Update customer lifetime recovery metrics
      await updateCustomerPaymentMetrics(
        recoveryCase.merchantId,
        recoveryCase.customerId,
        'recovered',
        executionResult.recoveredAmountPaise
      );

      // Cancel any other pending actions for this case
      await RecoveryAction.updateMany(
        { recoveryCaseId: recoveryCase._id, _id: { $ne: recoveryAction._id }, status: 'pending' },
        { status: 'cancelled' }
      );

      await logAuditEvent({
        merchantId: recoveryCase.merchantId,
        recoveryCaseId: recoveryCase._id,
        paymentId: payment._id,
        correlationId,
        eventType: 'REVENUE_RECOVERED',
        actor: 'worker',
        message: `🎉 Genuine revenue of ₹${(executionResult.recoveredAmountPaise / 100).toFixed(2)} successfully recovered!`,
        metadata: {
          recoveredAmountPaise: executionResult.recoveredAmountPaise,
          executionMode: executionResult.executionMode
        }
      });
    } else {
      // FAILURE / INCOMPLETE: Increment Retry Count
      recoveryCase.retryCount = (recoveryCase.retryCount || 0) + 1;
      if (recoveryCase.retryCount >= 3) {
        recoveryCase.status = 'failed';
      } else {
        recoveryCase.status = 'detected'; // Reset to detected for next potential round
      }
      await recoveryCase.save();
    }

    return executionResult;
  } catch (error) {
    recoveryAction.status = 'failed';
    recoveryAction.error = { message: error.message };
    await recoveryAction.save();

    await logAuditEvent({
      merchantId: recoveryCase.merchantId,
      recoveryCaseId: recoveryCase._id,
      paymentId: payment._id,
      correlationId,
      eventType: 'RECOVERY_ACTION_ERROR',
      actor: 'worker',
      message: `Execution failed with error: ${error.message}`,
      metadata: { error: error.message }
    });

    throw error;
  } finally {
    // 5. Always Release Action Lock
    await RecoveryCase.findByIdAndUpdate(recoveryCaseId, { activeActionLock: false });
    logger.info(`🔓 Action lock released for Case [${recoveryCaseId}]`);
  }
}

/**
 * Initializes and starts the BullMQ Worker.
 */
export function startRecoveryWorker() {
  const redisClient = getRedisClient();

  const worker = new Worker('recovery-actions', processRecoveryActionJob, {
    connection: redisClient,
    concurrency: 5
  });

  worker.on('ready', () => {
    logger.info('👷 BullMQ Recovery Worker ready and polling for jobs...');
  });

  worker.on('completed', (job) => {
    logger.info(`✅ BullMQ Job [${job.id}] completed.`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ BullMQ Job [${job?.id}] failed`, { error: err.message });
  });

  return worker;
}
