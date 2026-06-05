# AI Session Summary

## Update Sesi — 2026-06-05

### Konteks Sesi
- Sesi pembersihan file tidak terpakai, file debug temporer di root, file database kosong/dummy, script pengecekan sekali pakai di folder `scripts/`, folder `tmp/`, dan folder kosong.

### Pekerjaan Sesi Ini
1. **Pembersihan File Root**:
   - Menghapus 15 file teks/json debug dan temporer di folder root (seperti `count_so.txt`, `debug_bom.json`, `temp.txt`, dll.).
2. **Pembersihan Database Dummy**:
   - Menghapus database kosong/tidak digunakan: `sikka.db` (tracked), `sintak.db` (ignored), dan `local.db` (ignored).
3. **Pembersihan Script & Folder scripts/**:
   - Menghapus 36 script check/debug eksperimental sekali pakai di folder `scripts/` (seperti `check_bom*.ts`, `debug_*.ts`, dll.). Script operasional utama tetap dipertahankan.
4. **Pembersihan Folder `tmp/` & Folder Kosong**:
   - Menghapus folder `tmp/` beserta seluruh script debug di dalamnya.
   - Menghapus folder kosong `src/app/tracking-designs`.
5. **Verifikasi Build**:
   - Melakukan verifikasi build sistem dengan `npm run build` dan dipastikan sukses 100%.

### Keputusan Teknis
- Modul **Master Barang** (`src/app/data-digit/stok/master-barang`) dipertahankan sepenuhnya karena merupakan modul fitur selesai resmi yang diimplementasikan pada sesi sebelumnya.

---

## Update Sesi — 2026-06-03

### Konteks Sesi
- Sesi diskusi penggunaan opencode, dilanjutkan dengan commit massal perubahan dari sesi sebelumnya (2026-05-20 s.d. 2026-06-03).

### Pekerjaan Sesi Ini
1. **Commit & Push 5 kelompok perubahan**:
   - `c20a2af` feat: modul Activity Log (halaman, filter, trend, export, dashboard card)
   - `3ae1fff` feat: refactor sidebar ke accordion + master pekerjaan jurnal produksi
   - `fb8a916` feat: progress bar interaktif premium untuk hapus log & export excel
   - `b6b9949` fix: permission fail-close, auth logging, DB schema migration 2.7, indexing
   - `3e9956b` chore: hapus stats module, update scrapers/dashboard/docs/scripts, bersihkan scratch & temp

2. **Pembersihan file**:
   - Dihapus: `scratch/` (debug files), `_temp_*.js`, `_sync_*.js`, `tmp_*` file temporer root
   - Ditambahkan pola ignore baru di `.gitignore` untuk file temporer

### Commit Sesi Ini
- `c20a2af` feat: modul Activity Log (halaman, filter, trend, export, dashboard card)
- `3ae1fff` feat: refactor sidebar ke accordion + master pekerjaan jurnal produksi
- `fb8a916` feat: progress bar interaktif premium untuk hapus log & export excel
- `b6b9949` fix: permission fail-close, auth logging, DB schema migration 2.7, indexing
- `3e9956b` chore: hapus stats module, update scrapers/dashboard/docs/scripts, bersihkan scratch & temp

### Catatan Lanjutan
- Semua perubahan dari sesi 2026-05-20 s.d. 2026-06-03 sudah di-commit dan di-push ke `origin/master`.
- File temporer/debug sudah dibersihkan.

---

## Update Sesi — 2026-05-20 (Malam)

### Konteks Sesi
- Sesi AI berfokus pada peningkatan User Experience (UX) saat pembersihan database/log aktivitas di Dashboard Umum dengan menyediakan indikator kemajuan (progress bar) yang interaktif, dinamis, dan premium.

### Pekerjaan Sesi Ini

1. **Simulasi Progres Cerdas (Smart Simulation Progress Bar)**:
   - Mengubah alur backend-blocking log deletion dan `VACUUM` di `ActivityTable.tsx` ke sistem progress bar dengan simulasi estimasi cerdas.
   - Menghitung progres secara adaptif dari 0% ke 98% selama proses Server Action berlangsung, membagi proses menjadi 5 fase informatif:
     - 0% - 15%: Menghubungkan ke database...
     - 15% - 40%: Menganalisis tabel dan mendeteksi entri usang...
     - 40% - 65%: Menghapus data log aktivitas lama...
     - 65% - 90%: Menjalankan perintah `VACUUM` (fase terberat dan terlama)...
     - 90% - 98%: Memperbarui indeks data & sinkronisasi state...
   - Saat Server Action sukses diselesaikan, progres langsung melompat ke 100% dengan status sukses sebelum menutup modal atau memuat layar hasil.

2. **Desain Layar Kemajuan Penuh Premium (Dedicated Progress Screen)**:
   - Mengganti seluruh tampilan modal body saat pembersihan aktif dengan layout khusus pembersihan (Dedicated Progress Screen).
   - Menyajikan visualisasi premium:
     - Ikon database berputar dinamis dengan lingkaran luar `animate-spin` gradasi rose dan efek `animate-ping` lembut di latar belakang.
     - Angka persentase progres monospaced tebal yang besar dan responsif.
     - Teks status dengan indikator dot berdenyut rose-glowing (berubah menjadi hijau emerald saat 100% selesai).
     - Bar progres bergradasi premium `from-rose-500 via-pink-500 to-rose-600` yang bergerak naik secara halus (berubah menjadi emerald-teal saat sukses).
     - **Pencatat Durasi Aktif (Timer)**: Penghitung waktu stopwatch berjalan (elapsed timer) dalam format desimal (detik) untuk memantau durasi optimasi database secara akurat.

3. **Keamanan & Resiliensi Aksi**:
   - Selama proses pembersihan aktif (`isCleaningUp = true`), tombol close modal (tanda silang X) dan klik backdrop dinonaktifkan secara total untuk mencegah interupsi database saat optimasi/VACUUM berjalan.

4. **Pembersihan Lint & Kepatuhan ESLint**:
   - Memperbaiki peringatan ESLint `react/no-unescaped-entities` di `ActivityTable.tsx` dengan mengganti tanda kutip ganda dalam teks JSX menjadi entitas HTML `&quot;`.

### Rekomendasi Commit Sesi Ini
- `xxxxxxx` feat: implementasi progress bar interaktif premium dengan dedicated progress screen, dynamic status, dan timer saat hapus log aktivitas

---

## Update Sesi — 2026-05-20 (Siang)

### Konteks Sesi
- Sesi AI berfokus pada implementasi modul "Master Pekerjaan Jurnal Produksi" untuk PT Buya Barokah, yang diadaptasi dari sheet `MASTER PEKERJAAN` pada berkas Excel `2026 JADWAL PRODUKSI HARIAN.xlsm`.

### Pekerjaan Sesi Ini

1. **Skema Database & Hak Akses (RBAC)**:
   - Membuat skema tabel `master_pekerjaan_jurnal_produksi` di `src/lib/schema.ts` dengan kolom `id` (INTEGER PRIMARY KEY), `category` (TEXT), dan `name` (TEXT UNIQUE) lengkap dengan trigger audit otomatis.
   - Mendaftarkan kunci permission baru `produksi_jhp_master_pekerjaan_jurnal_produksi` ke `src/lib/permissions-constants.ts` dan diintegrasikan ke control flow hak akses sidebar.
   - Menambahkan menu navigasi "Master Pekerjaan Jurnal Produksi" pada sidebar di bawah grup Jurnal Harian Produksi.

2. **Backend API Endpoints, Dekripsi Otomatis, & Smart Sync**:
   - Membuat REST API GET & POST di `src/app/api/master-pekerjaan-jurnal-produksi/route.ts` yang mendukung pencarian, filter bagian, pagination, serta sinkronisasi data impor dari Excel dengan pencatatan activity logs.
   - **Dekripsi Otomatis Server-Side**: Mengintegrasikan eksekusi tool `msoffcrypto-tool` di backend untuk mendeteksi apakah file Excel dilindungi sandi. Jika berkas terenkripsi, sistem **selalu** menuntut masukan password secara manual dari pengguna di UI dengan mengembalikan status HTTP 401 (`PASSWORD_REQUIRED`).
   - **Resolusi File-Locking & Validasi Berkas**: Sistem memverifikasi keberadaan dan ukuran berkas hasil dekripsi untuk mendeteksi kegagalan sandi secara akurat di Windows. Pembacaan berkas didelegasikan menggunakan buffer memori (`fs.promises.readFile` dan `XLSX.read`) guna menghindari konflik *file lock* oleh OS Windows. Jika sandi salah, API me-return status HTTP 401 dengan kode error `PASSWORD_INCORRECT`.
   - **Smart Sync (Sinkronisasi Cerdas)**: Alih-alih melakukan `DELETE FROM` kasar yang mereset ID baris tabel, sistem membandingkan data lama dan baru. Data yang tidak ada lagi di Excel dihapus secara presisi berdasarkan ID, sedangkan data lama yang masih ada dibiarkan utuh (`INSERT OR IGNORE`) untuk melindungi integritas referensial data Input JHP di masa mendatang.
   - Membuat API GET di `src/app/api/master-pekerjaan-jurnal-produksi/filters/route.ts` untuk memuat data kategori unik.
   - Menambahkan helper `getLastMasterPekerjaanJurnalProduksiImport` ke `src/lib/actions.ts`.

3. **Frontend Pages & Components**:
   - Halaman Server Page `src/app/jurnal-harian-produksi/data/master-pekerjaan-jurnal-produksi/page.tsx` dengan permission protection dan metadata data import terakhir.
   - Halaman Client Component `MasterPekerjaanJurnalProduksiClient.tsx` yang memfasilitasi grid data dengan custom column widths, filter Dropdown Bagian dinamis, search, reset, dan TableFooter paginasi.
   - Komponen Upload `MasterPekerjaanJurnalProduksiUpload.tsx` yang telah disederhanakan tanpa input field password inline. Jika backend API mengembalikan status 401 karena berkas terenkripsi, UI otomatis memicu **modal dialog popup** yang meminta pengguna memasukkan sandi dekripsi berkas, kemudian melakukan *retry* upload secara otomatis setelah pengguna menekan tombol "Kirim Sandi".

4. **Integrasi dengan Modul Utama Jurnal Harian Produksi (JHP)**:
   - **Sinkronisasi Form Dropdown**: Menghubungkan client form input `src/app/jurnal-harian-produksi/JurnalClient.tsx` langsung dengan backend `/api/master-pekerjaan-jurnal-produksi`, menggunakan `BAGIAN_CATEGORY_MAP` termutakhir yang mendukung pemetaan bagian `'MESIN'` -> `'Mesin'` dan `'SETTING'` -> `'Setting'`.
   - **Kustomisasi Urutan Tampilan JHP**: Menambahkan filter sorting SQL kustom pada API utama `src/app/api/jurnal-harian-produksi/route.ts` agar data transaksi Jurnal Harian Produksi terurut sempurna berdasarkan bagian: `Setting`, `Quality Control`, `Cetak`, `Finishing`, `Gudang`, `Teknisi`, `Mesin`.

5. **Verifikasi & Pembersihan Linting**:
   - Menjalankan migrasi database lokal dev (`init-db:dev`) dan default (`init-db`).
   - Melakukan perbaikan menyeluruh terhadap ESLint dan pengetikan tipe TypeScript di seluruh file baru sehingga 100% bebas dari warning/error.

6. **Penghapusan Fitur Statistik Performa (statistik)**:
   - Menghapus folder halaman `src/app/stats/` beserta seluruh file pendukung.
   - Menghapus referensi navigasi dari `src/components/Sidebar.tsx`.
   - Menghapus kunci izin dari pohon hak akses (`src/app/roles/RolesContent.tsx`), daftar konstanta permission (`src/lib/permissions-constants.ts` dan `src/lib/permissions.ts`), serta inisialisasi default database (`src/lib/schema.ts`).
   - Melakukan pembersihan impor tidak terpakai di `src/components/Sidebar.tsx`.

### Rekomendasi Commit Sesi Ini
- `xxxxxxx` refactor: hapus menyeluruh fitur Statistik Performa (halaman, routing, permission, navigasi, DB seed)
- `xxxxxxx` feat: tambah skema database dan permission master pekerjaan jurnal produksi
- `xxxxxxx` feat: implementasi backend API CRUD, filters, dan helper upload master pekerjaan jurnal produksi
- `xxxxxxx` feat: buat halaman frontend list data dengan menu sidebar master pekerjaan jurnal produksi
- `xxxxxxx` fix: pindahkan parsing Excel ke backend API & dekripsi otomatis menggunakan msoffcrypto-tool dengan sandi dinamis
- `xxxxxxx` fix: buat alur modal popup password dinamis saat upload Excel mendeteksi file terenkripsi
- `xxxxxxx` fix: selalu minta input sandi dari user secara manual jika file Excel terdeteksi terenkripsi
- `xxxxxxx` fix: optimasi pembacaan buffer file & deteksi kegagalan dekripsi msoffcrypto-tool untuk mencegah lock di Windows
- `xxxxxxx` fix: terapkan smart sync database update guna melindungi integritas ID baris untuk relasi input JHP
- `xxxxxxx` feat: hubungkan formulir input Jurnal Harian Produksi ke API Master Pekerjaan baru dan tambahkan kategori MESIN
- `xxxxxxx` fix: sesuaikan pengurutan SQL transaksi JHP sesuai urutan preferensi (Setting s.d. Mesin)
- `xxxxxxx` refactor: bersihkan eslint errors dan warning type casting pada modul master pekerjaan jurnal produksi

---

## Update Sesi — 2026-05-20 (Pagi)

### Konteks Sesi
- Sesi AI berfokus pada optimasi ekspor data Excel Jurnal Harian Produksi (JHP) bervolume tinggi (~168k baris) untuk seluruh database secara cepat dan hemat memori.

### Pekerjaan Sesi Ini

1. **Optimasi Ekspor Excel JHP Seluruh Data & Resolusi Kerusakan Berkas (Excel Warning)**:
   - Menghapus batasan parameter rentang tanggal pada ekspor di `JurnalClient.tsx` sehingga tombol "Export Excel" mengekspor seluruh data yang ada di database.
   - Refaktorisasi endpoint API ekspor di `src/app/api/export-jurnal/route.ts` menggunakan streaming `ExcelJS.stream.xlsx.WorkbookWriter` yang menulis ke berkas temporer di sistem operasi (`os.tmpdir()`), bukan di dalam memori heap. Ini meniadakan risiko heap overflow.
   - **Perbaikan Kerusakan File (Excel Repair Warning)**: Menambahkan utilitas `cleanNumberOrText` untuk membersihkan kolom dinamis (seperti `jml_plate`, `inscheet`, `rijek` yang bertipe real namun diizinkan berisi teks/paragraf). Hal ini mencegah nilai `NaN` (Not a Number) tertulis langsung ke sel tipe angka di berkas spreadsheet yang sebelumnya memicu peringatan kerusakan oleh Microsoft Excel.
   - **Ubah Nama Sheet**: Mengubah nama sheet utama menjadi `JURNAL`.
   - Memindahkan format styling kolom (terutama format Tanggal `dd/mm/yyyy`) ke tingkat definisi skema kolom (`sheet.columns`), meniadakan perulangan iterasi sel-demi-sel untuk menerapkan format yang sangat memakan CPU overhead.
   - Menjaga konsistensi penuh atas pengaturan tampilan aslinya: menyembunyikan gridlines, menyetel zoom level 80%, membekukan baris header 1–3 & kolom 1–4 (freeze panes), serta styling font Calibri 10pt bold pada baris header.
   - Mengintegrasikan penanganan berkas temporer secara aman dengan penghapusan asinkron pasca pembacaan respons, serta pembersihan sinkron jika eksekusi gagal di catch block.

2. **Indikator Kemajuan (Progress Bar) Interaktif Premium**:
   - Menambahkan status `exportProgress` dan `exportStatusText` pada `JurnalClient.tsx`.
   - Mengimplementasikan bar progres tersimulasi yang dinamis dengan estimasi status kerja yang realistis (menghubungkan database, membaca baris data, menulis workbook, hingga finalisasi).
   - Menyajikan modal overlay interaktif yang cantik dengan efek blur pada latar belakang (backdrop-blur), ikon spreadsheet yang berdenyut (animated pulse), gradasi warna hijau emerald/teal, serta indikator teks status real-time untuk meningkatkan pengalaman pengguna (UX) premium.

3. **Pilihan Filter Tahun & Nama File Dinamis**:
   - Menambahkan **Modal Pilih Tahun** sebelum proses ekspor dimulai. Modal ini menampilkan opsi untuk mengekspor "Semua Tahun" atau tahun spesifik.
   - Pilihan tahun di modal dimuat secara dinamis dengan melakukan query `SELECT DISTINCT substr(tgl, 1, 4)` langsung ke database melalui endpoint `/api/jurnal-harian-produksi/options`. Hal ini mencegah munculnya tahun kosong (seperti 2027) yang tidak memiliki data di database.
   - Mengintegrasikan komponen `<SearchableDropdown />` pada modal pilihan tahun sehingga pengguna dapat mengetik dan mencari tahun dengan cepat dan mudah (searchable).
   - Memodifikasi endpoint API `/api/export-jurnal` agar menerima parameter `year`. Jika tahun spesifik dipilih, data difilter secara efisien dengan indeks date range (`tgl BETWEEN 'tahun-01-01' AND 'tahun-12-31'`).
   - Menyesuaikan penamaan berkas unduhan (filename) secara dinamis:
     - Jika memilih "Semua Tahun": `JADWAL PRODUKSI HARIAN.xlsx`
     - Jika memilih tahun spesifik (misal 2026): `JADWAL PRODUKSI HARIAN 2026.xlsx`

### Hasil Kinerja (Benchmarking)
- Pembuatan Excel seluruh data (~168.362 baris) berhasil dipangkas dari **97,0 detik** (total 105s) menjadi **43,4 detik** (total 55s) dengan ukuran file yang sama (~20.2 MB).

### Rekomendasi Commit Sesi Ini
- `xxxxxxx` perf: optimasi export excel jurnal harian produksi dengan streaming WorkbookWriter
- `xxxxxxx` feat: tambah progress bar interaktif premium untuk ekspor excel
- `xxxxxxx` fix: selesaikan peringatan kerusakan excel (NaN fix), ubah nama file ke JADWAL PRODUKSI HARIAN, dan ubah sheet ke JURNAL
- `xxxxxxx` feat: implementasi pilihan tahun ekspor dinamis (searchable) berdasarkan data riil database

---

## Update Sesi — 2026-05-19 (Malam)

### Konteks Sesi
- Sesi AI berfokus pada fleksibilitas input Jurnal Harian Produksi, optimalisasi Trash JHP, dan analisis/pembersihan ukuran database.

### Pekerjaan Sesi Ini

1. **Dukungan Paragraf/Long Text JHP**:
   - Kolom `jml_plate`, `inscheet`, dan `rijek` di database SQLite (yang bertipe numerik/real) sekarang mendukung teks biasa dan paragraf.
   - Form input di `JurnalClient.tsx` untuk ketiga kolom tersebut diganti menjadi `<textarea rows={2} className="... resize-y min-h-[44px]" />` agar operator nyaman menulis penjelasan panjang/paragraf dengan baris baru.
   - Rendering sel di `JurnalClient.tsx` dan `HasilProduksiClient.tsx` menggunakan helper dinamis `formatCellVal` yang mendeteksi angka vs teks. Jika data berupa angka murni, data ditampilkan di sebelah kanan (`text-right`) dengan format desimal. Jika data berupa teks, data ditampilkan di sebelah kiri (`text-left`) dengan style `whitespace-pre-wrap` agar format baris baru terjaga.
   - API `POST`, `PUT`, dan Excel bulk upload di `src/app/api/jurnal-harian-produksi/route.ts` serta aggregate report di `src/app/api/hasil-produksi/details/route.ts` dioptimalkan dengan helper `cleanNumberOrText` dan parsing fallback `Number(val) || 0` agar kalkulasi total aman dari `NaN`.

2. **Fitur Select All Across Pages di Trash JHP**:
   - Diperkenalkan state `isSelectedAllTrash` pada `JurnalClient.tsx`.
   - Ketika super admin mencentang checkbox header di Trash, dan jumlah total trash lebih besar dari limit halaman (50 data), banner informatif akan muncul menawarkan opsi untuk memilih seluruh data terhapus di database.
   - Tombol restore & hapus permanen otomatis menyesuaikan label dan jumlah total data terpengaruh.
   - API endpoint `POST` dan `DELETE` di `src/app/api/jurnal-harian-produksi/trash/route.ts` diperbarui untuk menerima body `{ all: true }`, yang akan memproses restore/hard-delete untuk semua baris terhapus secara instan dengan satu query database yang cepat.

3. **Pembersihan Database & Optimalisasi Ruang Penyimpanan**:
   - Hasil analisis file `database.sqlite` (6.04 GB) dan `database_dev.sqlite` (4.49 GB) menunjukkan tabel `activity_logs` berisi jutaan baris (3.4M dan 2.9M baris) karena dipicu oleh triggers audit pada setiap insert/update/delete.
   - Dibuat script [scripts/cleanup-db.ts](file:///d:/repo%20github/sintak_pt_buya_barokah/scripts/cleanup-db.ts) untuk menghapus activity_logs yang lebih tua dari 7 hari dan menjalankan perintah `VACUUM`.
   - Script berhasil dijalankan dan sukses menghemat total **6.24 GB** ruang penyimpanan disk (menyusutkan `database_dev.sqlite` dari 4.49 GB ke 0.31 GB, dan `database.sqlite` dari 6.04 GB ke 4.12 GB).
   - Dibuat dokumen panduan pemeliharaan database di [docs/DATABASE_CLEANUP.md](file:///d:/repo%20github/sintak_pt_buya_barokah/docs/DATABASE_CLEANUP.md).

### Commit Sesi Ini
- `xxxxxxx` feat: ubah input Jml. Plate, Inscheet, dan Rijek ke textarea + perbaikan rendering whitespace
- `xxxxxxx` feat: implementasi fitur select all across pages pada trash JHP
- `xxxxxxx` feat: buat script cleanup-db.ts & panduan docs/DATABASE_CLEANUP.md untuk mengecilkan ukuran SQLite database

### Keputusan Teknis
- SQLite Dynamic Affinity dimanfaatkan untuk menyimpan string deskriptif ke kolom rijek/inscheet/jml_plate secara fleksibel tanpa mengubah tipe kolom SQLite.
- Restorasi dan penghapusan permanen bulk seluruh database diproses via API parameter `{ all: true }` agar operasi batch database berjalan cepat.
- Retensi log aktivitas disetel ke 7 hari secara default untuk mencegah disk space penuh akibat database triggers audit.

---

## Update Sesi — 2026-05-18 (Siang)

### Konteks Sesi
- Sesi AI berlanjut dari sesi 2026-05-17 (kantor).
- Fokus utama: Dashboard Akuntansi baru, perbaikan chart legend & label, RBAC fail-close, JHP warning fix.

### Pekerjaan Sesi Ini

1. **Dashboard Akuntansi (`dashboard-akunting/`)**:
   - Halaman baru `dashboard-akunting/page.tsx` dengan filter bulan, trend chart, warning card, dan jurnal terbaru.
   - `AkuntingTrendChart.tsx`: chart Laba/Rugi & Arus Kas kumulatif dengan Recharts.
   - `WarningBarangJadiCard.tsx`: warning harga mismatch penerimaan barang jadi (kumulatif s.d. tanggal).
   - `JurnalAkuntansiTerbaru.tsx`: log transaksi terbaru akuntansi dengan copy-to-clipboard.
   - API baru: `akunting-trend/route.ts`, `akunting-jurnal-terbaru/route.ts`, `barang-jadi-warning/route.ts`.
   - Sidebar & permission `akt_dashboard` ditambahkan.

2. **Perbaikan Chart Dashboard**:
   - Urutan legend trend chart Production & HRD disesuaikan dengan custom payload Recharts.
   - Label X-axis otomatis: tampilkan hari (format DD) untuk single-month, bulan (Mon YYYY) untuk multi-month.
   - Chart Laba/Rugi & Arus Kas diubah ke running cumulative total.

3. **Perbaikan Permission (fail-close)**:
   - `permissions.ts`: logika dari fail-open ke fail-close — akses hanya diberikan jika baris ada DAN `can_access = 1`.
   - Tambah routing `hrd_dashboard`, `produksi_dashboard`, `akt_dashboard` ke `MODULE_TO_ROUTE` agar redirect login benar.

4. **Perbaikan JHP Warning**:
   - `JurnalClient.tsx`: perbaiki kondisi warning "mengisi realisasi tanpa target" agar tidak muncul saat realisasi mengacu target valid.

5. **Copy-to-Clipboard Jurnal Umum**:
   - `JurnalUmumClient.tsx`: tombol salin username pada log transaksi jurnal umum.

6. **PM2 Deployment**:
   - `docs/PM2_DEPLOYMENT.md`: panduan lengkap deploy production dengan PM2 (port 3000 prod, 3001 dev).
   - `ecosystem.config.js`: konfigurasi PM2 untuk SINTAK production.

### Commit Sesi Ini
- `71ffcf3` feat: tambah modul Dashboard Akuntansi
- `b63fa41` fix: permission fail-close + routing dashboard
- `8e02358` feat: perbaikan trend chart dashboard
- `0c1638a` fix: warning JHP + copy-to-clipboard jurnal umum
- `3960ed1` docs: panduan PM2 deployment

### Keputusan Teknis
- **Permission fail-close**: role yang belum dikonfigurasi di DB → akses DITOLAK (tidak lagi fail-open).
- **Warning card kumulatif**: hitung mismatch dari awal historis s.d. tanggal terpilih (bukan interval relatif).
- **PM2 sebagai production server**: port 3000 untuk prod, port 3001 untuk dev — bisa berjalan bersamaan.

---

## Update Sesi — 2026-05-17 (Sore)

### Konteks Onboarding AI
- Sesi AI berikutnya wajib mengikuti `docs/AI_WORKFLOW.md` sebagai playbook utama.
- `docs/RESUME_SESSION.md` dan `docs/COMMIT_INSTRUCTION.md` sudah diarahkan agar konsisten dengan playbook tersebut.
- `docs/SCRAPING_FLOW.md` menjadi playbook awal untuk task scraping, import, sinkronisasi data, activity log, dan validasi cepat.
- Scraper utils dipusatkan ke `src/lib/scraper-utils.ts` agar tidak duplikasi di setiap route.

### Default Workflow Sesi Berikutnya
- Baca urutan wajib di `docs/AI_WORKFLOW.md` sebelum mengubah file.
- Sinkronkan repo dengan `git pull`, lalu cek `git status`.
- Gunakan `docs/task.md` untuk menentukan prioritas kerja setelah bacaan wajib selesai.
- Jika user sudah memberi izin eksplisit untuk lanjut langsung, eksekusi langkah aman tanpa meminta persetujuan berulang.
- Akhiri sesi dengan update dokumentasi relevan, lalu commit/push.

### Catatan Lanjutan
- Gunakan `docs/REPO_MAP.md` sebagai peta awal sebelum masuk ke aturan teknis detail.
- `scratch/` sudah masuk `.gitignore` — file debug tidak akan ikut commit.
- `src/lib/scraper-utils.ts` baru: helper untuk response scraping standar, gunakan di semua route scrape.
- `src/lib/api-utils.ts` baru: helper response API umum (sukses/error/not found).

---

## 📅 Detail Sesi Terbaru

### Sesi 2026-05-17 (Pagi — Fixing Redirect After Save)
- **Fokus**: Modul Pencatatan Kesalahan (Infractions) & Dashboard HRD
- **PC**: Lokal (Kantor)

### Sesi 2026-05-17 (Dini Hari — Cleaning Dashboard and Inventory)
- **Fokus**: Optimasi Jurnal Harian Produksi (JHP) + Dashboard Manufaktur
- **PC**: Lokal (Kantor)

---

## 🚀 Fitur & Perbaikan (Sesi 2026-05-16 s.d. 2026-05-17)

1. **Modul Infractions (Pencatatan Kesalahan) — HRD**:
   - Implementasi `dashboard-hrd/` dengan tab List & Form terintegrasi.
   - Komponen `RecordsTabs.tsx` untuk navigasi tab List ↔ Form.
   - Perbaikan `ConfirmDialog.tsx`: tombol "Tutup" kini trigger action callback + close secara konsisten.
   - Perbaikan validasi API `infractions/route.ts`: field `description` tidak lagi wajib diisi.
   - Penambahan API `export-infractions/` untuk export PDF/data pelanggaran.
   - Hook `useInfractionsData.ts` dan komponen `InfractionsTable.tsx` diperbarui.
   - Setelah simpan sukses, user otomatis diredirect ke tab List.

2. **Jurnal Harian Produksi (JHP) — Soft Delete & Optimasi**:
   - Implementasi sistem soft delete JHP dengan endpoint `jurnal-harian-produksi/trash/`.
   - Penambahan kolom audit `created_by`, `updated_by` langsung di tabel JHP (hapus dependency JOIN activity_logs).
   - Optimasi query dashboard: ganti JOIN dengan single-table scan berbasis timestamp.
   - Timestamp sekarang menampilkan detik; kolom activity diubah namanya untuk kejelasan.
   - Perbaikan React reconciliation error di `JurnalTerbaruCard.tsx`.

3. **Dashboard & Analytics**:
   - Komponen baru: `JurnalStatCard.tsx`, `OrdersStatCard.tsx`, `UsersStatCard.tsx` untuk dashboard utama.
   - Komponen baru: `JurnalTerbaruCard.tsx`, `ProduksiTrendChart.tsx` untuk dashboard manufaktur.
   - Komponen `StatCardDropdown.tsx` dan hook `useAutoRefresh.ts`.
   - API `dashboard/` baru dengan endpoint batch query untuk performa.
   - Komponen `LastUpdatedBadge.tsx` untuk badge status refresh.

4. **Standarisasi Scraping & API Utils**:
   - `src/lib/scraper-utils.ts`: helper response standar scraping (sukses, error, partial, dll).
   - `src/lib/api-utils.ts`: helper response API umum.
   - Seluruh route `scrape-*` diperbarui menggunakan helper dari `scraper-utils.ts`.
   - Schema `src/lib/schema.ts` diperbarui untuk kolom baru JHP.
   - Indexing DB `src/lib/db-indexing.ts` ditambah untuk performa query JHP.

5. **Komponen UI**:
   - `ScrapingHeader.tsx`: komponen header standar untuk halaman scraping.
   - `ActivityTable.tsx`, `DataTable.tsx`, `Sidebar.tsx`: penyesuaian minor.
   - `RecordsTabs.tsx`: tab baru untuk modul HRD.

6. **Permissions**:
   - `permissions-constants.ts` diperbarui dengan permission baru untuk modul infractions/HRD.
   - `src/lib/actions.ts` ditambah action untuk soft delete JHP.

---

## ⚙️ Keputusan Teknis Penting

- **Scraper-Utils Terpusat**: Semua route scraping wajib pakai helper dari `src/lib/scraper-utils.ts` agar response format konsisten.
- **Audit Column di Tabel JHP**: `created_by` dan `updated_by` kini ada langsung di tabel, bukan di-join dari `activity_logs`. Ini menghilangkan bottleneck query JOIN volume tinggi.
- **Soft Delete JHP**: Data jurnal yang dihapus masuk ke trash (soft delete), tidak langsung hilang. Endpoint `/trash` tersedia untuk recovery.
- **scratch/ di-ignore**: Semua file eksperimen/debug di `scratch/` tidak akan masuk repo.

---

## 📌 Status Task & Hal yang Perlu Dilanjutkan

- ✅ Modul Infractions (HRD) — Form, List, Redirect, Export PDF selesai.
- ✅ JHP Soft Delete + Audit Columns selesai.
- ✅ Dashboard Manufaktur & Utama diperbarui dengan komponen baru.
- ✅ Standarisasi scraping utils selesai.
- 📌 **Next**: Melanjutkan modernisasi desain premium pada modul Penjualan & Pembelian.
- 📌 **Next**: Eksplorasi fitur export laporan Excel dengan styling lebih kaya (exceljs).

---

## 📂 Dokumentasi Baru/Diperbarui

- New `docs/AI_WORKFLOW.md` — playbook utama sesi AI
- New `src/lib/scraper-utils.ts` — helper scraping terpusat
- New `src/lib/api-utils.ts` — helper response API
- Update `docs/AI_SESSION_SUMMARY.md` (file ini)
- Update `docs/task.md` (statistik & task baru)
- Update `.gitignore` (tambah `scratch/`)
