/**
 * frontend/src/pages/OverviewPage.jsx
 * Merchant Overview Dashboard with Light-First design tokens, 5-stage ghost-bar Funnel Chart,
 * and high-contrast KPI hierarchy.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
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
  Cell,
  LabelList
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { StatCardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { StatusBadge, RiskBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

const PIPELINE_STAGES = [
  { stage: 'Detected', key: 'detected' },
  { stage: 'Analyzing', key: 'analyzing' },
  { stage: 'Recommended', key: 'recommended' },
  { stage: 'Approved', key: 'approved' },
  { stage: 'Recovered', key: 'recovered' }
];

export default function OverviewPage() {
  const { isDark } = useTheme();
  const [overview, setOverview] = useState(null);
  const [failures, setFailures] = useState([]);
  const [rawFunnel, setRawFunnel] = useState([]);
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
      setRawFunnel(funRes.data.data.funnel || []);
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

  // Funnel Data Transformation: Ensure all 5 stages always exist
  const funnelMap = (rawFunnel || []).reduce((acc, item) => {
    acc[item.stage?.toLowerCase()] = item.count || 0;
    return acc;
  }, {});

  const completeFunnelData = PIPELINE_STAGES.map((stg) => {
    const rawCount = funnelMap[stg.key] || funnelMap[stg.stage.toLowerCase()] || 0;
    return {
      stage: stg.stage,
      count: rawCount,
      // For charting: give zero-count stages a small placeholder width so the ghost bar outlines cleanly
      displayVal: rawCount > 0 ? rawCount : 0.08,
      isZero: rawCount === 0
    };
  });

  const customTooltipStyle = {
    backgroundColor: isDark ? '#222831' : '#FFFFFF',
    borderColor: isDark ? '#39424E' : '#DBE2EF',
    borderRadius: '12px',
    color: isDark ? '#FEFCF3' : '#222831',
    fontSize: '13px',
    boxShadow: '0 4px 16px rgba(34, 40, 49, 0.08)'
  };

  return (
    <div className="space-y-space-8 animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-4 bg-theme-surface border border-theme-border-subtle p-space-6 rounded-radius-lg shadow-theme-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 text-caption font-bold text-palette-ink bg-palette-accent px-space-3 py-0.5 rounded-radius-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Razorpay Revenue Telemetry</span>
          </div>
          <h2 className="text-h1 text-theme-primary tracking-tight">Recovery Performance Dashboard</h2>
          <p className="text-body-sm text-theme-muted max-w-2xl leading-relaxed">
            Real-time pipeline telemetry: failed payment detection, AI strategy recommendations, deterministic policy gates, and genuinely recovered revenue.
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

      {/* 6 High-Impact StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-space-4">
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
              variant="danger"
            />
            <StatCard
              title="Active Pipeline"
              value={kpis.activeCasesCount}
              subtitle="In-flight workflows"
              icon={Layers}
              variant="info"
            />
            <Link to="/review-queue" className="block transition group">
              <StatCard
                title="Pending Approvals"
                value={kpis.pendingApprovalsCount}
                subtitle="Review required →"
                icon={UserCheck}
                variant={kpis.pendingApprovalsCount > 0 ? 'warning' : 'muted'}
                className="group-hover:border-palette-accent"
              />
            </Link>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-6">
        {/* Recovery Pipeline Funnel - Ghost-Bar Implementation */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recovery Pipeline Progression</CardTitle>
              <CardDescription>End-to-end case conversion across all 5 sequential stages</CardDescription>
            </div>
            <Badge variant="info">Funnel</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full pt-space-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={completeFunnelData}
                  layout="vertical"
                  margin={{ left: 10, right: 35, top: 10, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#39424E' : '#DBE2EF'}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke={isDark ? '#9BA4B5' : '#686D76'}
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="stage"
                    type="category"
                    stroke={isDark ? '#DBE2EF' : '#222831'}
                    tick={{ fontSize: 12, fontWeight: 600 }}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={customTooltipStyle}
                    formatter={(val, name, props) => [
                      `${props.payload.count} cases`,
                      'Stage Volume'
                    ]}
                  />
                  <Bar dataKey="displayVal" radius={[0, 6, 6, 0]}>
                    {completeFunnelData.map((entry, idx) => {
                      if (entry.isZero) {
                        return (
                          <Cell
                            key={`cell-${idx}`}
                            fill="transparent"
                            stroke={isDark ? '#485362' : '#C8D1E0'}
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                          />
                        );
                      }
                      return (
                        <Cell
                          key={`cell-${idx}`}
                          fill={isDark ? '#F6C453' : '#20242C'}
                        />
                      );
                    })}
                    <LabelList
                      dataKey="count"
                      position="right"
                      fill={isDark ? '#DBE2EF' : '#222831'}
                      fontSize={12}
                      fontWeight={700}
                    />
                  </Bar>
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
              <CardDescription>Root causes distribution vs. successful recoveries</CardDescription>
            </div>
            <Badge variant="primary">Categories</Badge>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full pt-space-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={failures} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#39424E' : '#DBE2EF'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="failureReason"
                    stroke={isDark ? '#9BA4B5' : '#686D76'}
                    tick={{ fontSize: 10 }}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis stroke={isDark ? '#9BA4B5' : '#686D76'} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar
                    dataKey="count"
                    fill={isDark ? '#D96C6C' : '#D96C6C'}
                    name="Failed Count"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="recoveredCount"
                    fill={isDark ? '#9FDD8E' : '#9FDD8E'}
                    name="Recovered Count"
                    radius={[4, 4, 0, 0]}
                  />
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
          <Link
            to="/cases"
            className="text-body-sm text-palette-ink dark:text-palette-accent hover:underline font-bold inline-flex items-center gap-1"
          >
            View All Cases <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={4} cols={8} />
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
                  <th className="fintech-table-th">Status</th>
                  <th className="fintech-table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border-subtle">
                {(overview?.recentCases || []).map((c) => (
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
              description="Click 'Simulate ₹4,999 Failure' in the sidebar to inject an incoming Razorpay payment event."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
