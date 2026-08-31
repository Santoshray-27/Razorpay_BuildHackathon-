/**
 * frontend/src/components/ui/Card.jsx
 * Unified Razorpay-styled card component family.
 */

import React from 'react';

export function Card({ className = '', children, hover = false, ...props }) {
  return (
    <div
      className={`bg-surface-card/90 border border-surface-border rounded-xl shadow-card-subtle backdrop-blur-sm transition-all duration-200 ${
        hover ? 'hover:border-slate-700/80 hover:shadow-glow-brand' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`p-5 pb-3 border-b border-surface-border/60 flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3 className={`text-base font-semibold text-white tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={`text-xs text-slate-400 mt-0.5 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div className={`p-4 border-t border-surface-border/60 bg-slate-950/30 rounded-b-xl flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}
