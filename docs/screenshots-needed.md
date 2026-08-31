# 📸 Required Submission Screenshots & Media Assets

Capture the following screenshots from your local or deployed dashboard to include in your hackathon submission portfolio, pitch deck, and README:

---

## 1. Primary Dashboard Overview
* **Route:** `/`
* **File to Save:** `docs/screenshots/01_overview_dashboard.png`
* **What to Highlight:**
  * 6 Top KPI Cards (**Revenue at Risk**, **Recovered Revenue**, **Recovery Rate %**, **Failed Payments**, **Active Cases**, **Pending Approvals**).
  * **Recovery Pipeline Funnel** and **Failure Reasons Breakdown** Recharts charts.
  * **Execution Mode Badge:** `MOCK_DEMO` / `RAZORPAY_TEST`.

---

## 2. Interactive Case Inspector & Workflow Workbench
* **Route:** `/cases/:id`
* **File to Save:** `docs/screenshots/02_case_detail_workbench.png`
* **What to Highlight:**
  * Interactive Action Buttons: `[1. Run AI Analysis]`, `[2. Evaluate Policy]`, `[3. Execute Recovery]`.
  * Payment Summary (₹4,999.00 in Paise) and Privacy-Safe Customer Context (masked email & phone, opt-out status).
  * Status Badge: `RECOVERED`.

---

## 3. Hybrid Intelligence Explainability Panel
* **Route:** `/cases/:id` (scrolled to mid-page)
* **File to Save:** `docs/screenshots/03_explainability_panel.png`
* **What to Highlight:**
  * **Left Side:** Logistic Regression score ($0.0 - 1.0$) with key feature contributions (+ historical success rate, - retry decay).
  * **Right Side:** Google Gemini advisory strategy (`RETRY_LATER` after 6h), confidence score, and contextual reasoning text.
  * Zod Schema Validation badge.

---

## 4. Deterministic Policy Decision & Triggered Rules
* **Route:** `/cases/:id` (scrolled to policy card)
* **File to Save:** `docs/screenshots/04_policy_engine_decision.png`
* **What to Highlight:**
  * Policy Decision Badge: `APPROVED`.
  * Triggered Rules List (`PAYMENT_NOT_RECOVERED`, `AMOUNT_WITHIN_AUTO_LIMIT`, `OPT_OUT_NOT_SET`).

---

## 5. Immutable Audit Trail Timeline
* **Route:** `/cases/:id` (bottom of page)
* **File to Save:** `docs/screenshots/05_audit_timeline.png`
* **What to Highlight:**
  * Chronological event timeline showing actors (`system`, `ai`, `policy_engine`, `worker`).
  * Message descriptions and trace correlation IDs (`[Trace: req_...]`).

---

## 6. Human-in-the-Loop Review Queue
* **Route:** `/review-queue`
* **File to Save:** `docs/screenshots/06_human_review_queue.png`
* **What to Highlight:**
  * Escalated case cards requiring operator approval (High-value $\ge ₹10,000$ or low confidence).
  * `Approve Action` and `Reject / Stop` buttons.

---

## 7. 10,000-Transaction Simulation Benchmark
* **Route:** `/simulator`
* **File to Save:** `docs/screenshots/07_simulation_benchmark.png`
* **What to Highlight:**
  * 4-Strategy Comparison Matrix: No Recovery vs. Fixed Retry vs. Rule-Based vs. **RazorRecover (AI + Policy)**.
  * Recharts comparative bar chart showing **`+48.2%` Incremental Net Lift** with **100% Opt-Out Safety**.

---

## 8. Terminal / Test Suite Verification
* **Command:** `npm test -- --runInBand` in `backend/`
* **File to Save:** `docs/screenshots/08_test_suite_passing.png`
* **What to Highlight:**
  * All 9 test suites passing (43 / 43 tests).
