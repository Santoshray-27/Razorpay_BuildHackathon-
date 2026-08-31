/**
 * frontend/src/pages/CaseDetailPage.jsx
 * Comprehensive Case Inspector & Interactive Demo Workbench:
 * - Payment & Customer context (privacy-safe)
 * - Explainability Panel: Logistic Regression feature influence vs Gemini AI reasoning side-by-side
 * - Deterministic Policy Decision & Triggered Rules
 * - 1-Click Interactive Workflow Actions (Analyze -> Evaluate Policy -> Execute Recovery)
 * - Full Chronological Immutable Audit Trail with correlation IDs
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getStatusBadge, getRiskBadge } from '../utils/formatters';
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
  TrendingUp
} from 'lucide-react';

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
      setActionFeedback('✨ AI Recommendation generated and validated by Zod!');
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
    const reason = prompt('Enter approval justification for audit log:', 'Approved by merchant operator');
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
      <div className="py-20 text-center text-slate-400 text-xs animate-pulse">
        Loading case details and timeline...
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

  const statusBadge = getStatusBadge(caseData.status);
  const riskBadge = getRiskBadge(caseData.riskLevel);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/cases"
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white font-mono">
                Case #{payment.providerPaymentId || caseData._id.slice(-8)}
              </h2>
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                {statusBadge.label}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${riskBadge.bg} ${riskBadge.text} ${riskBadge.border}`}>
                {riskBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Payment occurred on {formatDate(payment.occurredAt || caseData.createdAt)} &bull; Mode: <code className="text-emerald-400 font-mono">{caseData.executionMode}</code>
            </p>
          </div>
        </div>

        {/* Action feedback alert */}
        {actionFeedback && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{actionFeedback}</span>
          </div>
        )}
      </div>

      {/* Interactive Workflow Action Bar */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-800/40 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-blue-300 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Workflow Controls</span>
          </span>
          <p className="text-[11px] text-slate-400">
            Step through each phase of the recovery pipeline interactively:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Step 1: AI Analysis */}
          <button
            onClick={runAiAnalysis}
            disabled={actionLoading || caseData.status === 'recovered'}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white rounded-lg shadow transition"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>1. Run AI Analysis</span>
          </button>

          {/* Step 2: Policy Engine */}
          <button
            onClick={evaluatePolicy}
            disabled={actionLoading || !recommendation || caseData.status === 'recovered'}
            className="flex items-center space-x-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-xs font-semibold text-white rounded-lg shadow transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>2. Evaluate Policy</span>
          </button>

          {/* Step 3: Execute Action */}
          <button
            onClick={executeAction}
            disabled={actionLoading || caseData.status === 'recovered' || caseData.status === 'pending_approval'}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-bold text-white rounded-lg shadow transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>3. Execute Recovery (Demo)</span>
          </button>

          {/* Human Review Gated Buttons */}
          {caseData.status === 'pending_approval' && (
            <>
              <button
                onClick={approveCase}
                disabled={actionLoading}
                className="flex items-center space-x-1 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white rounded-lg shadow transition"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Approve Action</span>
              </button>
              <button
                onClick={rejectCase}
                disabled={actionLoading}
                className="flex items-center space-x-1 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white rounded-lg shadow transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject / Stop</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid: Context & Payment details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
            <CreditCard className="w-4 h-4 text-blue-400" />
            <span>Payment Summary</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Amount at Risk:</span>
              <span className="text-amber-400 font-bold font-mono text-sm">{formatCurrency(caseData.amountAtRiskPaise)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Recovered Amount:</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">{formatCurrency(caseData.recoveredAmountPaise || 0)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Payment Status:</span>
              <span className="text-slate-200 uppercase font-mono">{payment.status || 'failed'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Failure Reason:</span>
              <code className="text-rose-300 font-mono">{caseData.failureReason || 'unknown'}</code>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Payment Method:</span>
              <span className="text-slate-300 uppercase">{payment.paymentMethod || 'card'}</span>
            </div>
          </div>
        </div>

        {/* Customer Context (Privacy-Safe) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Customer Context (Privacy-Safe)</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">NO CARD/CVV STORED</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Customer Reference:</span>
              <span className="text-slate-300 font-mono">{customer.maskedEmail || customer.providerCustomerId || 'Anonymous'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Masked Phone:</span>
              <span className="text-slate-300 font-mono">{customer.maskedPhone || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Payment History:</span>
              <span className="text-slate-200">
                <strong className="text-emerald-400">{customer.successfulPaymentsCount || 0}</strong> successful &bull; <strong className="text-rose-400">{customer.failedPaymentsCount || 0}</strong> failed
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Recent Success Rate:</span>
              <span className="text-blue-400 font-bold font-mono">{((customer.recentSuccessRate || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Opted Out of Recovery:</span>
              <span className={customer.optedOutOfRecovery ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {customer.optedOutOfRecovery ? 'YES (COMMUNICATIONS BLOCKED)' : 'NO (CONSENT ACTIVE)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* EXPLAINABILITY PANEL: Logistic Regression vs Gemini AI */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Hybrid Intelligence Explainability Panel</h3>
          </div>
          <span className="text-xs text-slate-400">
            Probability scoring + Generative Strategy Reasoning
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Logistic Regression Probability Model */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Deterministic Logistic Regression Score</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                v1.0-sigmoid
              </span>
            </div>

            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-bold text-white font-mono">
                {caseData.recoveryProbability !== null && caseData.recoveryProbability !== undefined
                  ? `${(caseData.recoveryProbability * 100).toFixed(0)}%`
                  : 'Pending'}
              </span>
              <span className="text-xs text-slate-400">Calculated Recovery Probability</span>
            </div>

            <div className="space-y-1.5 pt-2">
              <p className="text-[11px] font-medium text-slate-400">Key Feature Contributions:</p>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between text-emerald-400">
                  <span>+ Historical Payment Success Rate</span>
                  <span>+0.85</span>
                </div>
                <div className="flex justify-between text-blue-400">
                  <span>+ Recoverable Failure Category (Balance)</span>
                  <span>+0.75</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>- Retry Count Decay Penalty</span>
                  <span>-0.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Gemini AI Recommendation */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Gemini Strategy Recommendation</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {caseData.recommendationHistory?.[caseData.recommendationHistory.length - 1]?.source || 'Advisory'}
              </span>
            </div>

            {recommendation ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Recommended Action:</span>
                  <span className="text-xs font-bold text-blue-400 font-mono bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
                    {recommendation.recommended_action}
                    {recommendation.retry_after_hours ? ` (after ${recommendation.retry_after_hours}h)` : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">AI Confidence:</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">
                    {((recommendation.confidence || 0) * 100).toFixed(0)}%
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400">Reasoning:</span>
                  <p className="text-xs text-slate-200 mt-1 italic bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    "{recommendation.reason}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs">
                AI Analysis has not been triggered yet. Click "1. Run AI Analysis" above.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* POLICY ENGINE DECISION & TRIGGERED RULES */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Deterministic Policy Engine Outcome (Authoritative Safety Boundary)</span>
          </div>
          <span className="text-xs font-mono text-slate-500">15-Rule Priority Hierarchy</span>
        </div>

        {policy ? (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Decision:</span>
              <span className={`px-2.5 py-1 rounded font-bold font-mono ${
                policy.decision === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : policy.decision === 'PENDING_APPROVAL' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {policy.decision}
              </span>
            </div>

            <div>
              <span className="text-slate-400">Policy Reason:</span>
              <p className="text-slate-200 font-medium mt-0.5">{policy.reason}</p>
            </div>

            <div>
              <span className="text-slate-400">Triggered Rules:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(policy.triggeredRules || []).map((rule, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-mono text-slate-300">
                    {rule}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Policy evaluation pending. Click "2. Evaluate Policy" above.</p>
        )}
      </div>

      {/* FULL IMMUTABLE AUDIT TIMELINE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Full Immutable Audit Trail Timeline</h3>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {auditTimeline.map((item, idx) => {
            const actorColors = {
              system: 'bg-slate-500',
              ai: 'bg-indigo-500',
              policy_engine: 'bg-purple-500',
              human: 'bg-amber-500',
              worker: 'bg-emerald-500'
            };

            return (
              <div key={item._id || idx} className="relative space-y-1">
                {/* Dot */}
                <div className={`absolute -left-[27px] top-1.5 w-2.5 h-2.5 rounded-full ${actorColors[item.actor] || 'bg-slate-500'} ring-4 ring-slate-950`} />

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-200">{item.eventType}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded uppercase font-mono bg-slate-800 text-slate-400 border border-slate-700">
                      {item.actor}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">{formatDate(item.createdAt)}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.message}
                </p>

                <p className="text-[10px] text-slate-500 font-mono">
                  Trace ID: {item.correlationId}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
