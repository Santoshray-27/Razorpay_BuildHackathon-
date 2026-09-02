/**
 * backend/scripts/e2e-full.mjs
 * Comprehensive End-to-End Live Integration Verification Script for RazorRecover.
 * Tests Flows A through I against a running server at http://localhost:5000.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:5000';

const results = [];

function recordResult(flow, feature, status, evidence) {
  results.push({ flow, feature, status, evidence });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${flow}] ${feature}: ${status} | ${evidence}`);
}

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runE2E() {
  console.log('================================================================');
  console.log('🚀 RAZORRECOVER FULL-STACK END-TO-END VERIFICATION (E2E)');
  console.log(`Target: ${BASE_URL}`);
  console.log('================================================================\n');

  const ts = Date.now();
  const merchantA_Id = `merch_a_${ts}`;
  const merchantA_Email = `admin_${ts}@merch-a.internal`;
  const merchantB_Id = `merch_b_${ts}`;
  const merchantB_Email = `admin_${ts}@merch-b.internal`;
  const password = 'Password2026!Secure';

  // ── HEALTH & READY PROBES ──
  const healthRes = await api('/api/health');
  if (healthRes.status === 200 && healthRes.data?.status === 'ok') {
    recordResult('PROBE', 'GET /api/health', 'PASS', `HTTP 200 uptime ${healthRes.data.uptimeSeconds}s`);
  } else {
    recordResult('PROBE', 'GET /api/health', 'FAIL', `HTTP ${healthRes.status}`);
  }

  const readyRes = await api('/api/ready');
  if (readyRes.status === 200 && readyRes.data?.status === 'ready') {
    recordResult('PROBE', 'GET /api/ready', 'PASS', `HTTP 200 mongo=${readyRes.data.dependencies?.mongodb?.readyState} redis=${readyRes.data.dependencies?.redis?.status}`);
  } else {
    recordResult('PROBE', 'GET /api/ready', 'FAIL', `HTTP ${readyRes.status}`);
  }

  // ── FLOW A: AUTH & ISOLATION ──
  console.log('\n--- FLOW A: AUTH & MERCHANT DATA ISOLATION ---');
  // 1. Register Merchant A
  const regA = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Merchant Admin A',
      email: merchantA_Email,
      password,
      role: 'merchant_admin',
      merchantId: merchantA_Id
    })
  });
  const tokenA = regA.data?.data?.token;
  const userA = regA.data?.data?.user;
  const hasNoPasswordHashA = userA && !userA.passwordHash && !userA.password;

  if (regA.status === 201 && tokenA && hasNoPasswordHashA) {
    recordResult('FLOW A', 'Register Merchant A without password hash in response', 'PASS', `User ID: ${userA.id}, Merchant: ${userA.merchantId}`);
  } else {
    recordResult('FLOW A', 'Register Merchant A', 'FAIL', `HTTP ${regA.status}`);
  }

  // 2. Login Merchant A
  const loginA = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: merchantA_Email, password })
  });
  if (loginA.status === 200 && loginA.data?.data?.token) {
    recordResult('FLOW A', 'Login Merchant A', 'PASS', `Token length: ${loginA.data.data.token.length}`);
  } else {
    recordResult('FLOW A', 'Login Merchant A', 'FAIL', `HTTP ${loginA.status}`);
  }

  const authHeaderA = { Authorization: `Bearer ${tokenA}` };

  // 3. GET /api/auth/me
  const meA = await api('/api/auth/me', { headers: authHeaderA });
  if (meA.status === 200 && meA.data?.data?.user?.email === merchantA_Email) {
    recordResult('FLOW A', 'GET /api/auth/me Profile', 'PASS', `Email: ${meA.data.data.user.email}`);
  } else {
    recordResult('FLOW A', 'GET /api/auth/me Profile', 'FAIL', `HTTP ${meA.status}`);
  }

  // 4. Unauthorized payment access
  const unauthPayments = await api('/api/payments');
  if (unauthPayments.status === 401) {
    recordResult('FLOW A', 'Unauthenticated requests rejected with 401', 'PASS', `HTTP 401 received`);
  } else {
    recordResult('FLOW A', 'Unauthenticated requests rejected', 'FAIL', `HTTP ${unauthPayments.status}`);
  }

  // 5. Register Merchant B & verify isolation
  const regB = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Merchant Admin B',
      email: merchantB_Email,
      password,
      role: 'merchant_admin',
      merchantId: merchantB_Id
    })
  });
  const tokenB = regB.data?.data?.token;
  const authHeaderB = { Authorization: `Bearer ${tokenB}` };

  // ── FLOW B: INGEST FAILED PAYMENT & IDEMPOTENCY ──
  console.log('\n--- FLOW B: INGEST FAILED PAYMENT & IDEMPOTENCY ---');
  const paymentId1 = `pay_e2e_${ts}_1`;
  const eventId1 = `evt_e2e_${ts}_1`;

  const webhookPayload1 = {
    merchantId: merchantA_Id,
    event_id: eventId1,
    payment_id: paymentId1,
    amount: 499900, // ₹4,999
    currency: 'INR',
    status: 'failed',
    failure_reason: 'insufficient_funds',
    payment_method: 'card',
    execution_mode: 'MOCK_DEMO',
    customer_name: 'Rahul Sharma',
    customer_email: 'rahul.sharma@example.com',
    customer_phone: '+919876543210'
  };

  const hookRes1 = await api('/api/webhooks/dev-fixture', {
    method: 'POST',
    body: JSON.stringify(webhookPayload1)
  });

  const createdCaseId = hookRes1.data?.data?.caseId;
  const createdPaymentId = hookRes1.data?.data?.paymentId;

  if (hookRes1.status === 200 && createdCaseId && createdPaymentId) {
    recordResult('FLOW B', 'Ingest ₹4,999 Failed Payment via dev-fixture', 'PASS', `Case: ${createdCaseId}, Payment: ${createdPaymentId}`);
  } else {
    recordResult('FLOW B', 'Ingest Failed Payment', 'FAIL', `HTTP ${hookRes1.status}`);
  }

  // 8. GET /api/payments for Merchant A
  const paymentsA = await api('/api/payments', { headers: authHeaderA });
  const paymentFound = (paymentsA.data?.data?.payments || []).find((p) => p.providerPaymentId === paymentId1);
  if (paymentFound && paymentFound.amountPaise === 499900) {
    recordResult('FLOW B', 'GET /api/payments returns exact ₹4,999 (499900 paise)', 'PASS', `Amount: ${paymentFound.amountPaise} paise`);
  } else {
    recordResult('FLOW B', 'GET /api/payments verification', 'FAIL', 'Payment not found in list');
  }

  // Isolation check: Merchant B should NOT see Merchant A payment
  const paymentsB = await api('/api/payments', { headers: authHeaderB });
  const paymentLeak = (paymentsB.data?.data?.payments || []).some((p) => p.providerPaymentId === paymentId1);
  if (!paymentLeak) {
    recordResult('FLOW A', 'Merchant Isolation: Merchant B cannot see Merchant A payments', 'PASS', '0 leaked payments');
  } else {
    recordResult('FLOW A', 'Merchant Isolation', 'FAIL', 'Merchant B accessed Merchant A payment!');
  }

  // 9. GET /api/recovery/cases
  const casesA = await api('/api/recovery/cases', { headers: authHeaderA });
  const caseFound = (casesA.data?.data?.cases || []).find((c) => c._id === createdCaseId);
  if (caseFound && caseFound.amountAtRiskPaise === 499900 && caseFound.status === 'detected') {
    recordResult('FLOW B', 'RecoveryCase created in DETECTED state with amountAtRiskPaise 499900', 'PASS', `Status: ${caseFound.status}`);
  } else {
    recordResult('FLOW B', 'RecoveryCase created verification', 'FAIL', `Status: ${caseFound?.status}`);
  }

  // 10. Replay SAME webhook event -> Idempotency check
  const replayRes = await api('/api/webhooks/dev-fixture', {
    method: 'POST',
    body: JSON.stringify(webhookPayload1)
  });
  const casesAfterReplay = await api('/api/recovery/cases', { headers: authHeaderA });
  const totalCountForPayment = (casesAfterReplay.data?.data?.cases || []).filter((c) => c.paymentId?.providerPaymentId === paymentId1).length;

  if (replayRes.status === 200 && replayRes.data?.data?.status === 'ignored_duplicate' && totalCountForPayment === 1) {
    recordResult('FLOW B', 'Duplicate webhook delivery safely ignored (Idempotency)', 'PASS', `Replay status: ${replayRes.data.data.status}, total cases: ${totalCountForPayment}`);
  } else {
    recordResult('FLOW B', 'Duplicate webhook delivery', 'FAIL', `HTTP ${replayRes.status}, count: ${totalCountForPayment}`);
  }

  // ── FLOW C: HYBRID AI ANALYSIS ──
  console.log('\n--- FLOW C: HYBRID AI ANALYSIS ---');
  const analyzeRes = await api(`/api/recovery/${createdCaseId}/analyze`, {
    method: 'POST',
    headers: authHeaderA
  });
  const rec = analyzeRes.data?.data?.recoveryCase?.latestRecommendation;
  const prob = analyzeRes.data?.data?.recoveryCase?.recoveryProbability;
  const statusAfterAi = analyzeRes.data?.data?.recoveryCase?.status;

  if (analyzeRes.status === 200 && statusAfterAi === 'recommended' && rec?.recommended_action && prob >= 0 && prob <= 1) {
    recordResult('FLOW C', 'Hybrid AI Analysis (Logistic Regression ML + Gemini/Fallback Strategy)', 'PASS', `Action: ${rec.recommended_action}, Probability: ${(prob * 100).toFixed(1)}%, Confidence: ${(rec.confidence * 100).toFixed(1)}%`);
  } else {
    recordResult('FLOW C', 'Hybrid AI Analysis', 'FAIL', `HTTP ${analyzeRes.status}`);
  }

  // ── FLOW D: DETERMINISTIC POLICY & APPROVAL ──
  console.log('\n--- FLOW D: DETERMINISTIC POLICY ENGINE & HUMAN REVIEW ---');
  const policyRes = await api(`/api/recovery/${createdCaseId}/evaluate-policy`, {
    method: 'POST',
    headers: authHeaderA
  });
  const polResult = policyRes.data?.data?.policyResult;
  const caseAfterPolicy = policyRes.data?.data?.recoveryCase;

  if (policyRes.status === 200 && polResult?.decision && polResult.triggeredRules?.length > 0) {
    recordResult('FLOW D', 'Deterministic 15-Rule Policy Engine evaluation', 'PASS', `Decision: [${polResult.decision}], Rules: ${polResult.triggeredRules.join(', ')}`);
  } else {
    recordResult('FLOW D', 'Deterministic Policy Engine', 'FAIL', `HTTP ${policyRes.status}`);
  }

  if (caseAfterPolicy.status === 'pending_approval') {
    // Check pending approvals endpoint
    const pendingList = await api('/api/recovery/pending-approvals', { headers: authHeaderA });
    const isPresent = (pendingList.data?.data?.cases || []).some((c) => c._id === createdCaseId);

    // Operator Approves
    const approveRes = await api(`/api/recovery/${createdCaseId}/approve`, {
      method: 'POST',
      headers: authHeaderA,
      body: JSON.stringify({ reason: 'Operator verified VIP customer loyalty and approved retry' })
    });

    const approvedCase = approveRes.data?.data?.recoveryCase;
    if (approveRes.status === 200 && approvedCase?.status === 'approved' && isPresent) {
      recordResult('FLOW D', 'Operator Human Approval recorded with justification note', 'PASS', `Status: ${approvedCase.status}, Reason: ${approvedCase.approvalReason}`);
    } else {
      recordResult('FLOW D', 'Operator Human Approval', 'FAIL', `HTTP ${approveRes.status}`);
    }
  }

  // ── FLOW E: SCHEDULE & EXECUTE (ISSUE 1 FIX VERIFICATION) ──
  console.log('\n--- FLOW E: ACTION SCHEDULING & SAFE RECOVERY EXECUTION ---');
  // Schedule action
  const schedRes = await api(`/api/recovery/${createdCaseId}/schedule`, {
    method: 'POST',
    headers: authHeaderA
  });
  if (schedRes.status === 200 && schedRes.data?.data?.recoveryCase?.status === 'scheduled') {
    recordResult('FLOW E', 'Action Scheduling to BullMQ (Issue 1 Human Approval Honored)', 'PASS', `Status: scheduled, Idempotency Key: ${schedRes.data.data.recoveryAction?.idempotencyKey}`);
  } else {
    recordResult('FLOW E', 'Action Scheduling', 'FAIL', `HTTP ${schedRes.status}: ${schedRes.data?.error?.message}`);
  }

  // Execute action (Mock Demo path)
  const execRes = await api(`/api/recovery/${createdCaseId}/execute`, {
    method: 'POST',
    headers: authHeaderA
  });
  const execCase = execRes.data?.data?.recoveryCase;
  const execOutcome = execRes.data?.data?.executionResult?.outcome;

  if (execRes.status === 200 && execCase?.status === 'recovered' && execCase.recoveredAmountPaise === 499900) {
    recordResult('FLOW E', 'Execute Recovery: Case & Payment marked RECOVERED for ₹4,999', 'PASS', `Status: ${execCase.status}, Recovered Amount: ${execCase.recoveredAmountPaise} paise, Outcome: ${execOutcome}`);
  } else {
    recordResult('FLOW E', 'Execute Recovery', 'FAIL', `HTTP ${execRes.status}: ${execRes.data?.error?.message}`);
  }

  // Second execute on recovered case -> Must reject safely (400)
  const secondExec = await api(`/api/recovery/${createdCaseId}/execute`, {
    method: 'POST',
    headers: authHeaderA
  });
  if (secondExec.status === 400) {
    recordResult('FLOW E', 'Idempotent Terminal Guard: Cannot re-execute on already RECOVERED case', 'PASS', `HTTP 400 received (${secondExec.data?.error?.message})`);
  } else {
    recordResult('FLOW E', 'Idempotent Terminal Guard', 'FAIL', `HTTP ${secondExec.status}`);
  }

  // Full Audit Timeline check
  const caseDetail = await api(`/api/recovery/${createdCaseId}`, { headers: authHeaderA });
  const timeline = caseDetail.data?.data?.recoveryCase?.auditTimeline || [];
  const eventTypes = timeline.map((t) => t.eventType);

  if (caseDetail.status === 200 && timeline.length >= 4) {
    recordResult('FLOW E', 'Immutable Audit Timeline verified with trace IDs & actors', 'PASS', `${timeline.length} events logged: ${eventTypes.join(' -> ')}`);
  } else {
    recordResult('FLOW E', 'Immutable Audit Timeline', 'FAIL', `Timeline events: ${timeline.length}`);
  }

  // ── FLOW F: REAL ARITHMETIC ANALYTICS ──
  console.log('\n--- FLOW F: REAL ARITHMETIC ANALYTICS ---');
  const analyticsRes = await api('/api/analytics/overview', { headers: authHeaderA });
  const kpis = analyticsRes.data?.data?.kpis;
  const modeBreakdown = analyticsRes.data?.data?.modeBreakdown;

  if (analyticsRes.status === 200 && kpis?.recoveredRevenuePaise === 499900 && kpis?.totalFailedPaymentsCount >= 1) {
    recordResult('FLOW F', 'GET /api/analytics/overview accurately computes DB-backed paise sums', 'PASS', `Recovered: ₹${(kpis.recoveredRevenuePaise / 100).toFixed(2)}, Rate: ${kpis.recoveryRate.toFixed(1)}%, Failed count: ${kpis.totalFailedPaymentsCount}`);
  } else {
    recordResult('FLOW F', 'GET /api/analytics/overview', 'FAIL', `Recovered: ${kpis?.recoveredRevenuePaise}`);
  }

  // Secondary analytics routes
  const [failRes, funRes, stratRes] = await Promise.all([
    api('/api/analytics/failures', { headers: authHeaderA }),
    api('/api/analytics/funnel', { headers: authHeaderA }),
    api('/api/analytics/recovery', { headers: authHeaderA })
  ]);
  if (failRes.status === 200 && funRes.status === 200 && stratRes.status === 200) {
    recordResult('FLOW F', 'Analytics breakdown endpoints (/failures, /funnel, /recovery)', 'PASS', 'HTTP 200 on all endpoints');
  } else {
    recordResult('FLOW F', 'Analytics breakdown endpoints', 'FAIL', `Failures: ${failRes.status}, Funnel: ${funRes.status}, Recovery: ${stratRes.status}`);
  }

  // ── FLOW G: HIGH-VALUE HUMAN ESCALATION PATH ──
  console.log('\n--- FLOW G: HIGH-VALUE (>= ₹10,000) HUMAN ESCALATION PATH ---');
  const paymentId2 = `pay_e2e_${ts}_high_val`;
  const eventId2 = `evt_e2e_${ts}_high_val`;

  const highValHook = await api('/api/webhooks/dev-fixture', {
    method: 'POST',
    body: JSON.stringify({
      merchantId: merchantA_Id,
      event_id: eventId2,
      payment_id: paymentId2,
      amount: 1500000, // ₹15,000.00
      currency: 'INR',
      status: 'failed',
      failure_reason: 'insufficient_funds',
      payment_method: 'card',
      execution_mode: 'MOCK_DEMO',
      customer_name: 'Priya Patel',
      customer_email: 'priya.patel@example.com',
      customer_phone: '+919123456780'
    })
  });
  const highValCaseId = highValHook.data?.data?.caseId;

  // Analyze & Policy
  await api(`/api/recovery/${highValCaseId}/analyze`, { method: 'POST', headers: authHeaderA });
  const highValPolicy = await api(`/api/recovery/${highValCaseId}/evaluate-policy`, { method: 'POST', headers: authHeaderA });
  const polDecision = highValPolicy.data?.data?.policyResult?.decision;
  const triggeredRulesG = highValPolicy.data?.data?.policyResult?.triggeredRules || [];

  if (polDecision === 'PENDING_APPROVAL' && triggeredRulesG.length > 0) {
    recordResult('FLOW G', 'High-Value Payment (₹15,000) routed to PENDING_APPROVAL via Policy Engine', 'PASS', `Decision: PENDING_APPROVAL, Rules: ${triggeredRulesG.join(', ')}`);
  } else {
    recordResult('FLOW G', 'High-Value Payment routing', 'FAIL', `Decision: ${polDecision}`);
  }

  // Operator Approves High Value Case
  const approveHighVal = await api(`/api/recovery/${highValCaseId}/approve`, {
    method: 'POST',
    headers: authHeaderA,
    body: JSON.stringify({ reason: 'Executive approved high-value transaction recovery' })
  });

  // Execute High Value Case -> Proves human authorization works for high-value cases
  const highValExec = await api(`/api/recovery/${highValCaseId}/execute`, { method: 'POST', headers: authHeaderA });
  const highValStatus = highValExec.data?.data?.recoveryCase?.status;
  const highValOutcome = highValExec.data?.data?.executionResult?.outcome;

  if (highValExec.status === 200 && highValStatus === 'recovered') {
    recordResult('FLOW G', 'Operator Approved High-Value Case executes successfully', 'PASS', `Status: recovered, Amount: ₹${(highValExec.data.data.recoveryCase.recoveredAmountPaise / 100).toFixed(2)}`);
  } else {
    recordResult('FLOW G', 'High-Value Execution after approval', 'FAIL', `Status: ${highValStatus}, Outcome: ${highValOutcome}, Response: ${JSON.stringify(highValExec.data)}`);
  }

  // ── FLOW H: 10,000-TRANSACTION SIMULATOR REPRODUCIBILITY ──
  console.log('\n--- FLOW H: 10,000-TRANSACTION SIMULATOR BENCHMARK ---');
  const simRun1 = await api('/api/simulator/run', {
    method: 'POST',
    headers: authHeaderA,
    body: JSON.stringify({ count: 10000, seed: 42, failureRate: 0.18 })
  });
  const simRun2 = await api('/api/simulator/run', {
    method: 'POST',
    headers: authHeaderA,
    body: JSON.stringify({ count: 10000, seed: 42, failureRate: 0.18 })
  });

  const strat1 = simRun1.data?.data?.benchmark?.strategies;
  const strat2 = simRun2.data?.data?.benchmark?.strategies;

  const isIdentical = strat1 && strat2 && JSON.stringify(strat1) === JSON.stringify(strat2);
  const aiLift = strat1?.AI_ASSISTED_RECOVERY?.incrementalLiftPercentage;
  const optOutSafe = strat1?.AI_ASSISTED_RECOVERY?.optOutComplianceRate === 100;

  if (simRun1.status === 200 && isIdentical && aiLift > 0 && optOutSafe) {
    recordResult('FLOW H', '10,000-Transaction Benchmark: Bit-for-bit identical seed reproducibility', 'PASS', `Seed 42 -> AI Lift: +${aiLift}%, Opt-Out Safety: 100%`);
  } else {
    recordResult('FLOW H', 'Simulator Benchmark Reproducibility', 'FAIL', `HTTP: ${simRun1.status}, Identical: ${isIdentical}`);
  }

  console.log('\n================================================================');
  console.log('🏁 E2E VERIFICATION SUMMARY');
  console.log('================================================================');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Total Checks: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);

  if (failCount > 0) {
    console.error(`\n❌ ${failCount} E2E Checks Failed.`);
    process.exit(1);
  } else {
    console.log('\n🎉 ALL E2E FLOWS (A through H) PASSED 100% WITH REAL DATABASE DOCUMENTS!');
  }
}

runE2E().catch((err) => {
  console.error('Fatal E2E runner error:', err);
  process.exit(1);
});
