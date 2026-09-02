/**
 * frontend/src/pages/CaseDetailPage.jsx
 * Case Inspector & Interactive Recovery Workbench with Light-First design tokens,
 * Hybrid Explainability Panel, and Chronological Audit Timeline.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  ArrowLeft,
  ShieldCheck,
  BrainCircuit,
  Cpu,
  User,
  CreditCard,
  History,
  Play,
  UserCheck,
  XCircle,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { StatusBadge, RiskBadge, Badge, ExecutionModeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function CaseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchCaseDetails = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/recovery/${id}`);
      setCaseData(res.data.data.recoveryCase);
    } catch (err) {
      console.error('Failed to load case details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [id]);

  // Workflow Actions
  const runAiAnalysis = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/recovery/${id}/analyze`);
      setCaseData(res.data.data.recoveryCase);
      setActionFeedback('✨ AI Recommendation generated and validated by Zod schema!');
      await fetchCaseDetails();
    } catch (err) {
      alert(`AI Analysis failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const evaluatePolicy = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/recovery/${id}/evaluate-policy`);
      setActionFeedback(`🛡️ Policy Engine evaluated: [${res.data.data.policyResult.decision}]`);
      await fetchCaseDetails();
    } catch (err) {
      alert(`Policy evaluation failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const executeAction = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/recovery/${id}/execute`);
      setActionFeedback(`🎉 Recovery action executed! Outcome: ${res.data.data.executionResult.outcome}`);
      await fetchCaseDetails();
    } catch (err) {
      alert(`Execution failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const approveCase = async () => {
    const reason = prompt('Enter approval justification for audit log:', 'Operator verified customer VIP status and approved retry');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/recovery/${id}/approve`, { reason });
      setActionFeedback('👤 Case approved by operator. Eligible for scheduling.');
      await fetchCaseDetails();
    } catch (err) {
      alert(`Approval failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const rejectCase = async () => {
    const reason = prompt('Enter rejection reason for audit log:', 'Rejected by merchant operator');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/recovery/${id}/reject`, { reason });
      setActionFeedback('🛑 Case stopped by operator.');
      await fetchCaseDetails();
    } catch (err) {
      alert(`Rejection failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !caseData) {
    return (
      <div className="space-y-space-6 animate-pulse">
        <div className="h-12 bg-theme-surface rounded-radius-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6">
          <div className="h-48 bg-theme-surface rounded-radius-md" />
          <div className="h-48 bg-theme-surface rounded-radius-md" />
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="py-space-12 text-center text-semantic-danger text-body">
        Recovery case not found.
      </div>
    );
  }

  const payment = caseData.paymentId || {};
  const customer = caseData.customerContext || {};
  const recommendation = caseData.latestRecommendation;
  const policy = caseData.latestPolicyDecision;
  const auditTimeline = caseData.auditTimeline || [];

  return (
    <div className="space-y-space-6 animate-fade-in">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4">
        <div className="flex items-center space-x-space-3">
          <Link to="/cases">
            <Button size="sm" variant="outline" icon={ArrowLeft} />
          </Link>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-h1 text-theme-primary font-mono tracking-tight">
                Case #{payment.providerPaymentId || caseData._id.slice(-8)}
              </h2>
              <StatusBadge status={caseData.status} />
              <RiskBadge riskLevel={caseData.riskLevel} />
            </div>
            <p className="text-caption text-theme-muted mt-0.5">
              Occurred {formatDate(payment.occurredAt || caseData.createdAt)} &bull; Mode: <ExecutionModeBadge mode={caseData.executionMode} />
            </p>
          </div>
        </div>

        {actionFeedback && (
          <div className="bg-semantic-success-bg border border-semantic-success/40 text-semantic-success text-body-sm px-space-4 py-space-2 rounded-radius-sm flex items-center space-x-2 animate-fade-in shadow-theme-sm font-semibold">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}
      </div>

      {/* Interactive Workflow Controls Card */}
      <Card className="p-space-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-caption font-bold text-ink">
              <Sparkles className="w-4 h-4 text-ink" />
              <span>Interactive FinTech Pipeline Controls</span>
            </div>
            <p className="text-body-sm text-theme-muted leading-relaxed">
              Step through each recovery stage interactively: AI Recommendation &rarr; Deterministic Policy &rarr; Execution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-3">
            {/* Step 1: AI Analysis */}
            <Button
              variant="secondary"
              size="sm"
              icon={BrainCircuit}
              loading={actionLoading}
              disabled={caseData.status === 'recovered'}
              onClick={runAiAnalysis}
            >
              1. Run AI Analysis
            </Button>

            {/* Step 2: Policy Engine */}
            <Button
              variant="secondary"
              size="sm"
              icon={ShieldCheck}
              loading={actionLoading}
              disabled={!recommendation || caseData.status === 'recovered'}
              onClick={evaluatePolicy}
            >
              2. Evaluate Policy
            </Button>

            {/* Step 3: Execute Action */}
            <Button
              variant="success"
              size="sm"
              icon={Play}
              loading={actionLoading}
              disabled={caseData.status === 'recovered' || caseData.status === 'pending_approval'}
              onClick={executeAction}
            >
              3. Execute Recovery (Demo)
            </Button>

            {/* Human Review Actions */}
            {caseData.status === 'pending_approval' && (
              <>
                <Button
                  variant="accent"
                  size="sm"
                  icon={UserCheck}
                  loading={actionLoading}
                  onClick={approveCase}
                >
                  Approve Action
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={XCircle}
                  loading={actionLoading}
                  onClick={rejectCase}
                >
                  Reject / Stop
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Grid: Payment Summary & Customer Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6">
        {/* Payment Summary Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-ink" />
              <CardTitle>Payment Summary</CardTitle>
            </div>
            <Badge variant="neutral">Transaction</Badge>
          </CardHeader>
          <CardContent className="space-y-space-3 text-body-sm">
            <div className="flex justify-between py-space-2 border-b border-theme-border-subtle">
              <span className="text-theme-muted">Amount at Risk:</span>
              <span className="text-ink font-bold font-mono text-body num-tabular">
                {formatCurrency(caseData.amountAtRiskPaise)}
              </span>
            </div>
            <div className="flex justify-between py-space-2 border-b border-theme-border-subtle">
              <span className="text-theme-muted">Recovered Amount:</span>
              <span className="text-ink font-bold font-mono text-body num-tabular">
                {formatCurrency(caseData.recoveredAmountPaise || 0)}
              </span>
            </div>
            <div className="flex justify-between py-space-2 border-b border-theme-border-subtle">
              <span className="text-theme-muted">Payment Status:</span>
              <span className="text-theme-primary uppercase font-mono font-semibold">{payment.status || 'failed'}</span>
            </div>
            <div className="flex justify-between py-space-2 border-b border-theme-border-subtle">
              <span className="text-theme-muted">Failure Reason:</span>
              <code className="text-semantic-danger font-mono font-semibold">{caseData.failureReason || 'insufficient_funds'}</code>
            </div>
            <div className="flex justify-between py-space-2">
              <span className="text-theme-muted">Payment Method:</span>
              <span className="text-theme-primary uppercase font-medium">{payment.paymentMethod || 'card'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Privacy-Safe Customer Context Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-ink" />
              <CardTitle>Customer Context (Privacy-Safe)</CardTitle>
            </div>
            <span className="text-caption text-theme-muted font-mono bg-theme-surface px-space-2 py-0.5 rounded-radius-sm border border-theme-border-default">
              NO CARD/CVV STORED
            </span>
          </CardHeader>
          <CardContent className="space-y-space-3 text-body-sm">
            <div className="flex justify-between py-space-2 border-b border-theme-border-subtle">
              <span className="text-theme-muted">Customer Reference:</span>
              <span className="text-theme-secondary font-mono">{customer.maskedEmail || customer.providerCustomerId || 'r***r@example.com'}</span>
            </div>
            <div className="flex justify-between py-space-2 border-b border-theme-border-subtle">
              <span className="text-theme-muted">Masked Phone:</span>
              <span className="text-theme-secondary font-mono">{customer.maskedPhone || '+91*****3210'}</span>
            </div>
            <div className="flex justify-between py-space-2 border-b border-theme-border-subtle">
              <span className="text-theme-muted">Payment History:</span>
              <span className="text-theme-primary">
                <strong className="text-ink font-mono">{customer.successfulPaymentsCount || 0}</strong> successful &bull; <strong className="text-ink font-mono">{customer.failedPaymentsCount || 0}</strong> failed
              </span>
            </div>
            <div className="flex justify-between py-space-2 border-b border-theme-border-subtle">
              <span className="text-theme-muted">Recent Success Rate:</span>
              <span className="text-ink font-bold font-mono text-body">{((customer.recentSuccessRate || 0.8) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between py-space-2">
              <span className="text-theme-muted">Opted Out of Recovery:</span>
              <span className={customer.optedOutOfRecovery ? 'text-semantic-danger font-bold' : 'text-ink font-bold'}>
                {customer.optedOutOfRecovery ? 'YES (COMMUNICATIONS BLOCKED)' : 'NO (CONSENT ACTIVE)'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HYBRID EXPLAINABILITY PANEL */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2.5">
            <BrainCircuit className="w-5 h-5 text-ink" />
            <div>
              <CardTitle>Hybrid Intelligence Explainability Panel</CardTitle>
              <CardDescription>Deterministic ML scoring side-by-side with Generative AI advisory reasoning</CardDescription>
            </div>
          </div>
          <Badge variant="info">Dual Engine</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-6">
            {/* Left: Logistic Regression Probability Model */}
            <div className="bg-theme-surface dark:bg-theme-elevated p-space-6 rounded-radius-md border border-theme-border-default space-y-space-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-body-sm font-semibold text-theme-primary">
                  <Cpu className="w-4 h-4 text-ink" />
                  <span>Deterministic Logistic Regression Score</span>
                </div>
                <Badge variant="neutral">v1.1-trained</Badge>
              </div>

              <div className="flex items-baseline space-x-space-3">
                <span className="text-display font-bold text-theme-primary font-mono tracking-tight num-tabular">
                  {caseData.recoveryProbability !== null && caseData.recoveryProbability !== undefined
                    ? `${(caseData.recoveryProbability * 100).toFixed(0)}%`
                    : 'Pending'}
                </span>
                <span className="text-body-sm text-theme-muted">Calculated Recovery Probability</span>
              </div>

              <div className="space-y-space-2 pt-space-2 border-t border-theme-border-subtle">
                <p className="text-caption font-semibold text-theme-muted uppercase tracking-wider">Key Feature Influences:</p>
                <div className="space-y-1.5 text-body-sm font-mono">
                  <div className="flex justify-between text-ink font-medium">
                    <span>+ Historical Success Ratio</span>
                    <span className="font-bold">+0.85</span>
                  </div>
                  <div className="flex justify-between text-ink font-medium">
                    <span>+ Temporary Balance Category</span>
                    <span className="font-bold">+0.75</span>
                  </div>
                  <div className="flex justify-between text-theme-muted">
                    <span>- Retry Count Decay</span>
                    <span>-0.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Google Gemini AI Advisory */}
            <div className="bg-theme-surface dark:bg-theme-elevated p-space-6 rounded-radius-md border border-theme-border-default space-y-space-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-body-sm font-semibold text-theme-primary">
                  <Sparkles className="w-4 h-4 text-ink" />
                  <span>Google Gemini Strategy Advisory</span>
                </div>
                <Badge variant="info">Advisory Only</Badge>
              </div>

              {recommendation ? (
                <div className="space-y-space-3">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-theme-muted">Recommended Action:</span>
                    <span className="text-body-sm font-bold text-ink font-mono bg-accent px-space-3 py-1 rounded-radius-sm border border-accent-hover/40">
                      {recommendation.recommended_action}
                      {recommendation.retry_after_hours ? ` (after ${recommendation.retry_after_hours}h)` : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-theme-muted">AI Confidence:</span>
                    <span className="text-body-sm font-bold text-theme-primary font-mono">
                      {((recommendation.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-caption text-theme-muted">Reasoning:</span>
                    <p className="text-body-sm text-theme-secondary mt-1 italic bg-theme-surface p-space-4 rounded-radius-md border border-theme-border-subtle leading-relaxed">
                      "{recommendation.reason}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-space-8 text-center text-theme-muted text-body-sm">
                  AI Analysis pending. Click "1. Run AI Analysis" above.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* POLICY ENGINE DECISION & RULES CARD */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-ink" />
            <div>
              <CardTitle>Deterministic Policy Engine Decision</CardTitle>
              <CardDescription>Authoritative 15-Rule financial safety and approval boundary</CardDescription>
            </div>
          </div>
          <span className="text-caption font-mono text-theme-muted">15-Rule Priority</span>
        </CardHeader>
        <CardContent>
          {policy ? (
            <div className="bg-theme-surface dark:bg-theme-elevated p-space-6 rounded-radius-md border border-theme-border-default space-y-space-3 text-body-sm">
              <div className="flex items-center justify-between">
                <span className="text-theme-muted">Policy Decision:</span>
                <span className={`px-space-3 py-1 rounded-radius-sm font-bold font-mono text-caption ${
                  policy.decision === 'APPROVED' ? 'bg-semantic-success-bg text-semantic-success border border-semantic-success/40'
                  : policy.decision === 'PENDING_APPROVAL' ? 'bg-semantic-warning-bg text-semantic-warning border border-accent/40'
                  : 'bg-semantic-danger-bg text-semantic-danger border border-semantic-danger/40'
                }`}>
                  {policy.decision}
                </span>
              </div>

              <div>
                <span className="text-theme-muted">Policy Reason:</span>
                <p className="text-theme-primary font-medium mt-0.5 leading-relaxed">{policy.reason}</p>
              </div>

              <div>
                <span className="text-theme-muted">Triggered Rules:</span>
                <div className="flex flex-wrap gap-space-2 mt-1.5">
                  {(policy.triggeredRules || []).map((rule, idx) => (
                    <span key={idx} className="px-space-3 py-1 bg-theme-surface border border-theme-border-subtle rounded-radius-sm text-caption font-mono text-theme-secondary">
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-body-sm text-theme-muted py-space-4 text-center">
              Policy evaluation pending. Click "2. Evaluate Policy" above.
            </p>
          )}
        </CardContent>
      </Card>

      {/* FULL IMMUTABLE AUDIT TIMELINE */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2.5">
            <History className="w-5 h-5 text-ink" />
            <div>
              <CardTitle>Immutable Audit Trail Timeline</CardTitle>
              <CardDescription>Write-once chronological ledger tracking every event, actor, and trace ID</CardDescription>
            </div>
          </div>
          <Badge variant="neutral">{auditTimeline.length} Events</Badge>
        </CardHeader>
        <CardContent>
          <div className="relative pl-space-6 space-y-space-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-theme-border-default">
            {auditTimeline.map((item, idx) => {
              const actorDotBg = {
                system: 'bg-theme-muted',
                ai: 'bg-ink',
                policy_engine: 'bg-accent',
                human: 'bg-mint',
                worker: 'bg-semantic-success'
              };

              return (
                <div key={item._id || idx} className="relative space-y-1.5">
                  {/* Timeline Node Dot */}
                  <div className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-radius-full ${actorDotBg[item.actor] || 'bg-theme-muted'} ring-4 ring-theme-surface`} />

                  <div className="flex items-center justify-between text-body-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-theme-primary">{item.eventType}</span>
                      <span className="text-caption px-space-2 py-0.5 rounded-radius-sm uppercase font-mono bg-theme-surface text-theme-secondary border border-theme-border-default">
                        {item.actor}
                      </span>
                    </div>
                    <span className="text-caption text-theme-muted font-mono">{formatDate(item.createdAt)}</span>
                  </div>

                  <p className="text-body-sm text-theme-secondary leading-relaxed bg-theme-surface/50 dark:bg-theme-elevated/40 p-space-3 rounded-radius-md border border-theme-border-default">
                    {item.message}
                  </p>

                  <p className="text-caption text-theme-muted font-mono">
                    Trace ID: {item.correlationId}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
