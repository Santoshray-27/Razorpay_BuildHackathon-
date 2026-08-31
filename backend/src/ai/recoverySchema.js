/**
 * backend/src/ai/recoverySchema.js
 * Strict Zod validation schema for structured AI recommendations.
 * Rejects untrusted or malformed LLM outputs before they can reach the policy engine.
 */

import { z } from 'zod';

export const RecoveryRecommendationSchema = z.object({
  risk: z.enum(['low', 'medium', 'high']),
  recovery_probability: z.number().min(0).max(1),
  recommended_action: z.enum([
    'RETRY_LATER',
    'SEND_REMINDER',
    'OFFER_ALTERNATIVE_METHOD',
    'HUMAN_REVIEW',
    'STOP_RECOVERY'
  ]),
  retry_after_hours: z.number().int().min(1).max(168).optional(),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(10).max(500)
}).superRefine((data, ctx) => {
  if (data.recommended_action === 'RETRY_LATER' && !data.retry_after_hours) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'retry_after_hours is required for RETRY_LATER'
    });
  }
});
