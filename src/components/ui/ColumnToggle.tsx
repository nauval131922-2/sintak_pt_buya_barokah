'use client';

import React, { useEffect, useRef } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import { VisibilityState } from '@tanstack/react-table';

// ponytail: reusable show/hide columns dropdown.
// Controlled: parent owns columnVisibility state, passes columnDefs + setter.
// Closes on outside click.
export function ColumnToggle({
  columns,
  visibility,
  onChange,
}: {
  columns: { id: string; header: string; canHide: boolean }[];
  visibility: VisibilityState;
  onChange: React.Dispatch<React.SetStateAction<VisibilityState>>;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const hiddenCount = columns.filter((c) => c.canHide && visibility[c.id] === false).length;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all list-none select-none cursor-pointer shadow-sm shadow-emerald-900/5"
      >
        <SlidersHorizontal size={14} />
        Kolom
        {hiddenCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 text-[9px] bg-emerald-600 text-white rounded-full">
            {hiddenCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 max-h-72 overflow-auto bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-900/10 p-2 space-y-0.5 z-[60]">
          {columns.filter((c) => c.canHide).map((col) => {
            const visible = visibility[col.id] !== false;
            return (
              <button
                key={col.id}
                onClick={() => onChange((prev) => ({ ...prev, [col.id]: !visible }))}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 text-[12px] font-medium text-gray-700 rounded-lg hover:bg-emerald-50 transition-colors text-left"
              >
                <span className={`flex items-center justify-center w-4 h-4 rounded border ${visible ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 text-transparent'}`}>
                  <Check size={11} />
                </span>
                {col.header}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ColumnToggle;
