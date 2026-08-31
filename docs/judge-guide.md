# 🧑‍⚖️ Evaluator & Judge Quick Guide (3 to 5 Minutes)

Welcome, hackathon judges! Follow this fast-track guide to evaluate **RazorRecover** locally or on the live deployment.

---

## ⚡ 3-Minute Fast Evaluation Flow

### Step 1: Login in 1 Click
1. Open the frontend dashboard: `[YOUR_DEPLOYED_FRONTEND_URL]` or `http://localhost:5173`.
2. On `/login`, click the **`⚡ Sign in as Demo Merchant Admin`** button.
3. You will be authenticated immediately as `Demo Merchant Owner` (`merchant_admin`).

---

### Step 2: Simulate a Failed Payment
1. On the left sidebar, locate the **Judge Quick Demo** panel.
2. Click **`⚡ Simulate ₹4,999 Failure`**.
3. You will see a green toast confirming that a ₹4,999 failed transaction has been ingested via webhook in the `DETECTED` state.

---

### Step 3: Step Through the AI + Policy Workflow
1. Navigate to **Recovery Cases** (`/cases`) in the sidebar.
2. Click **`Inspect Case`** on the newly created case.
3. Step through the interactive buttons at the top of the case:
   * Click **`1. Run AI Analysis`** $\to$ Observe ML recovery probability ($78\%$) and Gemini advisory recommendation validated via Zod.
   * Click **`2. Evaluate Policy`** $\to$ Observe the 15-Rule Policy Engine evaluation granting an authoritative `APPROVED` decision.
   * Click **`3. Execute Recovery (Demo)`** $\to$ BullMQ schedules and executes the action, transitioning the case to **`Recovered`** and capturing ₹4,999 in recovered revenue!
4. Scroll down to inspect:
   * **Hybrid Explainability Panel:** Logistic Regression feature contributions vs. Gemini reasoning text.
   * **Immutable Audit Trail:** Write-once chronological log with actor badges (`system`, `ai`, `policy_engine`, `worker`) and trace correlation IDs.

---

### Step 4: Run the 10,000-Transaction Simulation
1. Click **Simulation & Benchmark** (`/simulator`) in the sidebar.
2. Click **`⚡ Run 10,000-Transaction Comparative Benchmark`**.
3. Observe the Recharts comparison chart proving an incremental **`+48.2%` recovery lift** over standard rule-based heuristics with **100% customer opt-out compliance**.

---

## 🧪 Run Automated Test Suite
To verify the 43 automated unit and integration tests:
```bash
cd backend
npm test -- --runInBand
```
