'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/session';

let tableChecked = false;
async function ensureTable() {
  if (tableChecked) return;
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS role_laporan_pekerjaan_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT UNIQUE NOT NULL,
      allowed_bagian TEXT DEFAULT '[]',
      allowed_pic TEXT DEFAULT '[]',
      visible_columns TEXT DEFAULT '[]',
      can_add INTEGER DEFAULT 1,
      can_edit INTEGER DEFAULT 1,
      can_delete INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);
    const check = await db.execute("PRAGMA table_info(role_laporan_pekerjaan_config)");
    const cols = (check.rows as any[]).map((r) => r.name);
    if (!cols.includes('can_add')) {
      await db.execute("ALTER TABLE role_laporan_pekerjaan_config ADD COLUMN can_add INTEGER DEFAULT 1;");
    }
    if (!cols.includes('can_edit')) {
      await db.execute("ALTER TABLE role_laporan_pekerjaan_config ADD COLUMN can_edit INTEGER DEFAULT 1;");
    }
    if (!cols.includes('can_delete')) {
      await db.execute("ALTER TABLE role_laporan_pekerjaan_config ADD COLUMN can_delete INTEGER DEFAULT 1;");
    }
    tableChecked = true;
  } catch (_) {}
}

/**
 * Simpan konfigurasi Laporan Pekerjaan untuk satu role (Super Admin only).
 */
export async function saveRoleLaporanPekerjaanConfig(
  role: string,
  config: {
    allowed_bagian: string[];
    allowed_pic: string[];
    visible_columns: string[];
    can_add?: boolean;
    can_edit?: boolean;
    can_delete?: boolean;
  }
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'Super Admin') {
      return { success: false, message: 'Forbidden: Hanya Super Admin yang dapat mengubah konfigurasi role.' };
    }

    if (role === 'Super Admin') {
      return { success: false, message: 'Konfigurasi Super Admin tidak dapat dibatasi.' };
    }

    await ensureTable();

    const allowedBagianJson = JSON.stringify(config.allowed_bagian || []);
    const allowedPicJson = JSON.stringify(config.allowed_pic || []);
    const visibleColsJson = JSON.stringify(config.visible_columns || []);
    const canAddVal = config.can_add === false ? 0 : 1;
    const canEditVal = config.can_edit === false ? 0 : 1;
    const canDeleteVal = config.can_delete === false ? 0 : 1;

    await db.execute({
      sql: `INSERT INTO role_laporan_pekerjaan_config (role, allowed_bagian, allowed_pic, visible_columns, can_add, can_edit, can_delete, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(role) DO UPDATE SET
              allowed_bagian = excluded.allowed_bagian,
              allowed_pic = excluded.allowed_pic,
              visible_columns = excluded.visible_columns,
              can_add = excluded.can_add,
              can_edit = excluded.can_edit,
              can_delete = excluded.can_delete,
              updated_at = CURRENT_TIMESTAMP;`,
      args: [role, allowedBagianJson, allowedPicJson, visibleColsJson, canAddVal, canEditVal, canDeleteVal],
    });

    const { logActivity } = await import('@/lib/activity');
    logActivity(
      'UPDATE',
      'role_laporan_pekerjaan_config',
      `Pembaruan konfigurasi Laporan Pekerjaan untuk role ${role}`,
      { role, config }
    ).catch(() => {});

    return { success: true };
  } catch (error: any) {
    console.error('[PERMISSIONS] Gagal menyimpan konfigurasi laporan pekerjaan role:', error);
    return { success: false, message: error.message || 'Gagal menyimpan konfigurasi.' };
  }
}
