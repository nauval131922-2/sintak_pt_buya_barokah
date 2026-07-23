'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { ActivityLogSortField } from '@/lib/activity-log-query';

export function SortHeader({ label, field, colIdx, sortBy, sortDir, onSort, onCtx, onResize }: {
  label: string; 
  field: ActivityLogSortField; 
  colIdx: number;
  sortBy: ActivityLogSortField; 
  sortDir: 'asc' | 'desc';
  onSort: (f: ActivityLogSortField) => void;
  onCtx: (i: number, e: React.MouseEvent) => void;
  onResize: (i: number, e: React.MouseEvent) => void;
}) {
  const active = sortBy === field;
  return (
    <th className="px-4 py-3 relative border-r border-gray-200" onContextMenu={(e) => onCtx(colIdx, e)}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-emerald-700 transition-colors ${active ? 'text-emerald-700' : ''}`}
      >
        {label}
        {active ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronDown size={12} className="opacity-30" />}
      </button>
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-20"
        onMouseDown={(e) => onResize(colIdx, e)}
        title="Drag untuk resize kolom"
      />
    </th>
  );
}
