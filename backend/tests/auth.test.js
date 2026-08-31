/**
 * backend/tests/auth.test.js
 * Integration tests for JWT Authentication, Authorization & Merchant Data Isolation.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Payment } from '../src/models/Payment.js';
import { env } from '../src/config/env.js';

describe('Authentication & Merchant Data Isolation Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
    // Clean collections before testing
    await User.deleteMany({ email: /@testauth\.com$/ });
    await Payment.deleteMany({ merchantId: { $in: ['merch_alpha', 'merch_beta'] } });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@testauth\.com$/ });
    await Payment.deleteMany({ merchantId: { $in: ['merch_alpha', 'merch_beta'] } });
    await mongoose.disconnect();
  });

  const merchantAData = {
    name: 'Santosh Merchant A',
    email: 'santosh_a@testauth.com',
    password: 'SuperSecurePassword123!',
    role: 'merchant_admin',
    merchantId: 'merch_alpha'
  };

  const merchantBData = {
    name: 'Merchant B',
    email: 'operator_b@testauth.com',
    password: 'AnotherSecurePassword456!',
    role: 'merchant_operator',
    merchantId: 'merch_beta'
  };

  let merchantAToken = '';
  let merchantBToken = '';

  test('POST /api/auth/register - Should successfully register Merchant A and return a JWT without password hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(merchantAData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(merchantAData.email);
    expect(res.body.data.user.merchantId).toBe('merch_alpha');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.password).toBeUndefined();

    merchantAToken = res.body.data.token;
  });

  test('POST /api/auth/register - Should reject duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(merchantAData);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  test('POST /api/auth/login - Should successfully log in Merchant A with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: merchantAData.email,
        password: merchantAData.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.merchantId).toBe('merch_alpha');
  });

  test('POST /api/auth/login - Should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: merchantAData.email,
        password: 'wrong_password_123'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('GET /api/auth/me - Should fetch profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${merchantAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(merchantAData.email);
    expect(res.body.data.user.role).toBe('merchant_admin');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  test('GET /api/auth/me - Should reject request with missing Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('GET /api/auth/me - Should reject request with malformed or tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_tampered_jwt_token_here');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  test('Merchant Isolation - Merchant B must NOT be able to access Merchant A payments', async () => {
    // 1. Register Merchant B
    const regB = await request(app)
      .post('/api/auth/register')
      .send(merchantBData);
    expect(regB.status).toBe(201);
    merchantBToken = regB.body.data.token;

    // 2. Create a test payment belonging to Merchant A
    await Payment.create({
      merchantId: 'merch_alpha',
      provider: 'razorpay',
      providerPaymentId: 'pay_test_isolation_001',
      amountPaise: 499900,
      currency: 'INR',
      status: 'failed',
      paymentMethod: 'card',
      failureReason: 'insufficient_funds',
      executionMode: 'MOCK_DEMO',
      occurredAt: new Date()
    });

    // 3. Merchant A accesses /api/payments -> Should see 1 payment
    const resA = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${merchantAToken}`);

    expect(resA.status).toBe(200);
    expect(resA.body.data.payments.length).toBe(1);
    expect(resA.body.data.payments[0].merchantId).toBe('merch_alpha');
    expect(resA.body.data.payments[0].amountPaise).toBe(499900);

    // 4. Merchant B accesses /api/payments -> Should see 0 payments (Strict Tenant Isolation)
    const resB = await request(app)
      .get('/api/payments')
      .set('Authorization', `Bearer ${merchantBToken}`);

    expect(resB.status).toBe(200);
    expect(resB.body.data.payments.length).toBe(0);
    expect(resB.body.data.pagination.total).toBe(0);
  });
});
