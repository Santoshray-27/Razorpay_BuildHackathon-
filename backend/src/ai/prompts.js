/**
 * backend/src/ai/prompts.js
 * Safety-aligned prompt templates for Gemini AI recommendations.
 * Explicitly constrains LLM to structured advisory output only.
 */

export const SYSTEM_PROMPT = `You are a payment recovery recommendation assistant.
You only provide advisory recommendations.
You cannot execute payments, retries, notifications, or policy decisions.
Use only the context provided.
Return JSON only, matching the required schema.
Choose one action from: RETRY_LATER, SEND_REMINDER, OFFER_ALTERNATIVE_METHOD, HUMAN_REVIEW, STOP_RECOVERY.
If action is RETRY_LATER, you must specify retry_after_hours (integer between 1 and 168).
Prioritize legitimate recovery, customer experience, and safe escalation.
If context is insufficient or risk is uncertain, recommend HUMAN_REVIEW or STOP_RECOVERY.
Never include markdown blocks, code formatting, or explanatory text outside the JSON object.`;

/**
 * Builds the user prompt with privacy-safe payment & customer features.
 */
export function buildRecommendationPrompt({
  payment,
  customerContext,
  calculatedProbability,
  retryCount
}) {
  const payload = {
    payment: {
      amountRupees: (payment.amountPaise / 100).toFixed(2),
      currency: payment.currency,
      failureReason: payment.failureReason,
      paymentMethod: payment.paymentMethod,
      occurredAt: payment.occurredAt
    },
    customer: {
      hasHistory: customerContext.hasHistory,
      successfulPayments: customerContext.successfulPaymentsCount,
      failedPayments: customerContext.failedPaymentsCount,
      successRate: customerContext.recentSuccessRate,
      subscriptionStatus: customerContext.subscriptionStatus,
      daysSinceLastSuccess: customerContext.daysSinceLastSuccess,
      optedOutOfRecovery: customerContext.optedOutOfRecovery
    },
    systemContext: {
      currentRetryCount: retryCount,
      calculatedRecoveryProbability: calculatedProbability,
      maxAllowedRetries: 3
    }
  };

  return `Analyze the following failed payment context and output structured recommendation JSON conforming strictly to the schema:

CONTEXT:
${JSON.stringify(payload, null, 2)}

REQUIRED JSON SCHEMA:
{
  "risk": "low" | "medium" | "high",
  "recovery_probability": number between 0.0 and 1.0,
  "recommended_action": "RETRY_LATER" | "SEND_REMINDER" | "OFFER_ALTERNATIVE_METHOD" | "HUMAN_REVIEW" | "STOP_RECOVERY",
  "retry_after_hours": integer between 1 and 168 (required if RETRY_LATER),
  "confidence": number between 0.0 and 1.0,
  "reason": "concise human-readable explanation between 10 and 500 characters"
}`;
}
