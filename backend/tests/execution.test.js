/**
 * backend/tests/execution.test.js
 * Integration tests for BullMQ Job Scheduling, Safe Action Execution, Idempotency, and Lock Guards.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Payment } from '../src/models/Payment.js';
import { Customer } from '../src/models/Customer.js';
import { RecoveryCase } from '../src/models/RecoveryCase.js';
import { RecoveryAction } from '../src/models/RecoveryAction.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { processRecoveryActionJob } from '../src/jobs/recoveryWorker.js';
import { env } from '../src/config/env.js';

describe('Phase 7 — BullMQ, Redis & Safe Action Execution', () => {
  let authToken = '';
  let testPaymentId = '';
  let testCaseId = '';
  const merchantId = 'merch_exec_test';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
    await User.deleteMany({ merchantId });
    await Payment.deleteMany({ merchantId });
    await Customer.deleteMany({ merchantId });
    await RecoveryCase.deleteMany({ merchantId });
    await RecoveryAction.deleteMany({ merchantId });
    await AuditLog.deleteMany({ merchantId });

    // Register admin user
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Execution Test Admin',
        email: 'exec_admin@test.com',
        password: 'Password12345!',
        role: 'merchant_admin',
        merchantId
      });
    authToken = reg.body.data.token;

    // Create Customer
    const customer = await Customer.create({
      merchantId,
      providerCustomerId: 'cust_exec_01',
      name: 'Test Customer',
      email: 'test_customer@example.com',
      phoneMasked: '+91*****1234',
      successfulPaymentsCount: 3,
      optedOutOfRecovery: false
    });

    // Create Payment
    const payment = await Payment.create({
      merchantId,
      provider: 'razorpay',
      providerPaymentId: 'pay_exec_test_001',
      customerId: customer._id,
      amountPaise: 499900,
      currency: 'INR',
      status: 'failed',
      failureReason: 'insufficient_funds',
      executionMode: 'MOCK_DEMO'
    });
    testPaymentId = payment._id.toString();

    // Create RecoveryCase in APPROVED state
    const recoveryCase = await RecoveryCase.create({
      merchantId,
      paymentId: payment._id,
      customerId: customer._id,
      amountAtRiskPaise: 499900,
      currency: 'INR',
      riskLevel: 'medium',
      status: 'approved',
      failureReason: 'insufficient_funds',
      recoveryProbability: 0.82,
      latestRecommendation: {
        recommended_action: 'RETRY_LATER',
        retry_after_hours: 6,
        confidence: 0.88,
        reason: 'Customer has strong transaction history'
      },
      latestPolicyDecision: {
        decision: 'APPROVED',
        finalAction: 'RETRY_LATER',
        scheduledAfterHours: 6,
        policyVersion: 'v1'
      },
      executionMode: 'MOCK_DEMO'
    });
    testCaseId = recoveryCase._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({ merchantId });
    await Payment.deleteMany({ merchantId });
    await Customer.deleteMany({ merchantId });
    await RecoveryCase.deleteMany({ merchantId });
    await RecoveryAction.deleteMany({ merchantId });
    await AuditLog.deleteMany({ merchantId });
    await mongoose.disconnect();
  });

  test('POST /api/recovery/:id/execute - Executes approved action, marks case & payment RECOVERED with correct executionMode', async () => {
    const res = await request(app)
      .post(`/api/recovery/${testCaseId}/execute`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.executionResult.recovered).toBe(true);
    expect(res.body.data.executionResult.executionMode).toBe('MOCK_DEMO');
    expect(res.body.data.executionResult.outcome).toBe('SIMULATED_RECOVERY_SUCCESS');

    // Verify persisted case status
    const updatedCase = await RecoveryCase.findById(testCaseId);
    expect(updatedCase.status).toBe('recovered');
    expect(updatedCase.recoveredAmountPaise).toBe(499900);
    expect(updatedCase.recoveredAt).toBeDefined();

    // Verify payment updated to recovered
    const updatedPayment = await Payment.findById(testPaymentId);
    expect(updatedPayment.status).toBe('recovered');

    // Verify audit logs written
    const logs = await AuditLog.find({ merchantId, recoveryCaseId: testCaseId });
    const logTypes = logs.map((l) => l.eventType);

    expect(logTypes).toContain('RECOVERY_JOB_SCHEDULED');
    expect(logTypes).toContain('RECOVERY_ACTION_STARTED');
    expect(logTypes).toContain('RECOVERY_ACTION_EXECUTED');
    expect(logTypes).toContain('REVENUE_RECOVERED');
  });

  test('Idempotency & Terminal State - Once recovered, case stops any further actions', async () => {
    const res = await request(app)
      .post(`/api/recovery/${testCaseId}/execute`)
      .set('Authorization', `Bearer ${authToken}`);

    // Scheduling fails because case is already in status 'recovered'
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATUS_FOR_SCHEDULING');
  });
});
