/**
 * backend/src/ai/circuitBreaker.js
 * In-memory circuit breaker for external AI provider resilience.
 * Temporarily trips open after threshold failures and auto-resets after cooldown.
 */

import { logger } from '../observability/logger.js';

class CircuitBreaker {
  constructor({
    failureThreshold = 3,
    cooldownMs = 30000 // 30 seconds
  } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  isOpen() {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed > this.cooldownMs) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker entering HALF_OPEN trial state.');
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  recordFailure(error) {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.warn(`🚨 AI Circuit Breaker TRIPPED to OPEN after ${this.failureCount} consecutive failures.`, {
        lastError: error?.message
      });
    }
  }

  reset() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }
}

export const geminiCircuitBreaker = new CircuitBreaker();
