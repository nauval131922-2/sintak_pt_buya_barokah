import type { PermissionMap } from '@/lib/permissions-constants';

export type PageChangelog = {
  pageKey: string;
  version: string;
  title: string;
  items: string[];
  /** Tampilan: "25 Jul 2026" */
  date?: string;
  /** Sort: "2026-07-25" — terbaru di atas di /log-perubahan */
  sortDate: string;
  /** User lihat entry ini jika canAccess salah satu key (OR) */
  permissionKeys: string[];
};

/** Satu gelombang catch-up: 78 commit lokal + perubahan belum commit (25 Jul 2026). */
const CATCHUP_VERSION = '2026-07-25-catchup-1';
const CATCHUP_DATE = '25 Jul 2026';
const CATCHUP_SORT = '2026-07-25';

/** Hanya Super Admin (tidak ada di role_permissions biasa). */
const SUPER_ADMIN_ONLY = ['_super_admin_only'] as const;

const UI_POLISH = [
  'Tampilan diseragamkan dengan desain SINTAK terbaru (kartu, label, empty state)',
  'Teks dan label lebih mudah dibaca',
] as const;

function entry(
  partial: Omit<PageChangelog, 'sortDate' | 'date' | 'version'> & {
    version?: string;
    date?: string;
    sortDate?: string;
  }
): PageChangelog {
  return {
    version: CATCHUP_VERSION,
    date: CATCHUP_DATE,
    sortDate: CATCHUP_SORT,
    ...partial,
  };
}

export const PAGE_CHANGELOGS: Record<string, PageChangelog> = {
  login: entry({
    pageKey: 'login',
    title: 'Halaman Login',
    permissionKeys: [],
    sortDate: '2026-08-02',
    date: '02 Agt 2026',
    version: '2026-08-02-1',
    items: [
      'Header brand SINTAK pada tampilan mobile (373px) dipindah ke pojok kiri atas',
      'Penulisan sub-judul "Sistem Informasi Cetak" disesuaikan menjadi title case',
    ],
  }),

  dashboard: entry({
    pageKey: 'dashboard',
    title: 'Dashboard',
    permissionKeys: ['dashboard'],
    items: [
      'Tampilan diseragamkan: kartu lebih rapi, warna hijau, teks lebih mudah dibaca',
      'Latar halaman lebih nyaman di mata (bukan putih menyilau / abu-abu gradasi)',
      'Scroll dan header lebih stabil saat melihat ringkasan',
      'Beberapa ringkasan data dimuat lebih ringan',
    ],
  }),

  'dashboard-manufaktur': entry({
    pageKey: 'dashboard-manufaktur',
    title: 'Dashboard Manufaktur',
    permissionKeys: ['produksi_dashboard'],
    items: [
      'Kartu dan grafik diseragamkan dengan desain SINTAK terbaru',
      'Teks label lebih jelas (ukuran minimum diperbaiki)',
      'Scroll halaman lebih nyaman',
      'Data ringkasan produksi dimuat lebih ringan',
    ],
  }),

  'dashboard-akunting': entry({
    pageKey: 'dashboard-akunting',
    title: 'Dashboard Akunting',
    permissionKeys: ['akt_dashboard'],
    items: [
      'Kartu jurnal, tren, dan peringatan barang jadi tampilan lebih rapi',
      'Label dan angka lebih mudah dibaca',
      'Scroll dan layout diseragamkan dengan dashboard lain',
    ],
  }),

  'dashboard-hrd': entry({
    pageKey: 'dashboard-hrd',
    title: 'Dashboard HRD',
    permissionKeys: ['hrd_dashboard'],
    items: [
      'Kartu statistik dan tren pelanggaran tampilan lebih rapi',
      'Filter dan tabel catatan lebih ringkas',
      'Teks label lebih jelas di seluruh kartu',
    ],
  }),

   'jurnal-harian-produksi': entry({
     pageKey: 'jurnal-harian-produksi',
     title: 'Jurnal Harian Produksi',
     version: '2026-07-30-filter-pekerjaan',
     date: '30 Jul 2026',
     sortDate: '2026-07-30',
     permissionKeys: ['produksi_jhp'],
     items: [
       'Filter Pekerjaan otomatis mengikuti Order yang dipilih — hanya menampilkan pekerjaan relevan',
       'Filter Pekerjaan reset otomatis saat Order diganti',
     ],
   }),

  'excel-sopd': entry({
    pageKey: 'excel-sopd',
    title: 'Data Excel SOPd',
    permissionKeys: ['produksi_jhp_sopd'],
    items: [
      'Tampilan tabel dan filter diseragamkan dengan modul JHP lain',
      'Label dan empty state lebih mudah dibaca',
      'Kartu filter tanggal kembali ke pola yang stabil',
    ],
  }),

  'master-pekerjaan': entry({
    pageKey: 'master-pekerjaan',
    title: 'Master Pekerjaan',
    permissionKeys: ['produksi_jhp_master_pekerjaan'],
    items: [
      'Tampilan daftar dan upload diseragamkan dengan desain SINTAK terbaru',
      'Label dan empty state lebih mudah dibaca',
    ],
  }),

  'master-pekerjaan-jurnal-produksi': entry({
    pageKey: 'master-pekerjaan-jurnal-produksi',
    title: 'Master Pekerjaan Jurnal Produksi',
    permissionKeys: ['produksi_jhp_master_pekerjaan_jurnal_produksi'],
    items: [
      'Input manual: tambah, edit, dan hapus per baris',
      'Bulk hapus: pilih baris (klik / Ctrl / Shift) lalu Hapus N',
      'Upload Excel jadi merge-only — data manual tidak terhapus',
      'Modal form tidak tertutup saat klik di luar; kolom Aksi dengan teks Edit & Hapus',
      'Tampilan daftar diseragamkan; ada log perubahan di ikon header',
    ],
  }),

  'jurnal-harian-produksi-target': entry({
    pageKey: 'jurnal-harian-produksi-target',
    title: 'Target Jurnal Harian Produksi',
    permissionKeys: ['produksi_jhp_target'],
    items: [
      'Tampilan dan label diseragamkan dengan modul JHP',
      'Performa halaman ditingkatkan agar lebih ringan dipakai',
    ],
  }),

  'jurnal-harian-produksi-analisa': entry({
    pageKey: 'jurnal-harian-produksi-analisa',
    title: 'Analisa Jurnal Harian Produksi',
    permissionKeys: ['produksi_jhp_analisa'],
    items: [
      'Tampilan kartu dan panel diseragamkan dengan desain SINTAK terbaru',
      'Label lebih jelas dan mudah dibaca',
    ],
  }),

  'tracking-manufaktur': entry({
    pageKey: 'tracking-manufaktur',
    title: 'Tracking Manufaktur',
    permissionKeys: ['tracking_manufaktur'],
    items: [
      'Pemuatan data tracking lebih ringan dan stabil',
      'Tampilan tabel dan label diseragamkan',
      'Dropdown dan filter lebih responsif',
    ],
  }),

  'log-aktivitas': entry({
    pageKey: 'log-aktivitas',
    title: 'Log Aktivitas',
    permissionKeys: ['activity_log_view', 'activity_log'],
    items: [
      'Tampilan daftar dan grafik diseragamkan',
      'Label dan empty state lebih mudah dibaca',
      'Beberapa query log dimuat lebih ringan',
    ],
  }),

  records: entry({
    pageKey: 'records',
    title: 'Catatan / Records',
    permissionKeys: ['catat_kesalahan'],
    items: [
      'Bilah filter lebih ringkas (satu baris, tombol outline)',
      'Kartu dan form diseragamkan dengan desain SINTAK',
      'Teks label lebih jelas di seluruh halaman',
    ],
  }),

  bom: entry({
    pageKey: 'bom',
    title: 'Bill of Materials (BOM)',
    permissionKeys: ['produksi_bom'],
    items: [
      'Daftar BOM dimuat lebih ringan',
      'Tampilan tabel dan label diseragamkan',
    ],
  }),

  'hasil-produksi': entry({
    pageKey: 'hasil-produksi',
    title: 'Hasil Produksi',
    permissionKeys: ['produksi_hasil'],
    sortDate: '2026-07-30',
    date: '30 Jul 2026',
    version: '2026-07-30-1',
    items: [
      'Tampilan kartu (card view) — alternatif tabel untuk layar kecil, tanpa scroll kiri-kanan',
      'Toggle kartu/tabel di tab bar, pilihan tersimpan otomatis',
      'Di hp, default otomatis kartu; di desktop tetap tabel',
      'Setiap kartu jurnal bisa dibuka untuk lihat detail (bahan, jam, kendala, keterangan)',
      'Tab barang jadi juga mendukung tampilan kartu dengan total harian',
    ],
  }),

  'log-perubahan': entry({
    pageKey: 'log-perubahan',
    title: 'Log Perubahan',
    // kosong = semua user login (hub di menu profil)
    permissionKeys: [],
    sortDate: '2026-07-26',
    date: '26 Jul 2026',
    version: '2026-07-26-1',
    items: [
      'Menu Log Perubahan di profil (sidebar) — arsip update per tanggal dan per menu',
      'Hanya menampilkan log untuk menu yang Anda bisa akses',
      'Accordion per menu; tombol Buka ke halaman terkait',
      'Icon log di header halaman yang punya entry rilis',
    ],
  }),

  // —— Catch-up sisa path vs origin/master (design system massal) ——
  'rek-akuntansi': entry({
    pageKey: 'rek-akuntansi',
    title: 'Rek Akuntansi',
    permissionKeys: ['akt_mrek'],
    items: [...UI_POLISH],
  }),
  'jurnal-umum': entry({
    pageKey: 'jurnal-umum',
    title: 'Jurnal Umum',
    permissionKeys: ['akt_jurnal_umum'],
    items: [...UI_POLISH],
  }),
  'bahan-baku': entry({
    pageKey: 'bahan-baku',
    title: 'BBB Produksi',
    permissionKeys: ['produksi_bahan_baku'],
    items: [...UI_POLISH, 'Daftar dan filter lebih rapi'],
  }),
  'barang-jadi': entry({
    pageKey: 'barang-jadi',
    title: 'Penerimaan Barang Hasil Produksi',
    permissionKeys: ['produksi_barang_jadi'],
    items: [...UI_POLISH, 'Daftar dan filter lebih rapi'],
  }),
  'produksi-selesai': entry({
    pageKey: 'produksi-selesai',
    title: 'Produksi Selesai',
    permissionKeys: ['produksi_selesai'],
    items: [...UI_POLISH],
  }),
  'master-barang': entry({
    pageKey: 'master-barang',
    title: 'Master Barang',
    permissionKeys: ['stok_master_barang'],
    items: [...UI_POLISH],
  }),
  'hpp-kalkulasi': entry({
    pageKey: 'hpp-kalkulasi',
    title: 'HPP Kalkulasi',
    permissionKeys: ['hpp_kalkulasi'],
    items: [...UI_POLISH],
  }),
  orders: entry({
    pageKey: 'orders',
    title: 'Order Produksi',
    permissionKeys: ['produksi_orders'],
    items: [...UI_POLISH, 'Daftar order lebih rapi'],
  }),
  'pelunasan-hutang': entry({
    pageKey: 'pelunasan-hutang',
    title: 'Pelunasan Hutang',
    permissionKeys: ['pembelian_hutang'],
    items: [...UI_POLISH],
  }),
  'pelunasan-piutang': entry({
    pageKey: 'pelunasan-piutang',
    title: 'Pelunasan Piutang',
    permissionKeys: ['penjualan_piutang'],
    items: [...UI_POLISH],
  }),
  'penerimaan-pembelian': entry({
    pageKey: 'penerimaan-pembelian',
    title: 'Penerimaan Barang Pembelian',
    permissionKeys: ['pembelian_penerimaan'],
    items: [...UI_POLISH],
  }),
  pengiriman: entry({
    pageKey: 'pengiriman',
    title: 'Pengiriman',
    permissionKeys: ['penjualan_pengiriman'],
    items: [...UI_POLISH],
  }),
  pr: entry({
    pageKey: 'pr',
    title: 'Purchase Request (PR)',
    permissionKeys: ['pembelian_pr'],
    items: [...UI_POLISH],
  }),
  profile: entry({
    pageKey: 'profile',
    title: 'Pengaturan Profil',
    permissionKeys: [],
    items: [...UI_POLISH],
  }),
  'purchase-orders': entry({
    pageKey: 'purchase-orders',
    title: 'Purchase Order (PO)',
    permissionKeys: ['pembelian_po'],
    items: [...UI_POLISH],
  }),
  'rekap-pembelian-barang': entry({
    pageKey: 'rekap-pembelian-barang',
    title: 'Rekap Pembelian Barang',
    permissionKeys: ['pembelian_rekap'],
    items: [...UI_POLISH],
  }),
  'rekap-sales-order': entry({
    pageKey: 'rekap-sales-order',
    title: 'Rekap Sales Order',
    permissionKeys: ['kalkulasi_rekap_so'],
    items: [...UI_POLISH],
  }),
  roles: entry({
    pageKey: 'roles',
    title: 'Hak Akses (Roles)',
    permissionKeys: [...SUPER_ADMIN_ONLY],
    items: [...UI_POLISH],
  }),
  sales: entry({
    pageKey: 'sales',
    title: 'Laporan Penjualan',
    permissionKeys: ['penjualan_laporan'],
    items: [...UI_POLISH],
  }),
  'sales-orders': entry({
    pageKey: 'sales-orders',
    title: 'Sales Order',
    permissionKeys: ['penjualan_so'],
    items: [...UI_POLISH],
  }),
  'konversi-hpp': entry({
    pageKey: 'konversi-hpp',
    title: 'Konversi Data HPP',
    permissionKeys: ['settings_konversi_data_hpp'],
    items: [...UI_POLISH],
  }),
  'telegram-users': entry({
    pageKey: 'telegram-users',
    title: 'Telegram Users',
    permissionKeys: ['telegram_users'],
    items: [...UI_POLISH, 'Kartu statistik lebih ringkas'],
  }),
  'sph-in': entry({
    pageKey: 'sph-in',
    title: 'SPH Masuk',
    permissionKeys: ['pembelian_sph_in'],
    items: [...UI_POLISH],
  }),
  'sph-out': entry({
    pageKey: 'sph-out',
    title: 'SPH Keluar',
    permissionKeys: ['penjualan_sph_out'],
    items: [...UI_POLISH],
  }),
  'spph-out': entry({
    pageKey: 'spph-out',
    title: 'SPPH Keluar',
    permissionKeys: ['pembelian_spph'],
    items: [...UI_POLISH],
  }),
  sync: entry({
    pageKey: 'sync',
    title: 'Sinkronisasi Data',
    permissionKeys: ['sync'],
    items: [...UI_POLISH],
  }),
  users: entry({
    pageKey: 'users',
    title: 'Kelola User',
    permissionKeys: [...SUPER_ADMIN_ONLY],
    items: [...UI_POLISH],
  }),
};

/** pathname → pageKey (hanya path yang punya log) */
export const PAGE_CHANGELOG_PATHS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard-manufaktur': 'dashboard-manufaktur',
  '/dashboard-akunting': 'dashboard-akunting',
  '/dashboard-hrd': 'dashboard-hrd',
  '/jurnal-harian-produksi': 'jurnal-harian-produksi',
  '/jurnal-harian-produksi/data/excel-sopd': 'excel-sopd',
  '/jurnal-harian-produksi/data/master-pekerjaan': 'master-pekerjaan',
  '/jurnal-harian-produksi/data/master-pekerjaan-jurnal-produksi':
    'master-pekerjaan-jurnal-produksi',
  '/jurnal-harian-produksi/target': 'jurnal-harian-produksi-target',
  '/jurnal-harian-produksi/analisa': 'jurnal-harian-produksi-analisa',
  '/tracking-manufaktur': 'tracking-manufaktur',
  '/log-aktivitas': 'log-aktivitas',
  '/records': 'records',
  '/bom': 'bom',
  '/hasil-produksi': 'hasil-produksi',
  '/log-perubahan': 'log-perubahan',
  '/akuntansi/data/rek-akuntansi': 'rek-akuntansi',
  '/akuntansi/laporan/jurnal-umum': 'jurnal-umum',
  '/bahan-baku': 'bahan-baku',
  '/barang-jadi': 'barang-jadi',
  '/data-digit/produksi/produksi-selesai': 'produksi-selesai',
  '/data-digit/stok/master-barang': 'master-barang',
  '/hpp-kalkulasi': 'hpp-kalkulasi',
  '/orders': 'orders',
  '/pelunasan-hutang': 'pelunasan-hutang',
  '/pelunasan-piutang': 'pelunasan-piutang',
  '/penerimaan-pembelian': 'penerimaan-pembelian',
  '/pengiriman': 'pengiriman',
  '/pr': 'pr',
  '/profile': 'profile',
  '/purchase-orders': 'purchase-orders',
  '/rekap-pembelian-barang': 'rekap-pembelian-barang',
  '/rekap-sales-order': 'rekap-sales-order',
  '/roles': 'roles',
  '/sales': 'sales',
  '/sales-orders': 'sales-orders',
  '/settings/konversi-data/kalkulasi/hpp-kalkulasi': 'konversi-hpp',
  '/settings/telegram-users': 'telegram-users',
  '/sph-in': 'sph-in',
  '/sph-out': 'sph-out',
  '/spph-out': 'spph-out',
  '/sync': 'sync',
  '/users': 'users',
};

export function getPageChangelog(pageKey: string): PageChangelog | null {
  return PAGE_CHANGELOGS[pageKey] ?? null;
}

export function getPageChangelogByPath(pathname: string | null): PageChangelog | null {
  if (!pathname) return null;
  const pageKey = PAGE_CHANGELOG_PATHS[pathname];
  if (!pageKey) return null;
  return getPageChangelog(pageKey);
}

export function getPathForPageKey(pageKey: string): string | null {
  for (const [path, key] of Object.entries(PAGE_CHANGELOG_PATHS)) {
    if (key === pageKey) return path;
  }
  return null;
}

export function changelogDismissKey(pageKey: string, version: string) {
  return `sintak_changelog_dismissed:${pageKey}:${version}`;
}

function userCanSeeChangelog(
  entry: PageChangelog,
  permissions: PermissionMap,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  // permissionKeys kosong = hub publik untuk semua user login
  if (!entry.permissionKeys?.length) return true;
  return entry.permissionKeys.some((k) => permissions[k] === true);
}

/** Daftar log untuk hub /log-perubahan: filter permission, terbaru di atas */
export function listChangelogsForUser(
  permissions: PermissionMap,
  options?: { isSuperAdmin?: boolean }
): Array<PageChangelog & { path: string | null }> {
  const isSuperAdmin = options?.isSuperAdmin === true;
  const rows = Object.values(PAGE_CHANGELOGS)
    .filter((e) => userCanSeeChangelog(e, permissions, isSuperAdmin))
    .map((e) => ({
      ...e,
      path: getPathForPageKey(e.pageKey),
    }));

  rows.sort((a, b) => {
    const d = (b.sortDate || '').localeCompare(a.sortDate || '');
    if (d !== 0) return d;
    return (a.title || '').localeCompare(b.title || '', 'id');
  });

  return rows;
}

export type ChangelogDateGroup = {
  sortDate: string;
  label: string;
  entries: Array<PageChangelog & { path: string | null }>;
};

/** Group daftar log per tanggal (terbaru di atas), menu di dalam group. */
export function groupChangelogsBySortDate(
  entries: Array<PageChangelog & { path: string | null }>
): ChangelogDateGroup[] {
  const map = new Map<string, ChangelogDateGroup>();

  for (const e of entries) {
    const key = e.sortDate || e.date || '';
    let g = map.get(key);
    if (!g) {
      g = {
        sortDate: key,
        label: e.date || e.sortDate || 'Tanpa tanggal',
        entries: [],
      };
      map.set(key, g);
    }
    g.entries.push(e);
  }

  const groups = [...map.values()];
  groups.sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''));
  for (const g of groups) {
    g.entries.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'id'));
  }
  return groups;
}
