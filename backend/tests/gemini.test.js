/**
 * backend/tests/gemini.test.js
 * Integration tests for AI Zod Schema, Circuit Breaker, Fallback Engine, and AI Analysis Endpoint.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Payment } from '../src/models/Payment.js';
import { RecoveryCase } from '../src/models/RecoveryCase.js';
import { RecoveryRecommendationSchema } from '../src/ai/recoverySchema.js';
import { getFallbackRecommendation } from '../src/ai/fallbackRecommendation.js';
import { geminiCircuitBreaker } from '../src/ai/circuitBreaker.js';
import { env } from '../src/config/env.js';

describe('Phase 5 — Gemini Agent, Zod Validation & Fallback', () => {
  let authToken = '';
  let testCaseId = '';
  const merchantId = 'merch_gemini_test';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
    await User.deleteMany({ merchantId });
    await Payment.deleteMany({ merchantId });
    await RecoveryCase.deleteMany({ merchantId });

    // Register test merchant
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Gemini Test Merchant',
        email: 'gemini_test@test.com',
        password: 'Password12345!',
        role: 'merchant_admin',
        merchantId
      });
    authToken = reg.body.data.token;

    // Create payment & recovery case
    const payment = await Payment.create({
      merchantId,
      provider: 'razorpay',
      providerPaymentId: 'pay_gemini_test_01',
      amountPaise: 499900,
      currency: 'INR',
      status: 'failed',
      failureReason: 'insufficient_funds',
      executionMode: 'MOCK_DEMO'
    });

    const recoveryCase = await RecoveryCase.create({
      merchantId,
      paymentId: payment._id,
      amountAtRiskPaise: 499900,
      currency: 'INR',
      riskLevel: 'medium',
      status: 'detected',
      failureReason: 'insufficient_funds',
      executionMode: 'MOCK_DEMO'
    });

    testCaseId = recoveryCase._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({ merchantId });
    await Payment.deleteMany({ merchantId });
    await RecoveryCase.deleteMany({ merchantId });
    await mongoose.disconnect();
  });

  test('Zod Schema - Accepts valid recommendation payload', () => {
    const validPayload = {
      risk: 'medium',
      recovery_probability: 0.78,
      recommended_action: 'RETRY_LATER',
      retry_after_hours: 6,
      confidence: 0.85,
      reason: 'Customer has strong payment history; insufficient funds likely temporary.'
    };

    const parsed = RecoveryRecommendationSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  test('Zod Schema - Rejects RETRY_LATER if retry_after_hours is missing', () => {
    const invalidPayload = {
      risk: 'medium',
      recovery_probability: 0.78,
      recommended_action: 'RETRY_LATER', // missing retry_after_hours
      confidence: 0.85,
      reason: 'Customer has strong payment history; insufficient funds likely temporary.'
    };

    const parsed = RecoveryRecommendationSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
    expect(parsed.error.issues[0].message).toContain('retry_after_hours is required for RETRY_LATER');
  });

  test('Deterministic Fallback - Returns schema-conforming recommendation', () => {
    const fallback = getFallbackRecommendation({
      payment: { amountPaise: 499900, failureReason: 'insufficient_funds' },
      customerContext: { successfulPaymentsCount: 5, recentSuccessRate: 1.0 },
      retryCount: 0
    });

    const parsed = RecoveryRecommendationSchema.safeParse(fallback);
    expect(parsed.success).toBe(true);
    expect(fallback.recommended_action).toBe('RETRY_LATER');
    expect(fallback.retry_after_hours).toBeDefined();
  });

  test('Circuit Breaker - Trips to OPEN after repeated failures and resets', () => {
    geminiCircuitBreaker.reset();
    expect(geminiCircuitBreaker.isOpen()).toBe(false);

    geminiCircuitBreaker.recordFailure(new Error('Network error 1'));
    geminiCircuitBreaker.recordFailure(new Error('Network error 2'));
    geminiCircuitBreaker.recordFailure(new Error('Network error 3'));

    expect(geminiCircuitBreaker.isOpen()).toBe(true);

    geminiCircuitBreaker.reset();
    expect(geminiCircuitBreaker.isOpen()).toBe(false);
  });

  test('POST /api/recovery/:id/analyze - Successfully performs hybrid analysis and transitions state to RECOMMENDED', async () => {
    const res = await request(app)
      .post(`/api/recovery/${testCaseId}/analyze`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const updatedCase = res.body.data.recoveryCase;

    expect(updatedCase.status).toBe('recommended');
    expect(updatedCase.latestRecommendation).toBeDefined();
    expect(updatedCase.recoveryProbability).toBeGreaterThan(0);
    expect(updatedCase.recommendationHistory.length).toBeGreaterThan(0);
  });
});
