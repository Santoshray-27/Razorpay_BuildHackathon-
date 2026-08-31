# 🛡️ Honest Limitations & Future Roadmap

In the spirit of FinTech transparency and engineering rigor, the current capabilities, operational boundaries, and roadmap for RazorRecover are documented below.

---

## 1. Current MVP Scope & Boundaries

1. **No Real Customer Funds Moved:**
   * RazorRecover operates strictly in **Razorpay Test Mode** and **Transparent Mock/Simulation Mode**. It generates genuine test payment links and validates signatures, but never moves live production currency.
2. **Consent & Mandate Compliance:**
   * Automatic background re-attempts are only permitted when the payment method supports tokenized auto-debit mandates or when the merchant dispatches a customer-initiated payment link. RazorRecover never attempts unauthorized card re-charges without user authentication.
3. **Synthetic Simulation vs. Live Historical Datasets:**
   * The 10,000-transaction simulation demonstrates provable incremental lift using ground-truth mathematical correlations (e.g. liquidity replenishment, opt-out enforcement, OTP dropouts). Production deployment will require fine-tuning the logistic regression weights against the merchant's real historical transaction telemetry.
4. **Cost & Rate Limit Proxy in Bulk Simulation:**
   * Bulk 10,000-transaction simulations utilize our trained Logistic Regression ML probability model + Strategy proxy + Policy Engine to prevent thousands of dollars in unnecessary LLM API costs and rate-limit drops. Live product cases utilize the real Google Gemini LLM adapter.

---

## 2. Production Roadmap & Future Work

* **Multi-Gateway Smart Routing:** Expanding beyond Razorpay to dynamically route payment retries across backup merchant acquiring gateways (e.g. Cashfree, PayU, Stripe) during bank outages.
* **WhatsApp Conversational Recovery Bot:** Interactive conversational payment links sent directly over official WhatsApp Business API with OTP auto-resend.
* **Reinforcement Learning from Merchant Feedback:** Dynamically tuning policy engine approval thresholds per merchant category (e.g. SaaS vs. luxury goods vs. micro-transactions).
* **Automated Chargeback & Fraud Risk Guard:** Integrating Razorpay Thirdwatch fraud score signals before initiating payment recovery.
