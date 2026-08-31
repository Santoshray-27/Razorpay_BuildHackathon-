/**
 * frontend/src/layouts/DashboardLayout.jsx
 * Production-grade FinTech navigation shell with responsive drawer, top bar,
 * execution mode indicator, and 1-click failed payment demo simulator.
 */

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import {
  ShieldCheck,
  LayoutDashboard,
  CreditCard,
  Layers,
  UserCheck,
  LogOut,
  PlusCircle,
  Sparkles,
  Zap,
  BarChart3,
  Menu,
  X,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [simulating, setSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick 1-click trigger for a ₹4,999 failed payment demo
  const triggerDemoPayment = async () => {
    setSimulating(true);
    try {
      const paymentId = `pay_demo_${Date.now().toString().slice(-6)}`;
      await apiClient.post('/webhooks/dev-fixture', {
        merchantId: user?.merchantId || 'merch_demo_admin',
        payment_id: paymentId,
        amount: 499900, // ₹4,999 in paise
        currency: 'INR',
        status: 'failed',
        failure_reason: 'insufficient_funds',
        payment_method: 'card',
        execution_mode: 'MOCK_DEMO',
        customer_name: 'Rahul Sharma',
        customer_email: 'rahul.sharma@example.com',
        customer_phone: '+919876543210'
      });

      setToastMessage(`⚡ Ingested ₹4,999 Failed Payment via Webhook. Created Case in DETECTED state.`);
      setTimeout(() => setToastMessage(null), 6000);
      navigate('/cases');
      setMobileMenuOpen(false);
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/cases', label: 'Recovery Cases', icon: Layers },
    { to: '/review-queue', label: 'Human Review Queue', icon: UserCheck },
    { to: '/payments', label: 'All Payments', icon: CreditCard },
    { to: '/simulator', label: 'Simulation & Benchmark', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-surface-card border-b border-surface-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-white tracking-tight">RazorRecover</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-surface-card/95 border-r border-surface-border flex flex-col shrink-0 z-50 transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-surface-border/60 flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-brand-600 to-indigo-700 text-white rounded-xl shadow-glow-brand">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              RazorRecover
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono">v1.1</span>
            </h1>
            <p className="text-[11px] text-slate-400">Revenue Recovery Engine</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3.5 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-400/80" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Judge Quick Demo Action Card */}
        <div className="p-3.5 border-t border-surface-border/60 space-y-3">
          <div className="bg-navy-950/80 p-3.5 rounded-xl border border-surface-border space-y-2">
            <div className="flex items-center space-x-1.5 text-xs text-brand-400 font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Judge Quick Demo</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Inject a failed ₹4,999 payment event to evaluate AI + Policy recovery.
            </p>
            <Button
              size="sm"
              variant="primary"
              loading={simulating}
              icon={PlusCircle}
              onClick={triggerDemoPayment}
              className="w-full text-xs"
            >
              Simulate ₹4,999 Failure
            </Button>
          </div>

          {/* User Profile Footer */}
          <div className="pt-1 flex items-center justify-between text-xs">
            <div className="truncate">
              <p className="font-semibold text-slate-200 truncate">{user?.name || 'Merchant Owner'}</p>
              <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase font-mono">
                {user?.role?.replace('_', ' ') || 'Admin'}
              </span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-surface-card/80 border-b border-surface-border backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400 hidden lg:inline">
              Core Principle: <strong className="text-slate-200">"AI recommends. Backend policy decides."</strong>
            </span>
          </div>

          {/* Badges & Environment Indicators */}
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>EXECUTION MODE: MOCK_DEMO</span>
            </div>

            <div className="hidden sm:inline-flex items-center space-x-1.5 text-xs text-slate-400 bg-navy-950/80 px-2.5 py-1 rounded-lg border border-surface-border">
              <span>Merchant:</span>
              <code className="text-brand-300 font-mono font-semibold">{user?.merchantId || 'merch_demo'}</code>
            </div>
          </div>
        </header>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-medium px-5 py-2.5 flex items-center justify-between animate-fade-in shadow-md">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/80 hover:text-white font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
