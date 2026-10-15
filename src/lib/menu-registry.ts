// Menu items untuk global search
// Format: { label, href, category, keywords? }

export interface SearchableMenuItem {
  label: string;
  href: string;
  category: string;
  keywords?: string;
  permission?: string;
}

export const searchableMenuItems: SearchableMenuItem[] = [
  // Dashboard
  { label: 'Dashboard Umum', href: '/dashboard', category: 'Dashboard', keywords: 'home beranda utama', permission: 'dashboard' },
  { label: 'Dashboard HRD', href: '/dashboard-hrd', category: 'Dashboard', keywords: 'karyawan sdm', permission: 'hrd_dashboard' },
  { label: 'Dashboard Produksi', href: '/dashboard-manufaktur', category: 'Dashboard', keywords: 'manufaktur pabrik', permission: 'produksi_dashboard' },
  { label: 'Dashboard Akuntansi', href: '/dashboard-akunting', category: 'Dashboard', keywords: 'keuangan finance', permission: 'akt_dashboard' },

  // Sync
  { label: 'Sinkronisasi All Data', href: '/sync', category: 'Data', keywords: 'refresh update sync', permission: 'sync' },

  // Stok
  { label: 'Master Barang', href: '/data-digit/stok/master-barang', category: 'Stok', keywords: 'item produk inventory', permission: 'stok_master_barang' },
  { label: 'Saldo Barang', href: '/data-digit/stok/saldo-barang', category: 'Stok', keywords: 'saldo stok persediaan gudang digit', permission: 'stok_saldo_barang' },

  // Pembelian
  { label: 'Purchase Request (PR)', href: '/pr', category: 'Pembelian', keywords: 'permintaan pembelian', permission: 'pembelian_pr' },
  { label: 'SPPH Keluar', href: '/spph-out', category: 'Pembelian', keywords: 'penawaran supplier', permission: 'pembelian_spph' },
  { label: 'SPH Masuk', href: '/sph-in', category: 'Pembelian', keywords: 'penawaran harga', permission: 'pembelian_sph_in' },
  { label: 'Purchase Order (PO)', href: '/purchase-orders', category: 'Pembelian', keywords: 'order pembelian', permission: 'pembelian_po' },
  { label: 'Penerimaan Barang', href: '/penerimaan-pembelian', category: 'Pembelian', keywords: 'receiving terima', permission: 'pembelian_penerimaan' },
  { label: 'Laporan Rekap Pembelian Barang', href: '/rekap-pembelian-barang', category: 'Pembelian', keywords: 'rekap laporan', permission: 'pembelian_rekap' },
  { label: 'Pelunasan Hutang', href: '/pelunasan-hutang', category: 'Pembelian', keywords: 'bayar hutang payable', permission: 'pembelian_hutang' },

  // Produksi
  { label: 'Bill of Material Produksi', href: '/bom', category: 'Produksi', keywords: 'bom resep formula', permission: 'produksi_bom' },
  { label: 'Order Produksi', href: '/orders', category: 'Produksi', keywords: 'order produksi manufacturing', permission: 'produksi_orders' },
  { label: 'Produksi Selesai', href: '/data-digit/produksi/produksi-selesai', category: 'Produksi', keywords: 'selesai complete finish', permission: 'produksi_selesai' },
  { label: 'BBB Produksi', href: '/bahan-baku', category: 'Produksi', keywords: 'bahan baku raw material', permission: 'produksi_bahan_baku' },
  { label: 'Penerimaan Barang Hasil Produksi', href: '/barang-jadi', category: 'Produksi', keywords: 'finished goods jadi', permission: 'produksi_barang_jadi' },
  { label: 'Laporan Pekerjaan', href: '/laporan-pekerjaan', category: 'Produksi', keywords: 'laporan pekerjaan setting buya google sheet spreadsheet', permission: 'produksi_laporan_pekerjaan' },

  // Penjualan
  { label: 'SPH Keluar', href: '/sph-out', category: 'Penjualan', keywords: 'penawaran sales quotation', permission: 'penjualan_sph_out' },
  { label: 'Sales Order Barang', href: '/sales-orders', category: 'Penjualan', keywords: 'so sales order', permission: 'penjualan_so' },
  { label: 'Laporan Penjualan', href: '/sales', category: 'Penjualan', keywords: 'sales report laporan', permission: 'penjualan_laporan' },
  { label: 'Pelunasan Piutang', href: '/pelunasan-piutang', category: 'Penjualan', keywords: 'bayar piutang receivable', permission: 'penjualan_piutang' },
  { label: 'Pengiriman', href: '/pengiriman', category: 'Penjualan', keywords: 'delivery kirim shipment', permission: 'penjualan_pengiriman' },
  { label: 'Rekap Sales Order Barang', href: '/rekap-sales-order', category: 'Penjualan', keywords: 'rekap sales order so barang', permission: 'kalkulasi_rekap_so' },

  // Akuntansi
  { label: 'Jurnal Umum', href: '/akuntansi/laporan/jurnal-umum', category: 'Akuntansi', keywords: 'journal accounting keuangan laba rugi', permission: 'akt_jurnal_umum' },
  { label: 'Master Rekening', href: '/akuntansi/data/rek-akuntansi', category: 'Akuntansi', keywords: 'coa chart of account rekening', permission: 'akt_mrek' },

  // Data Digit - Sistem
  { label: 'Log Aktivitas User', href: '/data-digit/sistem/log-aktivitas-user', category: 'Sistem', keywords: 'user log aktivitas digit audit riwayat', permission: 'usr_log_view' },

  // Sistem
  { label: 'Tracking Manufaktur', href: '/tracking-manufaktur', category: 'Sistem', keywords: 'track monitoring produksi', permission: 'tracking_manufaktur' },
  { label: 'Jurnal Harian Produksi', href: '/jurnal-harian-produksi', category: 'Sistem', keywords: 'jhp daily production journal', permission: 'produksi_jhp' },
  { label: 'Target Harian JHP', href: '/jurnal-harian-produksi/target', category: 'Sistem', keywords: 'target jhp harian produksi', permission: 'produksi_jhp_target' },
  { label: 'Analisa Produksi JHP', href: '/jurnal-harian-produksi/analisa', category: 'Sistem', keywords: 'analisa grafik performa jhp', permission: 'produksi_jhp_analisa' },
  { label: 'SOPd Produksi', href: '/jurnal-harian-produksi/data/excel-sopd', category: 'Sistem', keywords: 'sopd excel data jurnal produksi', permission: 'produksi_jhp_sopd' },
  { label: 'Master Pekerjaan', href: '/jurnal-harian-produksi/data/master-pekerjaan', category: 'Sistem', keywords: 'master pekerjaan setting cetak finishing', permission: 'produksi_jhp_master_pekerjaan' },
  { label: 'Master Pekerjaan Jurnal Produksi', href: '/jurnal-harian-produksi/data/master-pekerjaan-jurnal-produksi', category: 'Sistem', keywords: 'master pekerjaan jurnal produksi kategori target', permission: 'produksi_jhp_master_pekerjaan_jurnal_produksi' },
  { label: 'Hasil Produksi', href: '/hasil-produksi', category: 'Sistem', keywords: 'output produksi realisasi', permission: 'produksi_hasil' },
  { label: 'Kalkulasi HPP', href: '/hpp-kalkulasi', category: 'Sistem', keywords: 'hpp cost calculation', permission: 'hpp_kalkulasi' },
  { label: 'Lap. Penonaktifan Master Barang Jadi', href: '/penonaktifan-master-barang', category: 'Sistem', keywords: 'nonaktif penonaktifan master barang jadi usulan', permission: 'produksi_penonaktifan_master' },
  { label: 'Pricelist', href: '/pricelist', category: 'Sistem', keywords: 'pricelist harga kalender spiral eko dwi tri wulan', permission: 'pricelist_kalkulasi' },
  { label: 'Log Aktivitas', href: '/log-aktivitas', category: 'Sistem', keywords: 'activity log audit trail', permission: 'activity_log_view' },
  { label: 'Log Perubahan', href: '/log-perubahan', category: 'Sistem', keywords: 'log perubahan changelog history update rilis versi' },
  { label: 'Karyawan', href: '/employees', category: 'Sistem', keywords: 'employee pegawai staff', permission: 'karyawan' },
  { label: 'Catat Kesalahan', href: '/records', category: 'Sistem', keywords: 'infraction pelanggaran karyawan', permission: 'catat_kesalahan' },

  // Admin
  { label: 'Manajemen User', href: '/users', category: 'Admin', keywords: 'user pengguna akun kelola', permission: 'kelola_user' },
  { label: 'Manajemen Role', href: '/roles', category: 'Admin', keywords: 'role permission hak akses', permission: 'hak_akses' },
  { label: 'Profil Saya', href: '/profile', category: 'Admin', keywords: 'profile akun saya password' },

  // Settings
  { label: 'User Telegram', href: '/settings/telegram-users', category: 'Settings', keywords: 'telegram bot user notifikasi', permission: 'telegram_users' },
  { label: 'Konversi Data - HPP Kalkulasi', href: '/settings/konversi-data/kalkulasi/hpp-kalkulasi', category: 'Settings', keywords: 'konversi data hpp kalkulasi excel', permission: 'settings_konversi_data_hpp' },
  { label: 'Konversi Data - JHP', href: '/settings/konversi-data/jurnal-harian-produksi', category: 'Settings', keywords: 'konversi data sopd jhp jurnal harian', permission: 'settings_konversi_data' },
  { label: 'Konversi Data - Laporan Pekerjaan', href: '/settings/konversi-data/laporan-pekerjaan', category: 'Settings', keywords: 'konversi data laporan pekerjaan spreadsheet', permission: 'settings_konversi_data' },
  { label: 'Generator Kode Rutin', href: '/settings/penonaktifan-routine', category: 'Settings', keywords: 'generator rutin penonaktifan kode repeat pembelian so penjualan transaksi produksi', permission: 'settings_konversi_data' },
];
