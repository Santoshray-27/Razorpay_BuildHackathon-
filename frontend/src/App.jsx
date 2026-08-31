/**
 * frontend/src/App.jsx
 * Main Application Shell & Phase 0 Foundation Dashboard.
 * Displays backend & database health status, execution mode badges, and core architecture info.
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from './api/client';
import { 
  ShieldCheck, 
  Activity, 
  Database, 
  Zap, 
  Cpu, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  TrendingUp,
  Layers
} from 'lucide-react';

export default function App() {
  const [healthData, setHealthData] = useState(null);
  const [readyData, setReadyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSystemStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, readyRes] = await Promise.allSettled([
        apiClient.get('/health'),
        apiClient.get('/ready')
      ]);

      if (healthRes.status === 'fulfilled') {
        setHealthData(healthRes.value.data);
      } else {
        setHealthData(null);
      }

      if (readyRes.status === 'fulfilled') {
        setReadyData(readyRes.value.data);
      } else {
        setReadyData(readyRes.reason?.response?.data || null);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const isHealthy = healthData?.status === 'ok';
  const isReady = readyData?.status === 'ready';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">RazorRecover</h1>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MOCK_DEMO
              </span>
            </div>
            <p className="text-xs text-slate-400">AI-Powered Merchant Revenue Recovery Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={fetchSystemStatus}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-xs text-slate-200 rounded-md border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">API Status:</span>
            <span className={`inline-flex items-center space-x-1 font-medium ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
              <span>{isHealthy ? 'Online' : 'Offline'}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/50 border border-blue-900/40 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
                <Zap className="w-3 h-3" />
                <span>Phase 0 — Foundation & Infrastructure Active</span>
              </div>
              <h2 className="text-2xl font-bold text-white">System Architecture & Core Readiness</h2>
              <p className="text-sm text-slate-300 max-w-2xl mt-1">
                "AI recommends. Backend policy decides." The LLM acts purely as an advisory intelligence layer, while deterministic business policies enforce strict fintech safety bounds.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <div className="px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-lg">
                <span className="text-slate-400">Stack: </span>
                <span className="text-slate-200">React + Express + BullMQ</span>
              </div>
              <div className="px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-lg">
                <span className="text-slate-400">Storage: </span>
                <span className="text-slate-200">MongoDB + Redis</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Diagnostics & Dependency Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Express API Liveness */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
                <Server className="w-4 h-4 text-blue-400" />
                <span>Backend Liveness Probe</span>
              </div>
              {isHealthy ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <p className="text-xs text-slate-400">Endpoint: <code className="text-blue-300">/api/health</code></p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className={isHealthy ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {healthData?.status?.toUpperCase() || 'UNREACHABLE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Uptime:</span>
                <span className="text-slate-300">{healthData?.uptimeSeconds !== undefined ? `${healthData.uptimeSeconds}s` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trace ID:</span>
                <span className="text-slate-400 truncate max-w-[140px]">{healthData?.correlationId || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* MongoDB Readiness */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>MongoDB Readiness</span>
              </div>
              {readyData?.dependencies?.mongodb?.status === 'healthy' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <p className="text-xs text-slate-400">Connection state & persistence store</p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">State:</span>
                <span className={readyData?.dependencies?.mongodb?.status === 'healthy' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {readyData?.dependencies?.mongodb?.readyState?.toUpperCase() || 'OFFLINE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Database:</span>
                <span className="text-slate-300">{readyData?.dependencies?.mongodb?.name || 'razorrecover'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Host:</span>
                <span className="text-slate-400 truncate max-w-[140px]">{readyData?.dependencies?.mongodb?.host || 'localhost'}</span>
              </div>
            </div>
          </div>

          {/* Redis / Queue Readiness */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-300 font-semibold text-sm">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Redis & BullMQ Engine</span>
              </div>
              {readyData?.dependencies?.redis?.status === 'healthy' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <p className="text-xs text-slate-400">Delayed jobs & operational cache</p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Ping:</span>
                <span className={readyData?.dependencies?.redis?.status === 'healthy' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {readyData?.dependencies?.redis?.status === 'healthy' ? 'PONG' : 'UNREACHABLE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Latency:</span>
                <span className="text-slate-300">
                  {readyData?.dependencies?.redis?.latencyMs !== null && readyData?.dependencies?.redis?.latencyMs !== undefined
                    ? `${readyData.dependencies.redis.latencyMs} ms`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Queue State:</span>
                <span className="text-slate-400">Ready for BullMQ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Phases Roadmap Overview */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">RazorRecover Pipeline Overview</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
              <span className="text-xs font-bold text-blue-400 font-mono">STEP 1</span>
              <h4 className="text-sm font-medium text-slate-200">Webhook Ingestion</h4>
              <p className="text-xs text-slate-400">Raw HMAC-SHA256 signature verification & duplicate idempotency.</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
              <span className="text-xs font-bold text-indigo-400 font-mono">STEP 2</span>
              <h4 className="text-sm font-medium text-slate-200">Hybrid AI Scoring</h4>
              <p className="text-xs text-slate-400">Logistic Regression (probability) + Gemini LLM (recovery strategy).</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
              <span className="text-xs font-bold text-purple-400 font-mono">STEP 3</span>
              <h4 className="text-sm font-medium text-slate-200">Policy Engine</h4>
              <p className="text-xs text-slate-400">Deterministic business rules; routes high-value or low-confidence to humans.</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
              <span className="text-xs font-bold text-emerald-400 font-mono">STEP 4</span>
              <h4 className="text-sm font-medium text-slate-200">Async Safe Execution</h4>
              <p className="text-xs text-slate-400">BullMQ worker executes lock-guarded action and records auditable outcome.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500 bg-slate-900/40 mt-auto">
        RazorRecover — FinTech AI Revenue Recovery Engine &copy; 2026 Santosh Ray
      </footer>
    </div>
  );
}
