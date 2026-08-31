/**
 * frontend/src/pages/RecoveryCasesPage.jsx
 * Filterable, paginated list of merchant recovery cases with lifecycle badges.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { formatCurrency, formatDate, getStatusBadge, getRiskBadge } from '../utils/formatters';
import { Layers, Search, Filter, ArrowUpRight, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function RecoveryCasesPage() {
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
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
      setCases(res.data.data.cases);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to load recovery cases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases(1);
  }, [statusFilter, riskFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Recovery Cases</h2>
          <p className="text-xs text-slate-400">
            Lifecycle monitoring from detection, AI recommendation, policy decision, through execution.
          </p>
        </div>
        <button
          onClick={() => fetchCases(pagination.page)}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
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

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Risk Levels</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>

        <span className="text-xs text-slate-500 ml-auto">
          Showing {cases.length} of {pagination.total} cases
        </span>
      </div>

      {/* Cases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                <th className="p-4">Case / Payment ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount at Risk</th>
                <th className="p-4">Failure Reason</th>
                <th className="p-4">Risk Level</th>
                <th className="p-4">Probability</th>
                <th className="p-4">Strategy</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cases.map((c) => {
                const statusBadge = getStatusBadge(c.status);
                const riskBadge = getRiskBadge(c.riskLevel);
                return (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono text-slate-300">
                      <span className="text-slate-500">#</span>{c.paymentId?.providerPaymentId || c._id.slice(-8)}
                    </td>
                    <td className="p-4 text-slate-200 font-medium">
                      {c.customerId?.name || 'Customer'}
                    </td>
                    <td className="p-4 font-bold font-mono text-slate-100">
                      {formatCurrency(c.amountAtRiskPaise)}
                    </td>
                    <td className="p-4 text-slate-400">
                      <code>{c.failureReason || 'unknown'}</code>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${riskBadge.bg} ${riskBadge.text} ${riskBadge.border}`}>
                        {riskBadge.label}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-200">
                      {c.recoveryProbability !== null && c.recoveryProbability !== undefined
                        ? `${(c.recoveryProbability * 100).toFixed(0)}%`
                        : '—'}
                    </td>
                    <td className="p-4 text-slate-300 font-mono text-[11px]">
                      {c.latestRecommendation?.recommended_action || '—'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/cases/${c._id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded text-xs transition"
                      >
                        <span>Inspect Case</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {cases.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                    No recovery cases match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchCases(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchCases(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages || loading}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
