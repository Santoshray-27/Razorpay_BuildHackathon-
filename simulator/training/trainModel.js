/**
 * simulator/training/trainModel.js
 * Logistic Regression Model Trainer.
 * Fits binary cross-entropy loss on synthetic data and writes versioned weights to backend.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSyntheticTransactions } from '../generator/syntheticDataGenerator.js';
import { extractFeatures } from '../../backend/src/ai/model/featurePreprocessor.js';
import { trainLogisticRegression, evaluateClassification } from './logisticRegression.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sigmoid(z) {
  return 1 / (1 + Math.exp(-Math.max(-25, Math.min(25, z))));
}

export function trainAndPersistModel({ seed = 42, count = 10000 } = {}) {
  // 1. Generate synthetic data
  const data = generateSyntheticTransactions({ count, seed, saveToFile: false });
  const failedOnly = data.filter((d) => d.paymentStatus === 'failed');

  // 2. Feature Extraction
  const X = [];
  const y = [];

  failedOnly.forEach((row) => {
    const features = extractFeatures({
      payment: {
        amountPaise: row.amountPaise,
        failureReason: row.failureReason,
        paymentMethod: row.paymentMethod
      },
      customerContext: {
        successfulPaymentsCount: row.successfulPaymentsCount,
        failedPaymentsCount: row.failedPaymentsCount,
        recentSuccessRate: (row.successfulPaymentsCount / (row.successfulPaymentsCount + row.failedPaymentsCount || 1)),
        daysSinceLastSuccess: 5,
        subscriptionStatus: row.subscriptionStatus,
        loyaltySegment: row.loyaltySegment,
        optedOutOfRecovery: row.optedOutOfRecovery
      },
      retryCount: 0
    });

    X.push(features);
    y.push(row.recovered_after_eligible_action);
  });

  // 3. 80/20 Train / Held-out Test Split
  const splitIndex = Math.floor(X.length * 0.80);
  const X_train = X.slice(0, splitIndex);
  const y_train = y.slice(0, splitIndex);
  const X_test = X.slice(splitIndex);
  const y_test = y.slice(splitIndex);

  // 4. Train Model
  const { weights, bias } = trainLogisticRegression(X_train, y_train, {
    learningRate: 0.05,
    epochs: 150,
    lambdaL2: 0.001
  });

  // Compute test probabilities
  const y_prob_test = X_test.map((features) => {
    let z = bias;
    for (let i = 0; i < features.length; i++) {
      z += weights[i] * features[i];
    }
    return sigmoid(z);
  });

  const testMetrics = evaluateClassification(y_test, y_prob_test);

  const modelArtifact = {
    modelVersion: 'v1.1-trained-logistic-regression',
    trainedAt: new Date().toISOString(),
    trainingSampleCount: X_train.length,
    testSampleCount: X_test.length,
    weights,
    bias,
    metrics: testMetrics
  };

  // 5. Persist weights into backend AI model directory
  const targetDir = path.resolve(__dirname, '../../backend/src/ai/model');
  const targetPath = path.join(targetDir, 'trainedWeights.json');
  fs.writeFileSync(targetPath, JSON.stringify(modelArtifact, null, 2), 'utf-8');

  return modelArtifact;
}

// Auto-run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = trainAndPersistModel();
  console.log('✨ Model trained successfully:', result.modelVersion, JSON.stringify(result.metrics, null, 2));
}
