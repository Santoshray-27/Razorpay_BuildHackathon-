/**
 * frontend/src/components/ui/Badge.jsx
 * Standardized semantic badges for Status, Risk Level, Execution Mode, and Policy Decisions.
 */

import React from 'react';

export function Badge({
  children,
  variant = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'slate'
  size = 'md', // 'sm' | 'md'
  dot = false,
  className = ''
}) {
  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    info: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    purple: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    slate: 'bg-slate-900 text-slate-400 border-slate-800'
  };

  const dotColors = {
    default: 'bg-slate-400',
    info: 'bg-brand-400',
    success: 'bg-emerald-400 animate-pulse',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    purple: 'bg-indigo-400',
    slate: 'bg-slate-500'
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || dotColors.default}`} />}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();

  switch (normalized) {
    case 'recovered':
      return <Badge variant="success" dot>Recovered</Badge>;
    case 'approved':
      return <Badge variant="success">Approved</Badge>;
    case 'recommended':
      return <Badge variant="info">Recommended</Badge>;
    case 'analyzing':
      return <Badge variant="purple" dot>Analyzing</Badge>;
    case 'pending_approval':
      return <Badge variant="warning" dot>Pending Review</Badge>;
    case 'scheduled':
      return <Badge variant="info" dot>Scheduled</Badge>;
    case 'executing':
      return <Badge variant="warning" dot>Executing</Badge>;
    case 'failed':
      return <Badge variant="danger">Failed</Badge>;
    case 'stopped':
      return <Badge variant="danger">Stopped</Badge>;
    case 'detected':
    default:
      return <Badge variant="default" dot>Detected</Badge>;
  }
}

export function RiskBadge({ riskLevel }) {
  const normalized = (riskLevel || '').toLowerCase();

  switch (normalized) {
    case 'high':
      return <Badge variant="danger" size="sm">High Risk</Badge>;
    case 'medium':
      return <Badge variant="warning" size="sm">Medium Risk</Badge>;
    case 'low':
    default:
      return <Badge variant="success" size="sm">Low Risk</Badge>;
  }
}

export function ExecutionModeBadge({ mode }) {
  const m = mode || 'MOCK_DEMO';
  if (m === 'RAZORPAY_TEST') {
    return <Badge variant="info" size="sm" dot>RAZORPAY_TEST</Badge>;
  }
  if (m === 'SIMULATION') {
    return <Badge variant="purple" size="sm" dot>SIMULATION</Badge>;
  }
  return <Badge variant="success" size="sm" dot>MOCK_DEMO</Badge>;
}
