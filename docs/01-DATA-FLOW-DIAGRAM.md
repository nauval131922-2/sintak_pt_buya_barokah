# DOKUMEN SISTEM SINTAK: DATA FLOW DIAGRAM (DFD) LEVEL 0 & LEVEL 1
**Sistem Informasi Cetak (SINTAK) PT Buya Barokah**

---

## 1. PENDAHULUAN & RUANG LINGKUP
Dokumen ini mendefinisikan arsitektur aliran data sistem **SINTAK** secara struktural berbasis **kode sumber dan database sistem**, menggunakan standar **Data Flow Diagram (DFD)**:
1. **DFD Level 0 (Diagram Konteks / Context Diagram)**: Memetakan batasan sistem (*system boundary*), entitas eksternal, dan seluruh aktor pengguna resmi (berdasarkan hak akses riil di tabel `role_permissions`), serta aliran data masuk (*inflow*) dan informasi keluar (*outflow*).
2. **DFD Level 1 (Dekomposisi Sub-Proses & Data Store)**: Membedah SINTAK menjadi sub-proses bisnis, penyimpanan data (*Data Store D1 – D9*), serta modul pelacakan alur dokumen (*Tracking Manufaktur*).

---

## 2. DFD LEVEL 0: DIAGRAM KONTEKS (CONTEXT DIAGRAM)

### 2.1 Entitas Eksternal & Aktor Pengguna Resmi SINTAK
Pada diagram konteks, lingkaran tengah merepresentasikan inti sistem:
`0.0 SISTEM INFORMASI CETAK (SINTAK)`

Berinteraksi dengan **9 Entitas Eksternal & Peran Pengguna Asli**:

| No | Entitas / Peran Resmi | Tipe | Peran & Ruang Lingkup Riil di Sistem |
| :---: | :--- | :---: | :--- |
| **1** | **Digit** | Sistem Eksternal | Sumber data hulu yang ditarik via scraper SINTAK: mencakup transaksi Pembelian, Penjualan, Order Produksi (BOM, Bahan Baku, Barang Jadi), Rekening Akuntansi, dan Jurnal Umum. |
| **2** | **Bot Telegram** | Kanal Input Mobile | Kanal mobile untuk operator lapangan dalam input realisasi pengerjaan order (`/input`), pencarian order (`/search`, `/searchorder`), dan cek riwayat (`/history`). |
| **3** | **Role Kalkulasi** | Role SINTAK | Pengguna yang mengelola modul Kalkulasi Biaya Produksi: simulasi 20+ produk di `/pricelist`, pencatatan nilai HPP di `/hpp-kalkulasi`, riwayat harga beli bahan di modal Rekap Lookup, serta analisis riwayat pesanan di **Rekap Sales Order Barang** (`/rekap-sales-order`). |
| **4** | **Role Admin Realisasi** | Role SINTAK | Admin verifikator JHP: menginput dan memverifikasi data realisasi Jurnal Harian Produksi (**JHP**) harian di web (jam mulai-selesai, kuantitas realisasi, lembar **inscheet**, lembar **rijek**, dan kendala). |
| **5** | **Role Operator Lapangan & Kepala Seksi** | Role SINTAK | Staf operasional lapangan dan pimpinan seksi dari 7 divisi teknis: **Setting**, **Quality Control (QC)**, **Cetak**, **Finishing**, **Gudang**, **Teknisi**, dan **Mesin**. Menginput/memperbarui tugas di **Laporan Pekerjaan** (`/laporan-pekerjaan`) dan memantau **Hasil Produksi** (`/hasil-produksi`). |
| **6** | **Role Admin Penjadwalan** | Role SINTAK | Penjadwal operasional pabrik: membuat **Jadwal Target Harian** di form JHP (dengan nomor order yang otomatis bersumber dari `orders` Digit), memantau **Target Harian** (`/target`), dan mengelola referensi **Master Pekerjaan** & mesin. |
| **7** | **Role Akunting** | Role SINTAK | Pengguna bagian keuangan yang menjalankan sinkronisasi/scraping data Jurnal Umum dan Rek Akuntansi dari Digit, melihat **Dashboard Akunting** (visualisasi kas, tren laba-rugi), modal Analisis Jurnal, dan ekspor Excel. |
| **8** | **Role HRD** | Role SINTAK | Pengguna personalia: mengunggah/mengelola data master Karyawan di `/karyawan`, mencatat kesalahan kerja di **Catat Kesalahan** (`/records` / `infractions`), dan memantau **Dashboard HRD** (total karyawan & grafik tren kesalahan). |
| **9** | **Role Super Admin** | Role SINTAK | Administrator sistem tertinggi: mengelola akun login pengguna (`/users`), matriks hak akses (`/roles`), persetujuan registrasi Bot Telegram (`/settings/telegram-users`), menjalankan modul konversi data migrasi lama, dan memantau **Log Aktivitas** sistem (`/activity-log`). |

---

### 2.2 Kamus Aliran Data Masuk & Keluar (Inflow / Outflow)

#### A. Aliran Data Masuk (Inflow ke SINTAK — Panah Hijau):
1. **Dari Digit**: Data Scraping Pembelian, Penjualan, Orders & Jurnal.
2. **Dari Bot Telegram**: Input Realisasi Order Lapangan.
3. **Dari Role Kalkulasi**: Input Parameter Oplah, Bahan Kertas, & Finishing.
4. **Dari Role Admin Realisasi**: Input & Verifikasi JHP Harian (Jam Kerja, Realisasi, Inscheet, Rijek).
5. **Dari Role Operator Lapangan & Kepala Seksi**: Input & Pembaruan Tugas Laporan Pekerjaan (`/laporan-pekerjaan`).
6. **Dari Role Admin Penjadwalan**: Input Jadwal Target Harian & Master Pekerjaan.
7. **Dari Role Akunting**: Trigger Scrape Jurnal & Rek Akuntansi dari Digit.
8. **Dari Role HRD**: Upload Karyawan (Excel) & Catat Kesalahan (`/records`).
9. **Dari Role Super Admin**: Kelola Pengguna, Role & Approval Bot Telegram.

#### B. Aliran Informasi Keluar (Outflow dari SINTAK — Panah Ungu):
1. **Ke Digit**: Trigger Sinkronisasi / Scraping Periode.
2. **Ke Bot Telegram**: Respon Status Simpan & Validasi Order.
3. **Ke Role Kalkulasi**: Hasil Simulasi Matriks Harga Jual, HPP, Lookup Harga Bahan & Rekap Detail Sales Order Barang.
4. **Ke Role Admin Realisasi**: Referensi Data SOPd & Target Kerja.
5. **Ke Role Operator Lapangan & Kepala Seksi**: Monitoring Laporan Pekerjaan & Hasil Produksi.
6. **Ke Role Admin Penjadwalan**: Dashboard Produksi, Analisa & Target Harian.
7. **Ke Role Akunting**: Dashboard Akunting & Analisis Jurnal.
8. **Ke Role HRD**: Dashboard HRD (Total Karyawan & Grafik Tren Kesalahan).
9. **Ke Role Super Admin**: Audit Log Aktivitas (`/activity-log`).

---

### 2.3 Klarifikasi Khusus Modul Konversi Google Spreadsheet
Modul Google Spreadsheet di SINTAK berlokasi di `Settings > Konversi Data > Laporan Pekerjaan` (`/settings/konversi-data/laporan-pekerjaan`).
- **Fungsi Sebenarnya**: Digunakan untuk **keperluan migrasi/konversi data awal** dari spreadsheet lama (`DATABASE_REPORT`) ke database lokal SINTAK.
- **Operasional Berjalan**: Setelah konversi selesai, penambahan tugas teknis baru, pengubahan status, dan pengaturan urutan tugas dilakukan langsung di dalam aplikasi SINTAK pada halaman **Laporan Pekerjaan** (`/laporan-pekerjaan`). Oleh karena itu, Google Spreadsheet tidak digambarkan sebagai entitas eksternal operasional harian yang aktif bolak-balik.

---

## 3. DFD LEVEL 1: DEKOMPOSISI SUB-PROSES & DATA STORE

Pada DFD Level 1, sistem SINTAK didekomposisi menjadi **Sub-Proses Bisnis**, **9 Data Store (D1 – D9)**, dan **Modul Tracking Manufaktur**:

### 3.1 Sub-Proses Utama (Level 1)
1. **Proses 1.0: Pembelian & Stok**
   - Menangani rantai transaksi pembelian bahan baku percetakan (kertas plano, plat CTP, tinta, lem jilid).
   - Menyimpan ke Data Store **D1** (`purchase_*`, `spph_*`, `sph_in`, `penerimaan_pembelian`, `rekap_pembelian_barang`, `pelunasan_hutang`) dan **D2** (`stok_master_barang`).
2. **Proses 2.0: Penjualan & Piutang**
   - Menangani siklus pesanan pelanggan dari penawaran harga keluar hingga penagihan piutang.
   - Menyimpan ke Data Store **D3** (`sph_out`, `sales_orders`, `sales_reports`, `pengiriman`, `pelunasan_piutang`).
3. **Proses 3.0: Operasional Manufaktur & Jurnal Produksi (JHP)**
   - Jantung operasional percetakan: menghubungkan Order Produksi dari Digit (`orders`, `bill_of_materials`, `bahan_baku`, `barang_jadi`, `produksi_selesai`) dengan referensi **SOPd** (`/data/excel-sopd`), penetapan target rencana (**Input Target Penjadwalan** & **Target Harian**), pencatatan realisasi (**JHP** harian web & Bot Telegram), serta log divisi teknis (**Laporan Pekerjaan**).
   - Menyimpan ke Data Store **D4** (`Data Produksi Digit`), **D5** (`Data Operasional SINTAK`), dan **D6** (`Data Laporan Pekerjaan`).
4. **Proses 4.0: Kalkulasi Biaya & Simulasi Pricelist**
   - Menangani simulasi harga cetak 20+ produk (`/pricelist`), pencatatan nilai HPP per order (`/hpp-kalkulasi`), sinkronisasi nama order dari Digit `orders`, serta referensi tarif bahan dari riwayat Rekap Pembelian Barang.
   - Menyimpan ke Data Store **D7** (`hpp_kalkulasi`, `saved_calculations`, `global_master_params`).
5. **Proses 5.0: Akuntansi, SDM & Tata Kelola Sistem**
   - Menangani penyajian data pembukuan Jurnal Umum & Rek Akuntansi (COA), administrasi Karyawan & Catat Kesalahan (`infractions`), serta konfigurasi Hak Akses (`/roles`) dan log aktivitas sistem.
   - Menyimpan ke Data Store **D8** (`rek_akuntansi`, `jurnal_umum`), **D9** (`employees`, `infractions`), dan **D10** (`users`, `app_roles`, `telegram_users`, `activity_logs`).

---

### 3.2 Katalog Data Store (Penyimpanan Data D1 – D10)

| Kode | Nama Data Store | Tabel-Tabel di Database SINTAK |
| :---: | :--- | :--- |
| **D1** | **Data Pembelian Digit** | `purchase_requests`, `spph_out`, `sph_in`, `purchase_orders`, `penerimaan_pembelian`, `rekap_pembelian_barang`, `pelunasan_hutang` |
| **D2** | **Data Master Stok Barang** | `stok_master_barang` |
| **D3** | **Data Penjualan Digit** | `sph_out`, `sales_orders`, `sales_reports`, `pengiriman`, `pelunasan_piutang` |
| **D4** | **Data Produksi Digit** | `bill_of_materials`, `orders`, `bahan_baku`, `barang_jadi`, `produksi_selesai` |
| **D5** | **Data Jurnal Harian Produksi (JHP)** | `jurnal_harian_produksi` *(Referensi: `orders/sopd`, `master_pekerjaan`, `master_pekerjaan_jurnal_produksi`)* |
| **D6** | **Data Laporan Pekerjaan** | `laporan_pekerjaan`, `role_laporan_pekerjaan_config` |
| **D7** | **Data Kalkulasi Biaya & Simulasi** | `hpp_kalkulasi`, `pricelist_items`, `pricelist_saved_calculations` |
| **D8** | **Data Jurnal Akuntansi** | `rek_akuntansi`, `jurnal_umum` |
| **D9** | **Data SDM & Catat Kesalahan** | `employees`, `infractions` |
| **D10** | **Data Tata Kelola Sistem** | `users`, `app_roles`, `role_permissions`, `telegram_users`, `activity_logs`, `usr_log`, `push_subscriptions` |
---

### 3.3 Sub-Proses 6.0: Tracking Manufaktur
Modul pelacakan terpadu alur dokumen operasional:
Pengguna memasukkan satu nomor dokumen acuan (BOM / Order Produksi / PO / PB / SO), lalu sistem menelusuri riwayat alur dokumen lintas departemen:
$$\begin{aligned}
\text{Pembelian} &\longrightarrow \text{PR} \rightarrow \text{SPPH} \rightarrow \text{SPH} \rightarrow \text{PO} \rightarrow \text{Penerimaan} \rightarrow \text{Rekap PB} \rightarrow \text{Hutang} \\
\text{Penjualan} &\longrightarrow \text{SPH Out} \rightarrow \text{Sales Order} \rightarrow \text{Laporan Penjualan} \rightarrow \text{Pengiriman (SJ)} \rightarrow \text{Piutang} \\
\text{Manufaktur} &\longrightarrow \text{BOM} \rightarrow \text{Order Produksi} \rightarrow \text{Bahan Baku} \rightarrow \text{Barang Jadi}
\end{aligned}$$

---

## 4. DFD LEVEL 2: PROSES 3.0 OPERASIONAL PRODUKSI
Dekomposisi mendalam atas proses inti operasional percetakan:

### 4.1 Sub-Proses Level 2
1. **3.1 Sinkronisasi Data Produksi Digit**
   - Scraping berkala dokumen manufaktur dari sistem Digit: BOM, Order Produksi, Pemakaian Bahan Baku, Hasil Barang Jadi, dan Produksi Selesai.
   - Menyimpan ke Data Store **D4** (`bill_of_materials`, `orders`, `bahan_baku`, `barang_jadi`, `produksi_selesai`).
   - Mengalirkan sinkronisasi nomor order baru ke Referensi Order.
2. **3.2 Pengelolaan Data Referensi Produksi**
   - Referensi nomor order SOPd mengalir otomatis dari tabel `orders` hasil scraping Digit (unggah Excel hanya untuk arsip lampau $\le$ 2024).
   - Admin Penjadwalan mengelola **Master Pekerjaan** (kode standar & target per jam) dan **Master Pekerjaan Jurnal Produksi** (opsi dropdown pilihan mesin untuk 7 divisi).
   - Menyimpan ke Data Store **Referensi Produksi** (`orders/sopd`, `master_pekerjaan`, `master_pekerjaan_jurnal_produksi`).
3. **3.3 Penjadwalan & Pencatatan Realisasi JHP**
   - **Admin Penjadwalan**: Membuat jadwal target harian (shift, nama operator, nomor order dari referensi, target, dan jam kerja).
   - **Admin Realisasi & Bot Telegram**: Mengisi dan memverifikasi realisasi hasil cetak, lembar inscheet, lembar rijek, kendala mesin, dan bahan kertas.
   - Menyimpan ke Data Store **D5** (`jurnal_harian_produksi`).
4. **3.4 Analisa & Monitoring Hasil Produksi**
   - Membaca data log harian dari **D5** dan data barang jadi dari **D4**.
   - Menyajikan lembar cetak jadwal shift harian (**Jadwal Produksi Harian** di `/target`), pelacakan kronologi pengerjaan per nomor pesanan (**Analisa Produksi** di `/analisa`), rekapitulasi dual tab hasil lembar cetak vs data Digit (**Hasil Produksi** di `/hasil-produksi`), dan grafik tren pabrik (**Dashboard Manufaktur** di `/dashboard-manufaktur`).
5. **3.5 Pelaporan Tugas Lapangan (Laporan Pekerjaan)**
   - Modul pelaporan tugas teknis mandiri staf operasional untuk 7 divisi: Setting, QC, Cetak, Finishing, Gudang, Teknisi, dan Mesin.
   - Merujuk nama proyek dari referensi order (`orders` / `sopd`).
   - Menyimpan ke Data Store **D6** (`laporan_pekerjaan`, `role_laporan_pekerjaan_config`) dan menyajikan status pengerjaan (Belum Dikerjakan, In Progress, Selesai, Cancel) serta grafik beban kerja divisi.

---

## 5. AKSES FILE DIAGRAM RESMI (DRAW.IO)
Diagram grafis multi-halaman resmi tanpa grid (`grid="0"`) tersimpan di:
- **Lokal Proyek**: `D:\Projects\sintak_pt_buya_barokah\sintak-dfd.drawio`
- **Desktop Komputer**: `C:\Users\nauval\Desktop\sintak-dfd.drawio`

Tab halaman di Draw.io Desktop:
- **Tab 1**: `DFD Level 0 - Diagram Konteks` (Pemetaan 9 Sektor Peran Murni)
- **Tab 2**: `DFD Level 1 - Rincian Sub-Proses` (Sub-proses Bisnis, Data Store & Tracking Manufaktur)
- **Tab 3**: `DFD Level 2 - 3.0 Operasional Produksi` (Dekomposisi 5 Sub-Proses Operasional Pabrik)
