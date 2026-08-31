# 📊 Metric Definitions & Simulation Methodology

## 1. Primary Success Metric: Genuinely Recovered Revenue

In RazorRecover, every metric is computed strictly from stored database entities. We never fabricate numbers or blend mock test data into real merchant metrics.

---

## 2. Mathematical Metric Formulations

### 1. Revenue at Risk (Paise)
$$\text{Revenue at Risk} = \sum_{c \in \mathcal{C}_{\text{active}}} c.\text{amountAtRiskPaise}$$
* Where $\mathcal{C}_{\text{active}}$ is the set of recovery cases with status:
  $$\text{status} \in \{\text{detected}, \text{analyzing}, \text{recommended}, \text{pending\_approval}, \text{approved}, \text{scheduled}, \text{executing}\}$$

### 2. Recovered Revenue (Paise)
$$\text{Recovered Revenue} = \sum_{c \in \mathcal{C}_{\text{recovered}}} c.\text{recoveredAmountPaise}$$
* Where $\mathcal{C}_{\text{recovered}}$ is the set of cases with $\text{status} = \text{recovered}$.

### 3. Recovery Rate (%)
$$\text{Recovery Rate} = \left( \frac{\text{Recovered Revenue}}{\text{Revenue at Risk} + \text{Recovered Revenue}} \right) \times 100$$

### 4. Incremental Lift (%) vs Baseline
$$\text{Incremental Lift} = \left( \frac{\text{AI Recovered} - \text{Rule-Based Recovered}}{\text{Rule-Based Recovered}} \right) \times 100$$
*(Note: If baseline recovered revenue is zero, absolute incremental revenue in ₹ is displayed instead of division-by-zero).*

### 5. Opt-Out Compliance Rate (%)
$$\text{Opt-Out Compliance} = \left( \frac{\text{Total Actions} - \text{Opt-Out Violations}}{\text{Total Actions}} \right) \times 100$$
*(RazorRecover strictly enforces $100.0\%$ compliance across all automated pathways).*

### 6. Cost Efficiency (Paise per Action)
$$\text{Cost Efficiency} = \frac{\text{Total Recovered Revenue (Paise)}}{\text{Total Actions Attempted}}$$

---

## 3. Execution Mode Tagging & Integrity

Every Payment, RecoveryCase, and RecoveryAction carries an explicit `executionMode` attribute:

| Execution Mode | Definition | Data Source |
| :--- | :--- | :--- |
| `RAZORPAY_TEST` | Real flow using Razorpay Test Mode keys and payment links | Live Razorpay Sandbox API |
| `MOCK_DEMO` | Deterministic, transparent mock executor | Local mock engine with compressed delays |
| `SIMULATION` | Large-scale synthetic population evaluation | 10,000-transaction deterministic generator |

> **FinTech Credibility Rule:** Metrics are separated by `executionMode` in database aggregation pipelines. A merchant dashboard never presents synthetic simulation numbers as real Razorpay Test receipts.
