import { NextRequest, NextResponse } from 'next/server';
import { getSession as getScraperSession, clearCachedSession } from '@/lib/session-cache';
import { getSession } from '@/lib/session';
import { getMergedPermissions } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://buyapercetakan.mdthoster.com/il/';
const API_EMAIL = process.env.SCRAPER_EMAIL || 'nauval';
const API_PASSWORD = process.env.SCRAPER_PASSWORD!;
const API_KEY = process.env.SCRAPER_API_KEY!;

async function getDigitCookies(): Promise<string | null> {
  return getScraperSession(async () => {
    const res = await fetch(BASE_URL + 'v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json; charset=utf-8',
        'X-Bismillah-Api-Key': API_KEY,
      },
      body: JSON.stringify({ username: API_EMAIL, password: API_PASSWORD }),
    });
    return res.headers.get('set-cookie');
  });
}

async function fetchLog(cookies: string, stglAwal: string, stglAkhir: string) {
  const url = `${BASE_URL}v1/cfg/usr_log/grid?bsearch[stgl_awal]=${encodeURIComponent(stglAwal)}&bsearch[stgl_akhir]=${encodeURIComponent(stglAkhir)}`;
  return fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json', Cookie: cookies, 'X-Bismillah-Api-Key': API_KEY },
  });
}

export async function GET(request: NextRequest) {
  // Auth check via session (bukan requirePermission — tidak bisa redirect di API route)
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roles = Array.isArray(session.roles) && session.roles.length > 0 ? session.roles : [session.role];
  if (!roles.includes('Super Admin')) {
    const perms = await getMergedPermissions(roles);
    if (!perms.usr_log_view) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const stglAwal = searchParams.get('stgl_awal') || '';
    const stglAkhir = searchParams.get('stgl_akhir') || '';

    if (!stglAwal || !stglAkhir) {
      return NextResponse.json({ error: 'stgl_awal dan stgl_akhir wajib diisi' }, { status: 400 });
    }

    let cookies = await getDigitCookies();
    if (!cookies) return NextResponse.json({ error: 'Gagal login ke Digit' }, { status: 401 });

    let res = await fetchLog(cookies, stglAwal, stglAkhir);

    if (res.status === 401) {
      clearCachedSession();
      cookies = await getDigitCookies();
      if (!cookies) return NextResponse.json({ error: 'Gagal re-login ke Digit' }, { status: 401 });
      res = await fetchLog(cookies, stglAwal, stglAkhir);
    }

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Digit API error: HTTP ${res.status}`, detail: text.substring(0, 200) }, { status: res.status });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
