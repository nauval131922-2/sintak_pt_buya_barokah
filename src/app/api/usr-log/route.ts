import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { getMergedPermissions } from '@/lib/permissions';
import { getScrapedPeriodSettingKey, parseScrapedPeriod } from '@/lib/server-scraped-period';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const roles = Array.isArray(session.roles) && session.roles.length > 0 ? session.roles : [session.role];
  if (!roles.includes('Super Admin')) {
    const perms = await getMergedPermissions(roles);
    if (!perms.usr_log_view) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('pageSize') || '50');
    const q = searchParams.get('q') || '';
    const start = searchParams.get('start') || '';
    const end = searchParams.get('end') || '';
    const offset = (page - 1) * limit;

    const dateFilter = start && end ? ` AND tgl BETWEEN ? AND ?` : '';
    const dateArgs = start && end ? [start, end] : [];

    let records, total;
    if (q) {
      const like = `%${q}%`;
      const likeArgs = [like, like, like, like];
      [records, total] = await Promise.all([
        db.execute({ sql: `SELECT * FROM usr_log WHERE (level LIKE ? OR channel LIKE ? OR username LIKE ? OR pesan LIKE ?)${dateFilter} ORDER BY datetime DESC LIMIT ? OFFSET ?`, args: [...likeArgs, ...dateArgs, limit, offset] }),
        db.execute({ sql: `SELECT COUNT(*) as c FROM usr_log WHERE (level LIKE ? OR channel LIKE ? OR username LIKE ? OR pesan LIKE ?)${dateFilter}`, args: [...likeArgs, ...dateArgs] }),
      ]);
    } else {
      [records, total] = await Promise.all([
        db.execute({ sql: `SELECT * FROM usr_log WHERE 1=1${dateFilter} ORDER BY datetime DESC LIMIT ? OFFSET ?`, args: [...dateArgs, limit, offset] }),
        db.execute({ sql: `SELECT COUNT(*) as c FROM usr_log WHERE 1=1${dateFilter}`, args: dateArgs }),
      ]);
    }

    const periodRaw = await db.execute({ sql: `SELECT value FROM system_settings WHERE key = ?`, args: [getScrapedPeriodSettingKey('last_scrape_usr_log')] });
    const scrapedPeriod = periodRaw.rows[0] ? parseScrapedPeriod(String((periodRaw.rows[0] as any).value)) : null;
    const lastUpdated = await db.execute({ sql: `SELECT value FROM system_settings WHERE key = 'last_scrape_usr_log'`, args: [] });

    return NextResponse.json({
      data: records.rows,
      total: Number((total.rows[0] as any)?.c ?? 0),
      lastUpdated: lastUpdated.rows[0] ? String((lastUpdated.rows[0] as any).value) : null,
      scrapedPeriod,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
