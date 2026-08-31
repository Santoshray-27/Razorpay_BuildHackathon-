# System Architecture & Technical Design

## 1. High-Level System Architecture

```mermaid
flowchart TD
    A[Razorpay Payment Failure Webhook] -->|Raw JSON Body| B(HMAC-SHA256 Signature Verification)
    B -->|Verified Event| C[Webhook Ingestion & Idempotency Store]
    C -->|New Failure| D[Revenue Risk Engine]
    D -->|State: DETECTED| E[Recovery Case & Privacy Context]
    
    E --> F[Hybrid Intelligence Layer]
    F -->|Feature Vector| G[Logistic Regression ML Model\n0.0 - 1.0 Probability]
    F -->|Sanitized Context| H[Google Gemini LLM Advisory\nStrategy & Reasoning]
    
    G --> I[Zod Schema Validation Engine]
    H --> I
    
    I --> J{15-Rule Deterministic Policy Engine}
    J -->|High Value >= 10k or Low Conf| K[Human Review Queue\nOperator Approval]
    K -->|Approved| L[BullMQ + Redis Queue\nDelayed Action Job]
    J -->|Auto-Approved| L
    J -->|Policy Blocked / Opt-Out| M[Case STOPPED / CLOSED]
    
    L --> N[Recovery Worker Process]
    N -->|Idempotent Lock Guard| O[Recovery Executor Adapter\nRazorpay Test / Mock]
    O -->|Success| P[State: RECOVERED\nRevenue Captured in Paise]
    
    E -.-> Q[(Immutable Audit Trail Log\nActor + Trace ID)]
    J -.-> Q
    K -.-> Q
    N -.-> Q
    P -.-> Q
```

---

## 2. Fundamental FinTech Boundary
> **"AI Recommends. Backend Policy Decides."**

In financial transactions, Large Language Models are non-deterministic and prone to hallucination. RazorRecover enforces a strict architectural boundary:
* **The AI Layer is purely advisory:** Generates structured strategy JSON validated strictly via Zod (`RecoveryRecommendationSchema`).
* **The Backend Policy Engine is the sole authority:** Evaluates deterministic financial rules (amount limits $\ge ₹10,000$, customer opt-outs, retry limits, active locks) before any action can ever be queued or executed.
* **The Worker executes safely:** Ensures idempotent execution via unique keys and prevents duplicate double-charges.

---

## 3. Asynchronous Job Processing (BullMQ & Redis)
* Delayed recovery actions (e.g. `RETRY_LATER` after 6 hours) are persisted in Redis.
* Independent worker processes (`npm run worker`) run outside the API server to protect HTTP latency.
* **Demo Time Compression:** In `MOCK_DEMO` mode, delays compress (e.g. 6 hours $\to$ 30 seconds) for real-time hackathon judging observation.

---

## 4. Finite State Machine Transitions

```mermaid
stateDiagram-v2
    [*] --> detected: Failed Payment Webhook
    detected --> analyzing: Explicit Analysis Requested
    analyzing --> recommended: AI Recommendation Validated
    recommended --> pending_approval: High-Value or Low Confidence
    recommended --> approved: Deterministic Policy Passed
    pending_approval --> approved: Operator Authorized
    pending_approval --> stopped: Operator Rejected
    approved --> scheduled: Enqueued in BullMQ
    scheduled --> executing: Worker Acquired Lock
    executing --> recovered: Payment Succeeded
    executing --> analyzing: Transient Retry < 3
    executing --> failed: Retries Exhausted (>= 3)
    detected --> stopped: Opt-Out / Expiry
```
