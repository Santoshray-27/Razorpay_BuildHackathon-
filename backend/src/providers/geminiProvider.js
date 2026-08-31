/**
 * backend/src/providers/geminiProvider.js
 * Adapter for Google Gemini API. Encapsulates SDK / HTTP calls, timeout guards,
 * circuit breaker integration, JSON normalization, and Zod schema enforcement.
 */

import { env } from '../config/env.js';
import { logger } from '../observability/logger.js';
import { SYSTEM_PROMPT, buildRecommendationPrompt } from '../ai/prompts.js';
import { RecoveryRecommendationSchema } from '../ai/recoverySchema.js';
import { geminiCircuitBreaker } from '../ai/circuitBreaker.js';
import { getFallbackRecommendation } from '../ai/fallbackRecommendation.js';

/**
 * Normalizes raw string response from LLM by removing Markdown code fences.
 */
export function cleanJsonOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') return '{}';
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Requests structured recovery recommendation from Gemini.
 * Falls back seamlessly to rule-based engine upon error or timeout.
 */
export async function getRecoveryRecommendation({
  payment,
  customerContext,
  calculatedProbability,
  retryCount = 0,
  correlationId
}) {
  // 1. Feature Flag Check: AI_ENABLED
  if (!env.AI_ENABLED || !env.GEMINI_API_KEY) {
    logger.info('Gemini AI disabled or API key missing — utilizing deterministic fallback recommendation.', { correlationId });
    const fallback = getFallbackRecommendation({ payment, customerContext, retryCount });
    return {
      success: true,
      source: 'RULE_BASED_FALLBACK',
      recommendation: fallback,
      modelVersion: 'rule-based-fallback-v1'
    };
  }

  // 2. Circuit Breaker Guard
  if (geminiCircuitBreaker.isOpen()) {
    logger.warn('AI Circuit breaker is OPEN. Fast-falling back to rule-based engine.', { correlationId });
    const fallback = getFallbackRecommendation({ payment, customerContext, retryCount });
    return {
      success: true,
      source: 'RULE_BASED_FALLBACK',
      recommendation: fallback,
      modelVersion: 'circuit-breaker-fallback-v1'
    };
  }

  // 3. Make Bounded API Request to Gemini
  const prompt = buildRecommendationPrompt({ payment, customerContext, calculatedProbability, retryCount });
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${env.GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: `${SYSTEM_PROMPT}\n\n${prompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1, // Low temperature for deterministic adherence
      maxOutputTokens: 600,
      responseMimeType: 'application/json'
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini returned empty candidate text');
    }

    // 4. Clean and Parse JSON Output
    const cleanedJson = cleanJsonOutput(candidateText);
    const parsedObj = JSON.parse(cleanedJson);

    // 5. Enforce Zod Structured Output Schema
    const validatedRecommendation = RecoveryRecommendationSchema.parse(parsedObj);

    // Record circuit breaker success
    geminiCircuitBreaker.recordSuccess();

    logger.info('✨ Validated AI recommendation produced successfully by Gemini', {
      correlationId,
      action: validatedRecommendation.recommended_action,
      probability: validatedRecommendation.recovery_probability
    });

    return {
      success: true,
      source: 'GEMINI',
      recommendation: validatedRecommendation,
      modelVersion: 'gemini-flash-latest'
    };
  } catch (error) {
    clearTimeout(timeoutId);
    geminiCircuitBreaker.recordFailure(error);

    logger.warn('AI Provider failure or validation error — engaging deterministic fallback', {
      correlationId,
      error: error.message
    });

    const fallback = getFallbackRecommendation({
      payment,
      customerContext,
      retryCount,
      fallbackTriggerReason: error.message
    });

    return {
      success: false,
      source: 'RULE_BASED_FALLBACK',
      recommendation: fallback,
      error: error.message,
      modelVersion: 'rule-based-fallback-v1'
    };
  }
}
