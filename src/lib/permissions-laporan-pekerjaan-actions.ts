'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * Simpan konfigurasi Laporan Pekerjaan untuk satu role (Super Admin only).
 */
export async function saveRoleLaporanPekerjaanConfig(
  role: string,
  config: {
    allowed_bagian: string[];
    allowed_pic: string[];
    visible_columns: string[];
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

    const allowedBagianJson = JSON.stringify(config.allowed_bagian || []);
    const allowedPicJson = JSON.stringify(config.allowed_pic || []);
    const visibleColsJson = JSON.stringify(config.visible_columns || []);

    await db.execute({
      sql: `INSERT INTO role_laporan_pekerjaan_config (role, allowed_bagian, allowed_pic, visible_columns, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(role) DO UPDATE SET
              allowed_bagian = excluded.allowed_bagian,
              allowed_pic = excluded.allowed_pic,
              visible_columns = excluded.visible_columns,
              updated_at = CURRENT_TIMESTAMP;`,
      args: [role, allowedBagianJson, allowedPicJson, visibleColsJson],
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
