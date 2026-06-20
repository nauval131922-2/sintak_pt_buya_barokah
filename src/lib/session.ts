import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import db from '@/lib/db';

const secretKey = process.env.SESSION_SECRET || 'sintaksecretkey_change_in_production';
const key = new TextEncoder().encode(secretKey);

interface SessionPayload {
  userId: number;
  username: string;
  name: string;
  // roles[] adalah sumber kebenaran; role (singular) dipertahankan sebagai string
  // untuk backward-compat dengan kode lain yang masih pakai session.role.
  // Nilai role = roles[0] atau 'Admin' jika kosong.
  roles: string[];
  role: string;
  [key: string]: any;
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt(payload);

  const cookieStore = await cookies();
  cookieStore.set('sintak_session', session, {
    expires,
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('sintak_session')?.value;
  if (!session) return null;

  const payload = await decrypt(session);
  if (!payload) return null;

  // Refresh roles dari DB setiap request agar perubahan role langsung berlaku
  try {
    const { rows } = await db.execute({
      sql: `SELECT ur.role_name
            FROM user_roles ur
            WHERE ur.user_id = ?
            ORDER BY ur.role_name ASC`,
      args: [payload.userId],
    });

    if (rows.length > 0) {
      const freshRoles = rows.map((r) => r.role_name as string);
      payload.roles = freshRoles;
      // role (singular) = 'Super Admin' jika ada, otherwise first role
      payload.role = freshRoles.includes('Super Admin')
        ? 'Super Admin'
        : freshRoles[0];
    } else {
      // Fallback: baca dari kolom users.role (pre-migration atau user tanpa user_roles)
      const userRow = await db.execute({
        sql: 'SELECT role FROM users WHERE id = ?',
        args: [payload.userId],
      });
      if (userRow.rows.length > 0) {
        const r = userRow.rows[0].role as string;
        payload.roles = r ? [r] : [];
        payload.role = r || '';
      }
    }
  } catch (_) {}

  // Pastikan payload.roles selalu ada (token lama tidak punya field ini)
  if (!Array.isArray(payload.roles)) {
    payload.roles = payload.role ? [payload.role] : [];
  }

  return payload;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set('sintak_session', '', {
    expires: new Date(0),
    path: '/',
  });
}
