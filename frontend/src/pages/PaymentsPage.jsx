/**
 * frontend/src/pages/PaymentsPage.jsx
 * List of all merchant transactions and payment records with direct links to recovery cases.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CreditCard, Search, ArrowUpRight, RefreshCw, Layers } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/payments');
      setPayments(res.data.data.payments || []);
    } catch (err) {
      console.error('Failed to fetch payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.providerPaymentId || '').toLowerCase().includes(q) ||
      (p.failureReason || '').toLowerCase().includes(q) ||
      (p.status || '').toLowerCase().includes(q) ||
      (p.customerId?.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Merchant Payments</h2>
          <p className="text-xs text-slate-400">
            Raw and normalized transaction records ingested from Razorpay webhooks and simulator.
          </p>
        </div>
        <button
          onClick={fetchPayments}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Payment ID, customer name, status, or failure reason..."
          className="bg-transparent text-xs text-slate-200 w-full focus:outline-none placeholder:text-slate-500"
        />
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-medium">
                <th className="p-4">Payment ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Method</th>
                <th className="p-4">Failure Reason</th>
                <th className="p-4">Mode</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Recovery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.map((p) => {
                const isRecovered = p.status === 'recovered' || p.status === 'captured';
                const isFailed = p.status === 'failed';
                return (
                  <tr key={p._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono text-slate-300">
                      <span className="text-slate-500">#</span>{p.providerPaymentId || p._id.slice(-8)}
                    </td>
                    <td className="p-4 text-slate-200 font-medium">
                      {p.customerId?.name || 'Customer'}
                    </td>
                    <td className="p-4 font-bold font-mono text-slate-100">
                      {formatCurrency(p.amountPaise)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                        isRecovered ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : isFailed ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 uppercase text-slate-400 font-mono text-[10px]">
                      {p.paymentMethod || 'card'}
                    </td>
                    <td className="p-4">
                      <code className="text-slate-400">{p.failureReason || '—'}</code>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {p.executionMode || 'MOCK_DEMO'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {formatDate(p.occurredAt || p.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/cases`}
                        className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Cases</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
