/**
 * backend/tests/recovery.test.js
 * Integration tests for Revenue Risk Engine, Recovery Case creation, Customer Context, and Audit Trails.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Payment } from '../src/models/Payment.js';
import { Customer } from '../src/models/Customer.js';
import { RecoveryCase } from '../src/models/RecoveryCase.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { WebhookEvent } from '../src/models/WebhookEvent.js';
import { env } from '../src/config/env.js';
import { processStoredWebhookEvent } from '../src/services/paymentProcessingService.js';

describe('Phase 3 — Risk Engine, Recovery Cases, Customer Context & Audit Logs', () => {
  let authToken = '';
  const testMerchantId = 'merch_phase3_test';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
    // Clean collections before test
    await User.deleteMany({ merchantId: testMerchantId });
    await Payment.deleteMany({ merchantId: testMerchantId });
    await Customer.deleteMany({ merchantId: testMerchantId });
    await RecoveryCase.deleteMany({ merchantId: testMerchantId });
    await AuditLog.deleteMany({ merchantId: testMerchantId });
    await WebhookEvent.deleteMany({ merchantId: testMerchantId });

    // Register test merchant
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Phase 3 Test Merchant',
        email: 'phase3_merchant@test.com',
        password: 'Password12345!',
        role: 'merchant_admin',
        merchantId: testMerchantId
      });

    authToken = regRes.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({ merchantId: testMerchantId });
    await Payment.deleteMany({ merchantId: testMerchantId });
    await Customer.deleteMany({ merchantId: testMerchantId });
    await RecoveryCase.deleteMany({ merchantId: testMerchantId });
    await AuditLog.deleteMany({ merchantId: testMerchantId });
    await WebhookEvent.deleteMany({ merchantId: testMerchantId });
    await mongoose.disconnect();
  });

  test('Failed payment event -> Normalizes payment, assesses risk, creates RecoveryCase in DETECTED state', async () => {
    const correlationId = 'test_trace_ph3_001';
    const syntheticWebhookEvent = {
      merchantId: testMerchantId,
      provider: 'simulator',
      providerEventId: 'evt_ph3_test_001',
      eventType: 'payment.failed',
      rawPayload: {
        payment: {
          id: 'pay_ph3_001',
          amount: 499900,
          currency: 'INR',
          status: 'failed',
          method: 'card',
          failure_reason: 'insufficient_funds',
          customer_id: 'cust_ph3_rahul',
          customer_name: 'Rahul Kumar',
          customer_email: 'rahul.kumar@example.com',
          customer_phone: '+919876543210',
          created_at: Math.floor(Date.now() / 1000)
        }
      }
    };

    const result = await processStoredWebhookEvent(syntheticWebhookEvent, correlationId);

    // 1. Validate Payment record
    expect(result.payment).toBeDefined();
    expect(result.payment.amountPaise).toBe(499900);
    expect(result.payment.status).toBe('failed');
    expect(result.payment.merchantId).toBe(testMerchantId);

    // 2. Validate Customer record
    expect(result.customer).toBeDefined();
    expect(result.customer.email).toBe('rahul.kumar@example.com');
    expect(result.customer.phoneMasked).toBe('+91*****3210');
    expect(result.customer.failedPaymentsCount).toBe(1);

    // 3. Validate RecoveryCase
    expect(result.recoveryCase).toBeDefined();
    expect(result.recoveryCase.status).toBe('detected');
    expect(result.recoveryCase.amountAtRiskPaise).toBe(499900);
    expect(result.recoveryCase.riskLevel).toBe('medium');
    expect(result.recoveryCase.failureReason).toBe('insufficient_funds');

    // 4. Validate Audit Trail
    const logs = await AuditLog.find({ merchantId: testMerchantId, correlationId }).sort({ createdAt: 1 });
    const eventTypes = logs.map((l) => l.eventType);

    expect(eventTypes).toContain('PAYMENT_STORED');
    expect(eventTypes).toContain('REVENUE_RISK_DETECTED');
    expect(eventTypes).toContain('RECOVERY_CASE_CREATED');
  });

  test('Idempotency - Replay does not create duplicate Payment or RecoveryCase', async () => {
    const correlationId = 'test_trace_ph3_replay';
    const syntheticWebhookEvent = {
      merchantId: testMerchantId,
      provider: 'simulator',
      providerEventId: 'evt_ph3_test_001',
      eventType: 'payment.failed',
      rawPayload: {
        payment: {
          id: 'pay_ph3_001',
          amount: 499900,
          currency: 'INR',
          status: 'failed',
          method: 'card',
          failure_reason: 'insufficient_funds',
          customer_id: 'cust_ph3_rahul'
        }
      }
    };

    await processStoredWebhookEvent(syntheticWebhookEvent, correlationId);

    const paymentCount = await Payment.countDocuments({ merchantId: testMerchantId, providerPaymentId: 'pay_ph3_001' });
    const caseCount = await RecoveryCase.countDocuments({ merchantId: testMerchantId });

    expect(paymentCount).toBe(1);
    expect(caseCount).toBe(1);
  });

  test('GET /api/recovery/cases - Scoped to authenticated merchant', async () => {
    const res = await request(app)
      .get('/api/recovery/cases')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cases.length).toBe(1);
    expect(res.body.data.cases[0].status).toBe('detected');
    expect(res.body.data.cases[0].amountAtRiskPaise).toBe(499900);
  });

  test('GET /api/recovery/:id - Returns full case details, customer context & audit timeline', async () => {
    const existingCase = await RecoveryCase.findOne({ merchantId: testMerchantId });

    const res = await request(app)
      .get(`/api/recovery/${existingCase._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const detail = res.body.data.recoveryCase;

    expect(detail._id).toBe(existingCase._id.toString());
    expect(detail.status).toBe('detected');
    expect(detail.customerContext).toBeDefined();
    expect(detail.customerContext.maskedEmail).toBe('r***r@example.com');
    expect(detail.customerContext.maskedPhone).toBe('+91*****3210');
    expect(detail.auditTimeline).toBeDefined();
    expect(detail.auditTimeline.length).toBeGreaterThanOrEqual(3);
  });
});
