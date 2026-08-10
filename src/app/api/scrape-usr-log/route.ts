import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession as getScraperSession, clearCachedSession } from '@/lib/session-cache';
import { getSession } from '@/lib/session';
import { getMergedPermissions } from '@/lib/permissions';
import { getScrapedPeriodSettingKey, encodeScrapedPeriod } from '@/lib/server-scraped-period';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://buyapercetakan.mdthoster.com/il/';
const API_EMAIL = process.env.SCRAPER_EMAIL || 'nauval';
const API_PASSWORD = process.env.SCRAPER_PASSWORD!;
const API_KEY = process.env.SCRAPER_API_KEY!;

async function getDigitCookies() {
  return getScraperSession(async () => {
    const res = await fetch(BASE_URL + 'v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Bismillah-Api-Key': API_KEY },
      body: JSON.stringify({ username: API_EMAIL, password: API_PASSWORD }),
    });
    return res.headers.get('set-cookie');
  });
}

async function fetchFromDigit(cookies: string, stglAwal: string, stglAkhir: string) {
  const url = `${BASE_URL}v1/cfg/usr_log/grid?bsearch[stgl_awal]=${encodeURIComponent(stglAwal)}&bsearch[stgl_akhir]=${encodeURIComponent(stglAkhir)}`;
  return fetch(url, { headers: { Cookie: cookies, 'X-Bismillah-Api-Key': API_KEY, Accept: 'application/json' } });
}

// DD-MM-YYYY → YYYY-MM-DD
function toIso(ddmmyyyy: string) {
  const [dd, mm, yyyy] = ddmmyyyy.split('-');
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const roles = Array.isArray(session.roles) && session.roles.length > 0 ? session.roles : [session.role];
  if (!roles.includes('Super Admin')) {
    const perms = await getMergedPermissions(roles);
    if (!perms.usr_log_view) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const stglAwal = searchParams.get('stgl_awal') || '';
  const stglAkhir = searchParams.get('stgl_akhir') || '';
  if (!stglAwal || !stglAkhir) return NextResponse.json({ error: 'stgl_awal dan stgl_akhir wajib' }, { status: 400 });

  try {
    let cookies = await getDigitCookies();
    if (!cookies) return NextResponse.json({ error: 'Gagal login ke Digit' }, { status: 401 });

    let res = await fetchFromDigit(cookies, stglAwal, stglAkhir);
    if (res.status === 401) {
      clearCachedSession();
      cookies = await getDigitCookies();
      if (!cookies) return NextResponse.json({ error: 'Gagal re-login ke Digit' }, { status: 401 });
      res = await fetchFromDigit(cookies, stglAwal, stglAkhir);
    }
    if (!res.ok) return NextResponse.json({ error: `Digit error: HTTP ${res.status}` }, { status: res.status });

    const json = await res.json();
    const rows: any[] = Array.isArray(json) ? json : (json.data ?? json.rows ?? []);

    // Hapus data lama untuk rentang ini lalu insert baru (replace strategi per periode)
    const isoAwal = toIso(stglAwal);
    const isoAkhir = toIso(stglAkhir);
    await db.execute({ sql: `DELETE FROM usr_log WHERE tgl BETWEEN ? AND ?`, args: [isoAwal, isoAkhir] });

    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      await db.batch(
        rows.slice(i, i + chunkSize).map((r: any) => ({
          sql: `INSERT INTO usr_log (level, datetime, channel, username, pesan, data_json, tgl) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            r.Level || '',
            r.Datetime || '',
            r.Channel || '',
            r.User || '',
            r.Pesan || '',
            r.Data ? JSON.stringify(r.Data) : null,
            r.Datetime ? r.Datetime.substring(0, 10) : isoAwal,
          ],
        })),
        'write'
      );
    }

    const lastUpdated = new Date().toISOString();
    await db.batch([
      { sql: `INSERT INTO system_settings (key, value, updated_at) VALUES ('last_scrape_usr_log', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP`, args: [lastUpdated] },
      { sql: `INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP`, args: [getScrapedPeriodSettingKey('last_scrape_usr_log'), encodeScrapedPeriod({ start: stglAwal, end: stglAkhir })] },
    ], 'write');

    await logActivity('SCRAPE', 'usr_log', `Scrape log aktivitas user: ${rows.length} baris (${stglAwal} - ${stglAkhir}).`, { total: rows.length, start: stglAwal, end: stglAkhir });

    return NextResponse.json({ success: true, total: rows.length, lastUpdated, scrapedPeriod: { start: stglAwal, end: stglAkhir } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
