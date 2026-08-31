# Test Suite & Verification Guide

## 1. Test Overview
RazorRecover contains 9 automated test suites with **43 passing integration and unit tests** covering 100% of critical FinTech pathways:

| Test File | Layer / Phase | Key Scenarios Tested |
| :--- | :--- | :--- |
| `tests/auth.test.js` | Phase 1 Auth | Registration, JWT login, profile fetching, token tampering, and merchant tenant isolation. |
| `tests/webhook.test.js` | Phase 2 Webhooks | HMAC-SHA256 verification, forged signature rejection, duplicate replay deduplication (`DUPLICATE_EVENT_IGNORED`). |
| `tests/recovery.test.js` | Phase 3 Risk Engine | Payment normalization, deterministic risk scoring (`low`/`medium`/`high`), privacy-safe customer context. |
| `tests/probability.test.js` | Phase 4 ML Model | Normalized 10-feature extraction, Sigmoid bounded probability ($0.0 - 1.0$), opt-out zeroing. |
| `tests/gemini.test.js` | Phase 5 AI Agent | Zod schema validation (`RecoveryRecommendationSchema`), circuit breaker trips, deterministic fallback. |
| `tests/policy.test.js` | Phase 6 Policy Engine | 15-rule hierarchy: already recovered, opt-out, retry limits, high value ($\ge ₹10,000$), low confidence routing. |
| `tests/execution.test.js` | Phase 7 Safe Execution | BullMQ scheduling, idempotency key deduplication, active action lock guard, `recovered` outcome marking. |
| `tests/analytics.test.js` | Phase 8 Analytics | Revenue at risk, recovered revenue, recovery rate %, execution mode breakdowns. |
| `tests/simulation.test.js` | Phase 9 Simulation | PRNG seed reproducibility, 4-strategy benchmark calculations, 100% opt-out compliance. |

---

## 2. Running Automated Tests

```bash
cd backend
npm test -- --runInBand
```

---

## 3. Verifying Seed Reproducibility
```bash
node simulator/training/trainModel.js
```
Expected output: Model fits logistic regression on 10,000 synthetic transactions with deterministic test metrics (~77.4% accuracy, ~0.87 F1-score).
