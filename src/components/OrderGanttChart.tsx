'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar, CheckCircle2, Clock, AlertTriangle, 
  Layers, Users, ChevronRight, Info, Target, Flag, Sparkles
} from 'lucide-react';

export interface JhpEntryForGantt {
  id: number;
  tgl: string;
  shift: string;
  bagian: string;
  no_order: string;
  nama_order: string;
  pekerjaan_target: string | null;
  no_order_2: string | null;
  nama_order_2: string | null;
  pekerjaan_realisasi: string | null;
  target: number | null;
  realisasi: number | null;
  nama_karyawan: string | null;
  keterangan: string | null;
  jam: string | null;
  kendala: string | null;
}

export interface OrderInfoForGantt {
  faktur: string;
  nama_prd: string;
  qty: number;
  satuan: string;
  nama_pelanggan: string;
  tgl_order?: string | null;
  deadline_date?: string | null;
  finished_date?: string | null;
}

interface OrderGanttChartProps {
  entries: JhpEntryForGantt[];
  orderInfo: OrderInfoForGantt | null;
}

interface GanttTask {
  id: string;
  bagian: string;
  pekerjaan: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalTarget: number;
  totalRealisasi: number;
  progress: number;
  operators: string[];
  shifts: string[];
  kendalaList: string[];
  keteranganList: string[];
  activeDates: Set<string>;
  entryCount: number;
}

// Helper: parse any date format (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY) to YYYY-MM-DD
function parseToISO(str?: string | null): string | null {
  if (!str) return null;
  const s = str.trim();
  // Case YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Case DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Try Date.parse fallback
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
  // 0 = Ahad/Minggu, 5 = Jum'at (hari libur di PT Buya Barokah)
  const names = ['Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  return {
    name: names[day] || '',
    isHoliday: day === 0 || day === 5
  };
}

function getBagianOrder(bagian: string): number {
  const b = bagian.toUpperCase().trim();
  if (b.includes('SETTING') || b.includes('PREPRESS') || b.includes('DESAIN')) return 1;
  if (b.includes('QC') || b.includes('QUALITY CONTROL') || b.includes('PLATE') || b.includes('CTP')) return 2;
  if (b.includes('POTONG') || b.includes('QZ')) return 3;
  if (b.includes('CETAK') || b.includes('PRINT') || b.includes('OFFSET')) return 4;
  if (b.includes('FINISHING') || b.includes('LIPAT') || b.includes('JAHIT') || b.includes('LEM') || b.includes('COVER')) return 5;
  if (b.includes('GUDANG')) return 6;
  if (b.includes('TEKNISI')) return 7;
  return 8;
}

function getBagianTheme(bagian: string) {
  const b = bagian.toUpperCase().trim();
  if (b.includes('SETTING')) {
    return {
      chip: 'bg-blue-50 text-blue-700 border-blue-200',
      barTrack: 'bg-blue-100',
      barFill: 'bg-blue-600',
      text: 'text-blue-700',
    };
  }
  if (b.includes('QC') || b.includes('QUALITY CONTROL')) {
    return {
      chip: 'bg-purple-50 text-purple-700 border-purple-200',
      barTrack: 'bg-purple-100',
      barFill: 'bg-purple-600',
      text: 'text-purple-700',
    };
  }
  if (b.includes('POTONG')) {
    return {
      chip: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      barTrack: 'bg-cyan-100',
      barFill: 'bg-cyan-600',
      text: 'text-cyan-700',
    };
  }
  if (b.includes('CETAK')) {
    return {
      chip: 'bg-amber-50 text-amber-700 border-amber-200',
      barTrack: 'bg-amber-100',
      barFill: 'bg-amber-600',
      text: 'text-amber-700',
    };
  }
  if (b.includes('FINISHING')) {
    return {
      chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barTrack: 'bg-emerald-100',
      barFill: 'bg-emerald-600',
      text: 'text-emerald-700',
    };
  }
  if (b.includes('GUDANG')) {
    return {
      chip: 'bg-slate-50 text-slate-700 border-slate-200',
      barTrack: 'bg-slate-100',
      barFill: 'bg-slate-600',
      text: 'text-slate-700',
    };
  }
  return {
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
    barTrack: 'bg-rose-100',
    barFill: 'bg-rose-600',
    text: 'text-rose-700',
  };
}

export default function OrderGanttChart({ entries, orderInfo }: OrderGanttChartProps) {
  const [selectedBagianFilter, setSelectedBagianFilter] = useState<string>('ALL');
  const [hoveredTask, setHoveredTask] = useState<GanttTask | null>(null);

  // 1. Transform raw entries into grouped Gantt tasks
  const { tasks, allDates, minDate, maxDate, deadlineISO, bagianList } = useMemo(() => {
    const taskMap = new Map<string, GanttTask>();
    const bagianSet = new Set<string>();

    entries.forEach((entry) => {
      const bagian = (entry.bagian || 'LAINNYA').trim();
      bagianSet.add(bagian);
      
      const pekerjaan = (entry.pekerjaan_realisasi || entry.pekerjaan_target || entry.keterangan || 'Pekerjaan').trim();
      const taskKey = `${bagian}::${pekerjaan}`;
      const isoDate = parseToISO(entry.tgl);

      if (!isoDate) return;

      if (!taskMap.has(taskKey)) {
        taskMap.set(taskKey, {
          id: taskKey,
          bagian,
          pekerjaan,
          startDate: isoDate,
          endDate: isoDate,
          totalTarget: 0,
          totalRealisasi: 0,
          progress: 0,
          operators: [],
          shifts: [],
          kendalaList: [],
          keteranganList: [],
          activeDates: new Set<string>(),
          entryCount: 0,
        });
      }

      const item = taskMap.get(taskKey)!;
      item.entryCount += 1;
      item.activeDates.add(isoDate);

      if (isoDate < item.startDate) item.startDate = isoDate;
      if (isoDate > item.endDate) item.endDate = isoDate;

      const tVal = Number(entry.target) || 0;
      const rVal = Number(entry.realisasi) || 0;
      item.totalTarget += tVal;
      item.totalRealisasi += rVal;

      if (entry.nama_karyawan && !item.operators.includes(entry.nama_karyawan.trim())) {
        item.operators.push(entry.nama_karyawan.trim());
      }
      if (entry.shift && !item.shifts.includes(String(entry.shift))) {
        item.shifts.push(String(entry.shift));
      }
      if (entry.kendala && entry.kendala.trim() !== '-' && entry.kendala.trim() !== '' && !item.kendalaList.includes(entry.kendala.trim())) {
        item.kendalaList.push(entry.kendala.trim());
      }
      if (entry.keterangan && entry.keterangan.trim() !== '-' && entry.keterangan.trim() !== '' && !item.keteranganList.includes(entry.keterangan.trim())) {
        item.keteranganList.push(entry.keterangan.trim());
      }
    });

    // Calculate progress for each task
    const taskList = Array.from(taskMap.values()).map((t) => {
      let prog = 0;
      if (t.totalTarget > 0) {
        prog = Math.min(100, Math.round((t.totalRealisasi / t.totalTarget) * 100));
      } else if (t.totalRealisasi > 0) {
        prog = 100;
      }
      return { ...t, progress: prog };
    });

    // Sort tasks logically by workflow (Setting -> QC -> Cetak -> Finishing -> Gudang) then startDate
    taskList.sort((a, b) => {
      const orderA = getBagianOrder(a.bagian);
      const orderB = getBagianOrder(b.bagian);
      if (orderA !== orderB) return orderA - orderB;
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
      return a.pekerjaan.localeCompare(b.pekerjaan);
    });

    // Determine bounds
    let earliest: string | null = null;
    let latest: string | null = null;

    taskList.forEach((t) => {
      if (!earliest || t.startDate < earliest) earliest = t.startDate;
      if (!latest || t.endDate > latest) latest = t.endDate;
    });

    const parsedDeadline = parseToISO(orderInfo?.deadline_date);
    if (parsedDeadline && latest && parsedDeadline > latest) {
      latest = parsedDeadline;
    }

    // Build day sequence
    const dates: string[] = [];
    if (earliest && latest) {
      const cur = new Date(earliest + 'T00:00:00');
      const end = new Date(latest + 'T00:00:00');
      // Safety guard: max 120 days to avoid UI blowup
      let count = 0;
      while (cur <= end && count < 120) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
        count++;
      }
    }

    return {
      tasks: taskList,
      allDates: dates,
      minDate: earliest,
      maxDate: latest,
      deadlineISO: parsedDeadline,
      bagianList: Array.from(bagianSet).sort((a, b) => getBagianOrder(a) - getBagianOrder(b)),
    };
  }, [entries, orderInfo]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (selectedBagianFilter === 'ALL') return tasks;
    return tasks.filter((t) => t.bagian === selectedBagianFilter);
  }, [tasks, selectedBagianFilter]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalTarget = tasks.reduce((s, t) => s + t.totalTarget, 0);
    const totalRealisasi = tasks.reduce((s, t) => s + t.totalRealisasi, 0);
    const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalRealisasi / totalTarget) * 100)) : 0;
    const completedTasks = tasks.filter((t) => t.progress >= 100).length;
    const hasKendalaCount = tasks.filter((t) => t.kendalaList.length > 0).length;

    return {
      totalTasks: tasks.length,
      completedTasks,
      totalTarget,
      totalRealisasi,
      overallProgress,
      hasKendalaCount,
    };
  }, [tasks]);

  if (tasks.length === 0 || allDates.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 shadow-sm">
        <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-medium">Data tanggal produksi belum valid untuk diplot ke Gantt Chart.</p>
        <p className="text-xs text-gray-400 mt-1">Pastikan baris JHP pada pesanan ini memiliki format tanggal yang sesuai.</p>
      </div>
    );
  }

  // Calculate day position helper
  const dateIndexMap: Record<string, number> = {};
  allDates.forEach((d, idx) => {
    dateIndexMap[d] = idx;
  });

  const dayColWidth = 44; // width in px per calendar day
  const totalTimelineWidth = allDates.length * dayColWidth;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. Header Toolbar & Quick Stats */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Summary Metrics */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
            <Layers size={14} className="text-gray-500" />
            <span className="text-gray-600 font-medium">Total Tahapan:</span>
            <span className="font-semibold text-gray-900">{stats.completedTasks}/{stats.totalTasks} Selesai</span>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span className="text-emerald-700 font-medium">Realisasi:</span>
            <span className="font-semibold text-emerald-800">{stats.overallProgress}%</span>
            <span className="text-emerald-600 text-[10px]">({stats.totalRealisasi.toLocaleString('id-ID')} / {stats.totalTarget.toLocaleString('id-ID')})</span>
          </div>

          {stats.hasKendalaCount > 0 && (
            <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 text-rose-700">
              <AlertTriangle size={14} className="text-rose-600" />
              <span className="font-semibold">{stats.hasKendalaCount}</span>
              <span>Tahap Terkendala</span>
            </div>
          )}

          {deadlineISO && (
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 text-amber-800">
              <Flag size={14} className="text-amber-600" />
              <span>Deadline:</span>
              <span className="font-semibold">{formatFullDate(deadlineISO)}</span>
            </div>
          )}
        </div>

        {/* Right: Bagian Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400 font-medium mr-1">Filter:</span>
          <button
            onClick={() => setSelectedBagianFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedBagianFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua ({tasks.length})
          </button>
          {bagianList.map((bg) => {
            const count = tasks.filter((t) => t.bagian === bg).length;
            const theme = getBagianTheme(bg);
            const isActive = selectedBagianFilter === bg;
            return (
              <button
                key={bg}
                onClick={() => setSelectedBagianFilter(bg)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                  isActive
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                    : `${theme.chip} hover:opacity-80`
                }`}
              >
                {bg} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Gantt Chart Grid View */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Scrollable Container with sticky left column */}
        <div className="overflow-x-auto relative max-h-[580px] overflow-y-auto">
          <div className="min-w-fit flex flex-col">
            
            {/* Header Timeline Row */}
            <div className="sticky top-0 z-20 flex bg-white border-b border-gray-200 shadow-sm">
              {/* Left Column Header */}
              <div className="sticky left-0 z-30 w-80 shrink-0 bg-gray-50 border-r border-gray-200 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Tahapan &amp; Bagian Mesin</span>
                <span className="text-[11px] text-gray-400">Target / Realisasi</span>
              </div>

              {/* Right Calendar Day Columns */}
              <div className="flex relative" style={{ width: totalTimelineWidth }}>
                {allDates.map((dStr) => {
                  const dayInfo = getDayOfWeek(dStr);
                  const isDeadlineDay = dStr === deadlineISO;

                  return (
                    <div
                      key={dStr}
                      style={{ width: dayColWidth }}
                      className={`shrink-0 flex flex-col items-center justify-center py-2 border-r border-gray-100 text-center ${
                        isDeadlineDay 
                          ? 'bg-rose-50 text-rose-700 font-semibold' 
                          : dayInfo.isHoliday 
                          ? 'bg-amber-50/40 text-amber-900' 
                          : 'bg-white text-gray-600'
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

            {/* Task Rows */}
            <div className="divide-y divide-gray-100">
              {filteredTasks.map((task) => {
                const theme = getBagianTheme(task.bagian);
                const startIndex = dateIndexMap[task.startDate] ?? 0;
                const endIndex = dateIndexMap[task.endDate] ?? startIndex;
                
                // Calculate position & width in pixels
                const leftPx = startIndex * dayColWidth;
                const spanDays = Math.max(1, endIndex - startIndex + 1);
                const widthPx = spanDays * dayColWidth - 8; // slight margin

                return (
                  <div
                    key={task.id}
                    className="flex hover:bg-gray-50/60 transition-colors group relative"
                    onMouseEnter={() => setHoveredTask(task)}
                    onMouseLeave={() => setHoveredTask(null)}
                  >
                    {/* Sticky Left Task Title & Details */}
                    <div className="sticky left-0 z-10 w-80 shrink-0 bg-white group-hover:bg-gray-50/90 border-r border-gray-200 px-4 py-3 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider border ${theme.chip}`}>
                          {task.bagian}
                        </span>
                        {task.kendalaList.length > 0 && (
                          <span className="flex items-center gap-0.5 text-rose-600 text-[10px] font-medium bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200" title={task.kendalaList.join(', ')}>
                            <AlertTriangle size={11} /> Kendala
                          </span>
                        )}
                        <span className="ml-auto text-[11px] font-semibold text-gray-700">
                          {task.progress}%
                        </span>
                      </div>

                      <div className="text-xs font-medium text-gray-900 truncate" title={task.pekerjaan}>
                        {task.pekerjaan}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                        <span className="truncate max-w-[140px]" title={task.operators.join(', ')}>
                          {task.operators.length > 0 ? task.operators.join(', ') : 'Operator -'}
                        </span>
                        <span className="text-gray-400">
                          {task.totalRealisasi.toLocaleString('id-ID')} / {task.totalTarget.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Right Timeline Grid for this task */}
                    <div 
                      className="relative flex items-center py-3" 
                      style={{ width: totalTimelineWidth }}
                    >
                      {/* Grid background lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {allDates.map((dStr) => {
                          const isHoliday = getDayOfWeek(dStr).isHoliday;
                          const isDeadline = dStr === deadlineISO;
                          return (
                            <div
                              key={dStr}
                              style={{ width: dayColWidth }}
                              className={`shrink-0 h-full border-r border-gray-100 ${
                                isDeadline ? 'bg-rose-50/20' : isHoliday ? 'bg-amber-50/20' : ''
                              }`}
                            />
                          );
                        })}
                      </div>

                      {/* Deadline Vertical Marker Line */}
                      {deadlineISO && deadlineISO in dateIndexMap && (
                        <div
                          className="absolute top-0 bottom-0 z-10 border-l-2 border-dashed border-rose-500 pointer-events-none"
                          style={{ left: (dateIndexMap[deadlineISO] + 1) * dayColWidth - 1 }}
                        />
                      )}

                      {/* Gantt Bar */}
                      <div
                        style={{
                          left: `${leftPx + 4}px`,
                          width: `${widthPx}px`,
                        }}
                        className={`relative z-10 h-8 rounded-lg shadow-xs overflow-hidden flex items-center border border-black/5 cursor-pointer transition-transform hover:scale-[1.01] ${theme.barTrack}`}
                        title={`${task.pekerjaan} (${task.startDate} s/d ${task.endDate}) - ${task.progress}%`}
                      >
                        {/* Progress Fill */}
                        <div
                          style={{ width: `${task.progress}%` }}
                          className={`h-full transition-all duration-300 ${theme.barFill} flex items-center justify-end pr-2`}
                        />

                        {/* Bar Content / Text Label */}
                        <div className="absolute inset-0 flex items-center px-2.5 text-xs font-semibold text-gray-800 drop-shadow-xs pointer-events-none">
                          <span className={`truncate text-[11px] ${task.progress > 45 ? 'text-white' : 'text-gray-900'}`}>
                            {task.progress}% &bull; {task.pekerjaan}
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

        {/* 3. Footer Legend & Hover Inspector */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span>Selesai (100%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span>Sedang Berjalan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span>Ada Kendala</span>
            </div>
            {deadlineISO && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
                <span className="text-rose-600 font-medium">Batas Deadline SPK</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-50 border border-amber-200 inline-block" />
              <span className="text-amber-800">Libur (Jum&apos;at / Ahad)</span>
            </div>
          </div>

          <div className="text-[11px] text-gray-400">
            Total {filteredTasks.length} tahapan &bull; Rentang: {minDate ? formatDateDisplay(minDate) : '-'} s/d {maxDate ? formatDateDisplay(maxDate) : '-'}
          </div>
        </div>
      </div>

      {/* 4. Active Hovered Task Detail Card (Float Inspector) */}
      {hoveredTask && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-md text-xs flex flex-col md:flex-row gap-4 items-start md:items-center justify-between animate-in fade-in duration-150">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getBagianTheme(hoveredTask.bagian).chip}`}>
                {hoveredTask.bagian}
              </span>
              <span className="font-semibold text-gray-900 text-sm">{hoveredTask.pekerjaan}</span>
            </div>
            <div className="text-gray-500 flex items-center gap-2">
              <Calendar size={13} className="text-gray-400" />
              <span>Durasi: {formatFullDate(hoveredTask.startDate)} &mdash; {formatFullDate(hoveredTask.endDate)} ({hoveredTask.activeDates.size} hari aktif)</span>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <div>
              <span className="text-gray-400 block text-[10px]">OPERATOR</span>
              <span className="font-medium text-gray-800">{hoveredTask.operators.join(', ') || '-'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">TARGET / REALISASI</span>
              <span className="font-semibold text-gray-900">
                {hoveredTask.totalRealisasi.toLocaleString('id-ID')} / {hoveredTask.totalTarget.toLocaleString('id-ID')}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">PROGRESS</span>
              <span className="font-bold text-emerald-600 text-sm">{hoveredTask.progress}%</span>
            </div>
          </div>

          {hoveredTask.kendalaList.length > 0 && (
            <div className="w-full md:w-auto bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-rose-800 flex items-start gap-2">
              <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-[11px]">Kendala Tercatat:</span>
                <span className="text-[11px]">{hoveredTask.kendalaList.join('; ')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
