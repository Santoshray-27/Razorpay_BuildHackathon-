/**
 * frontend/src/pages/LoginPage.jsx
 * Production-grade FinTech authentication page with Light-First design tokens
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
    <div className="min-h-screen bg-theme-base flex items-center justify-center p-space-4 lg:p-space-8 relative overflow-hidden font-sans">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-space-8 relative z-10 items-center">
        {/* Left Column: Brand & Feature Highlights */}
        <div className="lg:col-span-6 space-y-space-6 text-left">
          <div className="inline-flex items-center space-x-2 px-space-3 py-1 rounded-radius-full bg-palette-accent text-palette-ink text-caption font-bold border border-palette-accent-hover/40 shadow-theme-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Razorpay AI Buildathon 2026</span>
          </div>

          <div className="space-y-space-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-palette-ink text-theme-base rounded-radius-sm shadow-theme-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-h1 font-bold text-theme-primary tracking-tight">RazorRecover</h1>
                <p className="text-caption text-theme-muted font-medium">FinTech Revenue Recovery Engine</p>
              </div>
            </div>
            <p className="text-body text-theme-secondary leading-relaxed">
              Detect failed payments, predict recovery probability, and execute safe, policy-controlled workflows.
            </p>
          </div>

          {/* Highlights list */}
          <div className="space-y-space-3 pt-space-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-start space-x-3 p-space-3 rounded-radius-lg bg-theme-surface border border-theme-border-subtle shadow-theme-sm">
                <div className="p-1 rounded-radius-sm bg-palette-mint text-palette-ink mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-body-sm font-semibold text-theme-primary">{h.title}</h4>
                  <p className="text-caption text-theme-muted leading-relaxed mt-0.5">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-space-2 text-caption text-theme-muted">
            <p className="font-mono">
              Core Rule: <strong className="text-theme-primary">"AI recommends. Backend policy decides."</strong>
            </p>
          </div>
        </div>

        {/* Right Column: Fast Track & Auth Form */}
        <div className="lg:col-span-6 space-y-space-4">
          {/* Judge & Reviewer 1-Click Fast Track Card */}
          <div className="bg-badge-warning-bg border border-palette-accent rounded-radius-lg p-space-6 shadow-theme-md space-y-space-3 relative overflow-hidden">
            <div className="flex items-center space-x-2 text-caption font-bold text-palette-ink">
              <Zap className="w-4 h-4 text-palette-ink" />
              <span>Judge & Evaluator Fast Track</span>
            </div>
            <p className="text-body-sm text-theme-secondary leading-relaxed">
              Sign in immediately as a pre-seeded Merchant Admin with one click.
            </p>
            <Button
              variant="accent"
              size="lg"
              loading={demoLoading}
              icon={ArrowRight}
              onClick={handleDemoSignIn}
              className="w-full text-body font-bold"
            >
              Sign In as Demo Merchant Admin
            </Button>
          </div>

          {/* Form Card */}
          <div className="bg-theme-surface border border-theme-border-subtle rounded-radius-lg p-space-6 shadow-theme-sm space-y-space-4">
            <div className="flex items-center justify-between border-b border-theme-border-subtle pb-space-3">
              <h2 className="text-h3 font-semibold text-theme-primary">
                {isRegister ? 'Create Merchant Account' : 'Merchant Portal Login'}
              </h2>
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(null); }}
                className="text-body-sm text-palette-ink hover:underline font-bold transition"
              >
                {isRegister ? 'Have an account? Log in' : 'Need an account? Register'}
              </button>
            </div>

            {error && (
              <div className="p-space-3 rounded-radius-sm bg-badge-danger-bg border border-badge-danger-text/40 text-badge-danger-text text-body-sm font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-space-4">
              {isRegister && (
                <div>
                  <label className="block text-body-sm font-semibold text-theme-primary mb-space-1">Merchant / Owner Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-theme-muted absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Santosh Ray"
                      className="fintech-input w-full pl-9 text-body-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-body-sm font-semibold text-theme-primary mb-space-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-theme-muted absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@example.com"
                    className="fintech-input w-full pl-9 text-body-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-body-sm font-semibold text-theme-primary mb-space-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-theme-muted absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="fintech-input w-full pl-9 text-body-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full text-body-sm font-bold"
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
