# Security, Privacy & Compliance Architecture

## 1. Webhook Signature Verification
* Ingests raw JSON bytes (`express.raw({ type: 'application/json' })`) before JSON parsing.
* Validates Razorpay `x-razorpay-signature` using HMAC-SHA256 and timing-safe equality (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
* Unauthorized or forged payloads are rejected immediately with HTTP 401.

---

## 2. Multi-Tenant Merchant Isolation
* Every database entity (`Payment`, `RecoveryCase`, `Customer`, `RecoveryAction`, `AuditLog`, `SimulationRun`) contains an indexed `merchantId`.
* API controllers enforce tenant isolation via JWT tokens; Merchant A is structurally incapable of querying or mutating Merchant B's records.

---

## 3. Privacy & Zero-Card-Data Architecture
* **Zero Sensitive Financial Storage:** Under no circumstances does RazorRecover store credit card numbers, CVV codes, bank passwords, or raw payment tokens.
* **PII Masking:** Customer identifiers are masked in all logs and presentation views (`r***r@domain.com`, `+91*****3210`).
* **Compliance & Opt-Out:** Customer opt-out preferences (`optedOutOfRecovery: true`) immediately lock recovery communications with 100% policy enforcement.

---

## 4. Operational Defenses
* **Rate Limiting:** Webhook endpoint bounded at 120 req/min; auth endpoints guarded against brute-force attacks at 30 req/15min.
* **HTTP Security Headers:** Integrated Helmet with XSS, MIME-sniffing, and frameguard protections.
* **Audit Trail Immutability:** Chronological write-once audit log entries capturing timestamp, actor (`system`, `ai`, `policy_engine`, `human`, `worker`), and trace correlation IDs.
