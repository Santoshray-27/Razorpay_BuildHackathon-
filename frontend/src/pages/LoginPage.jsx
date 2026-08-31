/**
 * frontend/src/pages/LoginPage.jsx
 * Production-grade FinTech authentication page with Razorpay Buildathon aesthetic
 * and 1-click Demo Merchant Login for evaluators.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ArrowRight,
  Zap,
  Lock,
  Mail,
  User,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function LoginPage() {
  const { login, register, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
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
    setDemoLoading(true);
    setError(null);
    try {
      await demoLogin('merchant_admin');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  const highlights = [
    { title: 'Deterministic Policy Engine', desc: 'Authoritative 15-rule hierarchy with human-in-the-loop gating' },
    { title: 'Explainable Probability Model', desc: 'Trained Logistic Regression with transparent feature driver scoring' },
    { title: 'Google Gemini AI Advisor', desc: 'Strictly advisory recommendations with Zod schema validation' }
  ];

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden font-sans">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-center">
        {/* Left Column: Brand & Feature Highlights */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center space-x-2.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Razorpay AI Buildathon 2026</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-brand-600 to-indigo-700 text-white rounded-2xl shadow-glow-brand">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">RazorRecover</h1>
                <p className="text-xs text-brand-300 font-medium">FinTech Revenue Recovery Engine</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Detect failed payments, predict recovery probability, and execute safe, policy-controlled workflows.
            </p>
          </div>

          {/* Highlights list */}
          <div className="space-y-3 pt-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-surface-card/60 border border-surface-border/60">
                <div className="p-1 rounded bg-brand-500/10 text-brand-400 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{h.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-xs text-slate-400">
            <p className="font-mono text-[11px] text-slate-400">
              Core Rule: <strong className="text-slate-300">"AI recommends. Backend policy decides."</strong>
            </p>
          </div>
        </div>

        {/* Right Column: Fast Track & Auth Form */}
        <div className="lg:col-span-6 space-y-4">
          {/* Judge & Reviewer 1-Click Fast Track Card */}
          <div className="bg-gradient-to-br from-brand-950/90 via-slate-900 to-indigo-950/90 border border-brand-500/30 rounded-2xl p-5 shadow-card-subtle space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-24 h-24 text-brand-400" />
            </div>

            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-300">
              <Zap className="w-4 h-4 text-brand-400" />
              <span>Judge & Evaluator Fast Track</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sign in immediately as a pre-seeded Merchant Admin with one click.
            </p>
            <Button
              variant="primary"
              size="lg"
              loading={demoLoading}
              icon={ArrowRight}
              onClick={handleDemoSignIn}
              className="w-full text-xs md:text-sm font-semibold shadow-glow-brand"
            >
              Sign In as Demo Merchant Admin
            </Button>
          </div>

          {/* Form Card */}
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-card-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
              <h2 className="text-sm font-bold text-white tracking-tight">
                {isRegister ? 'Create Merchant Account' : 'Merchant Portal Login'}
              </h2>
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(null); }}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium transition"
              >
                {isRegister ? 'Have an account? Log in' : 'Need an account? Register'}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Merchant / Owner Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Santosh Ray"
                      className="fintech-input w-full pl-9 text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@example.com"
                    className="fintech-input w-full pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="fintech-input w-full pl-9 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="md"
                loading={loading}
                className="w-full text-xs font-semibold"
              >
                {isRegister ? 'Register Merchant' : 'Sign In with Credentials'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
