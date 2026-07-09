'use client';

import { useState, useEffect, useCallback, useTransition, useRef, useMemo, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Database, Loader2, Calendar, X, Table2, Zap, User, ChevronUp, ChevronDown, Trash2, BarChart3, Copy
} from 'lucide-react';
import ActivityLogExportMenu from './ActivityLogExportMenu';
import SearchableDropdown from '@/components/SearchableDropdown';
import { formatLastUpdate } from '@/lib/date-utils';
import SearchAndReload from '@/components/SearchAndReload';
import DatePicker from '@/components/DatePicker';
import ConfirmDialog from '@/components/ConfirmDialog';
import TableFooter from '@/components/TableFooter';
import { toast } from '@/lib/toast';
import { cleanupActivityLogs } from '@/lib/actions';
import {
  type ActivityLogRow,
  type DatePreset,
  DATE_PRESETS,
  getDatePresetRange,
  getDefaultActivityLogFilters,
  detectActiveDatePreset,
  getActionColor,
  toPlainActivityRows,
  formatDateStrId,
  computeExplicitDiff,
  stringifyAuditData,
} from '@/lib/activity-log-utils';
import type { ActivityLogSortField } from '@/lib/activity-log-query';
import {
  buildActivityLogUrl,
  hasActivityLogUrlFilters,
  mergeActivityLogState,
  parseActivityLogUrl,
} from '@/lib/activity-log-url';
import ActivityLogTrendChart from './ActivityLogTrendChart';
import type { ActivityLogTrendDay } from '@/app/api/activity-log/trend/route';

interface MatchInfo { field: string; label: string; value: string; }

const MATCH_FIELDS: { key: keyof ActivityLogRow; label: string; extract: (l: ActivityLogRow) => string }[] = [
  { key: 'action_type', label: 'Aksi', extract: (l) => l.action_type || '' },
  { key: 'table_name', label: 'Tabel', extract: (l) => l.table_name || '' },
  { key: 'recorded_by', label: 'User', extract: (l) => l.recorded_by_name || l.recorded_by || '' },
  { key: 'message', label: 'Keterangan', extract: (l) => l.message || '' },
];
function getMatchedFields(log: ActivityLogRow, q: string): MatchInfo[] {
  if (!q.trim()) return [];
  const t = q.toLowerCase();
  const fromFields = MATCH_FIELDS
    .map(({ label, extract }) => ({ field: label, value: extract(log), label }))
    .filter(({ value }) => value.toLowerCase().includes(t));
  if (fromFields.length >= 2) return fromFields.slice(0, 2);
  if (log.raw_data) {
    try {
      const raw = JSON.parse(log.raw_data as string);
      const data = raw.before || raw.after || raw;
      if (typeof data === 'object' && data) {
        for (const [key, val] of Object.entries(data)) {
          if (String(val).toLowerCase().includes(t)) {
            fromFields.push({ field: key, value: String(val).slice(0, 80), label: key });
            if (fromFields.length >= 2) break;
          }
        }
      }
    } catch {}
  }
  return fromFields.slice(0, 2);
}

// ponytail: highlight helper — wrap matches dengan <mark>
function highlightText(text: string, search: string): React.ReactNode {
  if (!search.trim()) return text;
  const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === search.toLowerCase() 
      ? <mark key={i} className="bg-yellow-200 text-gray-900 px-0.5 rounded">{part}</mark>
      : part
  );
}

// ponytail: copy to clipboard helper
function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} berhasil disalin`),
    () => toast.error('Gagal menyalin')
  );
}

function strToDate(s: string): Date { return new Date(`${s}T12:00:00+07:00`); }
function dateToStr(d: Date): string { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d); }

type ServerDateDefaults = ReturnType<typeof getDefaultActivityLogFilters>;

function buildBaseState(defaults: ServerDateDefaults) {
  return {
    ...defaults,
    sortBy: 'created_at' as ActivityLogSortField,
    sortDir: 'desc' as const,
  };
}

function SortHeader({ label, field, colIdx, sortBy, sortDir, onSort, onCtx, onResize }: {
  label: string; field: ActivityLogSortField; colIdx: number;
  sortBy: ActivityLogSortField; sortDir: 'asc' | 'desc';
  onSort: (f: ActivityLogSortField) => void;
  onCtx: (i: number, e: React.MouseEvent) => void;
  onResize: (i: number, e: React.MouseEvent) => void;
}) {
  const active = sortBy === field;
  return (
    <th className="px-4 py-3 relative border-r border-gray-200" onContextMenu={(e) => onCtx(colIdx, e)}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-green-700 transition-colors ${active ? 'text-green-700' : ''}`}
      >
        {label}
        {active ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronDown size={12} className="opacity-30" />}
      </button>
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500 active:bg-green-600 transition-colors z-20"
        onMouseDown={(e) => onResize(colIdx, e)}
        title="Drag untuk resize kolom"
      />
    </th>
  );
}

export default function ActivityLogClient({
  canAdminLogs = false,
  serverDateDefaults,
}: {
  canAdminLogs?: boolean;
  serverDateDefaults: ServerDateDefaults;
}) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const deepLinkHandled = useRef(false);
  const skipUrlSync = useRef(true);

  const baseState = useMemo(() => buildBaseState(serverDateDefaults), [serverDateDefaults]);

  const initialState = useRef(
    mergeActivityLogState(
      baseState,
      hasActivityLogUrlFilters(urlSearchParams) ? parseActivityLogUrl(urlSearchParams) : {}
    )
  ).current;

  const source = 'active';
  const [search, setSearch] = useState(initialState.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initialState.search);
  const [deepSearch, setDeepSearch] = useState(false); // ponytail: toggle untuk cari di raw_data JSON
  const [total, setTotal] = useState(0);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [from, setFrom] = useState(initialState.from);
  const [to, setTo] = useState(initialState.to);
  const [datePreset, setDatePreset] = useState<DatePreset | null>(initialState.datePreset);
  const [tableName, setTableName] = useState(initialState.tableName);
  const [actionType, setActionType] = useState(initialState.actionType);
  const [recordedBy, setRecordedBy] = useState(initialState.recordedBy);
  const [sortBy, setSortBy] = useState<ActivityLogSortField>(initialState.sortBy);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialState.sortDir);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(120);
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
  const [actionStats, setActionStats] = useState<{ value: string; count: number }[]>([]);
  const [tableStats, setTableStats] = useState<{ value: string; count: number }[]>([]);
  const [userStats, setUserStats] = useState<{ value: string; label: string; count: number }[]>([]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{
    tables: string[];
    actions: string[];
    users: { value: string; label: string }[];
  }>({ tables: [], actions: [], users: [] });

  const [expandedId, setExpandedId] = useState<number | string | null>(null);
  const [isPending] = useTransition();
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'danger' | 'success' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
  });
  const [showChart, setShowChart] = useState(false);
  const [isChartMounted, setIsChartMounted] = useState(false);
  const [trendDays, setTrendDays] = useState<ActivityLogTrendDay[]>([]);
  const [trendHourly, setTrendHourly] = useState<{ hour: string; count: number }[]>([]);
  const [trendGroupBy, setTrendGroupBy] = useState<string>('day'); // 'day' | 'week' | 'month'
  const [detailHour, setDetailHour] = useState<string | null>(null);
  const [minuteData, setMinuteData] = useState<{ minute: string; count: number }[]>([]);
  const [isFetchingTrend, setIsFetchingTrend] = useState(false);
  const statsFetchId = useRef(0);
  const logsFetchId = useRef(0);
  const trendFetchId = useRef(0);
  const fetchAcRef = useRef<AbortController | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ponytail: scroll table ke atas tiap ganti page
  useEffect(() => { scrollContainerRef.current?.scrollTo(0, 0); }, [page]);
  // ponytail: column resize like hasil produksi
  const COL_DEFAULTS = [110, 150, 180, 140, 600];
  const COL_MIN = [80, 100, 120, 100, 300];
  const [colWidths, setColWidths] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('activityLog_colWidths');
      return saved ? JSON.parse(saved) : COL_DEFAULTS;
    } catch {
      return COL_DEFAULTS;
    }
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('activityLog_colWidths', JSON.stringify(colWidths));
    } catch {}
  }, [colWidths]);

  const resizingRef = useRef(false);
  const [ctxCol, setCtxCol] = useState<{ i: number; x: number; y: number; val: string } | null>(null);

  useEffect(() => {
    if (!ctxCol) return;
    const g = (e: KeyboardEvent) => { if (e.key === 'Escape') setCtxCol(null); };
    document.addEventListener('keydown', g);
    return () => { document.removeEventListener('keydown', g); };
  }, [ctxCol]);

  const colCtx = (i: number, e: React.MouseEvent) => {
    e.preventDefault();
    setCtxCol({ i, x: e.clientX, y: e.clientY, val: String(colWidths[i]) });
  };

  const colResizeStart = (i: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = true;
    const startX = e.clientX;
    const startW = colWidths[i];
    const tableEl = (e.currentTarget as HTMLElement).closest('table');
    const colEls = tableEl?.querySelectorAll('colgroup > col');
    
    const move = (e: MouseEvent) => {
      const w = Math.max(COL_MIN[i], startW + e.clientX - startX);
      // ponytail: update DOM langsung biar ga trigger React re-render + table layout recalc
      if (colEls?.[i]) (colEls[i] as HTMLElement).style.width = `${w}px`;
    };
    
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      // commit final widths ke React state
      if (colEls) {
        const finalWidths = Array.from(colEls).map((el) => parseInt((el as HTMLElement).style.width) || COL_DEFAULTS[Array.from(colEls).indexOf(el)]);
        setColWidths(finalWidths);
      }
      setTimeout(() => { resizingRef.current = false; }, 10);
    };
    
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  // Save showChart state to localStorage (only after mount to avoid hydration issues)
  useEffect(() => {
    if (!isChartMounted) return;
    localStorage.setItem('activityLog_showChart', String(showChart));
  }, [showChart, isChartMounted]);

  // Restore showChart from localStorage after mount (avoid hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem('activityLog_showChart');
    if (saved) setShowChart(saved === 'true');
    setIsChartMounted(true);
  }, []);

  const buildParams = useCallback(
    (extra?: Record<string, string>) => {
      const p = new URLSearchParams({
        from,
        to,
        page: String(page),
        pageSize: '50',
        source,
        ...extra,
      });
      if (debouncedSearch) {
        p.set('search', debouncedSearch);
        if (deepSearch) p.set('deepSearch', '1'); // ponytail: enable raw_data search
      }
      if (tableName) p.set('tableName', tableName);
      if (actionType) p.set('actionType', actionType);
      if (recordedBy) p.set('recordedBy', recordedBy);
      p.set('sortBy', sortBy);
      p.set('sortDir', sortDir);
      return p;
    },
    [from, to, debouncedSearch, deepSearch, tableName, actionType, recordedBy, source, sortBy, sortDir, page]
  );

  const fetchLogs = useCallback(
    async () => {
      const signal = fetchAcRef.current?.signal;
      if (signal?.aborted) return;
      const fid = ++logsFetchId.current;
      setIsFetchingLogs(true);
      const start = performance.now();
      try {
        const res = await fetch(`/api/activity-log?${buildParams().toString()}`, { signal });
        const data = await res.json();
        if (logsFetchId.current !== fid) return;
        if (data.success) {
          const rows = toPlainActivityRows(data.data || []);
          setLogs(rows);
          setTotal(data.total ?? 0);
          setLastUpdated(new Date());
          setCountdown(120);
          setPage(data.page ?? 1);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch { /* ignore */ } finally {
        if (logsFetchId.current !== fid) return;
        setIsFetchingLogs(false);
        if (!signal?.aborted) {
          setLoadTime(Math.round(performance.now() - start));
        }
      }
    },
    [buildParams]
  );

  useEffect(() => {
    const t = setTimeout(() => { skipUrlSync.current = false; }, 0);
    return () => clearTimeout(t);
  }, []);

  const fetchTrend = useCallback(async () => {
    const signal = fetchAcRef.current?.signal;
      if (signal?.aborted) return;
    const fid = ++trendFetchId.current;
    setIsFetchingTrend(true);
    try {
      const p = buildParams();
      p.delete('page');
      p.delete('pageSize');
      p.delete('stats');
      if (detailHour) p.set('detailHour', detailHour);
      const res = await fetch(`/api/activity-log/trend?${p.toString()}`, { signal });
      const data = await res.json();
      if (trendFetchId.current !== fid) return;
      if (data.success) {
        setTrendDays(data.days || []);
        setTrendHourly(data.hourly || []);
        setTrendGroupBy(data.groupBy || 'day');
        if (data.minutes) setMinuteData(data.minutes);
      }
    } catch { /* ignore */ } finally {
      if (trendFetchId.current !== fid) return;
      setIsFetchingTrend(false);
    }
  }, [buildParams, detailHour]);

  const fetchStats = useCallback(async () => {
    const signal = fetchAcRef.current?.signal;
    if (signal?.aborted) return;
    const fid = ++statsFetchId.current;
    try {
      const p = buildParams({ stats: '1' });
      const res = await fetch(`/api/activity-log?${p.toString()}`, { signal });
      const data = await res.json();
      if (statsFetchId.current !== fid) return;
      if (data.success) {
        if (data.actionStats) setActionStats(data.actionStats);
        if (data.tableStats) setTableStats(data.tableStats);
        if (data.userStats) setUserStats(data.userStats);
      }
    } catch { /* ignore */ }
  }, [buildParams]);

  // Cancel pending fetches immediately when user clicks a navigation link —
  // prevents stale responses from triggering state updates after navigation starts.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[href]');
      if (!link) return;
      const href = (link as HTMLAnchorElement).href;
      if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;
      if (href.startsWith(window.location.origin) || href.startsWith('/')) {
        fetchAcRef.current?.abort();
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetch('/api/activity-log/filters', { signal: ac.signal })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setFilterOptions({
            tables: res.tables || [],
            actions: res.actions || [],
            users: res.users || [],
          });
        }
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // ponytail: reset page ke 1 kalau filter berubah
  useEffect(() => { setPage(1); }, [from, to, debouncedSearch, deepSearch, tableName, actionType, recordedBy, source, sortBy, sortDir]);

  useEffect(() => {
    const ac = new AbortController();
    fetchAcRef.current = ac;
    fetchLogs();
    fetchTrend();
    fetchStats();
    return () => { if (fetchAcRef.current === ac) fetchAcRef.current = null; ac.abort(); };
  }, [fetchLogs, fetchTrend, fetchStats]);

  useEffect(() => {
    if (skipUrlSync.current) return;
    const target = buildActivityLogUrl(
      {
        source, from, to, tableName, actionType, recordedBy, search, sortBy, sortDir, datePreset,
      },
      undefined // ponytail: jangan sync expandedId ke URL — nulis id ke URL trigger Suspense reload → collapse
    );
    const targetQs = target.includes('?') ? target.split('?')[1]! : '';
    if (targetQs !== urlSearchParams.toString()) {
      router.replace(target, { scroll: false });
    }
  }, [
    source, from, to, tableName, actionType, recordedBy, search, sortBy, sortDir, datePreset,
    router, urlSearchParams,
  ]);

  useEffect(() => {
    const id = urlSearchParams.get('id');
    if (!id || deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    setExpandedId(id);
  }, [urlSearchParams]);



  const refreshCallback = useCallback(() => {
    fetchLogs();
    fetchTrend();
    fetchStats();
  }, [fetchLogs, fetchTrend, fetchStats]);

  const handleCleanup = async () => {
    setDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await cleanupActivityLogs({
        from: from || undefined,
        to: to || undefined,
        tableName: tableName || undefined,
        actionType: actionType || undefined,
      } as { from?: string; to?: string; tableName?: string; actionType?: string });
      if (res.success) {
        toast.success(`Berhasil menghapus ${res.deletedCount.toLocaleString('id-ID')} log.`);
        // Clear filters after successful cleanup
        setTableName('');
        setActionType('');
        setRecordedBy('');
        setSearch('');
        refreshCallback();
      } else {
        toast.error('Gagal membersihkan log.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal membersihkan log.');
    } finally {
      setDialog({ isOpen: false, type: 'confirm', title: '', message: '' });
    }
  };

  const triggerCleanupConfirm = () => {
    setDialog({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Log Sesuai Filter',
      message: `Apakah Anda yakin ingin menghapus log dengan filter saat ini?\n\n` +
        `• Rentang: ${from ? formatDateStrId(from) : '—'} s/d ${to ? formatDateStrId(to) : '—'}\n` +
        `• Tabel: ${tableName || 'Semua tabel'}\n` +
        `• Action: ${actionType || 'Semua action'}\n\n` +
        `Tindakan ini akan menghapus data secara permanen dari database log aktif dan tidak dapat dibatalkan.`,
      onConfirm: handleCleanup,
    });
  };

  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshCallback, 120 * 1000);
    return () => clearInterval(interval);
  }, [refreshCallback]);

  // ponytail: pause auto-refresh kalau tab inactive
  const refreshCallbackRef = useRef(refreshCallback);
  refreshCallbackRef.current = refreshCallback;
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) refreshCallbackRef.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const handleTrendDay = (date: string) => {
    // ponytail: smart date range based on grouping
    if (date.includes('-W')) {
      // Weekly format: YYYY-Www → set range to that week
      // Gunakan SQLite %W logic (bukan ISO) — konsisten dengan trend API
      const [year, week] = date.split('-W');
      const yearNum = parseInt(year);
      const weekNum = parseInt(week);
      
      // Cari first Monday di tahun ini (SQLite %W week 1 starts from first Monday)
      const firstMonday = new Date(yearNum, 0, 1);
      while (firstMonday.getDay() !== 1) {
        firstMonday.setDate(firstMonday.getDate() + 1);
      }
      
      let wFrom: string, wTo: string;
      if (weekNum <= 0) {
        // %W 00 = partial week sebelum first Monday
        wFrom = dateToStr(new Date(yearNum, 0, 1));
        wTo = dateToStr(new Date(firstMonday.getTime() - 86400000));
      } else {
        const targetMonday = new Date(firstMonday);
        targetMonday.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
        const sunday = new Date(targetMonday);
        sunday.setDate(targetMonday.getDate() + 6);
        wFrom = dateToStr(targetMonday);
        wTo = dateToStr(sunday);
      }
      
      setFrom(wFrom);
      setTo(wTo);
      setDatePreset(detectActiveDatePreset(wFrom, wTo));
    } else if (date.match(/^\d{4}-\d{2}$/)) {
      // Monthly format: YYYY-MM → set range to that month
      const [year, month] = date.split('-');
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0);
      const newFrom = firstDay;
      const newTo = dateToStr(lastDay);
      setFrom(newFrom);
      setTo(newTo);
      setDatePreset(detectActiveDatePreset(newFrom, newTo));
    } else {
      // Daily format: YYYY-MM-DD → set exact date
      const newFrom = date;
      const newTo = date;
      setFrom(newFrom);
      setTo(newTo);
      setDatePreset(detectActiveDatePreset(newFrom, newTo));
    }
  };

  const urlFilterState = useCallback(
    () => ({
      source,
      from,
      to,
      tableName,
      actionType,
      recordedBy,
      search,
      sortBy,
      sortDir,
      datePreset,
    }),
    [source, from, to, tableName, actionType, recordedBy, search, sortBy, sortDir, datePreset]
  );

  const userItemLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const u of filterOptions.users) {
      map[u.value] = u.label && u.label !== u.value ? `${u.label} (${u.value})` : u.value;
    }
    return map;
  }, [filterOptions.users]);

  const hasActiveFilters =
    source !== serverDateDefaults.source ||
    from !== serverDateDefaults.from ||
    to !== serverDateDefaults.to ||
    !!tableName ||
    !!actionType ||
    !!recordedBy ||
    !!search;

  const applyPreset = (preset: DatePreset) => {
    const range = getDatePresetRange(preset);
    setFrom(range.from);
    setTo(range.to);
    setDatePreset(preset);
  };

  const handleFromChange = (d: Date) => {
    setFrom(dateToStr(d));
    setDatePreset(detectActiveDatePreset(dateToStr(d), to));
  };

  const handleToChange = (d: Date) => {
    setTo(dateToStr(d));
    setDatePreset(detectActiveDatePreset(from, dateToStr(d)));
  };

  const toggleSort = (field: ActivityLogSortField) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const clearFilters = () => {
    const fresh = getDefaultActivityLogFilters();
    setFrom(fresh.from);
    setTo(fresh.to);
    setDatePreset(fresh.datePreset);
    setTableName('');
    setActionType('');
    setRecordedBy('');
    setSearch('');
    setSortBy('created_at');
    setSortDir('desc');
  };

  const handleExport = (includeRawData: boolean) => {
    const p = buildParams();
    p.delete('page');
    p.delete('pageSize');
    p.delete('stats');
    p.set('limit', '5000');
    if (includeRawData) p.set('includeRawData', '1');
    window.open(`/api/activity-log/export?${p.toString()}`, '_blank');
  };

  const toggleExpand = (log: ActivityLogRow) => {
    setExpandedId(prev => prev === log.id ? null : log.id);
  };

  return (
    <div ref={pageRef} className="flex flex-col gap-3 w-full animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 shrink-0 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.key)}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                  datePreset === p.key
                    ? 'bg-green-600 text-white border-green-600 shadow-sm shadow-green-200'
                    : 'bg-white text-gray-600 border-gray-100 hover:border-green-200 hover:text-green-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-100 bg-rose-50 text-[10px] font-bold text-rose-600 hover:bg-rose-100 transition-all shrink-0"
            >
              <X size={12} /> Clear filter
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <DatePicker
              name="from"
              value={from ? strToDate(from) : null}
              onChange={handleFromChange}
              popupAlign="right"
              customTrigger={(toggle) => (
                <button type="button" onClick={toggle}
                  className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[11px] font-semibold text-gray-700">
                  <Calendar size={11} className="text-gray-400" />
                  <span suppressHydrationWarning>{from ? formatDateStrId(from) : 'Dari'}</span>
                </button>
              )}
            />
            <span className="text-[11px] font-bold text-gray-400">—</span>
            <DatePicker
              name="to"
              value={to ? strToDate(to) : null}
              onChange={handleToChange}
              popupAlign="right"
              customTrigger={(toggle) => (
                <button type="button" onClick={toggle}
                  className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[11px] font-semibold text-gray-700">
                  <Calendar size={11} className="text-gray-400" />
                  <span suppressHydrationWarning>{to ? formatDateStrId(to) : 'Sampai'}</span>
                </button>
              )}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SearchableDropdown
            id="activity-log-table"
            value={tableName}
            items={filterOptions.tables}
            onChange={setTableName}
            placeholder="Semua tabel"
            allLabel="Semua tabel"
            searchPlaceholder="Cari tabel..."
            triggerWidth="w-[170px]"
            compact
            icon={<Table2 size={14} className={tableName ? 'text-green-600' : 'text-gray-400'} />}
          />
          <SearchableDropdown
            id="activity-log-action"
            value={actionType}
            items={filterOptions.actions}
            onChange={setActionType}
            placeholder="Semua action"
            allLabel="Semua action"
            searchPlaceholder="Cari action..."
            triggerWidth="w-[150px]"
            compact
            icon={<Zap size={14} className={actionType ? 'text-green-600' : 'text-gray-400'} />}
          />
          <SearchableDropdown
            id="activity-log-user"
            value={recordedBy}
            items={filterOptions.users.map((u) => u.value)}
            itemLabels={userItemLabels}
            onChange={setRecordedBy}
            placeholder="Semua user"
            allLabel="Semua user"
            searchPlaceholder="Cari user..."
            triggerWidth="w-[190px]"
            compact
            icon={<User size={14} className={recordedBy ? 'text-green-600' : 'text-gray-400'} />}
          />

          <div className="flex items-center gap-2 ml-auto">
            <ActivityLogExportMenu onExport={handleExport} />

            {canAdminLogs && (
              <button
                type="button"
                onClick={triggerCleanupConfirm}
                title="Hapus Log Sesuai Filter"
                className="h-8 px-3 rounded-lg border border-rose-100 bg-rose-50 text-[10px] font-bold text-rose-600 hover:bg-rose-100 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <Trash2 size={12} /> Hapus Log
              </button>
            )}
          </div>
        </div>

        {(actionStats.length > 0 || tableStats.length > 0 || userStats.length > 0) && (
          <div className="grid grid-cols-1 gap-2">
            {actionStats.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide shrink-0 pt-1">Action</span>
                <div className="flex flex-wrap gap-1.5">
                  {actionStats.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setActionType(actionType === s.value ? '' : s.value)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all hover:shadow-md ${
                        actionType === s.value
                          ? 'ring-2 ring-green-400 shadow-sm ' + getActionColor(s.value)
                          : getActionColor(s.value)
                      }`}
                    >
                      <span className="font-semibold">{s.value}</span>
                      <span className="text-[9px] opacity-75">{s.count.toLocaleString('id-ID')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {tableStats.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide shrink-0 pt-1">Tabel</span>
                <div className="flex flex-wrap gap-1.5">
                  {tableStats.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setTableName(tableName === s.value ? '' : s.value)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all hover:shadow-md ${
                        tableName === s.value
                          ? 'ring-2 ring-green-400 border-green-300 bg-green-50 text-green-700 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-mono text-[9px]">{s.value}</span>
                      <span className="text-[9px] opacity-75">{s.count.toLocaleString('id-ID')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {userStats.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide shrink-0 pt-1">User</span>
                <div className="flex flex-wrap gap-1.5">
                  {userStats.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setRecordedBy(recordedBy === s.value ? '' : s.value)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all hover:shadow-md ${
                        recordedBy === s.value
                          ? 'ring-2 ring-green-400 border-green-300 bg-green-50 text-green-700 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="truncate max-w-[200px]">{s.label || s.value}</span>
                      <span className="text-[9px] opacity-75">{s.count.toLocaleString('id-ID')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Graph Trend Chart */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-[11px] font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all border-b border-gray-100"
          >
            <span className="flex items-center gap-2">
              <BarChart3 size={13} className="text-green-600" />
              <span>Grafik tren & traffic aktivitas</span>
              <span className="text-[9px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                {trendGroupBy === 'month' 
                  ? `${trendDays.length} bulan`
                  : trendGroupBy === 'week'
                  ? `${trendDays.length} minggu`
                  : `${trendDays.length} hari`
                }
              </span>
            </span>
            <span className="text-[10px] text-gray-500 font-medium">{showChart ? '↑ Sembunyikan' : '↓ Tampilkan'}</span>
          </button>
          {showChart && (
            <div className="p-4 animate-in fade-in duration-300">
              <ActivityLogTrendChart
                days={trendDays}
                hourly={trendHourly}
                minutes={minuteData}
                detailHour={detailHour}
                loading={isFetchingTrend}
                activeAction={actionType}
                onSelectDay={handleTrendDay}
                onSelectAction={setActionType}
                onHourClick={setDetailHour}
                onHourBack={() => { setDetailHour(null); setMinuteData([]); }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 min-h-[28px] flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            {lastUpdated && (
              <span className="text-[10px] text-gray-400 font-semibold">
                Update: {lastUpdated.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <span className="text-[10px] text-gray-400 font-semibold">
              Refresh dalam: <span className={countdown <= 10 ? 'text-amber-500 font-bold' : ''}>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span>
            </span>
          </div>
          {debouncedSearch && (
            <span className="text-[10px] bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-bold border border-green-100">
              {total.toLocaleString('id-ID')} hasil untuk &quot;{debouncedSearch}&quot;
            </span>
          )}
          {(isPending || isFetchingLogs) && <Loader2 size={14} className="animate-spin text-gray-400" />}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchAndReload
                searchQuery={search}
                setSearchQuery={setSearch}
                onReload={refreshCallback}
                loading={isPending || isFetchingLogs}
                placeholder="Cari menu, user, atau keterangan..."
              />
            </div>
          </div>
          {debouncedSearch && (
            <label className="flex items-center gap-2 text-[11px] text-gray-600 font-medium cursor-pointer hover:text-green-700 transition-colors">
              <input
                type="checkbox"
                checked={deepSearch}
                onChange={(e) => setDeepSearch(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0 focus:ring-2 cursor-pointer"
              />
              <span>Cari di detail data JSON (lebih lambat, lebih lengkap)</span>
            </label>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative flex flex-col gap-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-[13px] font-bold">
                Tidak ada log yang sesuai filter.
              </div>
            ) : (
              <div ref={scrollContainerRef} className="overflow-y-auto overflow-x-auto max-h-[min(52vh,560px)] min-h-[240px] custom-scrollbar">
                <table className="text-left table-fixed">
                  <colgroup>
                    <col style={{ width: colWidths[0] }} />
                    <col style={{ width: colWidths[1] }} />
                    <col style={{ width: colWidths[2] }} />
                    <col style={{ width: colWidths[3] }} />
                    <col style={{ width: colWidths[4] }} />
                  </colgroup>
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                    <tr>
                      <SortHeader label="Action"  field="action_type" colIdx={0} sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} onCtx={colCtx} onResize={colResizeStart} />
                      <SortHeader label="Waktu"   field="created_at"  colIdx={1} sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} onCtx={colCtx} onResize={colResizeStart} />
                      <SortHeader label="User"    field="recorded_by" colIdx={2} sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} onCtx={colCtx} onResize={colResizeStart} />
                      <SortHeader label="Tabel"   field="table_name"  colIdx={3} sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} onCtx={colCtx} onResize={colResizeStart} />
                      <th className="px-4 py-3 relative" onContextMenu={(e) => colCtx(4, e)}>
                        <span className="text-[10px] font-bold text-gray-400">Keterangan</span>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-500 active:bg-green-600 transition-colors z-20"
                          onMouseDown={(e) => colResizeStart(4, e)}
                          title="Drag untuk resize kolom"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logs.map((log) => {
                      const isExpanded = expandedId === log.id;
                      const rawParsed = log.raw_data
                        ? (() => { try { return JSON.parse(log.raw_data as string); } catch { return null; } })()
                        : null;
                      let beforeJson: string | null = null;
                      let afterJson: string | null = null;
                      if (rawParsed) {
                        if (log.action_type === 'INSERT') {
                          afterJson = stringifyAuditData(rawParsed);
                        } else if (log.action_type === 'DELETE') {
                          beforeJson = stringifyAuditData(rawParsed);
                        } else if (log.action_type === 'UPDATE') {
                          if (rawParsed.before && rawParsed.after) {
                            beforeJson = stringifyAuditData(rawParsed.before);
                            afterJson = stringifyAuditData(rawParsed.after);
                          } else {
                            afterJson = stringifyAuditData(rawParsed);
                          }
                        } else {
                          afterJson = stringifyAuditData(rawParsed);
                        }
                      }
                      return (
                        <Fragment key={log.id}>
                          <tr
                            onClick={() => toggleExpand(log)}
                            className={`hover:bg-green-50/40 cursor-pointer transition-colors ${isExpanded ? 'bg-green-50/60' : ''}`}
                          >
                            <td className="px-4 py-2.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[110px]">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold border ${getActionColor(log.action_type || '')}`}>
                                {log.action_type}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-[11px] font-bold text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                              {formatLastUpdate(log.created_at)}
                            </td>
                            <td className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 overflow-hidden text-ellipsis max-w-[180px]">
                              {log.recorded_by_name
                                ? <>{log.recorded_by_name}<br /><span className="text-[9px] text-gray-400">@{log.recorded_by}</span></>
                                : (log.recorded_by || '—')}
                            </td>
                            <td className="px-4 py-2.5 text-[11px] font-bold text-gray-700 uppercase whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                              {log.table_name}
                              {log.record_id ? ` #${log.record_id}` : ''}
                            </td>
                            <td className="px-4 py-2.5 relative">
                              <p className="text-[12px] font-bold text-gray-700 line-clamp-2">
                                {debouncedSearch ? highlightText(log.message || '', debouncedSearch) : log.message}
                              </p>
                              {debouncedSearch && getMatchedFields(log, debouncedSearch).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {getMatchedFields(log, debouncedSearch).map((m) => (
                                    <span key={m.field} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-50 text-green-700 border border-green-100">
                                      {m.field}
                                      <span className="text-green-400 font-normal truncate max-w-[120px]">"{m.value.slice(0, 40)}"</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                              <span className="absolute right-2 top-2 text-gray-300">
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                              </span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-gray-50/80">
                              <td colSpan={5} className="px-4 py-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="bg-white rounded-xl border border-gray-100 p-3 overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-[10px] font-bold text-gray-400">Before</div>
                                      {beforeJson && (
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(beforeJson, 'Before')}
                                          className="text-gray-400 hover:text-green-600 transition-colors"
                                          title="Copy Before"
                                        >
                                          <Copy size={12} />
                                        </button>
                                      )}
                                    </div>
                                    {beforeJson ? (
                                      <pre className="text-[10px] leading-relaxed text-gray-700 max-h-[200px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">{beforeJson}</pre>
                                    ) : (
                                      <p className="text-[11px] text-gray-400 italic">—</p>
                                    )}
                                  </div>
                                  <div className="bg-white rounded-xl border border-gray-100 p-3 overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-[10px] font-bold text-gray-400">After</div>
                                      {afterJson && (
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(afterJson, 'After')}
                                          className="text-gray-400 hover:text-green-600 transition-colors"
                                          title="Copy After"
                                        >
                                          <Copy size={12} />
                                        </button>
                                      )}
                                    </div>
                                    {afterJson ? (
                                      <pre className="text-[10px] leading-relaxed text-gray-700 max-h-[200px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">{afterJson}</pre>
                                    ) : (
                                      <p className="text-[11px] text-gray-400 italic">—</p>
                                    )}
                                  </div>
                                  <div className="bg-white rounded-xl border border-gray-100 p-3 overflow-hidden">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-[10px] font-bold text-gray-400">Diff</div>
                                      {(() => {
                                        let diffs = computeExplicitDiff(rawParsed);
                                        if (diffs.length === 0 && rawParsed && !rawParsed.before && !rawParsed.after) {
                                          if (log.action_type === 'INSERT') {
                                            diffs = Object.entries(rawParsed).map(([key, value]) => ({ key, before: '', after: String(value ?? '') }));
                                          } else if (log.action_type === 'DELETE') {
                                            diffs = Object.entries(rawParsed).map(([key, value]) => ({ key, before: String(value ?? ''), after: '' }));
                                          }
                                        }
                                        const diffText = diffs.map(d => `${d.key}: "${d.before}" → "${d.after}"`).join('\n');
                                        return diffs.length > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => copyToClipboard(diffText, 'Diff')}
                                            className="text-gray-400 hover:text-green-600 transition-colors"
                                            title="Copy Diff"
                                          >
                                            <Copy size={12} />
                                          </button>
                                        );
                                      })()}
                                    </div>
                                    {(() => {
                                      let diffs = computeExplicitDiff(rawParsed);
                                      if (diffs.length === 0 && rawParsed && !rawParsed.before && !rawParsed.after) {
                                        if (log.action_type === 'INSERT') {
                                          diffs = Object.entries(rawParsed).map(([key, value]) => ({ key, before: '', after: String(value ?? '') }));
                                        } else if (log.action_type === 'DELETE') {
                                          diffs = Object.entries(rawParsed).map(([key, value]) => ({ key, before: String(value ?? ''), after: '' }));
                                        }
                                      }
                                      return diffs.length > 0 ? (
                                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                          <table className="w-full table-fixed text-[10px]">
                                            <colgroup>
                                              <col style={{ width: '30%' }} />
                                              <col style={{ width: '35%' }} />
                                              <col style={{ width: '35%' }} />
                                            </colgroup>
                                            <thead>
                                              <tr className="text-left text-gray-400 font-bold border-b border-gray-50">
                                                <th className="pb-1 pr-2">Kolom</th>
                                                <th className="pb-1 pr-2">Sebelum</th>
                                                <th className="pb-1">Sesudah</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {diffs.map((d) => (
                                                <tr key={d.key} className="border-b border-gray-50/50">
                                                  <td className="py-1 pr-2 font-semibold text-gray-700 break-words">{d.key}</td>
                                                  <td className="py-1 pr-2 text-rose-500 break-words">{d.before || <span className="italic text-gray-300">—</span>}</td>
                                                  <td className="py-1 text-emerald-700 break-words">{d.after || <span className="italic text-gray-300">—</span>}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-gray-400 italic">—</p>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer - Outside table */}
          {logs.length > 0 && (
            <TableFooter
              totalCount={total}
              currentCount={logs.length}
              label="log aktivitas"
              loadTime={loadTime}
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => { fetchAcRef.current?.abort(); setPage(p); }}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        isLoading={dialog.isLoading}
        onConfirm={dialog.onConfirm || (() => setDialog((prev) => ({ ...prev, isOpen: false })))}
        onCancel={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {ctxCol && (
        <div onMouseDown={() => setCtxCol(null)} className="fixed inset-0 z-50">
          <div 
            onMouseDown={e => e.stopPropagation()} 
            className="fixed bg-white border border-gray-200 shadow-2xl rounded-xl p-3 flex items-center gap-2 z-50" 
            style={{ left: ctxCol.x, top: ctxCol.y }}
          >
            <input 
              autoFocus 
              className="w-20 px-2 py-1.5 text-xs font-bold border border-gray-200 rounded-lg outline-none focus:border-green-400" 
              type="number" 
              value={ctxCol.val} 
              onChange={e => setCtxCol({ ...ctxCol, val: e.target.value })} 
              onKeyDown={e => { 
                if (e.key === 'Enter') { 
                  setColWidths(p => { 
                    const n = [...p]; 
                    n[ctxCol.i] = Math.max(COL_MIN[ctxCol.i], parseInt(ctxCol.val) || COL_MIN[ctxCol.i]); 
                    return n; 
                  }); 
                  setCtxCol(null); 
                } 
              }} 
            />
            <button 
              onClick={() => { 
                setColWidths(p => { 
                  const n = [...p]; 
                  n[ctxCol.i] = Math.max(COL_MIN[ctxCol.i], parseInt(ctxCol.val) || COL_MIN[ctxCol.i]); 
                  return n; 
                }); 
                setCtxCol(null); 
              }} 
              className="text-[11px] font-bold text-white bg-green-600 px-3 py-1.5 rounded-lg hover:bg-green-700"
            >
              Atur
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
