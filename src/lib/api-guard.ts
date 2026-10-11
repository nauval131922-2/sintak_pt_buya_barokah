import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getMergedPermissions } from '@/lib/permissions';
import type { ModuleKey } from '@/lib/permissions-constants';

// ponytail: API route guard — session + role check, balas 401/403 JSON (bukan redirect).
// Batasan: Super Admin selalu lolos; role lain dicek via permission union.
 export async function requireApiPermission(
   moduleKey: ModuleKey
 ): Promise<{ session: { userId: number; username: string; name: string }; error?: undefined } | { session?: undefined; error: NextResponse }> {
   const session = await getSession();
   if (!session?.userId) {
     return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
   }
   const roles = Array.isArray(session.roles) && session.roles.length > 0 ? session.roles : [session.role];
   if (roles.includes('Super Admin')) return { session: { userId: session.userId, username: session.username, name: session.name || '' } };
   const permissions = await getMergedPermissions(roles);
   if (permissions[moduleKey] !== true) {
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
