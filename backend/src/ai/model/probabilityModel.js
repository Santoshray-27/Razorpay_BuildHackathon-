/**
 * backend/src/ai/model/probabilityModel.js
 * Logistic Regression inference engine for payment recovery probability.
 * Uses sigmoid activation: P(recovery) = 1 / (1 + exp(-z)).
 * All probabilities are mathematically bounded and clamped strictly between 0.0 and 1.0.
 */

import { extractFeatures } from './featurePreprocessor.js';

export const MODEL_VERSION = 'v1.0-logistic-regression';

// Calibrated feature weights trained on synthetic payment recovery benchmarks
// Intercept bias + 10 normalized feature coefficients
const WEIGHTS = {
  intercept: -0.65,
  amountBand: 0.85,
  failureReason: 1.45,
  paymentMethod: 0.55,
  prevSuccessCount: 0.90,
  prevFailedPenalty: -0.80,
  recentSuccessRate: 1.10,
  daysSinceLastSuccess: 0.40,
  retryPenalty: 0.75,
  subscriptionWeight: 0.45,
  optOutWeight: 2.20
};

const FEATURE_NAMES = [
  'Amount Band',
  'Failure Reason Recoverability',
  'Payment Method Flexibility',
  'Historical Successful Payments',
  'Historical Failed Payments Penalty',
  'Recent Success Rate',
  'Recency of Last Success',
  'Retry Count Availability',
  'Subscription Active Status',
  'Opt-In Consent Status'
];

/**
 * Standard Sigmoid activation function.
 */
function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Calculates deterministic, explainable recovery probability.
 * @param {object} input
 * @param {object} input.payment
 * @param {object} input.customerContext
 * @param {number} [input.retryCount=0]
 * @returns {object} { recovery_probability, confidence, modelVersion, topDrivers, explanation }
 */
export function predictRecoveryProbability({
  payment = {},
  customerContext = {},
  retryCount = 0
}) {
  // If customer opted out, recovery probability is strictly 0.0
  if (customerContext.optedOutOfRecovery) {
    return {
      recovery_probability: 0.0,
      confidence: 1.0,
      modelVersion: MODEL_VERSION,
      topDrivers: ['Customer explicitly opted out of recovery communications'],
      explanation: 'Customer opted out — recovery probability forced to 0.0.'
    };
  }

  const features = extractFeatures({ payment, customerContext, retryCount });
  const coefficients = [
    WEIGHTS.amountBand,
    WEIGHTS.failureReason,
    WEIGHTS.paymentMethod,
    WEIGHTS.prevSuccessCount,
    WEIGHTS.prevFailedPenalty,
    WEIGHTS.recentSuccessRate,
    WEIGHTS.daysSinceLastSuccess,
    WEIGHTS.retryPenalty,
    WEIGHTS.subscriptionWeight,
    WEIGHTS.optOutWeight
  ];

  // Compute linear combination z = w0 + sum(wi * xi)
  let z = WEIGHTS.intercept;
  const featureContributions = [];

  for (let i = 0; i < features.length; i++) {
    const contribution = features[i] * coefficients[i];
    z += contribution;
    featureContributions.push({
      feature: FEATURE_NAMES[i],
      value: features[i],
      contribution: Number(contribution.toFixed(3))
    });
  }

  // Sigmoid activation
  const rawProb = sigmoid(z);
  
  // Strict clamp between 0.00 and 1.00
  const recovery_probability = Number(Math.max(0.01, Math.min(0.99, rawProb)).toFixed(2));

  // Determine top driving positive and negative factors
  const sortedContributions = [...featureContributions].sort((a, b) => b.contribution - a.contribution);
  const topPositive = sortedContributions.filter(c => c.contribution > 0).slice(0, 2);
  const topNegative = sortedContributions.filter(c => c.contribution < 0).slice(0, 1);

  const topDrivers = [
    ...topPositive.map(p => `+ ${p.feature} (+${p.contribution})`),
    ...topNegative.map(n => `- ${n.feature} (${n.contribution})`)
  ];

  // Model confidence: distance from decision boundary (0.50)
  const confidence = Number(Math.min(0.98, Math.max(0.65, 0.50 + Math.abs(recovery_probability - 0.50))).toFixed(2));

  return {
    recovery_probability,
    confidence,
    modelVersion: MODEL_VERSION,
    topDrivers,
    explanation: `Logistic Regression model estimated ${(recovery_probability * 100).toFixed(0)}% recovery chance based on ${topPositive[0]?.feature || 'payment attributes'}.`
  };
}
