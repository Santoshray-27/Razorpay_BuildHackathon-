/**
 * frontend/src/pages/ReviewQueuePage.jsx
 * Human-in-the-Loop Approval Queue.
 * Displays cases escalated by policy (high value, low confidence, max reminders)
 * and provides authorized merchant operators with one-click approval/rejection controls.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getRiskBadge } from '../utils/formatters';
import { UserCheck, CheckCircle2, XCircle, ArrowUpRight, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ReviewQueuePage() {
  const { user } = useAuth();
  const [pendingCases, setPendingCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPendingCases = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/recovery/pending-approvals');
      setPendingCases(res.data.data.cases || []);
    } catch (err) {
      console.error('Failed to load pending approvals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCases();
  }, []);

  const handleApprove = async (caseId) => {
    const reason = prompt('Enter approval justification for audit log:', 'Approved by merchant operator');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/recovery/${caseId}/approve`, { reason });
      await fetchPendingCases();
    } catch (err) {
      alert(`Approval failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (caseId) => {
    const reason = prompt('Enter rejection reason for audit log:', 'Rejected by merchant operator');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/recovery/${caseId}/reject`, { reason });
      await fetchPendingCases();
    } catch (err) {
      alert(`Rejection failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white">Human-in-the-Loop Review Queue</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {pendingCases.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Cases escalated by the Policy Engine (High Value &ge; ₹10,000, low AI confidence, or frequency thresholds).
          </p>
        </div>
        <button
          onClick={fetchPendingCases}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Pending Items Grid */}
      <div className="space-y-4">
        {pendingCases.map((c) => {
          const riskBadge = getRiskBadge(c.riskLevel);
          return (
            <div
              key={c._id}
              className="bg-slate-900 border border-purple-900/40 rounded-xl p-5 shadow-lg space-y-4 hover:border-purple-500/40 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white font-mono">Case #{c._id.slice(-8)}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${riskBadge.bg} ${riskBadge.text} ${riskBadge.border}`}>
                        {riskBadge.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Customer: <strong className="text-slate-200">{c.customerId?.name || 'Customer'}</strong> ({c.customerId?.email || 'masked'})
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs text-slate-400">Amount at Risk:</span>
                  <p className="text-lg font-bold text-amber-400">{formatCurrency(c.amountAtRiskPaise)}</p>
                </div>
              </div>

              {/* Escalation details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400">AI Recommended Strategy:</span>
                  <p className="font-mono font-semibold text-blue-400 mt-0.5">
                    {c.latestRecommendation?.recommended_action || 'HUMAN_REVIEW'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">AI Confidence / Probability:</span>
                  <p className="font-mono font-semibold text-slate-200 mt-0.5">
                    {((c.latestRecommendation?.confidence || 0) * 100).toFixed(0)}% / {((c.recoveryProbability || 0) * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Escalation Policy Reason:</span>
                  <p className="text-slate-300 mt-0.5 font-medium">
                    {c.latestPolicyDecision?.reason || 'High-value transaction or policy threshold exceeded.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <Link
                  to={`/cases/${c._id}`}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                >
                  <span>Inspect Full Audit History</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleReject(c._id)}
                    disabled={actionLoading}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject / Stop</span>
                  </button>
                  <button
                    onClick={() => handleApprove(c._id)}
                    disabled={actionLoading}
                    className="flex items-center space-x-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Authorize Recovery Action</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {pendingCases.length === 0 && !loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-200">Review Queue is Clear</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All high-value and low-confidence transactions have been reviewed. Cases within standard limits are processed automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
