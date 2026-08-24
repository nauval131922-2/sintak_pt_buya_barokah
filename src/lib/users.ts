'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';
import { logActivity } from '@/lib/activity';


// Helper: pastikan hanya Super Admin yang bisa akses
async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || !session.userId) {
    throw new Error('Unauthorized');
  }
  const isSuperAdmin =
    session.role === 'Super Admin' ||
    (Array.isArray(session.roles) && session.roles.includes('Super Admin'));
  if (!isSuperAdmin) {
    throw new Error('Forbidden: Membutuhkan akses Super Admin');
  }
  return session;
}

// Helper: ambil roles dari junction table untuk satu user
async function getUserRoles(userId: number): Promise<string[]> {
  const res = await db.execute({
    sql: 'SELECT role_name FROM user_roles WHERE user_id = ? ORDER BY role_name ASC',
    args: [userId],
  });
  return res.rows.map(r => r.role_name as string);
}

// Helper: set roles di junction table (replace semua)
async function setUserRoles(userId: number, roles: string[]): Promise<void> {
  const uniqueRoles = [...new Set(roles.filter(Boolean))];

  // Hapus semua role lama
  await db.execute({
    sql: 'DELETE FROM user_roles WHERE user_id = ?',
    args: [userId],
  });

  // Insert role baru
  for (const roleName of uniqueRoles) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO user_roles (user_id, role_name) VALUES (?, ?)',
      args: [userId, roleName],
    });
  }

  // Sync kolom users.role = role utama (Super Admin prioritas, lalu pertama)
  const primaryRole = uniqueRoles.includes('Super Admin')
    ? 'Super Admin'
    : (uniqueRoles[0] || '');
  await db.execute({
    sql: 'UPDATE users SET role = ? WHERE id = ?',
    args: [primaryRole, userId],
  });
}

let userColumnsChecked = false;
async function ensureUserColumns() {
  if (userColumnsChecked) return;
  try {
    const check = await db.execute("PRAGMA table_info(users)");
    const cols = (check.rows as any[]).map(r => r.name);
    if (!cols.includes('employee_id')) {
      await db.execute("ALTER TABLE users ADD COLUMN employee_id INTEGER DEFAULT NULL;");
    }
    userColumnsChecked = true;
  } catch (_) {}
}

export async function getUsers() {
  try {
    await requireSuperAdmin();
    await ensureUserColumns();

    const result = await db.execute(
      `SELECT u.id, u.username, u.name, u.role, u.photo, u.is_active, u.employee_id, u.created_at,
              e.name as employee_name, e.position as employee_position, e.employee_no
       FROM users u
       LEFT JOIN employees e ON e.id = u.employee_id
       ORDER BY u.name ASC`
    );

    // Ambil roles dari junction table untuk setiap user
    const users = await Promise.all(
      result.rows.map(async (row) => {
        const userId = Number(row.id);
        const roles = await getUserRoles(userId);
        return {
          id: userId,
          username: String(row.username),
          name: String(row.name),
          // roles[] dari junction table; fallback ke kolom role jika belum ada data
          roles: roles.length > 0 ? roles : (row.role ? [String(row.role)] : []),
          role: String(row.role),
          photo: row.photo ? String(row.photo) : null,
          is_active: row.hasOwnProperty('is_active') && row.is_active !== null ? Number(row.is_active) : 1,
          employee_id: row.employee_id ? Number(row.employee_id) : null,
          employee_name: row.employee_name ? String(row.employee_name) : null,
          employee_position: row.employee_position ? String(row.employee_position) : null,
          created_at: row.created_at ? String(row.created_at) : null,
        };
      })
    );

    return { success: true, users };
  } catch (error: any) {
    return { success: false, message: error.message || 'Terjadi kesalahan sistem' };
  }
}

export async function createUser(data: {
  name: string;
  username: string;
  roles: string[];
  password?: string;
  employee_id?: number | null;
}) {
  try {
    const session = await requireSuperAdmin();
    await ensureUserColumns();

    if (!data.name || !data.username || !data.password || !data.roles?.length) {
      return { success: false, message: 'Data tidak lengkap.' };
    }

    // Cek username duplikat
    const checkUsr = await db.execute({
      sql: 'SELECT id FROM users WHERE LOWER(username) = LOWER(?)',
      args: [data.username],
    });
    if (checkUsr.rows.length > 0) {
      return { success: false, message: 'Username sudah terdaftar.' };
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password, salt);

    const uniqueRoles = [...new Set(data.roles.filter(Boolean))];
    const primaryRole = uniqueRoles.includes('Super Admin')
      ? 'Super Admin'
      : (uniqueRoles[0] || 'Admin');

    const result = await db.execute({
      sql: 'INSERT INTO users (name, username, password, role, employee_id) VALUES (?, ?, ?, ?, ?)',
      args: [data.name, data.username, hash, primaryRole, data.employee_id || null],
    });

    const newUserId = Number(result.lastInsertRowid);

    // Insert ke junction table
    await setUserRoles(newUserId, uniqueRoles);

    logActivity(
      'CREATE',
      'users',
      `User ${data.username} dibuat dengan role: ${uniqueRoles.join(', ')}`,
      {},
      session.username
    ).catch(() => {});

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Terjadi kesalahan sistem' };
  }
}

export async function updateUser(
  id: number,
  data: {
    name: string;
    username: string;
    roles: string[];
    password?: string;
    is_active?: number;
    employee_id?: number | null;
  }
) {
  try {
    const session = await requireSuperAdmin();
    await ensureUserColumns();

    if (!data.name || !data.username || !data.roles?.length) {
      return { success: false, message: 'Data tidak lengkap.' };
    }

    // Mencegah Super Admin menonaktifkan dirinya sendiri
    if (session.userId === id && data.is_active === 0) {
      return { success: false, message: 'Anda tidak dapat menonaktifkan akun Anda sendiri.' };
    }

    // Cek username duplikat
    const checkUsr = await db.execute({
      sql: 'SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?',
      args: [data.username, id],
    });
    if (checkUsr.rows.length > 0) {
      return { success: false, message: 'Username sudah dipakai oleh user lain.' };
    }

    const uniqueRoles = [...new Set(data.roles.filter(Boolean))];
    const primaryRole = uniqueRoles.includes('Super Admin')
      ? 'Super Admin'
      : (uniqueRoles[0] || 'Admin');

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(data.password, salt);
      await db.execute(
        {
          sql: 'UPDATE users SET name = ?, username = ?, role = ?, password = ?, is_active = ?, employee_id = ? WHERE id = ?',
          args: [data.name, data.username, primaryRole, hash, data.is_active ?? 1, data.employee_id || null, id],
        },
        'Kelola User'
      );
    } else {
      await db.execute(
        {
          sql: 'UPDATE users SET name = ?, username = ?, role = ?, is_active = ?, employee_id = ? WHERE id = ?',
          args: [data.name, data.username, primaryRole, data.is_active ?? 1, data.employee_id || null, id],
        },
        'Kelola User'
      );
    }

    // Update junction table
    await setUserRoles(id, uniqueRoles);

    // Jika mengedit diri sendiri, refresh session
    if (session.userId === id) {
      const { createSession } = await import('@/lib/session');
      await createSession({
        userId: session.userId,
        username: data.username,
        name: data.name,
        roles: uniqueRoles,
        role: primaryRole,
      });
    }

    logActivity(
      'UPDATE',
      'users',
      `User ${data.username} diperbarui dengan role: ${uniqueRoles.join(', ')}`,
      {},
      session.username
    ).catch(() => {});

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Terjadi kesalahan sistem' };
  }
}

export async function deleteUser(id: number) {
  try {
    const session = await requireSuperAdmin();

    if (session.userId === id) {
      return { success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri.' };
    }

    // user_roles akan otomatis terhapus karena FK ON DELETE CASCADE
    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [id],
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Terjadi kesalahan sistem' };
  }
}
