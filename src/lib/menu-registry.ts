// Menu items untuk global search
// Format: { label, href, category, keywords? }

export const searchableMenuItems = [
  // Dashboard
  { label: 'Dashboard Umum', href: '/dashboard', category: 'Dashboard', keywords: 'home beranda utama' },
  { label: 'Dashboard HRD', href: '/dashboard-hrd', category: 'Dashboard', keywords: 'karyawan sdm' },
  { label: 'Dashboard Produksi', href: '/dashboard-manufaktur', category: 'Dashboard', keywords: 'manufaktur pabrik' },
  { label: 'Dashboard Akuntansi', href: '/dashboard-akunting', category: 'Dashboard', keywords: 'keuangan finance' },

  // Sync
  { label: 'Sinkronisasi All Data', href: '/sync', category: 'Data', keywords: 'refresh update sync' },

  // Stok
  { label: 'Master Barang', href: '/data-digit/stok/master-barang', category: 'Stok', keywords: 'item produk inventory' },

  // Pembelian
  { label: 'Purchase Request (PR)', href: '/pr', category: 'Pembelian', keywords: 'permintaan pembelian' },
  { label: 'SPPH Keluar', href: '/spph-out', category: 'Pembelian', keywords: 'penawaran supplier' },
  { label: 'SPH Masuk', href: '/sph-in', category: 'Pembelian', keywords: 'penawaran harga' },
  { label: 'Purchase Order (PO)', href: '/purchase-orders', category: 'Pembelian', keywords: 'order pembelian' },
  { label: 'Penerimaan Barang', href: '/penerimaan-pembelian', category: 'Pembelian', keywords: 'receiving terima' },
  { label: 'Laporan Rekap Pembelian Barang', href: '/rekap-pembelian-barang', category: 'Pembelian', keywords: 'rekap laporan' },
  { label: 'Pelunasan Hutang', href: '/pelunasan-hutang', category: 'Pembelian', keywords: 'bayar hutang payable' },

  // Produksi
  { label: 'Bill of Material Produksi', href: '/bom', category: 'Produksi', keywords: 'bom resep formula' },
  { label: 'Order Produksi', href: '/orders', category: 'Produksi', keywords: 'order produksi manufacturing' },
  { label: 'Produksi Selesai', href: '/data-digit/produksi/produksi-selesai', category: 'Produksi', keywords: 'selesai complete finish' },
  { label: 'BBB Produksi', href: '/bahan-baku', category: 'Produksi', keywords: 'bahan baku raw material' },
  { label: 'Penerimaan Barang Hasil Produksi', href: '/barang-jadi', category: 'Produksi', keywords: 'finished goods jadi' },
  { label: 'Laporan Pekerjaan', href: '/laporan-pekerjaan', category: 'Produksi', keywords: 'laporan pekerjaan setting buya google sheet spreadsheet' },

  // Penjualan
  { label: 'SPH Keluar', href: '/sph-out', category: 'Penjualan', keywords: 'penawaran sales quotation' },
  { label: 'Sales Order Barang', href: '/sales-orders', category: 'Penjualan', keywords: 'so sales order' },
  { label: 'Laporan Penjualan', href: '/sales', category: 'Penjualan', keywords: 'sales report laporan' },
  { label: 'Pelunasan Piutang', href: '/pelunasan-piutang', category: 'Penjualan', keywords: 'bayar piutang receivable' },
  { label: 'Pengiriman', href: '/pengiriman', category: 'Penjualan', keywords: 'delivery kirim shipment' },

  // Akuntansi
  { label: 'Jurnal Umum', href: '/akuntansi', category: 'Akuntansi', keywords: 'journal accounting' },
  { label: 'Master Rekening', href: '/rek-akuntansi', category: 'Akuntansi', keywords: 'coa chart of account' },

  // Sistem
  { label: 'Tracking Manufaktur', href: '/tracking-manufaktur', category: 'Sistem', keywords: 'track monitoring produksi' },
  { label: 'Jurnal Harian Produksi', href: '/jurnal-harian-produksi', category: 'Sistem', keywords: 'jhp daily production journal' },
  { label: 'Hasil Produksi', href: '/hasil-produksi', category: 'Sistem', keywords: 'output produksi' },
  { label: 'Kalkulasi HPP', href: '/hpp-kalkulasi', category: 'Sistem', keywords: 'hpp cost calculation' },
  { label: 'Log Aktivitas', href: '/log-aktivitas', category: 'Sistem', keywords: 'activity log audit trail' },
  { label: 'Log Perubahan', href: '/log-perubahan', category: 'Sistem', keywords: 'log perubahan changelog history update rilis versi' },
  { label: 'Karyawan', href: '/employees', category: 'Sistem', keywords: 'employee pegawai staff' },
  { label: 'Catat Kesalahan', href: '/catat-kesalahan', category: 'Sistem', keywords: 'infraction pelanggaran' },

  // Admin
  { label: 'Manajemen User', href: '/users', category: 'Admin', keywords: 'user pengguna akun' },
  { label: 'Manajemen Role', href: '/roles', category: 'Admin', keywords: 'role permission hak akses' },
  { label: 'Profil Saya', href: '/profile', category: 'Admin', keywords: 'profile akun saya' },
  { label: 'Pengaturan', href: '/settings', category: 'Admin', keywords: 'settings konfigurasi' },

  // Telegram Bot
  { label: 'User Telegram', href: '/telegram-users', category: 'Telegram', keywords: 'telegram bot user' },
  { label: 'Pesan Bot', href: '/pesan-bot', category: 'Telegram', keywords: 'telegram message notif' },
];
