/**
 * frontend/src/pages/SimulatorPage.jsx
 * 10,000-Transaction Simulation & Strategy Benchmark Workbench with Light-First design tokens.
 */

import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { formatCurrency } from '../utils/formatters';
import {
  Play,
  TrendingUp,
  ShieldCheck,
  Zap,
  BarChart3,
  Sparkles,
  Cpu
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
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function SimulatorPage() {
  const [count, setCount] = useState(10000);
  const [seed, setSeed] = useState(42);
  const [failureRate, setFailureRate] = useState(18);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);

  const runBenchmark = async () => {
    setRunning(true);
    try {
      const res = await apiClient.post('/simulator/run', {
        count: Number(count),
        seed: Number(seed),
        failureRate: Number(failureRate) / 100
      });
      setResults(res.data.data.benchmark);
    } catch (err) {
      alert(`Simulation benchmark failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const strategies = results?.strategies;

  // Chart data preparation (Light Theme Palette)
  const chartData = strategies ? [
    {
      name: '1. No Recovery',
      recoveredRevenue: 0,
      recoveryRate: strategies.NO_RECOVERY.recoveryRate,
      fillColor: '#CBD2DE'
    },
    {
      name: '2. Fixed 24h Retry',
      recoveredRevenue: strategies.FIXED_RETRY.recoveredRevenuePaise / 100,
      recoveryRate: strategies.FIXED_RETRY.recoveryRate,
      fillColor: '#A4B0C4'
    },
    {
      name: '3. Rule-Based Heuristic',
      recoveredRevenue: strategies.RULE_BASED_RECOVERY.recoveredRevenuePaise / 100,
      recoveryRate: strategies.RULE_BASED_RECOVERY.recoveryRate,
      fillColor: '#76B7B2'
    },
    {
      name: '4. RazorRecover (AI+Policy)',
      recoveredRevenue: strategies.AI_ASSISTED_RECOVERY.recoveredRevenuePaise / 100,
      recoveryRate: strategies.AI_ASSISTED_RECOVERY.recoveryRate,
      fillColor: '#222831'
    }
  ] : [];

  const customTooltipStyle = {
    backgroundColor: '#FFFFFF',
    borderColor: '#DBE2EF',
    borderRadius: '12px',
    color: '#222831',
    fontSize: '13px',
    boxShadow: '0 4px 16px rgba(34, 40, 49, 0.08)'
  };

  return (
    <div className="space-y-space-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-theme-surface border border-theme-border-subtle p-space-6 rounded-radius-md shadow-theme-sm flex flex-col md:flex-row md:items-center justify-between gap-space-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-h1 text-theme-primary tracking-tight">Simulation Engine & Benchmark</h2>
            <Badge variant="info" dot>SIMULATION MODE</Badge>
          </div>
          <p className="text-body-sm text-theme-muted max-w-2xl mt-1 leading-relaxed">
            Empirical evaluation across 10,000 synthetic transactions on identical seeds to measure verifiable incremental revenue lift.
          </p>
        </div>

        <div className="text-caption text-theme-muted bg-theme-surface px-space-4 py-space-2 rounded-radius-sm border border-palette-surface-alt font-mono">
          <span>Cost Control: </span>
          <strong className="text-palette-ink font-bold">Trained ML Model + Policy Proxy</strong>
        </div>
      </div>

      {/* Simulator Controls Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-palette-ink" />
            <CardTitle>Simulation Configuration</CardTitle>
          </div>
          <Badge variant="neutral">Mulberry32 PRNG</Badge>
        </CardHeader>
        <CardContent className="space-y-space-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-5">
            <div>
              <label className="block text-body-sm font-semibold text-theme-primary mb-space-1">Transaction Population</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                min={1000}
                max={50000}
                step={1000}
                className="fintech-input w-full font-mono text-body-sm"
              />
            </div>

            <div>
              <label className="block text-body-sm font-semibold text-theme-primary mb-space-1">Random Seed (Reproducibility)</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="fintech-input w-full font-mono text-body-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-space-1">
                <label className="text-body-sm font-semibold text-theme-primary">Payment Failure Rate</label>
                <span className="font-mono text-palette-ink font-bold">{failureRate}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                value={failureRate}
                onChange={(e) => setFailureRate(e.target.value)}
                className="w-full mt-2 accent-palette-ink cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-space-2 flex justify-end">
            <Button
              variant="primary"
              size="lg"
              icon={Play}
              loading={running}
              onClick={runBenchmark}
              className="font-bold text-body"
            >
              {running ? 'Simulating 10,000 Transactions...' : '⚡ Run 10,000-Transaction Comparative Benchmark'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Results */}
      {strategies && (
        <div className="space-y-space-6 animate-fade-in">
          {/* Strategy KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-4">
            {/* Strategy 1: No Recovery */}
            <StatCard
              title="1. No Recovery"
              value="₹0.00"
              subtitle="0.0% recovery rate • 0 actions"
              variant="muted"
            />

            {/* Strategy 2: Fixed 24h Retry */}
            <StatCard
              title="2. Fixed 24h Retry"
              value={formatCurrency(strategies.FIXED_RETRY.recoveredRevenuePaise)}
              subtitle={`${strategies.FIXED_RETRY.recoveryRate}% rate • ${strategies.FIXED_RETRY.optOutComplianceRate}% opt-out`}
              variant="warning"
            />

            {/* Strategy 3: Rule-Based */}
            <StatCard
              title="3. Rule-Based Heuristic"
              value={formatCurrency(strategies.RULE_BASED_RECOVERY.recoveredRevenuePaise)}
              subtitle={`${strategies.RULE_BASED_RECOVERY.recoveryRate}% rate • Standard baseline`}
              variant="info"
            />

            {/* Strategy 4: RazorRecover AI + Policy */}
            <StatCard
              title="4. RazorRecover (AI + Policy)"
              value={formatCurrency(strategies.AI_ASSISTED_RECOVERY.recoveredRevenuePaise)}
              subtitle={`${strategies.AI_ASSISTED_RECOVERY.recoveryRate}% recovery rate • 100% opt-out safe`}
              variant="success"
              trend={`+${strategies.AI_ASSISTED_RECOVERY.incrementalLiftPercentage}% LIFT`}
              trendPositive
            />
          </div>

          {/* Visual Comparison Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-palette-ink" />
                <CardTitle>Revenue Recovered by Strategy (₹ INR)</CardTitle>
              </div>
              <Badge variant="info">Same Population & Seed ({seed})</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full pt-space-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#DBE2EF"
                      vertical={false}
                    />
                    <XAxis dataKey="name" stroke="#686D76" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#686D76" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={customTooltipStyle}
                      formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Recovered Revenue']}
                    />
                    <Bar dataKey="recoveredRevenue" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fillColor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Strategy Matrix Table */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Full 4-Strategy Benchmark Comparison Matrix</CardTitle>
              <span className="text-caption text-theme-muted font-mono">
                Evaluated on {results.totalFailedCount} failed transactions
              </span>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="fintech-table-th">Recovery Strategy</th>
                    <th className="fintech-table-th">Revenue Recovered</th>
                    <th className="fintech-table-th">Recovery Rate</th>
                    <th className="fintech-table-th">Incremental Lift</th>
                    <th className="fintech-table-th">Actions Taken</th>
                    <th className="fintech-table-th">Human Reviews</th>
                    <th className="fintech-table-th">Policy Blocks</th>
                    <th className="fintech-table-th">Opt-Out Safety</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border-subtle font-mono">
                  {Object.values(strategies).map((strat) => {
                    const isAi = strat.strategyName === 'AI_ASSISTED_RECOVERY';
                    return (
                      <tr
                        key={strat.strategyName}
                        className={isAi ? 'bg-theme-surface/80 font-bold' : 'hover:bg-theme-surface/40'}
                      >
                        <td className="fintech-table-td font-sans font-semibold text-theme-primary flex items-center space-x-2">
                          {isAi && <Sparkles className="w-3.5 h-3.5 text-palette-ink" />}
                          <span>{strat.displayName}</span>
                        </td>
                        <td className={`fintech-table-td font-bold num-tabular ${isAi ? 'text-palette-ink' : 'text-theme-primary'}`}>
                          {formatCurrency(strat.recoveredRevenuePaise)}
                        </td>
                        <td className={`fintech-table-td font-bold ${isAi ? 'text-palette-ink' : 'text-theme-secondary'}`}>
                          {strat.recoveryRate}%
                        </td>
                        <td className="fintech-table-td text-palette-ink font-bold">
                          {strat.incrementalLiftPercentage > 0 ? `+${strat.incrementalLiftPercentage}%` : '—'}
                        </td>
                        <td className="fintech-table-td text-theme-secondary">{strat.totalActionsTaken}</td>
                        <td className="fintech-table-td text-palette-ink font-semibold">{strat.humanReviewCount}</td>
                        <td className="fintech-table-td text-theme-muted">{strat.policyBlockCount}</td>
                        <td className="fintech-table-td">
                          <span className={strat.optOutComplianceRate === 100 ? 'text-palette-ink font-bold' : 'text-badge-danger-text font-bold'}>
                            {strat.optOutComplianceRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
