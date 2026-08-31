/**
 * backend/tests/simulation.test.js
 * Integration tests for the 10,000-transaction simulation generator, 4-strategy benchmark,
 * seed reproducibility, and SimulationRun persistence.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { SimulationRun } from '../src/models/SimulationRun.js';
import { generateSyntheticTransactions } from '../../simulator/generator/syntheticDataGenerator.js';
import { runComparativeBenchmark } from '../../simulator/engine/strategyEvaluator.js';
import { env } from '../src/config/env.js';

describe('Phase 9 — Simulation Engine & 4-Strategy Evaluation Benchmark', () => {
  let authToken = '';
  const merchantId = 'merch_sim_test';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }
    await User.deleteMany({ merchantId });
    await SimulationRun.deleteMany({ merchantId });

    // Register test merchant
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Simulator Test Admin',
        email: 'sim_admin@test.com',
        password: 'Password12345!',
        role: 'merchant_admin',
        merchantId
      });
    authToken = reg.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({ merchantId });
    await SimulationRun.deleteMany({ merchantId });
    await mongoose.disconnect();
  });

  test('Seed Reproducibility - Identical seed produces bit-for-bit identical transactions', () => {
    const run1 = generateSyntheticTransactions({ count: 500, seed: 9999, saveToFile: false });
    const run2 = generateSyntheticTransactions({ count: 500, seed: 9999, saveToFile: false });

    expect(run1.length).toBe(500);
    expect(run2.length).toBe(500);

    for (let i = 0; i < run1.length; i++) {
      expect(run1[i].transactionId).toBe(run2[i].transactionId);
      expect(run1[i].amountPaise).toBe(run2[i].amountPaise);
      expect(run1[i].paymentStatus).toBe(run2[i].paymentStatus);
      expect(run1[i].failureReason).toBe(run2[i].failureReason);
      expect(run1[i].optedOutOfRecovery).toBe(run2[i].optedOutOfRecovery);
      expect(run1[i].recovered_after_eligible_action).toBe(run2[i].recovered_after_eligible_action);
    }
  });

  test('Benchmark Reproducibility - Running comparative benchmark twice gives identical results', () => {
    const tx = generateSyntheticTransactions({ count: 1000, seed: 42, saveToFile: false });
    const res1 = runComparativeBenchmark(tx);
    const res2 = runComparativeBenchmark(tx);

    expect(res1.strategies.AI_ASSISTED_RECOVERY.recoveredRevenuePaise).toBe(
      res2.strategies.AI_ASSISTED_RECOVERY.recoveredRevenuePaise
    );
    expect(res1.strategies.RULE_BASED_RECOVERY.recoveredRevenuePaise).toBe(
      res2.strategies.RULE_BASED_RECOVERY.recoveredRevenuePaise
    );
    expect(res1.strategies.AI_ASSISTED_RECOVERY.incrementalLiftPercentage).toBe(
      res2.strategies.AI_ASSISTED_RECOVERY.incrementalLiftPercentage
    );
  });

  test('Compliance & Business Lift - AI + Policy maintains 100% opt-out safety and outperforms baseline', () => {
    const tx = generateSyntheticTransactions({ count: 2000, seed: 42, saveToFile: false });
    const res = runComparativeBenchmark(tx);
    const aiStrat = res.strategies.AI_ASSISTED_RECOVERY;
    const ruleStrat = res.strategies.RULE_BASED_RECOVERY;
    const fixedStrat = res.strategies.FIXED_RETRY;

    expect(aiStrat.optOutComplianceRate).toBe(100);
    expect(ruleStrat.optOutComplianceRate).toBe(100);
    expect(fixedStrat.optOutComplianceRate).toBeLessThan(100); // Naive fixed retry violates opt-out

    // AI + Policy out-recovers status quo and naive retry
    expect(aiStrat.recoveredRevenuePaise).toBeGreaterThan(ruleStrat.recoveredRevenuePaise);
    expect(aiStrat.incrementalRevenuePaise).toBeGreaterThan(0);
  });

  test('POST /api/simulator/run - Persists SimulationRun and returns benchmark comparison', async () => {
    const res = await request(app)
      .post('/api/simulator/run')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ count: 1000, seed: 42, failureRate: 0.18 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;

    expect(data.simulationRunId).toBeDefined();
    expect(data.benchmark.strategies.AI_ASSISTED_RECOVERY).toBeDefined();

    // Verify persisted in DB
    const persisted = await SimulationRun.findById(data.simulationRunId);
    expect(persisted).toBeDefined();
    expect(persisted.merchantId).toBe(merchantId);
    expect(persisted.seed).toBe(42);
  });
});
