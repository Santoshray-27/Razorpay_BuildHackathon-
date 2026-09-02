/**
 * frontend/src/components/ui/Badge.jsx
 * Standardized single reusable Badge component adhering to the design system:
 * - Height: 24px
 * - Horizontal padding: space-3 (12px)
 * - Radius: radius-full (pill)
 * - Typography: text-caption with font-weight 600
 * - High contrast: #222831 ink text on light badge fills
 */

import React from 'react';

export function Badge({
  children,
  variant = 'default', // 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  dot = false,
  className = ''
}) {
  const variantStyles = {
    default: 'bg-palette-surface text-theme-primary border-palette-surface-alt',
    neutral: 'bg-theme-elevated text-theme-primary border-theme-border-subtle',
    primary: 'bg-palette-surface text-theme-primary border-palette-surface-alt font-bold',
    success: 'bg-badge-success-bg text-badge-success-text border-palette-success/40',
    warning: 'bg-badge-warning-bg text-badge-warning-text border-palette-accent/40',
    danger: 'bg-badge-danger-bg text-badge-danger-text border-palette-danger/40',
    info: 'bg-badge-info-bg text-badge-info-text border-palette-mint/60'
  };

  const dotColors = {
    default: 'bg-palette-ink',
    neutral: 'bg-palette-ink',
    primary: 'bg-palette-ink',
    success: 'bg-[#2D8A4E] animate-pulse',
    warning: 'bg-[#B8860B]',
    danger: 'bg-palette-danger',
    info: 'bg-[#1D4ED8]'
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
      return <Badge variant="warning" dot>Analyzing</Badge>;
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
  return <Badge variant="info">{children}</Badge>;
}
