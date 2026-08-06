'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import Portal, { getZoomScale } from '@/components/Portal';

export interface DropdownOption {
  value: string;
  label: string;
  /** Angka opsional yang ditampilkan di kanan label */
  count?: number;
}

interface StatCardDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  /** Warna tema badge & dropdown highlight, default indigo */
  colorClass?: string;
  /** Placeholder input pencarian */
  searchPlaceholder?: string;
  /** Lebar dropdown, default w-44 */
  widthClass?: string;
  loading?: boolean;
}

/**
 * Dropdown searchable di stat card dashboard.
 * Panel via Portal + fixed — tidak terpotong card di bawah (AGENTS: Portal wajib).
 */
export default function StatCardDropdown({
  options,
  value,
  onChange,
  colorClass = 'indigo',
  searchPlaceholder = 'Cari...',
  widthClass = 'w-44',
  loading = false,
}: StatCardDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? options[0]?.label ?? '—';

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Posisi panel fixed di bawah trigger, align kanan
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const scale = getZoomScale();
      setPanelStyle({
        position: 'fixed',
        top: (rect.bottom + 4) / scale,
        right: (window.innerWidth - rect.right) / scale,
        zIndex: 9999,
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  // Tutup saat klik luar — panel di Portal, cek kedua ref
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
      setSearch('');
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  const badgeBase = `flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors border`;
  const badgeColor: Record<string, string> = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100',
    violet: 'text-violet-600 bg-violet-50 border-violet-100 hover:bg-violet-100',
  };

  const activeRowColor: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  const checkColor: Record<string, string> = {
    indigo: 'text-indigo-500',
    emerald: 'text-emerald-500',
    blue: 'text-blue-500',
    violet: 'text-violet-500',
  };

  const badgeCls = badgeColor[colorClass] ?? badgeColor.indigo;
  const activeRow = activeRowColor[colorClass] ?? activeRowColor.indigo;
  const checkCls = checkColor[colorClass] ?? checkColor.indigo;

  return (
    <div
      ref={triggerRef}
      className="relative"
      onClick={(e) => e.preventDefault()}
    >
      <button
        type="button"
        disabled={loading}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`${badgeBase} ${badgeCls} max-w-[120px] truncate disabled:opacity-60`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          size={10}
          className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <Portal>
          <div
            ref={panelRef}
            style={panelStyle}
            className={`${widthClass} bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                <Search size={11} className="text-gray-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={searchPlaceholder}
                  className="flex-1 text-[11px] font-semibold bg-transparent outline-none text-gray-700 placeholder:text-gray-400 min-w-0"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {filtered.length === 0 ? (
                <p className="px-3 py-2.5 text-[11px] text-gray-400 font-medium text-center">
                  Tidak ditemukan
                </p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange(opt.value);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold transition-colors ${
                      value === opt.value ? activeRow : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    <span className="flex items-center gap-1 shrink-0 ml-2">
                      {opt.count !== undefined && (
                        <span className="text-[11px] text-gray-400 font-medium">{opt.count}</span>
                      )}
                      {value === opt.value && <Check size={10} className={checkCls} />}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
