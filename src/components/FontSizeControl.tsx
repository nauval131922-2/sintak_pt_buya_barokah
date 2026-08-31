'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import Portal, { getZoomScale } from './Portal';

export interface FontSizeControlProps {
  value: number;
  onChange: (size: number) => void;
  min?: number;
  max?: number;
  steps?: number[];
  className?: string;
  usePortal?: boolean;
}

const DEFAULT_STEPS = [9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24];

export default function FontSizeControl({
  value,
  onChange,
  min = 9,
  max = 24,
  steps = DEFAULT_STEPS,
  className = '',
  usePortal = false,
}: FontSizeControlProps) {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(String(value));
  const [openUpward, setOpenUpward] = useState(false);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync inputText saat value dari luar berubah
  useEffect(() => {
    setInputText(String(value));
  }, [value]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const scale = getZoomScale(triggerRef.current);
    const popupWidth = 60;
    const popupHeight = 160;
    const padding = 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const isUpward = spaceBelow < popupHeight && spaceAbove > spaceBelow;
    setOpenUpward(isUpward);

    if (usePortal) {
      let targetLeft = rect.left;
      const minLeft = padding;
      const maxLeft = Math.max(padding, window.innerWidth - popupWidth - padding);
      const clampedLeft = Math.max(minLeft, Math.min(targetLeft, maxLeft));

      const style: React.CSSProperties = {
        position: 'fixed',
        left: clampedLeft / scale,
        width: `${popupWidth / scale}px`,
        maxHeight: `${popupHeight / scale}px`,
        zIndex: 10000,
      };

      if (isUpward) {
        style.bottom = Math.max(10, window.innerHeight - rect.top + 4) / scale;
      } else {
        style.top = (rect.bottom + 4) / scale;
      }

      setPortalStyle(style);
    }
  }, [usePortal]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('mousedown', handleOutside, true);
    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('mousedown', handleOutside, true);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open, updatePosition]);

  const handleApplyInput = () => {
    const num = parseInt(inputText, 10);
    if (!isNaN(num)) {
      const clamped = Math.max(min, Math.min(max, num));
      onChange(clamped);
      setInputText(String(clamped));
    } else {
      setInputText(String(value));
    }
  };

  const handleStep = (delta: 1 | -1) => {
    const currentIndex = steps.indexOf(value);
    if (currentIndex !== -1) {
      const nextIndex = currentIndex + delta;
      if (nextIndex >= 0 && nextIndex < steps.length) {
        onChange(steps[nextIndex]);
      }
    } else {
      if (delta === 1) {
        const next = steps.find((s) => s > value);
        if (next) onChange(next);
        else onChange(Math.min(max, value + 1));
      } else {
        const prev = [...steps].reverse().find((s) => s < value);
        if (prev) onChange(prev);
        else onChange(Math.max(min, value - 1));
      }
    }
  };

  return (
    <div
      className={`flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 shrink-0 ${className}`}
      title="Ukuran Font Tabel"
    >
      <span className="text-[11px] font-bold text-slate-500 pl-1 select-none flex items-center gap-0.5">
        <span className="text-slate-400 font-semibold">Teks:</span>
      </span>

      {/* Tombol Step Down */}
      <button
        type="button"
        onClick={() => handleStep(-1)}
        disabled={value <= min}
        className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white hover:bg-slate-100 rounded border border-slate-200 transition-colors shadow-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        title="Perkecil Ukuran Font (-)"
      >
        -
      </button>

      {/* Custom Input + Trigger Dropdown */}
      <div
        ref={triggerRef}
        className={`relative flex items-center bg-white border rounded shadow-xs transition-colors ${
          open
            ? 'border-emerald-500 ring-1 ring-emerald-500'
            : 'border-slate-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
        }`}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => {
            const clean = e.target.value.replace(/\D/g, '');
            setInputText(clean);
          }}
          onBlur={handleApplyInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleApplyInput();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-6 h-5 pl-1 pr-0 text-center text-[11px] font-bold text-slate-700 bg-transparent focus:outline-none"
          title="Ketik angka ukuran font lalu Enter"
        />

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="h-5 px-1 flex items-center justify-center text-slate-400 hover:text-emerald-600 focus:outline-none cursor-pointer border-l border-slate-100"
          title="Pilih Preset Ukuran Font"
        >
          <ChevronDown
            size={11}
            className={`transition-transform duration-150 ${open ? 'rotate-180 text-emerald-600' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown Menu (Relative Absolute atau Portal) */}
      {open && (
        usePortal ? (
          <Portal>
            <div
              ref={dropdownRef}
              style={portalStyle}
              className="bg-white border border-slate-200 rounded-lg shadow-lg py-1 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 select-none text-[11px] font-medium text-slate-700"
            >
              {steps.map((sz) => {
                const isSelected = sz === value;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      onChange(sz);
                      setOpen(false);
                    }}
                    className={`w-full px-2.5 py-1 text-center font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-700 font-extrabold'
                        : 'hover:bg-slate-50 text-slate-700 hover:text-emerald-600'
                    }`}
                  >
                    <span>{sz}px</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Portal>
        ) : (
          <div
            ref={dropdownRef}
            className={`absolute left-0 w-16 max-h-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 overflow-y-auto custom-scrollbar z-50 animate-in fade-in zoom-in-95 duration-100 select-none text-[11px] font-medium text-slate-700 ${
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            }`}
          >
            {steps.map((sz) => {
              const isSelected = sz === value;
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    onChange(sz);
                    setOpen(false);
                  }}
                  className={`w-full px-2 py-1 text-center font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-700 font-extrabold'
                      : 'hover:bg-slate-50 text-slate-700 hover:text-emerald-600'
                  }`}
                >
                  <span>{sz}px</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )
      )}

      {/* Tombol Step Up */}
      <button
        type="button"
        onClick={() => handleStep(1)}
        disabled={value >= max}
        className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white hover:bg-slate-100 rounded border border-slate-200 transition-colors shadow-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        title="Perbesar Ukuran Font (+)"
      >
        +
      </button>
    </div>
  );
}
