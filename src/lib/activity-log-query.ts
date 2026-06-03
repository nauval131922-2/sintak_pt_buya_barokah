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
    conditions.push('al.created_at >= ? AND al.created_at < ?');
    // params.from / params.to adalah string tanggal WIB (Asia/Jakarta, UTC+7)
    // Tapi created_at di DB tersimpan dalam UTC (format YYYY-MM-DD HH:MM:SS)
    // Konversi: 00:00 WIB = 17:00 UTC hari sebelumnya
    const fromDate = new Date(`${params.from}T00:00:00+07:00`);
    const toDate = new Date(`${params.to}T00:00:00+07:00`);
    toDate.setDate(toDate.getDate() + 1);
    args.push(
      fromDate.toISOString().replace('T', ' ').slice(0, 19),
      toDate.toISOString().replace('T', ' ').slice(0, 19)
    );
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
    const term = `%${params.search.trim()}%`;
    const searchParts: string[] = [
      'al.message LIKE ?',
      'al.action_type LIKE ?',
      'al.table_name LIKE ?',
      'al.recorded_by LIKE ?',
    ];
    const searchArgs: unknown[] = [term, term, term, term];

    if (!opts.skipUserNameSearch) {
      searchParts.push("COALESCE(u.name, '') LIKE ?");
      searchArgs.push(term);
    }

    if (!opts.skipRawDataSearch) {
      searchParts.push('al.raw_data LIKE ?');
      searchArgs.push(term);
    }

    conditions.push(`(${searchParts.join(' OR ')})`);
    args.push(...searchArgs);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, args };
}
