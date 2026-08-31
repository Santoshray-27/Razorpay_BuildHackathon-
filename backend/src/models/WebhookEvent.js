/**
 * backend/src/models/WebhookEvent.js
 * Durable event store for incoming webhooks with idempotency and duplicate deduplication.
 */

import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
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
    providerEventId: {
      type: String,
      required: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    payloadHash: {
      type: String,
      default: null
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    signatureVerified: {
      type: Boolean,
      default: false
    },
    processingStatus: {
      type: String,
      enum: ['received', 'processed', 'ignored', 'failed'],
      default: 'received',
      index: true
    },
    correlationId: {
      type: String,
      required: true,
      index: true
    },
    receivedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date,
      default: null
    },
    error: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Unique compound index for webhook delivery idempotency
webhookEventSchema.index({ merchantId: 1, provider: 1, providerEventId: 1 }, { unique: true });

export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
