# 🎙️ 60-Second & 30-Second Hackathon Pitches

---

## ⚡ 30-Second Project Introduction (Elevator Hook)

> "15% to 20% of online payments fail due to temporary balance issues, network drops, or OTP dropouts, costing merchants billions in lost revenue. Naive automatic retries spam customers and violate card rules.
> 
> **RazorRecover** is a safety-first revenue recovery engine for Razorpay merchants. Our core rule: **'AI recommends, backend policy decides.'** 
> 
> We combine an explainable Logistic Regression probability score with Google Gemini for intelligent advisory strategies, enforce a strict 15-rule financial policy engine, schedule actions safely with BullMQ, and prove an incremental **+48% net recovery lift** on 10,000 synthetic transactions with 100% opt-out safety."

---

## 🎯 60-Second Hackathon Judge Pitch

> "Hello judges, I’m Santosh Ray. 
> 
> Failed payments are an enormous leak in merchant revenue. Today, merchants either do nothing, losing legitimate customers, or run blind 24-hour retries that fail, anger customers, and risk compliance penalties.
> 
> Large Language Models can generate smart recovery strategies, but you cannot let an LLM directly execute financial transactions—they hallucinate and fail unpredictably.
> 
> That’s why we built **RazorRecover** with a strict architectural boundary: **AI recommends, but deterministic backend policies decide.**
> 
> When a Razorpay webhook detects a failed payment:
> 1. Our ML model computes an explainable 0-to-1 recovery probability.
> 2. Google Gemini suggests a tailored strategy—like waiting 6 hours for liquidity replenishment or offering a UPI checkout link.
> 3. Our 15-rule deterministic policy engine checks financial safety, gates high-value cases over ₹10,000 for human review, and enforces 100% customer opt-out compliance.
> 4. Approved actions are queued reliably via BullMQ + Redis and executed with complete idempotency and an immutable audit trail.
> 
> On our 10,000-transaction simulation benchmark, RazorRecover delivered a **+48% lift in recovered revenue** over standard heuristics while maintaining zero unauthorized charges.
> 
> RazorRecover turns lost transactions into protected, verifiable revenue."

---

## 🔑 Key Punchlines & Soundbites

* **Core Principle:** *"AI recommends. Backend policy decides."*
* **Primary Metric:** *"Actual revenue genuinely recovered in paise—never fabricated, never blended."*
* **Safety First:** *"Zero card/CVV storage, 100% opt-out enforcement, and role-gated operator review for high-value transactions."*
