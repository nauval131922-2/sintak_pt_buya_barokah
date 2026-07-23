'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import LastUpdatedBadge from '@/components/LastUpdatedBadge';
import { formatLastUpdate } from '@/lib/date-utils';

export interface ActivityRow {
  id: number | string;
  action_type?: string | null;
  table_name?: string | null;
  message?: string | null;
  recorded_by?: string | null;
  recorded_by_name?: string | null;
  created_at?: string | null;
}

function getActionBadge(action?: string | null) {
  const act = action || 'OTHER';
  switch (act) {
    case 'INSERT': return { label: 'INSERT', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'UPDATE': return { label: 'UPDATE', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'DELETE': return { label: 'DELETE', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'LOGIN': return { label: 'LOGIN', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    case 'MAINTENANCE': return { label: 'MAINTENANCE', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'CRON_SYNC': return { label: 'CRON_SYNC', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'UPLOAD':
    case 'IMPORT': return { label: act, cls: 'bg-teal-50 text-teal-700 border-teal-200' };
    default: return { label: act, cls: 'bg-gray-50 text-gray-600 border-gray-200' };
  }
}

export default function AktivitasTerbaruCard({
  initialData,
  showFullLink = false,
}: {
  initialData: ActivityRow[];
  showFullLink?: boolean;
}) {
  const [data, setData] = useState<ActivityRow[]>(initialData);

  const fetchData = useCallback(() => {
    fetch('/api/dashboard/aktivitas-terbaru')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setData(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => fetchData();
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') fetchData();
    };
    window.addEventListener('sintak:data-updated', handler);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('sintak:data-updated', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, [fetchData]);

  const lastUpdated = useAutoRefresh(fetchData);

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-gray-400 tracking-widest">Aktivitas terkini</p>
          <p className="text-[13px] font-bold text-gray-700 mt-0.5">8 log aktivitas global terakhir</p>
          <LastUpdatedBadge lastUpdated={lastUpdated} />
        </div>
        {showFullLink && (
          <Link
            href="/log-aktivitas"
            className="group text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0 mt-0.5"
          >
            Lihat semua
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Action</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Waktu / User</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Tabel</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 tracking-wider whitespace-nowrap min-w-[240px]">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((log) => {
                const b = getActionBadge(log.action_type);
                return (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold border tracking-wider ${b.cls}`}>
                        {b.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 min-w-[160px]">
                      <p className="text-[11px] font-bold text-gray-600">{formatLastUpdate(log.created_at)}</p>
                      <p className="text-[11px] font-semibold text-gray-400">
                        {log.recorded_by || 'system'}
                        {log.recorded_by_name ? ` (${log.recorded_by_name})` : ''}
                      </p>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <p className="text-[12px] font-bold text-gray-700">{log.table_name || '—'}</p>
                    </td>
                    <td className="px-5 py-3 min-w-[240px]">
                      <p className="text-[12px] font-bold text-gray-700 line-clamp-2">{log.message || '—'}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-5 pb-5">
          <div className="text-[12px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 rounded-xl p-4">
            Belum ada log aktivitas yang tercatat.
          </div>
        </div>
      )}
    </div>
  );
}
