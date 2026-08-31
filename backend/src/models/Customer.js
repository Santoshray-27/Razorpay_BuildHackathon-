/**
 * backend/src/models/Customer.js
 * Customer context model storing privacy-safe payment history metrics.
 * Stores NO sensitive payment credentials, card numbers, or CVVs.
 */

import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    merchantId: {
      type: String,
      required: true,
      index: true
    },
    providerCustomerId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    phoneMasked: {
      type: String,
      default: ''
    },
    optedOutOfRecovery: {
      type: Boolean,
      default: false,
      index: true
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'past_due', 'cancelled', 'none'],
      default: 'none'
    },
    successfulPaymentsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    failedPaymentsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalSuccessfulSpendPaise: {
      type: Number,
      default: 0,
      min: 0
    },
    lastSuccessfulPaymentAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast merchant-scoped customer lookups
customerSchema.index({ merchantId: 1, providerCustomerId: 1 }, { unique: true });

export const Customer = mongoose.model('Customer', customerSchema);
