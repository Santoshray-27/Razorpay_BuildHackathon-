/**
 * frontend/src/components/ui/Badge.jsx
 * Standardized single reusable Badge component adhering to the design system:
 * - Height: 24px
 * - Horizontal padding: space-3 (12px)
 * - Radius: radius-full (pill)
 * - Typography: text-caption with font-weight 600
 */

import React from 'react';

export function Badge({
  children,
  variant = 'default', // 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  dot = false,
  className = ''
}) {
  const variantStyles = {
    default: 'bg-theme-elevated text-theme-secondary border-theme-border-subtle',
    neutral: 'bg-theme-elevated text-theme-secondary border-theme-border-subtle',
    primary: 'bg-brand-subtle-bg text-brand-primary border-brand-primary/20',
    success: 'bg-semantic-success-bg text-semantic-success border-semantic-success/20',
    warning: 'bg-semantic-warning-bg text-semantic-warning border-semantic-warning/20',
    danger: 'bg-semantic-danger-bg text-semantic-danger border-semantic-danger/20',
    info: 'bg-semantic-info-bg text-semantic-info border-semantic-info/20'
  };

  const dotColors = {
    default: 'bg-theme-muted',
    neutral: 'bg-theme-muted',
    primary: 'bg-brand-primary',
    success: 'bg-semantic-success animate-pulse',
    warning: 'bg-semantic-warning',
    danger: 'bg-semantic-danger',
    info: 'bg-semantic-info'
  };

  return (
    <span
      className={`inline-flex items-center h-6 px-space-3 rounded-radius-full border text-caption font-semibold gap-1.5 whitespace-nowrap select-none ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-radius-full shrink-0 ${dotColors[variant] || dotColors.default}`} />}
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
      return <Badge variant="primary" dot>Analyzing</Badge>;
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
      return <Badge variant="danger">High Risk</Badge>;
    case 'medium':
      return <Badge variant="warning">Medium Risk</Badge>;
    case 'low':
    default:
      return <Badge variant="success">Low Risk</Badge>;
  }
}

export function ExecutionModeBadge({ mode }) {
  const m = mode || 'MOCK_DEMO';
  if (m === 'RAZORPAY_TEST') {
    return <Badge variant="success" dot>RAZORPAY_TEST</Badge>;
  }
  if (m === 'SIMULATION') {
    return <Badge variant="info" dot>SIMULATION</Badge>;
  }
  return <Badge variant="warning" dot>MOCK_DEMO</Badge>;
}

export function RoleBadge({ role }) {
  const r = (role || 'merchant_admin').replace('_', ' ').toUpperCase();
  return <Badge variant="neutral">{r}</Badge>;
}

export function AiAdvisoryBadge({ children = 'AI Advisory' }) {
  return <Badge variant="primary">{children}</Badge>;
}
