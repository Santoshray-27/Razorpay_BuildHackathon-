/**
 * simulator/generator/syntheticDataGenerator.js
 * Deterministic synthetic transaction generator using a seeded pseudo-random number generator (PRNG).
 * Produces ~10,000 realistic transactions with correlated failure causes and ground-truth recoverability.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Mulberry32 32-bit seeded PRNG for 100% deterministic output across runs.
 */
function createPRNG(seed) {
  let s = Math.floor(Number(seed) || 42);
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates N synthetic transactions.
 */
export function generateSyntheticTransactions({
  count = 10000,
  seed = 42,
  failureRate = 0.18,
  saveToFile = true
} = {}) {
  const rand = createPRNG(seed);

  const paymentMethods = ['card', 'upi', 'netbanking', 'wallet'];
  const methodWeights = [0.45, 0.35, 0.15, 0.05];

  const failureReasons = [
    'insufficient_funds',
    'authentication_failed',
    'network_error',
    'card_declined',
    'system_error',
    'expired_card'
  ];
  const failureWeights = [0.40, 0.22, 0.18, 0.10, 0.06, 0.04];

  function pickWeighted(items, weights) {
    const r = rand();
    let cumulative = 0;
    for (let i = 0; i < items.length; i++) {
      cumulative += weights[i];
      if (r < cumulative) return items[i];
    }
    return items[items.length - 1];
  }

  const transactions = [];
  const baseTimestamp = Date.now() - 30 * 24 * 60 * 60 * 1000; // Last 30 days

  for (let i = 1; i <= count; i++) {
    const txId = `tx_sim_${seed}_${String(i).padStart(6, '0')}`;
    const custNum = Math.floor(rand() * 2500) + 1; // 2500 recurring customers
    const custId = `cust_sim_${String(custNum).padStart(5, '0')}`;

    // Customer profile attributes
    const customerPastSuccesses = Math.floor(rand() * 12);
    const customerPastFailures = Math.floor(rand() * 4);
    const loyaltySegment = customerPastSuccesses > 6 ? 'vip' : customerPastSuccesses > 2 ? 'regular' : 'new';
    const subscriptionStatus = rand() < 0.30 ? 'active' : 'none';
    const optedOutOfRecovery = rand() < 0.04; // 4% opt-out rate

    // Transaction attributes
    const isFailed = rand() < failureRate;
    const paymentMethod = pickWeighted(paymentMethods, methodWeights);
    const failureReason = isFailed ? pickWeighted(failureReasons, failureWeights) : null;

    // Amount distribution: skew towards standard ticket sizes (₹499 to ₹14,999)
    let amountRupees;
    const amountTier = rand();
    if (amountTier < 0.60) {
      amountRupees = Math.floor(rand() * 2000) + 499; // ₹499 - ₹2,499
    } else if (amountTier < 0.90) {
      amountRupees = Math.floor(rand() * 5000) + 2500; // ₹2,500 - ₹7,499
    } else {
      amountRupees = Math.floor(rand() * 15000) + 7500; // ₹7,500 - ₹22,500 (high-value)
    }
    const amountPaise = amountRupees * 100;

    const timestamp = new Date(baseTimestamp + Math.floor(rand() * 30 * 24 * 3600 * 1000)).toISOString();

    // Ground Truth Recoverability Label computation (for ML training & evaluation)
    let baseRecoverabilityScore = 0.50;

    if (isFailed) {
      // Positive recoverability drivers
      if (failureReason === 'insufficient_funds') baseRecoverabilityScore += 0.28;
      if (failureReason === 'network_error') baseRecoverabilityScore += 0.32;
      if (failureReason === 'authentication_failed') baseRecoverabilityScore += 0.12;
      if (loyaltySegment === 'vip') baseRecoverabilityScore += 0.20;
      if (customerPastSuccesses >= 3) baseRecoverabilityScore += 0.15;
      if (subscriptionStatus === 'active') baseRecoverabilityScore += 0.10;

      // Negative recoverability drivers
      if (failureReason === 'expired_card') baseRecoverabilityScore -= 0.35;
      if (failureReason === 'card_declined') baseRecoverabilityScore -= 0.25;
      if (customerPastFailures > 2) baseRecoverabilityScore -= 0.20;
      if (amountPaise >= 1000000) baseRecoverabilityScore -= 0.08; // High value friction
      if (optedOutOfRecovery) baseRecoverabilityScore = 0.0; // Strictly zero contact
    } else {
      baseRecoverabilityScore = 1.0;
    }

    baseRecoverabilityScore = Math.max(0.0, Math.min(1.0, baseRecoverabilityScore));
    const recoveredAfterEligibleAction = isFailed ? (rand() < baseRecoverabilityScore ? 1 : 0) : 1;

    transactions.push({
      transactionId: txId,
      customerId: custId,
      timestamp,
      amountPaise,
      paymentMethod,
      paymentStatus: isFailed ? 'failed' : 'success',
      failureReason,
      successfulPaymentsCount: customerPastSuccesses,
      failedPaymentsCount: customerPastFailures,
      subscriptionStatus,
      loyaltySegment,
      optedOutOfRecovery,
      latentRecoverabilityScore: Number(baseRecoverabilityScore.toFixed(3)),
      recovered_after_eligible_action: recoveredAfterEligibleAction
    });
  }

  if (saveToFile) {
    const dataDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, 'synthetic_transactions.json');
    fs.writeFileSync(filePath, JSON.stringify(transactions, null, 2), 'utf-8');
  }

  return transactions;
}
