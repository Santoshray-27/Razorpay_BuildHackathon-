/**
 * frontend/src/components/ui/Card.jsx
 * Standardized Card container component family with theme tokens and subtle elevation.
 */

import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-theme-surface border border-theme-border-subtle rounded-radius-md shadow-theme-sm transition-colors duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`p-space-6 border-b border-theme-border-subtle flex items-center justify-between gap-space-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-h3 text-theme-primary font-semibold tracking-normal ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-body-sm text-theme-muted mt-1 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-space-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`p-space-6 border-t border-theme-border-subtle bg-theme-elevated/40 flex items-center justify-between gap-space-4 rounded-b-radius-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
