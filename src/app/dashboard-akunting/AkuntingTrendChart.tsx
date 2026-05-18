'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import LastUpdatedBadge from '@/components/LastUpdatedBadge';

interface TrendPoint {
  date: string;
  laba_rugi: number;
  arus_kas: number;
}

const STORAGE_KEY = 'akt_trend_range';
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

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
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toFixed(0)}rb`;
  return `${sign}Rp ${abs.toFixed(0)}`;
}

function formatFull(val: number): string {
  return (val < 0 ? '-' : '') + 'Rp ' + Math.abs(val).toLocaleString('id-ID', { minimumFractionDigits: 0 });
}

// X-axis: kalau semua data dalam satu bulan → tampilkan hari (dd) agar label tersebar;
// kalau multi-bulan → tampilkan nama bulan di titik pertama tiap bulan.
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

function DateTrigger({ formatted, onClick }: { formatted: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[11px] font-semibold text-gray-700 hover:border-gray-200 hover:bg-gray-100 transition-colors">
      <Calendar size={11} className="text-gray-400 shrink-0" />
      <span>{formatted || 'Pilih tanggal'}</span>
    </button>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const dt = strToDate(label);
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
  }).format(dt);
  const d = payload[0]?.payload as TrendPoint;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-[11px] min-w-[220px]">
      <p className="font-extrabold text-gray-700 mb-2">{dateLabel}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between gap-4">
          <span className="font-bold" style={{ color: d.laba_rugi >= 0 ? '#10b981' : '#f43f5e' }}>
            Laba / Rugi
          </span>
          <span className={`font-extrabold ${d.laba_rugi >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatFull(d.laba_rugi)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-violet-600 font-bold">Arus Kas</span>
          <span className={`font-extrabold ${d.arus_kas >= 0 ? 'text-gray-700' : 'text-rose-600'}`}>
            {formatFull(d.arus_kas)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AkuntingTrendChart() {
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
    fetch(`/api/dashboard/akunting-trend?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          // Konversi ke running total (kumulatif)
          let cumLR = 0;
          let cumAK = 0;
          const cumData = (res.data ?? []).map((d: TrendPoint) => {
            cumLR += d.laba_rugi;
            cumAK += d.arus_kas;
            return { date: d.date, laba_rugi: cumLR, arus_kas: cumAK };
          });
          setData(cumData);
        }
      })
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
  const hasData = data.some(d => d.laba_rugi !== 0 || d.arus_kas !== 0);

  // Data sudah kumulatif → titik terakhir = total seluruh rentang
  const lastPoint = data.length > 0 ? data[data.length - 1] : null;
  const totalLabaRugi = lastPoint?.laba_rugi ?? 0;
  const totalArusKas  = lastPoint?.arus_kas  ?? 0;
  const hasTotal = data.length > 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-emerald-600" />
            <p className="text-[13px] font-extrabold text-gray-700 tracking-tight">Tren Laba / Rugi &amp; Arus Kas</p>
          </div>
          {initialized && hasTotal && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                totalLabaRugi >= 0
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${totalLabaRugi >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                Laba/Rugi · {formatRupiah(totalLabaRugi)}
              </span>
              <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                totalArusKas >= 0
                  ? 'bg-violet-50 text-violet-600 border-violet-100'
                  : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}>
                <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${totalArusKas >= 0 ? 'bg-violet-400' : 'bg-rose-400'}`} />
                Arus Kas · {formatRupiah(totalArusKas)}
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
            <p className="text-[12px] font-semibold text-gray-400">
              Tidak ada data pada rentang yang dipilih. Pastikan data jurnal umum sudah disinkronkan.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 10 }}>
              <defs>
                <linearGradient id="gradLR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAK" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
              {/* Y-axis: sama persis dengan ProduksiTrendChart */}
              <YAxis
                tick={{ fontSize: 9, fill: '#d1d5db' }}
                axisLine={false} tickLine={false}
                tickFormatter={formatRupiah}
                width={56}
                label={{ value: 'Nilai (Rp)', angle: 0, position: 'insideBottomLeft', offset: 0, dy: 28, style: { fontSize: 9, fill: '#9ca3af', fontWeight: 600 } }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d1fae5', strokeWidth: 1 }} />
              <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={1} />
              <Legend
                verticalAlign="bottom"
                height={24}
                content={() => (
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#6b7280', paddingTop: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#10b981" strokeWidth="2" /><circle cx="8" cy="4" r="3" fill="#10b981" stroke="white" strokeWidth="1.5" /></svg>
                      Laba / Rugi
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#8b5cf6" strokeWidth="2" /><circle cx="8" cy="4" r="3" fill="#8b5cf6" stroke="white" strokeWidth="1.5" /></svg>
                      Arus Kas
                    </span>
                  </div>
                )}
              />
              {/* laba_rugi dulu (di bawah layer), arus_kas di atas */}
              <Area
                type="monotone"
                dataKey="laba_rugi"
                name="Laba / Rugi"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gradLR)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.laba_rugi === 0) return <circle key={`lr-${cx}`} cx={cx} cy={cy} r={2} fill="#e5e7eb" stroke="white" strokeWidth={2} />;
                  return <circle key={`lr-${cx}`} cx={cx} cy={cy} r={4} fill="#10b981" stroke="white" strokeWidth={2} />;
                }}
                activeDot={{ r: 5, fill: '#10b981', stroke: 'white', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="arus_kas"
                name="Arus Kas"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#gradAK)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.arus_kas === 0) return <circle key={`ak-${cx}`} cx={cx} cy={cy} r={2} fill="#e5e7eb" stroke="white" strokeWidth={2} />;
                  return <circle key={`ak-${cx}`} cx={cx} cy={cy} r={4} fill="#8b5cf6" stroke="white" strokeWidth={2} />;
                }}
                activeDot={{ r: 5, fill: '#8b5cf6', stroke: 'white', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
