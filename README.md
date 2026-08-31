# RazorRecover — Safety-First, AI-Assisted Revenue Recovery Platform

> **"AI Recommends. Backend Policy Decides."**  
> A production-grade FinTech platform for merchants to detect failed Razorpay payments, predict recovery likelihood with explainable ML, consult Google Gemini for advisory recovery strategies, enforce strict deterministic safety policies, schedule actions asynchronously with BullMQ + Redis, and measure genuine recovered revenue.

[![RazorRecover CI](https://github.com/Santoshray-27/Razorpay_BuildHackathon-/actions/workflows/ci.yml/badge.svg)](https://github.com/Santoshray-27/Razorpay_BuildHackathon-/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

---

## 📑 Quick Navigation
* [The Problem & Our Solution](#-the-problem--our-solution)
* [Core FinTech Principles](#-core-fintech-principles)
* [System Architecture & State Machine](#-architecture--workflow)
* [Tech Stack](#-tech-stack)
* [Quick Start (Local Setup in 3 Minutes)](#-quick-start-local-setup-in-3-minutes)
* [Live Demo Walkthrough for Evaluators](#-live-demo-walkthrough-for-evaluators)
* [4-Strategy Simulation Benchmark](#-4-strategy-simulation-benchmark)
* [Environment Variables Matrix](#-environment-variables-matrix)
* [Production Deployment Guide (Render + Vercel)](#-production-deployment-guide-render--vercel)
* [Automated Test Verification](#-test-suite-verification)

---

## 💡 The Problem & Our Solution

### The Problem
* **₹ Billions in Lost Revenue:** Up to 15–20% of e-commerce transactions fail due to temporary balance constraints, bank downtime, OTP dropouts, or expired cards.
* **Naive Retries Hurt Conversion:** Rigid 24-hour retries spam customers, breach opt-out consent, incur card network penalty fees, and fail to recover genuine sales.
* **LLMs Cannot Be Trusted with Money:** Large Language Models hallucinate, fail unpredictably, and cannot be given direct execution authority over financial transactions.

### The RazorRecover Solution
* **Hybrid Intelligence:** Combines an explainable **Logistic Regression model** ($0.0 - 1.0$ probability) with **Google Gemini LLM** for advisory strategy recommendations.
* **Deterministic Policy Engine:** An authoritative **15-Rule Policy Hierarchy** with human-in-the-loop review gates for high-value transactions ($\ge ₹10,000$) or low AI confidence ($< 0.70$).
* **Reliable Async Worker:** BullMQ + Redis queue with idempotent execution keys, active action locks, and transparent execution mode tagging (`RAZORPAY_TEST`, `MOCK_DEMO`, `SIMULATION`).

---

## 🛡️ Core FinTech Principles

1. **AI is Strictly Advisory:** The LLM never initiates transactions or modifies account balances. Output is validated via Zod schemas (`RecoveryRecommendationSchema`).
2. **Deterministic Safety Boundary:** The backend policy engine is the sole authority for approvals, blocks, and scheduling.
3. **Integer Money Precision:** All monetary amounts are computed and stored in smallest currency units (**paise**). Conversions to ₹ occur only in UI presentation.
4. **Execution Mode Integrity:** Every metric is stamped with its explicit `executionMode`. Mock or simulated recoveries are never blended with real Razorpay Test transactions.
5. **Immutable Audit Trail:** Write-once audit log capturing every event with actor tags (`system`, `ai`, `policy_engine`, `human`, `worker`) and trace correlation IDs.

---

## 📐 Architecture & Workflow

```text
[ Failed Payment Webhook ] ──► [ HMAC-SHA256 Verification (Raw Body) ]
                                            │
                                            ▼
                                   [ Risk Engine ]
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
         [ Logistic Regression ML ]                       [ Google Gemini LLM ]
         Numeric Probability Score                         Strategy Recommendation
              (0.0 to 1.0)                                  (Zod Validated JSON)
                    └───────────────────────┬───────────────────────┘
                                            │
                                            ▼
                           [ Deterministic Policy Engine ]
                           (15-Rule Strict Hierarchy)
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
             [ APPROVED ]                                  [ PENDING_APPROVAL ]
                    │                                               │
                    ▼                                       (Human Reviewer)
           [ BullMQ + Redis ]                                       │
          (Delayed Action Queue)                                    ▼
                    │                                          [ APPROVED ]
                    ▼                                               │
           [ Recovery Worker ] ◄────────────────────────────────────┘
                    │
                    ▼
           [ Safe Execution ] ──► [ GENUINE REVENUE RECOVERED ]
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, React Router v7, Axios |
| **Backend API** | Node.js (ESM), Express.js, Mongoose 8, Zod, Helmet, Winston, Rate-Limit |
| **Queue & Cache** | BullMQ, Redis 7 (or Upstash Redis) |
| **Database** | MongoDB 7 (or MongoDB Atlas) |
| **AI / ML** | Google Gemini API (`gemini-flash`), Custom Trained Logistic Regression Model |
| **Payments** | Razorpay Test Mode + Webhooks (HMAC-SHA256) |

---

## 🚀 Quick Start (Local Setup in 3 Minutes)

### 1. Prerequisites
* Node.js `v20+` or `v22+`
* Docker & Docker Compose

### 2. Start Local MongoDB & Redis
```bash
docker compose up -d
```

### 3. Backend & Worker Setup
```bash
cd backend
npm install
npm run dev
```
* Backend API runs at: `http://localhost:5000`
* Health check: `http://localhost:5000/api/health`

*(Optional in separate terminal for background delayed jobs)*:
```bash
cd backend
npm run worker
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
* Dashboard runs at: `http://localhost:5173`

---

## 🕹️ Live Demo Walkthrough for Evaluators

1. Open `http://localhost:5173/login` in your browser.
2. Click **`⚡ Sign in as Demo Merchant Admin`** (instantly logs in without typing).
3. On the sidebar, click **`Simulate ₹4,999 Failure`** to inject a sample failed transaction.
4. Go to **Recovery Cases** (`/cases`) and click **Inspect Case**.
5. Test the interactive pipeline directly:
   * Click **`1. Run AI Analysis`** $\to$ Generates Gemini recommendation with Zod validation.
   * Click **`2. Evaluate Policy`** $\to$ Policy engine verifies 15 financial rules.
   * Click **`3. Execute Recovery (Demo)`** $\to$ Worker executes action, marking the payment as **`Recovered`** and recovering ₹4,999!
   * Scroll down to inspect the **Hybrid Explainability Panel** and **Immutable Audit Timeline**.
6. Visit **`/simulator`** to run a **10,000-Transaction Comparative Benchmark** across 4 strategies.

---

## 📊 4-Strategy Simulation Benchmark

Evaluated across **10,000 synthetic transactions** on the exact same population and seed:

| Strategy | Methodology | Recovery Rate | Opt-Out Safety | Human Review | Net Lift vs Baseline |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **1. NO_RECOVERY** | Zero action taken | `0.0%` | 100% | 0 | Baseline |
| **2. FIXED_RETRY** | Blind 24h retry | `~14.5%` | ⚠️ Violations | 0 | Negative Compliance |
| **3. RULE_BASED** | Static heuristics | `~28.2%` | 100% | 0 | Standard |
| **4. AI_ASSISTED** | **RazorRecover (AI + Policy)** | **`~41.8%`** | **100%** | **Role-Gated** | **`+48.2%` LIFT** |

---

## 🔑 Environment Variables Matrix

### Backend (`backend/.env`)
| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `PORT` | No | Express port | `5000` |
| `NODE_ENV` | No | Environment mode | `development` / `production` |
| `MONGODB_URI` | **Yes** | MongoDB connection string | `mongodb://localhost:27017/razorrecover` |
| `REDIS_URL` | **Yes** | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | **Yes** | 32+ char secret for JWT auth | `your_super_secret_jwt_key_here` |
| `GEMINI_API_KEY` | Optional | Google Gemini API Key | `AIzaSy...` |
| `AI_ENABLED` | No | Toggle AI layer (true/false) | `true` |
| `RAZORPAY_KEY_ID` | Optional | Razorpay Test API Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay Test Key Secret | `rvKKl...` |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Razorpay Webhook Secret | `webhook_secret_...` |
| `DEMO_COMPRESSION_ENABLED` | No | Compress 6h delay $\to$ 30s in demo | `true` |

### Frontend (`frontend/.env`)
| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | No | Backend API Base URL | `http://localhost:5000/api` |

---

## 🌐 Production Deployment Guide (Render + Vercel)

### Deploying Backend & Worker on Render
1. Create a **Web Service** on Render connected to this GitHub repository.
   * **Root Directory:** `backend`
   * **Build Command:** `npm install`
   * **Start Command:** `node src/server.js`
   * Add Environment Variables (`MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `GEMINI_API_KEY`).
2. Create a **Background Worker** on Render.
   * **Root Directory:** `backend`
   * **Build Command:** `npm install`
   * **Start Command:** `node src/worker.js`
   * Add identical Environment Variables.

### Deploying Frontend on Vercel
1. Import repository on Vercel.
   * **Root Directory:** `frontend`
   * **Framework Preset:** `Vite`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
   * Add `VITE_API_URL` pointing to your Render backend URL (e.g. `https://razorrecover-api.onrender.com/api`).

---

## 🧪 Test Suite Verification

Run the entire automated test suite (43 unit & integration tests):
```bash
cd backend
npm test -- --runInBand
```

```text
PASS tests/auth.test.js (8 tests)
PASS tests/webhook.test.js (5 tests)
PASS tests/recovery.test.js (4 tests)
PASS tests/probability.test.js (4 tests)
PASS tests/gemini.test.js (5 tests)
PASS tests/policy.test.js (7 tests)
PASS tests/execution.test.js (2 tests)
PASS tests/analytics.test.js (4 tests)
PASS tests/simulation.test.js (4 tests)

Test Suites: 9 passed, 9 total
Tests:       43 passed, 43 total
Snapshots:   0 total
Time:        4.474 s
```

---

## 👨‍💻 Author & Acknowledgements
Built with ❤️ by **Santosh Ray** for the **Razorpay Buildathon / AI Builder Internship**.
* **GitHub Repository:** [Santoshray-27/Razorpay_BuildHackathon-](https://github.com/Santoshray-27/Razorpay_BuildHackathon-)
* **Live Demo URL:** `[YOUR_DEPLOYED_FRONTEND_URL]`
* **Demo Video Link:** `[YOUR_YOUTUBE_OR_LOOM_VIDEO_LINK]`
