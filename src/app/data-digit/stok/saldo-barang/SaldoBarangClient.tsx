'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DownloadCloud, Loader2, AlertCircle } from 'lucide-react';
import TableFooter from '@/components/TableFooter';
import SearchAndReload from '@/components/SearchAndReload';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import DatePicker from '@/components/DatePicker';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import { highlightText } from '@/lib/highlight';

interface SaldoRow {
  id: string;
  kode: string;
  tgl: string;
  nama: string;
  kd_satuan: string;
  saldo: number;
  kd_golongan: string;
  kd_kelompok: string;
  status: string;
  n_persd: number;
  n_hp: number;
}

function todayIso(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  return wib.toISOString().slice(0, 10);
}

function isoToDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const PAGE_SIZE = 50;

export default function SaldoBarangClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [tgl, setTgl] = useState(() => searchParams.get('tgl') || todayIso());
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('search') || '');
  const [highlightQuery, setHighlightQuery] = useState(() => searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<SaldoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [available, setAvailable] = useState<{ tgl: string; n: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ page: number; fetched: number } | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as 'success' | 'error', title: '', message: '' });
  const urlSearchRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const { selectedIds, handleRowClick, clearSelection } = useTableSelection(rows);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saldoBarang_columnWidths');
      if (saved) return JSON.parse(saved);
    }
    return {
      kode: 120, nama: 350, kd_satuan: 100, saldo: 120, n_persd: 130, status: 100, kd_kelompok: 200,
    };
  });

  useEffect(() => {
    localStorage.setItem('saldoBarang_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    setIsMounted(true);
    mountedRef.current = true;
    const savedLastUpdate = localStorage.getItem('SaldoBarangClient_lastUpdated');
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlTgl = searchParams.get('tgl');
    if (urlSearch !== null) {
      urlSearchRef.current = urlSearch;
      setSearchQuery(urlSearch);
      setDebouncedQuery(urlSearch);
      setHighlightQuery(urlSearch);
      setPage(1);
    }
    if (urlTgl && /^\d{4}-\d{2}-\d{2}$/.test(urlTgl)) {
      setTgl(urlTgl);
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery !== urlSearchRef.current) setHighlightQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [sorting, setSorting] = useState<Array<{ id: string; desc: boolean }>>([]);

  const handleSortingChange = useCallback((updater: unknown) => {
    setSorting((prev) => (typeof updater === 'function' ? (updater as (o: Array<{ id: string; desc: boolean }>) => Array<{ id: string; desc: boolean }>)(prev) : updater as Array<{ id: string; desc: boolean }>));
    setPage(1);
  }, []);

  const load = useCallback(async (p: number, date: string, keyword: string, sort: Array<{ id: string; desc: boolean }>) => {
    setLoading(p === 1);
    setError('');
    const startTimer = performance.now();
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE), tgl: date, q: keyword });
      if (sort.length > 0) params.set('sort', JSON.stringify(sort));
      const res = await fetch(`/api/saldo-barang?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat data');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal memuat');
      if (!mountedRef.current) return;
      setRows((json.data || []).map((r: Record<string, unknown>) => ({ ...r, id: String(r.kode) })));
      setTotal(json.total || 0);
      setAvailable(json.available ?? []);
      if (json.lastUpdated) setLastUpdated(String(json.lastUpdated));
      setLoadTime(Math.round(performance.now() - startTimer));
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : String(e));
        setRows([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    load(page, tgl, debouncedQuery, sorting);
  }, [page, tgl, debouncedQuery, sorting, isMounted, load]);

  useEffect(() => {
    if (!isMounted) return;
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('search', debouncedQuery);
    if (tgl) params.set('tgl', tgl);
    const qs = params.toString();
    router.replace(qs ? `/data-digit/stok/saldo-barang?${qs}` : '/data-digit/stok/saldo-barang', { scroll: false });
  }, [debouncedQuery, tgl, isMounted, router]);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setLoading(true);
      setError('');
      setPage(1);
      setSyncProgress(null);
      let polls = 0;
      const poll = setInterval(async () => {
        polls += 1;
        // ponytail: max ~5 menit (150x2s); Digit lambat tapi 13rb baris kelar jauh sebelum itu
        if (polls > 150) { clearInterval(poll); return; }
        try {
          const pr = await fetch('/api/scrape-saldo-barang?progress=1');
          const pj = await pr.json();
          if (pj.progress && !pj.progress.done && mountedRef.current) {
            setSyncProgress({ page: Number(pj.progress.page) || 0, fetched: Number(pj.progress.fetched) || 0 });
          }
        } catch { /* abaikan kegagalan polling */ }
      }, 2000);
      try {
        const res = await fetch(`/api/scrape-saldo-barang?tgl=${tgl}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || json.details || 'Gagal sinkronisasi data');
      const now = new Date();
      localStorage.setItem('SaldoBarangClient_lastUpdated', now.toISOString());
      await load(1, tgl, debouncedQuery, sorting);
        setDialog({ isOpen: true, type: 'success', title: 'Berhasil', message: `Berhasil menarik ${Number(json.total).toLocaleString('id-ID')} kode saldo per ${json.tgl}.` });
      } finally {
        clearInterval(poll);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSyncing(false);
      setLoading(false);
      setSyncProgress(null);
    }
  };

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const columns = useMemo(() => [
    {
      accessorKey: 'kode',
      header: 'Kode',
      size: 120,
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight transition-colors ${row.getIsSelected() ? 'text-emerald-600' : 'text-gray-700'}`}>{highlightText(String(getValue()), highlightQuery)}</span>
    },
    {
      accessorKey: 'nama',
      header: 'Nama Barang',
      size: 350,
      cell: ({ getValue, row }: any) => <span className={`font-bold tracking-tight block truncate ${row.getIsSelected() ? 'text-emerald-900' : 'text-gray-800'}`} title={String(getValue())}>{highlightText(String(getValue()), highlightQuery)}</span>
    },
    {
      accessorKey: 'kd_satuan',
      header: 'Satuan',
      size: 100,
      cell: ({ getValue, row }: any) => <span className={`font-bold transition-colors ${row.getIsSelected() ? 'text-emerald-700' : 'text-slate-600'}`}>{String(getValue() || '—')}</span>
    },
    {
      accessorKey: 'saldo',
      header: 'Saldo',
      size: 120,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => <span className={`font-extrabold tabular-nums px-2 py-1 rounded bg-emerald-50/50 ${row.getIsSelected() ? 'text-emerald-800' : 'text-emerald-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    {
      accessorKey: 'n_persd',
      header: 'N Persediaan',
      size: 130,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-emerald-700' : 'text-slate-700'}`}>{Number(getValue() || 0).toLocaleString('id-ID')}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      cell: ({ getValue, row }: any) => {
        const val = String(getValue() || '');
        const aktif = val === 'Aktif';
        return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{val || '—'}</span>;
      }
    },
    {
      accessorKey: 'kd_kelompok',
      header: 'Kelompok',
      size: 200,
      cell: ({ getValue, row }: any) => <span className={`font-medium block truncate ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-600'}`} title={String(getValue())}>{highlightText(String(getValue() || '—'), highlightQuery)}</span>
    },
  ], [highlightQuery]);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm shadow-red-900/5 text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1">Tanggal posisi</label>
              <DatePicker name="tgl" value={isoToDate(tgl)} onChange={(d) => { setTgl(dateToIso(d)); setPage(1); }} />
              {lastUpdated && (
                <p className="mt-1 text-[11px] font-bold text-gray-400 leading-none">Update: {lastUpdated.split('|')[0].slice(0, 16).replace('T', ' ')}</p>
              )}
            </div>
            <button
              onClick={handleSync}
               disabled={isSyncing || loading}
               className="shrink-0 w-full sm:w-auto min-w-[140px] px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-[12px] font-bold shadow-sm shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn relative overflow-hidden"
             >
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
               <span className="relative z-10 flex items-center gap-2">
                 {isSyncing ? (
                   <><Loader2 size={16} className="animate-spin" /> {syncProgress ? `Menarik page ${syncProgress.page} (${syncProgress.fetched.toLocaleString('id-ID')} baris)...` : 'Sedang Menarik...'}</>
                 ) : (
                   <><DownloadCloud size={16} className="group-hover/btn:-translate-y-0.5 transition-transform duration-300" /> Tarik Data</>
                 )}
               </span>
             </button>
            <div className="flex-1 min-w-[200px]">
              <SearchAndReload
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onReload={() => load(page, tgl, debouncedQuery, sorting)}
                loading={loading}
                placeholder="Cari berdasarkan kode, nama barang, atau kelompok..."
              />
            </div>
 
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden relative">
          <DataTable
            columns={columns}
            data={rows}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            manualSorting
            isLoading={loading}
            selectedIds={selectedIds}
            onRowClick={handleRowClick}
            columnWidths={columnWidths}
            onColumnWidthChange={setColumnWidths}
            rowHeight="h-11"
          />
          <TableFooter
            totalCount={total}
            currentCount={rows.length}
            label="Saldo Barang"
            selectedCount={selectedIds.size}
            onClearSelection={clearSelection}
            loadTime={loadTime}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog({ ...dialog, isOpen: false })}
      />
    </div>
  );
}
