import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getMergedPermissions } from '@/lib/permissions';
import { verifyBearerToken } from '@/lib/crypto-compare';
import type { ModuleKey } from '@/lib/permissions-constants';
// ponytail: API route guard — session + role check, balas 401/403 JSON (bukan redirect).
// Batasan: Super Admin selalu lolos; role lain dicek via permission union.
export async function requireApiPermission(
  moduleKey: ModuleKey | ModuleKey[]
): Promise<{ session: { userId: number; username: string; name: string }; error?: undefined } | { session?: undefined; error: NextResponse }> {
  const session = await getSession();
  if (!session?.userId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const roles = Array.isArray(session.roles) && session.roles.length > 0 ? session.roles : [session.role];
  if (roles.includes('Super Admin')) return { session: { userId: session.userId, username: session.username, name: session.name || '' } };
  const permissions = await getMergedPermissions(roles);
  const hasAccess = Array.isArray(moduleKey)
    ? moduleKey.some(k => permissions[k] === true)
    : permissions[moduleKey] === true;
  if (!hasAccess) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session: { userId: session.userId, username: session.username, name: session.name || '' } };
}

// ponytail: guard khusus Super Admin untuk rute debug/sistem (tanpa module key).
export async function requireSuperAdmin(): Promise<
  { session: { userId: number; username: string }; error?: undefined } | { session?: undefined; error: NextResponse }
> {
  const session = await getSession();
  if (!session?.userId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const roles = Array.isArray(session.roles) && session.roles.length > 0 ? session.roles : [session.role];
  if (!roles.includes('Super Admin')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session: { userId: session.userId, username: session.username } };
}

/**
 * Guard untuk rute scraper & data-digit sinkronisasi:
 * Mengizinkan jika dipanggil oleh Cron VPS dengan header Bearer CRON_SECRET,
 * ATAU user yang memiliki sesi aktif (session cookie).
 */
export async function requireScraperAuth(
  request: NextRequest
): Promise<{ isCron: boolean; session?: { userId: number; username: string }; error?: NextResponse }> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (verifyBearerToken(authHeader, cronSecret)) {
    return { isCron: true };
  }
  const session = await getSession();
  if (session?.userId) {
    return { isCron: false, session: { userId: session.userId, username: session.username } };
  }
  return { isCron: false, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
}
