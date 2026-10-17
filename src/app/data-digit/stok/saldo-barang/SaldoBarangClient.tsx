'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DownloadCloud,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import TableFooter from '@/components/TableFooter';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import DatePicker from '@/components/DatePicker';
import SquareDropdown from '@/components/SquareDropdown';
import { formatLastUpdate } from '@/lib/date-utils';
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

 const DEFAULT_GOLONGAN = [
   'Bahan Baku',
   'Bahan Penolong',
   'Barang Jadi Pesanan',
   'Sparepart Mesin',
   'Supplies Kantor',
   'Supplies Pabrik',
 ];
 const DEFAULT_STATUS = ['Aktif', 'Tidak Aktif'];
 const PAGE_SIZE = 50;
 
 
 export default function SaldoBarangClient() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const [isMounted, setIsMounted] = useState(false);
   const [tgl, setTgl] = useState(() => searchParams.get('tgl') || todayIso());
   const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
   const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('search') || '');
   const [highlightQuery, setHighlightQuery] = useState(() => searchParams.get('search') || '');
   const [golongan, setGolongan] = useState(() => searchParams.get('golongan') || '');
   const [status, setStatus] = useState(() => searchParams.get('status') || '');
   const [golonganOptions, setGolonganOptions] = useState<string[]>(DEFAULT_GOLONGAN);
   const [statusOptions, setStatusOptions] = useState<string[]>(DEFAULT_STATUS);
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
      kode: 120, nama: 350, kd_satuan: 100, saldo: 120, n_persd: 130, status: 100, kd_golongan: 160, kd_kelompok: 200,
    };
  });

  useEffect(() => {
    localStorage.setItem('saldoBarang_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    setIsMounted(true);
    mountedRef.current = true;
    const savedLastUpdate = localStorage.getItem('SaldoBarangClient_lastUpdated');
    if (savedLastUpdate) setLastUpdated(savedLastUpdate);
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlTgl = searchParams.get('tgl');
    const urlGol = searchParams.get('golongan');
    const urlStat = searchParams.get('status');
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
    if (urlGol !== null) {
      setGolongan(urlGol);
      setPage(1);
    }
    if (urlStat !== null) {
      setStatus(urlStat);
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

  const load = useCallback(async (p: number, date: string, keyword: string, sort: Array<{ id: string; desc: boolean }>, gol: string, stat: string) => {
    setLoading(p === 1);
    setError('');
    const startTimer = performance.now();
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE), tgl: date, q: keyword });
      if (gol) params.set('golongan', gol);
      if (stat) params.set('status', stat);
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
      if (Array.isArray(json.golonganList) && json.golonganList.length > 0) setGolonganOptions(json.golonganList);
      if (Array.isArray(json.statusList) && json.statusList.length > 0) setStatusOptions(json.statusList);
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
    load(page, tgl, debouncedQuery, sorting, golongan, status);
  }, [page, tgl, debouncedQuery, sorting, golongan, status, isMounted, load]);

  useEffect(() => {
    if (!isMounted) return;
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('search', debouncedQuery);
    if (tgl) params.set('tgl', tgl);
    if (golongan) params.set('golongan', golongan);
    if (status) params.set('status', status);
    const qs = params.toString();
    router.replace(qs ? `/data-digit/stok/saldo-barang?${qs}` : '/data-digit/stok/saldo-barang', { scroll: false });
  }, [debouncedQuery, tgl, golongan, status, isMounted, router]);

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
        await load(1, tgl, debouncedQuery, sorting, golongan, status);
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
      cell: ({ getValue }: any) => {
        const val = String(getValue() || '');
        const aktif = val === 'Aktif';
        return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${aktif ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{val || '—'}</span>;
      }
    },
    {
      accessorKey: 'kd_golongan',
      header: 'Golongan',
      size: 160,
      cell: ({ getValue, row }: any) => <span className={`font-medium block truncate ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-600'}`} title={String(getValue())}>{highlightText(String(getValue() || '—'), highlightQuery)}</span>
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
    <div className="flex-1 min-h-0 flex flex-col gap-4 animate-in fade-in duration-500 overflow-hidden">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-xs text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Toolbar 1 Baris Seimbang: [Tanggal & Tarik] -> [Reload & Search (flex-1)] -> [Filter Golongan & Status] */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2.5 flex items-center gap-2 flex-wrap shrink-0">
        {/* Grup 1: Tanggal Posisi & Tombol Tarik Data */}
        <div className="flex items-center gap-1.5 shrink-0">
          <DatePicker
            name="tgl"
            value={isoToDate(tgl)}
            onChange={(d) => { setTgl(dateToIso(d)); setPage(1); }}
            popupAlign="left"
            customTrigger={() => (
              <div
                className="h-9 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-500 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title={`Posisi Tgl: ${tgl}`}
              >
                <Calendar size={13} className="text-slate-400 shrink-0" />
                <span>{tgl}</span>
              </div>
            )}
          />

          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing || loading}
            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            title="Tarik Data dari Digit untuk tanggal ini"
          >
            {isSyncing ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span className="hidden sm:inline">{syncProgress ? `(${syncProgress.fetched.toLocaleString('id-ID')})...` : 'Menarik...'}</span>
              </>
            ) : (
              <>
                <DownloadCloud size={13} />
                <span>Tarik Data</span>
              </>
            )}
          </button>
        </div>

        {/* Pemisah Vertikal */}
        <div className="hidden sm:block h-6 w-px bg-slate-200 mx-0.5 shrink-0" />

        {/* Grup 2: Reload & Search Bar (flex-1) */}
        <button
          type="button"
          onClick={() => load(page, tgl, debouncedQuery, sorting, golongan, status)}
          disabled={loading}
          className="h-9 px-2.5 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
          title="Reload Data Saldo Barang"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          <span className="hidden md:inline">Reload</span>
        </button>

        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode, nama, golongan, kelompok..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-9 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>

        {/* Pemisah Vertikal */}
        <div className="hidden sm:block h-6 w-px bg-slate-200 mx-0.5 shrink-0" />

        {/* Grup 3: Filter Golongan & Status (Setelah Search Bar) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <SquareDropdown
            options={[
              { value: '', label: 'Semua Golongan' },
              ...golonganOptions.map((g) => ({ value: g, label: g })),
            ]}
            value={golongan}
            onChange={(val) => { setGolongan(val); setPage(1); }}
            placeholder="Semua Golongan"
            searchPlaceholder="Cari Golongan..."
            widthClass="w-40 sm:w-44 md:w-48"
          />

          <SquareDropdown
            options={[
              { value: '', label: 'Semua Status' },
              ...statusOptions.map((s) => ({ value: s, label: s })),
            ]}
            value={status}
            onChange={(val) => { setStatus(val); setPage(1); }}
            placeholder="Semua Status"
            searchPlaceholder="Cari Status..."
            widthClass="w-32 sm:w-36"
          />
        </div>

        {/* Tombol Reset Filter jika ada filter aktif */}
        {(golongan || status || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setGolongan('');
              setStatus('');
              setSearchQuery('');
              setPage(1);
            }}
            className="h-9 px-2.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-all flex items-center gap-1 cursor-pointer shrink-0"
            title="Reset semua filter"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Tabel Saldo Barang */}
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
