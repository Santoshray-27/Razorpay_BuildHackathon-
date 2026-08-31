/**
 * frontend/src/components/ui/Button.jsx
 * Accessible interactive buttons with semantic theme variants, focus rings, and loading states.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const variantStyles = {
    primary:
      'bg-brand-primary text-white hover:bg-brand-hover border border-transparent shadow-theme-sm focus:ring-2 focus:ring-brand-primary/40 focus:ring-offset-2',
    secondary:
      'bg-transparent border border-theme-border-default text-theme-secondary hover:bg-theme-elevated hover:text-theme-primary focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-2',
    outline:
      'bg-theme-surface border border-theme-border-subtle text-theme-primary hover:bg-theme-elevated hover:border-theme-border-default focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-2',
    danger:
      'bg-transparent border border-semantic-danger/30 text-semantic-danger hover:bg-semantic-danger-bg focus:ring-2 focus:ring-semantic-danger/40 focus:ring-offset-2',
    success:
      'bg-semantic-success text-white hover:opacity-90 border border-transparent shadow-theme-sm focus:ring-2 focus:ring-semantic-success/40 focus:ring-offset-2',
    ghost:
      'bg-transparent text-theme-secondary hover:bg-theme-elevated hover:text-theme-primary border border-transparent focus:ring-2 focus:ring-brand-primary/20'
  };

  const sizeStyles = {
    sm: 'min-h-[32px] px-space-3 text-caption font-semibold rounded-radius-sm gap-1.5',
    md: 'min-h-[40px] px-space-4 text-body font-semibold rounded-radius-md gap-2',
    lg: 'min-h-[44px] px-space-6 text-h3 font-semibold rounded-radius-md gap-2.5'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-sans tracking-normal select-none transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${
        sizeStyles[size] || sizeStyles.md
      } ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />
      )}

      {children && <span className="truncate">{children}</span>}

      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}
