/**
 * backend/tests/policy.test.js
 * Unit and Integration tests for the 15-rule Deterministic Policy Engine and Human-in-the-Loop Approval workflows.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Payment } from '../src/models/Payment.js';
import { RecoveryCase } from '../src/models/RecoveryCase.js';
import { evaluatePolicy } from '../src/policies/recoveryPolicy.js';
import { policyConfig } from '../src/policies/policyConfig.js';
import { env } from '../src/config/env.js';

describe('Phase 6 — Deterministic Policy Engine & Human Approvals', () => {
  let adminToken = '';
  let testCaseId = '';
  const merchantId = 'merch_policy_test';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
    await User.deleteMany({ merchantId });
    await Payment.deleteMany({ merchantId });
    await RecoveryCase.deleteMany({ merchantId });

    // Register admin
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Policy Test Admin',
        email: 'policy_admin@test.com',
        password: 'Password12345!',
        role: 'merchant_admin',
        merchantId
      });
    adminToken = reg.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({ merchantId });
    await Payment.deleteMany({ merchantId });
    await RecoveryCase.deleteMany({ merchantId });
    await mongoose.disconnect();
  });

  // PURE UNIT TESTS FOR POLICY RULES

  test('Rule 1: Already recovered payment must be STOPPED', () => {
    const result = evaluatePolicy({
      payment: { status: 'recovered' },
      recommendation: { recommended_action: 'RETRY_LATER' }
    });
    expect(result.decision).toBe('STOPPED');
    expect(result.triggeredRules).toContain('RULE_1_ALREADY_RECOVERED');
  });

  test('Rule 3: Customer opt-out must be STOPPED', () => {
    const result = evaluatePolicy({
      customerContext: { optedOutOfRecovery: true },
      recommendation: { recommended_action: 'RETRY_LATER' }
    });
    expect(result.decision).toBe('STOPPED');
    expect(result.triggeredRules).toContain('RULE_3_CUSTOMER_OPTED_OUT');
  });

  test('Rule 5: Max retries (3) reached must be STOPPED', () => {
    const result = evaluatePolicy({
      recoveryCase: { retryCount: 3 },
      recommendation: { recommended_action: 'RETRY_LATER' }
    });
    expect(result.decision).toBe('STOPPED');
    expect(result.triggeredRules).toContain('RULE_5_MAX_RETRIES_REACHED');
  });

  test('Rule 10: High-value transaction (>= ₹10,000) must route to PENDING_APPROVAL', () => {
    const result = evaluatePolicy({
      payment: { amountPaise: 1500000 }, // ₹15,000
      recommendation: {
        recommended_action: 'RETRY_LATER',
        confidence: 0.90,
        recovery_probability: 0.85,
        retry_after_hours: 6
      }
    });
    expect(result.decision).toBe('PENDING_APPROVAL');
    expect(result.triggeredRules).toContain('RULE_10_HIGH_VALUE_THRESHOLD_EXCEEDED');
  });

  test('Rule 11: Low AI confidence (< 0.70) must route to PENDING_APPROVAL', () => {
    const result = evaluatePolicy({
      payment: { amountPaise: 499900 },
      recommendation: {
        recommended_action: 'RETRY_LATER',
        confidence: 0.60, // Below 0.70
        recovery_probability: 0.80,
        retry_after_hours: 6
      }
    });
    expect(result.decision).toBe('PENDING_APPROVAL');
    expect(result.triggeredRules).toContain('RULE_11_LOW_AI_CONFIDENCE');
  });

  test('Rule 15: Valid standard case must be APPROVED', () => {
    const result = evaluatePolicy({
      payment: { amountPaise: 499900 },
      recoveryCase: { retryCount: 0 },
      customerContext: { optedOutOfRecovery: false },
      recommendation: {
        recommended_action: 'RETRY_LATER',
        confidence: 0.85,
        recovery_probability: 0.78,
        retry_after_hours: 6
      }
    });
    expect(result.decision).toBe('APPROVED');
    expect(result.finalAction).toBe('RETRY_LATER');
    expect(result.scheduledAfterHours).toBe(6);
  });

  // INTEGRATION ENDPOINT TESTS

  test('POST /api/recovery/:id/evaluate-policy & POST /api/recovery/:id/approve flow', async () => {
    // 1. Create a high-value case that needs approval
    const payment = await Payment.create({
      merchantId,
      provider: 'razorpay',
      providerPaymentId: 'pay_policy_high_val',
      amountPaise: 2500000, // ₹25,000
      currency: 'INR',
      status: 'failed',
      executionMode: 'MOCK_DEMO'
    });

    const recoveryCase = await RecoveryCase.create({
      merchantId,
      paymentId: payment._id,
      amountAtRiskPaise: 2500000,
      currency: 'INR',
      riskLevel: 'high',
      status: 'recommended',
      latestRecommendation: {
        recommended_action: 'RETRY_LATER',
        retry_after_hours: 12,
        confidence: 0.85,
        recovery_probability: 0.80,
        reason: 'Customer has sufficient liquidity'
      },
      executionMode: 'MOCK_DEMO'
    });

    testCaseId = recoveryCase._id.toString();

    // 2. Evaluate policy via endpoint -> Should set status to pending_approval
    const evalRes = await request(app)
      .post(`/api/recovery/${testCaseId}/evaluate-policy`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(evalRes.status).toBe(200);
    expect(evalRes.body.data.policyResult.decision).toBe('PENDING_APPROVAL');
    expect(evalRes.body.data.recoveryCase.status).toBe('pending_approval');

    // 3. Verify it shows up in GET /api/recovery/pending-approvals
    const pendingRes = await request(app)
      .get('/api/recovery/pending-approvals')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.data.cases.some((c) => c._id === testCaseId)).toBe(true);

    // 4. Human Approval via POST /api/recovery/:id/approve -> Should transition to approved
    const approveRes = await request(app)
      .post(`/api/recovery/${testCaseId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Operator verified customer VIP status and authorized retry.' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.recoveryCase.status).toBe('approved');
  });
});
