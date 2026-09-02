/**
 * frontend/src/pages/RecoveryCasesPage.jsx
 * Filterable, paginated recovery case explorer with Light-First design tokens.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { formatCurrency } from '../utils/formatters';
import {
  Layers,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { StatusBadge, RiskBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

export default function RecoveryCasesPage() {
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCases = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/recovery/cases', {
        params: {
          page,
          limit: pagination.limit,
          status: statusFilter || undefined,
          riskLevel: riskFilter || undefined
        }
      });
      setCases(res.data.data.cases || []);
      setPagination(res.data.data.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load recovery cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases(1);
  }, [statusFilter, riskFilter]);

  const filteredCases = cases.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const paymentId = c.paymentId?.providerPaymentId?.toLowerCase() || '';
    const caseId = c._id?.toLowerCase() || '';
    const customerName = c.customerId?.name?.toLowerCase() || '';
    return paymentId.includes(q) || caseId.includes(q) || customerName.includes(q);
  });

  return (
    <div className="space-y-space-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4">
        <div>
          <h2 className="text-h1 text-theme-primary tracking-tight">Recovery Cases</h2>
          <p className="text-body-sm text-theme-muted mt-1">
            End-to-end lifecycle monitoring: detection, AI recommendation, policy enforcement, through execution.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={RefreshCw}
          loading={loading}
          onClick={() => fetchCases(pagination.page)}
        >
          Refresh
        </Button>
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="p-space-4">
        <div className="flex flex-wrap items-center justify-between gap-space-3">
          <div className="flex flex-wrap items-center gap-space-3 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-theme-muted absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Payment ID, Case ID, or Customer..."
                className="fintech-input w-full pl-9 text-body-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="fintech-input text-body-sm"
            >
              <option value="">All Statuses</option>
              <option value="detected">Detected</option>
              <option value="analyzing">Analyzing</option>
              <option value="recommended">Recommended</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="executing">Executing</option>
              <option value="recovered">Recovered</option>
              <option value="stopped">Stopped</option>
            </select>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="fintech-input text-body-sm"
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

          <span className="text-caption font-mono text-theme-muted">
            Showing {filteredCases.length} of {pagination.total} cases
          </span>
        </div>
      </Card>

      {error && cases.length === 0 && (
        <ErrorState
          title="Failed to Load Recovery Cases"
          message={error}
          onRetry={() => fetchCases(pagination.page)}
        />
      )}

      {/* Cases Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={8} />
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="fintech-table-th">Payment / Case ID</th>
                  <th className="fintech-table-th">Customer</th>
                  <th className="fintech-table-th">Amount at Risk</th>
                  <th className="fintech-table-th">Failure Reason</th>
                  <th className="fintech-table-th">Risk Level</th>
                  <th className="fintech-table-th">Probability</th>
                  <th className="fintech-table-th">AI Strategy</th>
                  <th className="fintech-table-th">Status</th>
                  <th className="fintech-table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border-subtle">
                {filteredCases.map((c) => (
                  <tr key={c._id} className="hover:bg-theme-surface/50 transition-colors">
                    <td className="fintech-table-td font-mono font-semibold text-theme-primary">
                      <span className="text-theme-muted">#</span>{c.paymentId?.providerPaymentId || c._id.slice(-8)}
                    </td>
                    <td className="fintech-table-td font-medium text-theme-primary">
                      {c.customerId?.name || 'Rahul Sharma'}
                    </td>
                    <td className="fintech-table-td font-bold font-mono text-theme-primary num-tabular">
                      {formatCurrency(c.amountAtRiskPaise)}
                    </td>
                    <td className="fintech-table-td text-theme-secondary font-mono text-caption">
                      {c.failureReason || 'insufficient_funds'}
                    </td>
                    <td className="fintech-table-td">
                      <RiskBadge riskLevel={c.riskLevel} />
                    </td>
                    <td className="fintech-table-td font-mono font-bold text-theme-primary">
                      {c.recoveryProbability !== null && c.recoveryProbability !== undefined
                        ? `${(c.recoveryProbability * 100).toFixed(0)}%`
                        : <span className="text-theme-muted text-caption">Pending</span>}
                    </td>
                    <td className="fintech-table-td text-palette-ink font-mono text-caption font-semibold">
                      {c.latestRecommendation?.recommended_action || '—'}
                    </td>
                    <td className="fintech-table-td">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="fintech-table-td text-right">
                      <Link to={`/cases/${c._id}`}>
                        <Button size="sm" variant="outline" icon={ArrowUpRight}>
                          Inspect
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredCases.length === 0 && (
            <EmptyState
              title="No matching recovery cases"
              description="Try adjusting your search query or status filter."
            />
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-space-4 bg-theme-surface border-t border-theme-border-subtle flex items-center justify-between text-caption text-theme-secondary">
          <span>
            Page <strong className="text-theme-primary">{pagination.page}</strong> of <strong className="text-theme-primary">{pagination.pages}</strong>
          </span>
          <div className="flex items-center space-x-space-2">
            <Button
              size="sm"
              variant="outline"
              icon={ChevronLeft}
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchCases(pagination.page - 1)}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page >= pagination.pages || loading}
              onClick={() => fetchCases(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
