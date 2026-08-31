# RazorRecover Simulator

The simulator module generates approximately 10,000 synthetic transactions to benchmark and compare recovery strategies deterministically.

## Strategies Compared:
1. `NO_RECOVERY` — Baseline loss calculation
2. `FIXED_RETRY` — Naive immediate retry
3. `RULE_BASED_RECOVERY` — Static rules without ML/AI
4. `AI_ASSISTED_RECOVERY` — Hybrid Logistic Regression + Policy Engine

## Latent Features:
- Customer payment history
- Failure reason categorization
- Subscription status & loyalty segment
- Opt-out preferences

All simulation results are labeled with `executionMode: "SIMULATION"` and use a fixed random seed for 100% reproducibility.
