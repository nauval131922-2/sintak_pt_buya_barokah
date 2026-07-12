'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession, destroySession, getSession } from '@/lib/session';
import { getFirstAccessibleRoute } from '@/lib/permissions';
import { logActivity } from '@/lib/activity';

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; message?: string; firstRoute?: string }> {
  console.log(`[AUTH] Login attempt for user: ${username}`);
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE LOWER(username) = LOWER(?)',
      args: [username],
    });

    const user = result.rows[0];

    if (!user) {
      console.log(`[AUTH] User not found: ${username}`);
      logActivity('LOGIN', 'users', `Percobaan login gagal: Username "${username}" tidak ditemukan`, {}, username).catch(() => {});
      return { success: false, message: 'Username tidak ditemukan.' };
    }

    if (user.hasOwnProperty('is_active') && Number(user.is_active) === 0) {
      console.log(`[AUTH] User is inactive: ${username}`);
      logActivity('LOGIN', 'users', `Percobaan login gagal: Akun "${username}" dinonaktifkan`, {}, username).catch(() => {});
      return { success: false, message: 'Akun Anda dinonaktifkan. Hubungi Super Admin.' };
    }


    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      console.log(`[AUTH] Password mismatch for user: ${username}`);
      logActivity('LOGIN', 'users', `Percobaan login gagal: Password salah untuk user "${username}"`, {}, username).catch(() => {});
      return { success: false, message: 'Password salah.' };
    }

    // Ambil roles dari junction table
    const rolesResult = await db.execute({
      sql: 'SELECT role_name FROM user_roles WHERE user_id = ? ORDER BY role_name ASC',
      args: [user.id],
    });

    let roles: string[] = rolesResult.rows.map(r => r.role_name as string);

    // Fallback: jika user_roles belum ada data (pre-migration), pakai kolom users.role
    if (roles.length === 0 && user.role) {
      roles = [user.role as string];
    }

    // Validasi: semua role harus ada di app_roles (kecuali Super Admin)
    for (const roleName of roles) {
      if (roleName === 'Super Admin') continue;
      const roleCheck = await db.execute({
        sql: 'SELECT 1 FROM app_roles WHERE role_name = ?',
        args: [roleName],
      });
      if (roleCheck.rows.length === 0) {
        console.log(`[AUTH] Orphaned role: ${roleName} for user: ${username}`);
        return {
          success: false,
          message:
            'Akses masuk ditolak: Salah satu role Anda telah dihapus atau tidak dikenali. Hubungi Super Admin untuk penugasan ulang peran.',
        };
      }
    }

    if (roles.length === 0) {
      return { success: false, message: 'Akun tidak memiliki role yang aktif. Hubungi Super Admin.' };
    }

    // role (singular) = 'Super Admin' jika ada, otherwise first
    const primaryRole = roles.includes('Super Admin') ? 'Super Admin' : roles[0];

    await createSession({
      userId: Number(user.id),
      username: user.username as string,
      name: user.name as string,
      roles,
      role: primaryRole,
    });

    const firstRoute = await getFirstAccessibleRoute(roles);

    console.log(`[AUTH] Login success for user: ${username}, redirecting to: ${firstRoute}`);
    logActivity('LOGIN', 'users', `User ${username} berhasil login`, {}, username).catch(() => {});
    return { success: true, firstRoute };
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return { success: false, message: 'Terjadi kesalahan saat login.' };
  }
}

export async function logout() {
  const session = await getSession();
  if (session?.username) {
    logActivity('LOGOUT', 'users', `User ${session.username} logout`, {}, session.username).catch(() => {});
  }
  await destroySession();
}

export async function updateProfile(data: {
  name: string;
  username: string;
  password?: string;
  photo?: string | null;
}) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return { success: false, message: 'Tidak dapat mengotentikasi sesi Anda.' };
    }

    const userId = session.userId;

    const checkUser = await db.execute({
      sql: 'SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?',
      args: [data.username, userId],
    });
    if (checkUser.rows.length > 0) {
      return { success: false, message: 'Username sudah digunakan oleh akun lain.' };
    }

    const queryObj = { sql: '', args: [] as any[] };
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(data.password, salt);
      queryObj.sql = 'UPDATE users SET name = ?, username = ?, password = ?, photo = ? WHERE id = ?';
      queryObj.args = [data.name, data.username, hash, data.photo || null, userId];
    } else {
      queryObj.sql = 'UPDATE users SET name = ?, username = ?, photo = ? WHERE id = ?';
      queryObj.args = [data.name, data.username, data.photo || null, userId];
    }

    await db.execute(queryObj, 'Pengaturan Profil');

    // Refresh session — pertahankan roles
    const currentRoles = Array.isArray(session.roles) && session.roles.length > 0
      ? session.roles
      : [session.role];
    const primaryRole = currentRoles.includes('Super Admin') ? 'Super Admin' : currentRoles[0];

    await createSession({
      userId: session.userId,
      username: data.username,
      name: data.name,
      roles: currentRoles,
      role: primaryRole,
    });

    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, message: 'Terjadi kesalahan sistem saat memperbarui profil.' };
  }
}
