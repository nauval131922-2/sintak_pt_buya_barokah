import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { cacheGet, cacheSet } from '@/lib/server-cache';

import { canViewActivityLog } from '@/lib/activity-log-permissions';

const FILTERS_CACHE_KEY = 'activity-log-filters';
const FILTERS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await canViewActivityLog(session.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cached = cacheGet<{ tables: string[]; actions: string[]; users: { value: string; label: string }[] }>(FILTERS_CACHE_KEY);
    if (cached) {
      return NextResponse.json({ success: true, ...cached });
    }

    const [tablesRes, actionsRes, usersRes] = await Promise.all([
      db.execute(`
        SELECT DISTINCT table_name AS value FROM (
          SELECT table_name FROM activity_logs
          UNION
          SELECT table_name FROM activity_logs_archive
        ) ORDER BY value ASC LIMIT 200
      `),
      db.execute(`
        SELECT DISTINCT action_type AS value FROM (
          SELECT action_type FROM activity_logs
          UNION
          SELECT action_type FROM activity_logs_archive
        ) ORDER BY value ASC LIMIT 50
      `),
      db.execute(`
        SELECT DISTINCT r.recorded_by AS value
        FROM (
          SELECT recorded_by FROM activity_logs
          UNION
          SELECT recorded_by FROM activity_logs_archive
        ) r
        ORDER BY value ASC LIMIT 100
      `),
    ]);

    const result = {
      tables: tablesRes.rows.map((r) => String(r.value ?? '')).filter(Boolean),
      actions: actionsRes.rows.map((r) => String(r.value ?? '')).filter(Boolean),
      users: usersRes.rows.map((r) => {
        const val = String(r.value ?? '');
        return { value: val, label: val };
      }).filter((u) => u.value),
    };

    // Populate user labels asynchronously (not blocking the response)
    if (result.users.length > 0) {
      const usernames = result.users.map((u) => u.value);
      const placeholders = usernames.map(() => '?').join(',');
      const userRes = await db.execute({
        sql: `SELECT username, name FROM users WHERE username IN (${placeholders})`,
        args: usernames,
      });
      const nameMap = new Map<string, string>();
      for (const row of userRes.rows) {
        nameMap.set(String(row.username ?? ''), String(row.name ?? ''));
      }
      for (const u of result.users) {
        const name = nameMap.get(u.value);
        if (name) u.label = name;
      }
    }

    cacheSet(FILTERS_CACHE_KEY, result, FILTERS_CACHE_TTL);

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
