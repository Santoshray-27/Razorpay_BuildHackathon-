/**
 * frontend/src/layouts/DashboardLayout.jsx
 * Primary responsive dashboard navigation shell with header, sidebar, and 1-click failed payment simulator trigger.
 */

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  CheckCircle,
  Cpu
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [simulating, setSimulating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Quick 1-click trigger for a ₹4,999 failed payment demo
  const triggerDemoPayment = async () => {
    setSimulating(true);
    try {
      const paymentId = `pay_demo_${Date.now().toString().slice(-6)}`;
      const res = await apiClient.post('/webhooks/dev-fixture', {
        merchantId: user.merchantId,
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

      setToastMessage(`⚡ ₹4,999 Failed Payment simulated! Case created.`);
      setTimeout(() => setToastMessage(null), 5000);
      navigate('/cases');
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
    { to: '/payments', label: 'All Payments', icon: CreditCard }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">RazorRecover</h1>
            <p className="text-[11px] text-slate-400">Revenue Recovery Engine</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Demo Fast Trigger Button */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs text-blue-400 font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Judge Quick Demo</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Inject a failed ₹4,999 payment event to observe AI + Policy in action.
            </p>
            <button
              onClick={triggerDemoPayment}
              disabled={simulating}
              className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-xs font-semibold text-white rounded-md shadow-sm transition"
            >
              <PlusCircle className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
              <span>Simulate ₹4,999 Failure</span>
            </button>
          </div>

          {/* User Profile */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <div className="truncate">
              <p className="font-semibold text-slate-200 truncate">{user?.name || 'Merchant'}</p>
              <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase font-mono">
                {user?.role?.replace('_', ' ') || 'Admin'}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/80 border-b border-slate-800 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Core Principle: <strong className="text-slate-200">"AI recommends. Backend policy decides."</strong>
            </span>
          </div>

          {/* Badges & Environment Indicator */}
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>EXECUTION MODE: MOCK_DEMO</span>
            </div>

            <div className="hidden lg:inline-flex items-center space-x-1 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              <span>Merchant ID:</span>
              <code className="text-blue-300 font-mono">{user?.merchantId || 'merch_default'}</code>
            </div>
          </div>
        </header>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="bg-blue-600 text-white text-xs font-medium px-4 py-2 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white font-bold">✕</button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
