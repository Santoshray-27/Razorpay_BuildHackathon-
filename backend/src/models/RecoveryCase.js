/**
 * backend/src/models/RecoveryCase.js
 * Tracks the end-to-end recovery lifecycle of a failed payment.
 * Enforces atomic state transitions and active action execution locks.
 */

import mongoose from 'mongoose';

const recoveryCaseSchema = new mongoose.Schema(
  {
    merchantId: {
      type: String,
      required: true,
      index: true
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true
    },
    amountAtRiskPaise: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: [
        'detected',
        'analyzing',
        'recommended',
        'pending_approval',
        'approved',
        'scheduled',
        'executing',
        'recovered',
        'stopped',
        'failed',
        'expired'
      ],
      default: 'detected',
      index: true
    },
    failureReason: {
      type: String,
      default: null
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0
    },
    reminderCount: {
      type: Number,
      default: 0,
      min: 0
    },
    recoveryWindowEndsAt: {
      type: Date,
      default: null
    },
    recoveryProbability: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },
    recommendationHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        source: { type: String, enum: ['GEMINI', 'RULE_BASED_FALLBACK', 'SIMULATOR_PROXY'] },
        recommendation: mongoose.Schema.Types.Mixed
      }
    ],
    latestRecommendation: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    latestPolicyDecision: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    recoveredAmountPaise: {
      type: Number,
      default: 0,
      min: 0
    },
    recoveredAt: {
      type: Date,
      default: null
    },
    activeActionLock: {
      type: Boolean,
      default: false
    },
    executionMode: {
      type: String,
      enum: ['RAZORPAY_TEST', 'MOCK_DEMO', 'SIMULATION'],
      default: 'MOCK_DEMO',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Unique index: Exactly one recovery case per payment per merchant
recoveryCaseSchema.index({ merchantId: 1, paymentId: 1 }, { unique: true });

export const RecoveryCase = mongoose.model('RecoveryCase', recoveryCaseSchema);
