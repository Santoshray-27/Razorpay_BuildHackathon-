# Responsible AI & Safety Architecture

## Fundamental Fintech Boundary
> **"AI recommends. Backend policy decides."**

Under no circumstances is the Large Language Model (Gemini) permitted to:
- Directly invoke payment gateways or initiate transactions.
- Dispatch customer emails, SMS, or WhatsApp notifications.
- Mutate database state or change financial balances.
- Override retry count limits, customer opt-outs, or merchant policy rules.

The AI layer functions exclusively as an **advisory intelligence engine** returning a structured recommendation JSON validated strictly by Zod.

---

## Hybrid Intelligence Pipeline

```text
[ Failed Payment + Customer Signals ]
                 │
        ┌────────┴────────┐
        ▼                 ▼
Logistic Regression   Google Gemini LLM
Numeric Probability   Strategy & Reason
 (0.0 to 1.0)         (Advisory JSON)
        └────────┬────────┘
                 ▼
       Zod Schema Validation
                 │
       [ Circuit Breaker ]
        ├── Pass ──► Deterministic Policy Engine
        └── Fail ──► Rule-Based Safe Fallback
```

---

## AI Resilience & Graceful Degradation

1. **Strict Zod Schema Enforcement (`RecoveryRecommendationSchema`):** Rejects invalid JSON, hallucinated properties, or out-of-range action types.
2. **Circuit Breaker:** Temporarily trips open after consecutive provider errors or rate limits, preventing API lockups.
3. **Deterministic Fallback Engine:** Produces conforming, safe recommendations (defaulting to `HUMAN_REVIEW` or safe delays) whenever Gemini is unavailable or `AI_ENABLED=false`.
4. **Recommendation History Auditability:** All recommendations log their explicit source (`GEMINI`, `RULE_BASED_FALLBACK`, or `SIMULATOR_PROXY`) in immutable audit logs.
