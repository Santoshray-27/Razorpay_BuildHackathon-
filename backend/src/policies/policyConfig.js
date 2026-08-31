/**
 * backend/src/policies/policyConfig.js
 * Versioned configuration parameters for the Deterministic Policy Engine.
 */

export const policyConfig = {
  version: "v1",
  maxRetriesPerCase: 3,
  maxRemindersPerCase: 1,
  minAutoRecoveryProbability: 0.7,
  minAutoActionConfidence: 0.7,
  highValueThresholdPaise: 1000000, // ₹10,000 in paise
  recoveryWindowHours: 168,          // 7 days
  maxRetryDelayHours: 168,
  maxCustomerActionsPerDay: 2,
  aiEnabled: process.env.AI_ENABLED !== "false"
};
