// permissions.ts — No top-level 'use server' because this file also exports non-function constants.
// Functions that mutate data use 'use server' inline (in their own invocation scope).

import { cache } from 'react';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { MODULE_REGISTRY } from './permissions-constants';
import type { PermissionMap, ModuleKey } from './permissions-constants';
export { MODULE_REGISTRY } from './permissions-constants';
export type { ModuleKey, PermissionMap } from './permissions-constants';

// ─── Map module key to its primary route ──────────────────────────────────────
// Ordered by sidebar priority — first accessible route wins.
const MODULE_TO_ROUTE: Array<{ key: string; route: string }> = [
  { key: 'dashboard',             route: '/dashboard' },
  { key: 'hrd_dashboard',         route: '/dashboard-hrd' },
  { key: 'produksi_dashboard',    route: '/dashboard-manufaktur' },
  { key: 'akt_dashboard',         route: '/dashboard-akunting' },
  { key: 'sync',                  route: '/sync' },
  { key: 'pembelian_pr',          route: '/pr' },
  { key: 'pembelian_spph',        route: '/spph-out' },
  { key: 'pembelian_sph_in',      route: '/sph-in' },
  { key: 'pembelian_po',          route: '/purchase-orders' },
  { key: 'pembelian_penerimaan',  route: '/penerimaan-pembelian' },
  { key: 'pembelian_rekap',       route: '/rekap-pembelian-barang' },
  { key: 'pembelian_hutang',      route: '/pelunasan-hutang' },
  { key: 'produksi_bom',          route: '/bom' },
  { key: 'produksi_orders',       route: '/orders' },
  { key: 'produksi_selesai',      route: '/data-digit/produksi/produksi-selesai' },
  { key: 'produksi_bahan_baku',   route: '/bahan-baku' },
  { key: 'produksi_barang_jadi',  route: '/barang-jadi' },
  { key: 'penjualan_sph_out',     route: '/sph-out' },
  { key: 'penjualan_so',          route: '/sales-orders' },
  { key: 'penjualan_laporan',     route: '/sales' },
  { key: 'penjualan_piutang',     route: '/pelunasan-piutang' },
  { key: 'penjualan_pengiriman',  route: '/pengiriman' },
  { key: 'kalkulasi_rekap_so',    route: '/rekap-sales-order' },
  { key: 'karyawan',              route: '/employees' },
  { key: 'hpp_kalkulasi',         route: '/hpp-kalkulasi' },
  { key: 'pricelist_kalkulasi',   route: '/pricelist' },
  { key: 'catat_kesalahan',       route: '/records' },
  { key: 'tracking_manufaktur',   route: '/tracking-manufaktur' },
  { key: 'activity_log_view',     route: '/log-aktivitas' },
  { key: 'activity_log',          route: '/log-aktivitas' },
  { key: 'produksi_jhp',          route: '/jurnal-harian-produksi' },
  { key: 'produksi_hasil',        route: '/hasil-produksi' },
  { key: 'produksi_laporan_pekerjaan', route: '/laporan-pekerjaan' },
  { key: 'telegram_users',        route: '/settings/telegram-users' },
  { key: 'stok_master_barang',    route: '/data-digit/stok/master-barang' },
  { key: 'usr_log_view',          route: '/data-digit/sistem/log-aktivitas-user' },
];

// ─── Get first accessible route berdasarkan array roles ───────────────────────
// Dipakai setelah login — user diarahkan ke halaman pertama yang boleh diakses.
export async function getFirstAccessibleRoute(roles: string[]): Promise<string> {
  if (roles.includes('Super Admin')) return '/dashboard';

  const permissions = await getMergedPermissions(roles);

  for (const { key, route } of MODULE_TO_ROUTE) {
    if (permissions[key] === true) return route;
  }

  return '/profile';
}

// ─── Fetch permissions untuk satu role (di-cache per role) ────────────────────
export const getRolePermissions = cache(async (role: string): Promise<PermissionMap> => {
  if (role === 'Super Admin') {
    return Object.fromEntries(MODULE_REGISTRY.map(m => [m.key, true]));
  }

  try {
    const result = await db.execute({
      sql: 'SELECT module_key, can_access FROM role_permissions WHERE role = ?',
      args: [role],
    });

    const dbMap: PermissionMap = {};
    for (const row of result.rows) {
      dbMap[row.module_key as string] = Number(row.can_access) === 1;
    }

    const map: PermissionMap = {};
    for (const m of MODULE_REGISTRY) {
      map[m.key] = dbMap[m.key] !== undefined ? dbMap[m.key] : false;
    }

    // Legacy: activity_log → otomatis izin lihat
    if (dbMap.activity_log) {
      map.activity_log_view = true;
    }

    return map;
  } catch (error) {
    console.error('[PERMISSIONS] Failed to fetch role permissions:', error);
    return Object.fromEntries(MODULE_REGISTRY.map(m => [m.key, false]));
  }
});

// ─── Merge permissions dari array roles (union: true jika salah satu role mengizinkan) ──
// ponytail: cache by roles key — layout + requirePermission share 1 merge/request
export const getMergedPermissions = cache(async (roles: string[]): Promise<PermissionMap> => {
  if (!roles || roles.length === 0) {
    return Object.fromEntries(MODULE_REGISTRY.map(m => [m.key, false]));
  }

  // Super Admin selalu full access
  if (roles.includes('Super Admin')) {
    return Object.fromEntries(MODULE_REGISTRY.map(m => [m.key, true]));
  }

  // Ambil permissions masing-masing role lalu union (OR)
  const allMaps = await Promise.all(roles.map(r => getRolePermissions(r)));

  const merged: PermissionMap = {};
  for (const m of MODULE_REGISTRY) {
    merged[m.key] = allMaps.some(map => map[m.key] === true);
  }
  return merged;
});

// ─── Fetch permissions untuk semua role (untuk matrix UI) ─────────────────────
export async function getAllPermissions(): Promise<Record<string, PermissionMap>> {
  const result: Record<string, PermissionMap> = {};

  try {
    const { rows } = await db.execute('SELECT role_name FROM app_roles');
    const roles = ['Super Admin', ...rows.map(r => r.role_name as string)];

    for (const role of roles) {
      result[role] = await getRolePermissions(role);
    }
  } catch (err) {
    console.error('[PERMISSIONS] Failed to fetch all roles:', err);
    result['Super Admin'] = await getRolePermissions('Super Admin');
    result['Admin'] = await getRolePermissions('Admin');
  }

  return result;
}

// ─── Server-side enforcement: redirect jika tidak punya akses ─────────────────
export async function requirePermission(moduleKey: ModuleKey): Promise<void> {
  const session = await getSession();

  if (!session || !session.userId) {
    redirect('/login');
  }

  // Super Admin selalu punya akses
  if (session.roles?.includes('Super Admin') || session.role === 'Super Admin') return;

  let isDenied = false;

  try {
    const roles = Array.isArray(session.roles) && session.roles.length > 0
      ? session.roles
      : [session.role];
    const permissions = await getMergedPermissions(roles);
    if (!permissions[moduleKey]) {
      isDenied = true;
    }
  } catch (error) {
    console.error(`[PERMISSIONS] Error checking access for ${moduleKey}:`, error);
  }

  if (isDenied) {
    redirect('/unauthorized');
  }
}
