/**
 * frontend/src/pages/LoginPage.jsx
 * Authentication page featuring 1-click Demo Merchant Login helper.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, Zap, Lock, Mail, User } from 'lucide-react';

export default function LoginPage() {
  const { login, register, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin('merchant_admin');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-slate-950 to-indigo-950/20 pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl mb-1 shadow-lg shadow-blue-950/50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">RazorRecover</h1>
          <p className="text-sm text-slate-400">
            AI-Assisted, Policy-Controlled Revenue Recovery Platform
          </p>
        </div>

        {/* Demo Fast Login Banner */}
        <div className="bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border border-blue-800/50 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-300">
            <Zap className="w-4 h-4 text-blue-400" />
            <span>Judge & Reviewer Fast Track</span>
          </div>
          <p className="text-xs text-slate-300">
            Skip manual sign-up with pre-seeded merchant credentials.
          </p>
          <button
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-xs font-semibold text-white rounded-lg transition shadow-md shadow-blue-900/30"
          >
            <span>⚡ Sign in as Demo Merchant Admin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-200">
              {isRegister ? 'Create Merchant Account' : 'Merchant Portal Login'}
            </h2>
            <button
              onClick={() => { setIsRegister(!isRegister); setError(null); }}
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              {isRegister ? 'Already registered? Login' : 'Need an account? Register'}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Merchant / Owner Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Santosh Ray"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg transition active:scale-[0.99]"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Register Merchant' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          RazorRecover FinTech Platform &bull; Santosh Ray &copy; 2026
        </p>
      </div>
    </div>
  );
}
