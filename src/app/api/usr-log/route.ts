import { NextRequest, NextResponse } from 'next/server';
import { getSession as getScraperSession, getCachedSession, clearCachedSession } from '@/lib/session-cache';
import { requirePermission } from '@/lib/permissions';

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

export async function POST(request: NextRequest) {
  try {
    await requirePermission('usr_log_view');

    const body = await request.text();

    let cookies = await getDigitCookies();
    if (!cookies) {
      return NextResponse.json({ error: 'Gagal login ke Digit' }, { status: 401 });
    }

    // Coba request, jika 401 clear cache dan retry sekali
    let res = await fetch(BASE_URL + 'v1/cfg/usr_log/grid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookies,
        'X-Bismillah-Api-Key': API_KEY,
      },
      body,
    });

    if (res.status === 401) {
      clearCachedSession();
      cookies = await getDigitCookies();
      if (!cookies) return NextResponse.json({ error: 'Gagal re-login ke Digit' }, { status: 401 });
      res = await fetch(BASE_URL + 'v1/cfg/usr_log/grid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: cookies,
          'X-Bismillah-Api-Key': API_KEY,
        },
        body,
      });
    }

    if (!res.ok) {
      return NextResponse.json({ error: `Digit API error: HTTP ${res.status}` }, { status: res.status });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
