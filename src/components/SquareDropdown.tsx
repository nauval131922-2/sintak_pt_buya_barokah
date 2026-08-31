'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import Portal, { getZoomScale } from './Portal';

export interface SquareDropdownOption {
  value: string;
  label: string;
  count?: number;
}

export interface SquareDropdownProps {
  options: SquareDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  widthClass?: string;
  alignRight?: boolean;
  usePortal?: boolean;
}

export default function SquareDropdown({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = 'Cari...',
  widthClass = 'w-48',
  alignRight: propAlignRight,
  usePortal = false,
}: SquareDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [alignRight, setAlignRight] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected ? selected.label : (placeholder || (value ? value : 'Pilih...'));

  const filtered = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // Auto deteksi orientasi / koordinat fixed saat usePortal
  const updateAlignment = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const scale = getZoomScale(triggerRef.current);
    const popupWidth = Math.max(rect.width, 190);
    const spaceRight = window.innerWidth - rect.left;
    const leftWhenAlignRight = rect.right - popupWidth;
    const padding = 12;

    let isRight = false;
    if (propAlignRight !== undefined) {
      isRight = propAlignRight;
    } else if (spaceRight < popupWidth + padding) {
      isRight = leftWhenAlignRight >= padding;
    }
    setAlignRight(isRight);

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const isUpward = spaceBelow < 220 && spaceAbove > spaceBelow;
    setOpenUpward(isUpward);

    if (usePortal) {
      let targetLeft = isRight ? (rect.right - popupWidth) : rect.left;
      const minLeft = padding;
      const maxLeft = Math.max(padding, window.innerWidth - popupWidth - padding);
      const clampedLeft = Math.max(minLeft, Math.min(targetLeft, maxLeft));

      const style: React.CSSProperties = {
        position: 'fixed',
        left: clampedLeft / scale,
        width: `${popupWidth / scale}px`,
        zIndex: 10000,
      };

      if (isUpward) {
        style.bottom = Math.max(10, window.innerHeight - rect.top + 4) / scale;
      } else {
        style.top = (rect.bottom + 4) / scale;
      }

      setPortalStyle(style);
    }
  }, [propAlignRight, usePortal]);

  useEffect(() => {
    if (!open) return;
    updateAlignment();

    const handleScrollOrResize = () => {
      updateAlignment();
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [open, updateAlignment]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t))
        return;
      setOpen(false);
      setSearch('');
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    } else {
      setSearch('');
    }
  }, [open]);

  const isActive = Boolean(selected && value !== 'ALL' && value !== '');

  const dropdownPanel = open && (
    <div
      ref={panelRef}
      style={usePortal ? portalStyle : undefined}
      className={`${
        usePortal
          ? 'fixed'
          : `absolute ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} ${alignRight ? 'right-0' : 'left-0'} w-full min-w-[190px]`
      } bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-[10000] animate-in fade-in slide-in-from-top-1 duration-150`}
    >
      <div className="p-2 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-lg border border-slate-200">
          <Search size={12} className="text-slate-400 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 text-xs font-semibold bg-transparent outline-none text-slate-700 placeholder:text-slate-400 min-w-0"
          />
        </div>
      </div>

      <div className="max-h-52 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
        {filtered.length === 0 ? (
          <p className="px-3 py-3 text-[11px] text-slate-400 font-medium text-center">
            Tidak ditemukan
          </p>
        ) : (
          filtered.map((opt, idx) => (
            <button
              key={`${opt.value}-${idx}`}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
                setSearch('');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${
                value === opt.value
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.count !== undefined && (
                <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">
                  {opt.count}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div ref={triggerRef} className={`relative ${widthClass || 'w-full'} min-w-0`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg focus:outline-none transition-all min-w-0 ${
          isActive
            ? 'bg-emerald-50 border-2 border-emerald-600 text-emerald-800 font-bold shadow-xs shadow-emerald-100'
            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300 font-semibold'
        }`}
      >
        <span className="truncate min-w-0 flex-1 text-left flex items-center gap-1">
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />}
          <span className={`truncate ${!selected ? 'text-slate-400 font-normal' : ''}`}>{displayLabel}</span>
        </span>
        <ChevronDown
          size={13}
          className={`shrink-0 transition-transform duration-150 ${
            isActive ? 'text-emerald-700 font-bold' : 'text-slate-400'
          } ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {usePortal ? <Portal>{dropdownPanel}</Portal> : dropdownPanel}
    </div>
  );
}
