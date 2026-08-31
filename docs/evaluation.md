# 4-Strategy Simulation Benchmark & Evaluation Methodology

## 1. Executive Summary
RazorRecover provides an empirical, reproducible simulation harness evaluating **10,000 synthetic transactions** across four recovery strategies to rigorously measure genuine business lift:

1. **NO_RECOVERY:** The status quo baseline (zero recovery actions).
2. **FIXED_RETRY:** Rigid 1-retry at 24 hours (blind re-attempt ignoring failure cause and customer consent).
3. **RULE_BASED_RECOVERY:** Heuristic rule thresholds (retrying insufficient funds and network drops).
4. **AI_ASSISTED_RECOVERY (RazorRecover):** Hybrid ML probability scoring + intelligent strategy recommendation + 15-rule deterministic financial policy engine.

---

## 2. Evaluation Metrics Definition

| Metric | Mathematical Definition | Purpose |
| :--- | :--- | :--- |
| **Eligible Revenue at Risk** | $\sum \text{amountPaise of eligible failed payments}$ | Baseline volume at risk |
| **Recovered Revenue** | $\sum \text{recoveredAmountPaise of successful outcomes}$ | Absolute financial recovery |
| **Recovery Rate (%)** | $\frac{\text{Recovered Revenue}}{\text{Eligible Revenue at Risk}} \times 100$ | Overall conversion efficiency |
| **Incremental Lift (%)** | $\frac{\text{AI Recovered} - \text{Rule-Based Recovered}}{\text{Rule-Based Recovered}} \times 100$ | Net value added by AI + Policy |
| **Opt-Out Compliance Rate** | $\frac{\text{Non-violating actions}}{\text{Total Actions}} \times 100$ | Legal and safety compliance ($100\%$ required) |
| **Cost Efficiency** | $\frac{\text{Recovered Revenue (Paise)}}{\text{Total Actions Taken}}$ | Financial yield per notification/retry |

---

## 3. Cost & Latency Control Rule (Bulk Simulation Proxy)

> **FinTech Best Practice:**
> Making 10,000 live Large Language Model calls for a single simulation run would incur unnecessary API cost, high network latency, and non-deterministic run-to-run variance.
>
> * **Bulk 10,000 Simulation:** Employs the offline-trained Logistic Regression probability model + deterministic Strategy Proxy + the exact authoritative 15-Rule Policy Engine.
> * **Live Product Pipeline:** Individual failed webhook events use the real Google Gemini LLM adapter with Zod validation and circuit breaker guards.

---

## 4. Ground Truth & Seed Reproducibility
* **Mulberry32 PRNG:** Uses a 32-bit seeded pseudo-random number generator ensuring that executing the benchmark with the exact same seed (e.g. `seed = 42`) yields 100% bit-for-bit identical transaction populations and metrics.
* **Correlated Latent Dynamics:** Encodes real-world payment dynamics:
  * Repeat customers with high historical success rates recovering temporary liquidity constraints more frequently.
  * Repeated card declines and expired cards decaying in recoverability.
  * Opted-out customers strictly blocked from recovery contact.
