'use client'; // <- WAJIB: komponen ini pakai useState/useEffect (hanya jalan di browser)

import React, { useState, useRef, useEffect } from 'react';
import Portal, { getZoomScale } from './Portal';
import { Calendar, X } from 'lucide-react';

// Constanta di luar komponen => tidak dibuat ulang tiap render (hemat memory)
const MONTHS_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];
const DAYS_SHORT = ['Sn','Sl','Ra','Ka','Ju','Sa','Mg'];

// Fungsi bantuan: bikin array 42 angka (6 minggu) untuk render kalender
// M bikin array tanggal: prev month (abu2) + cur month + next month (abu2)
function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  let startDow = first.getDay(); // 0=Sun (JS), 0=Minggu
  startDow = (startDow + 6) % 7; // 0=Mon (kita), 0=Senin

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { day: number; month: 'prev' | 'cur' | 'next' }[] = [];

  // 1) Isi sisa hari bulan sebelumnya (abu2)
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, month: 'prev' });
  }
  // 2) Isi semua tanggal bulan ini
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: 'cur' });
  }
  // 3) Sisanya diisi awal bulan depan (biar pas 42 = 6 baris)
  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: next++, month: 'next' });
  }
  return cells;
}

// ---- PROPS (input dari parent component) ----
interface DatePickerProps {
  name: string;               // nama field buat <input type="hidden">
  required?: boolean;
  label?: string;             // label di atas input
  onChange?: (date: Date) => void;  // callback: dikirim tiap user pilih tanggal
  value?: Date | null;        // nilai yang sedang dipilih (dari parent)
  customTrigger?: (toggle: () => void) => React.ReactNode; // tombol custom (ganti trigger)
  popupAlign?: 'left' | 'right';
  selectionMode?: 'day' | 'month'; // 'day' = pilih tanggal, 'month' = pilih bulan aja
}

// ---- KOMPONEN UTAMA ----
export default function DatePicker({ name, required, label, onChange, value, customTrigger, popupAlign = 'left', selectionMode = 'day' }: DatePickerProps) {
  const today = new Date();

  // STATE: data yang bisa berubah & render ulang otomatis kalau diubah
  const [viewYear, setViewYear] = useState(today.getFullYear()); // tahun yang lagi dilihat
  const [viewMonth, setViewMonth] = useState(today.getMonth());  // bulan yang lagi dilihat (0-11)
  const [open, setOpen] = useState(false);           // popup terbuka/tidak
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>( // mode tampilan
    selectionMode === 'month' ? 'months' : 'days'
  );
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 }); // posisi popup di layar

  // REF: kayak "ID" ke elemen HTML asli (bisa akses DOM langsung)
  const ref = useRef<HTMLDivElement>(null);       // ref ke popup kalender
  const triggerRef = useRef<HTMLDivElement>(null); // ref ke tombol trigger

  // ---- EFFECT 1: klik di luar popup -> tutup ----
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (triggerRef.current && triggerRef.current.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler); // cleanup saat unmount
  }, [open]); // jalan ulang setiap `open` berubah

  // ---- EFFECT 2: kalau value dari parent berubah, ikutin ----
  const prevTimeRef = useRef<number | null>(null);
  useEffect(() => {
    const timeVal = value ? value.getTime() : null;
    if (timeVal !== prevTimeRef.current) {
      prevTimeRef.current = timeVal;
      if (value) {
        setViewYear(value.getFullYear());
        setViewMonth(value.getMonth());
      }
    }
  }, [value]);

  // ---- EFFECT 3: reset viewMode ke days/months tiap popup ditutup/dibuka ----
  useEffect(() => {
    if (!open) {
      setTimeout(() => setViewMode(selectionMode === 'month' ? 'months' : 'days'), 200);
    } else {
      if (selectionMode === 'month') setViewMode('months');
    }
  }, [open, selectionMode]);

  // Buka/tutup popup + hitung posisi popup (relatif ke trigger)
  const toggleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scale = getZoomScale();
      setCoords({
        top: (rect.bottom + window.scrollY) / scale,
        left: (rect.left + window.scrollX) / scale,
        width: rect.width
      });
    }
    setOpen(!open);
  };

  // Navigasi: panah kiri (prev) - maju/mundur sesuai viewMode
  const prevView = () => {
    if (viewMode === 'days') {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
      else setViewMonth(m => m - 1);
    } else if (viewMode === 'months') {
      setViewYear(y => y - 1);
    } else {
      setViewYear(y => y - 10);
    }
  };

  // Navigasi: panah kanan (next)
  const nextView = () => {
    if (viewMode === 'days') {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
      else setViewMonth(m => m + 1);
    } else if (viewMode === 'months') {
      setViewYear(y => y + 1);
    } else {
      setViewYear(y => y + 10);
    }
  };

  // Saat user klik tanggal -> kirim ke parent lewat onChange
  const selectDay = (cell: { day: number; month: 'prev' | 'cur' | 'next' }) => {
    let y = viewYear, m = viewMonth;
    if (cell.month === 'prev') { m -= 1; if (m < 0) { m = 11; y -= 1; } }
    if (cell.month === 'next') { m += 1; if (m > 11) { m = 0; y += 1; } }
    const d = new Date(y, m, cell.day);
    setViewYear(y);
    setViewMonth(m);
    setOpen(false);            // tutup popup
    if (onChange) {
      onChange(d);              // kirim Date ke parent
    }
  };

  // Cek: apakah cell ini = tanggal yang dipilih?
  const isSelectedDay = (cell: { day: number; month: string }) => {
    if (!value || cell.month !== 'cur') return false;
    return value.getFullYear() === viewYear &&
      value.getMonth() === viewMonth &&
      value.getDate() === cell.day;
  };

  // Cek: apakah cell ini = hari ini?
  const isToday = (cell: { day: number; month: string }) => {
    if (cell.month !== 'cur') return false;
    return today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === cell.day;
  };

  // Format tanggal buat tampilan (misal: "22 Mei 2026")
  const formatted = value
    ? (selectionMode === 'month'
        ? `${MONTHS_SHORT[value.getMonth()]} ${value.getFullYear()}`
        : value.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }))
    : '';

  // Format tanggal buat value hidden input (YYYY-MM-DD atau YYYY-MM)
  const valueStr = value
    ? (selectionMode === 'month'
        ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`
        : `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`)
    : '';

  // Generate daftar 12 tahun buat mode "pilih tahun"
  const startDecade = Math.floor(viewYear / 10) * 10;
  const yearsGrid: number[] = [];
  for (let i = -1; i <= 10; i++) {
    yearsGrid.push(startDecade + i);
  }

  // ---- RENDER: tampilan grid tanggal ----
  const renderDays = () => {
    const cells = getCalendarDays(viewYear, viewMonth);
    return (
      <>
        <div className="grid grid-cols-7 mb-2 border-b border-gray-50 pb-2">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            const sel = isSelectedDay(cell);
            const tod = isToday(cell);
            const dim = cell.month !== 'cur'; // abu2 = bukan bulan ini
            return (
              <button
                key={i}
                type="button"
                onClick={() => selectDay(cell)}
                className={`
                  h-8 w-8 mx-auto rounded-lg text-[13px] font-medium transition-all flex items-center justify-center
                  ${sel ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-100 font-bold' : ''}
                  ${!sel && tod && !dim ? 'bg-emerald-50 text-emerald-600 font-bold border border-emerald-100' : ''}
                  ${!sel && !tod && dim ? 'text-gray-300 font-normal' : ''}   {/* abu2 = prev/next month */}
                  ${!sel && !tod && !dim ? 'text-gray-600 hover:bg-gray-50' : ''}
                `}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  // ---- RENDER: grid 12 bulan ----
  const renderMonths = () => {
    const activeMonth = value && value.getFullYear() === viewYear ? value.getMonth() : -1;
    return (
      <div className="grid grid-cols-3 gap-2 py-2">
        {MONTHS_SHORT.map((m, i) => {
          const sel = activeMonth === i;
          return (
            <button
              key={m}
              type="button"
              onClick={() => { 
                if (selectionMode === 'month') {
                  const d = new Date(viewYear, i, 1);
                  setViewMonth(i);
                  setOpen(false);
                  if (onChange) onChange(d);
                } else {
                  setViewMonth(i); // mode day: pilih bulan dulu, lalu tampilkan tanggal
                  setViewMode('days'); 
                }
              }}
              className={`
                h-12 rounded-lg text-[13px] font-bold transition-all border
                ${sel ? 'bg-emerald-600 text-white border-transparent shadow-sm shadow-emerald-100' : 'text-gray-600 border-gray-50 hover:bg-gray-50'}
              `}
            >
              {m}
            </button>
          );
        })}
      </div>
    );
  };

  // ---- RENDER: grid tahun ----
  const renderYears = () => {
    const activeY = value ? value.getFullYear() : -1;
    return (
      <div className="grid grid-cols-3 gap-2 py-2">
        {yearsGrid.map((y, i) => {
          const sel = activeY === y;
          const isEdge = i === 0 || i === 11; // tahun di ujung (sebelum/selewat dekade)
          return (
            <button
              key={y}
              type="button"
              onClick={() => { setViewYear(y); setViewMode('months'); }}
              className={`
                h-12 rounded-lg text-[13px] font-bold transition-all border
                ${sel ? 'bg-emerald-600 text-white border-transparent shadow-sm shadow-emerald-100' : ''}
                ${!sel && isEdge ? 'text-gray-300 bg-gray-50 border-transparent hover:bg-gray-100' : ''}
                ${!sel && !isEdge ? 'text-gray-600 border-gray-50 hover:bg-gray-50' : ''}
              `}
            >
              {y}
            </button>
          );
        })}
      </div>
    );
  };

  // ---- MAIN RETURN: JSX utama ----
  return (
    <div className="relative">
      {/* LABEL */}
      {label && (
        <label className="block text-[12px] font-semibold text-gray-500 mb-1.5 ml-1">{label}</label>
      )}

      {/* Hidden input: biar value ikut terkirim saat form di-submit */}
      <input type="hidden" name={name} value={valueStr} required={required} />

      {/* TRIGGER: bagian yang diklik untuk buka popup */}
      <div ref={triggerRef} data-date-picker-trigger={name} onClick={toggleOpen}>
        {customTrigger ? customTrigger(toggleOpen) : (
          <div className="w-full h-10 bg-white border border-gray-100 rounded-lg px-3 text-[12px] cursor-pointer flex items-center justify-between shadow-sm transition-all hover:border-emerald-500 group">
            <span className={`font-bold whitespace-nowrap ${formatted ? 'text-gray-800' : 'text-gray-300'}`}>
              {formatted || 'Pilih tanggal...'}
            </span>
            <Calendar size={14} className="text-gray-300 group-hover:text-emerald-500 transition-colors ml-1 shrink-0" />
          </div>
        )}
      </div>

      {/* POPUP KALENDER (hanya muncul kalau open=true) */}
      {open && (
        <Portal> {/* Portal: render di luar hierarki DOM, biar gak kepotong overflow */}
          <div 
            ref={ref}
            style={{ 
              position: 'absolute', 
              top: `${coords.top + 8}px`, 
              left: popupAlign === 'right' ? `${coords.left + coords.width - 280}px` : `${coords.left}px`,
              zIndex: 9999
            }}
            className="bg-white border border-gray-100 rounded-xl shadow-2xl p-4 w-[280px] animate-in fade-in zoom-in-95 duration-200"
          >
            {/* HEADER: navigasi bulan/tahun */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
              <button type="button" onClick={prevView} className="w-9 h-9 rounded-lg bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center justify-center font-bold">
                ‹
              </button>
              {/* Tombol tengah: klik buat ganti mode (days -> months -> years) */}
              <button 
                type="button" 
                onClick={() => {
                  if (viewMode === 'days') setViewMode('months');
                  else if (viewMode === 'months') setViewMode('years');
                }}
                className="text-[13px] font-bold text-gray-800 hover:text-emerald-600 transition-all px-2"
                disabled={viewMode === 'years'}
              >
                {viewMode === 'days' && `${MONTHS_ID[viewMonth]} ${viewYear}`}
                {viewMode === 'months' && `${viewYear}`}
                {viewMode === 'years' && `${startDecade}-${startDecade + 9}`}
              </button>
              <button type="button" onClick={nextView} className="w-9 h-9 rounded-lg bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center justify-center font-bold">
                ›
              </button>
            </div>

            {/* BODY: tampilkan grid sesuai mode */}
            <div className="px-1">
              {viewMode === 'days' && renderDays()}
              {viewMode === 'months' && renderMonths()}
              {viewMode === 'years' && renderYears()}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
