/**
 * frontend/src/components/ui/StatCard.jsx
 * High-impact KPI Stat widget with iconography, tabular figures, and contextual subtitles.
 */

import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  variant = 'default', // 'default' | 'primary' | 'success' | 'warning' | 'danger'
  className = ''
}) {
  const variantStyles = {
    default: {
      border: 'border-surface-border',
      iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
      valueColor: 'text-white'
    },
    primary: {
      border: 'border-brand-500/30',
      iconBg: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
      valueColor: 'text-white'
    },
    success: {
      border: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      valueColor: 'text-emerald-400'
    },
    warning: {
      border: 'border-amber-500/30',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      valueColor: 'text-amber-400'
    },
    danger: {
      border: 'border-rose-500/30',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      valueColor: 'text-rose-400'
    }
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div className={`bg-surface-card border ${style.border} rounded-xl p-5 shadow-card-subtle transition-all duration-200 hover:border-slate-700 hover:shadow-card-subtle ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${style.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className={`text-2xl lg:text-3xl font-extrabold tracking-tight num-tabular ${style.valueColor}`}>
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
              trendPositive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
