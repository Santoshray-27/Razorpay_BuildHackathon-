/**
 * backend/src/workflows/recoveryStateMachine.js
 * Explicit deterministic state machine for RecoveryCase lifecycle.
 * Prevents invalid state jumps, race conditions, and ensures atomic transitions.
 */

export const RECOVERY_STATES = {
  DETECTED: 'detected',
  ANALYZING: 'analyzing',
  RECOMMENDED: 'recommended',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  SCHEDULED: 'scheduled',
  EXECUTING: 'executing',
  RECOVERED: 'recovered',
  STOPPED: 'stopped',
  FAILED: 'failed',
  EXPIRED: 'expired'
};

// Permitted directed state transitions
const STATE_TRANSITIONS = {
  [RECOVERY_STATES.DETECTED]: [
    RECOVERY_STATES.ANALYZING,
    RECOVERY_STATES.STOPPED,
    RECOVERY_STATES.EXPIRED
  ],
  [RECOVERY_STATES.ANALYZING]: [
    RECOVERY_STATES.RECOMMENDED,
    RECOVERY_STATES.PENDING_APPROVAL,
    RECOVERY_STATES.APPROVED,
    RECOVERY_STATES.STOPPED,
    RECOVERY_STATES.FAILED
  ],
  [RECOVERY_STATES.RECOMMENDED]: [
    RECOVERY_STATES.PENDING_APPROVAL,
    RECOVERY_STATES.APPROVED,
    RECOVERY_STATES.STOPPED,
    RECOVERY_STATES.EXPIRED
  ],
  [RECOVERY_STATES.PENDING_APPROVAL]: [
    RECOVERY_STATES.APPROVED,
    RECOVERY_STATES.STOPPED,
    RECOVERY_STATES.EXPIRED
  ],
  [RECOVERY_STATES.APPROVED]: [
    RECOVERY_STATES.SCHEDULED,
    RECOVERY_STATES.STOPPED,
    RECOVERY_STATES.EXPIRED
  ],
  [RECOVERY_STATES.SCHEDULED]: [
    RECOVERY_STATES.EXECUTING,
    RECOVERY_STATES.STOPPED,
    RECOVERY_STATES.EXPIRED
  ],
  [RECOVERY_STATES.EXECUTING]: [
    RECOVERY_STATES.RECOVERED,
    RECOVERY_STATES.ANALYZING, // Next attempt loop if eligible
    RECOVERY_STATES.FAILED,
    RECOVERY_STATES.STOPPED
  ],
  // Terminal states (no further transitions allowed)
  [RECOVERY_STATES.RECOVERED]: [],
  [RECOVERY_STATES.STOPPED]: [],
  [RECOVERY_STATES.FAILED]: [],
  [RECOVERY_STATES.EXPIRED]: []
};

/**
 * Validates if a state transition from currentStatus to targetStatus is permitted.
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {boolean}
 */
export function isValidTransition(currentStatus, targetStatus) {
  if (currentStatus === targetStatus) return true;
  const allowed = STATE_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(targetStatus));
}

/**
 * Returns true if the case is in a terminal/closed state.
 */
export function isTerminalState(status) {
  return [
    RECOVERY_STATES.RECOVERED,
    RECOVERY_STATES.STOPPED,
    RECOVERY_STATES.FAILED,
    RECOVERY_STATES.EXPIRED
  ].includes(status);
}
