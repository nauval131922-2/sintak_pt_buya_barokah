'use client';

import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { getActionColor } from '@/lib/activity-log-utils';
import type { ActivityLogTrendDay } from '@/app/api/activity-log/trend/route';

const ACTION_COLORS: Record<string, string> = {
  SCRAPE: 'bg-violet-500',
  IMPORT: 'bg-teal-500',
  UPLOAD: 'bg-cyan-500',
  UPDATE: 'bg-blue-500',
  DELETE: 'bg-rose-500',
  INSERT: 'bg-emerald-500',
  CREATE: 'bg-emerald-500',
};

function barColor(action: string): string {
  return ACTION_COLORS[action] ?? 'bg-gray-400';
}

export default function ActivityLogTrendChart({
  days,
  loading,
  activeAction,
  onSelectDay,
  onSelectAction,
}: {
  days: ActivityLogTrendDay[];
  loading?: boolean;
  activeAction?: string;
  onSelectDay: (date: string) => void;
  onSelectAction: (action: string) => void;
}) {
  const maxTotal = useMemo(
    () => Math.max(1, ...days.map((d) => d.total)),
    [days]
  );

  const topActions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of days) {
      for (const [a, c] of Object.entries(d.byAction)) {
        counts.set(a, (counts.get(a) ?? 0) + c);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([a]) => a);
  }, [days]);

  if (loading) {
    return (
      <div className="h-52 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
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
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
          <BarChart3 size={12} className="text-green-600" />
          Trend harian (klik batang = filter tanggal / aksi)
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          {topActions.map((action) => (
            <button
              key={action}
              type="button"
              title={`Filter: ${action}`}
              onClick={() => onSelectAction(activeAction === action ? '' : action)}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all ${
                activeAction === action
                  ? 'ring-1 ring-green-400 ' + getActionColor(action)
                  : getActionColor(action)
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${barColor(action)}`} />
              {action}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-44 overflow-x-auto pb-1.5 custom-scrollbar">
        {days.map((day) => {
          const hPct = Math.max(8, Math.round((day.total / maxTotal) * 100));
          const segments = Object.entries(day.byAction).sort((a, b) => b[1] - a[1]);
          const dateLabel = new Intl.DateTimeFormat('id-ID', {
            day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta',
          }).format(new Date(day.date + 'T12:00:00+07:00'));
          return (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1 shrink-0 min-w-[40px]"
              title={`${day.date}: ${day.total} log`}
            >
              <button
                type="button"
                onClick={() => onSelectDay(day.date)}
                className="w-9 flex flex-col justify-end rounded-t-md overflow-hidden border border-gray-100 hover:ring-2 hover:ring-green-300 transition-all bg-gray-50"
                style={{ height: `${Math.max(24, Math.round((hPct / 100) * 156))}px` }}
              >
                {segments.map(([action, cnt]) => {
                  const segH = day.total > 0 ? (cnt / day.total) * 100 : 0;
                  return (
                    <span
                      key={action}
                      className={`w-full ${barColor(action)} opacity-90`}
                      style={{ height: `${segH}%`, minHeight: segH > 0 ? '2px' : 0 }}
                      title={`${action}: ${cnt}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAction(activeAction === action ? '' : action);
                        onSelectDay(day.date);
                      }}
                    />
                  );
                })}
              </button>
              <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">
                {dateLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
