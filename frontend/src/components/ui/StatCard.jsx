/**
 * frontend/src/components/ui/StatCard.jsx
 * High-impact KPI widget with strict typographic hierarchy, 2px top accent border,
 * circular 36px icon badge, and light-first palette tokens.
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
      iconBg: 'bg-theme-surface text-ink border border-theme-border-default',
      valueColor: 'text-ink'
    },
    primary: {
      topBorder: 'border-t-ink',
      iconBg: 'bg-mint text-ink border border-theme-border-default',
      valueColor: 'text-ink'
    },
    success: {
      topBorder: 'border-t-semantic-success',
      iconBg: 'bg-semantic-success-bg text-semantic-success border border-semantic-success/40',
      valueColor: 'text-ink'
    },
    warning: {
      topBorder: 'border-t-accent',
      iconBg: 'bg-accent-bg text-accent-hover border border-accent/40',
      valueColor: 'text-ink'
    },
    danger: {
      topBorder: 'border-t-semantic-danger',
      iconBg: 'bg-semantic-danger-bg text-semantic-danger border border-semantic-danger/40',
      valueColor: 'text-ink'
    },
    info: {
      topBorder: 'border-t-mint',
      iconBg: 'bg-mint-bg text-mint border border-mint/60',
      valueColor: 'text-ink'
    },
    muted: {
      topBorder: 'border-t-theme-border-subtle',
      iconBg: 'bg-theme-elevated text-theme-muted border border-theme-border-subtle',
      valueColor: 'text-ink'
    }
  };

  const config = variantConfig[variant] || variantConfig.default;

  return (
    <div
      className={`bg-theme-surface border border-theme-border-subtle border-t-2 ${config.topBorder} rounded-radius-lg p-space-6 shadow-theme-sm transition-all duration-200 hover:shadow-theme-md hover:border-theme-border-default flex flex-col justify-between ${className}`}
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
            className={`text-caption px-space-2 py-0.5 rounded-radius-full font-bold shrink-0 ${
              trendPositive
                ? 'bg-semantic-success-bg text-semantic-success border border-semantic-success/40'
                : 'bg-theme-surface text-ink border border-theme-border-default'
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
