/**
 * frontend/src/components/ui/Button.jsx
 * Accessible Razorpay-style button component with variants and loading state.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-navy-950 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs md:text-sm px-3.5 py-2 gap-2',
    lg: 'text-sm md:text-base px-5 py-2.5 gap-2.5 font-semibold'
  };

  const variantStyles = {
    primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm focus:ring-brand-500 border border-brand-500/30',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-600',
    outline: 'bg-transparent hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700 focus:ring-slate-600',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm focus:ring-emerald-500 border border-emerald-500/30',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm focus:ring-rose-500 border border-rose-500/30',
    ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 focus:ring-slate-700'
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        Icon && <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
    </button>
  );
}
