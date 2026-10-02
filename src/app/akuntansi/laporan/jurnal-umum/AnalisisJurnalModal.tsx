'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import BaseModal from '@/components/ui/BaseModal';

interface AnalisisJurnalModalProps {
  isOpen: boolean;
  onClose: () => void;
  queryParams: string;
  filterDescription?: string;
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
  kasBreakdown: KasItem[];
  cashInflows: CashCounterpartItem[];
  cashOutflows: CashCounterpartItem[];
  dailyTrend: DailyPoint[];
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

export default function AnalisisJurnalModal({
  isOpen,
  onClose,
  queryParams,
  filterDescription,
}: AnalisisJurnalModalProps) {
  const [data, setData] = useState<AnalisisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profit' | 'cashflow'>('profit');

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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Analisis Finansial & Profitabilitas"
      subtitle={filterDescription || 'Ringkasan performa pendapatan, pemicu biaya, dan mutasi kas'}
      icon={BarChart3}
      maxWidth="max-w-7xl"
      bodyClassName="overflow-y-auto max-h-[88vh] p-4 sm:p-6"
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
              <div className="px-3 py-1.5 bg-white/80 backdrop-blur-xs rounded-xl border border-gray-200/80 shadow-2xs text-right">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Net Cashflow</span>
                <span className={`text-xs font-black font-mono ${summary.netCashflow >= 0 ? 'text-violet-700' : 'text-rose-600'}`}>
                  {summary.netCashflow >= 0 ? '+' : ''}{formatShortRp(summary.netCashflow)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs: Laba / Rugi & Arus Kas */}
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
              <span>Arus Kas ({data.kasBreakdown.length})</span>
            </button>
          </div>

          {/* TAB 1: PROFITABILITY & CONTRIBUTORS */}
          {activeTab === 'profit' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Row 1: KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Omset</span>
                  <p className="text-sm sm:text-base font-black text-slate-800 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalPendapatan)}>
                    {formatRp(summary.totalPendapatan)}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1">Kepala 4 &amp; 7</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total HPP</span>
                  <p className="text-sm sm:text-base font-black text-rose-700 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalHpp)}>
                    {formatRp(summary.totalHpp)}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold block mt-1">Kepala 5</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Laba Kotor</span>
                  <p className={`text-sm sm:text-base font-black tracking-tight mt-1 font-mono truncate ${summary.labaKotor >= 0 ? 'text-emerald-700' : 'text-rose-700'}`} title={formatRp(summary.labaKotor)}>
                    {formatRp(summary.labaKotor)}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold block mt-1">Margin {summary.grossMarginPct.toFixed(1)}%</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Beban Operasional</span>
                  <p className="text-sm sm:text-base font-black text-orange-700 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalBebanOperasional)}>
                    {formatRp(summary.totalBebanOperasional)}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold block mt-1">Kepala 6</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Beban Lain &amp; Pajak</span>
                  <p className="text-sm sm:text-base font-black text-purple-700 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalBebanLain)}>
                    {formatRp(summary.totalBebanLain)}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold block mt-1">Kepala 8 &amp; 9</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pengeluaran</span>
                  <p className="text-sm sm:text-base font-black text-slate-800 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalBeban)}>
                    {formatRp(summary.totalBeban)}
                  </p>
                  <span className="text-[10px] text-rose-600 font-bold block mt-1">HPP + Beban</span>
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

                  <div className="w-full h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.dailyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
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
                          formatter={(val: any, name: any) => [formatRp(Number(val)), name]}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Bar dataKey="pendapatan" name="Pendapatan (Omset)" fill="#10B981" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="beban" name="Total Beban / HPP" fill="#F43F5E" radius={[3, 3, 0, 0]} />
                        <Area type="monotone" dataKey="cumLabaRugi" name="Akumulasi Laba Berjalan" stroke="#059669" strokeWidth={2} fillOpacity={0} />
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
                                <p className="text-xs font-bold text-slate-800 truncate" title={item.rekening}>
                                  {item.rekening}
                                </p>
                                <span className="text-[10px] font-semibold text-emerald-700">{item.kategori}</span>
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
                                <p className="text-xs font-bold text-slate-800 truncate" title={item.rekening}>
                                  {item.rekening}
                                </p>
                                <span className="text-[10px] font-semibold text-rose-700">{item.kategori}</span>
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
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Cashflow KPI Cards — style 100% konsisten dengan Tab Laba / Rugi */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Kas Masuk (Inflow)</span>
                  <p className="text-sm sm:text-base font-black text-emerald-700 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalKasMasuk)}>
                    {formatRp(summary.totalKasMasuk)}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1">Sisi Debit Akun Kas/Bank</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Kas Keluar (Outflow)</span>
                  <p className="text-sm sm:text-base font-black text-rose-700 tracking-tight mt-1 font-mono truncate" title={formatRp(summary.totalKasKeluar)}>
                    {formatRp(summary.totalKasKeluar)}
                  </p>
                  <span className="text-[10px] text-rose-600 font-bold block mt-1">Sisi Kredit Akun Kas/Bank</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Cashflow</span>
                  <p className={`text-sm sm:text-base font-black tracking-tight mt-1 font-mono truncate ${summary.netCashflow >= 0 ? 'text-violet-700' : 'text-rose-700'}`} title={formatRp(summary.netCashflow)}>
                    {summary.netCashflow >= 0 ? '+' : ''}{formatRp(summary.netCashflow)}
                  </p>
                  <span className={`text-[10px] font-bold block mt-1 ${summary.netCashflow >= 0 ? 'text-violet-600' : 'text-rose-600'}`}>
                    {summary.netCashflow >= 0 ? 'Surplus Likuiditas' : 'Defisit Likuiditas'}
                  </span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inflow / Outflow Ratio</span>
                  <p className="text-sm sm:text-base font-black text-slate-800 tracking-tight mt-1 font-mono truncate">
                    {summary.totalKasKeluar > 0 ? (summary.totalKasMasuk / summary.totalKasKeluar).toFixed(2) + 'x' : '—'}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold block mt-1">
                    {summary.totalKasMasuk >= summary.totalKasKeluar ? 'Kas Masuk Menutup Pengeluaran' : 'Pengeluaran Melampaui Penerimaan'}
                  </span>
                </div>
              </div>

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

                  <div className="w-full h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.dailyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
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
                          formatter={(val: any, name: any) => [formatRp(Number(val)), name]}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Bar dataKey="kasMasuk" name="Kas Masuk" fill="#10B981" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="kasKeluar" name="Kas Keluar" fill="#F43F5E" radius={[3, 3, 0, 0]} />
                        <Area type="monotone" dataKey="cumCashflow" name="Akumulasi Kas Berjalan" stroke="#8B5CF6" strokeWidth={2} fillOpacity={0} />
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
                                <p className="text-xs font-bold text-slate-800 truncate" title={item.rekening}>
                                  {item.rekening}
                                </p>
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
                                <p className="text-xs font-bold text-slate-800 truncate" title={item.rekening}>
                                  {item.rekening}
                                </p>
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
                              <span className="text-violet-700 font-mono mr-1.5">[{item.kode}]</span>
                              {item.rekening}
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
