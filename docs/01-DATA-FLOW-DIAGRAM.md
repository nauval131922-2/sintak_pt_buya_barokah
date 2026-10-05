# DOKUMEN SISTEM SINTAK: DATA FLOW DIAGRAM (DFD) LEVEL 0 & LEVEL 1
**Sistem Informasi & Manajemen Manufaktur Percetakan PT Buya Barokah**

---

## 1. PENDAHULUAN & RUANG LINGKUP
Dokumen ini mendefinisikan arsitektur aliran data sistem **SINTAK** secara struktural berbasis **fakta database (`database_dev.sqlite`) dan kode sumber riil**, menggunakan standar **Data Flow Diagram (DFD)**:
1. **DFD Level 0 (Diagram Konteks / Context Diagram)**: Memetakan batasan sistem (*system boundary*), entitas eksternal, dan seluruh aktor pengguna resmi (berdasarkan role riil di tabel `app_roles` dan `users`), serta aliran data masuk (*inflow*) dan informasi keluar (*outflow*).
2. **DFD Level 1 (Dekomposisi Sub-Proses & Data Store)**: Membedah SINTAK menjadi 5 proses bisnis utama, 9 penyimpanan data (*Data Store D1 – D9*), serta 1 proses rekonsiliasi audit lintas tabel (*Engine Tracking Manufaktur 14 Tabel*).

---

## 2. DFD LEVEL 0: DIAGRAM KONTEKS (CONTEXT DIAGRAM)

### 2.1 Entitas Eksternal & Aktor Pengguna Resmi SINTAK
Pada diagram konteks, lingkaran tengah merepresentasikan inti sistem:
`0.0 SISTEM INFORMASI & MANAJEMEN PERCETAKAN (SINTAK)`

Berinteraksi dengan **8 Entitas / Aktor Pengguna Asli**:

| No | Entitas / Aktor Resmi | Tipe | Peran & Ruang Lingkup Riil di Sistem |
| :---: | :--- | :---: | :--- |
| **1** | **Digit ERP** | Sistem Eksternal | Sumber data hulu yang ditarik via engine scraper SINTAK: mencakup Pembelian, Penjualan, Order Produksi (BOM, Bahan Baku, Barang Jadi), Rekening Akuntansi, dan Jurnal Umum. |
| **2** | **Bot Telegram (`@SintakSettingBot`)** | Kanal Input Mobile | Bot Telegram khusus staf/operator bagian **Setting** untuk input realisasi kerja (`/input`, `/input_target`, pesan suara), pencarian order (`/search`, `/searchorder`), dan riwayat (`/history`). Tidak ada fungsi broadcast alert/kelalaian. |
| **3** | **Role Kalkulasi** | Role SINTAK | Pengguna yang mengelola modul Kalkulasi Biaya Produksi: simulasi 20+ produk di `/pricelist`, perhitungan `/hpp-kalkulasi`, serta menggunakan fitur **Rekap Lookup** untuk mengintip riwayat harga beli riil kertas/plat dari vendor di Digit. |
| **4** | **Role Admin Realisasi & Operator** | Role SINTAK | Staf lapangan divisi operasional (`Setting`, `Cetak`, `Finishing`, `Quality Control`) dan admin verifikator: menginput dan memeriksa data Jurnal Harian Produksi (**JHP**) harian (jam mulai-selesai, kuantitas realisasi, lembar **inscheet**, lembar **rijek**, dan kendala). |
| **5** | **Role Admin Penjadwalan & Kepala Seksi** | Role SINTAK | `Admin Penjadwalan`, `Kepala Seksi Pra Cetak`, dan `Kepala Seksi Pasca Cetak`: mengelola data **SOPd** (`/data/excel-sopd`), melakukan **Input Target (Penjadwalan)**, memantau **Target Harian**, dan mengelola referensi **Master Pekerjaan**. |
| **6** | **Role Akunting** | Role SINTAK | Pengguna bagian keuangan yang menjalankan sinkronisasi/scraping data Jurnal Umum dan Rek Akuntansi dari Digit ERP, melihat Dashboard Akunting (visualisasi arus kas, rasio keuangan, tren debet-kredit), Analisis Jurnal, dan ekspor Excel. *(Catatan: Tidak ada form penyesuaian COA manual di SINTAK; data murni hasil scraping Digit)*. |
| **7** | **Role HRD** | Role SINTAK | Pengguna divisi personalia: mengunggah/mengelola data master Karyawan (154 staf aktif di `/karyawan`), mencatat pelanggaran/kesalahan kerja staf terkait order di `/infractions` (Catat Kesalahan), dan memantau Dashboard HRD. |
| **8** | **Role Super Admin** | Role SINTAK | Administrator sistem tertinggi: mengelola akun pengguna (`/users`), matriks hak akses (`/roles`), persetujuan registrasi akun Bot Telegram (`/settings/telegram-users`), menjalankan modul konversi data migrasi lama, dan memantau Log Aktivitas sistem (`/activity-log`). |

---

### 2.2 Kamus Aliran Data Masuk & Keluar (Inflow / Outflow)

#### A. Aliran Data Masuk (Inflow ke SINTAK — Panah Hijau):
1. **Dari Digit ERP**: Tarik data scraping Pembelian (`PR`, `SPPH`, `SPH In`, `PO`, `Penerimaan`, `Rekap PB`, `Hutang`), Penjualan (`SPH Out`, `SO`, `Laporan Penjualan`, `SJ Pengiriman`, `Piutang`), Order Produksi (`BOM`, `orders`, `bahan_baku`, `barang_jadi`, `produksi_selesai`), dan Akuntansi (`rek_akuntansi`, `jurnal_umum`).
2. **Dari Bot Telegram (`@SintakSettingBot`)**: Input realisasi shift dan nomor order pekerjaan khusus bagian Setting (`/input`, `/input_target`, pesan suara/audio).
3. **Dari Role Kalkulasi**: Input parameter spesifikasi order (oplah, jenis bahan kertas, gramatur, jilid/finishing, toleransi susut) pada kalkulator `/pricelist` dan `/hpp-kalkulasi`.
4. **Dari Role Admin Realisasi & Operator**: Input Jurnal Harian Produksi harian (nomor order, jam pengerjaan, kuantitas realisasi, lembar **inscheet** / toleransi, lembar **rijek** / rusak, kendala).
5. **Dari Role Admin Penjadwalan & Kepala Seksi**: Input data SOPd (`/data/excel-sopd`), Input Target (Penjadwalan), dan referensi Master Pekerjaan.
6. **Dari Role Akunting**: Trigger scraping Jurnal Umum dan Rek Akuntansi untuk menarik pembaruan pembukuan dari Digit ERP.
7. **Dari Role HRD**: Unggah berkas Excel master Karyawan dan pencatatan poin pelanggaran/kesalahan kerja operator di `/infractions`.
8. **Dari Role Super Admin**: Manajemen akun login pengguna, konfigurasi izin akses per modul, persetujuan user bot telegram, dan eksekusi konversi data migrasi.

#### B. Aliran Informasi Keluar (Outflow dari SINTAK — Panah Ungu):
1. **Ke Digit ERP**: Trigger sinkronisasi dan parameter rentang tanggal/periode scraper.
2. **Ke Bot Telegram**: Respon status simpan realisasi dan hasil validasi nomor order.
3. **Ke Role Kalkulasi**: Hasil kalkulasi HPP per eksemplar, matriks harga jual berjenjang, dan riwayat harga beli vendor nyata (*Rekap Lookup*).
4. **Ke Role Admin Realisasi & Operator**: Referensi data SOPd dan target kerja.
5. **Ke Role Admin Penjadwalan & Kepala Seksi**: Dashboard Produksi, Analisa Produksi, dan Hasil Produksi.
6. **Ke Role Akunting**: Dashboard Akunting (grafik tren kas, laba-rugi, pendapatan vs beban), modal Analisis Jurnal, dan berkas unduhan Excel.
7. **Ke Role HRD**: Dashboard HRD (grafik tren pelanggaran per divisi, rekapitulasi poin SP staf, dan jam lembur).
8. **Ke Role Super Admin**: Tabel Audit Trail Log Aktivitas (`/activity-log`) yang mencatat seluruh aksi Create, Update, Delete oleh seluruh user.

---

### 2.3 Klarifikasi Khusus Modul Konversi Google Spreadsheet
Modul Google Spreadsheet di SINTAK berlokasi di `Settings > Konversi Data > Laporan Pekerjaan` (`/settings/konversi-data/laporan-pekerjaan`).
- **Fungsi Sebenarnya**: Digunakan untuk **keperluan migrasi/konversi data awal** dari spreadsheet lama (`DATABASE_REPORT`) ke database lokal SINTAK.
- **Operasional Berjalan**: Setelah konversi selesai, penambahan tugas teknis baru, pengubahan status, dan pengaturan urutan tugas dilakukan langsung di dalam aplikasi SINTAK pada halaman **Laporan Pekerjaan** (`/laporan-pekerjaan`). Oleh karena itu, Google Spreadsheet tidak digambarkan sebagai entitas eksternal operasional harian yang aktif bolak-balik.

## 3. DFD LEVEL 1: DEKOMPOSISI SUB-PROSES & DATA STORE

Pada DFD Level 1, sistem SINTAK didekomposisi menjadi **5 Sub-Proses Utama**, **9 Data Store (D1 – D9)**, dan **1 Sub-Proses Rekonsiliasi Audit Lintas Dokumen**:

### 3.1 Sub-Proses Utama (Level 1)
1. **Proses 1.0: Pembelian & Stok**
   - Menangani rantai transaksi pembelian bahan baku percetakan (kertas plano, plat CTP, tinta, lem jilid).
   - Menyimpan ke Data Store **D1** (`purchase_*`, `spph_*`, `sph_in`, `penerimaan_pembelian`, `rekap_pembelian_barang`, `pelunasan_hutang`) dan **D2** (`stok_master_barang`).
2. **Proses 2.0: Penjualan & Piutang**
   - Menangani siklus pesanan pelanggan dari penawaran harga keluar hingga penagihan piutang.
   - Menyimpan ke Data Store **D3** (`sph_out`, `sales_orders`, `sales_reports`, `pengiriman`, `pelunasan_piutang`).
3. **Proses 3.0: Operasional Manufaktur & Jurnal Harian Produksi (JHP)**
   - Jantung operasional percetakan: menghubungkan Order Produksi dari Digit (`orders`, `bill_of_materials`, `bahan_baku`, `barang_jadi`, `produksi_selesai`) dengan referensi **SOPd** (`/data/excel-sopd`), referensi dropdown **Master Pekerjaan**, penetapan **Target Harian**, dan realisasi harian (**JHP** - 198.270 baris).
   - Menyimpan ke Data Store **D4** (Data Produksi Digit) dan **D5** (Data Operasional SINTAK).
4. **Proses 4.0: Kalkulasi Biaya & Laporan Tugas**
   - Menangani simulasi harga cetak 20+ kategori buku/kemasan (`/pricelist`), kalkulasi `/hpp-kalkulasi`, serta pencatatan tugas teknis staf divisi di `/laporan-pekerjaan`.
   - Menyimpan ke Data Store **D6** (`laporan_pekerjaan`) dan **D7** (`hpp_kalkulasi`, `saved_calculations`, `global_master_params`).
5. **Proses 5.0: Akuntansi, SDM & Tata Kelola Sistem**
   - Menangani penyajian data pembukuan Jurnal Umum (100.4k baris) & Rek Akuntansi (203 COA), administrasi Karyawan (154 staf) & Catat Kesalahan (`infractions`), serta hak akses peran (RBAC) dan audit log.
   - Menyimpan ke Data Store **D8** (`rek_akuntansi`, `jurnal_umum`) dan **D9** (`employees`, `infractions`, `users`, `app_roles`, `telegram_users`, `activity_logs`).
---

### 3.2 Katalog Data Store (Penyimpanan Data D1 – D9)

| Kode | Nama Data Store | Tabel-Tabel di Database SQLite SINTAK | Volume Riil (`database_dev.sqlite`) |
| :---: | :--- | :--- | :---: |
| **D1** | **Data Pembelian Digit** | `purchase_requests`, `spph_out`, `sph_in`, `purchase_orders`, `penerimaan_pembelian`, `rekap_pembelian_barang`, `pelunasan_hutang` | ~44.500 baris |
| **D2** | **Data Master Stok Barang** | `stok_master_barang` | 12.958 baris |
| **D3** | **Data Penjualan Digit** | `sph_out`, `sales_orders`, `sales_reports`, `pengiriman`, `pelunasan_piutang` | ~21.800 baris |
| **D4** | **Data Produksi Digit** | `bill_of_materials`, `orders`, `bahan_baku`, `barang_jadi`, `produksi_selesai` | ~35.700 baris |
| **D5** | **Data Operasional SINTAK** | `sopd`, `sopd_harga`, `jurnal_harian_produksi`, `master_pekerjaan` | ~200.000 baris |
| **D6** | **Data Laporan Pekerjaan** | `laporan_pekerjaan` | 5.194 baris |
| **D7** | **Data Kalkulasi & HPP** | `hpp_kalkulasi`, `saved_calculations`, `global_master_params` | ~2.500 baris |
| **D8** | **Data Jurnal Akuntansi** | `rek_akuntansi`, `jurnal_umum` | 100.603 baris |
| **D9** | **Data SDM, Hak Akses & Audit** | `employees`, `infractions`, `users`, `app_roles`, `telegram_users`, `activity_logs` | ~17.500 baris |

---

### 3.3 Sub-Proses 6.0: Engine Rekonsiliasi & Tracking Manufaktur
Engine pelacakan terpadu 14 tabel dokumen operasional pabrik:
Pengguna memasukkan satu nomor dokumen acuan (Faktur BOM / Order Produksi / PO / PB / SO), lalu engine secara otomatis merekonstruksi riwayat siklus hidup dokumen lintas departemen:
$$\begin{aligned}
\text{Pembelian} &\longrightarrow \text{PR} \rightarrow \text{SPPH} \rightarrow \text{SPH} \rightarrow \text{PO} \rightarrow \text{Penerimaan} \rightarrow \text{Rekap PB} \rightarrow \text{Hutang} \\
\text{Penjualan} &\longrightarrow \text{SPH Out} \rightarrow \text{Sales Order} \rightarrow \text{Laporan Penjualan} \rightarrow \text{Pengiriman (SJ)} \rightarrow \text{Piutang} \\
\text{Manufaktur} &\longrightarrow \text{BOM} \rightarrow \text{Order Produksi} \rightarrow \text{Bahan Baku} \rightarrow \text{Barang Jadi}
\end{aligned}$$

---

## 4. AKSES FILE DIAGRAM RESMI (DRAW.IO)
Diagram grafis multi-halaman resmi tanpa grid (`grid="0"`) tersimpan di:
- **Lokal Proyek**: `D:\Projects\sintak_pt_buya_barokah\sintak-dfd.drawio`
- **Desktop Komputer**: `C:\Users\nauval\Desktop\sintak-dfd.drawio`

Tab halaman di Draw.io Desktop:
- **Tab 1**: `DFD Level 0 - Diagram Konteks`
- **Tab 2**: `DFD Level 1 - Rincian Sub-Proses`
