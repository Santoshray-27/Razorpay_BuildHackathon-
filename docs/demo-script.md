# 🎬 RazorRecover — 5-Minute Video Demo Script

**Presenter:** Santosh Ray  
**Target Audience:** Razorpay Hackathon Judges & FinTech Evaluators  
**Total Duration:** ~5:00 minutes  

---

### [0:00 – 0:45] Phase 1: Problem Statement & FinTech Safety Rule
* **On Screen:** Dashboard Login Page (`[YOUR_DEPLOYED_FRONTEND_URL]/login` or `http://localhost:5173/login`).
* **Speaker:**
  > "Hi everyone, I'm Santosh Ray. E-commerce merchants lose up to 20% of their top-line revenue to failed transactions—temporary balance constraints, OTP timeouts, or expired cards.
  > 
  > Blind 24-hour retries spam users and break compliance. But handing payment execution to Large Language Models is dangerous because LLMs hallucinate.
  > 
  > In RazorRecover, our foundational principle is: **'AI recommends. Backend policy decides.'** 
  > Let's log in to the merchant dashboard."
* **Action:** Click **`⚡ Sign in as Demo Merchant Admin`**.

---

### [0:45 – 1:30] Phase 2: Overview Telemetry & Real-Time KPIs
* **On Screen:** Executive Overview Dashboard (`/`).
* **Speaker:**
  > "Here on the merchant overview, every metric is computed from real database state in integer **paise** and formatted strictly at presentation.
  > 
  > We track **Revenue at Risk**, **Recovered Revenue**, and **Recovery Rate**. Notice our transparent environment indicator: `EXECUTION MODE: MOCK_DEMO`—we never blend synthetic or test data with real merchant money.
  > 
  > Let's simulate a real-world scenario where a ₹4,999 payment fails due to temporary insufficient funds."
* **Action:** In the left sidebar, click the **`⚡ Simulate ₹4,999 Failure`** quick demo button.

---

### [1:30 – 2:45] Phase 3: Case Inspector & Hybrid Intelligence Workbench
* **On Screen:** Navigate to **Recovery Cases** (`/cases`) and click **`Inspect Case`** on the new case.
* **Speaker:**
  > "When the Razorpay webhook arrives, our receiver verifies the raw HMAC-SHA256 signature, deduplicates the event, normalizes customer context without storing sensitive card or CVV data, and creates this case in the `DETECTED` state.
  > 
  > Let's step through our hybrid intelligence pipeline:"
* **Actions:**
  1. **Click `[1. Run AI Analysis]`**:
     > "First, our custom Logistic Regression model computes an explainable 78% recovery probability. Google Gemini evaluates the customer context and recommends `RETRY_LATER` with a 6-hour delay to allow balance replenishment. Every output is strictly validated by Zod."
  2. **Click `[2. Evaluate Policy]`**:
     > "Next, our pure 15-Rule Deterministic Policy Engine runs. It verifies the case is unrecovered, within retry limits, and opt-out clean. It grants an authoritative `APPROVED` decision."
  3. **Click `[3. Execute Recovery (Demo)]`**:
     > "Finally, our BullMQ queue schedules the action. In Demo Mode, our 6-hour delay compresses to 30 seconds. The worker executes the re-attempt, marks the case `Recovered`, and captures ₹4,999 in recovered revenue!
     > 
     > Below, our **Immutable Audit Timeline** records every timestamp, actor badge, and trace correlation ID."

---

### [2:45 – 3:30] Phase 4: Human-in-the-Loop Review Queue
* **On Screen:** Click **`Human Review Queue`** (`/review-queue`).
* **Speaker:**
  > "What happens on high-value transactions or low AI confidence? 
  > 
  > In RazorRecover, any transaction over ₹10,000 or with AI confidence below 70% is automatically routed to this **Human Review Queue**. 
  > 
  > Merchant operators can inspect the customer context and provide explicit, role-gated approvals or rejections with justification recorded directly into the audit log."

---

### [3:30 – 4:30] Phase 5: 10,000-Transaction Simulation Benchmark
* **On Screen:** Click **`Simulation & Benchmark`** (`/simulator`).
* **Speaker:**
  > "To prove incremental business lift, we built a deterministic simulation engine running across 10,000 synthetic transactions using a Mulberry32 PRNG seed for 100% reproducibility."
* **Action:** Click **`⚡ Run 10,000-Transaction Comparative Benchmark`**.
* **Speaker:**
  > "Here are the four strategies evaluated on the exact same population:
  > 1. **No Recovery:** 0% recovery baseline.
  > 2. **Fixed 24h Retry:** Recovers ~14.5%, but violates customer opt-outs.
  > 3. **Rule-Based Heuristics:** Recovers ~28.2%.
  > 4. **RazorRecover (AI + Policy):** Achieves **~41.8% recovery rate**—a **+48.2% net lift** over standard rules with 100% opt-out compliance.
  > 
  > To control cost and latency, bulk simulations use our trained ML model and policy proxy, while live cases execute through real Gemini LLM adapters."

---

### [4:30 – 5:00] Phase 6: Conclusion & Architecture Summary
* **On Screen:** Root Dashboard or Architecture Diagram.
* **Speaker:**
  > "RazorRecover is built on Express ESM, React Vite, Tailwind CSS, BullMQ, Redis, MongoDB, and Jest with 43 automated tests passing.
  > 
  > It turns failed payment leaks into reliable, policy-controlled recovered revenue. Thank you!"

---

## 📝 Demo Checklist Before Recording

- [ ] Backend server running on `http://localhost:5000` (or Render deployed URL).
- [ ] Frontend client running on `http://localhost:5173` (or Vercel deployed URL).
- [ ] BullMQ background worker active (`npm run worker`).
- [ ] Browser zoom set to 100% or 110% for crisp text legibility.
- [ ] Ensure microphone audio is clear and quiet.
