/**
 * frontend/src/components/ui/Skeleton.jsx
 * Shimmer pulse placeholder for loading states with dual-theme adaptation.
 */

import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-theme-elevated rounded-radius-md ${className}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-theme-surface border border-theme-border-subtle rounded-radius-md p-space-6 shadow-theme-sm space-y-space-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-9 w-9 rounded-radius-full" />
      </div>
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="w-full space-y-space-3 p-space-4">
      <div className="flex space-x-space-4 pb-space-2 border-b border-theme-border-subtle">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex space-x-space-4 py-space-2 border-b border-theme-border-subtle/50">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
