'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import LastUpdatedBadge from '@/components/LastUpdatedBadge';

interface JurnalRow {
  id: number | string;
  tgl?: string | null;
  shift?: string | number | null;
  nama_karyawan?: string | null;
  no_order?: string | null;
  nama_order?: string | null;
  no_order_2?: string | null;
  nama_order_2?: string | null;
  jenis_pekerjaan_2?: string | null;
  jenis_pekerjaan?: string | null;
  bagian?: string | null;
  target: number;
  realisasi: number;
  created_at?: string | null;
  recorded_by?: string | null;
  input_at?: string | null;
  action_type?: string | null;
}

const numberFormatter = new Intl.NumberFormat('id-ID');

function getActionBadge(action?: string | null) {
  // Fallback ke INSERT untuk data lama yang tidak punya activity_log
  const act = action || 'INSERT';
  switch (act) {
    case 'INSERT': return { label: 'INSERT', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'UPDATE': return { label: 'UPDATE', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'DELETE': return { label: 'DELETE', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:       return { label: act,       cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  }
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatDateTime(value?: string | null) {
  if (!value) return null;
  try {
    // SQLite CURRENT_TIMESTAMP menyimpan UTC tanpa 'Z', misal "2026-05-17 08:30:00"
    // Tambahkan 'Z' agar diparse sebagai UTC, bukan local time
    const normalized = value.includes('T') || value.endsWith('Z') || value.includes('+')
      ? value
      : value.replace(' ', 'T') + 'Z';
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(d);
  } catch { return null; }
}

export default function JurnalTerbaruCard({ initialData }: { initialData: JurnalRow[] }) {
  const [data, setData] = useState<JurnalRow[]>(initialData);

  const fetchData = useCallback(() => {
    fetch('/api/dashboard/jurnal-terbaru')
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) setData(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => fetchData();
    const storageHandler = (e: StorageEvent) => { if (e.key === 'sintak_data_updated') fetchData(); };
    window.addEventListener('sintak:data-updated', handler);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('sintak:data-updated', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, [fetchData]);

  const lastUpdated = useAutoRefresh(fetchData);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-gray-400 tracking-widest">Jurnal terbaru</p>
          <p className="text-[13px] font-bold text-gray-700 mt-0.5">8 entri produksi terakhir</p>
          <LastUpdatedBadge lastUpdated={lastUpdated} />
        </div>
        <Link
          href="/jurnal-harian-produksi"
          className="group text-[11px] font-bold text-green-600 hover:text-green-700 flex items-center gap-1 shrink-0 mt-0.5"
        >
          Lihat semua
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Action</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Waktu Aktivitas / User</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Tgl. jurnal / Shift</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Karyawan / Bagian</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Order realisasi</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 tracking-wider whitespace-nowrap">Pekerjaan real</th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-400 tracking-wider text-right whitespace-nowrap">Target / Real</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((journal) => {
                const inputAt = formatDateTime(journal.input_at);
                const isDeleted = journal.action_type === 'DELETE';
                const b = getActionBadge(journal.action_type);
                return (
                  <tr key={journal.id} className={`transition-colors ${
                    isDeleted ? 'bg-rose-50/40 opacity-60 hover:opacity-80' : 'hover:bg-gray-50/70'
                  }`}>
                    {/* Action badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border tracking-wider ${b.cls}`}>{b.label}</span>
                    </td>
                    {/* Waktu input + user */}
                    <td className="px-5 py-3 min-w-[160px]">
                      <p className="text-[11px] font-bold text-gray-600">{inputAt ?? '—'}</p>
                      <p className="text-[10px] font-semibold text-gray-400">{journal.recorded_by || ''}</p>
                    </td>
                    {/* Tanggal jurnal + shift */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <p className="text-[12px] font-bold text-gray-700">{formatDate(journal.tgl)}</p>
                      <p className="text-[10px] font-semibold text-gray-400">Shift {journal.shift || '-'}</p>
                    </td>
                    {/* Nama karyawan + bagian */}
                    <td className="px-5 py-3 min-w-[150px]">
                      <p className="text-[12px] font-bold text-gray-700 line-clamp-1">{journal.nama_karyawan || '-'}</p>
                      <p className="text-[10px] font-semibold text-gray-400 line-clamp-1">{journal.bagian || '-'}</p>
                    </td>
                    {/* Order realisasi */}
                    <td className="px-5 py-3 min-w-[170px]">
                      <p className="text-[12px] font-bold text-gray-700 line-clamp-1">
                        {journal.nama_order_2 || journal.no_order_2 || '—'}
                      </p>
                      <p className="text-[10px] font-semibold text-gray-400">
                        {(journal.no_order_2 && journal.nama_order_2) ? journal.no_order_2 : ''}
                      </p>
                    </td>
                    {/* Pekerjaan real */}
                    <td className="px-5 py-3 min-w-[160px]">
                      <span className={`inline-flex text-[11px] font-bold rounded-lg px-2 py-1 line-clamp-1 ${
                        journal.jenis_pekerjaan_2
                          ? 'text-sky-700 bg-sky-50 border border-sky-100'
                          : 'text-gray-300'
                      }`}>
                        {journal.jenis_pekerjaan_2 || '—'}
                      </span>
                    </td>
                    {/* Target / Realisasi */}
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <p className="text-[12px] font-extrabold text-gray-800">{numberFormatter.format(journal.realisasi)}</p>
                      <p className="text-[10px] font-semibold text-gray-400">target {numberFormatter.format(journal.target)}</p>
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
            Belum ada jurnal produksi yang tercatat.
          </div>
        </div>
      )}
    </div>
  );
}
