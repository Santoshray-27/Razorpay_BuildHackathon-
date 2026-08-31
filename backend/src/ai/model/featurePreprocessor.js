/**
 * backend/src/ai/model/featurePreprocessor.js
 * Transforms raw customer context and payment properties into standardized numerical feature vectors
 * for the Logistic Regression Recovery Probability Model.
 */

// Failure Reason Weight Encoding (Latent recoverability weights)
export const FAILURE_REASON_WEIGHTS = {
  insufficient_funds: 0.75,
  customer_insufficient_funds: 0.75,
  authentication_failed: 0.65,
  otp_expired: 0.60,
  gateway_timeout: 0.55,
  network_error: 0.50,
  card_declined: 0.35,
  do_not_honor: 0.20,
  card_expired: 0.15,
  invalid_card_details: 0.05,
  suspected_fraud: 0.0,
  blacklisted: 0.0
};

// Payment Method Recoverability Weights
export const PAYMENT_METHOD_WEIGHTS = {
  upi: 0.70,
  card: 0.60,
  netbanking: 0.50,
  wallet: 0.40,
  unknown: 0.30
};

/**
 * Encodes amount into a normalized 0-1 continuous band.
 * Low ticket (<₹1000) -> higher natural re-attempt willingness.
 */
export function encodeAmountBand(amountPaise) {
  const rupees = (Number(amountPaise) || 0) / 100;
  if (rupees <= 1000) return 0.9;
  if (rupees <= 5000) return 0.7;
  if (rupees <= 10000) return 0.5;
  if (rupees <= 25000) return 0.3;
  return 0.1;
}

/**
 * Extracts and normalizes numerical feature vector from case, payment, and customer context.
 * @param {object} params
 * @returns {number[]} Normalized feature vector
 */
export function extractFeatures({
  payment = {},
  customerContext = {},
  retryCount = 0
}) {
  const amountBand = encodeAmountBand(payment.amountPaise);
  
  const rawFailure = (payment.failureReason || 'unknown').toLowerCase().trim();
  const failureReasonWeight = FAILURE_REASON_WEIGHTS[rawFailure] !== undefined
    ? FAILURE_REASON_WEIGHTS[rawFailure]
    : 0.40;

  const rawMethod = (payment.paymentMethod || 'card').toLowerCase().trim();
  const paymentMethodWeight = PAYMENT_METHOD_WEIGHTS[rawMethod] || 0.40;

  const prevSuccessCount = Math.min(Number(customerContext.successfulPaymentsCount) || 0, 10) / 10;
  const prevFailedCount = Math.min(Number(customerContext.failedPaymentsCount) || 0, 10) / 10;
  const recentSuccessRate = Number(customerContext.recentSuccessRate) || 0;

  const daysSinceLastSuccess = customerContext.daysSinceLastSuccess !== null && customerContext.daysSinceLastSuccess !== undefined
    ? Math.max(0, 1 - Math.min(customerContext.daysSinceLastSuccess, 90) / 90)
    : 0.5; // Neutral if no history

  const retryPenalty = Math.max(0, 1 - (retryCount * 0.35));
  
  const subscriptionWeight = customerContext.subscriptionStatus === 'active' ? 0.8
    : customerContext.subscriptionStatus === 'past_due' ? 0.4
    : 0.5;

  const optOutPenalty = customerContext.optedOutOfRecovery ? 0.0 : 1.0;

  return [
    amountBand,              // x0
    failureReasonWeight,     // x1
    paymentMethodWeight,     // x2
    prevSuccessCount,        // x3
    prevFailedCount,         // x4
    recentSuccessRate,       // x5
    daysSinceLastSuccess,    // x6
    retryPenalty,            // x7
    subscriptionWeight,      // x8
    optOutPenalty            // x9
  ];
}
