/**
 * frontend/src/pages/ReviewQueuePage.jsx
 * Human-in-the-Loop Approval Workbench with dual-theme styling and modal justification controls.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { RiskBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';

export default function ReviewQueuePage() {
  const { user } = useAuth();
  const [pendingCases, setPendingCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'approve', // 'approve' | 'reject'
    caseId: null,
    reason: ''
  });

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

  const openActionModal = (caseId, type) => {
    setModalState({
      isOpen: true,
      type,
      caseId,
      reason: type === 'approve'
        ? 'Operator verified customer status and approved recovery retry'
        : 'Operator rejected recovery action'
    });
  };

  const submitModalAction = async () => {
    if (!modalState.reason.trim()) return;
    setActionLoading(true);
    try {
      if (modalState.type === 'approve') {
        await apiClient.post(`/recovery/${modalState.caseId}/approve`, { reason: modalState.reason });
      } else {
        await apiClient.post(`/recovery/${modalState.caseId}/reject`, { reason: modalState.reason });
      }
      setModalState({ isOpen: false, type: 'approve', caseId: null, reason: '' });
      await fetchPendingCases();
    } catch (err) {
      alert(`Action failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-space-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-h1 text-theme-primary tracking-tight">Human-in-the-Loop Review Queue</h2>
            <Badge variant="warning" dot>{pendingCases.length} Pending</Badge>
          </div>
          <p className="text-body-sm text-theme-muted mt-1">
            Cases escalated by the Policy Engine: High Value (&ge; ₹10,000), low AI confidence (&lt; 0.70), or frequency limits.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={RefreshCw}
          loading={loading}
          onClick={fetchPendingCases}
        >
          Refresh Queue
        </Button>
      </div>

      {/* Review Queue Cards */}
      <div className="space-y-space-4">
        {loading ? (
          <TableSkeleton rows={3} cols={4} />
        ) : (
          pendingCases.map((c) => (
            <Card key={c._id} className="border-semantic-warning/30 p-space-6 space-y-space-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-3 border-b border-theme-border-subtle pb-space-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-semantic-warning-bg text-semantic-warning border border-semantic-warning/20 rounded-radius-md">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-theme-primary font-mono text-body">Case #{c._id.slice(-8)}</span>
                      <RiskBadge riskLevel={c.riskLevel} />
                    </div>
                    <p className="text-body-sm text-theme-muted mt-0.5">
                      Customer: <strong className="text-theme-primary font-medium">{c.customerId?.name || 'Customer'}</strong> ({c.customerId?.maskedEmail || 'r***r@example.com'})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-caption text-theme-muted uppercase tracking-wider">Amount at Risk:</span>
                  <p className="text-h2 font-bold text-semantic-warning font-mono num-tabular">
                    {formatCurrency(c.amountAtRiskPaise)}
                  </p>
                </div>
              </div>

              {/* Escalation details summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4 text-body-sm bg-theme-elevated/60 p-space-4 rounded-radius-md border border-theme-border-subtle">
                <div>
                  <span className="text-theme-muted text-caption">AI Recommended Strategy:</span>
                  <p className="font-mono font-bold text-brand-primary mt-0.5">
                    {c.latestRecommendation?.recommended_action || 'HUMAN_REVIEW'}
                  </p>
                </div>
                <div>
                  <span className="text-theme-muted text-caption">AI Confidence / Probability:</span>
                  <p className="font-mono font-bold text-theme-primary mt-0.5">
                    {((c.latestRecommendation?.confidence || 0.65) * 100).toFixed(0)}% / {((c.recoveryProbability || 0.7) * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <span className="text-theme-muted text-caption">Escalation Policy Reason:</span>
                  <p className="text-theme-primary mt-0.5 font-medium leading-relaxed">
                    {c.latestPolicyDecision?.reason || 'High-value transaction threshold exceeded (≥ ₹10,000).'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-space-3 pt-1">
                <Link
                  to={`/cases/${c._id}`}
                  className="text-body-sm text-brand-primary hover:text-brand-hover font-semibold flex items-center gap-1"
                >
                  <span>Inspect Full Audit History</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center space-x-space-3">
                  <Button
                    size="sm"
                    variant="danger"
                    icon={XCircle}
                    disabled={actionLoading}
                    onClick={() => openActionModal(c._id, 'reject')}
                  >
                    Reject / Stop
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    icon={CheckCircle2}
                    disabled={actionLoading}
                    onClick={() => openActionModal(c._id, 'approve')}
                    className="font-semibold"
                  >
                    Authorize Recovery Action
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}

        {!loading && pendingCases.length === 0 && (
          <EmptyState
            icon={ShieldCheck}
            title="Review Queue is Clear"
            description="All high-value and low-confidence transactions have been processed. Cases within standard limits are approved automatically by the Policy Engine."
          />
        )}
      </div>

      {/* Operator Justification Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.type === 'approve' ? 'Authorize Recovery Action' : 'Reject Recovery Action'}
        description="Record an explicit, auditable operator justification in the immutable ledger."
      >
        <div className="space-y-space-4">
          <div>
            <label className="block text-body-sm font-semibold text-theme-primary mb-space-2">
              Operator Justification Note:
            </label>
            <textarea
              rows={3}
              value={modalState.reason}
              onChange={(e) => setModalState({ ...modalState, reason: e.target.value })}
              className="fintech-input w-full text-body-sm p-space-3 h-auto"
              placeholder="Provide reason for audit logging..."
            />
          </div>

          <div className="flex items-center justify-end space-x-space-3 pt-space-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setModalState({ ...modalState, isOpen: false })}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={modalState.type === 'approve' ? 'success' : 'danger'}
              loading={actionLoading}
              onClick={submitModalAction}
            >
              {modalState.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
