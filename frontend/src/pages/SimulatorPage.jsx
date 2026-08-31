/**
 * frontend/src/pages/SimulatorPage.jsx
 * Production-grade 10,000-Transaction Simulation & Strategy Benchmark Workbench.
 * Demonstrates provable incremental business lift of AI + Policy vs Rule-Based and Fixed-Retry Baselines.
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
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Percent,
  Check,
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

  // Chart data preparation
  const chartData = strategies ? [
    {
      name: '1. No Recovery',
      recoveredRevenue: 0,
      recoveryRate: strategies.NO_RECOVERY.recoveryRate,
      fillColor: '#64748B'
    },
    {
      name: '2. Fixed 24h Retry',
      recoveredRevenue: strategies.FIXED_RETRY.recoveredRevenuePaise / 100,
      recoveryRate: strategies.FIXED_RETRY.recoveryRate,
      fillColor: '#94A3B8'
    },
    {
      name: '3. Rule-Based Heuristic',
      recoveredRevenue: strategies.RULE_BASED_RECOVERY.recoveredRevenuePaise / 100,
      recoveryRate: strategies.RULE_BASED_RECOVERY.recoveryRate,
      fillColor: '#6366F1'
    },
    {
      name: '4. RazorRecover (AI+Policy)',
      recoveredRevenue: strategies.AI_ASSISTED_RECOVERY.recoveredRevenuePaise / 100,
      recoveryRate: strategies.AI_ASSISTED_RECOVERY.recoveryRate,
      fillColor: '#0284C7'
    }
  ] : [];

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
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-surface-card via-slate-900 to-indigo-950/40 border border-surface-border p-6 rounded-2xl shadow-card-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Simulation Engine & Benchmark</h2>
            <Badge variant="purple" dot>SIMULATION MODE</Badge>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl mt-1">
            Empirical evaluation across 10,000 synthetic transactions on identical seeds to measure verifiable incremental revenue lift.
          </p>
        </div>

        <div className="text-xs text-slate-400 bg-navy-950/80 px-3.5 py-2 rounded-xl border border-surface-border font-mono">
          <span>Cost Control: </span>
          <strong className="text-emerald-400">Trained ML Model + Policy Proxy</strong>
        </div>
      </div>

      {/* Simulator Controls Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-brand-400" />
            <CardTitle>Simulation Configuration</CardTitle>
          </div>
          <Badge variant="info">Mulberry32 PRNG</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Transaction Population</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                min={1000}
                max={50000}
                step={1000}
                className="fintech-input w-full font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Random Seed (Reproducibility)</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="fintech-input w-full font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Payment Failure Rate</label>
                <span className="font-mono text-brand-400 font-bold">{failureRate}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                value={failureRate}
                onChange={(e) => setFailureRate(e.target.value)}
                className="w-full mt-2 accent-brand-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              size="lg"
              icon={Play}
              loading={running}
              onClick={runBenchmark}
              className="shadow-glow-brand font-bold text-xs md:text-sm"
            >
              {running ? 'Simulating 10,000 Transactions...' : '⚡ Run 10,000-Transaction Comparative Benchmark'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Results */}
      {strategies && (
        <div className="space-y-6 animate-fade-in">
          {/* Strategy KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Strategy 1: No Recovery */}
            <StatCard
              title="1. No Recovery"
              value="₹0.00"
              subtitle="0.0% recovery rate • 0 actions"
              variant="default"
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
              variant="primary"
            />

            {/* Strategy 4: RazorRecover AI + Policy */}
            <StatCard
              title="4. RazorRecover (AI + Policy)"
              value={formatCurrency(strategies.AI_ASSISTED_RECOVERY.recoveredRevenuePaise)}
              subtitle={`${strategies.AI_ASSISTED_RECOVERY.recoveryRate}% recovery rate • 100% opt-out safe`}
              variant="success"
              trend={`+${strategies.AI_ASSISTED_RECOVERY.incrementalLiftPercentage}% LIFT`}
              trendPositive
              className="border-brand-500/50 shadow-glow-brand"
            />
          </div>

          {/* Visual Comparison Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                <CardTitle>Revenue Recovered by Strategy (₹ INR)</CardTitle>
              </div>
              <Badge variant="info">Same Population & Seed ({seed})</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
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
              <span className="text-xs text-slate-400 font-mono">
                Evaluated on {results.totalFailedCount} failed transactions
              </span>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
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
                <tbody className="divide-y divide-surface-border/60 font-mono">
                  {Object.values(strategies).map((strat) => {
                    const isAi = strat.strategyName === 'AI_ASSISTED_RECOVERY';
                    return (
                      <tr key={strat.strategyName} className={isAi ? 'bg-brand-500/10 font-bold' : 'hover:bg-slate-800/30'}>
                        <td className="fintech-table-td font-sans font-semibold text-slate-200 flex items-center space-x-2">
                          {isAi && <Sparkles className="w-3.5 h-3.5 text-brand-400" />}
                          <span>{strat.displayName}</span>
                        </td>
                        <td className={`fintech-table-td font-extrabold num-tabular ${isAi ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {formatCurrency(strat.recoveredRevenuePaise)}
                        </td>
                        <td className={`fintech-table-td font-bold ${isAi ? 'text-brand-400' : 'text-slate-300'}`}>
                          {strat.recoveryRate}%
                        </td>
                        <td className="fintech-table-td text-emerald-400 font-bold">
                          {strat.incrementalLiftPercentage > 0 ? `+${strat.incrementalLiftPercentage}%` : '—'}
                        </td>
                        <td className="fintech-table-td text-slate-300">{strat.totalActionsTaken}</td>
                        <td className="fintech-table-td text-purple-400">{strat.humanReviewCount}</td>
                        <td className="fintech-table-td text-slate-400">{strat.policyBlockCount}</td>
                        <td className="fintech-table-td">
                          <span className={strat.optOutComplianceRate === 100 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
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
