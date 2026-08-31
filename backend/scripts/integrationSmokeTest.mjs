/**
 * backend/scripts/integrationSmokeTest.mjs
 * Comprehensive live integration verification script for Step 2.
 */

const BASE_URL = 'http://localhost:5000';

async function req(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('================================================================');
  console.log('🔍 RAZORRECOVER LIVE END-TO-END INTEGRATION AUDIT');
  console.log('================================================================\n');

  // Step 2.2: Health & Ready Probes
  console.log('--- STEP 2.2: HEALTH & READY PROBES ---');
  const health = await req('/api/health');
  console.log('GET /api/health -> HTTP', health.status);
  console.log(JSON.stringify(health.data, null, 2));

  const ready = await req('/api/ready');
  console.log('\nGET /api/ready -> HTTP', ready.status);
  console.log(JSON.stringify(ready.data, null, 2));

  // Step 2.5a: Register & Login
  console.log('\n--- STEP 2.5a: REGISTER & LOGIN ---');
  const merchantId = `merch_audit_${Date.now()}`;
  const email = `audit_${Date.now()}@fintech.test`;
  const password = 'Password12345!';

  const regRes = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'QA Audit Admin',
      email,
      password,
      role: 'merchant_admin',
      merchantId
    })
  });
  console.log('POST /api/auth/register -> HTTP', regRes.status);
  console.log(JSON.stringify(regRes.data, null, 2));

  const token = regRes.data?.data?.token;
  const authHeader = { Authorization: `Bearer ${token}` };

  // Step 2.5b: POST dev-fixture failed payment webhook
  console.log('\n--- STEP 2.5b: INGEST FAILED PAYMENT WEBHOOK ---');
  const paymentId = `pay_qa_${Date.now().toString().slice(-6)}`;
  const eventId = `evt_qa_${Date.now().toString().slice(-6)}`;

  const webhookPayload = {
    merchantId,
    event_id: eventId,
    payment_id: paymentId,
    amount: 499900, // ₹4,999.00
    currency: 'INR',
    status: 'failed',
    failure_reason: 'insufficient_funds',
    payment_method: 'card',
    execution_mode: 'MOCK_DEMO',
    customer_name: 'Rahul Sharma',
    customer_email: 'rahul.sharma@example.com',
    customer_phone: '+919876543210'
  };

  const hookRes = await req('/api/webhooks/dev-fixture', {
    method: 'POST',
    body: JSON.stringify(webhookPayload)
  });
  console.log('POST /api/webhooks/dev-fixture -> HTTP', hookRes.status);
  console.log(JSON.stringify(hookRes.data, null, 2));

  // Step 2.5c: GET /api/payments and /api/recovery/cases
  console.log('\n--- STEP 2.5c: QUERY PAYMENTS AND RECOVERY CASES ---');
  const paymentsRes = await req('/api/payments', { headers: authHeader });
  console.log('GET /api/payments -> HTTP', paymentsRes.status);
  console.log(JSON.stringify(paymentsRes.data, null, 2));

  const casesRes = await req('/api/recovery/cases', { headers: authHeader });
  console.log('\nGET /api/recovery/cases -> HTTP', casesRes.status);
  console.log(JSON.stringify(casesRes.data, null, 2));

  const caseId = casesRes.data?.data?.cases?.[0]?._id;
  console.log(`\nSelected Case ID for Lifecycle: ${caseId}`);

  // Step 2.5d: POST /api/recovery/:id/analyze
  console.log('\n--- STEP 2.5d: HYBRID AI ANALYSIS ---');
  const analyzeRes = await req(`/api/recovery/${caseId}/analyze`, {
    method: 'POST',
    headers: authHeader
  });
  console.log(`POST /api/recovery/${caseId}/analyze -> HTTP`, analyzeRes.status);
  console.log(JSON.stringify(analyzeRes.data, null, 2));

  // Step 2.5e: POST /api/recovery/:id/evaluate-policy
  console.log('\n--- STEP 2.5e: EVALUATE DETERMINISTIC POLICY ---');
  const policyRes = await req(`/api/recovery/${caseId}/evaluate-policy`, {
    method: 'POST',
    headers: authHeader
  });
  console.log(`POST /api/recovery/${caseId}/evaluate-policy -> HTTP`, policyRes.status);
  console.log(JSON.stringify(policyRes.data, null, 2));

  // Step 2.5f: Human Approval if PENDING_APPROVAL
  if (policyRes.data?.data?.policyResult?.decision === 'PENDING_APPROVAL') {
    console.log('\n--- STEP 2.5f: OPERATOR HUMAN APPROVAL ---');
    const approveRes = await req(`/api/recovery/${caseId}/approve`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ reason: 'Operator verified VIP customer status' })
    });
    console.log(`POST /api/recovery/${caseId}/approve -> HTTP`, approveRes.status);
    console.log(JSON.stringify(approveRes.data, null, 2));
  }

  // Step 2.5g: Schedule Action
  console.log('\n--- STEP 2.5g: SCHEDULE RECOVERY ACTION ---');
  const scheduleRes = await req(`/api/recovery/${caseId}/schedule`, {
    method: 'POST',
    headers: authHeader
  });
  console.log(`POST /api/recovery/${caseId}/schedule -> HTTP`, scheduleRes.status);
  console.log(JSON.stringify(scheduleRes.data, null, 2));

  // Step 2.5h: Execute Action
  console.log('\n--- STEP 2.5h: EXECUTE RECOVERY ACTION ---');
  const execRes = await req(`/api/recovery/${caseId}/execute`, {
    method: 'POST',
    headers: authHeader
  });
  console.log(`POST /api/recovery/${caseId}/execute -> HTTP`, execRes.status);
  console.log(JSON.stringify(execRes.data, null, 2));

  // Step 2.5i: GET /api/recovery/:id (Full Audit Timeline)
  console.log('\n--- STEP 2.5i: FULL CASE AUDIT TIMELINE ---');
  const detailRes = await req(`/api/recovery/${caseId}`, { headers: authHeader });
  console.log(`GET /api/recovery/${caseId} -> HTTP`, detailRes.status);
  console.log(JSON.stringify(detailRes.data?.data?.recoveryCase?.auditTimeline, null, 2));

  // Step 2.6: Duplicate Webhook Replay
  console.log('\n--- STEP 2.6: DUPLICATE WEBHOOK IDEMPOTENCY REPLAY ---');
  const replayRes = await req('/api/webhooks/dev-fixture', {
    method: 'POST',
    body: JSON.stringify(webhookPayload)
  });
  console.log('POST /api/webhooks/dev-fixture (REPLAY) -> HTTP', replayRes.status);
  console.log(JSON.stringify(replayRes.data, null, 2));

  // Step 2.7: Analytics Overview
  console.log('\n--- STEP 2.7: GET /api/analytics/overview ---');
  const analyticsRes = await req('/api/analytics/overview', { headers: authHeader });
  console.log('GET /api/analytics/overview -> HTTP', analyticsRes.status);
  console.log(JSON.stringify(analyticsRes.data, null, 2));

  console.log('\n================================================================');
  console.log('✅ LIVE END-TO-END AUDIT SCRIPT COMPLETED');
  console.log('================================================================');
}

run().catch(console.error);
