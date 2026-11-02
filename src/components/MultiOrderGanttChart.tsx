'use client';

import React, { useMemo, useState } from 'react';
import { 
  Clock, AlertTriangle, ChevronRight, ArrowUpRight 
} from 'lucide-react';

export interface ProductionOrderStage {
  bagian: string;
  start_date: string;
  end_date: string;
  target: number;
  realisasi: number;
  progress: number;
  has_kendala: boolean;
}

export interface ProductionOrderSummary {
  no_order: string;
  nama_order: string;
  nama_pelanggan: string;
  qty: number;
  satuan: string;
  tgl_order: string;
  deadline_date: string | null;
  finished_date: string | null;
  start_date: string;
  end_date: string;
  total_target: number;
  total_realisasi: number;
  progress: number;
  has_kendala: boolean;
  status: 'Selesai' | 'Overdue' | 'Kritis' | 'On-track' | 'Baru Mulai';
  stages: ProductionOrderStage[];
}

interface MultiOrderGanttChartProps {
  orders: ProductionOrderSummary[];
  onSelectOrder: (noOrder: string) => void;
}

function parseToISO(str?: string | null): string | null {
  if (!str) return null;
  const s = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }
  return null;
}

function formatDateDisplay(iso: string): string {
  const parts = iso.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const mIdx = parseInt(parts[1], 10) - 1;
    const day = parts[2].padStart(2, '0');
    return `${day} ${months[mIdx] || parts[1]} ${parts[0]}`;
  }
  return iso;
}

function formatFullDate(iso: string): string {
  return formatDateDisplay(iso);
}

function getDayOfWeek(iso: string): { name: string; isHoliday: boolean } {
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDay();
  const names = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return {
    name: names[day] || '',
    isHoliday: day === 5,
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Selesai':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Overdue':
      return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
    case 'Kritis':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Baru Mulai':
      return 'bg-slate-50 text-slate-700 border-slate-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
}

function getStageColor(bagian: string): string {
  const b = bagian.toUpperCase();
  if (b.includes('SETTING')) return 'bg-blue-500';
  if (b.includes('QC') || b.includes('QUALITY CONTROL') || b.includes('CTP') || b.includes('PLATE')) return 'bg-purple-500';
  if (b.includes('POTONG')) return 'bg-cyan-500';
  if (b.includes('CETAK')) return 'bg-amber-500';
  if (b.includes('FINISHING')) return 'bg-emerald-500';
  if (b.includes('GUDANG')) return 'bg-slate-500';
  return 'bg-indigo-500';
}

function formatStageName(bagian: string): string {
  const b = (bagian || '').trim();
  const upper = b.toUpperCase();
  if (upper.includes('SETTING')) return 'Setting';
  if (upper.includes('QUALITY CONTROL') || upper === 'QC') return 'Quality Control';
  if (upper.includes('POTONG')) return 'Potong';
  if (upper.includes('CETAK')) return 'Cetak';
  if (upper.includes('FINISHING')) return 'Finishing';
  if (upper.includes('GUDANG')) return 'Gudang';
  if (upper.includes('TEKNISI')) return 'Teknisi';
  return b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
}

export default function MultiOrderGanttChart({ orders, onSelectOrder }: MultiOrderGanttChartProps) {


  // Compute overall date bounds
  const { allDates, minDate, maxDate } = useMemo(() => {
    let earliest: string | null = null;
    let latest: string | null = null;

    orders.forEach((ord) => {
      const s = parseToISO(ord.start_date);
      const e = parseToISO(ord.end_date);
      const dl = parseToISO(ord.deadline_date);

      if (s && (!earliest || s < earliest)) earliest = s;
      if (e && (!latest || e > latest)) latest = e;
      if (dl && (!latest || dl > latest)) latest = dl;
    });
    // Otomatis sertakan minimal sampai hari ini dan minggu berjalan ke depan
    const today = new Date();
    const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 7);
    const futureISO = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;

    if (earliest) {
      if (!latest || futureISO > (latest as string)) {
        latest = futureISO;
      }
    }

    const dates: string[] = [];
    if (earliest && latest) {
      const cur = new Date(earliest + 'T00:00:00');
      const end = new Date(latest + 'T00:00:00');
      let count = 0;
      while (cur <= end && count < 180) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
        count++;
      }
    }

    return {
      allDates: dates,
      minDate: earliest,
      maxDate: latest,
    };
  }, [orders]);

  const dateIndexMap: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    allDates.forEach((d, idx) => {
      map[d] = idx;
    });
    return map;
  }, [allDates]);

  const dayColWidth = 78;
  const totalTimelineWidth = allDates.length * dayColWidth;

  if (orders.length === 0 || allDates.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500 shadow-sm">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-gray-800">Tidak ada jadwal rencana produksi aktif</h4>
        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
          Belum ditemukan antrean order aktif pada filter yang dipilih. Coba ganti filter status atau stasiun mesin.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* 1. Main Timeline Container */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto relative min-h-[500px] max-h-[650px] xl:max-h-[750px] overflow-y-auto">
          <div className="min-w-fit flex flex-col">
            {/* Header Timeline Row */}
            {/* Header Timeline Row - z-40 to stay above all data rows */}
            <div className="sticky top-0 z-40 flex bg-white border-b border-gray-200 shadow-xs">
              {/* Top-Left Corner Box - z-50 to stay above day headers and data rows */}
              <div className="sticky left-0 top-0 z-50 w-84 shrink-0 bg-gray-50 border-r border-gray-200 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Daftar Order Produksi &amp; SPK</span>
                <span className="text-[11px] text-gray-400 font-medium">Status / Oplah</span>
              </div>

              {/* Right Calendar Day Columns */}
              <div className="flex relative" style={{ width: totalTimelineWidth }}>
                {allDates.map((dStr) => {
                  const dayInfo = getDayOfWeek(dStr);
                  return (
                    <div
                      key={dStr}
                      style={{ width: dayColWidth }}
                      className={`shrink-0 flex flex-col items-center justify-center py-2 border-r border-gray-100 text-center ${
                        dayInfo.isHoliday ? 'bg-amber-50/40 text-amber-900' : 'bg-white text-gray-600'
                      }`}
                    >
                      <span className={`text-[11px] font-bold leading-tight ${dayInfo.isHoliday ? 'text-amber-700 font-bold' : 'text-gray-700 font-bold'}`}>
                        {dayInfo.name}
                      </span>
                      <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap tabular-nums mt-0.5">
                        {formatDateDisplay(dStr)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Rows with Single Global Background Grid */}
            <div className="relative divide-y divide-gray-100">
              {/* Global Background Grid (Single layer behind all rows) */}
              <div 
                className="absolute top-0 bottom-0 pointer-events-none flex"
                style={{ left: 336, width: totalTimelineWidth }}
              >
                {allDates.map((dStr) => {
                  const dayInfo = getDayOfWeek(dStr);
                  return (
                    <div
                      key={dStr}
                      style={{ width: dayColWidth }}
                      className={`shrink-0 h-full border-r border-gray-100 ${
                        dayInfo.isHoliday ? 'bg-amber-50/20' : ''
                      }`}
                    />
                  );
                })}
              </div>

              {/* Multi-Order Rows */}
              {orders.map((ord) => {
                const sISO = parseToISO(ord.start_date) || allDates[0];
                const eISO = parseToISO(ord.end_date) || sISO;
                const dlISO = parseToISO(ord.deadline_date);

                const startIndex = dateIndexMap[sISO] ?? 0;
                const endIndex = dateIndexMap[eISO] ?? startIndex;
                const leftPx = startIndex * dayColWidth;
                const spanDays = Math.max(1, endIndex - startIndex + 1);
                const widthPx = spanDays * dayColWidth - 6;

                return (
                  <div
                    key={ord.no_order}
                    className="flex hover:bg-emerald-50/20 transition-colors group relative cursor-pointer"
                    onClick={() => onSelectOrder(ord.no_order)}

                  >
                    {/* Sticky Left Order Info Column */}
                    <div className="sticky left-0 z-20 w-84 shrink-0 bg-white group-hover:bg-gray-50 border-r border-gray-200 px-4 py-2.5 flex flex-col justify-center transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {ord.no_order}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(ord.status)}`}>
                          {ord.status}
                        </span>
                        {ord.has_kendala && (
                          <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-rose-200 flex items-center gap-0.5" title="Terdapat kendala mesin/bahan">
                            <AlertTriangle size={10} /> Kendala
                          </span>
                        )}
                        <ArrowUpRight size={13} className="ml-auto text-gray-300 group-hover:text-emerald-600 transition-colors" />
                      </div>

                      <div className="text-xs text-gray-800 font-medium truncate" title={ord.nama_order}>
                        {ord.nama_order}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                        <span className="truncate max-w-[150px] text-gray-400" title={ord.nama_pelanggan}>
                          {ord.nama_pelanggan !== '-' ? ord.nama_pelanggan : 'Tanpa Pemesan'}
                        </span>
                        <span className="font-medium text-gray-700">
                          {ord.qty.toLocaleString('id-ID')} {ord.satuan}
                        </span>
                      </div>
                    </div>

                    {/* Right Timeline Grid Row */}
                    <div 
                      className="relative flex items-center py-2.5" 
                      style={{ width: totalTimelineWidth }}
                    >
                      {/* Deadline Vertical Marker Line */}
                      {dlISO && dlISO in dateIndexMap && (
                        <div
                          className="absolute top-0 bottom-0 z-10 border-l-2 border-dashed border-rose-500 pointer-events-none"
                          style={{ left: (dateIndexMap[dlISO] + 1) * dayColWidth - 1 }}
                          title={`Deadline: ${dlISO}`}
                        />
                      )}

                      {/* Main Gantt Bar for this Order */}
                      <div
                        style={{
                          left: `${leftPx + 3}px`,
                          width: `${widthPx}px`,
                        }}
                        className="relative z-10 h-7 rounded-lg shadow-2xs overflow-hidden flex items-center border border-gray-300 bg-gray-100 hover:brightness-95 transition-all"
                        title={`${ord.nama_order} (${ord.start_date} s/d ${ord.end_date}) - Progres: ${ord.progress}%`}
                      >
                        {/* Multi-stage Color Segments with Full Stage Names */}
                        {ord.stages.length > 0 ? (
                          <div className="h-full flex w-full">
                            {ord.stages.map((st, sIdx) => {
                              const stageWeight = 100 / ord.stages.length;
                              return (
                                <div
                                  key={sIdx}
                                  style={{ width: `${stageWeight}%` }}
                                  className={`h-full border-r border-white/40 last:border-r-0 flex items-center justify-center transition-opacity hover:opacity-90 px-1.5 ${getStageColor(st.bagian)}`}
                                  title={`${formatStageName(st.bagian)}: Realisasi ${st.realisasi.toLocaleString('id-ID')} / Target ${st.target.toLocaleString('id-ID')} (${st.progress}%)`}
                                >
                                  <span className="text-[10px] font-semibold text-white truncate drop-shadow-2xs whitespace-nowrap">
                                    {formatStageName(st.bagian)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div 
                            style={{ width: `${ord.progress}%` }} 
                            className="h-full bg-emerald-600 flex items-center justify-end pr-2 text-[10px] font-semibold text-white"
                          >
                            {ord.progress}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>

          </div>
        </div>

        {/* 2. Footer Legend */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-gray-400 font-medium">Tahapan Alur:</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              <span>Setting</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              <span>Quality Control</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
              <span>Potong</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Cetak</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Finishing</span>
            </div>
            <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 pl-3">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
              <span className="text-rose-600 font-medium">Batas Deadline SPK</span>
            </div>
          </div>

          <div className="text-[11px] text-gray-400">
            Total {orders.length} order aktif &bull; Periode: {minDate ? formatDateDisplay(minDate) : '-'} s/d {maxDate ? formatDateDisplay(maxDate) : '-'}
          </div>
        </div>
      </div>

    </div>
  );
}
