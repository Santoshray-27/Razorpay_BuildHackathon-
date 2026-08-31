/**
 * backend/src/ai/model/probabilityModel.js
 * Logistic Regression Recovery Probability Inference Engine.
 * Loads versioned trained weights from trainedWeights.json if available.
 * Generates bounded 0.0 to 1.0 probability scores and explainable feature contributions.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractFeatures, FEATURE_NAMES } from './featurePreprocessor.js';
import { logger } from '../../observability/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MODEL_VERSION = 'v1.1-trained-logistic-regression';

// Default baseline weights
let activeModel = {
  modelVersion: MODEL_VERSION,
  bias: 0.15,
  weights: [
    -0.25, // amount_band_norm
     0.65, // is_insufficient_funds
     0.80, // is_network_error
    -0.60, // is_card_declined
     0.35, // is_upi_method
     0.70, // past_success_ratio
     1.10, // recent_success_rate
    -0.75, // retry_count_penalty
     0.45, // is_vip_or_active_sub
    -2.20  // is_opted_out
  ]
};

// Attempt to load dynamically trained weights if available
try {
  const trainedPath = path.join(__dirname, 'trainedWeights.json');
  if (fs.existsSync(trainedPath)) {
    const raw = fs.readFileSync(trainedPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.weights && parsed.bias !== undefined) {
      activeModel = parsed;
    }
  }
} catch (err) {
  logger.warn('Failed loading trainedWeights.json — using default baseline weights', { error: err.message });
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-Math.max(-25, Math.min(25, z))));
}

/**
 * Predicts recovery probability and extracts explainability factors.
 */
export function predictRecoveryProbability({
  payment = {},
  customerContext = {},
  retryCount = 0
} = {}) {
  // RULE: Customer opt-out strictly forces probability to 0.0
  if (customerContext.optedOutOfRecovery) {
    return {
      recovery_probability: 0.0,
      confidence: 1.0,
      modelVersion: activeModel.modelVersion || MODEL_VERSION,
      topDrivers: ['Customer explicitly opted out of recovery communications'],
      topPositiveDrivers: [],
      topNegativeDrivers: ['Customer explicitly opted out of recovery communications']
    };
  }

  const features = extractFeatures({ payment, customerContext, retryCount });
  const weights = activeModel.weights;

  let z = activeModel.bias;
  const contributions = [];

  for (let i = 0; i < features.length; i++) {
    const contribution = features[i] * (weights[i] || 0);
    z += contribution;
    contributions.push({
      feature: FEATURE_NAMES[i],
      value: features[i],
      contribution: Number(contribution.toFixed(4))
    });
  }

  const rawProbability = sigmoid(z);
  const clampedProbability = Number(Math.max(0.0, Math.min(1.0, rawProbability)).toFixed(4));

  // Extract top explainability factors
  const sortedContributions = [...contributions].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const topPositive = sortedContributions
    .filter((c) => c.contribution > 0.05)
    .slice(0, 3)
    .map((c) => `${c.feature} (+${c.contribution})`);

  const topNegative = sortedContributions
    .filter((c) => c.contribution < -0.05)
    .slice(0, 3)
    .map((c) => `${c.feature} (${c.contribution})`);

  const topDrivers = [...topPositive, ...topNegative];
  if (topDrivers.length === 0) topDrivers.push('Baseline transaction liquidity profile');

  return {
    recovery_probability: clampedProbability,
    confidence: Number(Math.min(0.95, 0.65 + Math.abs(clampedProbability - 0.5) * 0.6).toFixed(2)),
    modelVersion: activeModel.modelVersion || MODEL_VERSION,
    topDrivers,
    topPositiveDrivers: topPositive,
    topNegativeDrivers: topNegative
  };
}
