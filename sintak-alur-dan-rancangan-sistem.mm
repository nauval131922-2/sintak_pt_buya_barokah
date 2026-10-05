<?xml version='1.0' encoding='utf-8'?>
<map version="1.0.1">
<node ID="ID_152" TEXT="SINTAK - SISTEM INFORMASI &amp; MANAJEMEN TERPADU (PT BUYA BAROKAH)" COLOR="#0f172a" BACKGROUND_COLOR="#f1f5f9">
  <font NAME="SansSerif" BOLD="true" SIZE="15" />
  <icon BUILTIN="bookmark" />
<node ID="ID_20" TEXT="1.0 DATA DIGIT: PENCERMINAN PENGADAAN &amp; STOK (Read-Only via Scraper)" POSITION="right" COLOR="#15803d">
  <edge COLOR="#16a34a" WIDTH="2" />
  <font NAME="SansSerif" BOLD="true" SIZE="13" />
  <icon BUILTIN="1" />
<node ID="ID_8" TEXT="Alur Transaksi Pembelian (Rantai 7 Dokumen Pengadaan)" COLOR="#166534">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="list" />
<node ID="ID_1" TEXT="1. Purchase Request (PR): Permintaan pengadaan bahan baku dari divisi lapangan">
</node>
<node ID="ID_2" TEXT="2. SPPH: Surat Permintaan Penawaran Harga ke rekanan supplier / vendor">
</node>
<node ID="ID_3" TEXT="3. SPH Masuk: Surat Penawaran Harga masuk dan komparasi penawaran vendor">
</node>
<node ID="ID_4" TEXT="4. Purchase Order (PO): Dokumen pemesanan pembelian resmi kepada vendor terpilih">
</node>
<node ID="ID_5" TEXT="5. Penerimaan Pembelian: Verifikasi kedatangan fisik barang di gudang">
</node>
<node ID="ID_6" TEXT="6. Rekap Pembelian Barang (PB): Pencatatan detail barang masuk &amp; pengakuan hutang usaha">
</node>
<node ID="ID_7" TEXT="7. Pelunasan Hutang: Pembayaran faktur pembelian bahan baku ke supplier">
</node>
</node>
<node ID="ID_12" TEXT="Katalog Master Stok Barang (stok_master_barang)" COLOR="#166534">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="folder" />
<node ID="ID_9" TEXT="Kategori Barang: Kertas Plano, Tinta &amp; Kimia, Bahan Finishing, Barang Jadi">
</node>
<node ID="ID_10" TEXT="Data Atribut: Kode Barang, Barcode, Nama Barang, Satuan, Stok Akhir, Harga Beli Terakhir">
</node>
<node ID="ID_11" TEXT="Fungsi: Monitoring ketersediaan bahan baku untuk kelancaran jadwal cetak">
</node>
</node>
<node ID="ID_16" TEXT="Integrasi Sinkronisasi Digit &amp; Database" COLOR="#166534">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="refresh" />
<node ID="ID_13" TEXT="Endpoint /api/sync: Penarikan otomatis seluruh batch transaksi pembelian &amp; saldo stok dari ERP Digit">
</node>
<node ID="ID_14" TEXT="Data Store D1: Data Pembelian (7 tabel: purchase_requests s/d pelunasan_hutang)">
</node>
<node ID="ID_15" TEXT="Data Store D2: Stok Barang (stok_master_barang)">
</node>
</node>
<node ID="ID_19" TEXT="Hak Akses &amp; Pengguna Terkait" COLOR="#166534">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="kaddressbook" />
<node ID="ID_17" TEXT="Role Pembelian &amp; Logistik Gudang: Monitoring stok bahan baku &amp; verifikasi kedatangan">
</node>
<node ID="ID_18" TEXT="Role Super Admin: Sinkronisasi data pengadaan &amp; pengawasan audit">
</node>
</node>
</node>
<node ID="ID_39" TEXT="2.0 DATA DIGIT: PENCERMINAN PENJUALAN &amp; PIUTANG (Read-Only via Scraper)" POSITION="right" COLOR="#b45309">
  <edge COLOR="#d97706" WIDTH="2" />
  <font NAME="SansSerif" BOLD="true" SIZE="13" />
  <icon BUILTIN="2" />
<node ID="ID_26" TEXT="Alur Transaksi Penjualan (Rantai 5 Dokumen Komersial)" COLOR="#92400e">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="list" />
<node ID="ID_21" TEXT="1. SPH Keluar: Surat Penawaran Harga resmi kepada pelanggan (merujuk ke nomor BOM)">
</node>
<node ID="ID_22" TEXT="2. Sales Order (SO): Surat pesanan resmi dari pelanggan (sales_orders)">
</node>
<node ID="ID_23" TEXT="3. Rekap Sales Order: Detail spesifikasi produk, oplah, dan analisis pesanan">
</node>
<node ID="ID_24" TEXT="4. Laporan Penjualan (SI): Faktur realisasi penjualan resmi dari ERP Digit (sales_reports)">
</node>
<node ID="ID_25" TEXT="5. Pengiriman (SJ) &amp; Pelunasan Piutang: Surat Jalan pengiriman barang &amp; bukti pelunasan piutang">
</node>
</node>
<node ID="ID_30" TEXT="Analisis &amp; Monitoring Pesanan" COLOR="#92400e">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="folder" />
<node ID="ID_27" TEXT="Menu Rekap Sales Order (/rekap-sales-order): Analisis detail pesanan &amp; margin keuntungan">
</node>
<node ID="ID_28" TEXT="Menu Laporan Penjualan (/sales): Pemantauan realisasi faktur penjualan dan status tagihan">
</node>
<node ID="ID_29" TEXT="Menu Pengiriman (/pengiriman): Pelacakan status ekspedisi, supir, armada, dan bukti tanda terima">
</node>
</node>
<node ID="ID_33" TEXT="Integrasi Sinkronisasi Digit &amp; Database" COLOR="#92400e">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="refresh" />
<node ID="ID_31" TEXT="Endpoint /api/sync: Penarikan otomatis transaksi penjualan dan pelunasan piutang dari Digit">
</node>
<node ID="ID_32" TEXT="Data Store D3: Data Penjualan Digit (sph_out, sales_orders, sales_reports, pengiriman, pelunasan_piutang)">
</node>
</node>
<node ID="ID_38" TEXT="Hak Akses &amp; Pengguna Terkait" COLOR="#92400e">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="kaddressbook" />
<node ID="ID_34" TEXT="Role Penjualan / Sales: Pemantauan pesanan &amp; koordinasi pengiriman produk">
</node>
<node ID="ID_35" TEXT="Role Kalkulasi: Analisis detail sales order untuk evaluasi harga dan HPP">
</node>
<node ID="ID_36" TEXT="Role Akunting: Verifikasi pembayaran pelunasan piutang pelanggan">
</node>
<node ID="ID_37" TEXT="Role Super Admin: Supervisi data komersial &amp; sinkronisasi">
</node>
</node>
</node>
<node ID="ID_77" TEXT="3.0 OPERASIONAL PRODUKSI PERCETAKAN (Pabrik &amp; Manufaktur)" POSITION="right" COLOR="#b91c1c">
  <edge COLOR="#ef4444" WIDTH="2" />
  <font NAME="SansSerif" BOLD="true" SIZE="13" />
  <icon BUILTIN="3" />
<node ID="ID_45" TEXT="3.1 Sinkronisasi Dokumen Manufaktur Digit" COLOR="#991b1b">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="refresh" />
<node ID="ID_40" TEXT="Bill of Materials (BOM): Formula dan kebutuhan bahan baku per jenis cetakan (bill_of_materials)">
</node>
<node ID="ID_41" TEXT="Order Produksi: Surat Perintah Kerja pesanan cetak dari Digit (orders)">
</node>
<node ID="ID_42" TEXT="Pemakaian Bahan Baku: Alokasi dan konsumsi kertas/tinta riil di pabrik (bahan_baku)">
</node>
<node ID="ID_43" TEXT="Barang Jadi &amp; Produksi Selesai: Realisasi fisik produk jadi keluaran pabrik (barang_jadi, produksi_selesai)">
</node>
<node ID="ID_44" TEXT="Data Store D4: Produksi Digit (5 tabel terintegrasi)">
</node>
</node>
<node ID="ID_49" TEXT="3.2 Penjadwalan &amp; Master Kerja" COLOR="#991b1b">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="clock" />
<node ID="ID_46" TEXT="Antrean Order SOPd (/data/excel-sopd): Import Excel antrean cetak, tanggal deadline, dan estimasi pengerjaan">
</node>
<node ID="ID_47" TEXT="Master Target Pekerjaan (/data/master-pekerjaan-jurnal-produksi): Standar target lembar per jam &amp; per hari">
</node>
<node ID="ID_48" TEXT="Data Store D5: Referensi Produksi (sopd, master_pekerjaan)">
</node>
</node>
<node ID="ID_55" TEXT="3.3 Penjadwalan Shift &amp; Realisasi Lapangan (Jurnal Harian Produksi)" COLOR="#991b1b">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="pencil" />
<node ID="ID_50" TEXT="Penyusunan Jadwal Target Shift: Penugasan operator, mesin cetak, shift 1/2/3, nomor SOPd, target lembar">
</node>
<node ID="ID_51" TEXT="Fitur Copy Jadwal: Duplikasi susunan jadwal kemarin untuk efisiensi input staf penjadwalan">
</node>
<node ID="ID_52" TEXT="Pencatatan Realisasi Kerja: Jam mulai, jam selesai, dan jumlah lembar cetak selesai">
</node>
<node ID="ID_53" TEXT="Pencatatan Masalah &amp; Afkir: Lembar rijek (rusak setup/jalan), inscheet kertas, dan kendala mesin">
</node>
<node ID="ID_54" TEXT="Data Store D5: Tabel jurnal_harian_produksi">
</node>
</node>
<node ID="ID_59" TEXT="3.4 Monitoring &amp; Analisis Output Produksi" COLOR="#991b1b">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="idea" />
<node ID="ID_56" TEXT="Hasil Produksi (/hasil-produksi): Akumulasi lembar cetak per operator, mesin, dan status pengerjaan">
</node>
<node ID="ID_57" TEXT="Dashboard Manufaktur (/dashboard-manufaktur): Grafik tren bulanan, evaluasi efisiensi dan bottleneck pabrik">
</node>
<node ID="ID_58" TEXT="Target Harian (/target): Evaluasi sebaran beban kerja dan pencapaian target antar operator">
</node>
</node>
<node ID="ID_70" TEXT="3.5 Pelaporan Lapangan Mandiri (Laporan Pekerjaan)" COLOR="#991b1b">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="list" />
<node ID="ID_60" TEXT="Sistem Lembar Kerja Tugas Mandiri untuk 7 Divisi Pabrik:">
</node>
<node ID="ID_61" TEXT="• Divisi Setting: Desain, layout, pemeriksaan file, dan pembuatan Plat CTP">
</node>
<node ID="ID_62" TEXT="• Divisi QC: Pemeriksaan register cetak, akurasi warna, kerapian potong/jilid, lembar lolos/rijek">
</node>
<node ID="ID_63" TEXT="• Divisi Cetak: Lembar cetak naik mesin, sirkulasi tinta, dan kecepatan mesin cetak">
</node>
<node ID="ID_64" TEXT="• Divisi Finishing: Potong kertas, lipat, jilid lem panas, jahit kawat, laminasi doff/glossy">
</node>
<node ID="ID_65" TEXT="• Divisi Gudang: Pengendalian material kertas dan serah terima produk jadi">
</node>
<node ID="ID_66" TEXT="• Divisi Teknisi: Perawatan mesin berkala dan perbaikan kendala mekanis/kelistrikan">
</node>
<node ID="ID_67" TEXT="• Divisi Mesin: Pencatatan utilisasi jam jalan mesin dan kapasitas produksi">
</node>
<node ID="ID_68" TEXT="Kanal Input Fleksibel: Antarmuka Web Data Table &amp; Bot Telegram (/api/telegram/realisasi)">
</node>
<node ID="ID_69" TEXT="Data Store D6: Tabel laporan_pekerjaan &amp; role_laporan_pekerjaan_config">
</node>
</node>
<node ID="ID_76" TEXT="Hak Akses &amp; Pengguna Terkait" COLOR="#991b1b">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="kaddressbook" />
<node ID="ID_71" TEXT="Admin Penjadwalan: Penyusunan target shift &amp; distribusi beban kerja">
</node>
<node ID="ID_72" TEXT="Admin Realisasi: Verifikasi jam kerja, lembar hasil, rijek, dan inscheet">
</node>
<node ID="ID_73" TEXT="Supervisor Produksi: Evaluasi dashboard manufaktur, kendala mesin, dan bottleneck">
</node>
<node ID="ID_74" TEXT="Kepala Seksi (Pra &amp; Pasca Cetak): Kontrol kesiapan plat CTP dan hasil jilid finishing">
</node>
<node ID="ID_75" TEXT="Teknisi Lapangan (7 Divisi): Pelaporan tugas kerja mandiri via Web dan Bot Telegram">
</node>
</node>
</node>
<node ID="ID_96" TEXT="4.0 KALKULASI BIAYA &amp; PRICELIST (Estimasi HPP &amp; Simulasi Harga Jual)" POSITION="left" COLOR="#7c3aed">
  <edge COLOR="#8b5cf6" WIDTH="2" />
  <font NAME="SansSerif" BOLD="true" SIZE="13" />
  <icon BUILTIN="4" />
<node ID="ID_82" TEXT="4.1 Lookup Riwayat Harga Beli Kertas" COLOR="#6d28d9">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="refresh" />
<node ID="ID_78" TEXT="Menarik histori harga beli faktur pembelian dari tabel rekap_pembelian_barang">
</node>
<node ID="ID_79" TEXT="Deteksi otomatis gramatur kertas (HVS, Art Paper, Art Carton) dan dimensi plano">
</node>
<node ID="ID_80" TEXT="Konversi cerdas: Menghitung harga dasar per Kg dari satuan rim/lembar">
</node>
<node ID="ID_81" TEXT="Menjadi referensi biaya material real-time untuk mesin kalkulator cetak">
</node>
</node>
<node ID="ID_88" TEXT="4.2 Simulator Pricelist Percetakan (20+ Kategori Produk)" COLOR="#6d28d9">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="wizard" />
<node ID="ID_83" TEXT="Kategori Produk: Buku Soft/Hard Cover, Kalender Kop, Nota, Majalah, Undangan, Paperbag, Packaging, dll.">
</node>
<node ID="ID_84" TEXT="Perhitungan 4 Komponen Biaya: Kertas + Plat/Cetak Mesin + Finishing + Markup Margin">
</node>
<node ID="ID_85" TEXT="Penyimpanan Matriks Harga Standar: Tabel pricelist_items">
</node>
<node ID="ID_86" TEXT="Penyimpanan Riwayat Simulasi Kustom: Tabel pricelist_saved_calculations">
</node>
<node ID="ID_87" TEXT="Data Store D7.1: Master Pricelist">
</node>
</node>
<node ID="ID_92" TEXT="4.3 Master Nilai HPP Per Order" COLOR="#6d28d9">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="pencil" />
<node ID="ID_89" TEXT="Sinkronisasi otomatis nama produk pesanan dari tabel orders Digit">
</node>
<node ID="ID_90" TEXT="Pencatatan nilai rupiah HPP per pesanan produksi via web inline edit maupun impor Excel">
</node>
<node ID="ID_91" TEXT="Data Store D7.2: Master Nilai HPP Kalkulasi (hpp_kalkulasi)">
</node>
</node>
<node ID="ID_95" TEXT="Hak Akses &amp; Pengguna Terkait" COLOR="#6d28d9">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="kaddressbook" />
<node ID="ID_93" TEXT="Role Kalkulasi &amp; Kalkulasi2: Simulasi harga penawaran sales, audit HPP, dan analisis margin pesanan">
</node>
<node ID="ID_94" TEXT="Role Akunting &amp; Super Admin: Verifikasi HPP acuan untuk evaluasi laba kotor">
</node>
</node>
</node>
<node ID="ID_117" TEXT="5.0 AKUNTANSI, SDM &amp; TATA KELOLA (Keuangan, Personalia, Hak Akses &amp; Audit)" POSITION="left" COLOR="#1d4ed8">
  <edge COLOR="#2563eb" WIDTH="2" />
  <font NAME="SansSerif" BOLD="true" SIZE="13" />
  <icon BUILTIN="5" />
<node ID="ID_101" TEXT="5.1 Pengelolaan Akuntansi &amp; Pembukuan" COLOR="#1e40af">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="folder" />
<node ID="ID_97" TEXT="Scraping otomatis transaksi Jurnal Umum dan Rekening Akuntansi (COA) dari ERP Digit">
</node>
<node ID="ID_98" TEXT="Modal Analisis Jurnal: Filter mutasi debit/kredit per rekening dan ekspor Excel">
</node>
<node ID="ID_99" TEXT="Dashboard Akunting (/dashboard-akunting): Visualisasi tren bulanan debit vs kredit">
</node>
<node ID="ID_100" TEXT="Data Store D8: Akuntansi (rek_akuntansi, jurnal_umum)">
</node>
</node>
<node ID="ID_106" TEXT="5.2 Pengelolaan SDM &amp; Catat Kesalahan" COLOR="#1e40af">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="kaddressbook" />
<node ID="ID_102" TEXT="Master Pegawai (/karyawan): NIP, nama, jabatan, divisi, dan status aktif">
</node>
<node ID="ID_103" TEXT="Catat Kesalahan (/records): Pencatatan insiden kerja, kronologi, dan beban ganti rugi finansial">
</node>
<node ID="ID_104" TEXT="Dashboard HRD (/dashboard-hrd): Grafik tren insiden kesalahan kerja bulanan dan statistik staf">
</node>
<node ID="ID_105" TEXT="Data Store D9: SDM &amp; Catat Kesalahan (employees, infractions)">
</node>
</node>
<node ID="ID_112" TEXT="5.3 Tata Kelola Pengguna, Hak Akses &amp; Audit Log" COLOR="#1e40af">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="wizard" />
<node ID="ID_107" TEXT="Manajemen Pengguna (/users): Akun login, tautan NIP karyawan, reset password bcrypt">
</node>
<node ID="ID_108" TEXT="Pengaturan Hak Akses RBAC (/roles): Konfigurasi matriks izin modul dan batasan divisi">
</node>
<node ID="ID_109" TEXT="Otorisasi Bot Telegram (/settings/telegram-users): Verifikasi dan aktivasi akun bot operator">
</node>
<node ID="ID_110" TEXT="Audit Jejak Sistem: Local activity logs (activity_logs) &amp; Digit user log (usr_log)">
</node>
<node ID="ID_111" TEXT="Data Store D10: Tata Kelola Sistem (users, app_roles, role_permissions, telegram_users, activity_logs, usr_log)">
</node>
</node>
<node ID="ID_116" TEXT="Hak Akses &amp; Pengguna Terkait" COLOR="#1e40af">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="kaddressbook" />
<node ID="ID_113" TEXT="Role Akunting: Audit jurnal umum, analisa mutasi kas/bank, pantau Dashboard Akunting">
</node>
<node ID="ID_114" TEXT="Role HRD: Master karyawan, formulir catat kesalahan, analisis tren di Dashboard HRD">
</node>
<node ID="ID_115" TEXT="Role Super Admin: Manajemen pengguna, konfigurasi hak akses, otorisasi bot, dan audit log">
</node>
</node>
</node>
<node ID="ID_132" TEXT="6.0 TRACKING MANUFAKTUR (Mesin Penelusuran Terpadu 3 Rantai Dokumen)" POSITION="left" COLOR="#4338ca">
  <edge COLOR="#4f46e5" WIDTH="2" />
  <font NAME="SansSerif" BOLD="true" SIZE="13" />
  <icon BUILTIN="6" />
<node ID="ID_121" TEXT="Logika Relasi Multi-Arah (Pivot Search Engine)" COLOR="#3730a3">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="launch" />
<node ID="ID_118" TEXT="Titik Awal Bebas: Input nomor BOM, Order Produksi, PO, Rekap PB, atau Sales Order">
</node>
<node ID="ID_119" TEXT="Penelusuran Maju &amp; Mundur (Bidirectional Traversal): Query SQL terindeks tanpa full-scan">
</node>
<node ID="ID_120" TEXT="Penyelarasan nomor dokumen lintas entitas (pembersihan ikon &amp; format faktur)">
</node>
</node>
<node ID="ID_125" TEXT="Rekonsiliasi 3 Rantai Departemen Terpadu" COLOR="#3730a3">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="list" />
<node ID="ID_122" TEXT="Rantai Pembelian: PR → SPPH → SPH Masuk → PO → Penerimaan → Rekap PB → Pelunasan Hutang">
</node>
<node ID="ID_123" TEXT="Rantai Produksi: BOM (Formula) → Order Produksi → Pemakaian Bahan Baku → Barang Jadi">
</node>
<node ID="ID_124" TEXT="Rantai Penjualan: SPH Keluar → Sales Order → Laporan Penjualan (SI) → Pengiriman (SJ) → Pelunasan Piutang">
</node>
</node>
<node ID="ID_129" TEXT="Antarmuka Visualisasi Interaktif (/tracking-manufaktur)" COLOR="#3730a3">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="idea" />
<node ID="ID_126" TEXT="Visualisasi Bagan Alur Dokumen (Pohon Relasi Dokumen 3 Departemen)">
</node>
<node ID="ID_127" TEXT="Status Kelengkapan Transaksi: Indikator keselarasan rantai pengadaan, pabrik, dan penjualan">
</node>
<node ID="ID_128" TEXT="Modal Pop-Up Rincian Faktur: Tanggal, nilai rupiah, kuantitas barang, dan keterangan status">
</node>
</node>
<node ID="ID_131" TEXT="Hak Akses &amp; Pengguna Terkait" COLOR="#3730a3">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="kaddressbook" />
<node ID="ID_130" TEXT="Seluruh Manajemen, Auditor Internal &amp; Staf Operasional untuk pelacakan status pesanan">
</node>
</node>
</node>
<node ID="ID_151" TEXT="STRUKTUR HAK AKSES &amp; 9 PERAN PENGGUNA (RBAC SINTAK)" POSITION="left" COLOR="#0284c7">
  <edge COLOR="#0369a1" WIDTH="2" />
  <font NAME="SansSerif" BOLD="true" SIZE="13" />
  <icon BUILTIN="bookmark" />
<node ID="ID_134" TEXT="Super Admin (Akses Penuh Seluruh Modul)" COLOR="#0369a1">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="wizard" />
<node ID="ID_133" TEXT="Bypass pemeriksaan RBAC, mengelola pengguna, izin role, sinkronisasi Digit, dan audit sistem">
</node>
</node>
<node ID="ID_136" TEXT="Admin Penjadwalan (Operasional Produksi)" COLOR="#0369a1">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="clock" />
<node ID="ID_135" TEXT="Kelola antrean SOPd, menyusun target shift di Jurnal Harian Produksi, evaluasi target harian">
</node>
</node>
<node ID="ID_138" TEXT="Admin Realisasi (Operasional Produksi)" COLOR="#0369a1">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="pencil" />
<node ID="ID_137" TEXT="Input realisasi jam kerja, lembar jadi, rijek, inscheet kertas, dan kendala operator lapangan">
</node>
</node>
<node ID="ID_140" TEXT="Supervisor Produksi (Operasional Pabrik)" COLOR="#0369a1">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="idea" />
<node ID="ID_139" TEXT="Monitoring ritme pabrik di Dashboard Manufaktur, evaluasi pencapaian target dan bottleneck">
</node>
</node>
<node ID="ID_142" TEXT="Kepala Seksi Pra Cetak &amp; Pasca Cetak" COLOR="#0369a1">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="folder" />
<node ID="ID_141" TEXT="Supervisi kesiapan teknis divisi spesifik: Pra Cetak (Setting/Plat CTP) atau Pasca Cetak (Jilid/Finishing)">
</node>
</node>
<node ID="ID_144" TEXT="Teknisi Lapangan (7 Divisi Mandiri)" COLOR="#0369a1">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="list" />
<node ID="ID_143" TEXT="Divisi Setting, QC, Cetak, Finishing, Gudang, Teknisi, Mesin (Input Laporan Pekerjaan via Web / Bot Telegram)">
</node>
</node>
<node ID="ID_146" TEXT="Kalkulasi &amp; Estimasi Biaya" COLOR="#0369a1">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="calculator" />
<node ID="ID_145" TEXT="Simulasi harga jual penawaran di Pricelist, pencatatan HPP pesanan, analisis margin Sales Order">
</node>
</node>
<node ID="ID_148" TEXT="HRD (Personalia &amp; Kedisiplinan)" COLOR="#0369a1">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="kaddressbook" />
<node ID="ID_147" TEXT="Master karyawan, formulir catat kesalahan kerja, pemantauan tren di Dashboard HRD">
</node>
</node>
<node ID="ID_150" TEXT="Akunting (Keuangan &amp; Pembukuan)" COLOR="#0369a1">
  <font NAME="SansSerif" BOLD="true" />
  <icon BUILTIN="folder" />
<node ID="ID_149" TEXT="Audit transaksi jurnal umum, analisis mutasi kas/bank, pemantauan tren di Dashboard Akunting">
</node>
</node>
</node>
</node>
</map>