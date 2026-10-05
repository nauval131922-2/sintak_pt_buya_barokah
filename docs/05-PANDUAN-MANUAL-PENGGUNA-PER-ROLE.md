# DOKUMEN OPERASIONAL SINTAK: PANDUAN MANUAL PENGGUNA PER ROLE (USER MANUAL)
> **Sistem Informasi & Manajemen Terpadu Percetakan — PT Buya Barokah**  
> Status Dokumen: *Resmi, Lengkap & Terverifikasi* | Platform: `Web Desktop & Bot Telegram` | Versi: `v2.4 Production`

---

## DAFTAR ISI
1. [Pendahuluan & Matriks Peran Pengguna (RBAC SINTAK)](#1-pendahuluan--matriks-peran-pengguna-rbac-sintak)
2. [Panduan Role: Super Admin (Sistem, Tata Kelola & Integrasi)](#2-panduan-role-super-admin-sistem-tata-kelola-integrasi)
3. [Panduan Role: Tim Operasional Produksi Pabrik](#3-panduan-role-tim-operasional-produksi-pabrik)
   - [3.1 Admin Penjadwalan (8 Modul)](#31-admin-penjadwalan-8-modul)
   - [3.2 Admin Realisasi (7 Modul)](#32-admin-realisasi-7-modul)
   - [3.3 Produksi / Supervisor Pabrik (5 Modul)](#33-produksi--supervisor-pabrik-5-modul)
   - [3.4 Kepala Seksi (Pra Cetak & Pasca Cetak)](#34-kepala-seksi-pra-cetak--pasca-cetak)
4. [Panduan Role: Teknisi & Operator Lapangan 7 Divisi](#4-panduan-role-teknisi--operator-lapangan-7-divisi)
   - [4.1 Pelaporan via Web Lembar Kerja (/laporan-pekerjaan)](#41-pelaporan-via-web-lembar-kerja-laporan-pekerjaan)
   - [4.2 Pelaporan via Bot Telegram (@SintakSettingBot)](#42-pelaporan-via-bot-telegram-sintaksettingbot)
5. [Panduan Role: Tim Kalkulasi & Estimasi Biaya](#5-panduan-role-tim-kalkulasi--estimasi-biaya)
6. [Panduan Role: HRD (Personalia & Kedisiplinan)](#6-panduan-role-hrd-personalia--kedisiplinan)
7. [Panduan Role: Akunting (Keuangan & Pembukuan)](#7-panduan-role-akunting-keuangan--pembukuan)
8. [Panduan Role: Akun Peninjauan (Demo & Demo 2)](#8-panduan-role-akun-peninjauan-demo--demo-2)
9. [SOP Penanganan Kendala Operasional (FAQ & Troubleshooting)](#9-sop-penanganan-kendala-operasional-faq--troubleshooting)

---

## 1. PENDAHULUAN & MATRIKS PERAN PENGGUNA (RBAC SINTAK)

SINTAK (*Sistem Informasi Cetak*) adalah sistem terpadu yang dirancang khusus untuk mengelola operasional industri percetakan buku, kalender, dus kemasan, dan produk cetak komersial PT Buya Barokah.

### Akses Masuk Sistem:
- **Aplikasi Web**: Diakses melalui peramban di `https://sintak-ptbuya.cloud` (atau jaringan lokal kantor `http://192.168.2.75:3000`).
- **Bot Telegram**: `@SintakSettingBot` untuk pelaporan realisasi teknisi lapangan via smartphone.

### Matriks Wewenang & Hak Akses Peran Resmi:
Setiap pengguna yang masuk ke dalam sistem dibatasi aksesnya oleh sistem **Role-Based Access Control (RBAC)**:

| No | Nama Peran Resmi (app_roles) | Jumlah Modul | Kelompok Wewenang Utama | Kanal Akses |
| :-: | :--- | :-: | :--- | :--- |
| **1** | **Super Admin** | **45 Modul** | Akses penuh seluruh sistem, user, hak akses, log & sinkronisasi | Web Desktop |
| **2** | **Admin Penjadwalan** | **8 Modul** | Plotting antrean SOPd, susun target shift JHP, target harian | Web Desktop |
| **3** | **Admin Realisasi** | **7 Modul** | Verifikasi jam kerja, lembar realisasi, rijek, inscheet & kendala | Web Desktop |
| **4** | **Produksi (Supervisor)** | **5 Modul** | Monitoring ritme kerja pabrik di Dashboard Manufaktur, analisa bottleneck | Web Desktop |
| **5** | **Kepala Seksi Pra Cetak** | **3 Modul** | Supervisi antrean SOPd, kesiapan plat CTP & tugas divisi Setting | Web Desktop |
| **6** | **Kepala Seksi Pasca Cetak**| **3 Modul** | Supervisi antrean SOPd, fisik barang jadi jilid & tugas Finishing | Web Desktop |
| **7** | **Setting** | **1 Modul** | Lembar kerja tugas mandiri desain, layout, dan pembuatan plat CTP | Web & Bot |
| **8** | **Quality Control (QC)** | **2 Modul** | Inspeksi akurasi register, ketepatan warna, lembar lolos/rijek | Web & Bot |
| **9** | **Cetak** | **2 Modul** | Input lembar cetak naik mesin, sirkulasi tinta, jam mesin | Web & Bot |
| **10**| **Finishing** | **2 Modul** | Pencatatan potong, lipat, jilid lem panas, jahit kawat, laminasi | Web & Bot |
| **11**| **Kalkulasi** | **3 Modul** | Simulasi harga 20+ produk di Pricelist, penetapan HPP, evaluasi margin SO | Web Desktop |
| **12**| **Kalkulasi2** | **1 Modul** | Simulator Pricelist untuk hitung cepat estimasi harga penawaran Sales | Web Desktop |
| **13**| **HRD** | **10 Modul** | Master karyawan, formulir catat kesalahan, analisis Dashboard HRD | Web Desktop |
| **14**| **Akunting** | **7 Modul** | Audit mutasi jurnal umum Digit, modal Analisis Jurnal, Dashboard Akunting | Web Desktop |
| **15**| **Demo / Demo 2** | **6 / 2 Modul**| Akun tamu peninjauan fitur (read-only) tanpa wewenang mutasi | Web Desktop |

---

## 2. PANDUAN ROLE: SUPER ADMIN (SISTEM, TATA KELOLA & INTEGRASI)

Role **Super Admin** memegang wewenang tertinggi untuk mengelola keamanan akun, konfigurasi hak akses pengguna, integrasi sinkronisasi data dengan ERP Digit, dan pemantauan jejak audit (*audit trail*).

```
Hak Akses Menu Utama:
• /users (Manajemen Akun Login)
• /roles (Konfigurasi Matriks RBAC)
• /settings/telegram-users (Otorisasi Akun Bot Operator)
• /sync (Pusat Sinkronisasi Data Digit)
• /log-aktivitas (Audit Trail & Rollback Revert)
• /tracking-manufaktur (Pelacakan Rantai Dokumen 3 Departemen)
• Seluruh 4 Dashboard Eksekutif (Umum, Manufaktur, HRD, Akunting)
```

### Prosedur Operasional Super Admin:

#### 1. Mendaftarkan Akun Pengguna Baru (`/users`)
1. Buka menu **User** $
ightarrow$ **Pengguna** (`/users`).
2. Klik tombol **`+ Tambah Pengguna`** di sudut kanan atas.
3. Isi data formulir:
   - **Username**: Nama pengguna untuk login (huruf kecil tanpa spasi, contoh: `budi_cetak`).
   - **Nama Lengkap**: Nama asli staf pengguna.
   - **Password**: Kata sandi awal (sistem otomatis mengenkripsi dengan bcrypt).
   - **Role**: Pilih salah satu peran resmi dari daftar dropdown (contoh: `Admin Penjadwalan`).
   - **Tautkan Karyawan**: Pilih nama pegawai dari master karyawan (opsional namun disarankan).
4. Klik **`Simpan`**. Akun langsung aktif dan dapat digunakan untuk masuk ke sistem.

#### 2. Mengatur Matriks Hak Akses Peran (`/roles`)
1. Buka menu **User** $
ightarrow$ **Hak Akses** (`/roles`).
2. Pilih peran yang ingin dikonfigurasi pada daftar sebelah kiri (contoh: `Kalkulasi`).
3. Centang modul-modul yang diizinkan untuk diakses oleh peran tersebut.
4. Klik tombol **`Simpan Perubahan`**. Matriks izin langsung tersimpan di tabel `role_permissions` dan langsung berlaku seketika (*real-time*).

#### 3. Mengotorisasi Akun Bot Telegram Operator (`/settings/telegram-users`)
1. Jika ada operator baru yang mendaftar via bot Telegram, angka badge notifikasi akan muncul di menu **Telegram Users**.
2. Buka menu **Telegram** $
ightarrow$ **Telegram Users** (`/settings/telegram-users`).
3. Periksa baris pendaftar baru: cocokkan `nama_karyawan`, `bagian`, dan `telegram_username`.
4. Klik tombol hijau **`Setujui / Approve`**. Status akan berubah menjadi `is_active = 1` dan operator langsung dapat mengirimkan laporan pengerjaan mesin via Telegram.

#### 4. Menjalankan Sinkronisasi Manual Data Digit (`/sync`)
1. Jika data pesanan baru atau pembelian di Digit belum tampil di SINTAK, buka menu **Data Digit** $
ightarrow$ **Sinkronisasi All Data** (`/sync`).
2. Pilih rentang tanggal transaksi yang ingin ditarik (contoh: 1 minggu terakhir).
3. Klik tombol **`Mulai Sinkronisasi`**. Sistem akan mengeksekusi scraper secara bertahap dan menampilkan progres bar hingga 100%.

#### 5. Audit Trail & Pemulihan Data (*Revert*) (`/log-aktivitas`)
1. Buka menu **Sistem** $
ightarrow$ **Log Aktivitas** (`/log-aktivitas`).
2. Gunakan filter pencarian untuk melacak siapa yang mengubah, menghapus, atau menambah data pada tanggal dan tabel tertentu.
3. **Fitur Revert (Rollback)**: Jika terjadi kesalahan hapus atau kelalaian edit oleh staf, Super Admin dapat menekan tombol **`Revert / Kembalikan`** pada baris log terkait. Sistem akan mengembalikan isi baris data ke kondisi semula secara instan.

---

## 3. PANDUAN ROLE: TIM OPERASIONAL PRODUKSI PABRIK

Kelompok peran operasional bertugas mengendalikan seluruh siklus manufaktur percetakan mulai dari antrean pesanan, penjadwalan shift harian, pengawasan mesin, hingga verifikasi barang jadi.

---

### 3.1 Admin Penjadwalan (8 Modul)
Tanggung jawab utama: Mengatur antrean pesanan masuk, membagi target kerja ke masing-masing mesin dan operator shift harian.

#### Langkah Kerja Harian:
1. **Pemeriksaan Antrean Order (`/data/excel-sopd`)**:
   - Buka menu **Produksi** $
ightarrow$ **Excel SOPd** (`/data/excel-sopd`).
   - Periksa daftar pesanan cetak yang mendekati tanggal *deadline*.
   - Jika ada pesanan yang perlu disesuaikan estimasi harganya atau diatur tenggat waktunya, klik sel tabel untuk melakukan *inline edit*.
2. **Penyusunan Jadwal Target Shift (`/jurnal-harian-produksi`)**:
   - Buka menu **Produksi** $
ightarrow$ **Jurnal Harian Produksi** (`/jurnal-harian-produksi`).
   - Klik tombol **`+ Tambah Jadwal Target`**.
   - Isi parameter kerja shift:
     - **Tanggal**: Tanggal eksekusi kerja (hari ini atau besok).
     - **Bagian**: Pilih divisi mesin (contoh: `CETAK`, `FINISHING`, `POND`).
     - **Shift**: Pilih Shift `1` (Pagi), `2` (Sore), atau `3` (Malam).
     - **Operator**: Pilih nama operator dari daftar dropdown (tersinkron dari master karyawan).
     - **No Order / SOPd**: Pilih nomor order dari antrean aktif (nama produk akan otomatis terisi).
     - **Jenis Pekerjaan**: Pilih standar pengerjaan (contoh: *Cetak Naik Mesin SM52*).
     - **Target**: Masukkan jumlah target lembar yang wajib diselesaikan pada shift tersebut.
   - Klik **`Simpan Jadwal`**.
3. **Menggunakan Fitur Efisiensi "Copy Jadwal"**:
   - Jika susunan operator dan mesin hari ini sama dengan kemarin, Admin Penjadwalan cukup menekan tombol **`Copy Jadwal Kemarin`**.
   - Sistem akan menyalin seluruh baris penugasan kemarin ke tanggal hari ini dalam 1 klik.
4. **Evaluasi Sebaran Beban Kerja (`/target`)**:
   - Buka menu **Produksi** $
ightarrow$ **Target Harian** (`/target`).
   - Pastikan beban lembar cetak terbagi adil antar-operator dan tidak ada mesin produktif yang menganggur (*idle*).

---

### 3.2 Admin Realisasi (7 Modul)
Tanggung jawab utama: Memvalidasi dan menginput laporan fisik hasil pengerjaan operator lapangan ke dalam sistem.

#### Langkah Kerja Harian:
1. **Buka Lembar Kerja Realisasi (`/jurnal-harian-produksi`)**:
   - Buka menu **Jurnal Harian Produksi** dan filter berdasarkan tanggal hari ini dan shift yang baru saja selesai.
   - Temukan baris tugas operator yang bersangkutan.
2. **Input Hasil Kerja Mesin**:
   - Klik ikon **Edit (Pensil)** pada baris tugas operator.
   - Masukkan data fisik dari laporan kertas operator:
     - **Jam Mulai & Jam Selesai**: Waktu mesin mulai berputar hingga selesai (contoh: `08:00` s/d `16:00`).
     - **Realisasi Lembar**: Jumlah lembar cetak atau jilid yang berhasil diselesaikan secara baik (*good copy*).
     - **Rijek (Afkir)**: Jumlah lembar rusak saat proses setup mesin maupun saat jalan cetak.
     - **Inscheet**: Kuantitas lembar kertas lebihan (*insheet*) yang terpakai.
     - **Kendala Mesin**: Catatan jika terjadi hambatan kerja (contoh: *Listrik padam 30 menit*, *Ganti rol air*, dll.).
3. **Simpan Realisasi**:
   - Klik **`Simpan Realisasi`**. Status entri akan otomatis berubah menjadi tuntas dan datanya langsung mengalir ke menu Hasil Produksi dan Dashboard Pabrik.

---

### 3.3 Produksi / Supervisor Pabrik (5 Modul)
Tanggung jawab utama: Mengawasi stabilitas ritme pengerjaan pabrik, mencegah *bottleneck* mesin, dan menganalisis pencapaian target.

#### Langkah Kerja Harian:
1. **Pemantauan Dashboard Manufaktur (`/dashboard-manufaktur`)**:
   - Pantau metrik kartu: Total pesanan aktif, total lembar realisasi hari ini, dan grafik rasio pemakaian Biaya Bahan Baku (BBB) terhadap nilai Barang Jadi.
2. **Evaluasi Pencapaian Target Shift (`/target`)**:
   - Filter per shift dan periksa operator atau mesin yang persentase realisasinya di bawah $85\%$.
   - Lakukan koordinasi langsung dengan Kepala Seksi untuk mengatasi kendala mesin.
3. **Analisa Kronologi Order Tertunda (`/jurnal-harian-produksi/analisa`)**:
   - Jika ada pesanan yang terlambat dari jadwal, buka menu **Analisa Produksi** dan masukkan nomor order.
   - Sistem akan menyajikan linimasa lengkap: kapan setting selesai, kapan cetak naik mesin, dan proses jilid mana yang menjadi titik sumbatan (*bottleneck*).

---

### 3.4 Kepala Seksi (Pra Cetak & Pasca Cetak)
Tanggung jawab utama: Mengontrol kesiapan teknis spesifik pada divisinya masing-masing.

#### A. Kepala Seksi Pra Cetak (Divisi Setting & CTP):
- Buka menu **Laporan Pekerjaan** (`/laporan-pekerjaan`): Sistem otomatis mengunci filter pada bagian `SETTING`.
- Pantau antrean pembuatan Plat CTP. Pastikan jumlah keping plat dan ukuran plat (contoh: $650 	imes 550	ext{ mm}$) sesuai dengan spesifikasi mesin cetak yang akan jalan.
- Berikan verifikasi status `SELESAI` pada tugas setting yang file dan platnya sudah siap di ruang mesin.

#### B. Kepala Seksi Pasca Cetak (Divisi Finishing & Jilid):
- Buka menu **Laporan Pekerjaan** (`/laporan-pekerjaan`): Sistem otomatis mengunci filter pada bagian `FINISHING`.
- Supervisi tahapan akhir: potong kertas, lipat lembaran, jilid lem panas (*perfect binding*), jahit kawat, dan pengeleman hardcover.
- Buka menu **Hasil Produksi** (`/hasil-produksi`): Verifikasi serah terima fisik produk jadi sebelum dikirimkan ke gudang atau ekspedisi pelanggan.

---

## 4. PANDUAN ROLE: TEKNISI & OPERATOR LAPANGAN 7 DIVISI

SINTAK menyediakan dua jalur pelaporan yang fleksibel bagi teknisi lapangan (Setting, QC, Cetak, Finishing, Gudang, Teknisi, dan Mesin): melalui **Tabel Lembar Kerja Web** atau melalui **Pesan Bot Telegram**.

---

### 4.1 Pelaporan via Web Lembar Kerja (`/laporan-pekerjaan`)

Tampilan `/laporan-pekerjaan` adalah tabel lembar kerja (*spreadsheet table*) interaktif yang memuat seluruh tugas divisi aktif.

```
Status Alur Pengerjaan Tugas:
[BELUM DIKERJAKAN] ---> (Klik Mulai) ---> [IN PROGRESS] ---> (Klik Selesai) ---> [SELESAI]
       |
       +-------------> (Jika Dibatalkan) -> [CANCEL] (Isi alasan di kolom Note)
```

#### Langkah-langkah Penggunaan:
1. **Melihat Tugas yang Ditugaskan ke Anda**:
   - Buka menu **Laporan Pekerjaan** (`/laporan-pekerjaan`).
   - Pilih nama Anda pada filter dropdown **PIC**. Sistem akan menyaring hanya tugas-tugas milik Anda.
2. **Memulai Pengerjaan Tugas**:
   - Pada baris tugas yang berstatus **`BELUM DIKERJAKAN`**, klik dropdown status dan ubah menjadi **`IN PROGRESS`**.
   - Sistem akan secara otomatis merekam stempel tanggal pengerjaan dimulai (`start_date`).
3. **Menyelesaikan Tugas**:
   - Jika pengerjaan fisik tugas telah selesai (contoh: plat CTP selesai digosok, atau penjilidan selesai), ubah status menjadi **`SELESAI`**.
   - Sistem akan mencatat tanggal selesai (`end_date`) dan menghitung durasi hari kerja (`work_days`).
4. **Membatalkan Tugas (Cancel)**:
   - Jika pesanan dibatalkan atau terjadi revisi spesifikasi oleh pemesan, ubah status menjadi **`CANCEL`**.
   - **Wajib**: Klik kolom **Note** pada baris tersebut dan ketikkan alasan pembatalan (contoh: *Dibatalkan pemesan ganti ukuran*).
5. **Membuat Tugas Mandiri Baru**:
   - Klik tombol **`+ Tambah Tugas`** di pojok tabel.
   - Isi: Nama Tugas (*Task*), Nama Proyek (*Project*), Penanggung Jawab (*PIC*), Prioritas (*Normal / Urgent / High*), dan Catatan Teknis.

---

### 4.2 Pelaporan via Bot Telegram (`@SintakSettingBot`)

Bagi operator yang sibuk di lantai mesin dan tidak selalu membawa laptop, pelaporan dapat dilakukan 100% dari ponsel melalui aplikasi Telegram.

#### A. Pendaftaran Awal (Hanya Sekali):
1. Buka aplikasi Telegram di smartphone Anda dan cari bot: **`@SintakSettingBot`**.
2. Klik tombol **`START`** atau kirim pesan: `/register`.
3. Masukkan data pendaftaran sesuai panduan bot:
   - Nama lengkap (harus persis sesuai nama di master karyawan).
   - Bagian / Divisi (contoh: `CETAK` atau `FINISHING`).
4. Bot akan menjawab: *"Pendaftaran Anda telah dicatat dan sedang menunggu persetujuan Super Admin."*
5. Hubungi Super Admin untuk menyetujui akun Anda di panel web `/settings/telegram-users`.

#### B. Mengirim Laporan Realisasi Mesin:
1. Setelah akun disetujui, kirimkan perintah: `/realisasi`.
2. Bot akan menampilkan instruksi atau formulir interaktif pengisian data:
   - **Tanggal Kerja**: Masukkan tanggal (format `YYYY-MM-DD` atau `DD-MM-YYYY`).  
     *(Perhatian: Sistem membatasi input tanggal maksimal 7 hari ke belakang, dan menolak tanggal masa depan)*.
   - **Shift**: Ketik angka `1`, `2`, atau `3`.
   - **Nomor Order**: Masukkan nomor pesanan (contoh: `PRD0012604280001` atau nomor SOPd).
   - **Realisasi Lembar**: Masukkan angka lembar jadi yang berhasil diselesaikan (contoh: `5000`).
   - **Inscheet & Rijek**: Masukkan kuantitas lembar rusak (contoh: `25`).
   - **Jam Mulai & Jam Selesai**: Format jam `HH:MM` (contoh: `08:00 - 16:00`).
3. Bot akan memvalidasi data dan mengirimkan konfirmasi:
   > *"✅ Laporan realisasi berhasil disimpan ke sistem SINTAK dengan ID #198272. Terima kasih atas kerja keras Anda!"*
4. Data tersebut seketika langsung masuk ke tabel `jurnal_harian_produksi` di server kantor secara *real-time*.

---

## 5. PANDUAN ROLE: TIM KALKULASI & ESTIMASI BIAYA

Role **Kalkulasi** dan **Kalkulasi2** bertugas membuat simulasi harga jual produk cetakan, menentukan acuan Harga Pokok Produksi (HPP), serta mengevaluasi margin keuntungan pesanan.

```
Hak Akses Menu Utama:
• /pricelist (Simulator Kalkulasi 20+ Produk)
• /hpp-kalkulasi (Master Nilai Rupiah HPP per Pesanan)
• /rekap-sales-order (Analisis Margin Penjualan Sales Order Digit)
```

### Prosedur Operasional Kalkulasi:

#### 1. Simulasi Hitung Harga Cetak di Pricelist (`/pricelist`)
1. Buka menu **Pricelist** (`/pricelist`).
2. Pilih tab simulator sesuai kategori produk yang akan dihitung (contoh: *Buku Soft Cover*, *Kalender Kop*, *Dus Kemasan*, *Brosur*, *Nota*, dll.).
3. Masukkan parameter teknis pesanan:
   - **Oplah**: Kuantitas pesanan (contoh: `1000` eksemplar).
   - **Ukuran Jadi & Ukuran Plano**: Dimensi buku atau kemasan.
   - **Jenis Bahan Kertas**: Pilih jenis kertas cover dan kertas isi (contoh: *Art Paper 150gr*, *HVS 70gr*, *Duplex 350gr*).
   - **Proses Cetak & Finishing**: Jumlah warna cetak mesin (contoh: 4/4 Full Color), laminasi doff/glossy, spot UV, jilid lem panas (*binding*), atau jahit kawat.
4. **Fitur Rekap Lookup (Harga Bahan Terkini)**:
   - Klik tombol **`Lookup Tarif Bahan`**. Sistem akan menampilkan riwayat harga beli riil kertas tersebut dari faktur pembelian terakhir di tabel `rekap_pembelian_barang`.
   - Hal ini memastikan perhitungan HPP bahan menggunakan tarif pasar riil terkini.
5. **Menghitung & Menyimpan Hasil**:
   - Sistem secara otomatis menghitung 4 komponen biaya (Kertas + Cetak + Finishing + Markup Profit) dan menampilkan harga pokok per unit serta harga jual yang disarankan.
   - Klik **`Simpan Simulasi`** untuk menyimpan hasil kalkulasi ke tab **Saved Calculations** (`pricelist_saved_calculations`).

#### 2. Menetapkan Nilai Rupiah HPP Acuan (`/hpp-kalkulasi`)
1. Buka menu **HPP Kalkulasi** (`/hpp-kalkulasi`).
2. Jika ada pesanan baru dari Digit yang belum muncul, klik tombol **`Sinkronkan Nama Produk dari Orders`**.
3. Temukan nama produk pesanan terkait, lalu klik sel kolom **HPP Kalkulasi** untuk memasukkan nominal rupiah acuan (contoh: `12500000`).
4. Nilai HPP ini akan menjadi standar pembanding untuk mengevaluasi realisasi pemakaian biaya bahan baku (BBB) di lantai pabrik.

#### 3. Analisis Margin Pesanan Penjualan (`/rekap-sales-order`)
1. Buka menu **Rekap Sales Order Barang** (`/rekap-sales-order`).
2. Gunakan filter rentang tanggal atau cari nama produk/pelanggan.
3. Bandingkan nilai pesanan penjualan yang diterbitkan oleh tim Sales dengan nilai estimasi HPP untuk memastikan margin keuntungan minimal perusahaan tetap terpenuhi.

---

## 6. PANDUAN ROLE: HRD (PERSONALIA & KEDISIPLINAN)

Role **HRD** bertugas mengelola master data pegawai perusahaan, mencatat insiden kesalahan kerja operasional, dan memantau tren kedisiplinan staf melalui dasbor personalia.

```
Hak Akses Menu Utama:
• /employees (Master Personalia Pegawai)
• /records (Formulir Catat Kesalahan & Beban Ganti Rugi)
• /dashboard-hrd (Dasbor Tren Kesalahan & Statistik Pegawai)
```

### Prosedur Operasional HRD:

#### 1. Pengelolaan Data Karyawan (`/employees`)
1. Buka menu **Karyawan** (`/employees`).
2. Untuk menambah pegawai baru: klik **`+ Tambah Karyawan`**, isi Nama Lengkap, NIP (*employee_no*), Posisi/Jabatan, Departemen, dan pastikan status `is_active = 1`.
3. **Impor Massal Excel**: Jika terdapat pembaruan data karyawan tahunan, klik **`Unggah Excel Karyawan`** untuk memperbarui ratusan data pegawai sekaligus secara instan.
4. Data master karyawan ini otomatis menjadi sumber daftar dropdown operator pada modul Jurnal Harian Produksi (JHP) dan penautan akun login pengguna.

#### 2. Pencatatan Insiden Kesalahan Kerja (`/records`)
Jika terjadi kelalaian kerja di lantai produksi (contoh: salah potong kertas, plat baret karena kotoran, atau afkir cetak berlebih):
1. Buka menu **Catat Kesalahan** (`/records`).
2. Klik tombol **`+ Catat Kesalahan Baru`**.
3. Isi data formulir insiden:
   - **Karyawan**: Pilih nama pegawai penanggung jawab.
   - **Nomor Order**: Masukkan nomor SPK pesanan cetak terkait.
   - **Tanggal Kejadian**: Tanggal terjadinya insiden.
   - **Tingkat Keparahan (Severity)**:
     - Pilih **`Low`** untuk kesalahan ringan/minor (sanksi berupa teguran dan pembinaan shift).
     - Pilih **`Medium`** untuk kerusakan material signifikan (pembebanan ganti rugi finansial).
   - **Rincian Kerusakan Bahan**: Masukkan nama bahan rusak (contoh: *Art Carton 260gr*), kuantitas lembar rusak, harga satuan, dan total beban rupiah ganti rugi yang dibebankan kepada staf.
   - **Deskripsi Kejadian**: Ketikkan kronologi insiden secara obyektif dan jelas.
4. Klik **`Simpan Catatan`**. Data akan tersimpan di tabel `infractions` dan nomor faktur insiden akan diterbitkan otomatis oleh sistem.

#### 3. Evaluasi Tren Kedisiplinan (`/dashboard-hrd`)
1. Buka menu **Dashboard HRD** (`/dashboard-hrd`).
2. Pantau grafik bulanan **Infractions Trend**: amati apakah tren kesalahan kerja menurun atau meningkat pada divisi tertentu.
3. Gunakan data statistik ini sebagai bahan rapat evaluasi kinerja berkala bersama manajemen dan Supervisor Pabrik.

---

## 7. PANDUAN ROLE: AKUNTING (KEUANGAN & PEMBUKUAN)

Role **Akunting** bertugas meninjau transaksi pembukuan jurnal umum dari ERP Digit, melakukan analisis pergerakan mutasi kas/bank dan laba-rugi berjalan, serta memantau grafik keuangan di dasbor.

```
Hak Akses Menu Utama:
• /akuntansi/laporan/jurnal-umum (Audit Mutasi Jurnal & Analisis Jurnal)
• /akuntansi/data/rek-akuntansi (Daftar Bagan Akun COA)
• /dashboard-akunting (Grafik Tren Mutasi Debet vs Kredit)
• /sales & /sales-orders (Viewer Faktur Realisasi Penjualan Digit)
```

### Prosedur Operasional Akunting:

#### 1. Meninjau Buku Jurnal Umum (`/akuntansi/laporan/jurnal-umum`)
1. Buka menu **Akuntansi** $
ightarrow$ **Jurnal Umum**.
2. Gunakan filter tanggal transaksi atau filter akun rekening COA (contoh: akun kas `1101`).
3. Sistem menyajikan transaksi berpasangan (debet dan kredit) lengkap dengan nomor faktur bukti, uraian transaksi, dan username pencatat dari Digit.

#### 2. Menggunakan Fitur Modal "Analisis Jurnal"
1. Pada halaman Jurnal Umum, klik tombol hijau **`Analisis Jurnal`**.
2. Jendela modal interaktif akan terbuka:
   - Sistem secara otomatis menghitung *Running Balance* (Saldo Awal, Mutasi Berjalan, dan Saldo Akhir).
   - Menyajikan klasifikasi rekening Kas/Bank (*Arus Kas*) dan rekening Pendapatan/Biaya (*Laba Rugi Berjalan*).
3. **Ekspor Laporan ke Excel**: Klik tombol **`Ekspor Excel`** pada modal untuk mengunduh laporan mutasi akuntansi berformat `.xlsx` yang rapi dan siap dilaporkan ke Direksi.

#### 3. Pemantauan Dasbor Keuangan (`/dashboard-akunting`)
1. Buka menu **Dashboard Akunting** (`/dashboard-akunting`).
2. Pantau grafik batang **Akunting Trend Chart**: melihat komparasi volume perputaran Debet vs Kredit per bulan.
3. Periksa kartu peringatan **Barang Jadi**: melihat daftar faktur pesanan yang produk fisiknya sudah selesai diproduksi namun faktur pelunasannya belum tercatat.

---

## 8. PANDUAN ROLE: AKUN PENINJAUAN (DEMO & DEMO 2)

Peran **Demo** dan **Demo 2** disediakan khusus untuk kebutuhan audit eksternal, peninjauan calon mitra, atau manajemen yang hanya memerlukan akses baca (*read-only preview*) tanpa risiko merusak data:

- **Role Demo (6 Modul)**:
  - Diberikan akses peninjauan dokumen pengadaan bahan baku (`/purchase-orders`, `/rekap-pembelian-barang`), pemakaian bahan (`/bahan-baku`), serah terima barang jadi (`/barang-jadi`), dan penelusuran **Tracking Manufaktur** (`/tracking-manufaktur`).
  - Tidak memiliki akses mengubah data transaksi atau memicu scraper.
- **Role Demo 2 (2 Modul)**:
  - Diberikan akses peninjauan pemantauan kinerja pabrik di menu **Hasil Produksi** (`/hasil-produksi`) dan **Laporan Pekerjaan** (`/laporan-pekerjaan`).
  - Berfungsi mendemonstrasikan lembar kerja dan transparansi kerja antar-divisi.

---

## 9. SOP PENANGANAN KENDALA OPERASIONAL (FAQ & TROUBLESHOOTING)

### 1. Bagaimana jika operator lupa kata sandi login SINTAK?
- Hubungi pengguna dengan role **Super Admin**.
- Super Admin akan membuka menu `/users`, mencari username operator terkait, dan mengatur ulang kata sandi baru.

### 2. Mengapa bot Telegram menjawab "Akun Anda belum disetujui"?
- Ini terjadi jika operator baru saja mendaftar via Telegram (`/register`).
- Hubungi Super Admin kantor agar membuka menu `/settings/telegram-users` dan menekan tombol hijau **`Approve`** pada nama Anda.

### 3. Nomor order atau SPK tidak muncul saat ingin input JHP?
- Pastikan pesanan tersebut sudah diinput di ERP Digit.
- Jalankan sinkronisasi cepat di menu `/sync` atau hubungi Admin Penjadwalan untuk memastikan order tersebut sudah divalidasi di menu `/data/excel-sopd`.

### 4. Mengapa muncul peringatan "Tanggal terlalu jauh di masa lalu" pada bot Telegram?
- Sistem SINTAK menerapkan aturan integritas data: pelaporan realisasi lewat bot Telegram dibatasi maksimal **7 hari ke belakang**.
- Jika Anda perlu menginput data yang berumur lebih dari 7 hari lalu, hubungi **Admin Realisasi** di kantor untuk menginputkannya secara manual melalui antarmuka web komputer.

### 5. Apa yang harus dilakukan jika salah input lembar realisasi atau salah pilih nomor order?
- Segera lapor ke **Admin Realisasi** atau **Supervisor Produksi**.
- Admin dapat membuka menu `/jurnal-harian-produksi`, mencari baris entri yang salah, lalu menekan tombol **Edit** untuk mengoreksi angka atau catatan kendala.

---

> **Dokumen Resmi Manual Operasional SINTAK PT Buya Barokah**  
> Terakhir Diperbarui: Oktober 2026 | Tim Pelatihan & Operasional SINTAK
