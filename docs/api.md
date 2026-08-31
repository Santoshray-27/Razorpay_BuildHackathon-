# API Reference Guide

All endpoints return standardized JSON with a `correlationId` tracking header.

## 1. Authentication
* `POST /api/auth/register` — Register a merchant owner or operator (`merchant_admin` / `merchant_operator`).
* `POST /api/auth/login` — Sign in and receive a JWT.
* `GET /api/auth/me` — Retrieve current merchant session profile.

## 2. Ingestion & Webhooks
* `POST /api/webhooks/razorpay` — Ingests signed Razorpay webhooks with raw-body HMAC-SHA256 signature verification.
* `POST /api/webhooks/dev-fixture` — Local sandbox fixture injector (disabled in production).

## 3. Payments & Recovery Cases
* `GET /api/payments` — List merchant transactions with search & status filters.
* `GET /api/recovery/cases` — List paginated recovery cases.
* `GET /api/recovery/:id` — Retrieve full case inspector details, explainability scores, and immutable audit timeline.
* `POST /api/recovery/:id/analyze` — Run hybrid ML probability + Gemini AI strategy recommendation.
* `POST /api/recovery/:id/evaluate-policy` — Run deterministic 15-rule policy engine.
* `POST /api/recovery/:id/schedule` — Schedule approved action into BullMQ queue.
* `POST /api/recovery/:id/execute` — Execute recovery action directly for demo verification.

## 4. Human Review & Policy Controls
* `GET /api/recovery/pending-approvals` — List cases escalated to operator review.
* `POST /api/recovery/:id/approve` — Approve escalated action (Role-gated: Admin/Operator).
* `POST /api/recovery/:id/reject` — Reject escalated action (Role-gated: Admin/Operator).
* `POST /api/recovery/:id/stop` — Terminate recovery process.

## 5. Analytics & Simulation
* `GET /api/analytics/overview` — Real-time KPIs (Revenue at Risk, Recovered Revenue, Recovery Rate %).
* `GET /api/analytics/recovery` — Strategy conversion breakdown.
* `GET /api/analytics/failures` — Failure reason distribution.
* `GET /api/analytics/funnel` — Pipeline stage progression counts.
* `POST /api/simulator/generate` — Generate 10,000 synthetic transaction dataset.
* `POST /api/simulator/run` — Run 4-strategy comparative simulation benchmark.
