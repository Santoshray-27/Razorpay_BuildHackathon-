/**
 * frontend/src/components/ui/Skeleton.jsx
 * Shimmering loading placeholder components.
 */

import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-800/80 rounded-lg ${className}`} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex space-x-4 border-b border-slate-800 pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex space-x-4 py-2.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
