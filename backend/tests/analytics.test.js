/**
 * backend/tests/analytics.test.js
 * Integration tests verifying merchant analytics KPI calculations, funnel progression, and executionMode isolation.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Payment } from '../src/models/Payment.js';
import { RecoveryCase } from '../src/models/RecoveryCase.js';
import { env } from '../src/config/env.js';

describe('Phase 8 — Analytics & Merchant Dashboard Telemetry', () => {
  let authToken = '';
  const merchantId = 'merch_analytics_test';

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
        name: 'Analytics Test Admin',
        email: 'analytics_admin@test.com',
        password: 'Password12345!',
        role: 'merchant_admin',
        merchantId
      });
    authToken = reg.body.data.token;

    // Create seed payments and recovery cases
    // Case 1: Unrecovered case, ₹4,999 (499900 paise) in MOCK_DEMO
    const pay1 = await Payment.create({
      merchantId,
      provider: 'razorpay',
      providerPaymentId: 'pay_an_01',
      amountPaise: 499900,
      currency: 'INR',
      status: 'failed',
      failureReason: 'insufficient_funds',
      executionMode: 'MOCK_DEMO'
    });

    await RecoveryCase.create({
      merchantId,
      paymentId: pay1._id,
      amountAtRiskPaise: 499900,
      currency: 'INR',
      riskLevel: 'medium',
      status: 'detected',
      failureReason: 'insufficient_funds',
      executionMode: 'MOCK_DEMO'
    });

    // Case 2: Recovered case, ₹5,000 (500000 paise) in MOCK_DEMO
    const pay2 = await Payment.create({
      merchantId,
      provider: 'razorpay',
      providerPaymentId: 'pay_an_02',
      amountPaise: 500000,
      currency: 'INR',
      status: 'recovered',
      failureReason: 'network_error',
      executionMode: 'MOCK_DEMO'
    });

    await RecoveryCase.create({
      merchantId,
      paymentId: pay2._id,
      amountAtRiskPaise: 500000,
      recoveredAmountPaise: 500000,
      recoveredAt: new Date(),
      currency: 'INR',
      riskLevel: 'low',
      status: 'recovered',
      failureReason: 'network_error',
      latestRecommendation: {
        recommended_action: 'RETRY_LATER'
      },
      executionMode: 'MOCK_DEMO'
    });

    // Case 3: Pending Approval case, ₹15,000 (1500000 paise) in RAZORPAY_TEST
    const pay3 = await Payment.create({
      merchantId,
      provider: 'razorpay',
      providerPaymentId: 'pay_an_03',
      amountPaise: 1500000,
      currency: 'INR',
      status: 'failed',
      failureReason: 'card_declined',
      executionMode: 'RAZORPAY_TEST'
    });

    await RecoveryCase.create({
      merchantId,
      paymentId: pay3._id,
      amountAtRiskPaise: 1500000,
      currency: 'INR',
      riskLevel: 'high',
      status: 'pending_approval',
      failureReason: 'card_declined',
      latestRecommendation: {
        recommended_action: 'HUMAN_REVIEW'
      },
      executionMode: 'RAZORPAY_TEST'
    });
  });

  afterAll(async () => {
    await User.deleteMany({ merchantId });
    await Payment.deleteMany({ merchantId });
    await RecoveryCase.deleteMany({ merchantId });
    await mongoose.disconnect();
  });

  test('GET /api/analytics/overview - Accurately computes stored KPIs and executionMode breakdown', async () => {
    const res = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const { kpis, modeBreakdown } = res.body.data;

    // Revenue at Risk = 499900 (Case 1) + 1500000 (Case 3) = 1999900 paise
    expect(kpis.revenueAtRiskPaise).toBe(1999900);

    // Recovered Revenue = 500000 paise (Case 2)
    expect(kpis.recoveredRevenuePaise).toBe(500000);

    // Total eligible failed = 1999900 + 500000 = 2499900 paise
    // Recovery Rate = (500000 / 2499900) * 100 ≈ 20.00%
    expect(kpis.recoveryRate).toBeCloseTo(20.0, 1);

    expect(kpis.totalFailedPaymentsCount).toBe(3);
    expect(kpis.activeCasesCount).toBe(2);
    expect(kpis.pendingApprovalsCount).toBe(1);

    // Verify execution mode separation
    expect(modeBreakdown.MOCK_DEMO.recoveredRevenuePaise).toBe(500000);
    expect(modeBreakdown.RAZORPAY_TEST.revenueAtRiskPaise).toBe(1500000);
  });

  test('GET /api/analytics/recovery - Returns breakdown by recovery strategy', async () => {
    const res = await request(app)
      .get('/api/analytics/recovery')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.strategies)).toBe(true);
    expect(res.body.data.strategies.length).toBeGreaterThan(0);
  });

  test('GET /api/analytics/failures - Returns breakdown by failure reason', async () => {
    const res = await request(app)
      .get('/api/analytics/failures')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const failures = res.body.data.failures;
    expect(failures.some((f) => f.failureReason === 'insufficient_funds')).toBe(true);
    expect(failures.some((f) => f.failureReason === 'network_error')).toBe(true);
  });

  test('GET /api/analytics/funnel - Returns pipeline progression stages', async () => {
    const res = await request(app)
      .get('/api/analytics/funnel')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const funnel = res.body.data.funnel;
    expect(funnel.length).toBe(5);
    expect(funnel[0].stage).toBe('1. Detected');
    expect(funnel[0].count).toBe(3);
  });
});
