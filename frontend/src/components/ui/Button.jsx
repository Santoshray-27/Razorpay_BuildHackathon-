/**
 * frontend/src/components/ui/Button.jsx
 * Accessible interactive buttons with strict 3-tier hierarchy, focus rings, and loading states:
 * - Primary:   #222831 (ink fill, light text)
 * - Secondary: #CDF0EA (mint fill, ink text)
 * - Accent:    #FCE38A (accent fill, ink text)
 * - Success:   #DDFFBC (success fill, ink text)
 * - Outline:   #FFFFFF fill, #DBE2EF border, ink text
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'accent' | 'outline' | 'success' | 'danger' | 'ghost'
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
      'bg-ink text-theme-base hover:bg-brand-hover border border-transparent shadow-theme-sm focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2',
    secondary:
      'bg-theme-surface text-ink hover:bg-theme-elevated border border-theme-border-default shadow-theme-sm focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2',
    accent:
      'bg-accent text-ink hover:bg-accent-hover border border-transparent shadow-theme-sm focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 font-bold',
    outline:
      'bg-transparent border border-theme-border-default text-theme-primary hover:bg-theme-elevated hover:border-theme-border-default focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2',
    success:
      'bg-semantic-success-bg text-semantic-success hover:bg-semantic-success hover:text-white border border-semantic-success/40 shadow-theme-sm focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 font-semibold transition-colors',
    danger:
      'bg-semantic-danger-bg border border-semantic-danger/40 text-semantic-danger hover:bg-semantic-danger hover:text-white focus-visible:ring-2 focus-visible:ring-semantic-danger/40 focus-visible:ring-offset-2 font-semibold transition-colors',
    ghost:
      'bg-transparent text-theme-secondary hover:bg-theme-elevated hover:text-theme-primary border border-transparent focus-visible:ring-2 focus-visible:ring-ink/20'
  };

  const sizeStyles = {
    sm: 'min-h-[32px] px-space-3 text-caption font-semibold rounded-radius-sm gap-1.5',
    md: 'min-h-[40px] px-space-4 text-body font-semibold rounded-radius-md gap-2',
    lg: 'min-h-[44px] px-space-6 text-h3 font-semibold rounded-radius-lg gap-2.5'
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
