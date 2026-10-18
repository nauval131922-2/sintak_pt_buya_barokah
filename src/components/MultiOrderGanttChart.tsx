'use client';

import React, { useMemo, useState } from 'react';
import { 
  Calendar, CheckCircle2, Clock, AlertTriangle, 
  Layers, ChevronRight, Target, Flag, ArrowUpRight
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
    return `${parts[2]}/${parts[1]}`;
  }
  return iso;
}

function formatFullDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${parseInt(parts[2], 10)} ${months[mIdx] || parts[1]} ${parts[0]}`;
  }
  return iso;
}

function getDayOfWeek(iso: string): { name: string; isHoliday: boolean } {
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDay();
  const names = ['Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return {
    name: names[day] || '',
    isHoliday: day === 0 || day === 5,
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

export default function MultiOrderGanttChart({ orders, onSelectOrder }: MultiOrderGanttChartProps) {
  const [hoveredOrder, setHoveredOrder] = useState<ProductionOrderSummary | null>(null);

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

    const dates: string[] = [];
    if (earliest && latest) {
      const cur = new Date(earliest + 'T00:00:00');
      const end = new Date(latest + 'T00:00:00');
      let count = 0;
      while (cur <= end && count < 90) {
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

  const dayColWidth = 38;
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
    <div className="w-full flex flex-col gap-4">
      {/* 1. Main Timeline Container */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto relative max-h-[640px] overflow-y-auto">
          <div className="min-w-fit flex flex-col">
            
            {/* Header Timeline Row */}
            <div className="sticky top-0 z-20 flex bg-white border-b border-gray-200 shadow-xs">
              {/* Left Column Header */}
              <div className="sticky left-0 z-30 w-84 shrink-0 bg-gray-50 border-r border-gray-200 px-4 py-2.5 flex items-center justify-between">
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
                      <span className={`text-[10px] leading-tight ${dayInfo.isHoliday ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                        {dayInfo.name}
                      </span>
                      <span className="text-xs font-semibold">
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
                    onMouseEnter={() => setHoveredOrder(ord)}
                    onMouseLeave={() => setHoveredOrder(null)}
                  >
                    {/* Sticky Left Order Info Column */}
                    <div className="sticky left-0 z-10 w-84 shrink-0 bg-white group-hover:bg-gray-50/95 border-r border-gray-200 px-4 py-2.5 flex flex-col justify-center transition-colors">
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
                        className="relative z-10 h-7 rounded-lg shadow-2xs overflow-hidden flex items-center border border-gray-300 bg-gray-100 transition-transform group-hover:scale-[1.01]"
                        title={`${ord.nama_order} (${ord.start_date} s/d ${ord.end_date}) - Progres: ${ord.progress}%`}
                      >
                        {/* Multi-stage Color Segments */}
                        {ord.stages.length > 0 ? (
                          <div className="h-full flex w-full">
                            {ord.stages.map((st, sIdx) => {
                              // Proportion of this stage relative to total stages
                              const stageWeight = 100 / ord.stages.length;
                              return (
                                <div
                                  key={sIdx}
                                  style={{ width: `${stageWeight}%` }}
                                  className={`h-full border-r border-white/40 flex items-center justify-center transition-opacity hover:opacity-90 ${getStageColor(st.bagian)}`}
                                  title={`${st.bagian}: ${st.realisasi.toLocaleString('id-ID')} / ${st.target.toLocaleString('id-ID')} (${st.progress}%)`}
                                >
                                  <span className="text-[9px] font-semibold text-white truncate px-1 drop-shadow-2xs">
                                    {st.bagian.slice(0, 3)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div 
                            style={{ width: `${ord.progress}%` }} 
                            className="h-full bg-emerald-600 flex items-center justify-end pr-2"
                          />
                        )}

                        {/* Bar Label */}
                        <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-semibold text-white drop-shadow-xs pointer-events-none">
                          <span className="truncate max-w-[180px]">
                            {ord.progress}% &bull; {ord.no_order}
                          </span>
                        </div>
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
              <span>QC / CTP</span>
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

      {/* 3. Floating Detail Card when Hovered */}
      {hoveredOrder && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-md text-xs flex flex-col md:flex-row gap-4 items-start md:items-center justify-between animate-in fade-in duration-150">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">{hoveredOrder.no_order}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(hoveredOrder.status)}`}>
                {hoveredOrder.status}
              </span>
              <span className="text-gray-700 font-medium truncate max-w-sm">{hoveredOrder.nama_order}</span>
            </div>
            <div className="text-gray-500 flex items-center gap-3">
              <Calendar size={13} className="text-gray-400" />
              <span>Rentang: {formatFullDate(hoveredOrder.start_date)} &mdash; {formatFullDate(hoveredOrder.end_date)}</span>
              {hoveredOrder.deadline_date && (
                <span className="text-rose-600 font-medium flex items-center gap-1">
                  <Flag size={12} /> Deadline: {hoveredOrder.deadline_date}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <div>
              <span className="text-gray-400 block text-[10px]">TOTAL TARGET</span>
              <span className="font-medium text-gray-800">{hoveredOrder.total_target.toLocaleString('id-ID')}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">REALISASI</span>
              <span className="font-semibold text-gray-900">{hoveredOrder.total_realisasi.toLocaleString('id-ID')}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">PROGRESS</span>
              <span className="font-bold text-emerald-600 text-sm">{hoveredOrder.progress}%</span>
            </div>
            <button
              onClick={() => onSelectOrder(hoveredOrder.no_order)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs transition-colors shadow-2xs flex items-center gap-1"
            >
              <span>Lihat Detail Mesin</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
