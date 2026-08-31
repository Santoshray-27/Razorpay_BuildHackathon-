/**
 * backend/src/services/riskEngine.js
 * Deterministic Revenue Risk Engine.
 * Calculates amount at risk, categorizes payment failures, and assigns initial risk levels
 * purely through deterministic business logic independently of any downstream AI models.
 */

import { env } from '../config/env.js';

// Categorized failure reason map
export const FAILURE_REASON_CATEGORIES = {
  insufficient_funds: { category: 'BALANCE', recoverable: true, defaultRisk: 'medium' },
  customer_insufficient_funds: { category: 'BALANCE', recoverable: true, defaultRisk: 'medium' },
  authentication_failed: { category: 'AUTH_CHALLENGE', recoverable: true, defaultRisk: 'low' },
  otp_expired: { category: 'AUTH_TIMEOUT', recoverable: true, defaultRisk: 'low' },
  gateway_timeout: { category: 'NETWORK_TECHNICAL', recoverable: true, defaultRisk: 'low' },
  network_error: { category: 'NETWORK_TECHNICAL', recoverable: true, defaultRisk: 'low' },
  card_declined: { category: 'CARD_DECLINE', recoverable: true, defaultRisk: 'medium' },
  do_not_honor: { category: 'CARD_DECLINE', recoverable: true, defaultRisk: 'high' },
  card_expired: { category: 'CARD_INVALID', recoverable: true, defaultRisk: 'high' },
  invalid_card_details: { category: 'CARD_INVALID', recoverable: false, defaultRisk: 'high' },
  suspected_fraud: { category: 'SECURITY_FRAUD', recoverable: false, defaultRisk: 'high' },
  blacklisted: { category: 'SECURITY_FRAUD', recoverable: false, defaultRisk: 'high' }
};

/**
 * Evaluates risk level and recovery eligibility for a failed payment.
 * @param {object} payment - Payment model or normalized object
 * @param {number} [retryCount=0]
 * @returns {object} { isEligible, riskLevel, amountAtRiskPaise, failureCategory, recoveryWindowHours, reason }
 */
export function evaluatePaymentRisk(payment, retryCount = 0) {
  const amountPaise = Number(payment.amountPaise) || 0;
  const rawReason = (payment.failureReason || 'unknown').toLowerCase().trim();
  const matchedReason = FAILURE_REASON_CATEGORIES[rawReason] || {
    category: 'UNKNOWN_FAILURE',
    recoverable: true,
    defaultRisk: 'medium'
  };

  const isHighValue = amountPaise >= env.HIGH_VALUE_THRESHOLD_PAISE; // Default ₹10,000 (1,000,000 paise)
  const isHighRetry = retryCount >= 2;

  let riskLevel = matchedReason.defaultRisk;

  // Elevate risk level for high monetary exposure or repeated failures
  if (isHighValue || isHighRetry || !matchedReason.recoverable) {
    riskLevel = 'high';
  } else if (riskLevel === 'low' && amountPaise > 200000) {
    // Amounts > ₹2,000 bump low to medium
    riskLevel = 'medium';
  }

  const recoveryWindowHours = 168; // 7 days standard recovery window
  const recoveryWindowEndsAt = new Date(Date.now() + recoveryWindowHours * 60 * 60 * 1000);

  return {
    isEligible: matchedReason.recoverable && retryCount < 3,
    riskLevel,
    amountAtRiskPaise: amountPaise,
    failureCategory: matchedReason.category,
    isHighValue,
    recoveryWindowHours,
    recoveryWindowEndsAt,
    explanation: `Initial deterministic risk score assigned as [${riskLevel.toUpperCase()}] based on failure reason '${rawReason}' and amount ₹${(amountPaise / 100).toFixed(2)}.`
  };
}
