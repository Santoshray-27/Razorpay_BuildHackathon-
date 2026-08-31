/**
 * backend/tests/probability.test.js
 * Unit tests for feature preprocessing and Logistic Regression probability model.
 */

import { extractFeatures, encodeAmountBand } from '../src/ai/model/featurePreprocessor.js';
import { predictRecoveryProbability, MODEL_VERSION } from '../src/ai/model/probabilityModel.js';

describe('Phase 4 — Recovery Probability Model (Logistic Regression)', () => {
  test('Feature Preprocessor - should extract 10 normalized features', () => {
    const payment = {
      amountPaise: 499900,
      failureReason: 'insufficient_funds',
      paymentMethod: 'card'
    };

    const customerContext = {
      successfulPaymentsCount: 5,
      failedPaymentsCount: 1,
      recentSuccessRate: 0.83,
      daysSinceLastSuccess: 10,
      subscriptionStatus: 'active',
      optedOutOfRecovery: false
    };

    const features = extractFeatures({ payment, customerContext, retryCount: 0 });
    expect(features.length).toBe(10);
    features.forEach((val) => {
      expect(typeof val).toBe('number');
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    });
  });

  test('Probability Model - Output must always be clamped strictly between 0.0 and 1.0', () => {
    const payment = { amountPaise: 499900, failureReason: 'insufficient_funds', paymentMethod: 'card' };
    const customerContext = { successfulPaymentsCount: 3, failedPaymentsCount: 0, recentSuccessRate: 1.0 };

    const result = predictRecoveryProbability({ payment, customerContext, retryCount: 0 });

    expect(result.recovery_probability).toBeGreaterThanOrEqual(0.0);
    expect(result.recovery_probability).toBeLessThanOrEqual(1.0);
    expect(result.confidence).toBeGreaterThanOrEqual(0.0);
    expect(result.confidence).toBeLessThanOrEqual(1.0);
    expect(result.modelVersion).toBe(MODEL_VERSION);
    expect(result.topDrivers.length).toBeGreaterThan(0);
  });

  test('Probability Model - Customer opt-out must return strictly 0.0 probability', () => {
    const payment = { amountPaise: 100000, failureReason: 'insufficient_funds', paymentMethod: 'upi' };
    const customerContext = {
      successfulPaymentsCount: 10,
      recentSuccessRate: 1.0,
      optedOutOfRecovery: true
    };

    const result = predictRecoveryProbability({ payment, customerContext, retryCount: 0 });
    expect(result.recovery_probability).toBe(0.0);
    expect(result.confidence).toBe(1.0);
  });

  test('Probability Model - Good customer history yields significantly higher probability than repeat declines', () => {
    const loyalCustomer = predictRecoveryProbability({
      payment: { amountPaise: 499900, failureReason: 'insufficient_funds', paymentMethod: 'card' },
      customerContext: { successfulPaymentsCount: 8, failedPaymentsCount: 0, recentSuccessRate: 1.0, subscriptionStatus: 'active' },
      retryCount: 0
    });

    const riskyCustomer = predictRecoveryProbability({
      payment: { amountPaise: 5000000, failureReason: 'card_declined', paymentMethod: 'card' },
      customerContext: { successfulPaymentsCount: 0, failedPaymentsCount: 5, recentSuccessRate: 0.0, subscriptionStatus: 'none' },
      retryCount: 2
    });

    expect(loyalCustomer.recovery_probability).toBeGreaterThan(riskyCustomer.recovery_probability);
  });
});
