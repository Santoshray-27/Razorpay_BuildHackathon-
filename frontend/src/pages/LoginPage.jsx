/**
 * frontend/src/pages/LoginPage.jsx
 * Production-grade FinTech authentication page with Light-First design tokens,
 * immediate /dashboard redirection upon authentication, and 1-click Demo Merchant Login.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ArrowRight,
  Zap,
  Lock,
  Mail,
  User,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function LoginPage() {
  const { user, token, loading: authLoading, login, register, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegister, setIsRegister] = useState(location.pathname === '/register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsRegister(location.pathname === '/register');
  }, [location.pathname]);

  // If already authenticated and not loading, redirect directly to dashboard
  if (token && !authLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || demoLoading) return;
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    if (loading || demoLoading) return;
    setDemoLoading(true);
    setError(null);
    try {
      await demoLogin('merchant_admin');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Demo login failed. Please try again.');
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
              disabled={loading || demoLoading}
              icon={ArrowRight}
              onClick={handleDemoSignIn}
              className="w-full text-body font-bold"
            >
              {demoLoading ? 'Signing In to Dashboard...' : 'Sign In as Demo Merchant Admin'}
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
                onClick={() => {
                  const nextState = !isRegister;
                  setIsRegister(nextState);
                  setError(null);
                  navigate(nextState ? '/register' : '/login', { replace: true });
                }}
                className="text-body-sm text-palette-ink hover:underline font-bold transition"
              >
                {isRegister ? 'Have an account? Log in' : 'Need an account? Register'}
              </button>
            </div>

            {error && (
              <div className="p-space-3 rounded-radius-md bg-badge-danger-bg border border-palette-danger text-badge-danger-text text-body-sm flex items-start space-x-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-badge-danger-text" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-space-4">
              {isRegister && (
                <div>
                  <label className="block text-caption font-semibold text-theme-secondary mb-1">
                    Merchant Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-theme-muted absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="fintech-input w-full pl-10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-caption font-semibold text-theme-secondary mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-theme-muted absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="merchant@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="fintech-input w-full pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-caption font-semibold text-theme-secondary mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-theme-muted absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="fintech-input w-full pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading || demoLoading}
                className="w-full text-body font-bold mt-space-2"
              >
                {loading ? 'Authenticating...' : isRegister ? 'Create Merchant Account' : 'Sign In to Merchant Portal'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
