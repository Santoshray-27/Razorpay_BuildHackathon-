/**
 * backend/src/providers/mockRecoveryProvider.js
 * Deterministic, transparent Mock & Simulation Action Executor.
 * Never falsely claims real financial movements; clearly stamps outcomes with executionMode.
 */

export async function executeMockAction({
  actionType,
  recoveryCase,
  payment,
  customerContext,
  executionMode = 'MOCK_DEMO'
}) {
  const amountPaise = recoveryCase.amountAtRiskPaise || payment.amountPaise;
  const probability = recoveryCase.recoveryProbability || 0.70;

  switch (actionType) {
    case 'RETRY_LATER': {
      // Deterministic simulation outcome based on calculated probability threshold
      const isSimulatedSuccess = probability >= 0.60 && !customerContext.optedOutOfRecovery;

      if (isSimulatedSuccess) {
        return {
          outcome: 'SIMULATED_RECOVERY_SUCCESS',
          recovered: true,
          recoveredAmountPaise: amountPaise,
          executionMode,
          details: {
            message: `Simulated re-attempt completed successfully. Recovered ₹${(amountPaise / 100).toFixed(2)}.`,
            reAttemptReference: `sim_tx_${Date.now()}`
          }
        };
      } else {
        return {
          outcome: 'SIMULATED_RECOVERY_FAILURE',
          recovered: false,
          recoveredAmountPaise: 0,
          executionMode,
          details: {
            message: 'Simulated re-attempt declined due to low recovery score or issuer constraint.',
            reason: 'SIMULATED_DECLINE'
          }
        };
      }
    }

    case 'SEND_REMINDER':
      return {
        outcome: 'REMINDER_RECORDED',
        recovered: false,
        recoveredAmountPaise: 0,
        executionMode,
        details: {
          channel: 'EMAIL_AND_SMS',
          message: 'Payment recovery reminder recorded and dispatched to customer reference.'
        }
      };

    case 'OFFER_ALTERNATIVE_METHOD':
      return {
        outcome: 'ALTERNATIVE_METHOD_OFFER_RECORDED',
        recovered: false,
        recoveredAmountPaise: 0,
        executionMode,
        details: {
          suggestedMethod: 'UPI_FAST_CHECKOUT',
          message: 'Alternative payment option offered to customer.'
        }
      };

    case 'HUMAN_REVIEW':
      return {
        outcome: 'CUSTOMER_REATTEMPT_REQUIRED',
        recovered: false,
        recoveredAmountPaise: 0,
        executionMode,
        details: {
          message: 'Action escalated to merchant operator queue.'
        }
      };

    case 'STOP_RECOVERY':
    default:
      return {
        outcome: 'RECOVERY_STOPPED',
        recovered: false,
        recoveredAmountPaise: 0,
        executionMode,
        details: {
          message: 'Recovery workflow terminated per safety policy.'
        }
      };
  }
}
