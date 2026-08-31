# System Architecture & Technical Design

## 1. High-Level System Architecture

```text
                                 [ Razorpay Gateway ]
                                           │
                                 (Raw Webhook Event)
                                           ▼
                            [ Ingestion & HMAC Verify ]
                                           │
                                           ▼
                                 [ Risk Engine ] ──► [ DETECTED ]
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
            [ Logistic Regression ML ]               [ Google Gemini LLM ]
              Numeric Probability                      Strategy Advisory
                 (0.0 to 1.0)                        (Zod Validated JSON)
                        └──────────────────┬──────────────────┘
                                           │
                                           ▼
                           [ Deterministic Policy Engine ]
                           (Authoritative 15-Rule Hierarchy)
                                           │
                        ┌──────────────────┴──────────────────┐
                        │                                     │
                 [ APPROVED ]                        [ PENDING_APPROVAL ]
                        │                                     │
                        ▼                              (Human Operator)
               [ BullMQ + Redis ]                             │
              (Delayed Queueing)                              ▼
                        │                                [ APPROVED ]
                        ▼                                     │
               [ Recovery Worker ] ◄──────────────────────────┘
                        │
                        ▼
               [ Outcome Execution ] ──► [ RECOVERED ]
```

---

## 2. Fundamental FinTech Boundary
> **"AI Recommends. Backend Policy Decides."**

In modern payment systems, Large Language Models are non-deterministic and hallucination-prone. RazorRecover enforces a strict architectural boundary:
* **The AI Layer is purely advisory:** Generates structured recommendations validated strictly via Zod.
* **The Backend Policy Engine is the single authority:** Evaluates deterministic financial thresholds (amount limits $\ge ₹10,000$, customer opt-outs, retry limits, active locks) before any action can ever be queued or executed.
* **The Worker executes safely:** Ensures idempotent execution via unique keys and prevents duplicate double-charges.

---

## 3. Asynchronous Job Processing (BullMQ & Redis)
* Delayed recovery actions (e.g. `RETRY_LATER` after 6 hours) are persisted in Redis.
* Independent worker processes (`npm run worker`) run outside the API server to protect HTTP latency.
* **Demo Time Compression:** In `MOCK_DEMO` mode, delays compress (e.g. 6 hours $\to$ 30 seconds) for real-time hackathon judging observation.

---

## 4. Finite State Machine Transitions

`detected` $\to$ `analyzing` $\to$ `recommended` $\to$ (`pending_approval` / `approved`) $\to$ `scheduled` $\to$ `executing` $\to$ `recovered` / `stopped` / `failed` / `expired`.
