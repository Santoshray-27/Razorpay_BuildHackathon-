/**
 * backend/src/models/AuditLog.js
 * Immutable audit trail recording every state change, AI recommendation, policy decision, and worker action.
 */

import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    merchantId: {
      type: String,
      required: true,
      index: true
    },
    recoveryCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecoveryCase',
      default: null
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    },
    correlationId: {
      type: String,
      required: true,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    actor: {
      type: String,
      enum: ['system', 'ai', 'policy_engine', 'human', 'worker'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Audit logs are immutable
  }
);

// Query Indexes for fast timeline lookup
auditLogSchema.index({ recoveryCaseId: 1, createdAt: 1 });
auditLogSchema.index({ merchantId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
