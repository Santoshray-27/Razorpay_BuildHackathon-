/**
 * frontend/src/pages/PaymentsPage.jsx
 * Unified transaction ledger with Light-First design tokens, search, and execution mode tags.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CreditCard, Search, RefreshCw, Layers } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { StatusBadge, ExecutionModeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/payments');
      setPayments(res.data.data.payments || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch payments.');
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
    <div className="space-y-space-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-4">
        <div>
          <h2 className="text-h1 text-theme-primary tracking-tight">Merchant Payments</h2>
          <p className="text-body-sm text-theme-muted mt-1">
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
      <Card className="p-space-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-theme-muted absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Payment ID, customer name, status, or failure reason..."
            className="fintech-input w-full pl-9 text-body-sm"
          />
        </div>
      </Card>

      {error && payments.length === 0 && (
        <ErrorState
          title="Failed to Load Payments"
          message={error}
          onRetry={fetchPayments}
        />
      )}

      {/* Payments Table Card */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} cols={8} />
          ) : (
            <table className="w-full text-left">
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
              <tbody className="divide-y divide-theme-border-subtle">
                {filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-theme-surface/50 transition-colors">
                    <td className="fintech-table-td font-mono font-semibold text-theme-primary">
                      <span className="text-theme-muted">#</span>{p.providerPaymentId || p._id.slice(-8)}
                    </td>
                    <td className="fintech-table-td font-medium text-theme-primary">
                      {p.customerId?.name || 'Rahul Sharma'}
                    </td>
                    <td className="fintech-table-td font-bold font-mono text-theme-primary num-tabular">
                      {formatCurrency(p.amountPaise)}
                    </td>
                    <td className="fintech-table-td">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="fintech-table-td uppercase text-theme-secondary font-mono text-caption">
                      {p.paymentMethod || 'card'}
                    </td>
                    <td className="fintech-table-td font-mono text-caption text-theme-secondary">
                      {p.failureReason || '—'}
                    </td>
                    <td className="fintech-table-td">
                      <ExecutionModeBadge mode={p.executionMode} />
                    </td>
                    <td className="fintech-table-td text-theme-muted text-caption font-mono">
                      {formatDate(p.occurredAt || p.createdAt)}
                    </td>
                    <td className="fintech-table-td text-right">
                      <Link
                        to="/cases"
                        className="inline-flex items-center space-x-1 text-body-sm text-palette-ink font-bold hover:underline"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Cases</span>
                      </Link>
                    </td>
                  </tr>
                ))}
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
