/**
 * backend/src/models/Payment.js
 * Represents incoming payment events from Razorpay or local simulators.
 * All monetary amounts are stored in smallest currency units (paise).
 */

import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    merchantId: {
      type: String,
      required: true,
      index: true
    },
    provider: {
      type: String,
      enum: ['razorpay', 'simulator'],
      default: 'razorpay',
      required: true
    },
    providerPaymentId: {
      type: String,
      required: true
    },
    providerOrderId: {
      type: String,
      default: null
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 1
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'recovered'],
      required: true,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet', 'unknown'],
      default: 'unknown'
    },
    failureReason: {
      type: String,
      default: null
    },
    executionMode: {
      type: String,
      enum: ['RAZORPAY_TEST', 'MOCK_DEMO', 'SIMULATION'],
      default: 'MOCK_DEMO',
      required: true,
      index: true
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Required Unique & Query Indexes
paymentSchema.index({ merchantId: 1, provider: 1, providerPaymentId: 1 }, { unique: true });
paymentSchema.index({ merchantId: 1, status: 1, occurredAt: -1 });
paymentSchema.index({ merchantId: 1, customerId: 1, occurredAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
