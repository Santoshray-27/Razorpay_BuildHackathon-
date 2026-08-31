/**
 * frontend/src/pages/OverviewPage.jsx
 * Merchant executive overview dashboard with real-time KPI cards, charts, and activity feeds.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { formatCurrency, formatDate, getStatusBadge, getRiskBadge } from '../utils/formatters';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

export default function OverviewPage() {
  const [overview, setOverview] = useState(null);
  const [failures, setFailures] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ovRes, failRes, funRes, stratRes] = await Promise.all([
        apiClient.get('/analytics/overview'),
        apiClient.get('/analytics/failures'),
        apiClient.get('/analytics/funnel'),
        apiClient.get('/analytics/recovery')
      ]);

      setOverview(ovRes.data.data);
      setFailures(failRes.data.data.failures || []);
      setFunnel(funRes.data.data.funnel || []);
      setStrategies(stratRes.data.data.strategies || []);
    } catch (err) {
      console.error('Failed to load dashboard analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const kpis = overview?.kpis || {
    revenueAtRiskPaise: 0,
    recoveredRevenuePaise: 0,
    recoveryRate: 0,
    totalFailedPaymentsCount: 0,
    activeCasesCount: 0,
    pendingApprovalsCount: 0
  };

  const COLORS = ['#0c66e4', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white">Revenue Recovery Performance</h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry of detected at-risk payments, AI analysis, policy enforcement, and recovered revenue.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Execution Mode:</span>
          <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
            MOCK_DEMO
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Revenue at Risk */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Revenue at Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg font-bold text-amber-400 font-mono">
            {formatCurrency(kpis.revenueAtRiskPaise)}
          </p>
          <p className="text-[11px] text-slate-500">{kpis.activeCasesCount} active cases</p>
        </div>

        {/* Recovered Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Recovered Revenue</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-emerald-400 font-mono">
            {formatCurrency(kpis.recoveredRevenuePaise)}
          </p>
          <p className="text-[11px] text-emerald-500/80">Genuine recovered</p>
        </div>

        {/* Recovery Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Recovery Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-blue-400 font-mono">
            {kpis.recoveryRate.toFixed(1)}%
          </p>
          <p className="text-[11px] text-slate-500">Conversion efficiency</p>
        </div>

        {/* Failed Payments */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Failed Payments</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-200 font-mono">
            {kpis.totalFailedPaymentsCount}
          </p>
          <p className="text-[11px] text-slate-500">Ingested events</p>
        </div>

        {/* Active Recovery Cases */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Cases</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-lg font-bold text-indigo-400 font-mono">
            {kpis.activeCasesCount}
          </p>
          <p className="text-[11px] text-slate-500">In recovery pipeline</p>
        </div>

        {/* Pending Human Approvals */}
        <Link
          to="/review-queue"
          className="bg-slate-900 border border-purple-900/50 hover:border-purple-500/50 rounded-xl p-4 space-y-1 transition group"
        >
          <div className="flex items-center justify-between text-purple-300 text-xs font-medium">
            <span>Pending Approvals</span>
            <UserCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-lg font-bold text-purple-400 font-mono">
            {kpis.pendingApprovalsCount}
          </p>
          <p className="text-[11px] text-purple-300/70">Requires operator review →</p>
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recovery Funnel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Recovery Pipeline Funnel</h3>
            <span className="text-xs text-slate-500">End-to-end progression</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="stage" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0c66e4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Failure Breakdown by Reason */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Failure Reasons & Recoverability</h3>
            <span className="text-xs text-slate-500">Distribution</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failures} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="failureReason" stroke="#64748b" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366f1" name="Failed Count" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recoveredCount" fill="#10b981" name="Recovered Count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">Recent Recovery Pipeline Cases</h3>
          </div>
          <Link to="/cases" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
            View All Cases →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="pb-3">Payment / Case ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Amount at Risk</th>
                <th className="pb-3">Failure Reason</th>
                <th className="pb-3">Risk Level</th>
                <th className="pb-3">Probability</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(overview?.recentCases || []).map((c) => {
                const statusBadge = getStatusBadge(c.status);
                const riskBadge = getRiskBadge(c.riskLevel);
                return (
                  <tr key={c._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono text-slate-300">
                      <span className="text-slate-500">#</span>{c.paymentId?.providerPaymentId || c._id.slice(-8)}
                    </td>
                    <td className="py-3 text-slate-300 font-medium">
                      {c.customerId?.name || 'Customer'}
                    </td>
                    <td className="py-3 font-bold font-mono text-slate-100">
                      {formatCurrency(c.amountAtRiskPaise)}
                    </td>
                    <td className="py-3 text-slate-400">
                      <code>{c.failureReason || 'unknown'}</code>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${riskBadge.bg} ${riskBadge.text} ${riskBadge.border}`}>
                        {riskBadge.label}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-semibold text-slate-200">
                      {c.recoveryProbability !== null && c.recoveryProbability !== undefined
                        ? `${(c.recoveryProbability * 100).toFixed(0)}%`
                        : 'Pending'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/cases/${c._id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded text-xs transition"
                      >
                        <span>View</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!overview?.recentCases || overview.recentCases.length === 0) && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No recovery cases detected yet. Click "Simulate ₹4,999 Failure" in the sidebar to generate a live case.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
