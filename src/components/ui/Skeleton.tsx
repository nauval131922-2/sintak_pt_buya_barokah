'use client';

import React from 'react';

// ponytail: reusable shimmer skeleton — replaces Loader2 spinners across tables/pages.
// Pure presentational, no props beyond styling.

export function Skeleton({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

// Table-body skeleton: N rows × given column widths.
export function SkeletonRows({
  rows = 8,
  columns = [40, 120, 160, 200, 120, 100],
  className = '',
}: {
  rows?: number;
  columns?: number[];
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 px-1">
          {columns.map((w, c) => (
            <Skeleton key={c} className="h-4" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Card-shaped skeleton for dashboard tiles.
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className="glass rounded-2xl border border-white/40 p-5 shadow-sm">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}
