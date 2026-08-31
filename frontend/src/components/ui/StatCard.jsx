/**
 * frontend/src/components/ui/StatCard.jsx
 * High-impact KPI widget with strict typographic hierarchy, 2px top accent border,
 * circular 36px icon badge, and dual-theme tokens.
 */

import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  variant = 'default', // 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
  className = ''
}) {
  const variantConfig = {
    default: {
      topBorder: 'border-t-theme-border-default',
      iconBg: 'bg-theme-elevated text-theme-secondary',
      valueColor: 'text-theme-primary'
    },
    primary: {
      topBorder: 'border-t-brand-primary',
      iconBg: 'bg-brand-subtle-bg text-brand-primary',
      valueColor: 'text-theme-primary'
    },
    success: {
      topBorder: 'border-t-semantic-success',
      iconBg: 'bg-semantic-success-bg text-semantic-success',
      valueColor: 'text-theme-primary'
    },
    warning: {
      topBorder: 'border-t-semantic-warning',
      iconBg: 'bg-semantic-warning-bg text-semantic-warning',
      valueColor: 'text-theme-primary'
    },
    danger: {
      topBorder: 'border-t-semantic-danger',
      iconBg: 'bg-semantic-danger-bg text-semantic-danger',
      valueColor: 'text-theme-primary'
    },
    info: {
      topBorder: 'border-t-semantic-info',
      iconBg: 'bg-semantic-info-bg text-semantic-info',
      valueColor: 'text-theme-primary'
    },
    muted: {
      topBorder: 'border-t-theme-border-subtle',
      iconBg: 'bg-theme-elevated text-theme-muted',
      valueColor: 'text-theme-primary'
    }
  };

  const config = variantConfig[variant] || variantConfig.default;

  return (
    <div
      className={`bg-theme-surface border border-theme-border-subtle border-t-2 ${config.topBorder} rounded-radius-md p-space-6 shadow-theme-sm transition-all duration-200 hover:shadow-theme-md hover:border-theme-border-default flex flex-col justify-between ${className}`}
    >
      {/* Top row: Label + 36px Circular Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-label text-theme-muted tracking-[0.06em] select-none truncate">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 min-w-[36px] rounded-radius-full flex items-center justify-center shrink-0 ${config.iconBg}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Middle row: Hero Value (text-display) */}
      <div className="mt-space-2 flex items-baseline justify-between gap-2">
        <span className={`text-display tracking-tight num-tabular truncate ${config.valueColor}`}>
          {value}
        </span>
        {trend && (
          <span
            className={`text-caption px-space-2 py-0.5 rounded-radius-full font-semibold shrink-0 ${
              trendPositive
                ? 'bg-semantic-success-bg text-semantic-success border border-semantic-success/20'
                : 'bg-theme-elevated text-theme-secondary border border-theme-border-subtle'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {/* Bottom row: Subtitle */}
      {subtitle && (
        <p className="mt-space-2 text-body-sm text-theme-secondary flex items-center gap-1.5 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
