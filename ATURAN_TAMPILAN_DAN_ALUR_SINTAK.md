# ATURAN BAKU DIAGRAM ALIRAN DATA & ARSITEKTUR SINTAK

Dokumen ini adalah aturan wajib yang HARUS selalu dibaca dan dipatuhi setiap kali memodifikasi diagram SINTAK (Draw.io maupun FreeMind).

---

## 1. PANDUAN TATA LETAK & UKURAN KOTAK (ANTI TULISAN MENABRAK / TERPOTONG)
1. **Perhitungan Tinggi Kotak (Height)**:
   - Setiap baris teks rata-rata membutuhkan tinggi 18–20px.
   - Padding atas-bawah + header box minimal 30px.
   - Rumus: `Tinggi Kotak = (Jumlah Baris x 20px) + 35px`.
   - Contoh: Kotak dengan 5 baris teks WAJIB memiliki tinggi minimal **135px** (JANGAN 90px!).
   - Berikan clearance (jarak bebas) minimal 15px antara baris teks terbawah dan border bawah kotak.
2. **Lebar Kotak (Width)**:
   - Lebar harus cukup longgar agar teks tidak terlipat menjadi terlalu banyak baris vertikal.
   - Gunakan `spacingLeft=12; spacingRight=12; spacingTop=10; spacingBottom=10;` pada styling mxCell.

---

## 2. PANDUAN PANAH & LABEL (ANTI PANAH RUWET / LABEL BERTUMPUK)
1. **Jarak Bebas Antar Kotak (Gap Distance)**:
   - Jarak horizontal antara kotak sumber dan kotak tujuan yang memiliki panah berlabel minimal **140px – 180px**.
   - DILARANG meletakkan kotak berjarak hanya 40–50px jika ada panah dan label di antaranya!
2. **Posisi Label Panah**:
   - Label panah orthogonal wajib diletakkan di atas garis horizontal (`label_offset=[0, -12]`) dengan background putih (`labelBackgroundColor=#ffffff`).
   - Label DILARANG memotong garis panah vertikal lain atau menempel pada sudut kotak tujuan.
3. **Pencabangan Panah**:
   - Jika satu node mengarah ke beberapa node anak (seperti JHP ke Target, Analisa, Hasil), beri ruang vertikal dan horizontal yang lega agar tiap cabang panah terpisah jelas dan bersih.

---

## 3. PANDUAN ALUR ROLE (FLOW OF ROLES BERDASARKAN DATABASE DEV)
Role di SINTAK BUKAN sekadar daftar nama teks, melainkan aktor yang menggerakkan alur sistem:
1. **Super Admin**:
   - Rute: `/users`, `/roles`, `/settings/telegram-users`, `/log-aktivitas`, seluruh modul.
   - Aksi: Manajemen akun, konfigurasi hak akses RBAC, persetujuan user Telegram bot, audit log.
2. **Admin Penjadwalan**:
   - Rute: `/data/excel-sopd`, `/jurnal-harian-produksi`, `/jurnal-harian-produksi/target`.
   - Aksi: Mengambil antrean pesanan dari SOPd, menyusun target kerja per shift & operator, menyalin jadwal hari sebelumnya (Copy Jadwal).
3. **Admin Realisasi**:
   - Rute: `/jurnal-harian-produksi`, `/hasil-produksi`.
   - Aksi: Memvalidasi dan menginput jam mulai/selesai pengerjaan, jumlah lembar berhasil, dan lembar rijek di lapangan.
4. **Operator Teknis & Kasi (Cetak, Finishing, Setting, QC, Pra/Pasca Cetak)**:
   - Rute: `/laporan-pekerjaan`, `/hasil-produksi`, serta Bot Telegram (`/api/telegram/realisasi`).
   - Aksi: Operator mencatat lembar kerja harian per mesin/divisi atau mengirim update realisasi via chat bot Telegram. Kepala Seksi mengontrol antrean SOPd & laporan divisi.
5. **Kalkulasi & Kalkulasi2**:
   - Rute: `/pricelist`, `/hpp-kalkulasi`, `/rekap-sales-order`.
   - Aksi: Mensimulasikan estimasi harga cetak 20+ produk, menginput nilai HPP order, dan menganalisa rekapitulasi Sales Order.
6. **HRD**:
   - Rute: `/employees`, `/records`, `/dashboard-hrd`.
   - Aksi: Mengelola data karyawan, mencatat insiden kesalahan kerja & nominal kerugian operator, memantau tren pelanggaran di Dashboard HRD.
7. **Akunting**:
   - Rute: `/akuntansi/data/rek-akuntansi`, `/akuntansi/laporan/jurnal-umum`, `/dashboard-akunting`, `/sync`.
   - Aksi: Sinkronisasi data keuangan dari Digit, memantau bagan akun, menganalisis Debet/Kredit Jurnal Umum, dan memantau tren finansial di Dashboard Akuntansi.

---

## 4. LOG KESALAHAN & LESSONS LEARNED (CATATAN PENGINGAT ANTI-MISS)
*Wajib dibaca dan dipatuhi setiap kali memetakan atau memodifikasi diagram alur SINTAK:*

1. **Master Target / Pekerjaan Memiliki Form Upload Excel**:
   - Modul `Master Pekerjaan` (`/jurnal-harian-produksi/data/master-pekerjaan`) dan `Master Pekerjaan Jurnal Produksi` memiliki modul `MasterPekerjaanUpload.tsx` dan `MasterPekerjaanJurnalProduksiUpload.tsx` yang membaca file Excel (`.xls`, `.xlsx`, `.xlsm`).
   - **Wajib**: Selalu sertakan node sumber **Upload File Excel** di atas Master Target/Pekerjaan.

2. **Laporan Pekerjaan Menggunakan Google Spreadsheet API, BUKAN Upload Excel**:
   - Menu `/settings/konversi-data/laporan-pekerjaan` (`KonversiLaporanPekerjaanClient.tsx`) berfungsi mendownload live CSV dari tab `DATABASE_REPORT` Google Spreadsheet pusat, bukan upload file Excel lokal.
   - **Wajib**: Sumber data Laporan Pekerjaan harus diberi label **Google Spreadsheet Live Sync API**, bukan Upload Excel.

3. **Laporan Pekerjaan dan JHP 100% Terpisah (Decoupled / Paralel)**:
   - Tabel `laporan_pekerjaan` (tugas teknis staf divisi Setting, Cetak, Finishing, QC) dan `jurnal_harian_produksi` (rekap mesin & shift cetak) tidak saling terhubung di database.
   - **DILARANG**: Menarik panah ketergantungan dari Laporan Pekerjaan ke JHP atau sebaliknya. Keduanya adalah dua aliran pelaporan paralel.

4. **Master Karyawan adalah Feeder Utama JHP (Bukan Hanya HRD)**:
   - Halaman JHP (`TargetClient.tsx:251`, `JurnalClient.tsx:153`) memanggil `fetch('/api/employees')` untuk dropdown operator Shift 1, Shift 2, Shift 3, koordinator, dan validasi absensi harian ("Cek Karyawan").
   - **Wajib**: Master Karyawan harus memiliki relasi data langsung ke JHP sebagai penyedia data operator.

5. **Prinsip Anti-Asumsi Berdasarkan Nama Menu**:
   - DILARANG mengasumsikan alur atau sumber data hanya berdasarkan pengelompokan menu di Sidebar/URL. Selalu verifikasi langsung dengan membaca komponen halaman (`page.tsx` / `Client.tsx`) dan skema database sebelum menarik kesimpulan alur.

6. **Pricelist, HPP Kalkulasi, dan Rekap SO adalah Modul Terpisah (Bukan Pipeline Biaya)**:
   - `Pricelist` (`/pricelist`): Simulator matematis mandiri 20+ produk cetak (disimpan ke `saved_calculations`), TIDAK mengalir ke `hpp_kalkulasi`.
   - `HPP Kalkulasi` (`/hpp-kalkulasi`): Ditarik otomatis dari nama pesanan SPK Digit (`SELECT DISTINCT nama_prd FROM orders`) dan file Excel HPP konversi, lalu diisi manual nilai HPP per order.
   - `Rekap Sales Order` (`/rekap-sales-order`): Scraper dan viewer transaksi pesanan penjualan (`sales_orders`) dari Digit. DILARANG menarik panah fiktif antar ketiga modul ini.

7. **Dashboard Produksi Mengonsolidasi 4 Data Sekaligus**:
   - Menggabungkan: (1) `jurnal_harian_produksi`, (2) `orders` (SPK aktif), (3) `bahan_baku` (BBB Digit), dan (4) `barang_jadi` (Digit).

8. **Dashboard HRD Memantau Dua Sumber Data**:
   - Menggabungkan: (1) total staf aktif dari tabel `employees` dan (2) grafik tren insiden & beban finansial dari tabel `infractions`.

9. **Catat Kesalahan Terikat Nomor SPK Orders**:
   - Form `/records` memanggil `fetchProductionOrders` agar setiap insiden kelalaian operator dapat ditautkan ke nomor SPK pesanan yang rusak.

10. **Telegram Users adalah Gerbang Keamanan Chat Bot**:
    - Operator yang menggunakan Chat Bot Telegram wajib diapprove (`is_active = 1`) di `/settings/telegram-users`. Jika belum, kiriman data realisasi akan otomatis ditolak oleh bot.

11. **Daftar Modul Bersumber Ganda (Multi-Source) di SINTAK**:
    - **SOPd** (`/data/excel-sopd`): Triple Source $\rightarrow$ (1) SPK Digit `orders` (2025+), (2) Upload Excel arsip `sopd` ($\le$2024), dan (3) Edit manual 2x klik cell web (`sopd_harga`).
    - **JHP** (`/jurnal-harian-produksi`): Multi-Source $\rightarrow$ (1) Form web harian, (2) Bot Telegram HP, (3) Fitur Copy Jadwal, dan (4) Upload Excel konversi arsip JHP.
    - **Master Target / Pekerjaan**: Dual Source $\rightarrow$ (1) Upload File Excel dan (2) Input Form Tambah/Edit/Hapus web manual.
    - **HPP Kalkulasi** (`/hpp-kalkulasi`): Dual Source $\rightarrow$ (1) Sync nama pesanan dari SPK Digit `orders` dan (2) Upload File Excel arsip HPP lama.
    - **Laporan Pekerjaan** (`/laporan-pekerjaan`): Dual Source $\rightarrow$ (1) Input tugas harian web staf teknis dan (2) Live Sync CSV Google Spreadsheet (`DATABASE_REPORT`).
    - **Hasil Produksi** (`/hasil-produksi`): Dual Tab / Dual Source $\rightarrow$ (1) Tab Jurnal: Akumulasi internal JHP dan (2) Tab Barang Jadi: Serah terima fisik dari Digit.
    - **Pricelist Parameter**: Terhubung ke `rekap_pembelian_barang` Digit via fitur **Rekap Lookup** untuk mengintip harga beli riil kertas/plat dari vendor.
