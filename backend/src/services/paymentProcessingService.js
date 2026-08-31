/**
 * backend/src/services/paymentProcessingService.js
 * Ingestion pipeline processor:
 * 1. Normalizes webhook event payload into internal payment entities.
 * 2. Upserts privacy-safe customer context.
 * 3. Upserts payment record (storing money in paise).
 * 4. Runs deterministic Revenue Risk Engine.
 * 5. Creates RecoveryCase in DETECTED state.
 * 6. Emits structured immutable audit log entries.
 */

import { Payment } from '../models/Payment.js';
import { Customer } from '../models/Customer.js';
import { RecoveryCase } from '../models/RecoveryCase.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { upsertCustomer, updateCustomerPaymentMetrics } from './customerContextService.js';
import { evaluatePaymentRisk } from './riskEngine.js';
import { logAuditEvent } from './auditService.js';
import { logger } from '../observability/logger.js';

/**
 * Normalizes and processes incoming payment webhook events.
 * @param {object} webhookEvent - WebhookEvent Mongoose document or object
 * @param {string} correlationId
 */
export async function processStoredWebhookEvent(webhookEvent, correlationId) {
  const merchantId = webhookEvent.merchantId || 'merch_default';
  const provider = webhookEvent.provider || 'razorpay';
  const rawPayload = webhookEvent.rawPayload || {};

  // Extract payment entity from Razorpay event or raw fixture
  const paymentEntity = rawPayload.payload?.payment?.entity || rawPayload.payment || rawPayload;

  const providerPaymentId = paymentEntity.id || paymentEntity.payment_id || `pay_unknown_${Date.now()}`;
  const amountPaise = Number(paymentEntity.amount) || Number(paymentEntity.amountPaise) || 0;
  const currency = paymentEntity.currency || 'INR';
  const rawStatus = (paymentEntity.status || 'failed').toLowerCase();
  const paymentMethod = paymentEntity.method || paymentEntity.payment_method || 'card';
  const failureReason = paymentEntity.error_reason || paymentEntity.failure_reason || paymentEntity.error_description || 'unknown';
  const executionMode = paymentEntity.execution_mode || (provider === 'simulator' ? 'MOCK_DEMO' : 'RAZORPAY_TEST');
  const occurredAt = paymentEntity.created_at ? new Date(paymentEntity.created_at * 1000) : new Date();

  // 1. Upsert Customer (Privacy-Safe)
  const providerCustomerId = paymentEntity.customer_id || (paymentEntity.email ? `cust_${paymentEntity.email}` : `cust_${providerPaymentId}`);
  let customer = await upsertCustomer(merchantId, providerCustomerId, {
    name: paymentEntity.customer_name || '',
    email: paymentEntity.email || paymentEntity.customer_email || '',
    contact: paymentEntity.contact || paymentEntity.customer_phone || ''
  });

  // 2. Upsert Payment Record (Idempotent by merchantId + provider + providerPaymentId)
  const payment = await Payment.findOneAndUpdate(
    { merchantId, provider, providerPaymentId },
    {
      $set: {
        providerOrderId: paymentEntity.order_id || null,
        customerId: customer?._id || null,
        amountPaise,
        currency,
        status: rawStatus,
        paymentMethod,
        failureReason: rawStatus === 'failed' ? failureReason : null,
        executionMode,
        occurredAt,
        rawPayload
      }
    },
    { upsert: true, new: true }
  );

  // 3. Update customer metrics and reload updated customer doc
  if (customer?._id) {
    await updateCustomerPaymentMetrics(merchantId, customer._id, rawStatus, amountPaise);
    customer = await Customer.findById(customer._id);
  }

  let recoveryCase = null;

  // 4. If Payment Failed -> Run Revenue Risk Engine & Create RecoveryCase
  if (rawStatus === 'failed') {
    const riskAssessment = evaluatePaymentRisk(payment, 0);

    // Create or retrieve RecoveryCase (Idempotent by merchantId + paymentId)
    recoveryCase = await RecoveryCase.findOneAndUpdate(
      { merchantId, paymentId: payment._id },
      {
        $setOnInsert: {
          merchantId,
          paymentId: payment._id,
          customerId: customer?._id || null,
          amountAtRiskPaise: riskAssessment.amountAtRiskPaise,
          currency: payment.currency,
          riskLevel: riskAssessment.riskLevel,
          status: 'detected', // Starts strictly at DETECTED state
          failureReason,
          retryCount: 0,
          reminderCount: 0,
          recoveryWindowEndsAt: riskAssessment.recoveryWindowEndsAt,
          executionMode: payment.executionMode
        }
      },
      { upsert: true, new: true }
    );

    // Audit Log: Payment Stored
    await logAuditEvent({
      merchantId,
      recoveryCaseId: recoveryCase._id,
      paymentId: payment._id,
      correlationId,
      eventType: 'PAYMENT_STORED',
      actor: 'system',
      message: `Payment [${providerPaymentId}] for ₹${(amountPaise / 100).toFixed(2)} recorded with status '${rawStatus}'`,
      metadata: {
        provider,
        providerPaymentId,
        amountPaise,
        status: rawStatus,
        executionMode
      }
    });

    // Audit Log: Risk Detected
    await logAuditEvent({
      merchantId,
      recoveryCaseId: recoveryCase._id,
      paymentId: payment._id,
      correlationId,
      eventType: 'REVENUE_RISK_DETECTED',
      actor: 'system',
      message: `Revenue risk assessed as [${riskAssessment.riskLevel.toUpperCase()}]. ${riskAssessment.explanation}`,
      metadata: {
        riskLevel: riskAssessment.riskLevel,
        amountAtRiskPaise: riskAssessment.amountAtRiskPaise,
        failureCategory: riskAssessment.failureCategory,
        isEligible: riskAssessment.isEligible
      }
    });

    // Audit Log: Recovery Case Created
    await logAuditEvent({
      merchantId,
      recoveryCaseId: recoveryCase._id,
      paymentId: payment._id,
      correlationId,
      eventType: 'RECOVERY_CASE_CREATED',
      actor: 'system',
      message: `Recovery Case [${recoveryCase._id}] created in DETECTED state for payment [${providerPaymentId}]`,
      metadata: {
        caseId: recoveryCase._id,
        amountAtRiskPaise: recoveryCase.amountAtRiskPaise,
        status: recoveryCase.status,
        riskLevel: recoveryCase.riskLevel
      }
    });
  } else {
    // Non-failed payment stored
    await logAuditEvent({
      merchantId,
      paymentId: payment._id,
      correlationId,
      eventType: 'PAYMENT_STORED',
      actor: 'system',
      message: `Payment [${providerPaymentId}] for ₹${(amountPaise / 100).toFixed(2)} recorded with status '${rawStatus}'`,
      metadata: {
        provider,
        providerPaymentId,
        amountPaise,
        status: rawStatus,
        executionMode
      }
    });
  }

  // 5. Mark WebhookEvent as processed if it was saved in Mongo
  if (webhookEvent?._id) {
    try {
      await WebhookEvent.findByIdAndUpdate(webhookEvent._id, {
        processingStatus: 'processed',
        processedAt: new Date()
      });
    } catch (_) {
      // Non-critical if event is ephemeral fixture
    }
  }

  logger.info(`✅ Ingestion pipeline completed for payment [${providerPaymentId}]`, {
    correlationId,
    paymentId: payment._id,
    caseId: recoveryCase?._id || null
  });

  return {
    payment,
    recoveryCase,
    customer
  };
}
