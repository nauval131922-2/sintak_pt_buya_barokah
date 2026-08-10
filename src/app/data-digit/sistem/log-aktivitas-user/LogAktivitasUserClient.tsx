'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Loader2, History, Download } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useSearchParams } from 'next/navigation';

import DateRangeCard from '@/components/DateRangeCard';
import ScrapingHeader from '@/components/ScrapingHeader';
import SearchAndReload from '@/components/SearchAndReload';
import { DataTable } from '@/components/ui/DataTable';
import TableFooter from '@/components/TableFooter';
import { formatLastUpdate } from '@/lib/date-utils';
import { getDefaultScraperDateRange } from '@/lib/scraper-period';
import { highlightText } from '@/lib/highlight';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import { exportRowsToExcel } from '@/lib/export-excel';
import { toast } from '@/lib/toast';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | string;

interface UserLogRow {
  id: number;
  Level: LogLevel;
  Datetime: string;
  Channel: string;
  User: string;
  Pesan: string;
  Data?: Record<string, unknown>;
}

function toApiDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

function formatDatetime(iso: string) {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  } catch { return iso; }
}

function levelBadge(level: LogLevel) {
  if (level === 'ERROR') return 'bg-red-50 text-red-600 border-red-100';
  if (level === 'WARN')  return 'bg-amber-50 text-amber-600 border-amber-100';
  return 'bg-emerald-50 text-emerald-600 border-emerald-100';
}

const PAGE_SIZE = 50;

export default function LogAktivitasUserClient() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [startDate, setStartDate] = useState<Date>(() => getDefaultScraperDateRange().startDate);
  const [endDate, setEndDate] = useState<Date>(() => getDefaultScraperDateRange().endDate);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserLogRow[] | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scrapedPeriod, setScrapedPeriod] = useState<{ start: string; end: string } | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('search') || '');
  const [highlightQuery, setHighlightQuery] = useState(() => searchParams.get('highlight') || searchParams.get('search') || '');

  const mountedRef = useRef(true);
  const isLoadingMore = useRef(false);

  const { selectedIds, handleRowClick, clearSelection } = useTableSelection(data || []);

  useEffect(() => {
    setIsMounted(true);
    mountedRef.current = true;
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

  const filtered = useMemo(() => {
    const all = data || [];
    if (!debouncedQuery) return all;
    const q = debouncedQuery.toLowerCase();
    return all.filter(r =>
      r.Channel?.toLowerCase().includes(q) ||
      r.User?.toLowerCase().includes(q) ||
      r.Pesan?.toLowerCase().includes(q) ||
      r.Level?.toLowerCase().includes(q)
    );
  }, [data, debouncedQuery]);

  const paged = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 300 && !loading && !isLoadingMore.current && paged.length < filtered.length) {
      isLoadingMore.current = true;
      setPage(prev => prev + 1);
    }
  }, [loading, paged.length, filtered.length]);

  useEffect(() => {
    if (!isLoadingMore.current) return;
    isLoadingMore.current = false;
  }, [page]);

  const handleFetch = useCallback(async () => {
    if (!mountedRef.current || !isMounted) return;
    setLoading(true);
    setError('');
    setData([]);
    setPage(1);
    setSearchQuery('');
    const startTimer = performance.now();
    try {
      const params = new URLSearchParams({ stgl_awal: toApiDate(startDate), stgl_akhir: toApiDate(endDate) });
      const res = await fetch(`/api/usr-log?${params}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const rows: UserLogRow[] = (Array.isArray(json) ? json : (json.data ?? json.rows ?? []))
        .map((r: Omit<UserLogRow, 'id'>, i: number) => ({ ...r, id: i }));
      if (mountedRef.current) {
        setData(rows);
        setLastUpdated(formatLastUpdate(new Date()));
        setScrapedPeriod({ start: toApiDate(startDate), end: toApiDate(endDate) });
        setLoadTime(Math.round(performance.now() - startTimer));
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat data';
        setError(msg);
        setData([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [startDate, endDate, isMounted]);

  // Reload manual: hanya reset search/filter, tidak re-fetch dari Digit
  // (tidak ada DB lokal — data hanya diperbarui saat user klik "Tarik Data")
  const handleReload = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setPage(1);
  }, []);

  const handleExport = useCallback(async () => {
    if (!filtered.length) { toast.error('Tidak ada data untuk diekspor'); return; }
    setIsExporting(true);
    try {
      const rows = filtered.map(r => ({
        Level: r.Level,
        Waktu: formatDatetime(r.Datetime),
        Channel: r.Channel,
        User: r.User,
        Pesan: r.Pesan,
        Data: r.Data ? JSON.stringify(r.Data) : '',
      }));
      const period = scrapedPeriod ? `${scrapedPeriod.start}_${scrapedPeriod.end}` : 'export';
      await exportRowsToExcel(rows, `log-aktivitas-user_${period}`);
      toast.success(`${rows.length} log berhasil diekspor`);
    } finally {
      setIsExporting(false);
    }
  }, [filtered, scrapedPeriod]);

  const columns = useMemo<ColumnDef<UserLogRow>[]>(() => [
    {
      accessorKey: 'Level',
      header: 'Level',
      size: 90,
      cell: ({ getValue }: any) => {
        const lvl = String(getValue());
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${levelBadge(lvl)}`}>
            {lvl}
          </span>
        );
      },
    },
    {
      accessorKey: 'Datetime',
      header: 'Waktu',
      size: 160,
      cell: ({ getValue, row }: any) => (
        <span className={`font-semibold tabular-nums text-[11px] ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-500'}`}>
          {formatDatetime(String(getValue()))}
        </span>
      ),
    },
    {
      accessorKey: 'Channel',
      header: 'Channel',
      size: 200,
      cell: ({ getValue, row }: any) => (
        <span className={`font-semibold ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-700'}`}>
          {highlightText(String(getValue() || '—'), highlightQuery)}
        </span>
      ),
    },
    {
      accessorKey: 'User',
      header: 'User',
      size: 120,
      cell: ({ getValue }: any) => (
        <span className="text-[11px] font-bold text-gray-400">@{String(getValue() || '—')}</span>
      ),
    },
    {
      accessorKey: 'Pesan',
      header: 'Pesan',
      size: 300,
      cell: ({ getValue, row }: any) => (
        <span className={`font-medium ${row.getIsSelected() ? 'text-emerald-800' : 'text-gray-700'}`}>
          {highlightText(String(getValue() || '—'), highlightQuery)}
        </span>
      ),
    },
    {
      // ponytail: Data sebagai teks truncated + title tooltip — virtualizer fixed-height tidak support expand inline
      accessorKey: 'Data',
      header: 'Data',
      size: 340,
      cell: ({ getValue, row }: any) => {
        const val = getValue() as Record<string, unknown> | undefined;
        if (!val) return <span className="text-gray-300 text-[11px]">—</span>;
        const entries = Object.entries(val).filter(([, v]) => v !== null && v !== '' && v !== undefined);
        if (!entries.length) return <span className="text-gray-300 text-[11px]">—</span>;
        const full = entries.map(([k, v]) => `${k}: ${String(v)}`).join('\n');
        const preview = entries.slice(0, 3).map(([k, v]) => {
          const vs = String(v);
          return `${k}: ${vs.length > 30 ? vs.slice(0, 30) + '…' : vs}`;
        }).join(' · ') + (entries.length > 3 ? ` +${entries.length - 3}` : '');
        return (
          <span
            title={full}
            className={`text-[10.5px] truncate block ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-500'}`}
          >
            {preview}
          </span>
        );
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
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px]">
            <ScrapingHeader
              title="Log Aktivitas User"
              icon={<History size={16} />}
              lastUpdated={lastUpdated}
              scrapedPeriod={scrapedPeriod}
            />
            {loading && data && data.length > 0 && (
              <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm animate-pulse leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses Data...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchAndReload
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onReload={handleReload}
                loading={loading}
                placeholder="Cari channel, user, atau pesan..."
              />
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting || !filtered.length}
              className="flex items-center gap-2 px-4 h-9 rounded-xl border border-gray-200 bg-white text-[12px] font-semibold text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Export Excel
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden relative">
          <DataTable
            columns={columns}
            data={paged}
            isLoading={loading}
            onScroll={handleScroll}
            selectedIds={selectedIds}
            onRowClick={handleRowClick}
            rowHeight="h-11"
          />
          <TableFooter
            totalCount={filtered.length}
            currentCount={paged.length}
            label="log"
            selectedCount={selectedIds.size}
            onClearSelection={clearSelection}
            loadTime={loadTime}
          />
        </div>
      </div>
    </div>
  );
}
