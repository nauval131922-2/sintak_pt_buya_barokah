'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Loader2, ChevronDown, ChevronUp, Calendar, User, AlertCircle } from 'lucide-react';
import TableFooter from '@/components/TableFooter';
import DatePicker from '@/components/DatePicker';
import { toast } from '@/lib/toast';

const API_URL = '/api/usr-log';
const PAGE_SIZE = 50;

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | string;

interface UserLogRow {
  Level: LogLevel;
  Datetime: string;
  Channel: string;
  User: string;
  Pesan: string;
  Data?: Record<string, unknown>;
}

/** Format Date → "DD-MM-YYYY" (format yg dipakai API Digit) */
function toApiDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

function today() { return new Date(); }

function levelBadge(level: LogLevel) {
  const base = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold';
  if (level === 'ERROR') return `${base} bg-red-100 text-red-700`;
  if (level === 'WARN')  return `${base} bg-amber-100 text-amber-700`;
  return `${base} bg-emerald-100 text-emerald-700`;
}

function formatDatetime(iso: string) {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function DataDetail({ data }: { data: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== '' && v !== undefined);
  if (entries.length === 0) return <span className="text-gray-300 text-[11px]">—</span>;
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {open ? 'Sembunyikan' : 'Lihat detail'}
      </button>
      {open && (
        <div className="mt-1.5 bg-gray-50 border border-gray-100 rounded-lg p-2 space-y-0.5 max-h-48 overflow-auto text-[11px]">
          {entries.map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-gray-400 font-semibold shrink-0 min-w-[100px]">{k}</span>
              <span className="text-gray-700 break-all">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LogAktivitasUserClient() {
  const [tglAwal, setTglAwal] = useState<Date>(today());
  const [tglAkhir, setTglAkhir] = useState<Date>(today());
  const [rows, setRows] = useState<UserLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [lastFetch, setLastFetch] = useState<string | null>(null);

  const load = useCallback(async (awal: Date, akhir: Date) => {
    setLoading(true);
    setError('');
    setRows([]);
    setPage(1);
    try {
      const body = new URLSearchParams({
        'bsearch[stgl_awal]': toApiDate(awal),
        'bsearch[stgl_akhir]': toApiDate(akhir),
        '_': Date.now().toString(),
      });
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // API bisa return array langsung atau { data: [] }
      const data: UserLogRow[] = Array.isArray(json) ? json : (json.data ?? json.rows ?? []);
      setRows(data);
      setLastFetch(new Date().toLocaleTimeString('id-ID'));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal memuat data';
      setError(msg);
      toast.error('Gagal memuat log: ' + msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tglAwal, tglAkhir); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const paged = useMemo(() => rows.slice(0, page * PAGE_SIZE), [rows, page]);
  const hasMore = paged.length < rows.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <DatePicker
          name="tgl_awal"
          label="Tanggal Awal"
          value={tglAwal}
          onChange={d => setTglAwal(d)}
        />
        <DatePicker
          name="tgl_akhir"
          label="Tanggal Akhir"
          value={tglAkhir}
          onChange={d => setTglAkhir(d)}
        />
        <button
          onClick={() => load(tglAwal, tglAkhir)}
          disabled={loading}
          className="flex items-center gap-2 px-4 h-9 rounded-xl bg-emerald-600 text-white text-[12.5px] font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors self-end"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Tampilkan
        </button>

        <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-400 self-end pb-1">
          {lastFetch && <span>Diperbarui {lastFetch}</span>}
          <span className="font-semibold text-gray-600">{rows.length} log</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-700 text-[12px] font-semibold border-b border-red-100">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 w-20">Level</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 w-40">Waktu</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 w-36">Channel</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 w-28">
                <span className="flex items-center gap-1"><User size={11} />User</span>
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400">Pesan</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 w-32">Data</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Loader2 size={24} className="animate-spin text-emerald-500 mx-auto" />
                </td>
              </tr>
            )}
            {!loading && paged.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                  <Calendar size={32} className="mx-auto mb-2 text-gray-200" />
                  Tidak ada log pada periode ini
                </td>
              </tr>
            )}
            {paged.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-2.5">
                  <span className={levelBadge(row.Level)}>{row.Level}</span>
                </td>
                <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{formatDatetime(row.Datetime)}</td>
                <td className="px-4 py-2.5 text-gray-600 font-medium">{row.Channel}</td>
                <td className="px-4 py-2.5 text-gray-600">{row.User}</td>
                <td className="px-4 py-2.5 text-gray-700">{row.Pesan}</td>
                <td className="px-4 py-2.5">
                  {row.Data ? <DataDetail data={row.Data} /> : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="px-5 py-3 border-t border-gray-100 flex justify-center">
          <button
            onClick={() => setPage(p => p + 1)}
            className="text-[12px] font-semibold text-emerald-600 hover:underline"
          >
            Muat lebih banyak ({rows.length - paged.length} tersisa)
          </button>
        </div>
      )}
      {!hasMore && rows.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <TableFooter totalCount={rows.length} currentCount={paged.length} label="log" />
        </div>
      )}
    </div>
  );
}
