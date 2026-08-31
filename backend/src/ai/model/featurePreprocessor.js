/**
 * backend/src/ai/model/featurePreprocessor.js
 * Feature extraction and normalization pipeline for the Recovery Probability Model.
 * Extracts 10 continuous numerical features from payment attributes and customer context.
 */

export const FEATURE_NAMES = [
  'amount_band_norm',
  'is_insufficient_funds',
  'is_network_error',
  'is_card_declined',
  'is_upi_method',
  'past_success_ratio',
  'recent_success_rate',
  'retry_count_penalty',
  'is_vip_or_active_sub',
  'is_opted_out'
];

export function encodeAmountBand(amountPaise) {
  return Math.min(1.0, Math.max(0.0, Number(amountPaise) / 5000000));
}

/**
 * Extracts 10 numerical features for logistic regression inference.
 * @param {object} params
 * @param {object} params.payment - Payment model instance
 * @param {object} params.customerContext - Aggregated customer history
 * @param {number} [params.retryCount=0]
 * @returns {number[]} Array of 10 float values
 */
export function extractFeatures({
  payment = {},
  customerContext = {},
  retryCount = 0
} = {}) {
  // Feature 1: Normalized Amount Band (0.0 to 1.0, scaled relative to ₹50,000 max)
  const amountPaise = Number(payment.amountPaise) || 0;
  const amountBandNorm = encodeAmountBand(amountPaise);

  // Feature 2: Is Insufficient Funds Failure (Binary 0 or 1)
  const isInsufficientFunds = payment.failureReason === 'insufficient_funds' ? 1.0 : 0.0;

  // Feature 3: Is Network / Timeout Error (Binary 0 or 1)
  const isNetworkError = payment.failureReason === 'network_error' ? 1.0 : 0.0;

  // Feature 4: Is Card Declined / Issuer Block (Binary 0 or 1)
  const isCardDeclined = payment.failureReason === 'card_declined' ? 1.0 : 0.0;

  // Feature 5: Is UPI Payment Method (Binary 0 or 1)
  const isUpiMethod = payment.paymentMethod === 'upi' ? 1.0 : 0.0;

  // Feature 6: Historical Success Ratio (Past successes vs total past payments)
  const successes = Number(customerContext.successfulPaymentsCount) || 0;
  const failures = Number(customerContext.failedPaymentsCount) || 0;
  const total = successes + failures;
  const pastSuccessRatio = total > 0 ? successes / total : 0.5;

  // Feature 7: Recent Success Rate (from last 10 attempts)
  const recentSuccessRate = customerContext.recentSuccessRate !== undefined
    ? Number(customerContext.recentSuccessRate)
    : pastSuccessRatio;

  // Feature 8: Retry Count Penalty (Normalized retry exhaustion 0.0 to 1.0)
  const retryCountPenalty = Math.min(1.0, Number(retryCount) / 3.0);

  // Feature 9: VIP or Active Subscription status (Binary 0 or 1)
  const isVipOrActiveSub = (customerContext.subscriptionStatus === 'active' || customerContext.loyaltySegment === 'vip') ? 1.0 : 0.0;

  // Feature 10: Opted Out of Recovery (Binary 0 or 1)
  const isOptedOut = customerContext.optedOutOfRecovery ? 1.0 : 0.0;

  return [
    amountBandNorm,
    isInsufficientFunds,
    isNetworkError,
    isCardDeclined,
    isUpiMethod,
    pastSuccessRatio,
    recentSuccessRate,
    retryCountPenalty,
    isVipOrActiveSub,
    isOptedOut
  ];
}
