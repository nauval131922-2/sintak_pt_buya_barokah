'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';

export default function ActivityLogExportMenu({
  onExport,
}: {
  onExport: (includeRawData: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [includeRaw, setIncludeRaw] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-10 px-3 flex items-center gap-1.5 bg-white border border-gray-100 rounded-lg text-[11px] font-bold text-gray-600 hover:border-green-200 hover:text-green-700 shadow-sm"
      >
        <Download size={14} /> Export CSV <ChevronDown size={12} className={open ? 'rotate-180' : ''} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 bg-white border border-gray-100 rounded-xl shadow-lg p-3 animate-in fade-in slide-in-from-top-1">
          <label className="flex items-start gap-2 cursor-pointer text-[11px] text-gray-600 font-medium">
            <input
              type="checkbox"
              checked={includeRaw}
              onChange={(e) => setIncludeRaw(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-green-600"
            />
            <span>Sertakan kolom <code className="text-[10px] bg-gray-100 px-1 rounded">raw_data</code> (file lebih besar)</span>
          </label>
          <button
            type="button"
            onClick={() => {
              onExport(includeRaw);
              setOpen(false);
            }}
            className="mt-3 w-full py-2 bg-green-600 text-white rounded-lg text-[11px] font-bold hover:bg-green-700"
          >
            Unduh CSV
          </button>
        </div>
      )}
    </div>
  );
}
