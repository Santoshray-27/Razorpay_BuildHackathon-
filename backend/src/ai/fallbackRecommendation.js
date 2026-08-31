/**
 * backend/src/ai/fallbackRecommendation.js
 * Deterministic rule-based fallback recommendation engine.
 * Generates valid structured output matching RecoveryRecommendationSchema whenever Gemini is disabled,
 * rate limited, times out, or returns invalid JSON.
 */

import { predictRecoveryProbability } from './model/probabilityModel.js';

/**
 * Produces a deterministic fallback recommendation conforming strictly to the Zod schema.
 * @param {object} params
 * @param {object} params.payment
 * @param {object} params.customerContext
 * @param {number} [params.retryCount=0]
 * @param {string} [params.fallbackTriggerReason]
 * @returns {object} Conforming recommendation object
 */
export function getFallbackRecommendation({
  payment = {},
  customerContext = {},
  retryCount = 0,
  fallbackTriggerReason = 'Automated deterministic rule evaluation'
}) {
  const { recovery_probability, confidence } = predictRecoveryProbability({
    payment,
    customerContext,
    retryCount
  });

  const rawReason = (payment.failureReason || 'unknown').toLowerCase().trim();
  const amountPaise = Number(payment.amountPaise) || 0;

  // 1. Opt-out check
  if (customerContext.optedOutOfRecovery) {
    return {
      risk: 'high',
      recovery_probability: 0.0,
      recommended_action: 'STOP_RECOVERY',
      confidence: 1.0,
      reason: 'Customer has explicitly opted out of payment recovery communications.'
    };
  }

  // 2. Max retries exceeded
  if (retryCount >= 3) {
    return {
      risk: 'high',
      recovery_probability: 0.1,
      recommended_action: 'STOP_RECOVERY',
      confidence: 0.95,
      reason: 'Maximum allowed retry attempts (3) have been reached for this payment.'
    };
  }

  // 3. High value threshold (> ₹10,000)
  if (amountPaise >= 1000000) {
    return {
      risk: 'high',
      recovery_probability,
      recommended_action: 'HUMAN_REVIEW',
      confidence: 0.85,
      reason: `High value transaction (₹${(amountPaise / 100).toFixed(2)}) requires merchant operator review before recovery action.`
    };
  }

  // 4. Temporary / Recoverable Balance Issues
  if (rawReason === 'insufficient_funds' || rawReason === 'customer_insufficient_funds') {
    const retryHours = retryCount === 0 ? 6 : 24;
    return {
      risk: recovery_probability >= 0.70 ? 'low' : 'medium',
      recovery_probability,
      recommended_action: 'RETRY_LATER',
      retry_after_hours: retryHours,
      confidence: Math.max(0.75, confidence),
      reason: `Temporary balance constraint detected. Re-attempt scheduled in ${retryHours} hours to allow customer liquidity replenishment.`
    };
  }

  // 5. Authentication / OTP Timeouts
  if (rawReason === 'authentication_failed' || rawReason === 'otp_expired') {
    return {
      risk: 'low',
      recovery_probability,
      recommended_action: 'SEND_REMINDER',
      confidence: 0.85,
      reason: 'Payment failed during checkout authentication. Sending a frictionless payment link reminder to customer.'
    };
  }

  // 6. Technical / Gateway Timeouts
  if (rawReason === 'gateway_timeout' || rawReason === 'network_error') {
    return {
      risk: 'low',
      recovery_probability,
      recommended_action: 'RETRY_LATER',
      retry_after_hours: 2,
      confidence: 0.90,
      reason: 'Transient payment gateway error. Re-attempting automatically after 2 hours cooldown.'
    };
  }

  // 7. Card declines / Card issues -> Suggest alternative payment method
  if (rawReason.includes('card') || rawReason === 'do_not_honor') {
    return {
      risk: 'medium',
      recovery_probability,
      recommended_action: 'OFFER_ALTERNATIVE_METHOD',
      confidence: 0.80,
      reason: 'Card payment was declined by issuing bank. Suggesting UPI or alternative payment method to customer.'
    };
  }

  // 8. General / Uncertain fallback
  return {
    risk: 'medium',
    recovery_probability,
    recommended_action: 'HUMAN_REVIEW',
    confidence: 0.65,
    reason: `Unclassified payment failure reason '${rawReason}'. Routed to merchant review for manual evaluation.`
  };
}
