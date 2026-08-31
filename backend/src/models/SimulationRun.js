/**
 * backend/src/models/SimulationRun.js
 * Stores benchmark simulation runs with reproducible seeds and computed comparison metrics.
 */

import mongoose from 'mongoose';

const simulationRunSchema = new mongoose.Schema(
  {
    merchantId: {
      type: String,
      required: true,
      index: true
    },
    seed: {
      type: Number,
      required: true
    },
    transactionCount: {
      type: Number,
      required: true,
      default: 10000
    },
    configuration: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    policyVersion: {
      type: String,
      default: 'v1'
    },
    modelVersion: {
      type: String,
      default: 'v1'
    },
    results: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

simulationRunSchema.index({ merchantId: 1, createdAt: -1 });

export const SimulationRun = mongoose.model('SimulationRun', simulationRunSchema);
