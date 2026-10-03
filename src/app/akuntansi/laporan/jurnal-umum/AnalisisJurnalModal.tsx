'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import BaseModal from '@/components/ui/BaseModal';
import DatePicker from '@/components/DatePicker';

interface AnalisisJurnalModalProps {
  isOpen: boolean;
  onClose: () => void;
  queryParams: string;
  filterDescription?: string;
  startDate?: Date;
  endDate?: Date;
  createAtFrom?: Date | null;
  createAtTo?: Date | null;
  rekFilter?: string;
  searchQuery?: string;
}

interface AnalisisSummary {
  totalVouchers: number;
  totalPendapatan: number;
  totalHpp: number;
  labaKotor: number;
  grossMarginPct: number;
  totalBebanOperasional: number;
  totalBebanLain: number;
  totalBeban: number;
  labaBersih: number;
  netMarginPct: number;
  isProfit: boolean;
  totalKasMasuk: number;
  totalKasKeluar: number;
  netCashflow: number;
}

interface ItemContributor {
  kode: string;
  rekening: string;
  head: string;
  kategori: string;
  amount: number;
  percentage: number;
}

interface StrukturBebanItem {
  kategori: string;
  amount: number;
  percentage: number;
  color: string;
}

interface KasItem {
  kode: string;
  rekening: string;
  kasMasuk: number;
  kasKeluar: number;
  net: number;
}

interface DailyPoint {
  date: string;
  pendapatan: number;
  beban: number;
  labaRugi: number;
  cumLabaRugi: number;
  kasMasuk: number;
  kasKeluar: number;
  netKas: number;
  cumCashflow: number;
  fakturCount: number;
}

interface CashCounterpartItem {
  kode: string;
  rekening: string;
  amount: number;
  frekuensi: number;
  isInternalKas: boolean;
  kategori: string;
  percentage: number;
}

interface AnalisisData {
  summary: AnalisisSummary;
  topUntung: ItemContributor[];
  topRugi: ItemContributor[];
  strukturBeban: StrukturBebanItem[];
  strukturKasKeluar?: StrukturBebanItem[];
  kasBreakdown: KasItem[];
  cashInflows: CashCounterpartItem[];
  cashOutflows: CashCounterpartItem[];
  dailyTrend: DailyPoint[];
}

function parseRekeningDisplay(fullStr?: string) {
  if (!fullStr) return { kode: '', nama: '' };
  const idx = fullStr.indexOf(' - ');
  if (idx !== -1) {
    return {
      kode: fullStr.slice(0, idx).trim(),
      nama: fullStr.slice(idx + 3).trim(),
    };
  }
  return { kode: '', nama: fullStr };
}

function RekeningTitle({
  rekening,
  fallbackKode,
  badgeBg = 'bg-emerald-100/70',
  badgeText = 'text-emerald-800',
}: {
  rekening?: string;
  fallbackKode?: string;
  badgeBg?: string;
  badgeText?: string;
}) {
  const { kode, nama } = parseRekeningDisplay(rekening);
  const displayedKode = kode || fallbackKode;
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {displayedKode && (
        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeBg} ${badgeText} shrink-0`}>
          {displayedKode}
        </span>
      )}
      <span className="text-xs font-bold text-slate-800 truncate" title={nama || rekening}>
        {nama || rekening}
      </span>
    </div>
  );
}
function formatRp(val?: number | null): string {
  if (val === null || val === undefined || isNaN(val)) return 'Rp 0';
  return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
}

function formatShortRp(val: number): string {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1)}Jt`;
  if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toFixed(0)}Rb`;
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
}
const MONTHS_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
function formatDateDisplay(val: Date | null): string {
  if (!val) return '';
  return `${val.getDate()}-${MONTHS_SHORT_ID[val.getMonth()] ?? ''}-${String(val.getFullYear()).slice(-2)}`;
}

function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getPreviousMonthRange(start: Date): { start: Date; end: Date } {
  const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
  const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0);
  return { start: prevStart, end: prevEnd };
}

function getPreviousYearRange(start: Date, end: Date): { start: Date; end: Date } {
  const prevStart = new Date(start.getFullYear() - 1, start.getMonth(), start.getDate());
  const prevEnd = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());
  return { start: prevStart, end: prevEnd };
}

function renderDeltaBadge(current: number, previous?: number | null, isCost = false) {
  if (previous === null || previous === undefined || previous === 0) return null;
  const diff = current - previous;
  const pct = (diff / Math.abs(previous)) * 100;
  if (isNaN(pct) || Math.abs(pct) < 0.05) {
    return <span className="text-[10px] font-bold text-slate-400">0.0% (Stabil)</span>;
  }
  const isIncrease = diff > 0;
  const isPositive = isCost ? !isIncrease : isIncrease;
  const colorClass = isPositive
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : 'text-rose-700 bg-rose-50 border-rose-200';
  const sign = isIncrease ? '+' : '';
  const arrow = isIncrease ? '▲' : '▼';
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded border text-[10px] font-bold font-mono ${colorClass}`}>
      <span>{arrow}</span>
      <span>{sign}{pct.toFixed(1)}%</span>
      <span className="opacity-75">({sign}{formatShortRp(diff)})</span>
    </span>
  );
}

export default function AnalisisJurnalModal({
  isOpen,
  onClose,
  queryParams,
  filterDescription,
  startDate,
  endDate,
  createAtFrom,
  createAtTo,
  rekFilter,
  searchQuery,
}: AnalisisJurnalModalProps) {
  const [data, setData] = useState<AnalisisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profit' | 'cashflow'>('profit');

  // Comparison state
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [comparePreset, setComparePreset] = useState<'mom' | 'yoy' | 'custom'>('mom');
  const [compareStart, setCompareStart] = useState<Date | null>(null);
  const [compareEnd, setCompareEnd] = useState<Date | null>(null);
  const [compareData, setCompareData] = useState<AnalisisData | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  const effectivePrimaryStart = useMemo(() => {
    if (startDate) return startDate;
    if (data?.dailyTrend && data.dailyTrend.length > 0) {
      const parts = data.dailyTrend[0].date.split('-');
      if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date();
  }, [startDate, data?.dailyTrend]);

  const effectivePrimaryEnd = useMemo(() => {
    if (endDate) return endDate;
    if (data?.dailyTrend && data.dailyTrend.length > 0) {
      const parts = data.dailyTrend[data.dailyTrend.length - 1].date.split('-');
      if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date();
  }, [endDate, data?.dailyTrend]);

  const applyComparePreset = (preset: 'mom' | 'yoy' | 'custom') => {
    setComparePreset(preset);
    if (preset === 'mom') {
      const range = getPreviousMonthRange(effectivePrimaryStart);
      setCompareStart(range.start);
      setCompareEnd(range.end);
    } else if (preset === 'yoy') {
      const range = getPreviousYearRange(effectivePrimaryStart, effectivePrimaryEnd);
      setCompareStart(range.start);
      setCompareEnd(range.end);
    }
  };

  useEffect(() => {
    if (compareEnabled && !compareStart && !compareEnd) {
      const range = getPreviousMonthRange(effectivePrimaryStart);
      setCompareStart(range.start);
      setCompareEnd(range.end);
    }
  }, [compareEnabled, effectivePrimaryStart]);

  const fetchCompareData = useCallback(async (start: Date, end: Date) => {
    setLoadingCompare(true);
    try {
      const p = new URLSearchParams({
        from: formatDateToYYYYMMDD(start),
        to: formatDateToYYYYMMDD(end),
        ...(rekFilter ? { rek: rekFilter } : {}),
        ...(searchQuery ? { q: searchQuery } : {}),
        _t: Date.now().toString(),
      });
      const res = await fetch(`/api/jurnal-umum/analisis?${p.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setCompareData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoadingCompare(false);
    }
  }, [rekFilter, searchQuery]);

  useEffect(() => {
    if (compareEnabled && compareStart && compareEnd) {
      fetchCompareData(compareStart, compareEnd);
    } else if (!compareEnabled) {
      setCompareData(null);
    }
  }, [compareEnabled, compareStart, compareEnd, fetchCompareData]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jurnal-umum/analisis?${queryParams}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memuat data analisis');
      }
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, queryParams]);

  const summary = data?.summary;
  const compareSummary = compareData?.summary;

  const chartPoints = useMemo<any[]>(() => {
    if (!data?.dailyTrend) return [];
    if (!compareEnabled || !compareData?.dailyTrend) {
      return data.dailyTrend.map((d, i) => ({
        ...d,
        dayNum: i + 1,
      }));
    }
    const primary = data.dailyTrend;
    const secondary = compareData.dailyTrend;
    const maxLen = Math.max(primary.length, secondary.length);
    const merged: any[] = [];
    for (let i = 0; i < maxLen; i++) {
      const p = primary[i];
      const s = secondary[i];
      merged.push({
        dayNum: i + 1,
        date: p?.date || (s?.date ? `H+${i + 1}` : ''),
        pendapatan: p?.pendapatan ?? 0,
        beban: p?.beban ?? 0,
        labaRugi: p?.labaRugi ?? 0,
        cumLabaRugi: p?.cumLabaRugi ?? 0,
        compareCumLabaRugi: s?.cumLabaRugi,
        kasMasuk: p?.kasMasuk ?? 0,
        kasKeluar: p?.kasKeluar ?? 0,
        netKas: p?.netKas ?? ((p?.kasMasuk ?? 0) - (p?.kasKeluar ?? 0)),
        cumCashflow: p?.cumCashflow ?? 0,
        compareCumCashflow: s?.cumCashflow,
        fakturCount: p?.fakturCount ?? 0,
      });
    }
    return merged;
  }, [data?.dailyTrend, compareData?.dailyTrend, compareEnabled]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Analisis Finansial & Profitabilitas"
      subtitle={filterDescription || 'Ringkasan performa pendapatan, pemicu biaya, dan mutasi kas'}
      icon={BarChart3}
      maxWidth="w-[96vw] max-w-[1600px] h-[94vh] !max-h-[94vh]"
      bodyClassName="overflow-y-auto flex-1 p-4 sm:p-6"
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <div className="text-gray-500 font-medium">
            {summary ? (
              <span>Dianalisis dari <strong>{summary.totalVouchers.toLocaleString('id-ID')}</strong> voucher transaksi sesuai filter aktif.</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer shadow-xs text-xs"
          >
            Tutup
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-emerald-600 animate-spin" />
          <p className="text-xs font-bold text-gray-500">Mengkalkulasi agregasi finansial jurnal umum...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Gagal Menganalisis Data</p>
              <p className="text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg transition-all shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Coba Lagi</span>
          </button>
        </div>
      ) : !data || !summary ? (
        <div className="text-center py-16 text-gray-400 text-xs">Tidak ada data untuk dianalisis</div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Header Status Highlight */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            summary.isProfit
              ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200'
              : 'bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border-rose-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                summary.isProfit ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              }`}>
                {summary.isProfit ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    summary.isProfit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {summary.isProfit ? 'PROFIT / SURPLUS' : 'DEFISIT / RUGI'}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500">
                    Net Margin: {summary.netMarginPct.toFixed(1)}%
                  </span>
                </div>
                <h4 className="text-lg font-black text-gray-900 tracking-tight mt-0.5">
                  Laba Bersih: <span className={summary.isProfit ? 'text-emerald-700' : 'text-rose-700'}>{formatRp(summary.labaBersih)}</span>
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="px-3 py-1.5 bg-white rounded-xl border border-gray-200/80 shadow-2xs text-right">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Net Cashflow</span>
                <span className={`text-xs font-black font-mono ${summary.netCashflow >= 0 ? 'text-violet-700' : 'text-rose-600'}`}>
                  {summary.netCashflow >= 0 ? '+' : ''}{formatShortRp(summary.netCashflow)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs: Laba / Rugi & Arus Kas + Compare Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/70 w-fit shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('profit')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'profit'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp size={14} className="text-emerald-600" />
                <span>Laba / Rugi</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cashflow')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'cashflow'
                    ? 'bg-white text-violet-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wallet size={14} className="text-violet-600" />
                <span>Arus Kas</span>
              </button>
            </div>

            {/* Compare Toggle Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCompareEnabled((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
                  compareEnabled
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <ArrowLeftRight size={13} className={compareEnabled ? 'text-indigo-200' : 'text-indigo-600'} />
                <span>{compareEnabled ? 'Mode Komparasi: Aktif' : 'Bandingkan Periode'}</span>
              </button>
            </div>
          </div>

          {/* Comparison Control Bar */}
          {compareEnabled && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-in fade-in duration-200 relative z-30">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5 mr-1">
                  <ArrowLeftRight size={13} className="text-indigo-600" />
                  Bandingkan dengan:
                </span>
                <div className="inline-flex rounded-lg p-0.5 bg-white border border-indigo-200 shadow-2xs font-semibold text-[11px]">
                  <button
                    type="button"
                    onClick={() => applyComparePreset('mom')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      comparePreset === 'mom' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bulan Sebelumnya (MoM)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyComparePreset('yoy')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      comparePreset === 'yoy' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tahun Lalu (YoY)
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparePreset('custom')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      comparePreset === 'custom' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Kustom
                  </button>
                </div>

                {/* Custom Date Pickers */}
                {comparePreset === 'custom' && (
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-indigo-200 w-[270px] shrink-0 h-8 relative z-40">
                    <div className="flex-1 min-w-0 h-full [&>div]:h-full [&>div>[data-date-picker-trigger]]:h-full">
                      <DatePicker
                        name="compStart"
                        value={compareStart}
                        onChange={(d) => setCompareStart(d)}
                        customTrigger={() => (
                          <div
                            className="h-full px-2 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 hover:text-indigo-700 hover:border-indigo-500 transition-all flex items-center justify-between shadow-2xs cursor-pointer w-full"
                            title={compareStart ? `Dari: ${formatDateDisplay(compareStart)}` : 'Tanggal awal'}
                          >
                            <span className="truncate">{compareStart ? formatDateDisplay(compareStart) : 'Dari Tgl'}</span>
                            <Calendar size={11} className="text-slate-400 shrink-0 ml-1" />
                          </div>
                        )}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold px-0.5 shrink-0">-</span>
                    <div className="flex-1 min-w-0 h-full [&>div]:h-full [&>div>[data-date-picker-trigger]]:h-full">
                      <DatePicker
                        name="compEnd"
                        value={compareEnd}
                        onChange={(d) => setCompareEnd(d)}
                        customTrigger={() => (
                          <div
                            className="h-full px-2 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 hover:text-indigo-700 hover:border-indigo-500 transition-all flex items-center justify-between shadow-2xs cursor-pointer w-full"
                            title={compareEnd ? `Sampai: ${formatDateDisplay(compareEnd)}` : 'Tanggal akhir'}
                          >
                            <span className="truncate">{compareEnd ? formatDateDisplay(compareEnd) : 'S/d Tgl'}</span>
                            <Calendar size={11} className="text-slate-400 shrink-0 ml-1" />
                          </div>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status info */}
              <div className="flex items-center gap-2 shrink-0">
                {loadingCompare ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                    <Loader2 size={13} className="animate-spin text-indigo-600" />
                    <span>Memuat komparasi...</span>
                  </div>
                ) : compareStart && compareEnd ? (
                  <span className="text-[11px] font-bold text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs font-mono">
                    {formatDateDisplay(compareStart)} s/d {formatDateDisplay(compareEnd)}
                  </span>
                ) : null}
              </div>
            </div>
          )}
          {/* TAB 1: PROFITABILITY & CONTRIBUTORS */}
          {activeTab === 'profit' && (
            <div className="flex flex-col gap-6">
              {/* Row 1: KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Omset</span>
                    <p className="text-sm sm:text-base font-black text-slate-800 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalPendapatan)}>
                      {formatRp(summary.totalPendapatan)}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1">Penjualan &amp; Omset (Rek. 4 &amp; 7)</span>
                  </div>
                  {compareEnabled && compareSummary && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">vs Pembanding:</span>
                        <span className="font-mono font-bold text-slate-600 truncate">{formatShortRp(compareSummary.totalPendapatan)}</span>
                      </div>
                      {renderDeltaBadge(summary.totalPendapatan, compareSummary.totalPendapatan, false)}
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total HPP</span>
                    <p className="text-sm sm:text-base font-black text-rose-700 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalHpp)}>
                      {formatRp(summary.totalHpp)}
                    </p>
                    <span className="text-[10px] text-slate-500 font-bold block mt-1">Harga Pokok Penjualan (Rek. 5)</span>
                  </div>
                  {compareEnabled && compareSummary && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">vs Pembanding:</span>
                        <span className="font-mono font-bold text-slate-600 truncate">{formatShortRp(compareSummary.totalHpp)}</span>
                      </div>
                      {renderDeltaBadge(summary.totalHpp, compareSummary.totalHpp, true)}
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Laba Kotor</span>
                    <p className={`text-sm sm:text-base font-black tracking-tight mt-1 font-mono truncate ${summary.labaKotor >= 0 ? 'text-emerald-700' : 'text-rose-700'}`} title={formatRp(summary.labaKotor)}>
                      {formatRp(summary.labaKotor)}
                    </p>
                    <span className="text-[10px] text-slate-500 font-bold block mt-1">Margin {summary.grossMarginPct.toFixed(1)}%</span>
                  </div>
                  {compareEnabled && compareSummary && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">vs Pembanding:</span>
                        <span className="font-mono font-bold text-slate-600 truncate">{formatShortRp(compareSummary.labaKotor)}</span>
                      </div>
                      {renderDeltaBadge(summary.labaKotor, compareSummary.labaKotor, false)}
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Beban Operasional</span>
                    <p className="text-sm sm:text-base font-black text-orange-700 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalBebanOperasional)}>
                      {formatRp(summary.totalBebanOperasional)}
                    </p>
                    <span className="text-[10px] text-slate-500 font-bold block mt-1">Beban Operasional (Rek. 6)</span>
                  </div>
                  {compareEnabled && compareSummary && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">vs Pembanding:</span>
                        <span className="font-mono font-bold text-slate-600 truncate">{formatShortRp(compareSummary.totalBebanOperasional)}</span>
                      </div>
                      {renderDeltaBadge(summary.totalBebanOperasional, compareSummary.totalBebanOperasional, true)}
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Beban Lain &amp; Pajak</span>
                    <p className="text-sm sm:text-base font-black text-purple-700 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalBebanLain)}>
                      {formatRp(summary.totalBebanLain)}
                    </p>
                    <span className="text-[10px] text-slate-500 font-bold block mt-1">Beban Lain &amp; Pajak (Rek. 8 &amp; 9)</span>
                  </div>
                  {compareEnabled && compareSummary && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">vs Pembanding:</span>
                        <span className="font-mono font-bold text-slate-600 truncate">{formatShortRp(compareSummary.totalBebanLain)}</span>
                      </div>
                      {renderDeltaBadge(summary.totalBebanLain, compareSummary.totalBebanLain, true)}
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pengeluaran</span>
                    <p className="text-sm sm:text-base font-black text-slate-800 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalBeban)}>
                      {formatRp(summary.totalBeban)}
                    </p>
                    <span className="text-[10px] text-rose-600 font-bold block mt-1">Total Beban Usaha (HPP + Biaya)</span>
                  </div>
                  {compareEnabled && compareSummary && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">vs Pembanding:</span>
                        <span className="font-mono font-bold text-slate-600 truncate">{formatShortRp(compareSummary.totalBeban)}</span>
                      </div>
                      {renderDeltaBadge(summary.totalBeban, compareSummary.totalBeban, true)}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Struktur Alokasi Beban */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <PieIcon size={14} className="text-slate-500" />
                    Proporsi Beban Pengeluaran Usaha
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Total: {formatRp(summary.totalBeban)}
                  </span>
                </div>
                {/* Horizontal Stacked Bar */}
                <div className="h-3.5 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                  {data.strukturBeban.map((item, idx) => (
                    <div
                      key={idx}
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      className="h-full transition-all duration-500"
                      title={`${item.kategori}: ${item.percentage}% (${formatRp(item.amount)})`}
                    />
                  ))}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mt-2.5 text-[11px]">
                  {data.strukturBeban.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-700">{item.kategori}:</span>
                      <span className="font-bold text-slate-900">{item.percentage}%</span>
                      <span className="text-slate-400 font-mono">({formatShortRp(item.amount)})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 3: Grafik Tren Finansial Terpadu (Pendapatan vs Beban & Akumulasi Laba Berjalan dalam 1 Grafik) */}
              {data.dailyTrend.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={15} className="text-emerald-600" />
                      <h5 className="text-xs font-bold text-slate-800">Tren Pendapatan vs Beban Harian &amp; Akumulasi Laba Berjalan</h5>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      {data.dailyTrend.length} Hari
                    </span>
                  </div>

                  <div className="w-full h-[280px] [transform:translateZ(0)]">
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <ComposedChart data={chartPoints} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={formatShortRp}
                        />
                        <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                        <Tooltip
                          isAnimationActive={false}
                          formatter={(val: unknown, name: unknown) => [formatRp(Number(val)), String(name)]}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Bar dataKey="pendapatan" name="Pendapatan (Omset)" fill="#10B981" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                        <Bar dataKey="beban" name="Total Beban / HPP" fill="#F43F5E" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                        <Area type="monotone" dataKey="cumLabaRugi" name="Akumulasi Laba Berjalan" stroke="#059669" strokeWidth={2.5} fillOpacity={0} isAnimationActive={false} />
                        {compareEnabled && compareData && (
                          <Line
                            type="monotone"
                            dataKey="compareCumLabaRugi"
                            name="Akumulasi Laba (Pembanding)"
                            stroke="#64748B"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                            isAnimationActive={false}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Row 3: 2 Kolom Komparasi: APA YANG MEMBUAT UNTUNG VS APA YANG MENYEBABKAN RUGI */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 🟢 APA YANG MEMBUAT UNTUNG */}
                <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <ArrowUpRight size={16} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">Apa yang Membuat Untung</h5>
                          <span className="text-[10px] text-emerald-700 font-medium">Top sumber pendapatan & omset penjualan</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-700 font-mono">{formatShortRp(summary.totalPendapatan)}</span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {data.topUntung.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">Tidak ada transaksi pendapatan</p>
                      ) : (
                        data.topUntung.map((item, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-emerald-50/40 border border-emerald-100/60 hover:bg-emerald-50/80 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0 flex-1">
                                <RekeningTitle rekening={item.rekening} badgeBg="bg-emerald-100/70" badgeText="text-emerald-800" />
                                <span className="text-[10px] font-semibold text-emerald-700 block mt-0.5">{item.kategori}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-black text-emerald-800 font-mono">{formatRp(item.amount)}</p>
                                <span className="text-[10px] font-bold text-slate-400">{item.percentage}% dari omset</span>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, item.percentage)}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 🔴 APA YANG MENYEBABKAN BEBAN / RUGI */}
                <div className="bg-white border border-rose-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-rose-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                          <ArrowDownRight size={16} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">Apa yang Menyebabkan Biaya / Rugi</h5>
                          <span className="text-[10px] text-rose-700 font-medium">Top pos pengeluaran, HPP, & beban operasional</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-rose-700 font-mono">{formatShortRp(summary.totalBeban)}</span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {data.topRugi.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">Tidak ada transaksi beban</p>
                      ) : (
                        data.topRugi.map((item, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-rose-50/40 border border-rose-100/60 hover:bg-rose-50/80 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0 flex-1">
                                <RekeningTitle rekening={item.rekening} badgeBg="bg-rose-100/70" badgeText="text-rose-800" />
                                <span className="text-[10px] font-semibold text-rose-700 block mt-0.5">{item.kategori}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-black text-rose-800 font-mono">{formatRp(item.amount)}</p>
                                <span className="text-[10px] font-bold text-slate-400">{item.percentage}% dari total beban</span>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-rose-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-rose-500 rounded-full"
                                style={{ width: `${Math.min(100, item.percentage)}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CASHFLOW ANALYSIS (LENGKAP) */}
          {activeTab === 'cashflow' && (
            <div className="flex flex-col gap-6">
              {/* Cashflow KPI Cards — style 100% konsisten dengan Tab Laba / Rugi */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Kas Masuk (Inflow)</span>
                    <p className="text-sm sm:text-base font-black text-emerald-700 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalKasMasuk)}>
                      {formatRp(summary.totalKasMasuk)}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1">Penerimaan Kas &amp; Bank</span>
                  </div>
                  {compareEnabled && compareSummary && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">vs Pembanding:</span>
                        <span className="font-mono font-bold text-slate-600 truncate">{formatShortRp(compareSummary.totalKasMasuk)}</span>
                      </div>
                      {renderDeltaBadge(summary.totalKasMasuk, compareSummary.totalKasMasuk, false)}
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Kas Keluar (Outflow)</span>
                    <p className="text-sm sm:text-base font-black text-rose-700 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalKasKeluar)}>
                      {formatRp(summary.totalKasKeluar)}
                    </p>
                    <span className="text-[10px] text-rose-600 font-bold block mt-1">Pengeluaran Kas &amp; Beban Tunai</span>
                  </div>
                  {compareEnabled && compareSummary && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">vs Pembanding:</span>
                        <span className="font-mono font-bold text-slate-600 truncate">{formatShortRp(compareSummary.totalKasKeluar)}</span>
                      </div>
                      {renderDeltaBadge(summary.totalKasKeluar, compareSummary.totalKasKeluar, true)}
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Cashflow</span>
                    <p className={`text-sm sm:text-base font-black tracking-tight mt-1 font-mono truncate ${summary.netCashflow >= 0 ? 'text-violet-700' : 'text-rose-700'}`} title={formatRp(summary.netCashflow)}>
                      {summary.netCashflow >= 0 ? '+' : ''}{formatRp(summary.netCashflow)}
                    </p>
                    <span className={`text-[10px] font-bold block mt-1 ${summary.netCashflow >= 0 ? 'text-violet-600' : 'text-rose-600'}`}>
                      {summary.netCashflow >= 0 ? 'Surplus Likuiditas' : 'Defisit Likuiditas'}
                    </span>
                  </div>
                  {compareEnabled && compareSummary && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">vs Pembanding:</span>
                        <span className="font-mono font-bold text-slate-600 truncate">{formatShortRp(compareSummary.netCashflow)}</span>
                      </div>
                      {renderDeltaBadge(summary.netCashflow, compareSummary.netCashflow, false)}
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inflow / Outflow Ratio</span>
                    <p className="text-sm sm:text-base font-black text-slate-800 tracking-tight mt-1 font-mono truncate">
                      {summary.totalKasKeluar > 0 ? (summary.totalKasMasuk / summary.totalKasKeluar).toFixed(2) + 'x' : '—'}
                    </p>
                    <span className="text-[10px] text-slate-500 font-bold block mt-1">
                      {summary.totalKasMasuk >= summary.totalKasKeluar ? 'Kas Masuk Menutup Pengeluaran' : 'Pengeluaran Melampaui Penerimaan'}
                    </span>
                  </div>
                  {compareEnabled && compareSummary && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">vs Pembanding:</span>
                        <span className="font-mono font-bold text-slate-600 truncate">
                          {compareSummary.totalKasKeluar > 0 ? (compareSummary.totalKasMasuk / compareSummary.totalKasKeluar).toFixed(2) + 'x' : '—'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-700 font-mono">
                        Rasio Inflow/Outflow
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Struktur Alokasi Pengeluaran Kas (Proporsi Kas Keluar - Full Width) */}
              {data.strukturKasKeluar && data.strukturKasKeluar.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <PieIcon size={14} className="text-slate-500" />
                      Proporsi Alokasi Pengeluaran Kas
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 font-mono">
                      Total: {formatRp(summary.totalKasKeluar)}
                    </span>
                  </div>
                  {/* Horizontal Stacked Bar */}
                  <div className="h-3.5 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                    {data.strukturKasKeluar.map((item, idx) => (
                      <div
                        key={idx}
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                        className="h-full transition-all duration-500"
                        title={`${item.kategori}: ${item.percentage}% (${formatRp(item.amount)})`}
                      />
                    ))}
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-4 mt-2.5 text-[11px]">
                    {data.strukturKasKeluar.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-slate-700">{item.kategori}:</span>
                        <span className="font-bold text-slate-900 font-mono">{item.percentage}%</span>
                        <span className="text-slate-400 font-mono">({formatShortRp(item.amount)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Grafik Tren Arus Kas Harian (Kas Masuk vs Kas Keluar & Kumulatif) */}
              {data.dailyTrend.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wallet size={15} className="text-violet-600" />
                      <h5 className="text-xs font-bold text-slate-800">Tren Mutasi Kas Harian & Akumulasi Cashflow</h5>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      {data.dailyTrend.length} Hari
                    </span>
                  </div>

                  <div className="w-full h-[280px] [transform:translateZ(0)]">
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <ComposedChart data={chartPoints} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={formatShortRp}
                        />
                        <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                        <Tooltip
                          isAnimationActive={false}
                          formatter={(val: unknown, name: unknown) => [formatRp(Number(val)), String(name)]}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Bar dataKey="kasMasuk" name="Kas Masuk" fill="#10B981" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                        <Bar dataKey="kasKeluar" name="Kas Keluar" fill="#F43F5E" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                        <Area type="monotone" dataKey="cumCashflow" name="Akumulasi Kas Berjalan" stroke="#8B5CF6" strokeWidth={2} fillOpacity={0} isAnimationActive={false} />
                        {compareEnabled && compareData && (
                          <Line
                            type="monotone"
                            dataKey="compareCumCashflow"
                            name="Akumulasi Kas (Pembanding)"
                            stroke="#64748B"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                            isAnimationActive={false}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 2 Kolom Komparasi Kas: DARI MANA KAS MASUK vs KE MANA KAS KELUAR */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 🟢 SUMBER KAS MASUK */}
                <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <ArrowUpRight size={16} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">Dari Mana Kas Masuk? (Sumber Inflow)</h5>
                          <span className="text-[10px] text-emerald-700 font-medium">Pos penerimaan uang tunai & setoran bank</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-700 font-mono">{formatShortRp(summary.totalKasMasuk)}</span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {(!data.cashInflows || data.cashInflows.length === 0) ? (
                        <p className="text-xs text-gray-400 text-center py-6">Tidak ada transaksi kas masuk</p>
                      ) : (
                        data.cashInflows.map((item, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-100/60 hover:bg-emerald-50/80 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0 flex-1">
                                <RekeningTitle rekening={item.rekening} fallbackKode={item.kode} badgeBg="bg-emerald-100/70" badgeText="text-emerald-800" />
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-semibold text-emerald-700 px-1.5 py-0.2 bg-emerald-100/60 rounded">
                                    {item.kategori}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {item.frekuensi} transaksi
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-black text-emerald-800 font-mono">{formatRp(item.amount)}</p>
                                <span className="text-[10px] font-bold text-slate-400">{item.percentage}% dari total masuk</span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, item.percentage)}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 🔴 TUJUAN PENGELUARAN KAS */}
                <div className="bg-white border border-rose-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-rose-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                          <ArrowDownRight size={16} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">Ke Mana Kas Dikeluarkan? (Tujuan Outflow)</h5>
                          <span className="text-[10px] text-rose-700 font-medium">Pembayaran hutang, gaji, belanja & operasional</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-rose-700 font-mono">{formatShortRp(summary.totalKasKeluar)}</span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {(!data.cashOutflows || data.cashOutflows.length === 0) ? (
                        <p className="text-xs text-gray-400 text-center py-6">Tidak ada transaksi kas keluar</p>
                      ) : (
                        data.cashOutflows.map((item, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-100/60 hover:bg-rose-50/80 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0 flex-1">
                                <RekeningTitle rekening={item.rekening} fallbackKode={item.kode} badgeBg="bg-rose-100/70" badgeText="text-rose-800" />
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-semibold text-rose-700 px-1.5 py-0.2 bg-rose-100/60 rounded">
                                    {item.kategori}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {item.frekuensi} transaksi
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-black text-rose-800 font-mono">{formatRp(item.amount)}</p>
                                <span className="text-[10px] font-bold text-slate-400">{item.percentage}% dari total keluar</span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-rose-100 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-rose-500 rounded-full"
                                style={{ width: `${Math.min(100, item.percentage)}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cash Accounts Table: Rincian Mutasi Per Rekening Kas & Bank */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Wallet size={14} className="text-violet-600" />
                    Rincian Mutasi Per Rekening Kas & Bank
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">{data.kasBreakdown.length} Akun Kas</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-bold">
                        <th className="py-2.5 px-4 text-left">Kode & Nama Rekening</th>
                        <th className="py-2.5 px-4 text-right">Kas Masuk (Debit)</th>
                        <th className="py-2.5 px-4 text-right">Kas Keluar (Kredit)</th>
                        <th className="py-2.5 px-4 text-right">Mutasi Bersih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {data.kasBreakdown.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400">Tidak ada transaksi kas pada periode ini</td>
                        </tr>
                      ) : (
                        data.kasBreakdown.map((item, idx) => (
                          <tr key={idx} className="hover:bg-violet-50/30 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-slate-800">
                              <RekeningTitle rekening={item.rekening} fallbackKode={item.kode} badgeBg="bg-violet-100/60" badgeText="text-violet-700" />
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                              {formatRp(item.kasMasuk)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-rose-700 font-semibold">
                              {formatRp(item.kasKeluar)}
                            </td>
                            <td className={`py-2.5 px-4 text-right font-mono font-bold ${item.net >= 0 ? 'text-violet-700' : 'text-rose-600'}`}>
                              {item.net >= 0 ? '+' : ''}{formatRp(item.net)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </BaseModal>
  );
}
