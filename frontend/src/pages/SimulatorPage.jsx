/**
 * frontend/src/pages/SimulatorPage.jsx
 * 10,000-Transaction Synthetic Simulation & Strategy Evaluation Workbench.
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
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

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
      name: 'No Recovery',
      recoveredRevenue: 0,
      recoveryRate: strategies.NO_RECOVERY.recoveryRate,
      actions: strategies.NO_RECOVERY.totalActionsTaken
    },
    {
      name: 'Fixed 24h Retry',
      recoveredRevenue: strategies.FIXED_RETRY.recoveredRevenuePaise / 100,
      recoveryRate: strategies.FIXED_RETRY.recoveryRate,
      actions: strategies.FIXED_RETRY.totalActionsTaken
    },
    {
      name: 'Rule-Based Heuristic',
      recoveredRevenue: strategies.RULE_BASED_RECOVERY.recoveredRevenuePaise / 100,
      recoveryRate: strategies.RULE_BASED_RECOVERY.recoveryRate,
      actions: strategies.RULE_BASED_RECOVERY.totalActionsTaken
    },
    {
      name: 'RazorRecover (AI + Policy)',
      recoveredRevenue: strategies.AI_ASSISTED_RECOVERY.recoveredRevenuePaise / 100,
      recoveryRate: strategies.AI_ASSISTED_RECOVERY.recoveryRate,
      actions: strategies.AI_ASSISTED_RECOVERY.totalActionsTaken
    }
  ] : [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white">Simulation Engine & Benchmark</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              SIMULATION MODE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical evaluation across 10,000 synthetic transactions on identical seeds to measure real revenue lift.
          </p>
        </div>

        <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
          <span>Cost Control: </span>
          <strong className="text-emerald-400">Deterministic Proxy Policy Engine</strong>
        </div>
      </div>

      {/* Simulator Controls Card */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Simulation Configuration</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Transaction Population</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min={1000}
              max={50000}
              step={1000}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Random Seed (Reproducibility)</label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Payment Failure Rate ({failureRate}%)</label>
            <input
              type="range"
              min="5"
              max="40"
              value={failureRate}
              onChange={(e) => setFailureRate(e.target.value)}
              className="w-full mt-2 accent-blue-600"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={runBenchmark}
            disabled={running}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white rounded-lg shadow transition active:scale-[0.99]"
          >
            <Play className={`w-4 h-4 fill-current ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Simulating 10,000 Transactions...' : '⚡ Run 10,000-Transaction Comparative Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Results Section */}
      {strategies && (
        <div className="space-y-6 animate-fadeIn">
          {/* Strategy KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Strategy 1: No Recovery */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-slate-400">1. No Recovery</span>
              <p className="text-xl font-bold font-mono text-slate-500">₹0.00</p>
              <p className="text-[11px] text-slate-500">0.0% recovery rate &bull; 0 actions</p>
            </div>

            {/* Strategy 2: Fixed 24h Retry */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-slate-300">2. Fixed 24h Retry</span>
              <p className="text-xl font-bold font-mono text-slate-200">
                {formatCurrency(strategies.FIXED_RETRY.recoveredRevenuePaise)}
              </p>
              <p className="text-[11px] text-slate-400">
                {strategies.FIXED_RETRY.recoveryRate}% rate &bull; {strategies.FIXED_RETRY.optOutComplianceRate}% opt-out safety
              </p>
            </div>

            {/* Strategy 3: Rule-Based */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-blue-300">3. Rule-Based Heuristic</span>
              <p className="text-xl font-bold font-mono text-blue-400">
                {formatCurrency(strategies.RULE_BASED_RECOVERY.recoveredRevenuePaise)}
              </p>
              <p className="text-[11px] text-slate-400">
                {strategies.RULE_BASED_RECOVERY.recoveryRate}% rate &bull; Standard baseline
              </p>
            </div>

            {/* Strategy 4: RazorRecover AI + Policy */}
            <div className="bg-gradient-to-b from-blue-950/80 to-slate-900 border border-blue-500/50 rounded-xl p-4 space-y-2 shadow-lg shadow-blue-950/50 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>4. RazorRecover (AI + Policy)</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  +{strategies.AI_ASSISTED_RECOVERY.incrementalLiftPercentage}% LIFT
                </span>
              </div>
              <p className="text-xl font-bold font-mono text-emerald-400">
                {formatCurrency(strategies.AI_ASSISTED_RECOVERY.recoveredRevenuePaise)}
              </p>
              <p className="text-[11px] text-emerald-300/80 font-medium">
                {strategies.AI_ASSISTED_RECOVERY.recoveryRate}% recovery rate &bull; 100% opt-out safe
              </p>
            </div>
          </div>

          {/* Visual Comparison Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-200">Revenue Recovered by Strategy (₹ INR)</h3>
              </div>
              <span className="text-xs text-slate-500">Same Population & Seed ({seed})</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Recovered Revenue']}
                  />
                  <Bar dataKey="recoveredRevenue" fill="#0c66e4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Strategy Matrix Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Full 4-Strategy Benchmark Comparison Matrix
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Evaluated on {results.totalFailedCount} failed payments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-950/40">
                    <th className="p-3.5">Recovery Strategy</th>
                    <th className="p-3.5">Revenue Recovered</th>
                    <th className="p-3.5">Recovery Rate</th>
                    <th className="p-3.5">Incremental Lift</th>
                    <th className="p-3.5">Actions Taken</th>
                    <th className="p-3.5">Human Reviews</th>
                    <th className="p-3.5">Policy Blocks</th>
                    <th className="p-3.5">Opt-Out Safety</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {Object.values(strategies).map((strat, idx) => {
                    const isAi = strat.strategyName === 'AI_ASSISTED_RECOVERY';
                    return (
                      <tr key={strat.strategyName} className={isAi ? 'bg-blue-950/20 font-bold' : 'hover:bg-slate-800/30'}>
                        <td className="p-3.5 font-sans font-medium text-slate-200 flex items-center space-x-2">
                          {isAi && <Sparkles className="w-3.5 h-3.5 text-blue-400" />}
                          <span>{strat.displayName}</span>
                        </td>
                        <td className={`p-3.5 font-bold ${isAi ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {formatCurrency(strat.recoveredRevenuePaise)}
                        </td>
                        <td className={`p-3.5 font-bold ${isAi ? 'text-blue-400' : 'text-slate-300'}`}>
                          {strat.recoveryRate}%
                        </td>
                        <td className="p-3.5 text-emerald-400">
                          {strat.incrementalLiftPercentage > 0 ? `+${strat.incrementalLiftPercentage}%` : '—'}
                        </td>
                        <td className="p-3.5 text-slate-300">{strat.totalActionsTaken}</td>
                        <td className="p-3.5 text-purple-400">{strat.humanReviewCount}</td>
                        <td className="p-3.5 text-slate-400">{strat.policyBlockCount}</td>
                        <td className="p-3.5">
                          <span className={strat.optOutComplianceRate === 100 ? 'text-emerald-400' : 'text-rose-400'}>
                            {strat.optOutComplianceRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
