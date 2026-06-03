'use client';

import Link from 'next/link';
import {
  X, Cpu, User as UserIcon, Calendar as CalendarIcon, Database, Info, History, Loader2, ExternalLink, Search,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { formatLastUpdate } from '@/lib/date-utils';
import {
  type ActivityLogRow,
  parseRawData,
  computeExplicitDiff,
  computeSnapshotLiveDiff,
  getRecordHref,
} from '@/lib/activity-log-utils';

interface ActivityLogDetailModalProps {
  log: ActivityLogRow;
  liveData: Record<string, unknown> | null;
  isLoadingLive: boolean;
  onClose: () => void;
}

const SKIP_KEYS = new Set([
  'id', 'created_at', 'updated_at', 'deleted_at', 'fetched_at',
  'updated_by', 'created_by', 'archived_at', 'raw_data',
]);

function recordToRows(data: Record<string, unknown> | null) {
  if (!data) return [];
  return Object.entries(data).filter(([k]) => !SKIP_KEYS.has(k));
}

function KeyValueTable({ data, search }: { data: Record<string, unknown> | null; search: string }) {
  const rows = useMemo(() => {
    const all = recordToRows(data);
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(([k, v]) => k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q));
  }, [data, search]);

  if (!data) {
    return <p className="text-[11px] font-mono text-slate-400 italic text-center py-12">Record tidak ditemukan di database saat ini.</p>;
  }

  return (
    <div className="bg-white rounded-[12px] overflow-hidden border border-gray-100 shadow-sm">
      <div className="overflow-y-auto custom-scrollbar max-h-[350px]">
        <table className="min-w-full text-left text-[11px]">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 font-bold text-gray-400 w-[35%]">Field</th>
              <th className="px-3 py-2 font-bold text-gray-400">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-gray-400 text-[11px] italic">
                  {search ? 'Tidak ada field yang cocok dengan pencarian.' : 'Tidak ada data.'}
                </td>
              </tr>
            ) : (
              rows.map(([key, value]) => (
                <tr key={key} className="hover:bg-gray-50/50">
                  <td className="px-3 py-1.5 font-bold text-gray-700 whitespace-nowrap">{key}</td>
                  <td className="px-3 py-1.5 text-gray-600 font-mono break-all max-w-[300px]">
                    {value === null || value === undefined ? (
                      <span className="text-gray-300 italic">null</span>
                    ) : typeof value === 'object' ? (
                      <pre className="text-[10px] leading-tight whitespace-pre-wrap m-0">{JSON.stringify(value, null, 2)}</pre>
                    ) : (
                      String(value)
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ActivityLogDetailModal({
  log,
  liveData,
  isLoadingLive,
  onClose,
}: ActivityLogDetailModalProps) {
  const [snapshotSearch, setSnapshotSearch] = useState('');
  const [liveSearch, setLiveSearch] = useState('');
  const recordHref = getRecordHref(log.table_name, log.record_id ?? 0);
  const rawParsed = parseRawData(log.raw_data);
  const hasBeforeAfter = rawParsed?.before != null && rawParsed?.after != null;
  const snapshot = (hasBeforeAfter ? rawParsed.after : rawParsed) as Record<string, unknown> | null;
  const liveObj = liveData as Record<string, unknown> | null;
  const explicitDiff = computeExplicitDiff(rawParsed);
  const liveDiff = log.action_type === 'UPDATE' ? computeSnapshotLiveDiff(snapshot, liveObj) : [];
  const diffs = explicitDiff.length > 0 ? explicitDiff : liveDiff;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-none animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-md shadow-green-900/10 border border-gray-100 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-green-50 flex items-center justify-center text-green-600">
              <Cpu size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">Detail Log #{log.id}</h4>
              <p className="text-[11px] text-gray-400 font-bold">Informasi audit sistem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar bg-white flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-[12px] p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <UserIcon size={14} className="text-gray-400" />
                <span className="text-[10px] text-gray-400 font-bold tracking-wide">Pelaku</span>
              </div>
              <p className="text-sm font-bold text-gray-700">
                {log.recorded_by_name
                  ? `${log.recorded_by_name} (@${log.recorded_by})`
                  : (log.recorded_by || 'System')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-[12px] p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <CalendarIcon size={14} className="text-gray-400" />
                <span className="text-[10px] text-gray-400 font-bold tracking-wide">Waktu</span>
              </div>
              <p className="text-sm font-bold text-gray-700">{formatLastUpdate(log.created_at)}</p>
            </div>
            <div className="bg-gray-50 rounded-[12px] p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Database size={14} className="text-gray-400" />
                <span className="text-[10px] text-gray-400 font-bold tracking-wide">Target</span>
              </div>
              <p className="text-sm font-bold text-gray-700 flex items-center gap-2 flex-wrap">
                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[11px] uppercase">{log.table_name}</span>
                <span>#{log.record_id}</span>
                {recordHref && (
                  <Link
                    href={recordHref}
                    className="text-[10px] font-bold text-green-600 hover:text-green-700 flex items-center gap-1"
                  >
                    Buka modul <ExternalLink size={11} />
                  </Link>
                )}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Info size={16} className="text-amber-500" />
              <span className="text-xs font-bold text-slate-500">Keterangan Aktivitas</span>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-[12px] text-sm text-gray-700 leading-relaxed font-medium">
              {log.message}
            </div>
          </div>

          {diffs.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <History size={16} className="text-blue-500" />
                <span className="text-xs font-bold text-slate-500">Perubahan Field (UPDATE)</span>
              </div>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="min-w-full text-left text-[11px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2 font-bold text-gray-400">Field</th>
                      <th className="px-3 py-2 font-bold text-gray-400">Sebelum</th>
                      <th className="px-3 py-2 font-bold text-gray-400">Sesudah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {diffs.map((d) => (
                      <tr key={d.key} className="hover:bg-blue-50/30">
                        <td className="px-3 py-2 font-bold text-gray-700">{d.key}</td>
                        <td className="px-3 py-2 text-rose-600 font-mono break-all">{d.before}</td>
                        <td className="px-3 py-2 text-emerald-700 font-mono break-all">{d.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {log.raw_data && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <History size={16} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-500">Snapshot Log</span>
                </div>
                <div className="mb-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={snapshotSearch}
                      onChange={(e) => setSnapshotSearch(e.target.value)}
                      placeholder="Cari field atau value..."
                      className="w-full h-8 pl-7 pr-2 rounded-lg border border-gray-100 text-[11px] font-medium text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-green-300"
                    />
                  </div>
                </div>
                <KeyValueTable data={snapshot} search={snapshotSearch} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-green-500" />
                    <span className="text-xs font-bold text-slate-500">Live Record</span>
                  </div>
                  {isLoadingLive && (
                    <span className="text-[10px] text-green-600 font-bold animate-pulse">MEMUAT...</span>
                  )}
                </div>
                <div className="mb-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={liveSearch}
                      onChange={(e) => setLiveSearch(e.target.value)}
                      placeholder="Cari field atau value..."
                      className="w-full h-8 pl-7 pr-2 rounded-lg border border-gray-100 text-[11px] font-medium text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-green-300"
                    />
                  </div>
                </div>
                {isLoadingLive ? (
                  <div className="bg-white rounded-[12px] overflow-hidden border border-gray-100 shadow-sm">
                    <div className="py-20 flex flex-col items-center justify-center opacity-30">
                      <Loader2 size={32} className="animate-spin text-black mb-4" strokeWidth={3} />
                    </div>
                  </div>
                ) : (
                  <KeyValueTable data={liveObj} search={liveSearch} />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 rounded-[8px] text-sm font-bold text-white hover:bg-green-700 transition-all shadow-sm shadow-green-200"
          >
            Tutup
          </button>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
