'use client';

import { useState, useEffect, useCallback, useTransition, useRef, useMemo, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Clock, Database, Loader2, Calendar, LayoutList, LayoutGrid, Archive, FileText,
  X, Table2, Zap, User, ChevronUp, ChevronDown, Bookmark, Trash2, Info, ListTree,
} from 'lucide-react';
import ActivityLogExportMenu from './ActivityLogExportMenu';
import SearchableDropdown from '@/components/SearchableDropdown';
import { formatLastUpdate } from '@/lib/date-utils';
import TableFooter from '@/components/TableFooter';
import SearchAndReload from '@/components/SearchAndReload';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import LastUpdatedBadge from '@/components/LastUpdatedBadge';
import DatePicker from '@/components/DatePicker';
import ActivityLogCleanupModal from './ActivityLogCleanupModal';
import {
  type ActivityLogRow,
  type DatePreset,
  DATE_PRESETS,
  getDatePresetRange,
  getDefaultActivityLogFilters,
  detectActiveDatePreset,
  getActionColor,
  toPlainActivityRows,
  groupActivityLogsByDate,
  formatDateStrId,
  type ActivityLogSource,
  computeExplicitDiff,
} from '@/lib/activity-log-utils';
import type { ActivityLogSortField } from '@/lib/activity-log-query';
import {
  buildActivityLogUrl,
  hasActivityLogUrlFilters,
  mergeActivityLogState,
  parseActivityLogUrl,
} from '@/lib/activity-log-url';
import {
  deleteActivityLogPreset,
  loadActivityLogPresets,
  saveActivityLogPreset,
  type SavedActivityLogPreset,
} from '@/lib/activity-log-presets';
import ActivityLogTrendChart from './ActivityLogTrendChart';
import type { ActivityLogTrendDay } from '@/app/api/activity-log/trend/route';
import {
  loadActivityLogRefreshMs,
  saveActivityLogRefreshMs,
  REFRESH_INTERVAL_OPTIONS,
  QUICK_ACTION_CHIPS,
} from '@/lib/activity-log-refresh';

const PAGE_SIZE = 50;

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

function SortHeader({
  label,
  field,
  sortBy,
  sortDir,
  onSort,
}: {
  label: string;
  field: ActivityLogSortField;
  sortBy: ActivityLogSortField;
  sortDir: 'asc' | 'desc';
  onSort: (f: ActivityLogSortField) => void;
}) {
  const active = sortBy === field;
  return (
    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 whitespace-nowrap">
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 hover:text-green-700 transition-colors ${active ? 'text-green-700' : ''}`}
      >
        {label}
        {active ? (
          sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <ChevronDown size={12} className="opacity-30" />
        )}
      </button>
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
  const skipPageReset = useRef(true);

  const baseState = useMemo(() => buildBaseState(serverDateDefaults), [serverDateDefaults]);

  const initialState = useRef(
    mergeActivityLogState(
      baseState,
      hasActivityLogUrlFilters(urlSearchParams) ? parseActivityLogUrl(urlSearchParams) : {}
    )
  ).current;

  const [source, setSource] = useState<ActivityLogSource>(initialState.source);
  const [search, setSearch] = useState(initialState.search);
  const [debouncedSearch, setDebouncedSearch] = useState(initialState.search);
  const [page, setPage] = useState(initialState.page ?? 1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [from, setFrom] = useState(initialState.from);
  const [to, setTo] = useState(initialState.to);
  const [datePreset, setDatePreset] = useState<DatePreset | null>(initialState.datePreset);
  const [tableName, setTableName] = useState(initialState.tableName);
  const [actionType, setActionType] = useState(initialState.actionType);
  const [recordedBy, setRecordedBy] = useState(initialState.recordedBy);
  const [sortBy, setSortBy] = useState<ActivityLogSortField>(initialState.sortBy);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialState.sortDir);
  const [savedPresets, setSavedPresets] = useState<SavedActivityLogPreset[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'timeline'>('table');
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
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
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [trendDays, setTrendDays] = useState<ActivityLogTrendDay[]>([]);
  const [isFetchingTrend, setIsFetchingTrend] = useState(false);
  const [refreshMs, setRefreshMs] = useState(120_000);
  const statsFetchId = useRef(0);
  const logsFetchId = useRef(0);
  const trendFetchId = useRef(0);
  const fetchAcRef = useRef<AbortController | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const buildParams = useCallback(
    (pageNum: number, extra?: Record<string, string>) => {
      const p = new URLSearchParams({
        from,
        to,
        page: String(pageNum),
        pageSize: String(PAGE_SIZE),
        source,
        ...extra,
      });
      if (debouncedSearch) p.set('search', debouncedSearch);
      if (tableName) p.set('tableName', tableName);
      if (actionType) p.set('actionType', actionType);
      if (recordedBy) p.set('recordedBy', recordedBy);
      p.set('sortBy', sortBy);
      p.set('sortDir', sortDir);
      return p;
    },
    [from, to, debouncedSearch, tableName, actionType, recordedBy, source, sortBy, sortDir]
  );

  const fetchLogs = useCallback(
    async (pageNum: number) => {
      const signal = fetchAcRef.current?.signal;
      if (signal?.aborted) return;
      const fid = ++logsFetchId.current;
      setIsFetchingLogs(true);
      const start = performance.now();
      try {
        const res = await fetch(`/api/activity-log?${buildParams(pageNum).toString()}`, { signal });
        const data = await res.json();
        if (logsFetchId.current !== fid) return;
        if (data.success) {
          setLogs(toPlainActivityRows(data.data || []));
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
          if (data.page && data.page !== pageNum) setPage(data.page);
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
    setSavedPresets(loadActivityLogPresets());
    setRefreshMs(loadActivityLogRefreshMs());
    const t = setTimeout(() => { skipUrlSync.current = false; }, 0);
    return () => clearTimeout(t);
  }, []);

  const fetchTrend = useCallback(async () => {
    const signal = fetchAcRef.current?.signal;
    if (signal?.aborted) return;
    const fid = ++trendFetchId.current;
    setIsFetchingTrend(true);
    try {
      const p = buildParams(1);
      p.delete('page');
      p.delete('pageSize');
      p.delete('stats');
      const res = await fetch(`/api/activity-log/trend?${p.toString()}`, { signal });
      const data = await res.json();
      if (trendFetchId.current !== fid) return;
      if (data.success) setTrendDays(data.days || []);
    } catch { /* ignore */ } finally {
      if (trendFetchId.current !== fid) return;
      setIsFetchingTrend(false);
    }
  }, [buildParams]);

  const fetchStats = useCallback(async () => {
    const signal = fetchAcRef.current?.signal;
    if (signal?.aborted) return;
    const fid = ++statsFetchId.current;
    try {
      const p = buildParams(1, { stats: '1' });
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
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (skipPageReset.current) {
      skipPageReset.current = false;
      return;
    }
    setPage(1);
  }, [from, to, debouncedSearch, tableName, actionType, recordedBy, source, sortBy, sortDir]);

  useEffect(() => {
    const ac = new AbortController();
    fetchAcRef.current = ac;
    fetchLogs(page);
    fetchTrend();
    fetchStats();
    return () => { if (fetchAcRef.current === ac) fetchAcRef.current = null; ac.abort(); };
  }, [page, fetchLogs, fetchTrend, fetchStats]);

  useEffect(() => {
    if (skipUrlSync.current) return;
    const target = buildActivityLogUrl(
      {
        source, from, to, tableName, actionType, recordedBy, search, sortBy, sortDir, datePreset,
        page: page > 1 ? page : undefined,
      },
      expandedId ? String(expandedId) : undefined
    );
    const targetQs = target.includes('?') ? target.split('?')[1]! : '';
    if (targetQs !== urlSearchParams.toString()) {
      router.replace(target, { scroll: false });
    }
  }, [
    source, from, to, tableName, actionType, recordedBy, search, sortBy, sortDir, datePreset, page,
    expandedId, router, urlSearchParams,
  ]);

  useEffect(() => {
    const id = urlSearchParams.get('id');
    if (!id || deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    setExpandedId(id);
  }, [urlSearchParams]);



  const refreshCallback = useCallback(() => {
    fetchLogs(page);
    fetchTrend();
    fetchStats();
  }, [fetchLogs, fetchTrend, fetchStats, page]);

  const lastUpdated = useAutoRefresh(
    refreshCallback,
    refreshMs,
    refreshMs > 0
  );

  const handleTrendDay = (date: string) => {
    setFrom(date);
    setTo(date);
    setDatePreset(null);
    setPage(1);
  };

  const timelineGroups = useMemo(() => groupActivityLogsByDate(logs), [logs]);

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
      page: page > 1 ? page : undefined,
    }),
    [source, from, to, tableName, actionType, recordedBy, search, sortBy, sortDir, datePreset, page]
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
    setPage(1);
  };

  const clearFilters = () => {
    const fresh = getDefaultActivityLogFilters();
    setSource(fresh.source);
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

  const applySavedPreset = (preset: SavedActivityLogPreset) => {
    setSource(preset.filters.source);
    setFrom(preset.filters.from);
    setTo(preset.filters.to);
    setTableName(preset.filters.tableName);
    setActionType(preset.filters.actionType);
    setRecordedBy(preset.filters.recordedBy);
    setSearch(preset.filters.search);
    setDatePreset(detectActiveDatePreset(preset.filters.from, preset.filters.to));
    setPage(1);
  };

  const handleSavePreset = () => {
    const name = window.prompt('Nama preset filter:', 'Scraping hari ini');
    if (!name) return;
    setSavedPresets(
      saveActivityLogPreset(name, {
        source,
        from,
        to,
        tableName,
        actionType,
        recordedBy,
        search,
      })
    );
  };

  const handleExport = (includeRawData: boolean) => {
    const p = buildParams(1);
    p.delete('page');
    p.delete('pageSize');
    p.delete('stats');
    p.set('limit', '5000');
    if (includeRawData) p.set('includeRawData', '1');
    window.open(`/api/activity-log/export?${p.toString()}`, '_blank');
  };

  const toggleExpand = (log: ActivityLogRow) => {
    const next: number | string | null = expandedId === log.id ? null : log.id;
    setExpandedId(next);
  };

  return (
    <div ref={pageRef} className="flex flex-col gap-3 w-full animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 shrink-0 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-gray-100 overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setSource('active')}
              className={`px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 ${
                source === 'active' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText size={12} /> Aktif
            </button>
            <button
              type="button"
              onClick={() => setSource('archive')}
              className={`px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 border-l border-gray-100 ${
                source === 'archive' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Archive size={12} /> Arsip (&gt;90 hari)
            </button>
          </div>

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

          <div className="flex rounded-lg border border-gray-100 overflow-hidden ml-auto">
            <button
              type="button"
              title="Tabel"
              onClick={() => setViewMode('table')}
              className={`p-2 ${viewMode === 'table' ? 'bg-green-50 text-green-700' : 'bg-white text-gray-400'}`}
            >
              <LayoutList size={14} />
            </button>
            <button
              type="button"
              title="Kartu"
              onClick={() => setViewMode('cards')}
              className={`p-2 border-l border-gray-100 ${viewMode === 'cards' ? 'bg-green-50 text-green-700' : 'bg-white text-gray-400'}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              title="Timeline per hari"
              onClick={() => setViewMode('timeline')}
              className={`p-2 border-l border-gray-100 ${viewMode === 'timeline' ? 'bg-green-50 text-green-700' : 'bg-white text-gray-400'}`}
            >
              <ListTree size={14} />
            </button>
          </div>

          <ActivityLogExportMenu onExport={handleExport} />
        </div>

        {source === 'archive' && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-amber-100 bg-amber-50/80 text-[11px] text-amber-900 font-medium leading-relaxed">
            <Info size={14} className="shrink-0 mt-0.5 text-amber-600" />
            <span>
              Data arsip: log lebih dari <strong>90 hari</strong> (kecuali <strong>DELETE</strong>) dipindahkan otomatis dari log aktif.
              Kolom <strong>Diarsipkan</strong> menunjukkan waktu pemindahan.
            </span>
          </div>
        )}

        {(actionStats.length > 0 || tableStats.length > 0 || userStats.length > 0) && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
            {actionStats.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[10px] font-bold text-gray-400 mr-0.5">Action:</span>
                {actionStats.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setActionType(actionType === s.value ? '' : s.value)}
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border transition-all hover:ring-2 hover:ring-green-200 ${
                      actionType === s.value
                        ? 'ring-2 ring-green-400 ' + getActionColor(s.value)
                        : getActionColor(s.value)
                    }`}
                  >
                    {s.value}: {s.count.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            )}
            {tableStats.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[10px] font-bold text-gray-400 mr-0.5">Tabel:</span>
                {tableStats.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setTableName(tableName === s.value ? '' : s.value)}
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border transition-all hover:ring-2 hover:ring-green-200 ${
                      tableName === s.value
                        ? 'ring-2 ring-green-400 border-green-300 bg-green-50 text-green-700'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {s.value}: {s.count.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            )}
            {userStats.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[10px] font-bold text-gray-400 mr-0.5">User:</span>
                {userStats.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setRecordedBy(recordedBy === s.value ? '' : s.value)}
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border transition-all hover:ring-2 hover:ring-green-200 ${
                      recordedBy === s.value
                        ? 'ring-2 ring-green-400 border-green-300 bg-green-50 text-green-700'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {s.label ? `${s.label} (@${s.value})` : s.value}: {s.count.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSavePreset}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-100 bg-white text-[10px] font-bold text-gray-600 hover:border-green-200 hover:text-green-700"
          >
            <Bookmark size={12} /> Simpan preset
          </button>
          {savedPresets.map((preset) => (
            <div key={preset.id} className="flex items-center rounded-lg border border-gray-100 overflow-hidden">
              <button
                type="button"
                onClick={() => applySavedPreset(preset)}
                className="px-2.5 py-1 text-[10px] font-bold text-gray-600 bg-white hover:bg-green-50 hover:text-green-700"
                title={`${preset.filters.from} — ${preset.filters.to}`}
              >
                {preset.name}
              </button>
              <button
                type="button"
                onClick={() => setSavedPresets(deleteActivityLogPreset(preset.id))}
                className="px-1.5 py-1 bg-white text-gray-300 hover:text-rose-600 border-l border-gray-100"
                title="Hapus preset"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>

        <ActivityLogTrendChart
          days={trendDays}
          loading={isFetchingTrend}
          activeAction={actionType}
          onSelectDay={handleTrendDay}
          onSelectAction={setActionType}
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-400 mr-0.5">Aksi cepat:</span>
          {QUICK_ACTION_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setActionType(actionType === chip ? '' : chip)}
              className={`px-2 py-0.5 rounded-md text-[9px] font-bold border transition-all ${
                actionType === chip
                  ? 'ring-1 ring-green-400 ' + getActionColor(chip)
                  : getActionColor(chip) + ' opacity-80 hover:opacity-100'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 min-h-[28px] flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <LastUpdatedBadge lastUpdated={lastUpdated} />
            <select
              value={refreshMs}
              onChange={(e) => {
                const ms = parseInt(e.target.value, 10);
                setRefreshMs(ms);
                saveActivityLogRefreshMs(ms);
              }}
              className="h-7 px-2 rounded-lg border border-gray-100 text-[10px] font-bold text-gray-600 bg-white"
              title="Interval auto-refresh"
            >
              {REFRESH_INTERVAL_OPTIONS.map((o) => (
                <option key={o.ms} value={o.ms}>
                  Refresh: {o.label}
                </option>
              ))}
            </select>
          </div>
          {debouncedSearch && (
            <span className="text-[10px] bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-bold border border-green-100">
              {total.toLocaleString('id-ID')} hasil untuk &quot;{debouncedSearch}&quot;
            </span>
          )}
          {(isPending || isFetchingLogs) && <Loader2 size={14} className="animate-spin text-gray-400" />}
        </div>

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
          {canAdminLogs && source === 'active' && (
            <button
              onClick={() => setCleanupOpen(true)}
              title="Bersihkan Log"
              className="h-10 w-10 bg-white border border-gray-100 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shadow-sm shrink-0"
            >
              <Database size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="overflow-y-auto overflow-x-auto max-h-[min(52vh,560px)] min-h-[240px] pb-3 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-[13px] font-bold">
                  Tidak ada log yang sesuai filter.
                </div>
              ) : viewMode === 'timeline' ? (
                <div className="p-3 space-y-2">
                  {timelineGroups.map((group) => {
                    const collapsed = collapsedDays[group.dateKey];
                    return (
                      <div key={group.dateKey}>
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedDays((prev) => ({ ...prev, [group.dateKey]: !prev[group.dateKey] }))
                          }
                          className="sticky top-0 z-[5] w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-left hover:bg-green-50/50 transition-colors"
                        >
                          <span className="text-[11px] font-bold text-gray-800">{group.label}</span>
                          <span className="text-[10px] font-bold text-gray-400 shrink-0">
                            {group.items.length.toLocaleString('id-ID')} log {collapsed ? '▸' : '▾'}
                          </span>
                        </button>
                        {!collapsed && (
                          <div className="ml-4 mt-1 pl-3 border-l-2 border-green-100 space-y-0 divide-y divide-gray-50">
                            {group.items.map((log) => (
                              <div
                                key={log.id}
                                onClick={() => toggleExpand(log)}
                                className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-green-50/40 px-2 rounded-lg transition-colors"
                              >
                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold border shrink-0 mt-0.5 ${getActionColor(log.action_type || '')}`}>
                                  {log.action_type}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[12px] font-bold text-gray-800 line-clamp-2">{log.message}</p>
                                  {debouncedSearch && getMatchedFields(log, debouncedSearch).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {getMatchedFields(log, debouncedSearch).map((m) => (
                                        <span key={m.field} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-50 text-green-700 border border-green-100">
                                          {m.field}
                                          <span className="text-green-400 font-normal truncate max-w-[120px]">“{m.value.slice(0, 40)}”</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    {formatLastUpdate(log.created_at)} · {log.table_name} · {log.recorded_by_name ? `${log.recorded_by_name} (@${log.recorded_by})` : log.recorded_by}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : viewMode === 'table' ? (
                <table className="min-w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                    <tr>
                      <SortHeader label="Action" field="action_type" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                      <SortHeader label="Waktu" field="created_at" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                      {source === 'archive' && (
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 whitespace-nowrap">Diarsipkan</th>
                      )}
                      <SortHeader label="User" field="recorded_by" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                      <SortHeader label="Tabel" field="table_name" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 min-w-[280px]">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logs.map((log) => {
                      const isExpanded = expandedId === log.id;
                      const rawParsed = isExpanded && log.raw_data ? (() => { try { return JSON.parse(log.raw_data as string); } catch { return null; } })() : null;
                      let beforeJson: string | null = null;
                      let afterJson: string | null = null;
                      if (rawParsed) {
                        if (log.action_type === 'INSERT') {
                          afterJson = JSON.stringify(rawParsed, null, 2);
                        } else if (log.action_type === 'DELETE') {
                          beforeJson = JSON.stringify(rawParsed, null, 2);
                        } else if (log.action_type === 'UPDATE') {
                          if (rawParsed.before && rawParsed.after) {
                            beforeJson = JSON.stringify(rawParsed.before, null, 2);
                            afterJson = JSON.stringify(rawParsed.after, null, 2);
                          } else {
                            afterJson = JSON.stringify(rawParsed, null, 2);
                          }
                        } else {
                          afterJson = JSON.stringify(rawParsed, null, 2);
                        }
                      }
                      return (
                        <Fragment key={log.id}>
                          <tr
                            onClick={() => toggleExpand(log)}
                            className={`hover:bg-green-50/40 cursor-pointer transition-colors ${isExpanded ? 'bg-green-50/60' : ''}`}
                          >
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold border ${getActionColor(log.action_type || '')}`}>
                                {log.action_type}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-[11px] font-bold text-gray-600 whitespace-nowrap">
                              {formatLastUpdate(log.created_at)}
                            </td>
                            {source === 'archive' && (
                              <td className="px-4 py-2.5 text-[10px] font-semibold text-amber-700 whitespace-nowrap">
                                {log.archived_at ? formatLastUpdate(log.archived_at) : '—'}
                              </td>
                            )}
                            <td className="px-4 py-2.5 text-[10px] font-semibold text-gray-500 whitespace-nowrap">
                              {log.recorded_by_name
                                ? <>{log.recorded_by_name}<br /><span className="text-[9px] text-gray-400">@{log.recorded_by}</span></>
                                : (log.recorded_by || '—')}
                            </td>
                            <td className="px-4 py-2.5 text-[11px] font-bold text-gray-700 uppercase whitespace-nowrap">
                              {log.table_name}
                              {log.record_id ? ` #${log.record_id}` : ''}
                            </td>
                            <td className="px-4 py-2.5 relative">
                              <p className="text-[12px] font-bold text-gray-700 line-clamp-2">{log.message}</p>
                              {debouncedSearch && getMatchedFields(log, debouncedSearch).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {getMatchedFields(log, debouncedSearch).map((m) => (
                                    <span key={m.field} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-50 text-green-700 border border-green-100">
                                      {m.field}
                                      <span className="text-green-400 font-normal truncate max-w-[120px]">“{m.value.slice(0, 40)}”</span>
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
                              <td colSpan={source === 'archive' ? 6 : 5} className="px-4 py-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="bg-white rounded-xl border border-gray-100 p-3 overflow-hidden">
                                    <div className="text-[10px] font-bold text-gray-400 mb-2">Before</div>
                                    {beforeJson ? (
                                      <pre className="text-[10px] leading-relaxed text-gray-700 max-h-[200px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">{beforeJson}</pre>
                                    ) : (
                                      <p className="text-[11px] text-gray-400 italic">—</p>
                                    )}
                                  </div>
                                  <div className="bg-white rounded-xl border border-gray-100 p-3 overflow-hidden">
                                    <div className="text-[10px] font-bold text-gray-400 mb-2">After</div>
                                    {afterJson ? (
                                      <pre className="text-[10px] leading-relaxed text-gray-700 max-h-[200px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">{afterJson}</pre>
                                    ) : (
                                      <p className="text-[11px] text-gray-400 italic">—</p>
                                    )}
                                  </div>
                                  <div className="bg-white rounded-xl border border-gray-100 p-3 overflow-hidden">
                                    <div className="text-[10px] font-bold text-gray-400 mb-2">Diff</div>
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
              ) : (
                <div className="p-2 space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => toggleExpand(log)}
                      className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-gray-50 hover:border-green-100 hover:bg-green-50/10 cursor-pointer"
                    >
                      <div className="flex gap-3 items-start min-w-0">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold border shrink-0 ${getActionColor(log.action_type || '')}`}>
                          {log.action_type}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-gray-800 line-clamp-2">{log.message}</p>
                          {debouncedSearch && getMatchedFields(log, debouncedSearch).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {getMatchedFields(log, debouncedSearch).map((m) => (
                                <span key={m.field} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-50 text-green-700 border border-green-100">
                                  {m.field}
                                  <span className="text-green-400 font-normal truncate max-w-[120px]">“{m.value.slice(0, 40)}”</span>
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">
                            {log.table_name} · {log.recorded_by_name ? `${log.recorded_by_name} (@${log.recorded_by})` : log.recorded_by}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 shrink-0">
                        <Clock size={12} />
                        {formatLastUpdate(log.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <TableFooter
          totalCount={total}
          currentCount={logs.length}
          label="log aktivitas"
          loadTime={loadTime}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <ActivityLogCleanupModal
        isOpen={cleanupOpen}
        onClose={() => setCleanupOpen(false)}
        onDone={() => fetchLogs(1)}
      />
    </div>
  );
}
