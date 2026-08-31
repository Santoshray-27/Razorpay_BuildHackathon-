/**
 * backend/src/policies/recoveryPolicy.js
 * Deterministic Financial & Operational Policy Engine.
 * Sole authority for action approvals, blocks, and routing to human reviewer queue.
 * Evaluates rules in strict deterministic priority order (first matching rule applies).
 */

import { policyConfig } from './policyConfig.js';

export const POLICY_DECISIONS = {
  APPROVED: 'APPROVED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  STOPPED: 'STOPPED',
  BLOCKED: 'BLOCKED',
  IGNORED: 'IGNORED'
};

/**
 * Pure policy evaluation function.
 * @param {object} params
 * @param {object} params.payment
 * @param {object} params.recoveryCase
 * @param {object} params.customerContext
 * @param {object} params.recommendation
 * @param {object} [params.config=policyConfig]
 * @returns {object} { decision, finalAction, scheduledAfterHours, policyVersion, triggeredRules, reason }
 */
export function evaluatePolicy({
  payment = {},
  recoveryCase = {},
  customerContext = {},
  recommendation = {},
  config = policyConfig
}) {
  const triggeredRules = [];
  const amountPaise = Number(payment.amountPaise) || Number(recoveryCase.amountAtRiskPaise) || 0;
  const retryCount = Number(recoveryCase.retryCount) || 0;
  const reminderCount = Number(recoveryCase.reminderCount) || 0;
  const recommendedAction = recommendation.recommended_action || recoveryCase.latestRecommendation?.recommended_action || 'HUMAN_REVIEW';
  const confidence = Number(recommendation.confidence) || Number(recoveryCase.latestRecommendation?.confidence) || 0.85;
  const probability = Number(recommendation.recovery_probability) || Number(recoveryCase.recoveryProbability) || Number(recoveryCase.latestRecommendation?.recovery_probability) || 0;

  // RULE 1: Payment or Case already recovered -> STOP
  if (payment.status === 'recovered' || payment.status === 'captured' || recoveryCase.status === 'recovered') {
    triggeredRules.push('RULE_1_ALREADY_RECOVERED');
    return {
      decision: POLICY_DECISIONS.STOPPED,
      finalAction: 'STOP_RECOVERY',
      policyVersion: config.version,
      triggeredRules,
      reason: 'Payment has already been successfully captured/recovered. No further action permitted.'
    };
  }

  // RULE 2: Customer completed payment via another method -> STOP
  if (customerContext.completedViaAlternativeMethod) {
    triggeredRules.push('RULE_2_PAID_VIA_ALTERNATIVE_METHOD');
    return {
      decision: POLICY_DECISIONS.STOPPED,
      finalAction: 'STOP_RECOVERY',
      policyVersion: config.version,
      triggeredRules,
      reason: 'Customer completed payment via another method. Recovery stopped.'
    };
  }

  // RULE 3: Customer opted out of recovery -> STOP
  if (customerContext.optedOutOfRecovery) {
    triggeredRules.push('RULE_3_CUSTOMER_OPTED_OUT');
    return {
      decision: POLICY_DECISIONS.STOPPED,
      finalAction: 'STOP_RECOVERY',
      policyVersion: config.version,
      triggeredRules,
      reason: 'Customer has explicitly opted out of payment recovery communications.'
    };
  }

  // RULE 4: Recovery window expired -> EXPIRED / STOP
  if (recoveryCase.recoveryWindowEndsAt && new Date(recoveryCase.recoveryWindowEndsAt).getTime() < Date.now()) {
    triggeredRules.push('RULE_4_RECOVERY_WINDOW_EXPIRED');
    return {
      decision: POLICY_DECISIONS.STOPPED,
      finalAction: 'STOP_RECOVERY',
      policyVersion: config.version,
      triggeredRules,
      reason: `Recovery window of ${config.recoveryWindowHours}h expired. Case closed.`
    };
  }

  // RULE 5: Retry count reached limit -> STOP
  if (retryCount >= config.maxRetriesPerCase) {
    triggeredRules.push('RULE_5_MAX_RETRIES_REACHED');
    return {
      decision: POLICY_DECISIONS.STOPPED,
      finalAction: 'STOP_RECOVERY',
      policyVersion: config.version,
      triggeredRules,
      reason: `Maximum retry limit (${config.maxRetriesPerCase}) reached for this case.`
    };
  }

  // RULE 6: Reminder limit reached -> Do not send more reminders
  if (recommendedAction === 'SEND_REMINDER' && reminderCount >= config.maxRemindersPerCase) {
    triggeredRules.push('RULE_6_MAX_REMINDERS_REACHED');
    return {
      decision: POLICY_DECISIONS.PENDING_APPROVAL,
      finalAction: 'HUMAN_REVIEW',
      policyVersion: config.version,
      triggeredRules,
      reason: `Maximum customer reminders limit (${config.maxRemindersPerCase}) reached. Escalated to human review.`
    };
  }

  // RULE 7: Active action lock exists -> Block / Defer
  if (recoveryCase.activeActionLock) {
    triggeredRules.push('RULE_7_ACTIVE_ACTION_LOCK');
    return {
      decision: POLICY_DECISIONS.BLOCKED,
      finalAction: null,
      policyVersion: config.version,
      triggeredRules,
      reason: 'An active recovery action is currently executing on this case. Concurrent execution blocked.'
    };
  }

  // RULE 8: Duplicate webhook / action -> IGNORE
  if (recoveryCase.isDuplicateAction) {
    triggeredRules.push('RULE_8_DUPLICATE_ACTION');
    return {
      decision: POLICY_DECISIONS.IGNORED,
      finalAction: null,
      policyVersion: config.version,
      triggeredRules,
      reason: 'Duplicate action request ignored.'
    };
  }

  // RULE 9: Unsupported / Malformed recommendation -> HUMAN_REVIEW
  const validActions = ['RETRY_LATER', 'SEND_REMINDER', 'OFFER_ALTERNATIVE_METHOD', 'HUMAN_REVIEW', 'STOP_RECOVERY'];
  if (!validActions.includes(recommendedAction) || recommendedAction === 'HUMAN_REVIEW') {
    triggeredRules.push('RULE_9_UNSUPPORTED_OR_EXPLICIT_REVIEW');
    return {
      decision: POLICY_DECISIONS.PENDING_APPROVAL,
      finalAction: 'HUMAN_REVIEW',
      policyVersion: config.version,
      triggeredRules,
      reason: 'Recommendation is HUMAN_REVIEW or unsupported action type. Human merchant approval required.'
    };
  }

  // RULE 10: High-Value Transaction Threshold -> PENDING_APPROVAL
  if (amountPaise >= config.highValueThresholdPaise) {
    triggeredRules.push('RULE_10_HIGH_VALUE_THRESHOLD_EXCEEDED');
    return {
      decision: POLICY_DECISIONS.PENDING_APPROVAL,
      finalAction: recommendedAction,
      policyVersion: config.version,
      triggeredRules,
      reason: `High value transaction (₹${(amountPaise / 100).toFixed(2)} >= ₹${(config.highValueThresholdPaise / 100).toFixed(2)}) requires merchant operator review.`
    };
  }

  // RULE 11: AI Confidence Below Threshold -> PENDING_APPROVAL
  if (confidence < config.minAutoActionConfidence) {
    triggeredRules.push('RULE_11_LOW_AI_CONFIDENCE');
    return {
      decision: POLICY_DECISIONS.PENDING_APPROVAL,
      finalAction: recommendedAction,
      policyVersion: config.version,
      triggeredRules,
      reason: `AI confidence (${confidence.toFixed(2)}) below required auto threshold (${config.minAutoActionConfidence.toFixed(2)}). Operator review required.`
    };
  }

  // RULE 12: Recovery Probability Below Threshold -> PENDING_APPROVAL
  if (probability < config.minAutoRecoveryProbability) {
    triggeredRules.push('RULE_12_LOW_RECOVERY_PROBABILITY');
    return {
      decision: POLICY_DECISIONS.PENDING_APPROVAL,
      finalAction: recommendedAction,
      policyVersion: config.version,
      triggeredRules,
      reason: `Estimated recovery probability (${probability.toFixed(2)}) below auto threshold (${config.minAutoRecoveryProbability.toFixed(2)}).`
    };
  }

  // RULE 13: Customer Action-Frequency Limit Exceeded -> PENDING_APPROVAL
  if ((customerContext.existingActiveRecoveryCases || 0) >= config.maxCustomerActionsPerDay) {
    triggeredRules.push('RULE_13_CUSTOMER_FREQUENCY_LIMIT');
    return {
      decision: POLICY_DECISIONS.PENDING_APPROVAL,
      finalAction: recommendedAction,
      policyVersion: config.version,
      triggeredRules,
      reason: `Customer has ${customerContext.existingActiveRecoveryCases} active cases (exceeds ${config.maxCustomerActionsPerDay}/day limit).`
    };
  }

  // RULE 14: Retry Delay Invalid or Outside Configured Window -> REVIEW
  if (recommendedAction === 'RETRY_LATER') {
    const delay = Number(recommendation.retry_after_hours) || Number(recoveryCase.latestRecommendation?.retry_after_hours);
    if (!delay || delay < 1 || delay > config.maxRetryDelayHours) {
      triggeredRules.push('RULE_14_INVALID_RETRY_DELAY');
      return {
        decision: POLICY_DECISIONS.PENDING_APPROVAL,
        finalAction: 'HUMAN_REVIEW',
        policyVersion: config.version,
        triggeredRules,
        reason: `Invalid retry delay (${delay}h) outside permitted 1-${config.maxRetryDelayHours}h window.`
      };
    }
  }

  // RULE 15: All checks passed -> APPROVE
  triggeredRules.push(
    'PAYMENT_NOT_RECOVERED',
    'OPT_OUT_NOT_SET',
    'RETRY_LIMIT_OK',
    'CONFIDENCE_OK',
    'AMOUNT_WITHIN_AUTO_LIMIT'
  );

  return {
    decision: POLICY_DECISIONS.APPROVED,
    finalAction: recommendedAction,
    scheduledAfterHours: (recommendedAction === 'RETRY_LATER' ? (recommendation.retry_after_hours || recoveryCase.latestRecommendation?.retry_after_hours) : 0) || 0,
    policyVersion: config.version,
    triggeredRules,
    reason: 'All deterministic financial and operational safety conditions passed.'
  };
}
