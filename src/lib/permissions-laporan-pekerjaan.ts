import db from '@/lib/db';
import {
  LAPORAN_PEKERJAAN_COLUMNS,
  LAPORAN_PEKERJAAN_BAGIAN_LIST,
  type RoleLaporanPekerjaanConfig,
  type LaporanPekerjaanColumnKey,
} from './permissions-laporan-pekerjaan-constants';

export {
  LAPORAN_PEKERJAAN_COLUMNS,
  LAPORAN_PEKERJAAN_BAGIAN_LIST,
  type RoleLaporanPekerjaanConfig,
  type LaporanPekerjaanColumnKey,
} from './permissions-laporan-pekerjaan-constants';

export { saveRoleLaporanPekerjaanConfig } from './permissions-laporan-pekerjaan-actions';

export function parseJsonArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }
  return [];
}

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);
    tableChecked = true;
  } catch (_) {}
}

/**
 * Ambil konfigurasi Laporan Pekerjaan untuk satu role.
 */
export async function getRoleLaporanPekerjaanConfig(role: string): Promise<RoleLaporanPekerjaanConfig> {
  const allColumns = LAPORAN_PEKERJAAN_COLUMNS.map(c => c.key);
  if (role === 'Super Admin') {
    return {
      role: 'Super Admin',
      allowed_bagian: [],
      allowed_pic: [],
      visible_columns: allColumns,
    };
  }

  await ensureTable();

  try {
    const res = await db.execute({
      sql: 'SELECT role, allowed_bagian, allowed_pic, visible_columns FROM role_laporan_pekerjaan_config WHERE role = ?',
      args: [role],
    });

    if (res.rows.length === 0) {
      return {
        role,
        allowed_bagian: [],
        allowed_pic: [],
        visible_columns: allColumns,
      };
    }

    const row = res.rows[0];
    const allowed_bagian = parseJsonArray(row.allowed_bagian);
    const allowed_pic = parseJsonArray(row.allowed_pic);
    let visible_columns = parseJsonArray(row.visible_columns);
    if (visible_columns.length === 0) {
      visible_columns = allColumns;
    }

    return {
      role,
      allowed_bagian,
      allowed_pic,
      visible_columns,
    };
  } catch (error) {
    console.error(`[PERMISSIONS] Failed to get config for role ${role}:`, error);
    return {
      role,
      allowed_bagian: [],
      allowed_pic: [],
      visible_columns: allColumns,
    };
  }
}

/**
 * Ambil konfigurasi Laporan Pekerjaan untuk semua role yang terdaftar.
 */
export async function getAllRoleLaporanPekerjaanConfigs(): Promise<Record<string, RoleLaporanPekerjaanConfig>> {
  const allColumns = LAPORAN_PEKERJAAN_COLUMNS.map(c => c.key);
  const result: Record<string, RoleLaporanPekerjaanConfig> = {
    'Super Admin': {
      role: 'Super Admin',
      allowed_bagian: [],
      allowed_pic: [],
      visible_columns: allColumns,
    },
  };

  await ensureTable();

  try {
    const { rows } = await db.execute('SELECT role, allowed_bagian, allowed_pic, visible_columns FROM role_laporan_pekerjaan_config');
    for (const row of rows) {
      const roleName = String(row.role);
      const allowed_bagian = parseJsonArray(row.allowed_bagian);
      const allowed_pic = parseJsonArray(row.allowed_pic);
      let visible_columns = parseJsonArray(row.visible_columns);
      if (visible_columns.length === 0) {
        visible_columns = allColumns;
      }
      result[roleName] = {
        role: roleName,
        allowed_bagian,
        allowed_pic,
        visible_columns,
      };
    }
  } catch (error) {
    console.error('[PERMISSIONS] Failed to get all role configs:', error);
  }

  return result;
}

/**
 * Gabungkan (merge) konfigurasi Laporan Pekerjaan dari array roles milik user aktif.
 */
export async function getUserMergedLaporanPekerjaanConfig(roles: string[]): Promise<RoleLaporanPekerjaanConfig> {
  const allColumns = LAPORAN_PEKERJAAN_COLUMNS.map(c => c.key);
  if (!roles || roles.length === 0 || roles.includes('Super Admin')) {
    return {
      role: 'Super Admin',
      allowed_bagian: [],
      allowed_pic: [],
      visible_columns: allColumns,
    };
  }

  const allConfigs = await Promise.all(roles.map(r => getRoleLaporanPekerjaanConfig(r)));

  // Jika salah satu role memiliki akses ALL bagian (array kosong), user mendapatkan akses ALL bagian.
  // Selain itu, union dari allowed_bagian masing-masing role.
  let allowed_bagian: string[] = [];
  const hasUnrestrictedBagian = allConfigs.some(c => !c.allowed_bagian || c.allowed_bagian.length === 0);
  if (!hasUnrestrictedBagian) {
    const bagianSet = new Set<string>();
    allConfigs.forEach(c => c.allowed_bagian?.forEach(b => bagianSet.add(b.toUpperCase())));
    allowed_bagian = Array.from(bagianSet);
  }

  // Jika salah satu role memiliki akses ALL pic (array kosong), user mendapatkan akses ALL pic.
  // Selain itu, union dari allowed_pic masing-masing role.
  let allowed_pic: string[] = [];
  const hasUnrestrictedPic = allConfigs.some(c => !c.allowed_pic || c.allowed_pic.length === 0);
  if (!hasUnrestrictedPic) {
    const picSet = new Set<string>();
    allConfigs.forEach(c => c.allowed_pic?.forEach(p => picSet.add(p)));
    allowed_pic = Array.from(picSet);
  }

  // Column visibility union: jika salah satu role mengizinkan kolom tersebut, kolom ditampilkan.
  const colSet = new Set<string>();
  allConfigs.forEach(c => {
    if (!c.visible_columns || c.visible_columns.length === 0) {
      allColumns.forEach(col => colSet.add(col));
    } else {
      c.visible_columns.forEach(col => colSet.add(col));
    }
  });

  return {
    role: roles.join(', '),
    allowed_bagian,
    allowed_pic,
    visible_columns: Array.from(colSet),
  };
}
