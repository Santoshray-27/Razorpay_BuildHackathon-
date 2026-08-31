/**
 * backend/tests/webhook.test.js
 * Integration tests for Razorpay Webhook Ingestion, HMAC Verification & Idempotency.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import app from '../src/app.js';
import { WebhookEvent } from '../src/models/WebhookEvent.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { env } from '../src/config/env.js';

describe('Webhook Ingestion & Idempotency Tests', () => {
  const testSecret = 'test_webhook_secret_key_12345';
  
  beforeAll(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
    await WebhookEvent.deleteMany({ providerEventId: /^evt_test_/ });
    await AuditLog.deleteMany({ eventType: 'DUPLICATE_EVENT_IGNORED' });
  });

  afterAll(async () => {
    await WebhookEvent.deleteMany({ providerEventId: /^evt_test_/ });
    await AuditLog.deleteMany({ eventType: 'DUPLICATE_EVENT_IGNORED' });
    await mongoose.disconnect();
  });

  const sampleFailedPayload = {
    entity: 'event',
    account_id: 'acc_test_merchant',
    event: 'payment.failed',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: 'pay_test_001',
          entity: 'payment',
          amount: 499900,
          currency: 'INR',
          status: 'failed',
          order_id: 'order_test_001',
          method: 'card',
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Payment failed due to insufficient funds',
          error_reason: 'insufficient_funds',
          customer_id: 'cust_test_001',
          email: 'rahul.kumar@example.com',
          contact: '+919876543210',
          created_at: 1725100000
        }
      }
    },
    created_at: 1725100000
  };

  function createSignature(payloadObj, secret) {
    const rawString = JSON.stringify(payloadObj);
    return {
      rawString,
      signature: crypto.createHmac('sha256', secret).update(rawString).digest('hex')
    };
  }

  test('POST /api/webhooks/razorpay - Should accept valid signed webhook and persist event', async () => {
    const { rawString, signature } = createSignature(sampleFailedPayload, testSecret);

    const res = await request(app)
      .post('/api/webhooks/razorpay')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', 'evt_test_001')
      .set('Content-Type', 'application/json')
      .send(rawString);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('accepted');
    expect(res.body.data.eventId).toBe('evt_test_001');

    // Verify durable storage
    const storedEvent = await WebhookEvent.findOne({ providerEventId: 'evt_test_001' });
    expect(storedEvent).toBeDefined();
    expect(storedEvent.signatureVerified).toBe(true);
    expect(storedEvent.eventType).toBe('payment.failed');
  });

  test('POST /api/webhooks/razorpay - Should reject invalid HMAC signature with 401', async () => {
    const { rawString } = createSignature(sampleFailedPayload, testSecret);
    const tamperedSignature = 'deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678';

    const res = await request(app)
      .post('/api/webhooks/razorpay')
      .set('x-razorpay-signature', tamperedSignature)
      .set('x-razorpay-event-id', 'evt_test_tampered')
      .set('Content-Type', 'application/json')
      .send(rawString);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_SIGNATURE');

    // Ensure event was NOT persisted
    const storedEvent = await WebhookEvent.findOne({ providerEventId: 'evt_test_tampered' });
    expect(storedEvent).toBeNull();
  });

  test('POST /api/webhooks/razorpay - Should reject missing signature header with 401', async () => {
    const rawString = JSON.stringify(sampleFailedPayload);

    const res = await request(app)
      .post('/api/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .send(rawString);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_SIGNATURE');
  });

  test('Idempotency - Replay of same event should return 200, write audit log, and not duplicate records', async () => {
    const { rawString, signature } = createSignature(sampleFailedPayload, testSecret);

    // Replay the exact same event that was already persisted in the first test
    const res = await request(app)
      .post('/api/webhooks/razorpay')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', 'evt_test_001')
      .set('Content-Type', 'application/json')
      .send(rawString);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ignored_duplicate');

    // Confirm only 1 document exists in WebhookEvent collection
    const eventCount = await WebhookEvent.countDocuments({ providerEventId: 'evt_test_001' });
    expect(eventCount).toBe(1);

    // Confirm DUPLICATE_EVENT_IGNORED audit log entry was written
    const auditEntry = await AuditLog.findOne({
      eventType: 'DUPLICATE_EVENT_IGNORED',
      'metadata.providerEventId': 'evt_test_001'
    });
    expect(auditEntry).toBeDefined();
    expect(auditEntry.actor).toBe('system');
  });

  test('POST /api/webhooks/dev-fixture - Should accept synthetic dev fixture for local testing', async () => {
    const devFixturePayload = {
      merchantId: 'merch_dev_test',
      event_id: 'evt_test_dev_001',
      payment_id: 'pay_test_dev_001',
      amount: 499900,
      currency: 'INR',
      status: 'failed',
      failure_reason: 'insufficient_funds',
      payment_method: 'card',
      execution_mode: 'MOCK_DEMO'
    };

    const res = await request(app)
      .post('/api/webhooks/dev-fixture')
      .send(devFixturePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('accepted');
    expect(res.body.data.eventId).toBe('evt_test_dev_001');

    const storedDevEvent = await WebhookEvent.findOne({ providerEventId: 'evt_test_dev_001' });
    expect(storedDevEvent).toBeDefined();
    expect(storedDevEvent.provider).toBe('simulator');
  });
});
