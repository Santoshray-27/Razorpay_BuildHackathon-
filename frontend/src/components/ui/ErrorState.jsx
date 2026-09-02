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
    <div className={`p-space-6 rounded-radius-lg border border-badge-danger-text/30 bg-badge-danger-bg text-center flex flex-col items-center justify-center ${className}`}>
      <div className="p-2.5 bg-badge-danger-text/10 text-badge-danger-text border border-badge-danger-text/20 rounded-radius-md mb-2.5">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h4 className="text-body-sm font-semibold text-badge-danger-text">{title}</h4>
      <p className="text-caption text-theme-secondary max-w-md mt-1 mb-4 leading-relaxed">
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
