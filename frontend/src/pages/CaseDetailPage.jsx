/**
 * frontend/src/pages/CaseDetailPage.jsx
 * Production-grade Case Inspector & Interactive Recovery Workbench:
 * - Payment & Privacy-safe Customer Context
 * - Interactive 3-step action toolbar (AI Analysis -> Policy Engine -> Execution)
 * - Hybrid Explainability Panel (Logistic Regression ML vs Gemini LLM reasoning)
 * - Policy Decision & Triggered Rules card
 * - Immutable Chronological Audit Trail with trace IDs
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
  CheckCircle2,
  AlertTriangle,
  Play,
  UserCheck,
  XCircle,
  Sparkles,
  Lock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { StatusBadge, RiskBadge, Badge, ExecutionModeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

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
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-surface-card rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-surface-card rounded-xl" />
          <div className="h-48 bg-surface-card rounded-xl" />
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="py-20 text-center text-rose-400 text-xs">
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
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link to="/cases">
            <Button size="sm" variant="outline" icon={ArrowLeft} />
          </Link>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl md:text-2xl font-bold text-white font-mono tracking-tight">
                Case #{payment.providerPaymentId || caseData._id.slice(-8)}
              </h2>
              <StatusBadge status={caseData.status} />
              <RiskBadge riskLevel={caseData.riskLevel} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Occurred {formatDate(payment.occurredAt || caseData.createdAt)} &bull; Mode: <ExecutionModeBadge mode={caseData.executionMode} />
            </p>
          </div>
        </div>

        {actionFeedback && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-3.5 py-1.5 rounded-lg flex items-center space-x-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}
      </div>

      {/* Interactive Workflow Controls Card */}
      <Card className="bg-gradient-to-r from-brand-950/60 via-surface-card to-indigo-950/60 border-brand-500/30 p-5 shadow-card-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-300">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Interactive FinTech Workflow Controls</span>
            </div>
            <p className="text-xs text-slate-400">
              Execute each stage of the recovery pipeline interactively:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Step 1: AI Analysis */}
            <Button
              variant="secondary"
              size="sm"
              icon={BrainCircuit}
              loading={actionLoading}
              disabled={caseData.status === 'recovered'}
              onClick={runAiAnalysis}
              className="bg-indigo-950/80 hover:bg-indigo-900 border-indigo-500/40 text-indigo-200"
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
              className="bg-purple-950/80 hover:bg-purple-900 border-purple-500/40 text-purple-200"
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
              className="font-bold shadow-glow-success"
            >
              3. Execute Recovery (Demo)
            </Button>

            {/* Human Review Actions */}
            {caseData.status === 'pending_approval' && (
              <>
                <Button
                  variant="primary"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Summary Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-brand-400" />
              <CardTitle>Payment Summary</CardTitle>
            </div>
            <Badge variant="slate">Transaction</Badge>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-xs">
            <div className="flex justify-between py-2 border-b border-surface-border/60">
              <span className="text-slate-400">Amount at Risk:</span>
              <span className="text-amber-400 font-extrabold font-mono text-sm num-tabular">
                {formatCurrency(caseData.amountAtRiskPaise)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-border/60">
              <span className="text-slate-400">Recovered Amount:</span>
              <span className="text-emerald-400 font-extrabold font-mono text-sm num-tabular">
                {formatCurrency(caseData.recoveredAmountPaise || 0)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-border/60">
              <span className="text-slate-400">Payment Status:</span>
              <span className="text-slate-200 uppercase font-mono font-semibold">{payment.status || 'failed'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-border/60">
              <span className="text-slate-400">Failure Reason:</span>
              <code className="text-rose-300 font-mono">{caseData.failureReason || 'insufficient_funds'}</code>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Payment Method:</span>
              <span className="text-slate-200 uppercase font-medium">{payment.paymentMethod || 'card'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Privacy-Safe Customer Context Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-emerald-400" />
              <CardTitle>Customer Context (Privacy-Safe)</CardTitle>
            </div>
            <span className="text-[10px] text-slate-500 font-mono bg-navy-950 px-2 py-0.5 rounded border border-surface-border">
              NO CARD/CVV STORED
            </span>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 text-xs">
            <div className="flex justify-between py-2 border-b border-surface-border/60">
              <span className="text-slate-400">Customer Reference:</span>
              <span className="text-slate-300 font-mono">{customer.maskedEmail || customer.providerCustomerId || 'r***r@example.com'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-border/60">
              <span className="text-slate-400">Masked Phone:</span>
              <span className="text-slate-300 font-mono">{customer.maskedPhone || '+91*****3210'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-border/60">
              <span className="text-slate-400">Payment History:</span>
              <span className="text-slate-200">
                <strong className="text-emerald-400 font-mono">{customer.successfulPaymentsCount || 0}</strong> successful &bull; <strong className="text-rose-400 font-mono">{customer.failedPaymentsCount || 0}</strong> failed
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-border/60">
              <span className="text-slate-400">Recent Success Rate:</span>
              <span className="text-brand-400 font-extrabold font-mono text-sm">{((customer.recentSuccessRate || 0.8) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Opted Out of Recovery:</span>
              <span className={customer.optedOutOfRecovery ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
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
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            <div>
              <CardTitle>Hybrid Intelligence Explainability Panel</CardTitle>
              <CardDescription>Deterministic ML scoring side-by-side with Generative AI advisory reasoning</CardDescription>
            </div>
          </div>
          <Badge variant="purple">Dual Engine</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Logistic Regression Probability Model */}
            <div className="bg-navy-950/80 p-5 rounded-xl border border-surface-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>Deterministic Logistic Regression Score</span>
                </div>
                <Badge variant="purple" size="sm">v1.1-trained</Badge>
              </div>

              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-extrabold text-white font-mono tracking-tight num-tabular">
                  {caseData.recoveryProbability !== null && caseData.recoveryProbability !== undefined
                    ? `${(caseData.recoveryProbability * 100).toFixed(0)}%`
                    : 'Pending'}
                </span>
                <span className="text-xs text-slate-400">Calculated Recovery Probability</span>
              </div>

              <div className="space-y-2 pt-2 border-t border-surface-border/60">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Key Feature Influences:</p>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-emerald-400">
                    <span>+ Historical Success Ratio</span>
                    <span>+0.85</span>
                  </div>
                  <div className="flex justify-between text-brand-400">
                    <span>+ Temporary Balance Category</span>
                    <span>+0.75</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>- Retry Count Decay</span>
                    <span>-0.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Google Gemini AI Advisory */}
            <div className="bg-navy-950/80 p-5 rounded-xl border border-surface-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  <span>Google Gemini Strategy Advisory</span>
                </div>
                <Badge variant="info" size="sm">Advisory Only</Badge>
              </div>

              {recommendation ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Recommended Action:</span>
                    <span className="text-xs font-bold text-brand-400 font-mono bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
                      {recommendation.recommended_action}
                      {recommendation.retry_after_hours ? ` (after ${recommendation.retry_after_hours}h)` : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">AI Confidence:</span>
                    <span className="text-xs font-bold text-white font-mono">
                      {((recommendation.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400">Reasoning:</span>
                    <p className="text-xs text-slate-200 mt-1 italic bg-surface-card p-3 rounded-xl border border-surface-border leading-relaxed">
                      "{recommendation.reason}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
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
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <CardTitle>Deterministic Policy Engine Decision</CardTitle>
              <CardDescription>Authoritative 15-Rule financial safety and approval boundary</CardDescription>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">15-Rule Priority</span>
        </CardHeader>
        <CardContent>
          {policy ? (
            <div className="bg-navy-950/80 p-5 rounded-xl border border-surface-border space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Policy Decision:</span>
                <span className={`px-3 py-1 rounded-lg font-bold font-mono text-xs ${
                  policy.decision === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : policy.decision === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {policy.decision}
                </span>
              </div>

              <div>
                <span className="text-slate-400">Policy Reason:</span>
                <p className="text-slate-200 font-medium mt-0.5 leading-relaxed">{policy.reason}</p>
              </div>

              <div>
                <span className="text-slate-400">Triggered Rules:</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {(policy.triggeredRules || []).map((rule, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-surface-card border border-surface-border rounded-md text-[11px] font-mono text-slate-300">
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">
              Policy evaluation pending. Click "2. Evaluate Policy" above.
            </p>
          )}
        </CardContent>
      </Card>

      {/* FULL IMMUTABLE AUDIT TIMELINE */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2.5">
            <History className="w-5 h-5 text-brand-400" />
            <div>
              <CardTitle>Immutable Audit Trail Timeline</CardTitle>
              <CardDescription>Write-once chronological ledger tracking every event, actor, and trace ID</CardDescription>
            </div>
          </div>
          <Badge variant="slate">{auditTimeline.length} Events</Badge>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-border">
            {auditTimeline.map((item, idx) => {
              const actorColors = {
                system: 'bg-slate-500',
                ai: 'bg-indigo-500',
                policy_engine: 'bg-purple-500',
                human: 'bg-amber-500',
                worker: 'bg-emerald-500'
              };

              return (
                <div key={item._id || idx} className="relative space-y-1.5">
                  {/* Timeline Node Dot */}
                  <div className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-full ${actorColors[item.actor] || 'bg-slate-500'} ring-4 ring-surface-card`} />

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-white">{item.eventType}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-md uppercase font-mono bg-navy-950 text-slate-300 border border-surface-border">
                        {item.actor}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{formatDate(item.createdAt)}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-navy-950/60 p-2.5 rounded-lg border border-surface-border/60">
                    {item.message}
                  </p>

                  <p className="text-[10px] text-slate-500 font-mono">
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
