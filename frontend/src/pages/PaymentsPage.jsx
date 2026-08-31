/**
 * frontend/src/pages/PaymentsPage.jsx
 * Unified transaction ledger with search, currency formatting, and execution mode tags.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CreditCard, Search, ArrowUpRight, RefreshCw, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { StatusBadge, ExecutionModeBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Merchant Payments</h2>
          <p className="text-xs text-slate-400">
            Raw and normalized transaction records ingested from Razorpay webhooks and simulation engine.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={RefreshCw}
          loading={loading}
          onClick={fetchPayments}
        >
          Refresh
        </Button>
      </div>

      {/* Search Bar Card */}
      <Card className="p-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Payment ID, customer name, status, or failure reason..."
            className="fintech-input w-full pl-9 text-xs"
          />
        </div>
      </Card>

      {/* Payments Table Card */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={8} />
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th className="fintech-table-th">Payment ID</th>
                  <th className="fintech-table-th">Customer</th>
                  <th className="fintech-table-th">Amount</th>
                  <th className="fintech-table-th">Status</th>
                  <th className="fintech-table-th">Method</th>
                  <th className="fintech-table-th">Failure Reason</th>
                  <th className="fintech-table-th">Mode</th>
                  <th className="fintech-table-th">Date</th>
                  <th className="fintech-table-th text-right">Recovery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {filteredPayments.map((p) => {
                  const isRecovered = p.status === 'recovered' || p.status === 'captured';
                  const isFailed = p.status === 'failed';
                  return (
                    <tr key={p._id} className="hover:bg-slate-800/40 transition">
                      <td className="fintech-table-td font-mono font-semibold text-slate-300">
                        <span className="text-slate-500">#</span>{p.providerPaymentId || p._id.slice(-8)}
                      </td>
                      <td className="fintech-table-td font-medium text-slate-200">
                        {p.customerId?.name || 'Rahul Sharma'}
                      </td>
                      <td className="fintech-table-td font-bold font-mono text-white num-tabular">
                        {formatCurrency(p.amountPaise)}
                      </td>
                      <td className="fintech-table-td">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="fintech-table-td uppercase text-slate-400 font-mono text-[10px]">
                        {p.paymentMethod || 'card'}
                      </td>
                      <td className="fintech-table-td font-mono text-[11px] text-slate-400">
                        {p.failureReason || '—'}
                      </td>
                      <td className="fintech-table-td">
                        <ExecutionModeBadge mode={p.executionMode} />
                      </td>
                      <td className="fintech-table-td text-slate-400 text-[11px] font-mono">
                        {formatDate(p.occurredAt || p.createdAt)}
                      </td>
                      <td className="fintech-table-td text-right">
                        <Link
                          to={`/cases`}
                          className="inline-flex items-center space-x-1 text-xs text-brand-400 hover:text-brand-300 font-semibold"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Cases</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && filteredPayments.length === 0 && (
            <EmptyState
              icon={CreditCard}
              title="No payment records found"
              description="No transaction records match your search query."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
