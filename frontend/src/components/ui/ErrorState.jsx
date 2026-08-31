/**
 * frontend/src/components/ui/ErrorState.jsx
 * Clear error display with message and retry action.
 */

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the recovery server.',
  onRetry,
  className = ''
}) {
  return (
    <div className={`p-6 rounded-xl border border-rose-500/30 bg-rose-950/20 text-center flex flex-col items-center justify-center ${className}`}>
      <div className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl mb-2.5">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-rose-300">{title}</h4>
      <p className="text-xs text-slate-400 max-w-md mt-1 mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button size="sm" variant="outline" icon={RotateCcw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
