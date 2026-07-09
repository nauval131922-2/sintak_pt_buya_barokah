import type { ActivityLogSource } from './activity-log-utils';

export type ActivityLogSortField = 'created_at' | 'action_type' | 'table_name' | 'recorded_by';
export type ActivityLogSortDir = 'asc' | 'desc';

export interface ActivityLogQueryOptions {
  /** Skip user name search condition (for COUNT/STATS where JOIN not needed) */
  skipUserNameSearch?: boolean;
  /** Skip raw_data LIKE condition */
  skipRawDataSearch?: boolean;
}

export interface ActivityLogQueryParams {
  from?: string;
  to?: string;
  search?: string;
  tableName?: string;
  actionType?: string;
  recordedBy?: string;
  source?: ActivityLogSource;
  page?: number;
  pageSize?: number;
  sortBy?: ActivityLogSortField;
  sortDir?: ActivityLogSortDir;
  opts?: ActivityLogQueryOptions;
}

const SORT_COLUMNS: Record<ActivityLogSortField, string> = {
  created_at: 'al.created_at',
  action_type: 'al.action_type',
  table_name: 'al.table_name',
  recorded_by: 'al.recorded_by',
};

export function buildActivityLogOrderBy(sortBy?: string, sortDir?: string): string {
  const field = sortBy && sortBy in SORT_COLUMNS ? (sortBy as ActivityLogSortField) : 'created_at';
  const col = SORT_COLUMNS[field];
  const dir = sortDir === 'asc' ? 'ASC' : 'DESC';
  return `ORDER BY ${col} ${dir}, al.id DESC`;
}

export function getActivityLogTable(source: ActivityLogSource = 'active') {
  return source === 'archive' ? 'activity_logs_archive' : 'activity_logs';
}

export function buildActivityLogWhere(params: ActivityLogQueryParams) {
  const conditions: string[] = [];
  const args: unknown[] = [];
  const opts = params.opts ?? {};

  if (params.from && params.to) {
    // ponytail: SQLite CURRENT_TIMESTAMP returns 'YYYY-MM-DD HH:MM:SS' (UTC, no Z suffix)
    // Filter harus pakai format sama biar string comparison works
    conditions.push('al.created_at >= ? AND al.created_at <= ?');
    const fromDate = new Date(`${params.from}T00:00:00+07:00`);
    const toDate = new Date(`${params.to}T23:59:59.999+07:00`);
    // Convert to SQLite format: 'YYYY-MM-DD HH:MM:SS' (UTC)
    const fromSQL = fromDate.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
    const toSQL = toDate.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
    args.push(fromSQL, toSQL);
  }

  if (params.tableName) {
    conditions.push('al.table_name = ?');
    args.push(params.tableName);
  }

  if (params.actionType) {
    conditions.push('al.action_type = ?');
    args.push(params.actionType);
  }

  if (params.recordedBy) {
    conditions.push('al.recorded_by = ?');
    args.push(params.recordedBy);
  }

  if (params.search?.trim()) {
    const term = `%${params.search.trim().toLowerCase()}%`;
    const searchParts: string[] = [
      "LOWER(COALESCE(al.message, '')) LIKE ?",
      "LOWER(COALESCE(al.action_type, '')) LIKE ?",
      "LOWER(COALESCE(al.table_name, '')) LIKE ?",
      "LOWER(COALESCE(al.recorded_by, '')) LIKE ?",
    ];
    const searchArgs: unknown[] = [term, term, term, term];

    if (!opts.skipUserNameSearch) {
      searchParts.push("LOWER(COALESCE(u.name, '')) LIKE ?");
      searchArgs.push(term);
    }

    if (!opts.skipRawDataSearch) {
      searchParts.push("LOWER(COALESCE(al.raw_data, '')) LIKE ?");
      searchArgs.push(term);
    }

    conditions.push(`(${searchParts.join(' OR ')})`);
    args.push(...searchArgs);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, args };
}
