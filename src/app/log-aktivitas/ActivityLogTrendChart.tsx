'use client';

import { memo, useMemo, useState, useRef, useEffect } from 'react';
import { BarChart3, Clock } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Brush,
} from 'recharts';
import type { ActivityLogTrendDay } from '@/app/api/activity-log/trend/route';

const ACTION_COLORS: Record<string, string> = {
  INSERT: '#10b981', // emerald-500
  UPDATE: '#3b82f6', // blue-500
  DELETE: '#ef4444', // rose-500
  LOGIN: '#6366f1',  // indigo-500
  MAINTENANCE: '#f59e0b', // amber-500
  CRON_SYNC: '#a855f7', // purple-500
  SCRAPE: '#06b6d4', // cyan-500
  IMPORT: '#14b8a6', // teal-500
  UPLOAD: '#14b8a6',
};

export interface ActivityLogHourlyStat {
  hour: string;
  count: number;
}

function ActivityLogTrendChart({
  days,
  hourly = [],
  minutes = [],
  detailHour = null,
  loading,
  activeAction,
  onSelectDay,
  onSelectAction,
  onHourClick,
  onHourBack,
}: {
  days: ActivityLogTrendDay[];
  hourly?: ActivityLogHourlyStat[];
  minutes?: { minute: string; count: number }[];
  detailHour?: string | null;
  loading?: boolean;
  activeAction?: string;
  onSelectDay: (date: string) => void;
  onSelectAction: (action: string) => void;
  onHourClick?: (hour: string) => void;
  onHourBack?: () => void;
}) {
  const [dailyZoomStart, setDailyZoomStart] = useState(0);
  const [dailyZoomEnd, setDailyZoomEnd] = useState(100);
  const [hourlyZoomStart, setHourlyZoomStart] = useState(0);
  const [hourlyZoomEnd, setHourlyZoomEnd] = useState(100);
  
  // ponytail: track real mouse click untuk avoid false trigger dari Recharts internal events
  const lastClickTimeRef = useRef(0);
  const handleHourClick = (label: string) => {
    const now = Date.now();
    // ponytail: debounce 100ms — Recharts kadang fire onClick 2x dalam <50ms
    if (now - lastClickTimeRef.current < 100) return;
    lastClickTimeRef.current = now;
    if (onHourClick) onHourClick(label.replace(':00', ''));
  };

  // ponytail: dynamic maxBarSize based on data length
  const maxBarSize = useMemo(() => {
    const len = days.length;
    if (len <= 7) return 40;
    if (len <= 30) return 20;
    if (len <= 90) return 12;
    return 8; // 365 days → thin bars
  }, [days.length]);

  const topActions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of days) {
      for (const [a, c] of Object.entries(d.byAction)) {
        counts.set(a, (counts.get(a) ?? 0) + c);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([a]) => a);
  }, [days]);

  const dailyChartData = useMemo(() => {
    return days.map((d) => {
      // ponytail: support week/month format from API (YYYY-WWw or YYYY-MM)
      let dateLabel = d.date;
      let fullDateLabel = d.date;
      
      if (d.date.includes('-W')) {
        // Week format: YYYY-Www
        const [year, week] = d.date.split('-W');
        dateLabel = `W${week}`;
        fullDateLabel = `Minggu ${week}, ${year}`;
      } else if (d.date.match(/^\d{4}-\d{2}$/)) {
        // Month format: YYYY-MM
        const [year, month] = d.date.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        dateLabel = monthNames[parseInt(month) - 1];
        fullDateLabel = `${monthNames[parseInt(month) - 1]} ${year}`;
      } else {
        // Daily format: YYYY-MM-DD
        try {
          const date = new Date(d.date + 'T12:00:00+07:00');
          dateLabel = new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            timeZone: 'Asia/Jakarta',
          }).format(date);
          
          fullDateLabel = new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Jakarta',
          }).format(date);
        } catch {
          dateLabel = d.date;
          fullDateLabel = d.date;
        }
      }

      const item: Record<string, any> = {
        date: d.date,
        name: dateLabel,
        fullDate: fullDateLabel,
        total: d.total,
      };
      for (const action of topActions) {
        item[action] = d.byAction[action] ?? 0;
      }
      return item;
    });
  }, [days, topActions]);

  const hourlyChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of hourly) {
      map.set(h.hour, h.count);
    }
    const result: { hour: string; count: number; name: string }[] = [];
    for (let i = 0; i < 24; i++) {
      const hStr = String(i).padStart(2, '0');
      result.push({
        hour: hStr,
        name: `${hStr}:00`,
        count: map.get(hStr) ?? 0,
      });
    }
    return result;
  }, [hourly]);

  const minuteChartData: typeof hourlyChartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of minutes) {
      map.set(m.minute, m.count);
    }
    const result: { hour: string; count: number; name: string }[] = [];
    if (!detailHour) return result;
    const hh = detailHour.padStart(2, '0');
    for (let i = 0; i < 60; i++) {
      const mStr = `${hh}:${String(i).padStart(2, '0')}`;
      result.push({
        hour: mStr,
        name: mStr,
        count: map.get(mStr) ?? 0,
      });
    }
    return result;
  }, [minutes, detailHour]);

  if (loading) {
    return (
      <div className="h-56 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
    );
  }

  if (days.length === 0) {
    return (
      <div className="px-3 py-4 rounded-xl border border-gray-100 bg-gray-50/50 text-[11px] font-medium text-gray-400">
        Tidak ada data trend untuk rentang filter ini.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Daily Trend Chart */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-[12px] font-medium text-gray-700">
            <BarChart3 size={14} className="text-emerald-600" />
            Tren harian
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {topActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onSelectAction(activeAction === action ? '' : action)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold border transition-all ${
                  activeAction === action
                    ? 'ring-1 ring-emerald-400 bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: ACTION_COLORS[action] ?? '#94a3b8' }}
                />
                {action}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full text-[10px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyChartData}
              margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
              onClick={(state: any) => {
                console.log('BarChart clicked:', state);
                // ponytail: Recharts tidak kasih activePayload di stacked bar, pakai activeIndex instead
                if (state?.activeIndex !== undefined && dailyChartData[state.activeIndex]) {
                  const clickedData = dailyChartData[state.activeIndex];
                  const clickedDate = clickedData.date;
                  console.log('Clicked date:', clickedDate);
                  if (clickedDate) onSelectDay(clickedDate);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                stroke="#94a3b8"
                fontSize={8}
                fontWeight="bold"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                stroke="#94a3b8"
                fontSize={8}
                fontWeight="bold"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0]?.payload;
                  const total = data?.total ?? 0;
                  // ponytail: compact custom tooltip, total sekali di atas
                  return (
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-3 py-2 text-[11px]">
                      <div className="font-semibold text-gray-700 mb-1.5">{data?.fullDate || label}</div>
                      <div className="font-bold text-gray-900 mb-1.5">Total: {total.toLocaleString('id-ID')}</div>
                      <div className="space-y-0.5">
                        {payload.toReversed().map((entry: any) => (
                          <div key={entry.dataKey} className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-600">{entry.name}</span>
                            <span className="ml-auto font-medium text-gray-800">{entry.value?.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              {topActions.map((action) => (
                <Bar
                  key={action}
                  dataKey={action}
                  stackId="a"
                  fill={ACTION_COLORS[action] ?? '#94a3b8'}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={maxBarSize}
                  cursor="pointer"
                  onClick={(data: any) => {
                    if (data?.date) {
                      onSelectDay(data.date);
                      // filter action cuma kalau cuma 1 bar (1 hari)
                      if (days.length === 1) onSelectAction(action);
                    }
                  }}
                />
              ))}
              <Brush
                dataKey="name"
                height={20}
                stroke="#10b981"
                fill="#f0fdf4"
                startIndex={Math.floor((dailyZoomStart / 100) * (dailyChartData.length - 1))}
                endIndex={Math.floor((dailyZoomEnd / 100) * (dailyChartData.length - 1))}
                onChange={(e) => {
                  if (e.startIndex !== undefined && e.endIndex !== undefined) {
                    setDailyZoomStart((e.startIndex / (dailyChartData.length - 1)) * 100);
                    setDailyZoomEnd((e.endIndex / (dailyChartData.length - 1)) * 100);
                  }
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly / Minute Traffic Chart */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-[12px] font-medium text-gray-700">
            <Clock size={14} className="text-blue-600" />
            {detailHour ? `Per-menit jam ${detailHour.padStart(2, '0')}:00` : 'Traffic per jam'}
          </div>
          <div className="flex items-center gap-2">
            {detailHour && (
              <button
                type="button"
                onClick={onHourBack}
                className="text-[9px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
              >
                ← Kembali
              </button>
            )}
            <div className="text-[9px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
              Total: {detailHour
                ? minutes.reduce((acc, curr) => acc + curr.count, 0).toLocaleString('id-ID')
                : hourly.reduce((acc, curr) => acc + curr.count, 0).toLocaleString('id-ID')
              } log
            </div>
          </div>
        </div>

        <div className="h-64 w-full text-[10px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={detailHour ? minuteChartData : hourlyChartData}
              margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
              onClick={(state: any) => {
                if (!detailHour && state?.activeLabel) {
                  handleHourClick(state.activeLabel);
                }
              }}
            >
              <defs>
                <linearGradient id="hourlyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                stroke="#94a3b8"
                fontSize={8}
                fontWeight="bold"
                interval={detailHour ? 4 : 0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                stroke="#94a3b8"
                fontSize={8}
                fontWeight="bold"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
                  fontSize: '11px',
                  fontWeight: '500',
                  padding: '8px 12px',
                }}
                labelStyle={{
                  color: '#374151',
                  fontWeight: '600',
                  marginBottom: '4px',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name={detailHour ? 'Jumlah per menit' : 'Jumlah Log'}
                stroke="#2563eb"
                strokeWidth={1.8}
                fillOpacity={1}
                fill="url(#hourlyGrad)"
                cursor={detailHour ? 'default' : 'pointer'}
              />
              {!detailHour && (
                <Brush
                  dataKey="name"
                  height={20}
                  stroke="#3b82f6"
                  fill="#eff6ff"
                  startIndex={Math.floor((hourlyZoomStart / 100) * (hourlyChartData.length - 1))}
                  endIndex={Math.floor((hourlyZoomEnd / 100) * (hourlyChartData.length - 1))}
                  onChange={(e) => {
                    if (e.startIndex !== undefined && e.endIndex !== undefined) {
                      setHourlyZoomStart((e.startIndex / (hourlyChartData.length - 1)) * 100);
                      setHourlyZoomEnd((e.endIndex / (hourlyChartData.length - 1)) * 100);
                    }
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default memo(ActivityLogTrendChart);
