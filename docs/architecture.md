# RazorRecover Architecture & Safety Blueprint

## Core Philosophy
> **"AI recommends. Backend policy decides."**

The LLM (Gemini) acts strictly in an advisory capacity and is never allowed to directly call payment APIs, alter database state, or trigger customer notifications. The backend Deterministic Policy Engine is the sole authority for action approval.

## End-to-End Flow Diagram

```text
Razorpay Test Webhook / Simulated Event
                 │
                 ▼
     Express Webhook Receiver
   (Raw Body + HMAC-SHA256)
                 │
                 ▼
       Webhook Event Store
 (Idempotency + Correlation ID)
                 │
                 ▼
  Payment & Recovery Case Service
     (Risk Engine + Audit Logs)
                 │
                 ▼
     Customer Context Service
                 │
      ┌──────────┴───────────┐
      ▼                      ▼
Logistic Regression    Gemini Provider
 (Probability: 0-1)   (Strategy + Reason)
      └──────────┬───────────┘
                 ▼
       Zod Output Validation
  (Circuit Breaker + Fallback)
                 │
                 ▼
    Deterministic Policy Engine
                 │
        ┌────────┴────────┐
        ▼                 ▼
  BullMQ + Redis    Human Review
  (Approved Jobs)   (High Risk / Low Conf)
        │
        ▼
   Safe Action Executor
 (Idempotent Lock Guard)
        │
        ▼
 Persisted Outcome + Audit Log
 (RAZORPAY_TEST | MOCK_DEMO | SIMULATION)
```

## Money Safety Rule
Monetary amounts are ALWAYS stored and processed internally in the smallest currency unit (**paise**, e.g., ₹4,999 is stored as `499900`). Conversions to Rupees happen only at presentation time in the UI.
