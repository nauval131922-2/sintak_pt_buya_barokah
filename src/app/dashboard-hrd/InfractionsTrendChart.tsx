'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Calendar } from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import LastUpdatedBadge from '@/components/LastUpdatedBadge';

interface TrendPoint {
  date: string;
  kasus: number;
  beban: number;
  high: number;
  medium: number;
  low: number;
  labelTooltip: string;
}

interface Severity { high: number; medium: number; low: number; beban_high: number; beban_medium: number; beban_low: number; }

const STORAGE_KEY = 'hrd_infractions_trend_range';
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
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`;
  return `Rp ${val.toLocaleString('id-ID')}`;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const pt: TrendPoint = payload[0]?.payload;
  if (!pt) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 text-[12px] min-w-[180px]">
      <p className="font-bold text-gray-500 mb-1.5">{pt.labelTooltip}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-gray-500 font-semibold">Total beban</span>
        <span className="font-extrabold text-amber-600">{pt.beban.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}</span>
      </div>
      <div className="flex items-center justify-between gap-4 mt-0.5">
        <span className="text-gray-500 font-semibold">Kasus</span>
        <span className="font-extrabold text-gray-700">{pt.kasus}</span>
      </div>
      {pt.kasus > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-2 flex-wrap">
          {pt.high > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">High: {pt.high}</span>}
          {pt.medium > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">Medium: {pt.medium}</span>}
          {pt.low > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">Low: {pt.low}</span>}
        </div>
      )}
    </div>
  );
}


function buildXTicks(data: TrendPoint[]): Record<string, string> {
  if (data.length === 0) return {};

  // Cek apakah semua data dalam bulan & tahun yang sama
  const firstM = data[0].date.slice(0, 7); // "YYYY-MM"
  const isSingleMonth = data.every(d => d.date.slice(0, 7) === firstM);

  if (isSingleMonth) {
    // Tampilkan nomor hari tiap titik agar label tersebar merata
    const ticks: Record<string, string> = {};
    for (const d of data) {
      ticks[d.date] = d.date.slice(8, 10); // "dd"
    }
    return ticks;
  }

  // Multi-bulan: tampilkan nama bulan di titik pertama tiap bulan
  const ticks: Record<string, string> = {};
  let lastMonth = '';
  for (const d of data) {
    const m = d.date.slice(5, 7);
    const y = d.date.slice(0, 4);
    if (m !== lastMonth) {
      ticks[d.date] = `${MONTHS_SHORT[Number(m) - 1]} ${y}`;
      lastMonth = m;
    }
  }
  return ticks;
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

export default function InfractionsTrendChart() {
  const [today] = useState(() => getTodayStr());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalKasus, setTotalKasus] = useState(0);
  const [totalBeban, setTotalBeban] = useState(0);
  const [severity, setSeverity] = useState<Severity>({ high: 0, medium: 0, low: 0, beban_high: 0, beban_medium: 0, beban_low: 0 });
  const [topEmployees, setTopEmployees] = useState<{ nama: string; kasus: number; beban: number; high: number; medium: number; low: number }[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const range = loadRange(today);
    setFrom(range.from); setTo(range.to); setInitialized(true);
  }, [today]);

  const fetchData = useCallback((f: string, t: string) => {
    if (!f || !t || f > t) return;
    setLoading(true);
    fetch(`/api/dashboard/infractions-trend?from=${f}&to=${t}`)
      .then((r) => r.json())
      .then((res) => {
        let cumK = 0;
        let sumBeban = 0;
        const points: TrendPoint[] = (res.data ?? []).map((d: { date: string; kasus: number; beban: number; high: number; medium: number; low: number }) => {
          cumK += d.kasus;
          sumBeban += d.beban;
          return {
            date: d.date,
            kasus: d.kasus,
            beban: d.beban,
            high: d.high,
            medium: d.medium,
            low: d.low,
            labelTooltip: strToDate(d.date).toLocaleDateString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
            }),
          };
        });
        setData(points);
        setTotalKasus(cumK);
        setTotalBeban(sumBeban);
        setSeverity(res.severity ?? { high: 0, medium: 0, low: 0, beban_high: 0, beban_medium: 0, beban_low: 0 });
        setTopEmployees(res.topEmployees ?? []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (initialized && from && to) fetchData(from, to);
  }, [initialized, from, to, fetchData]);
  const lastUpdated = useAutoRefresh(() => { if (from && to) fetchData(from, to); });

  const handleFromChange = (d: Date) => {
    const val = dateToStr(d); setFrom(val); saveRange(val, to, today);
  };
  const handleToChange = (d: Date) => {
    const val = dateToStr(d); setTo(val); saveRange(from, val, today);
  };

  const fromDate = from ? strToDate(from) : null;
  const toDate = to ? strToDate(to) : null;
  const xTickMap = buildXTicks(data);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-gray-400 tracking-wide">Tren Kesalahan Karyawan</p>
          {loading ? (
            <span className="inline-block w-48 h-4 bg-gray-100 rounded animate-pulse mt-1" />
          ) : initialized && (totalKasus > 0 || totalBeban > 0) ? (
            <p className="text-[13px] font-bold text-gray-700 mt-0.5">
              <span className="text-amber-600">{totalKasus}</span> kasus ·{' '}
              <span className="text-amber-500">{totalBeban.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}</span>
            </p>
          ) : initialized ? (
            <p className="text-[13px] font-semibold text-gray-400 mt-0.5">Tidak ada kesalahan dalam rentang</p>
          ) : null}
          {initialized && totalKasus > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {severity.high > 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block shrink-0" />
                  High · {severity.high} kasus · {formatRupiah(severity.beban_high)}
                </span>
              )}
              {severity.medium > 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />
                  Medium · {severity.medium} kasus · {formatRupiah(severity.beban_medium)}
                </span>
              )}
              {severity.low > 0 && (
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block shrink-0" />
                  Low · {severity.low} kasus · {formatRupiah(severity.beban_low)}
                </span>
              )}
            </div>
          )}
          <LastUpdatedBadge lastUpdated={lastUpdated} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DatePicker name="from" value={fromDate} onChange={handleFromChange}
            customTrigger={(toggle) => (
              <DateTrigger formatted={fromDate?.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) ?? ''} onClick={toggle} />
            )} />
          <span className="text-[11px] font-bold text-gray-400">—</span>
          <DatePicker name="to" value={toDate} onChange={handleToChange} popupAlign="right"
            customTrigger={(toggle) => (
              <DateTrigger formatted={toDate?.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) ?? ''} onClick={toggle} />
            )} />
        </div>
      </div>

      <div className="h-[220px]">
        {loading || !initialized ? (
          <div className="h-full bg-gray-50 rounded-xl animate-pulse" />
        ) : data.length === 0 || data.every((d) => d.kasus === 0) ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[12px] font-semibold text-gray-400">Tidak ada data kesalahan pada rentang yang dipilih.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 10 }}>
              <defs>
                <linearGradient id="colorBeban" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
              {/* Y kiri: total beban rupiah */}
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 9, fill: '#d1d5db' }}
                axisLine={false} tickLine={false}
                tickFormatter={(val) => formatRupiah(val)}
                width={56}
                label={{ value: 'Beban (Rp)', angle: 0, position: 'insideBottomLeft', offset: 0, dy: 28, style: { fontSize: 9, fill: '#9ca3af', fontWeight: 600 } }}
              />
              {/* Y kanan: total kasus kumulatif */}
              <YAxis
                yAxisId="right"
                orientation="right"
                allowDecimals={false}
                tick={{ fontSize: 9, fill: '#c7d2fe' }}
                axisLine={false} tickLine={false}
                width={40}
                label={{ value: 'Kasus/hari', angle: 0, position: 'insideBottomRight', offset: 0, dy: 28, style: { fontSize: 9, fill: '#c7d2fe', fontWeight: 600 } }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fde68a', strokeWidth: 1 }} />
              {/* Area: total beban per hari */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="beban"
                name="Total beban"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#colorBeban)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.kasus === 0) return <circle key={`d-${cx}-${cy}`} cx={cx} cy={cy} r={2} fill="#e5e7eb" stroke="white" strokeWidth={2} />;
                  return <circle key={`d-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="#f59e0b" stroke="white" strokeWidth={2} />;
                }}
                activeDot={{ r: 5, fill: '#f59e0b', stroke: 'white', strokeWidth: 2 }}
              />
              {/* Bar: kasus per hari */}
              <Bar
                yAxisId="right"
                dataKey="kasus"
                name="Kasus"
                fill="#818cf8"
                fillOpacity={0.5}
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
              />
              <Legend verticalAlign="bottom" height={24} iconSize={8}
                wrapperStyle={{ fontSize: '10px', fontWeight: 600, paddingTop: 4 }}
                formatter={(val) => <span style={{ color: '#6b7280' }}>{val}</span>}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Leaderboard karyawan */}
      {initialized && topEmployees.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-gray-400 tracking-wide">Top Karyawan — Total Beban Tertinggi</p>
          <div className="flex flex-col gap-1.5">
            {topEmployees.map((emp, idx) => {
              const maxBeban = topEmployees[0]?.beban || 1;
              const barPct = Math.round((emp.beban / maxBeban) * 100);
              return (
                <div key={emp.nama} className="flex items-center gap-3">
                  <span className="text-[10px] font-extrabold text-gray-300 w-4 shrink-0 text-right">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[11px] font-bold text-gray-700 truncate">{emp.nama}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {emp.high > 0 && <span className="text-[9px] font-bold text-red-500">{emp.high}H</span>}
                        {emp.medium > 0 && <span className="text-[9px] font-bold text-amber-500">{emp.medium}M</span>}
                        {emp.low > 0 && <span className="text-[9px] font-bold text-green-500">{emp.low}L</span>}
                        <span className="text-[10px] font-extrabold text-amber-600">
                          {emp.beban.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                    <div className="h-1 bg-gray-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
