/**
 * frontend/src/components/ui/EmptyState.jsx
 * Standardized empty state container with dual-theme styling.
 */

import React from 'react';
import { Layers } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = Layers,
  title = 'No data available',
  description = 'There are currently no records matching this query.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div
      className={`p-space-12 text-center flex flex-col items-center justify-center space-y-space-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-radius-full bg-theme-elevated flex items-center justify-center text-theme-muted mb-space-2 border border-theme-border-subtle">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-h3 font-semibold text-theme-primary">{title}</h4>
      <p className="text-body-sm text-theme-muted max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="pt-space-2">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
