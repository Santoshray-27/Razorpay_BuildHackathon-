/**
 * backend/src/models/RecoveryAction.js
 * Represents a single policy-approved or human-reviewed recovery action dispatched to the queue.
 * Protected by a unique idempotency key to prevent duplicate execution.
 */

import mongoose from 'mongoose';

const recoveryActionSchema = new mongoose.Schema(
  {
    merchantId: {
      type: String,
      required: true,
      index: true
    },
    recoveryCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecoveryCase',
      required: true,
      index: true
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    actionType: {
      type: String,
      enum: [
        'RETRY_LATER',
        'SEND_REMINDER',
        'OFFER_ALTERNATIVE_METHOD',
        'HUMAN_REVIEW',
        'STOP_RECOVERY'
      ],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'running', 'succeeded', 'failed', 'cancelled'],
      default: 'pending',
      index: true
    },
    executionMode: {
      type: String,
      enum: ['RAZORPAY_TEST', 'MOCK_DEMO', 'SIMULATION'],
      default: 'MOCK_DEMO',
      index: true
    },
    scheduledFor: {
      type: Date,
      default: null
    },
    executedAt: {
      type: Date,
      default: null
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    error: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    correlationId: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const RecoveryAction = mongoose.model('RecoveryAction', recoveryActionSchema);
