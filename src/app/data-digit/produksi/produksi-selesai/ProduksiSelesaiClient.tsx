'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SortingState } from '@tanstack/react-table';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import TableFooter from '@/components/TableFooter';
import SearchAndReload from '@/components/SearchAndReload';
import ScrapingHeader from '@/components/ScrapingHeader';
import DateRangeCard from '@/components/DateRangeCard';
import TableTitle from '@/components/TableTitle';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import { formatLastUpdate } from '@/lib/date-utils';
import { getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod } from '@/lib/scraper-period';
import { splitDateRangeIntoMonths } from '@/lib/date-utils';
import { highlightText } from '@/lib/highlight';

const STATE_KEY  = 'produksiSelesaiState';
const PERIOD_KEY = 'ProduksiSelesaiClient_scrapedPeriod';

function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fmtDDMMYYYY(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

const PAGE_SIZE = 50;

interface ProduksiSelesaiRecord {
  id: number;
  faktur: string;
  faktur_so: string;
  tgl: string;
  kd_pelanggan: string;
  nama_prd: string;
  kd_mtd: string;
  kd_gudang: string;
  kd_regu: string;
  datetime_mulai: string | null;
  datetime_selesai: string | null;
  tglclose: string;
  fkt_selesai: string;
  hp: number | null;
  bbb: number | null;
  status: string;
}

export default function ProduksiSelesaiClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProduksiSelesaiRecord[] | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{start: string, end: string} | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize search state from URL ?search= if present
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('search') || '');
  const [highlightQuery, setHighlightQuery] = useState(() => searchParams.get('highlight') || searchParams.get('search') || '');
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'tglclose', desc: true }]);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [scrapeStatus, setScrapeStatus] = useState('');
  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as 'success' | 'error' | 'danger' | 'alert' | 'confirm', title: '', message: '' });
  const urlSearchRef = useRef<string | null>(null);

  const { selectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('produksi_selesai_columnWidths');
      if (saved) return JSON.parse(saved);
    }
    return {
      id: 60, tgl: 130, faktur: 220, nama_prd: 380, kd_pelanggan: 200,
      kd_mtd: 150, kd_gudang: 180, kd_regu: 120,
      datetime_mulai: 170, datetime_selesai: 170, tglclose: 130,
      hp: 140, bbb: 140, status: 100,
    };
  });

  useEffect(() => {
    setIsMounted(true);
    const hydrated = hydrateScraperPeriod({ stateKey: STATE_KEY, periodKey: PERIOD_KEY });
    setStartDate(hydrated.startDate);
    setEndDate(hydrated.endDate);
  }, []);

  // Simpan tanggal ke localStorage setiap kali startDate/endDate berubah
  // agar persisten saat reload — sama seperti behavior order produksi
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(STATE_KEY, JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sessionDate: new Date().toLocaleDateString('en-CA'),
      fetchedOn: new Date().toLocaleDateString('en-CA'),
    }));
  }, [startDate, endDate, isMounted]);

  useEffect(() => {
    // If URL search parameter changes, sync it to state
    const urlSearch = searchParams.get('search');
    const urlHighlight = searchParams.get('highlight');
    if (urlSearch !== null) {
      urlSearchRef.current = urlSearch;
      setSearchQuery(urlSearch);
      setDebouncedQuery(urlSearch);
      setHighlightQuery(urlHighlight || urlSearch);
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(searchQuery); if (searchQuery !== urlSearchRef.current) setHighlightQuery(searchQuery); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSortingChange = useCallback((updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
    setSorting(prev => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      setPage(1);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    let active = true;
    async function load() {
      setLoading(true);
      const t0 = performance.now();
      try {
        const fmt = (d: Date) => fmtDDMMYYYY(d);
        const sortParam = sorting.length > 0
          ? `&sortBy=${sorting[0].id}&sortDir=${sorting[0].desc ? 'desc' : 'asc'}`
          : '';
        const url = `/api/produksi-selesai?page=${page}&limit=${PAGE_SIZE}`
          + `&search=${encodeURIComponent(debouncedQuery)}`
          + `&startDate=${fmt(startDate)}&endDate=${fmt(endDate)}`
          + sortParam
          + `&_t=${Date.now()}`;

        const res = await fetch(url);
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setData(json.data || []);
            setTotalCount(json.total || 0);
            setTotalPages(Math.ceil((json.total || 0) / PAGE_SIZE));
            setLoadTime(Math.round(performance.now() - t0));
            setError('');
            if (json.lastUpdated) setLastUpdated(formatLastUpdate(new Date(json.lastUpdated)));
            if (json.scrapedPeriod) setScrapedPeriod(json.scrapedPeriod);
          }
        }
      } catch (e: any) {
        if (active) setError(e.message || 'Gagal memuat data');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [isMounted, page, debouncedQuery, refreshKey, startDate, endDate, sorting]);

  const handleFetch = async () => {
    if (!startDate || !endDate) return;
    // Simpan state tanggal ke localStorage sebelum scrape — sama seperti order produksi
    localStorage.setItem(STATE_KEY, JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      sessionDate: new Date().toLocaleDateString('en-CA'),
      fetchedOn: new Date().toLocaleDateString('en-CA'),
    }));
    setIsScraping(true);
    setScrapeProgress(0);
    setScrapeStatus('');
    setError('');
    setData([]);
    setPage(1);

    const startStr = formatDateToYYYYMMDD(startDate);
    const endStr   = formatDateToYYYYMMDD(endDate);
    const chunks   = splitDateRangeIntoMonths(startStr, endStr);

    let completed = 0;
    let totalScraped = 0;
    const queue = [...chunks];
    const concurrency = 10;

    const worker = async () => {
      while (queue.length > 0) {
        const chunk = queue.shift();
        if (!chunk) break;
        try {
          const res = await fetch(`/api/scrape-produksi-selesai?start=${chunk.start}&end=${chunk.end}&silent=true`);
          if (res.ok) {
            const json = await res.json();
            totalScraped += json.total || 0;
          }
        } catch {}
        completed++;
        setScrapeProgress(Math.round((completed / chunks.length) * 100));
        setScrapeStatus(`Memproses ${completed}/${chunks.length} bulan...`);
      }
    };

    await Promise.all(Array(Math.min(concurrency, chunks.length)).fill(null).map(worker));

    // Simpan period ke localStorage — sama seperti pola OrderProduksiClient
    persistScraperPeriod(
      { stateKey: STATE_KEY, periodKey: PERIOD_KEY },
      startDate,
      endDate,
    );

    // Update period total ke DB — timpa key period utama setelah semua chunk selesai
    const fullStart = fmtDDMMYYYY(startDate);
    const fullEnd   = fmtDDMMYYYY(endDate);
    fetch('/api/system-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'last_scrape_produksi_selesai_period', value: JSON.stringify({ start: fullStart, end: fullEnd }) }),
    });
    fetch('/api/activity-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_type: 'SCRAPE',
        table_name: 'produksi_selesai',
        message: `Scrape produksi selesai berhasil: ${totalScraped} baris (${fullStart} - ${fullEnd}).`,
        raw_data: JSON.stringify({ total: totalScraped, start: fullStart, end: fullEnd }),
      }),
    });

    setIsScraping(false);
    setRefreshKey(k => k + 1);
    localStorage.setItem('sintak_data_updated', Date.now().toString());
    setDialog({
      isOpen: true,
      type: 'success',
      title: 'Berhasil',
      message: `Berhasil menarik ${totalScraped} data Produksi Selesai.`,
    });
  };

  const handleResize = useCallback((widths: Record<string, number>) => {
    setColumnWidths(widths);
    localStorage.setItem('produksi_selesai_columnWidths', JSON.stringify(widths));
  }, []);

  const formatTgl = (val: any) => {
    if (!val) return '—';
    const parts = String(val).split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
      return `${parts[0]} ${months[parseInt(parts[1]) - 1] || parts[1]} ${parts[2]}`;
    }
    return String(val);
  };

  const formatDateTime = (val: any) => {
    if (!val) return '—';
    // Format: "2026-06-06 15:37:20" → "06 Jun 2026 15:37"
    const [datePart, timePart] = String(val).split(' ');
    if (!datePart) return String(val);
    const [y, m, d] = datePart.split('-');
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const time = timePart ? timePart.slice(0, 5) : '';
    return `${d} ${months[parseInt(m) - 1] || m} ${y}${time ? ' ' + time : ''}`;
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'No.',
      size: 60,
      meta: { sticky: true },
      cell: ({ row }: any) => (
        <span className={`font-medium tabular-nums ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-400'}`}>
          {(page - 1) * PAGE_SIZE + row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: 'tgl',
      header: 'Tanggal',
      size: 130,
      meta: { sticky: true },
      cell: ({ getValue, row }: any) => (
        <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-700'}`}>
          {formatTgl(getValue())}
        </span>
      ),
    },
    {
      accessorKey: 'faktur',
      header: 'No. Faktur',
      size: 220,
      meta: { sticky: true },
      cell: ({ getValue, row }: any) => (
        <span className={`font-semibold tracking-tight text-[12px] ${row.getIsSelected() ? 'text-emerald-600' : 'text-gray-700'}`}>
          {highlightText(String(getValue() || '—'), highlightQuery)}
        </span>
      ),
    },
    {
      accessorKey: 'nama_prd',
      header: 'Nama Produksi',
      size: 380,
      meta: { sticky: true },
      cell: ({ getValue, row }: any) => (
        <span
          className={`font-semibold text-[12px] truncate block ${row.getIsSelected() ? 'text-emerald-900' : 'text-gray-800'}`}
          title={String(getValue())}
        >
          {highlightText(String(getValue() || '—'), highlightQuery)}
        </span>
      ),
    },
    {
      accessorKey: 'kd_pelanggan',
      header: 'Pelanggan',
      size: 200,
      cell: ({ getValue }: any) => (
        <span className="text-[12px] font-medium text-gray-600 truncate block" title={String(getValue())}>
          {highlightText(String(getValue() || '—'), highlightQuery)}
        </span>
      ),
    },
    {
      accessorKey: 'kd_mtd',
      header: 'Metode',
      size: 150,
      cell: ({ getValue }: any) => (
        <span className="text-[11px] font-bold text-gray-500">{String(getValue() || '—')}</span>
      ),
    },
    {
      accessorKey: 'kd_gudang',
      header: 'Gudang',
      size: 180,
      cell: ({ getValue }: any) => (
        <span className="text-[11px] font-medium text-gray-500 truncate block" title={String(getValue())}>
          {String(getValue() || '—')}
        </span>
      ),
    },
    {
      accessorKey: 'kd_regu',
      header: 'Regu / Shift',
      size: 120,
      cell: ({ getValue }: any) => (
        <span className="text-[11px] font-bold text-gray-500">{String(getValue() || '—')}</span>
      ),
    },
    {
      accessorKey: 'datetime_mulai',
      header: 'Mulai',
      size: 170,
      cell: ({ getValue }: any) => (
        <span className="text-[11px] font-medium text-gray-600 tabular-nums">{formatDateTime(getValue())}</span>
      ),
    },
    {
      accessorKey: 'datetime_selesai',
      header: 'Selesai',
      size: 170,
      cell: ({ getValue }: any) => (
        <span className="text-[11px] font-medium text-emerald-700 tabular-nums">{formatDateTime(getValue())}</span>
      ),
    },
    {
      accessorKey: 'tglclose',
      header: 'Tgl Close',
      size: 130,
      cell: ({ getValue }: any) => (
        <span className="text-[12px] font-bold tabular-nums text-gray-700">{formatTgl(getValue())}</span>
      ),
    },
    {
      accessorKey: 'hp',
      header: 'Harga Pokok',
      size: 140,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => {
        const val = getValue();
        if (val == null) return <span className="text-gray-300 italic text-[11px]">—</span>;
        return (
          <span className={`font-bold tabular-nums text-[12px] ${row.getIsSelected() ? 'text-emerald-700' : 'text-blue-600'}`}>
            {Number(val).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      accessorKey: 'bbb',
      header: 'BBB',
      size: 140,
      meta: { align: 'right' },
      cell: ({ getValue, row }: any) => {
        const val = getValue();
        if (val == null) return <span className="text-gray-300 italic text-[11px]">—</span>;
        return (
          <span className={`font-bold tabular-nums text-[12px] ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-700'}`}>
            {Number(val).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      meta: { align: 'center' },
      cell: ({ getValue }: any) => {
        const val = String(getValue() || '');
        return val === '1' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
            <CheckCircle2 size={11} /> Selesai
          </span>
        ) : (
          <span className="text-[11px] font-bold text-gray-400">{val || '—'}</span>
        );
      },
    },
  ], [page, highlightQuery]);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
      <DateRangeCard
        title="Tanggal Selesai Produksi"
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onFetch={handleFetch}
        isFetching={loading || isScraping}
        progress={isScraping ? scrapeProgress : undefined}
        statusText={isScraping ? scrapeStatus : undefined}
        fetchText="Tarik Data"
      />

      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <ScrapingHeader
              title="Data Produksi Selesai"
              lastUpdated={lastUpdated}
              scrapedPeriod={scrapedPeriod}
            />
            {loading && (data?.length || 0) > 0 && (
              <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm animate-pulse leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses...</span>
              </div>
            )}
          </div>
          <SearchAndReload
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onReload={() => setRefreshKey(k => k + 1)}
            loading={loading}
            placeholder="Cari faktur, nama produksi, atau pelanggan..."
          />
        </div>

        {error && (
          <div className="mx-1 p-3 bg-red-50 border border-red-200 rounded-xl text-[12px] font-bold text-red-600">
            {error}
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          <DataTable
            data={data || []}
            columns={columns}
            columnWidths={columnWidths}
            onColumnWidthChange={handleResize}
            isLoading={loading || data === null}
            selectedIds={selectedIds}
            onRowClick={handleRowClick}
            rowHeight="h-11"
            sorting={sorting}
            onSortingChange={handleSortingChange}
            manualSorting
          />
        </div>

        <TableFooter
          totalCount={totalCount}
          currentCount={data?.length || 0}
          label="produksi selesai"
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
        onConfirm={() => setDialog(d => ({ ...d, isOpen: false }))}
      />
    </div>
  );
}
