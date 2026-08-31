/**
 * frontend/src/pages/OverviewPage.jsx
 * Production-grade Merchant Overview Dashboard matching Razorpay design language.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { formatCurrency } from '../utils/formatters';
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
  UserCheck,
  RefreshCw,
  BarChart2,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { StatCardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { StatusBadge, RiskBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

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

  const customTooltipStyle = {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderRadius: '10px',
    color: '#F8FAFC',
    fontSize: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-surface-card via-slate-900 to-brand-950/40 border border-surface-border p-6 rounded-2xl shadow-card-subtle">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold text-brand-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Razorpay Revenue Telemetry</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Recovery Performance Dashboard</h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Real-time pipeline monitoring of failed payments, AI strategy recommendations, deterministic policy gates, and genuinely recovered revenue.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="secondary"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
          <Link to="/simulator">
            <Button size="sm" variant="primary" icon={BarChart2}>
              Benchmark
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 Key StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Revenue at Risk"
              value={formatCurrency(kpis.revenueAtRiskPaise)}
              subtitle={`${kpis.activeCasesCount} active cases`}
              icon={AlertTriangle}
              variant="warning"
            />
            <StatCard
              title="Recovered Revenue"
              value={formatCurrency(kpis.recoveredRevenuePaise)}
              subtitle="Genuinely recovered"
              icon={CheckCircle2}
              variant="success"
              trend={kpis.recoveredRevenuePaise > 0 ? '+Active' : null}
              trendPositive
            />
            <StatCard
              title="Recovery Rate"
              value={`${kpis.recoveryRate.toFixed(1)}%`}
              subtitle="Conversion efficiency"
              icon={TrendingUp}
              variant="primary"
            />
            <StatCard
              title="Failed Payments"
              value={kpis.totalFailedPaymentsCount}
              subtitle="Ingested webhooks"
              icon={Clock}
              variant="default"
            />
            <StatCard
              title="Active Pipeline"
              value={kpis.activeCasesCount}
              subtitle="In-flight workflows"
              icon={Layers}
              variant="default"
            />
            <Link to="/review-queue" className="block transition group">
              <StatCard
                title="Pending Approvals"
                value={kpis.pendingApprovalsCount}
                subtitle="Review required →"
                icon={UserCheck}
                variant={kpis.pendingApprovalsCount > 0 ? 'warning' : 'default'}
                className="group-hover:border-amber-500/50"
              />
            </Link>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recovery Pipeline Funnel */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recovery Pipeline Progression</CardTitle>
              <CardDescription>End-to-end case conversion across pipeline stages</CardDescription>
            </div>
            <Badge variant="info">Funnel</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="stage" type="category" stroke="#94A3B8" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="count" fill="#0284C7" radius={[0, 6, 6, 0]} name="Cases" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Failure Reasons & Recoverability */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Failure Reasons Breakdown</CardTitle>
              <CardDescription>Distribution of root causes vs. successful recoveries</CardDescription>
            </div>
            <Badge variant="purple">Categories</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={failures} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="failureReason" stroke="#64748B" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                  <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="count" fill="#6366F1" name="Failed Count" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recoveredCount" fill="#10B981" name="Recovered Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Ingested Cases Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Payment Recovery Cases</CardTitle>
            <CardDescription>Live telemetry stream from Razorpay webhook receiver</CardDescription>
          </div>
          <Link to="/cases" className="text-xs text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1">
            View All Cases <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={4} cols={7} />
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
                  <th className="fintech-table-th">Status</th>
                  <th className="fintech-table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {(overview?.recentCases || []).map((c) => (
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
                        : <span className="text-slate-500 font-sans text-xs">Pending</span>}
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

          {!loading && (!overview?.recentCases || overview.recentCases.length === 0) && (
            <EmptyState
              title="No recovery cases detected yet"
              description="Click 'Simulate ₹4,999 Failure' in the sidebar to simulate an incoming Razorpay webhook event."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
