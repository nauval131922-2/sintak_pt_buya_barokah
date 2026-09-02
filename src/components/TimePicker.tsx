'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, X } from 'lucide-react';
import Portal, { getZoomScale } from './Portal';

interface TimePickerProps {
  name?: string;
  value?: string; // Format 'HH:mm' misal '08:30'
  onChange?: (val: string) => void;
  placeholder?: string;
  popupAlign?: 'left' | 'right';
  usePortal?: boolean;
  customTrigger?: (toggle: () => void) => React.ReactNode;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export default function TimePicker({
  name,
  value = '',
  onChange,
  placeholder = 'Pilih jam',
  popupAlign = 'left',
  usePortal = false,
  customTrigger,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});
  const [alignOffset, setAlignOffset] = useState<number>(0);

  const triggerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Parse current hour & minute
  const [hour, minute] = (value || '').split(':');
  const selectedHour = hour || '';
  const selectedMinute = minute || '';

  const updateAlignment = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const scale = getZoomScale(triggerRef.current);
    const popupWidth = 210;
    const padding = 8;

    if (usePortal) {
      const minLeft = padding;
      const maxLeft = Math.max(padding, window.innerWidth - popupWidth - padding);
      let targetLeft = rect.left;
      if (popupAlign === 'right') {
        targetLeft = rect.right - popupWidth;
      }
      const clampedLeft = Math.max(minLeft, Math.min(targetLeft, maxLeft));

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const isUpward = spaceBelow < 260 && spaceAbove > spaceBelow;
      setOpenUpward(isUpward);

      const style: React.CSSProperties = {
        position: 'fixed',
        left: clampedLeft / scale,
        zIndex: 10000,
      };

      if (isUpward) {
        style.bottom = Math.max(10, window.innerHeight - rect.top + 4) / scale;
      } else {
        style.top = (rect.bottom + 4) / scale;
      }

      setPortalStyle(style);
    } else {
      // Non-portal relative positioning: auto-clamp agar tidak terpotong tepi layar kanan/kiri
      let leftEdge = 0;
      let rightEdge = window.innerWidth;

      let container = triggerRef.current.parentElement;
      while (container && container !== document.body) {
        const style = getComputedStyle(container);
        const overflow = (style.overflow || '') + (style.overflowX || '') + (style.overflowY || '');
        if (overflow.includes('hidden') || overflow.includes('auto') || overflow.includes('scroll')) {
          const containerRect = container.getBoundingClientRect();
          leftEdge = Math.max(leftEdge, containerRect.left);
          rightEdge = Math.min(rightEdge, containerRect.right);
          break;
        }
        container = container.parentElement;
      }

      const availableLeft = Math.max(padding, leftEdge + padding);
      const availableRight = Math.min(window.innerWidth - padding, rightEdge - padding);

      let idealPopupLeft = rect.left;
      if (popupAlign === 'right') {
        idealPopupLeft = rect.right - popupWidth;
      }

      let shift = 0;
      if (idealPopupLeft + popupWidth > availableRight) {
        shift = availableRight - (idealPopupLeft + popupWidth);
      }
      if (idealPopupLeft + shift < availableLeft) {
        shift = availableLeft - idealPopupLeft;
      }

      setAlignOffset(popupAlign === 'right' ? shift + (rect.width - popupWidth) : shift);

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < 260 && spaceAbove > spaceBelow);
    }
  }, [popupAlign, usePortal]);

  useEffect(() => {
    if (!open) return;
    updateAlignment();
    window.addEventListener('resize', updateAlignment);
    window.addEventListener('scroll', updateAlignment, true);
    return () => {
      window.removeEventListener('resize', updateAlignment);
      window.removeEventListener('scroll', updateAlignment, true);
    };
  }, [open, updateAlignment]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (triggerRef.current && triggerRef.current.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleOpen = () => {
    setOpen((prev) => !prev);
  };

  const handleSelectHour = (h: string) => {
    const m = selectedMinute || '00';
    const newTime = `${h}:${m}`;
    onChange?.(newTime);
  };

  const handleSelectMinute = (m: string) => {
    const h = selectedHour || '08';
    const newTime = `${h}:${m}`;
    onChange?.(newTime);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
  };

  const handleSetNow = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    onChange?.(`${h}:${m}`);
    setOpen(false);
  };

  const popupContent = open && (
    <div
      ref={ref}
      style={usePortal ? portalStyle : (alignOffset ? { left: `${alignOffset}px` } : undefined)}
      className={`${
        usePortal
          ? 'fixed'
          : `absolute ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} ${popupAlign === 'right' && !alignOffset ? 'right-0' : 'left-0'}`
      } bg-white border border-slate-200 rounded-xl shadow-2xl p-2.5 w-[210px] z-[10000] animate-in fade-in zoom-in-95 duration-150 select-none`}
    >
      <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
          <Clock size={12} className="text-emerald-600" />
          <span>Pilih Waktu</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSetNow}
            className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
          >
            Sekarang
          </button>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="px-1.5 py-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded transition-colors cursor-pointer"
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div>
          <div className="text-[10px] font-bold text-slate-400 mb-1">Jam</div>
          <div className="h-40 overflow-y-auto custom-scrollbar border border-slate-100 rounded-lg p-0.5 space-y-0.5">
            {HOURS.map((h) => {
              const isSelected = selectedHour === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleSelectHour(h)}
                  className={`w-full py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer block ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold text-slate-400 mb-1">Menit</div>
          <div className="h-40 overflow-y-auto custom-scrollbar border border-slate-100 rounded-lg p-0.5 space-y-0.5">
            {MINUTES.map((m) => {
              const isSelected = selectedMinute === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectMinute(m)}
                  className={`w-full py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer block ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative ${open ? 'z-[50]' : ''}`}>
      {name && <input type="hidden" name={name} value={value} />}
      <div ref={triggerRef} data-time-picker-trigger={name} onClick={toggleOpen}>
        {customTrigger ? (
          customTrigger(toggleOpen)
        ) : (
          <div className="w-full h-7 bg-white border border-slate-200 hover:border-emerald-500 rounded-md px-1.5 text-[10px] font-medium flex items-center justify-between shadow-2xs transition-colors cursor-pointer">
            <span className={`truncate ${!value ? 'text-slate-400 font-normal' : 'text-slate-800 font-bold'}`}>
              {value || placeholder}
            </span>
            <Clock size={11} className="text-slate-400 shrink-0 ml-1" />
          </div>
        )}
      </div>

      {usePortal ? <Portal>{popupContent}</Portal> : popupContent}
    </div>
  );
}
