'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart2, Calendar } from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import LastUpdatedBadge from '@/components/LastUpdatedBadge';

interface TrendPoint {
  date: string;
  nilai_bbb: number;
  qty_bbb: number;
  hpp_total: number;
  qty_hasil: number;
}

const STORAGE_KEY = 'produksi_trend_range';
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

function getTodayStr() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}
function getDefaultRange(today: string) {
  return { from: today.slice(0, 8) + '01', to: today };
}
function loadRange(today: string): { from: string; to: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultRange(today);
    const parsed = JSON.parse(raw) as { from: string; to: string; savedDay: string };
    if (parsed.savedDay !== today) return getDefaultRange(today);
    return { from: parsed.from, to: parsed.to };
  } catch { return getDefaultRange(today); }
}
function saveRange(from: string, to: string, today: string) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ from, to, savedDay: today })); } catch { /* ignore */ }
}
function strToDate(s: string): Date { return new Date(`${s}T12:00:00+07:00`); }
function dateToStr(d: Date): string { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d); }

function formatRupiah(val: number): string {
  if (val === 0) return 'Rp 0';
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`;
  return `Rp ${val.toFixed(0)}`;
}

function DateTrigger({ formatted, onClick }: { formatted: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[11px] font-semibold text-gray-700 hover:border-gray-200 hover:bg-gray-100 transition-colors">
      <Calendar size={11} className="text-gray-400 shrink-0" />
      <span>{formatted || 'Pilih tanggal'}</span>
    </button>
  );
}

function formatFull(val: number): string {
  return 'Rp ' + val.toLocaleString('id-ID', { minimumFractionDigits: 0 });
}

function buildXTickMap(data: TrendPoint[]): Record<string, string> {
  if (data.length === 0) return {};

  // Cek apakah semua data dalam bulan & tahun yang sama
  const firstDt = strToDate(data[0].date);
  const isSingleMonth = data.every(d => {
    const dt = strToDate(d.date);
    return dt.getMonth() === firstDt.getMonth() && dt.getFullYear() === firstDt.getFullYear();
  });

  if (isSingleMonth) {
    // Tampilkan nomor hari tiap titik agar label tersebar merata
    return Object.fromEntries(data.map(d => {
      const dt = strToDate(d.date);
      return [d.date, String(dt.getDate()).padStart(2, '0')];
    }));
  }

  // Multi-bulan: tampilkan nama bulan di titik pertama tiap bulan
  const map: Record<string, string> = {};
  let lastMonth = '';
  data.forEach(d => {
    const dt = strToDate(d.date);
    const m = `${dt.getFullYear()}-${dt.getMonth()}`;
    if (m !== lastMonth) {
      map[d.date] = `${MONTHS_SHORT[dt.getMonth()]} ${dt.getFullYear()}`;
      lastMonth = m;
    }
  });
  return map;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const dt = strToDate(label);
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
  }).format(dt);
  const d = payload[0]?.payload as TrendPoint;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-[11px] min-w-[200px]">
      <p className="font-extrabold text-gray-700 mb-2">{dateLabel}</p>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-4">
          <span className="text-emerald-600 font-bold">Nilai BBB</span>
          <span className="font-extrabold text-gray-700">{formatFull(d.nilai_bbb)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-emerald-400 font-bold">Qty BBB</span>
          <span className="font-extrabold text-gray-700">{d.qty_bbb.toLocaleString('id-ID')}</span>
        </div>
        <div className="border-t border-gray-100 my-1" />
        <div className="flex justify-between gap-4">
          <span className="text-indigo-600 font-bold">HPP Hasil Produksi</span>
          <span className="font-extrabold text-gray-700">{formatFull(d.hpp_total)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-indigo-400 font-bold">Qty Hasil Produksi</span>
          <span className="font-extrabold text-gray-700">{d.qty_hasil.toLocaleString('id-ID')}</span>
        </div>
      </div>
    </div>
  );
}

export default function ProduksiTrendChart() {
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [today] = useState(() => getTodayStr());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    const range = loadRange(today);
    setFrom(range.from);
    setTo(range.to);
    setInitialized(true);
  }, [today]);

  const fetchData = useCallback(() => {
    if (!from || !to) return;
    setLoading(true);
    fetch(`/api/dashboard/produksi-trend?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data ?? []); })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    if (initialized && from && to) fetchData();
  }, [initialized, from, to, fetchData]);

  const handleFromChange = (d: Date) => {
    const s = dateToStr(d);
    setFrom(s);
    saveRange(s, to, today);
  };
  const handleToChange = (d: Date) => {
    const s = dateToStr(d);
    setTo(s);
    saveRange(from, s, today);
  };

  const lastUpdated = useAutoRefresh(fetchData);
  const xTickMap = buildXTickMap(data);
  const hasData = data.some(d => d.nilai_bbb > 0 || d.hpp_total > 0 || d.qty_bbb > 0 || d.qty_hasil > 0);

  // Hitung total dari rentang yang dipilih
  const totalNilaiBBB = data.reduce((s, d) => s + d.nilai_bbb, 0);
  const totalHPP = data.reduce((s, d) => s + d.hpp_total, 0);
  const totalQtyBBB = data.reduce((s, d) => s + d.qty_bbb, 0);
  const totalQtyHasil = data.reduce((s, d) => s + d.qty_hasil, 0);
  const hasTotal = totalNilaiBBB > 0 || totalHPP > 0 || totalQtyBBB > 0 || totalQtyHasil > 0;

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-sm flex flex-col gap-4 relative z-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 size={15} className="text-emerald-600" />
            <p className="text-[13px] font-extrabold text-gray-700 tracking-tight">Tren BBB & Hasil Produksi</p>
          </div>
          {initialized && hasTotal && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0" />
                Nominal BBB · {formatRupiah(totalNilaiBBB)}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block shrink-0" />
                HPP Hasil Produksi · {formatRupiah(totalHPP)}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                <span className="w-2 h-1.5 rounded-sm bg-emerald-300 inline-block shrink-0" />
                Qty BBB · {totalQtyBBB.toLocaleString('id-ID')}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-400 border border-indigo-100">
                <span className="w-2 h-1.5 rounded-sm bg-indigo-300 inline-block shrink-0" />
                Qty Hasil Produksi · {totalQtyHasil.toLocaleString('id-ID')}
              </span>
            </div>
          )}
          <LastUpdatedBadge lastUpdated={lastUpdated} />
        </div>
        {/* Date Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          <DatePicker name="from" value={from ? strToDate(from) : null} onChange={handleFromChange}
            customTrigger={(toggle) => (
              <DateTrigger
                formatted={from ? strToDate(from).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                onClick={toggle}
              />
            )} />
          <span className="text-[11px] font-bold text-gray-400">—</span>
          <DatePicker name="to" value={to ? strToDate(to) : null} onChange={handleToChange} popupAlign="right"
            customTrigger={(toggle) => (
              <DateTrigger
                formatted={to ? strToDate(to).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                onClick={toggle}
              />
            )} />
        </div>
      </div>

      {/* Chart */}
      <div className="h-[240px]">
        {loading || !initialized ? (
          <div className="h-full bg-gray-50 rounded-xl animate-pulse" />
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[12px] font-semibold text-gray-400">Tidak ada data pada rentang yang dipilih.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 10 }}>
              <defs>
                <linearGradient id="gradBBB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradHPP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }}
                axisLine={false} tickLine={false}
                tickFormatter={(val) => xTickMap[val] ?? ''}
                interval={0}
              />
              {/* Y kiri: rupiah */}
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 9, fill: '#d1d5db' }}
                axisLine={false} tickLine={false}
                tickFormatter={formatRupiah}
                width={56}
                label={{ value: 'Nilai (Rp)', angle: 0, position: 'insideBottomLeft', offset: 0, dy: 28, style: { fontSize: 9, fill: '#9ca3af', fontWeight: 600 } }}
              />
              {/* Y kanan: qty */}
              <YAxis
                yAxisId="right"
                orientation="right"
                allowDecimals={false}
                tick={{ fontSize: 9, fill: '#c7d2fe' }}
                axisLine={false} tickLine={false}
                tickFormatter={(val) => val === 0 ? '0' : val.toLocaleString('id-ID')}
                width={40}
                label={{ value: 'Qty', angle: 0, position: 'insideBottomRight', offset: 0, dy: 28, style: { fontSize: 9, fill: '#c7d2fe', fontWeight: 600 } }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d1fae5', strokeWidth: 1 }} />
              <Legend
                verticalAlign="bottom"
                height={24}
                content={() => (
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#6b7280', paddingTop: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#10b981" strokeWidth="2" /><circle cx="8" cy="4" r="3" fill="#10b981" stroke="white" strokeWidth="1.5" /></svg>
                      Nilai BBB
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#6366f1" strokeWidth="2" /><circle cx="8" cy="4" r="3" fill="#6366f1" stroke="white" strokeWidth="1.5" /></svg>
                      HPP Hasil Produksi
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="8" height="8"><rect width="8" height="8" rx="1" fill="#6ee7b7" /></svg>
                      Qty BBB
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="8" height="8"><rect width="8" height="8" rx="1" fill="#a5b4fc" /></svg>
                      Qty Hasil
                    </span>
                  </div>
                )}
              />
              {/* nilai_bbb dulu (di bawah layer), hpp_total di atas */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="nilai_bbb"
                name="Nilai BBB"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gradBBB)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.nilai_bbb === 0) return <circle key={`b-${cx}`} cx={cx} cy={cy} r={2} fill="#e5e7eb" stroke="white" strokeWidth={2} />;
                  return <circle key={`b-${cx}`} cx={cx} cy={cy} r={4} fill="#10b981" stroke="white" strokeWidth={2} />;
                }}
                activeDot={{ r: 5, fill: '#10b981', stroke: 'white', strokeWidth: 2 }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="hpp_total"
                name="HPP Hasil Produksi"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#gradHPP)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.hpp_total === 0) return <circle key={`h-${cx}`} cx={cx} cy={cy} r={2} fill="#e5e7eb" stroke="white" strokeWidth={2} />;
                  return <circle key={`h-${cx}`} cx={cx} cy={cy} r={4} fill="#6366f1" stroke="white" strokeWidth={2} />;
                }}
                activeDot={{ r: 5, fill: '#6366f1', stroke: 'white', strokeWidth: 2 }}
              />
              {/* Bar: Qty BBB */}
              <Bar yAxisId="right" dataKey="qty_bbb" name="Qty BBB" fill="#6ee7b7" fillOpacity={0.6} radius={[3,3,0,0]} maxBarSize={10} />
              {/* Bar: Qty Hasil Produksi */}
              <Bar yAxisId="right" dataKey="qty_hasil" name="Qty Hasil" fill="#a5b4fc" fillOpacity={0.6} radius={[3,3,0,0]} maxBarSize={10} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
