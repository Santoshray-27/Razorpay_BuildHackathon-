/**
 * backend/src/services/recoveryService.js
 * Business logic for RecoveryCase querying, detail timeline assembly, state transitions,
 * AI analysis, deterministic policy evaluation, and Human-in-the-loop approvals.
 */

import { RecoveryCase } from '../models/RecoveryCase.js';
import { Payment } from '../models/Payment.js';
import { Customer } from '../models/Customer.js';
import { buildCustomerContext } from './customerContextService.js';
import { getCaseAuditTimeline, logAuditEvent } from './auditService.js';
import { isValidTransition } from '../workflows/recoveryStateMachine.js';
import { predictRecoveryProbability } from '../ai/model/probabilityModel.js';
import { getRecoveryRecommendation } from '../providers/geminiProvider.js';
import { evaluatePolicy } from '../policies/recoveryPolicy.js';

/**
 * Retrieves paginated recovery cases scoped to merchant.
 */
export async function getMerchantRecoveryCases(merchantId, {
  status,
  riskLevel,
  page = 1,
  limit = 20
} = {}) {
  const query = { merchantId };
  if (status) query.status = status;
  if (riskLevel) query.riskLevel = riskLevel;

  const skip = (page - 1) * limit;

  const [cases, totalCount] = await Promise.all([
    RecoveryCase.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('paymentId')
      .populate('customerId', 'name email phoneMasked subscriptionStatus optedOutOfRecovery')
      .lean(),
    RecoveryCase.countDocuments(query)
  ]);

  return {
    cases,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit) || 1
    }
  };
}

/**
 * Retrieves a single recovery case with customer context, payment details, and full audit timeline.
 */
export async function getRecoveryCaseById(merchantId, caseId) {
  const recoveryCase = await RecoveryCase.findOne({ _id: caseId, merchantId })
    .populate('paymentId')
    .populate('customerId')
    .lean();

  if (!recoveryCase) {
    const error = new Error('Recovery case not found');
    error.statusCode = 404;
    error.code = 'RECOVERY_CASE_NOT_FOUND';
    throw error;
  }

  // 1. Build Privacy-Safe Customer Context Aggregates
  const customerContext = await buildCustomerContext(
    merchantId,
    recoveryCase.customerId?._id || recoveryCase.customerId
  );

  // 2. Fetch Full Chronological Audit Timeline
  const auditTimeline = await getCaseAuditTimeline(merchantId, caseId);

  return {
    ...recoveryCase,
    customerContext,
    auditTimeline
  };
}

/**
 * Retrieves cases waiting for Human-in-the-Loop review.
 */
export async function getPendingApprovals(merchantId, { page = 1, limit = 20 } = {}) {
  return getMerchantRecoveryCases(merchantId, {
    status: 'pending_approval',
    page,
    limit
  });
}

/**
 * Executes a verified state transition on a recovery case.
 */
export async function transitionCaseStatus(merchantId, caseId, newStatus, {
  actor = 'system',
  correlationId,
  reason,
  metadata = {}
} = {}) {
  const recoveryCase = await RecoveryCase.findOne({ _id: caseId, merchantId });
  if (!recoveryCase) {
    const error = new Error('Recovery case not found');
    error.statusCode = 404;
    error.code = 'RECOVERY_CASE_NOT_FOUND';
    throw error;
  }

  const previousStatus = recoveryCase.status;
  if (!isValidTransition(previousStatus, newStatus)) {
    const error = new Error(`Invalid state transition from '${previousStatus}' to '${newStatus}'`);
    error.statusCode = 400;
    error.code = 'INVALID_STATE_TRANSITION';
    throw error;
  }

  recoveryCase.status = newStatus;
  if (newStatus === 'recovered') {
    recoveryCase.recoveredAmountPaise = recoveryCase.amountAtRiskPaise;
    recoveryCase.recoveredAt = new Date();
  }

  await recoveryCase.save();

  // Record audit log entry
  await logAuditEvent({
    merchantId,
    recoveryCaseId: caseId,
    paymentId: recoveryCase.paymentId,
    correlationId,
    eventType: 'CASE_STATUS_CHANGED',
    actor,
    message: `Recovery Case transitioned from [${previousStatus.toUpperCase()}] to [${newStatus.toUpperCase()}]. ${reason || ''}`.trim(),
    metadata: {
      previousStatus,
      newStatus,
      ...metadata
    }
  });

  return recoveryCase;
}

/**
 * Runs Phase 5 AI Analysis on a RecoveryCase.
 */
export async function analyzeRecoveryCase(merchantId, caseId, correlationId) {
  const recoveryCase = await RecoveryCase.findOne({ _id: caseId, merchantId }).populate('paymentId');
  if (!recoveryCase) {
    const error = new Error('Recovery case not found');
    error.statusCode = 404;
    error.code = 'RECOVERY_CASE_NOT_FOUND';
    throw error;
  }

  recoveryCase.status = 'analyzing';
  await recoveryCase.save();

  await logAuditEvent({
    merchantId,
    recoveryCaseId: caseId,
    paymentId: recoveryCase.paymentId?._id,
    correlationId,
    eventType: 'AI_ANALYSIS_REQUESTED',
    actor: 'system',
    message: `Initiated hybrid intelligence analysis for Case [${caseId}]`,
    metadata: { retryCount: recoveryCase.retryCount }
  });

  const customerContext = await buildCustomerContext(merchantId, recoveryCase.customerId);

  const probResult = predictRecoveryProbability({
    payment: recoveryCase.paymentId,
    customerContext,
    retryCount: recoveryCase.retryCount
  });

  const aiResult = await getRecoveryRecommendation({
    payment: recoveryCase.paymentId,
    customerContext,
    calculatedProbability: probResult.recovery_probability,
    retryCount: recoveryCase.retryCount,
    correlationId
  });

  const recommendation = aiResult.recommendation;

  recoveryCase.recommendationHistory.push({
    timestamp: new Date(),
    source: aiResult.source,
    recommendation
  });

  recoveryCase.latestRecommendation = recommendation;
  recoveryCase.recoveryProbability = recommendation.recovery_probability;
  recoveryCase.status = 'recommended';
  await recoveryCase.save();

  const eventType = aiResult.source === 'GEMINI' ? 'AI_RECOMMENDATION_VALIDATED' : 'AI_FALLBACK_USED';
  await logAuditEvent({
    merchantId,
    recoveryCaseId: caseId,
    paymentId: recoveryCase.paymentId?._id,
    correlationId,
    eventType,
    actor: 'ai',
    message: `[${aiResult.source}] recommended '${recommendation.recommended_action}'. Reason: ${recommendation.reason}`,
    metadata: {
      source: aiResult.source,
      modelVersion: aiResult.modelVersion,
      recommendation
    }
  });

  return recoveryCase;
}

/**
 * Runs Phase 6 Policy Engine on a RecoveryCase.
 */
export async function evaluatePolicyForCase(merchantId, caseId, correlationId) {
  const recoveryCase = await RecoveryCase.findOne({ _id: caseId, merchantId }).populate('paymentId');
  if (!recoveryCase) {
    const error = new Error('Recovery case not found');
    error.statusCode = 404;
    error.code = 'RECOVERY_CASE_NOT_FOUND';
    throw error;
  }

  const customerContext = await buildCustomerContext(merchantId, recoveryCase.customerId);

  // Evaluate deterministic policy
  const policyResult = evaluatePolicy({
    payment: recoveryCase.paymentId,
    recoveryCase,
    customerContext,
    recommendation: recoveryCase.latestRecommendation || {}
  });

  recoveryCase.latestPolicyDecision = policyResult;

  if (policyResult.decision === 'APPROVED') {
    recoveryCase.status = 'approved';
  } else if (policyResult.decision === 'PENDING_APPROVAL') {
    recoveryCase.status = 'pending_approval';
  } else if (policyResult.decision === 'STOPPED') {
    recoveryCase.status = 'stopped';
  }

  await recoveryCase.save();

  // Audit log: Policy Decision
  await logAuditEvent({
    merchantId,
    recoveryCaseId: caseId,
    paymentId: recoveryCase.paymentId?._id,
    correlationId,
    eventType: 'POLICY_DECISION_EVALUATED',
    actor: 'policy_engine',
    message: `Policy Decision: [${policyResult.decision}] (${policyResult.finalAction || 'NONE'}). Reason: ${policyResult.reason}`,
    metadata: {
      decision: policyResult.decision,
      triggeredRules: policyResult.triggeredRules,
      policyVersion: policyResult.policyVersion
    }
  });

  return { recoveryCase, policyResult };
}

/**
 * Human Review: Approves a case in PENDING_APPROVAL status.
 * Approval makes the case eligible for scheduling; it does NOT directly execute payment.
 */
export async function approveCase(merchantId, caseId, reviewer, reason = '', correlationId) {
  const recoveryCase = await RecoveryCase.findOne({ _id: caseId, merchantId });
  if (!recoveryCase) {
    const error = new Error('Recovery case not found');
    error.statusCode = 404;
    error.code = 'RECOVERY_CASE_NOT_FOUND';
    throw error;
  }

  if (recoveryCase.status !== 'pending_approval') {
    const error = new Error(`Cannot approve case in status '${recoveryCase.status}'. Must be in 'pending_approval'.`);
    error.statusCode = 400;
    error.code = 'INVALID_STATUS_FOR_APPROVAL';
    throw error;
  }

  recoveryCase.status = 'approved';
  recoveryCase.approvedBy = reviewer.id || reviewer._id?.toString() || reviewer.name || 'operator';
  recoveryCase.approvedAt = new Date();
  recoveryCase.approvalReason = reason || 'Approved by operator';
  await recoveryCase.save();

  // Record reviewer audit log
  await logAuditEvent({
    merchantId,
    recoveryCaseId: caseId,
    paymentId: recoveryCase.paymentId,
    correlationId,
    eventType: 'HUMAN_APPROVAL_GRANTED',
    actor: 'human',
    message: `Reviewer ${reviewer.name} (${reviewer.role}) approved recovery action. Reason: ${reason || 'Approved by operator'}`,
    metadata: {
      reviewerId: reviewer.id,
      reviewerRole: reviewer.role,
      reason
    }
  });

  return recoveryCase;
}

/**
 * Human Review: Rejects a case in PENDING_APPROVAL status.
 */
export async function rejectCase(merchantId, caseId, reviewer, reason = '', correlationId) {
  const recoveryCase = await RecoveryCase.findOne({ _id: caseId, merchantId });
  if (!recoveryCase) {
    const error = new Error('Recovery case not found');
    error.statusCode = 404;
    error.code = 'RECOVERY_CASE_NOT_FOUND';
    throw error;
  }

  recoveryCase.status = 'stopped';
  await recoveryCase.save();

  await logAuditEvent({
    merchantId,
    recoveryCaseId: caseId,
    paymentId: recoveryCase.paymentId,
    correlationId,
    eventType: 'HUMAN_APPROVAL_REJECTED',
    actor: 'human',
    message: `Reviewer ${reviewer.name} rejected recovery case. Reason: ${reason || 'Rejected by operator'}`,
    metadata: {
      reviewerId: reviewer.id,
      reviewerRole: reviewer.role,
      reason
    }
  });

  return recoveryCase;
}
