'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Loader2, History, Download } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useSearchParams, useRouter } from 'next/navigation';

import DateRangeCard from '@/components/DateRangeCard';
import ScrapingHeader from '@/components/ScrapingHeader';
import SearchAndReload from '@/components/SearchAndReload';
import { DataTable } from '@/components/ui/DataTable';
import TableFooter from '@/components/TableFooter';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatLastUpdate } from '@/lib/date-utils';
import { getDefaultScraperDateRange, hydrateScraperPeriod, persistScraperPeriod } from '@/lib/scraper-period';
import { highlightText } from '@/lib/highlight';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import { exportRowsToExcel } from '@/lib/export-excel';
import { toast } from '@/lib/toast';

function formatDateToYYYYMMDD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toApiDate(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function formatDatetime(iso: string) {
  try {
    return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch { return iso; }
}

function levelBadge(level: string) {
  if (level === 'ERROR') return 'bg-red-50 text-red-600 border-red-100';
  if (level === 'WARN')  return 'bg-amber-50 text-amber-600 border-amber-100';
  return 'bg-emerald-50 text-emerald-600 border-emerald-100';
}

const PAGE_SIZE = 50;
const STATE_KEY = 'usrLogState';
const PERIOD_KEY = 'UsrLog_scrapedPeriod';

interface DbRow {
  id: number;
  level: string;
  datetime: string;
  channel: string;
  username: string;
  pesan: string;
  data_json: string | null;
  tgl: string;
}

export default function LogAktivitasUserClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DbRow[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{ start: string; end: string } | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as 'success' | 'error', title: '', message: '' });
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('usrLog_columnWidths');
      return saved ? JSON.parse(saved) : { level: 90, datetime: 160, channel: 200, username: 120, pesan: 300, data_json: 340 };
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('usrLog_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('search') || '');
  const [highlightQuery, setHighlightQuery] = useState(() => searchParams.get('highlight') || searchParams.get('search') || '');

  const mountedRef = useRef(true);
  const isLoadingMore = useRef(false);
  const { selectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);

  useEffect(() => {
    setIsMounted(true);
    mountedRef.current = true;
    const hydrated = hydrateScraperPeriod({ stateKey: STATE_KEY, periodKey: PERIOD_KEY });
    setScrapedPeriod(hydrated.scrapedPeriod);
    setStartDate(hydrated.startDate);
    setEndDate(hydrated.endDate);
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setHighlightQuery(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') { setRefreshKey(k => k + 1); router.refresh(); }
    };
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, [router]);

  // Baca dari DB lokal
  useEffect(() => {
    if (!isMounted) return;
    let active = true;
    async function loadData() {
      if (!active || !mountedRef.current) return;
      setLoading(page === 1);
      const startTimer = performance.now();
      try {
        const params = new URLSearchParams({
          page: String(page), pageSize: String(PAGE_SIZE), q: debouncedQuery,
          start: formatDateToYYYYMMDD(startDate), end: formatDateToYYYYMMDD(endDate),
        });
        const res = await fetch(`/api/usr-log?${params}`);
        if (!res.ok) throw new Error('Gagal memuat data');
        const json = await res.json();
        if (active) {
          setData(prev => {
            const rows = json.data || [];
            if (page === 1) return rows;
            const ids = new Set((prev || []).map((d: DbRow) => d.id));
            return [...(prev || []), ...rows.filter((d: DbRow) => !ids.has(d.id))];
          });
          setTotalCount(json.total || 0);
          if (json.scrapedPeriod) setScrapedPeriod(json.scrapedPeriod);
          if (json.lastUpdated) setLastUpdated(formatLastUpdate(new Date(json.lastUpdated)));
          setLoadTime(Math.round(performance.now() - startTimer));
        }
      } catch (err: unknown) {
        if (active) { setError(err instanceof Error ? err.message : 'Gagal memuat'); setData([]); }
      } finally {
        if (active) { setLoading(false); isLoadingMore.current = false; }
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate, isMounted]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && !isLoadingMore.current && (data?.length || 0) < totalCount) {
      isLoadingMore.current = true;
      setPage(p => p + 1);
    }
  }, [loading, data, totalCount]);

  // Tarik dari Digit → simpan ke DB
  const handleFetch = async () => {
    persistScraperPeriod({ stateKey: STATE_KEY, periodKey: PERIOD_KEY }, startDate, endDate);
    setError(''); setData([]); setPage(1); setLoading(true); setSearchQuery('');
    try {
      const params = new URLSearchParams({ stgl_awal: toApiDate(startDate), stgl_akhir: toApiDate(endDate) });
      const res = await fetch(`/api/scrape-usr-log?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      localStorage.setItem('sintak_data_updated', Date.now().toString());
      setRefreshKey(k => k + 1);
      setDialog({ isOpen: true, type: 'success', title: 'Berhasil', message: `Berhasil menarik ${json.total || 0} log aktivitas user.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal tarik data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = useCallback(async () => {
    if (!totalCount) { toast.error('Tidak ada data untuk diekspor'); return; }
    setIsExporting(true);
    try {
      // Fetch semua data dari DB (bukan hanya yang sudah di-scroll)
      const params = new URLSearchParams({
        page: '1', pageSize: String(totalCount),
        q: debouncedQuery,
        start: formatDateToYYYYMMDD(startDate), end: formatDateToYYYYMMDD(endDate),
      });
      const res = await fetch(`/api/usr-log?${params}`);
      const json = await res.json();
      const all: DbRow[] = json.data || [];
      const rows = all.map(r => ({
        Level: r.level,
        Waktu: formatDatetime(r.datetime),
        Channel: r.channel,
        User: r.username,
        Pesan: r.pesan,
        Data: r.data_json || '',
      }));
      const period = scrapedPeriod ? `${scrapedPeriod.start}_${scrapedPeriod.end}` : 'export';
      await exportRowsToExcel(rows, `log-aktivitas-user_${period}`);
      toast.success(`${rows.length} log berhasil diekspor`);
    } catch {
      toast.error('Gagal export');
    } finally {
      setIsExporting(false);
    }
  }, [totalCount, debouncedQuery, startDate, endDate, scrapedPeriod]);

  const columns = useMemo<ColumnDef<DbRow>[]>(() => [
    {
      accessorKey: 'level',
      header: 'Level',
      size: 90,
      cell: ({ getValue }: any) => {
        const lvl = String(getValue());
        return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${levelBadge(lvl)}`}>{lvl}</span>;
      },
    },
    {
      accessorKey: 'datetime',
      header: 'Waktu',
      size: 160,
      cell: ({ getValue, row }: any) => (
        <span className={`font-semibold tabular-nums text-[11px] ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-500'}`}>
          {formatDatetime(String(getValue()))}
        </span>
      ),
    },
    {
      accessorKey: 'channel',
      header: 'Channel',
      size: 200,
      cell: ({ getValue, row }: any) => (
        <span className={`font-semibold ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-700'}`}>
          {highlightText(String(getValue() || '—'), highlightQuery)}
        </span>
      ),
    },
    {
      accessorKey: 'username',
      header: 'User',
      size: 120,
      cell: ({ getValue }: any) => (
        <span className="text-[11px] font-bold text-gray-400">@{String(getValue() || '—')}</span>
      ),
    },
    {
      accessorKey: 'pesan',
      header: 'Pesan',
      size: 300,
      cell: ({ getValue, row }: any) => (
        <span className={`font-medium ${row.getIsSelected() ? 'text-emerald-800' : 'text-gray-700'}`}>
          {highlightText(String(getValue() || '—'), highlightQuery)}
        </span>
      ),
    },
    {
      // ponytail: data_json truncated preview + title tooltip — virtualizer fixed-height tidak support expand
      accessorKey: 'data_json',
      header: 'Data',
      size: 340,
      cell: ({ getValue, row }: any) => {
        const raw = getValue() as string | null;
        if (!raw) return <span className="text-gray-300 text-[11px]">—</span>;
        let entries: [string, unknown][] = [];
        try { entries = Object.entries(JSON.parse(raw)).filter(([, v]) => v !== null && v !== ''); } catch { return <span className="text-gray-400 text-[11px]">{raw}</span>; }
        if (!entries.length) return <span className="text-gray-300 text-[11px]">—</span>;
        const full = entries.map(([k, v]) => `${k}: ${String(v)}`).join('\n');
        const text = entries.map(([k, v]) => `${k}: ${String(v)}`).join(' · ');
        return <span title={full} className={`text-[10.5px] truncate block ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-500'}`}>{text}</span>;
      },
    },
  ], [highlightQuery]);

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      <DateRangeCard
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onFetch={handleFetch}
        isFetching={loading}
        fetchText="Tarik Data"
      />

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0" /><p>{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <ScrapingHeader title="Log Aktivitas User" icon={<History size={16} />} lastUpdated={lastUpdated} scrapedPeriod={scrapedPeriod} />
            {loading && data && data.length > 0 && (
              <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm animate-pulse leading-none">
                <Loader2 size={12} className="animate-spin" /><span>Memproses Data...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchAndReload
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onReload={() => setRefreshKey(k => k + 1)}
                loading={loading}
                placeholder="Cari channel, user, atau pesan..."
              />
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting || !data?.length}
              className="flex items-center gap-2 px-4 h-9 rounded-xl border border-emerald-200 bg-emerald-50 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Export Excel
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden relative">
          <DataTable
            columns={columns}
            data={data || []}
            isLoading={loading}
            onScroll={handleScroll}
            selectedIds={selectedIds}
            onRowClick={handleRowClick}
            columnWidths={columnWidths}
            onColumnWidthChange={setColumnWidths}
            rowHeight="h-11"
          />
          <TableFooter
            totalCount={totalCount}
            currentCount={data?.length || 0}
            label="log"
            selectedCount={selectedIds.size}
            onClearSelection={clearSelection}
            loadTime={loadTime}
          />
        </div>
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
