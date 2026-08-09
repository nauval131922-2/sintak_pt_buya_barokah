import type { ActivityLogSortDir, ActivityLogSortField } from './activity-log-query';
import type { ActivityLogSource, DatePreset } from './activity-log-utils';
import {
  detectActiveDatePreset,
  getDatePresetRange,
  getDefaultActivityLogFilters,
} from './activity-log-utils';

export interface ActivityLogUrlState {
  source: ActivityLogSource;
  from: string;
  to: string;
  tableName: string;
  actionType: string;
  recordedBy: string;
  search: string;
  sortBy: ActivityLogSortField;
  sortDir: ActivityLogSortDir;
  datePreset: DatePreset | null;
  page?: number;
}

const SORT_FIELDS: ActivityLogSortField[] = ['created_at', 'action_type', 'table_name', 'recorded_by'];

export function parseActivityLogUrl(params: URLSearchParams): Partial<ActivityLogUrlState> {
  const def = getDefaultActivityLogFilters();
  const out: Partial<ActivityLogUrlState> = {};

  const source = params.get('source');
  if (source === 'archive' || source === 'active') out.source = source;

  const from = params.get('from');
  const to = params.get('to');
  if (from) out.from = from;
  if (to) out.to = to;
  if (out.from && out.to) out.datePreset = detectActiveDatePreset(out.from, out.to);

  const table = params.get('table') || params.get('tableName');
  if (table) out.tableName = table;

  const action = params.get('action') || params.get('actionType');
  if (action) out.actionType = action;

  const user = params.get('user') || params.get('recordedBy');
  if (user) out.recordedBy = user;

  const search = params.get('search');
  if (search) out.search = search;

  const sortBy = params.get('sortBy');
  if (sortBy && SORT_FIELDS.includes(sortBy as ActivityLogSortField)) {
    out.sortBy = sortBy as ActivityLogSortField;
  }

  const sortDir = params.get('sortDir');
  if (sortDir === 'asc' || sortDir === 'desc') out.sortDir = sortDir;

  const pageParam = params.get('page');
  if (pageParam) {
    const page = parseInt(pageParam, 10);
    if (!isNaN(page) && page > 1) out.page = page;
  }

  return out;
}

/** Link cepat dari modul lain — default rentang hari ini */
export function buildActivityLogHref(opts?: {
  tableName?: string;
  from?: string;
  to?: string;
  actionType?: string;
  source?: ActivityLogSource;
  page?: number;
}): string {
  const today = getDatePresetRange('today');
  return buildActivityLogUrl({
    source: opts?.source ?? 'active',
    from: opts?.from ?? today.from,
    to: opts?.to ?? today.to,
    tableName: opts?.tableName ?? '',
    actionType: opts?.actionType ?? '',
    recordedBy: '',
    search: '',
    sortBy: 'created_at',
    sortDir: 'desc',
    datePreset: detectActiveDatePreset(opts?.from ?? today.from, opts?.to ?? today.to),
    page: opts?.page,
  });
}

export function hasActivityLogUrlFilters(params: URLSearchParams): boolean {
  return !!(
    params.get('source') ||
    params.get('from') ||
    params.get('to') ||
    params.get('table') ||
    params.get('tableName') ||
    params.get('action') ||
    params.get('actionType') ||
    params.get('user') ||
    params.get('recordedBy') ||
    params.get('search') ||
    params.get('sortBy') ||
    (params.get('page') && params.get('page') !== '1')
  );
}

export function buildActivityLogUrl(state: ActivityLogUrlState, logId?: string | null): string {
  const p = new URLSearchParams();
  if (state.source !== 'active') p.set('source', state.source);
  if (state.from) p.set('from', state.from);
  if (state.to) p.set('to', state.to);
  if (state.tableName) p.set('table', state.tableName);
  if (state.actionType) p.set('action', state.actionType);
  if (state.recordedBy) p.set('user', state.recordedBy);
  if (state.search.trim()) p.set('search', state.search.trim());
  if (state.sortBy !== 'created_at' || state.sortDir !== 'desc') {
    p.set('sortBy', state.sortBy);
    p.set('sortDir', state.sortDir);
  }
  if (logId) p.set('id', logId);
  if (state.page && state.page > 1) p.set('page', String(state.page));
  const q = p.toString();
  return q ? `/log-aktivitas?${q}` : '/log-aktivitas';
}

export function mergeActivityLogState(
  base: Omit<ReturnType<typeof getDefaultActivityLogFilters>, 'datePreset'> & {
    datePreset: DatePreset | null;
    sortBy: ActivityLogSortField;
    sortDir: ActivityLogSortDir;
  },
  parsed: Partial<ActivityLogUrlState>
): ActivityLogUrlState {
  return {
    source: parsed.source ?? base.source,
    from: parsed.from ?? base.from,
    to: parsed.to ?? base.to,
    tableName: parsed.tableName ?? '',
    actionType: parsed.actionType ?? '',
    recordedBy: parsed.recordedBy ?? '',
    search: parsed.search ?? '',
    sortBy: parsed.sortBy ?? base.sortBy,
    sortDir: parsed.sortDir ?? base.sortDir,
    datePreset: 'datePreset' in parsed ? (parsed.datePreset ?? null) : base.datePreset,
    page: parsed.page,
  };
}
