/**
 * frontend/src/layouts/DashboardLayout.jsx
 * Unified FinTech dashboard navigation shell with dual-theme toggle, active 3px accent bars,
 * responsive mobile drawer, and 1-click failed payment simulation.
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
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ExecutionModeBadge, RoleBadge } from '../components/ui/Badge';

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
    <div className="min-h-screen bg-theme-base text-theme-primary flex flex-col md:flex-row font-sans transition-colors duration-200">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-theme-surface border-b border-theme-border-subtle px-space-4 py-space-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-brand-subtle-bg text-brand-primary border border-brand-primary/20 rounded-radius-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-theme-primary text-h3 tracking-tight">RazorRecover</span>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-theme-secondary hover:text-theme-primary rounded-radius-md bg-theme-elevated border border-theme-border-subtle"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-theme-surface border-r border-theme-border-subtle flex flex-col shrink-0 z-50 transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-space-6 border-b border-theme-border-subtle flex items-center space-x-3">
          <div className="p-2 bg-brand-primary text-white rounded-radius-md shadow-theme-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-h3 font-bold text-theme-primary tracking-tight flex items-center gap-1.5">
              RazorRecover
              <span className="text-caption px-1.5 py-0.2 rounded-radius-full bg-brand-subtle-bg text-brand-primary border border-brand-primary/20 font-mono">
                v1.1
              </span>
            </h1>
            <p className="text-caption text-theme-muted">Revenue Recovery Engine</p>
          </div>
        </div>

        {/* Navigation Links with 3px left accent bar for active link */}
        <nav className="p-space-3 space-y-1 flex-1 overflow-y-auto">
          <div className="px-space-3 py-space-2 text-label text-theme-muted tracking-[0.06em]">
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
                className={`relative flex items-center justify-between px-space-4 py-2.5 rounded-radius-md text-body-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-theme-elevated text-theme-primary font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-brand-primary before:rounded-r'
                    : 'text-theme-secondary hover:bg-theme-elevated/60 hover:text-theme-primary'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-brand-primary' : 'text-theme-secondary'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-primary/80" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Judge Quick Demo Action Card */}
        <div className="p-space-4 border-t border-theme-border-subtle space-y-space-3">
          <div className="bg-theme-elevated/60 p-space-4 rounded-radius-md border border-theme-border-subtle space-y-space-2">
            <div className="flex items-center space-x-1.5 text-caption font-semibold text-brand-primary">
              <Zap className="w-3.5 h-3.5" />
              <span>Judge Quick Demo</span>
            </div>
            <p className="text-caption text-theme-secondary leading-relaxed">
              Inject a failed ₹4,999 payment event to evaluate AI + Policy recovery.
            </p>
            <Button
              size="sm"
              variant="primary"
              loading={simulating}
              icon={PlusCircle}
              onClick={triggerDemoPayment}
              className="w-full text-caption"
            >
              Simulate ₹4,999 Failure
            </Button>
          </div>

          {/* User Profile Footer */}
          <div className="pt-space-1 flex items-center justify-between">
            <div className="truncate space-y-1">
              <p className="text-body-sm font-semibold text-theme-primary truncate">{user?.name || 'Merchant Admin'}</p>
              <RoleBadge role={user?.role} />
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-theme-muted hover:text-semantic-danger hover:bg-theme-elevated rounded-radius-md transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-theme-surface/80 border-b border-theme-border-subtle backdrop-blur-md px-space-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <span className="text-caption text-theme-muted hidden lg:inline">
              Core Principle: <strong className="text-theme-primary">"AI recommends. Backend policy decides."</strong>
            </span>
          </div>

          {/* Controls: Execution Mode Badge + Theme Toggle */}
          <div className="flex items-center space-x-3">
            <ExecutionModeBadge mode="MOCK_DEMO" />

            <div className="hidden sm:inline-flex items-center space-x-1.5 text-caption text-theme-muted bg-theme-elevated px-space-3 py-1 rounded-radius-md border border-theme-border-subtle font-mono">
              <span>Merchant:</span>
              <span className="text-theme-primary font-semibold">{user?.merchantId || 'merch_demo'}</span>
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="bg-brand-primary text-white text-body-sm font-medium px-space-6 py-space-3 flex items-center justify-between animate-fade-in shadow-theme-md">
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
        <main className="flex-1 p-space-4 md:p-space-6 lg:p-space-8 max-w-7xl w-full mx-auto space-y-space-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
