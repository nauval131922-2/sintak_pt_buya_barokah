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
| **3** | **Role Kalkulasi** | Role SINTAK | Pengguna yang mengelola modul Kalkulasi Biaya Produksi: simulasi 20+ produk di `/pricelist`, kalkulasi `/hpp-kalkulasi`, serta referensi tarif bahan dari riwayat Pembelian. |
| **4** | **Role Admin Realisasi** | Role SINTAK | Admin verifikator JHP: menginput dan memverifikasi data realisasi Jurnal Harian Produksi (**JHP**) harian di web (jam mulai-selesai, kuantitas realisasi, lembar **inscheet**, lembar **rijek**, dan kendala). |
| **5** | **Role Operator Lapangan & Kepala Seksi** | Role SINTAK | Staf operasional lapangan dan pimpinan seksi percetakan:<br/>• **Setting**: Operator pra cetak & pembuatan plat CTP.<br/>• **Cetak**: Operator mesin cetak (Offset & Web).<br/>• **Finishing**: Operator pasca cetak (lipat, lem, jilid/binding, potong, & packing).<br/>• **Quality Control (QC)**: Staf pemeriksa standar mutu hasil cetak.<br/>• **Kepala Seksi**: Pimpinan teknis (`Kepala Seksi Pra Cetak` & `Kepala Seksi Pasca Cetak`).<br/>Semua peran ini berinteraksi di SINTAK untuk menginput/memperbarui tugas di **Laporan Pekerjaan** (`/laporan-pekerjaan`) dan memantau **Hasil Produksi** (`/hasil-produksi`). |
| **6** | **Role Admin Penjadwalan** | Role SINTAK | Penjadwal operasional pabrik: mengelola data **SOPd** (`/data/excel-sopd`), melakukan **Input Target (Penjadwalan)** di JHP, memantau **Target Harian** (`/target`), dan mengelola referensi **Master Pekerjaan**. |
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
6. **Dari Role Admin Penjadwalan**: Input SOPd, Target & Master Pekerjaan.
7. **Dari Role Akunting**: Trigger Scrape Jurnal & Rek Akuntansi dari Digit.
8. **Dari Role HRD**: Upload Karyawan (Excel) & Catat Kesalahan (`/records`).
9. **Dari Role Super Admin**: Kelola Pengguna, Role & Approval Bot Telegram.

#### B. Aliran Informasi Keluar (Outflow dari SINTAK — Panah Ungu):
1. **Ke Digit**: Trigger Sinkronisasi / Scraping Periode.
2. **Ke Bot Telegram**: Respon Status Simpan & Validasi Order.
3. **Ke Role Kalkulasi**: Hasil Simulasi Matriks Harga Jual & HPP.
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
   - Menangani penyajian data pembukuan Jurnal Umum & Rek Akuntansi (COA), administrasi Karyawan & Catat Kesalahan (`infractions`), serta hak akses peran (RBAC) dan log aktivitas sistem.
   - Menyimpan ke Data Store **D8** (`rek_akuntansi`, `jurnal_umum`), **D9** (`employees`, `infractions`), dan **D10** (`users`, `app_roles`, `telegram_users`, `activity_logs`).

---

### 3.2 Katalog Data Store (Penyimpanan Data D1 – D10)

| Kode | Nama Data Store | Tabel-Tabel di Database SINTAK |
| :---: | :--- | :--- |
| **D1** | **Data Pembelian Digit** | `purchase_requests`, `spph_out`, `sph_in`, `purchase_orders`, `penerimaan_pembelian`, `rekap_pembelian_barang`, `pelunasan_hutang` |
| **D2** | **Data Master Stok Barang** | `stok_master_barang` |
| **D3** | **Data Penjualan Digit** | `sph_out`, `sales_orders`, `sales_reports`, `pengiriman`, `pelunasan_piutang` |
| **D4** | **Data Produksi Digit** | `bill_of_materials`, `orders`, `bahan_baku`, `barang_jadi`, `produksi_selesai` |
| **D5** | **Data Operasional SINTAK** | `sopd`, `sopd_harga`, `jurnal_harian_produksi`, `master_pekerjaan` |
| **D6** | **Data Laporan Pekerjaan** | `laporan_pekerjaan` |
| **D7** | **Data Kalkulasi Biaya & Simulasi** | `hpp_kalkulasi`, `saved_calculations`, `global_master_params` |
| **D8** | **Data Jurnal Akuntansi** | `rek_akuntansi`, `jurnal_umum` |
| **D9** | **Data SDM & Catat Kesalahan** | `employees`, `infractions` |
| **D10** | **Data Tata Kelola Sistem** | `users`, `app_roles`, `telegram_users`, `activity_logs` |
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

## 4. AKSES FILE DIAGRAM RESMI (DRAW.IO)
Diagram grafis multi-halaman resmi tanpa grid (`grid="0"`) tersimpan di:
- **Lokal Proyek**: `D:\Projects\sintak_pt_buya_barokah\sintak-dfd.drawio`
- **Desktop Komputer**: `C:\Users\nauval\Desktop\sintak-dfd.drawio`

Tab halaman di Draw.io Desktop:
- **Tab 1**: `DFD Level 0 - Diagram Konteks` (Pemetaan 9 Sektor Peran Murni)
- **Tab 2**: `DFD Level 1 - Rincian Sub-Proses` (Sub-proses Bisnis, Data Store & Tracking Manufaktur)
