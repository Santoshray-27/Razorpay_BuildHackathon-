# RazorRecover — AI-Powered Revenue Recovery Engine

> **"AI recommends. Backend policy decides."**

RazorRecover is a safety-first, AI-assisted revenue recovery platform for merchants. It detects failed or at-risk Razorpay payments, estimates revenue at risk, builds customer context, consults a hybrid intelligence layer (Logistic Regression for probability + Google Gemini LLM for strategy recommendations), validates output with Zod, applies a 15-rule deterministic policy engine, requires human approval for restricted cases, schedules approved actions asynchronously via BullMQ + Redis, and measures recovered revenue transparently.

---

## 🛡️ Core Fintech Principles

1. **AI is strictly advisory**: The LLM never directly executes payments, retries, or customer messages.
2. **Deterministic Policy Boundary**: The backend policy engine is the sole authority for action approval.
3. **Execution Mode Integrity**: Every metric is strictly stamped with `RAZORPAY_TEST`, `MOCK_DEMO`, or `SIMULATION`. Mock data is never presented as real merchant recovery.
4. **Internal Money Precision**: All currency amounts are stored and calculated in smallest integer units (**paise**).

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router, Lucide Icons, Recharts, Axios |
| **Backend** | Node.js (ESM), Express.js, Mongoose, IORedis, Zod, Helmet, Winston |
| **Database** | MongoDB Atlas / Local MongoDB |
| **Queue** | BullMQ + Redis / Upstash Redis |
| **AI / ML** | Google Gemini API + Logistic Regression for recovery probability |
| **Payments** | Razorpay Test Mode + Webhooks (HMAC-SHA256) |

---

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js `v20+` or `v22+`
- Docker & Docker Compose (or local MongoDB + Redis)

### 2. Local Infrastructure (Mongo & Redis)
```bash
docker compose up -d
```

### 3. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Backend runs on **http://localhost:5000**
- Health Probe: `http://localhost:5000/api/health`
- Readiness Probe: `http://localhost:5000/api/ready`

### 4. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend runs on **http://localhost:5173**

---

## 📂 Project Structure
```text
razorrecover/
├── backend/            # Express ESM API + BullMQ Queues + Policies
├── frontend/           # React + Vite + Tailwind Merchant Dashboard
├── simulator/          # 10,000-row Synthetic Data Generator & Benchmark
├── docs/               # Architecture, Security & API Documentation
├── tests/              # Jest + Supertest test suite
├── .github/workflows/  # CI/CD Automated Workflow
└── docker-compose.yml  # Local MongoDB + Redis services
```
