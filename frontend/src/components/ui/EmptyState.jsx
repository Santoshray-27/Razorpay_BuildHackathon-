/**
 * frontend/src/components/ui/EmptyState.jsx
 * Friendly empty state display with icon and call-to-action button.
 */

import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no active items to display in this view.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`py-12 px-6 flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-slate-800 bg-surface-card/40 ${className}`}>
      <div className="p-3 bg-slate-800/80 text-slate-400 border border-slate-700/60 rounded-xl mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-white tracking-tight">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
