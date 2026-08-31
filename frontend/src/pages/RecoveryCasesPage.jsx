/**
 * frontend/src/pages/RecoveryCasesPage.jsx
 * Filterable, paginated recovery case explorer with life-cycle badges and search.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { formatCurrency } from '../utils/formatters';
import {
  Layers,
  Search,
  Filter,
  ArrowUpRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { StatusBadge, RiskBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

export default function RecoveryCasesPage() {
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCases = async (page = 1) => {
    setLoading(true);
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
      console.error('Failed to load recovery cases', err);
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Recovery Cases</h2>
          <p className="text-xs text-slate-400">
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
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Payment ID, Case ID, or Customer..."
                className="fintech-input w-full pl-9 text-xs"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="fintech-input text-xs"
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
              className="fintech-input text-xs"
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredCases.length} of {pagination.total} cases
          </span>
        </div>
      </Card>

      {/* Cases Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={8} />
          ) : (
            <table className="w-full text-left text-xs">
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
              <tbody className="divide-y divide-surface-border/60">
                {filteredCases.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition">
                    <td className="fintech-table-td font-mono font-semibold text-slate-300">
                      <span className="text-slate-500">#</span>{c.paymentId?.providerPaymentId || c._id.slice(-8)}
                    </td>
                    <td className="fintech-table-td font-medium text-slate-200">
                      {c.customerId?.name || 'Rahul Sharma'}
                    </td>
                    <td className="fintech-table-td font-bold font-mono text-white num-tabular">
                      {formatCurrency(c.amountAtRiskPaise)}
                    </td>
                    <td className="fintech-table-td text-slate-400 font-mono text-[11px]">
                      {c.failureReason || 'insufficient_funds'}
                    </td>
                    <td className="fintech-table-td">
                      <RiskBadge riskLevel={c.riskLevel} />
                    </td>
                    <td className="fintech-table-td font-mono font-semibold text-slate-200">
                      {c.recoveryProbability !== null && c.recoveryProbability !== undefined
                        ? `${(c.recoveryProbability * 100).toFixed(0)}%`
                        : <span className="text-slate-500 font-sans text-xs">—</span>}
                    </td>
                    <td className="fintech-table-td text-brand-300 font-mono text-[11px]">
                      {c.latestRecommendation?.recommended_action || '—'}
                    </td>
                    <td className="fintech-table-td">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="fintech-table-td text-right">
                      <Link to={`/cases/${c._id}`}>
                        <Button size="sm" variant="primary" icon={ArrowUpRight}>
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
              description="Try adjusting your search query or status filters."
            />
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-navy-950/60 border-t border-surface-border flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <strong className="text-slate-200">{pagination.page}</strong> of <strong className="text-slate-200">{pagination.pages}</strong>
          </span>
          <div className="flex items-center space-x-2">
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
