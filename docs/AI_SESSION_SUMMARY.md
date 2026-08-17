# AI Session Summary

## Update Sesi — 2026-08-17

### Konteks Sesi
- Perbaikan UI `/rekap-sales-order` + audit menyeluruh komponen portal (posisi panel popup di arsitektur zoom 80%) + pembaruan aturan changelog & dokumentasi konteks agent.

### Pekerjaan Sesi Ini

1. **Fix `/rekap-sales-order` — datepicker tertutup komponen lain**: kartu tanggal diberi `relative z-[60]` (pola `DateRangeCard`), popup kalender kini tampil di atas komponen lain.
2. **Fix panel Filter Harga** `/rekap-sales-order`: posisi panel meleset dari trigger → koordinat dibagi `getZoomScale()` + listener scroll/resize (pola `StatCardDropdown`).
3. **Audit portal** (diverifikasi empiris Chrome headless): `getBoundingClientRect()` mengembalikan koordinat **visual (post-zoom)**; offset `position: fixed` di dalam wrapper zoom ikut ter-skalakan; `inset: 0` tetap menutup penuh viewport.
4. **Fix `InlineDropdown`**: `createPortal` mentah ke body + koordinat dibagi scale → panel meleset ~22% di layar ber-zoom; diperbaiki dengan render lewat `<Portal>` (pola `StatCardDropdown`). Terpakai di dropdown baris draft Target JHP (`/jurnal-harian-produksi/target`).
5. **Aturan changelog diubah** (`AGENTS.md`): entry rilis baru **tidak** lagi mengganti entry lama — history rilis wajib dipertahankan (modal ✨ & `/log-perubahan` menampilkan semua rilis per halaman).
6. **Dokumentasi agent diperbarui**: tutorial baru `docs/tutorials/27-aturan-posisi-panel-portal-zoom.md`, `docs/REPO_MAP.md` & `docs/DEV_RULES.md` di-refresh.

### Rekap Kerja 24 Jul – 16 Agu 2026 (sejak ringkasan terakhir)

- **Laporan Pekerjaan** (`/laporan-pekerjaan`): modul lengkap — CRUD + audit logging, konversi data, cascade filter (Bagian/PIC/Status), status BELUM DIKERJAKAN, responsive mobile/tablet/laptop.
- **Pricelist Kalender** (`/pricelist`): upload & parser Excel (sheet HARGA), matriks perbandingan harga, filter `SquareDropdown`.
- **Hasil Produksi** (`/hasil-produksi`): smart dropdown shift, card target & quick sort, level 1 sync, indikator kolom aktif saat sort.
- **Sales** (`/sales`): kolom Faktur Prd & Kode Barang.
- **UI dropdown/datepicker**: unifikasi arsitektur alignment + guard sidebar laptop + ekstrak `SquareDropdown`; perbaikan hierarki z-index (modal > sidebar z-100 > nav z-80).
- **Log Aktivitas User** (`/data-digit/sistem/log-aktivitas-user`): simpan ke SQLite lokal, export Excel, persist lebar kolom, tombol Tarik Data.
- **Barang Jadi** (`/barang-jadi`): kolom Profit 30% + format HP Rata-rata 2 desimal.
- **Keamanan**: tutup celah RCE & auth, cron fail-closed, rate limit login, hapus webhook Fonnte; XSS — sel tabel hasil scraping dirender plain text + strip HTML detil lama.

### Keputusan Teknis Penting

- **Aturan posisi popup (zoom 80%)**: panel via `<Portal>` wajib `/getZoomScale()`; `createPortal` mentah ke body pakai koordinat mentah; kartu induk popup inline perlu `relative z-[60]`. Detail: tutorial 27.
- **Changelog multi-rilis**: entry lama dipertahankan, entry baru ditambahkan per rilis (bukan replace).
- **Hierarki z-index**: modals (z-300+) > sidebar (z-100) > nav buttons (z-80).

### File Kunci Sesi Ini
- `src/app/rekap-sales-order/RekapSalesOrderClient.tsx`, `src/components/InlineDropdown.tsx`, `src/lib/page-changelogs.ts`, `AGENTS.md`, `docs/REPO_MAP.md`, `docs/DEV_RULES.md`, `docs/tutorials/27-aturan-posisi-panel-portal-zoom.md`

### Backlog / Saran Berikutnya
- Verifikasi visual di browser: `/rekap-sales-order` (datepicker + panel filter), `/jurnal-harian-produksi/target` (dropdown draft).
- Konsistensi kosmetik tooltip (header `MainContentWrapper` & hasil-produksi) jika ingin konten ikut skala 82%.
- Implementasi prop `usePortal` yang belum diaktifkan di `DatePicker`.

---

## Update Sesi — 2026-07-23

### Konteks Sesi
- Audit performa project SINTAK + implementasi fix hot-path prioritas ROI (ponytail).
- Capture Obsidian: `SINTAK-ERP/Sessions/Session-2026-07-23-Performance-Audit.md`

### Pekerjaan Sesi Ini

1. **Audit performa** — bottleneck server/DB (session thrash, tracking JSON scan, barang-jadi subquery, prefetch JHP, payload `raw_data`), bukan React re-render.
2. **Session/permission**: `getSession` + `getMergedPermissions` di-wrap `React.cache()`.
3. **Activity log**: list tanpa `raw_data` (lazy `?logId=`), pageSize cap 200.
4. **Barang jadi**: JOIN pre-aggregate; warning dashboard 1 query + cache 2 menit.
5. **Tracking**: denorm `faktur_bom`/`faktur_so`/`faktur_pb` + index; scraper isi kolom; drop `raw_data LIKE`/`json_extract`.
6. **JHP prefetch**: limit 9999/5000 → 2000/500/200/300.
7. **List API**: `stripRawData()` di `api-utils` untuk modul utama (orders lift keys dulu).
8. **Dashboard cache**: summary 60s, aktivitas/jurnal 30s, produksi-trend 60s, JHP options 60s.

### Keputusan Teknis
- Denorm tracking keys saat scrape + one-shot backfill (`scripts/backfill-tracking-cols.mjs`).
- Strip blob di response JSON (bukan rewrite semua SELECT) — orders/sales-orders extract field UI dulu.
- Cache TTL pendek (30–120s) untuk dashboard; data transactional list tetap dynamic.

### File Kunci
- `src/lib/session.ts`, `permissions.ts`, `api-utils.ts`, `actions.ts`, `schema.ts`, `db-indexing.ts`
- `src/app/api/tracking/route.ts`, `barang-jadi/`, `dashboard/*`, `activity-log/`, list + scrape routes
- `JurnalClient.tsx`, `ActivityLogClient.tsx`
- `scripts/backfill-tracking-cols.mjs`

### Backlog Performa
- FTS unbounded `id IN`; export jurnal full-year; cron HTTP loopback
- `next/dynamic` chart/xlsx; soften `force-dynamic` page shell
- Denorm penuh kolom orders list (qty_order, spesifikasi, …)

---

## Update Sesi — 2026-06-24

### Konteks Sesi
- Sesi penutupan: Sidebar touch device fix, update .gitignore, dan dokumentasi.

### Pekerjaan Sesi Ini

1. **Fix: Sidebar hover pada touch device**:
   - Deteksi `pointer: coarse` via `window.matchMedia` di `Sidebar.tsx`.
   - Sidebar tidak lagi expand otomatis saat hover di perangkat sentuh.
   - Tombol toggle collapsed disembunyikan (opacity-0 + pointer-events-none) di touch device.

2. **Chore: Update .gitignore**:
   - Tambah ignore untuk direktori config AI/IDE: `.clinerules/`, `.cursor/`, `.windsurf/`, `.agents/`.

3. **Chore: Tambah script checkpoint-db**:
   - `scripts/checkpoint-db.ts` — script untuk checkpoint/WAL management database.

4. **Docs: Tutorial dan dokumentasi operasional**:
   - `docs/tutorials/` — folder tutorial per fitur.
   - Root docs: `AI_RULES.md`, `PANDUAN_OPERASIONAL.md`.
   - `.github/copilot-instructions.md` — instruksi untuk GitHub Copilot.
   - `.github/workflows/deploy.yml` — CI/CD deploy workflow.

### Keputusan Teknis
- AI/IDE config dirs tidak di-track ke repo — mesin lokal masing-masing.
- `docs/tutorials/` sebagai folder standar untuk tutorial step-by-step mandiri.

### File yang Diubah
- `src/components/Sidebar.tsx`
- `.gitignore`

### File Baru
- `.github/copilot-instructions.md`
- `.github/workflows/deploy.yml`
- `AI_RULES.md`
- `PANDUAN_OPERASIONAL.md`
- `scripts/checkpoint-db.ts`
- `docs/tutorials/`

### Sisa Pekerjaan / Backlog
- Evaluasi akurasi auto-generate jadwal dan iterasi algoritma pola historis.
- Finalisasi chart visualisasi Analisa Produksi.
- Setup backup database otomatis ke cloud storage.

---

## Update Sesi — 2026-06-25

### Konteks Sesi
- Implementasi fitur **status aktif/nonaktif user** (is_active).

### Pekerjaan Sesi Ini

1. **Feat: Status aktif/nonaktif user**:
   - **Schema**: Kolom `is_active INTEGER DEFAULT 1` di tabel `users`, ditambahkan via migration otomatis.
   - **Login block**: Auth (`auth.ts`) cek `is_active` — user nonaktif ditolak login dengan pesan "Akun Anda dinonaktifkan. Hubungi Super Admin."
   - **Session guard**: `getSession()` (`session.ts`) validasi `is_active` — user nonaktif dianggap tidak login (session null).
   - **UI UserFormModal**: Toggle switch aktif/nonaktif saat edit user, dinonaktifkan untuk akun sendiri.
   - **UI UsersContent**: Kolom Status dengan toggle switch langsung di tabel, filter dropdown (Aktif/Nonaktif/Semua).
   - **Backend**: `updateUser()` validasi prevent self-deactivation, update kolom `is_active`.
   - **Chore**: Tambah `*.zip` ke `.gitignore`.

### Keputusan Teknis
- User nonaktif langsung ditolak login dan session di-invalidate — tidak perlu logout manual dari sisi admin.
- Toggle di tabel untuk operasi cepat; toggle di modal untuk konteks edit penuh.
- `is_active` default 1 (aktif) — migration aman untuk user eksisting.

### File yang Diubah
- `src/lib/schema.ts`
- `src/lib/auth.ts`
- `src/lib/session.ts`
- `src/lib/users.ts`
- `src/app/users/UserFormModal.tsx`
- `src/app/users/UsersContent.tsx`
- `.gitignore`

### Sisa Pekerjaan / Backlog
- Evaluasi akurasi auto-generate jadwal dan iterasi algoritma pola historis.
- Finalisasi chart visualisasi Analisa Produksi.
- Setup backup database otomatis ke cloud storage.

---

## Update Sesi — 2026-06-23

### Konteks Sesi
- Sesi perbaikan multi-modul: sorting, filter, dan UI enhancement pada JHP, SOPD, Target, dan modul stok.

### Pekerjaan Sesi Ini

1. **Feat: Cek Karyawan Modal (JHP)**:
   - API `/api/jurnal-harian-produksi/cek-karyawan`: dua query batch — karyawan belum/belum dapat pekerjaan dalam rentang tanggal.
   - Modal "Cek Karyawan" di toolbar JHP: tab Belum (nama+jabatan) dan Sudah (tabel detail pekerjaan per karyawan), search, load more.
   - Tombol "Cek Karyawan" (violet) di toolbar.
   - Tombol "Reset Sort" (amber) muncul hanya saat ada sorting aktif.

2. **Feat: Server-side Sorting Multi-Modul**:
   - JHP (JurnalClient.tsx): sorting state + `sort` param di fetch, `manualSorting` di DataTable.
   - SOPD (sudah ada dari sesi sebelumnya).
   - Bahan Baku, Barang Jadi, BOM, Jurnal Umum: masing-masing tambah `sorting` state, `sort` param, dan `manualSorting` di DataTable.

3. **Feat: SOPD Kolom Produk + Filter Produksi Selesai**:
   - Kolom baru `produk` di tabel SOPD (lebar 350px).
   - Filter toggle "Semua" / "Selesai" / "Belum Selesai" untuk `is_produksi_selesai`.
   - API `sopd/route.ts`: terima parameter `produksiSelesai`.

4. **Feat: Target Page Sort by Tanggal Order**:
   - Toggle sort "Tgl Order" — urutkan data berdasarkan tanggal order (via tglOnly API).
   - Module-level cache `_tglOrderMap` agar fetch hanya sekali per session.
   - Sort default: bagian → koordinasi → absensi → id tetap dipertahankan.

5. **Feat: DateRangeCard Compact Mode**:
   - Prop `compact` — layout lebih padat (padding kecil, DatePicker 120px, tombol minimal).
   - Digunakan di SOPD modul.

6. **Feat: persistScraperPeriodFull + System-settings API**:
   - Fungsi baru `persistScraperPeriodFull(dbKey, startDate, endDate)` di `scraper-period.ts` — simpan period total ke tabel `system_settings` via POST API.
   - API `/api/system-settings`: POST upsert key-value.
   - Integrasi di Order Produksi, Pelunasan Hutang, Pelunasan Piutang, Produksi Selesai.

7. **Fix: Produksi Selesai trim nama_prd**:
   - Scraper: tambah `.trim()` pada `r.nama_prd`.
   - Schema migrasi: `UPDATE produksi_selesai SET nama_prd = TRIM(nama_prd)`.
   - API: simplifikasi parsing scrapedPeriod.
   - Client: hapus import `ScrapedPeriod` yang tidak dipakai.

8. **Chore: DB Indexing + Schema**:
   - Index `idx_sopd_tgl_iso` dan `idx_sopd_tgl` untuk query tanggal SOPD.
   - Migrasi kolom `nama_order_manual` & `nama_order_manual_2` di JHP.
   - Hapus `scrapedPeriod` dari state client di SOPD & Produksi Selesai (tidak perlu render).

### Keputusan Teknis
- Module-level cache `_tglOrderMap` untuk Target page — stale hanya jika ada upload SOPD baru.
- `persistScraperPeriodFull` bersifat fire-and-forget (silent fail) — UI jalan tanpa period DB.
- SOPD reset ke halaman 1 setiap kali filter tanggal atau produksi berubah.

### File yang Diubah
- `src/app/jurnal-harian-produksi/JurnalClient.tsx`
- `src/app/jurnal-harian-produksi/data/excel-sopd/SopdClient.tsx`
- `src/app/jurnal-harian-produksi/target/TargetClient.tsx`
- `src/app/bahan-baku/BahanBakuClient.tsx`
- `src/app/barang-jadi/BarangJadiClient.tsx`
- `src/app/bom/BOMClient.tsx`
- `src/app/akuntansi/laporan/jurnal-umum/JurnalUmumClient.tsx`
- `src/app/api/sopd/route.ts`
- `src/app/api/produksi-selesai/route.ts`
- `src/app/api/scrape-produksi-selesai/route.ts`
- `src/components/DateRangeCard.tsx`
- `src/lib/scraper-period.ts`
- `src/lib/db-indexing.ts`
- `src/lib/schema.ts`
- `src/app/pelunasan-hutang/PelunasanHutangClient.tsx`
- `src/app/pelunasan-piutang/PelunasanPiutangClient.tsx`
- `src/app/orders/OrderProduksiClient.tsx`
- `src/app/data-digit/produksi/produksi-selesai/ProduksiSelesaiClient.tsx`

### File Baru
- `src/app/api/jurnal-harian-produksi/cek-karyawan/route.ts`
- `src/app/api/system-settings/route.ts`
- `docs/COMMIT_INSTRUCTION.md`
- `docs/RESUME_SESSION.md`

### Sisa Pekerjaan / Backlog
- Evaluasi akurasi auto-generate jadwal dan iterasi algoritma pola historis.
- Finalisasi chart visualisasi Analisa Produksi.
- Setup backup database otomatis ke cloud storage.

---

## Update Sesi — 2026-06-20

### Konteks Sesi
- Implementasi fitur **multiple role per user** pada halaman Kelola User.
- Lanjutan: Modul **Produksi Selesai**, **Pending Produksi SOPD**, **UI JHP Compact**, **Activity Log diff**, **Scraper Master Barang**.

### Pekerjaan Sesi Ini

#### Multiple Role per User (Commit Terpisah)

1. **Database: Tabel junction `user_roles`** (`src/lib/schema.ts`)
   - Tambah `CREATE TABLE IF NOT EXISTS user_roles` dengan FK cascade.
   - Migrasi otomatis backfill dari `users.role` ke `user_roles`.
   - Tambah `user_roles` ke `EXCLUDED_TABLES`.

2. **Session & Auth** (`src/lib/session.ts`, `src/lib/auth.ts`)
   - `SessionPayload` punya `roles: string[]` + `role` (backward-compat).
   - Login baca semua role dari `user_roles`, validasi ke `app_roles`.

3. **Permissions** (`src/lib/permissions.ts`, `src/lib/permissions-actions.ts`, `src/lib/activity-log-permissions.ts`)
   - `getMergedPermissions(roles[])`: union/OR semua permissions.
   - `updateRole`/`deleteRole` adjust `user_roles` + `users.role`.
   - Activity log permissions support `string | string[]`.

4. **UI Users** (`UserFormModal.tsx`, `UsersContent.tsx`)
   - Multi-select checkbox dropdown dengan badge removable.
   - Kolom "Jabatan / Peran" menampilkan multiple badge.
   - Filter & search mencakup semua role.

5. **Layout & Sidebar** (`layout.tsx`, `Sidebar.tsx`, `MainContentWrapper.tsx`)
   - Sidebar pakai `getMergedPermissions(roles[])`.
   - Sidebar profil tampilkan semua role.

6. **Bugfix ProduksiSelesaiClient.tsx** — Union type dialog fix.

#### Modul Produksi Selesai

7. **Modul Baru: Produksi Selesai**
   - Halaman `src/app/data-digit/produksi/produksi-selesai/page.tsx`
   - Komponen `ProduksiSelesaiClient.tsx`
   - API `src/app/api/produksi-selesai/route.ts`
   - Scraper `src/app/api/scrape-produksi-selesai/route.ts`
   - Permission `produksi_selesai` di MODULE_REGISTRY

#### SOPD — Pending Produksi & Sorting

8. **Kolom Pending Produksi SOPD** (`sopd/route.ts`, `SopdClient.tsx`)
   - Field baru `pending_produksi` (checkbox) + `alasan_pending` (editable text).
   - PATCH endpoint untuk update individual field.
   - Auto-generate draft JHP filter: skip order dengan `pending_produksi = 1`.

9. **Unified SOPD + Orders Query** (`sopd/route.ts`)
   - UNION ALL query untuk data SOPD (≤2024) + Orders (semua tahun).
   - Simplified lastUpdated display (timestamp terbaru dari kedua sumber).

10. **Sorting SOPD** (`SopdClient.tsx`, `DataTable.tsx`, `sopd/route.ts`)
    - `SortingState` + sort params di API SOPD.
    - DataTable: prop `manualSorting` untuk server-side sort.

#### UI JHP — Compact Filter Bar

11. **Redesain Filter Bar JHP** (`JurnalClient.tsx`)
    - Layout lebih ringkas: custom DatePicker triggers, divider, inline status.
    - SearchAndReload compact di kanan, action buttons streamlined.
    - Subtotal bar & contextual bulk actions tetap responsif.

#### Komponen & Perbaikan

12. **SearchAndReload compact mode** (`SearchAndReload.tsx`)
    - Prop `compact` untuk tinggi 32px, teks lebih kecil.

13. **Activity Log Diff** (`ActivityLogClient.tsx`)
    - Tabel `table-fixed` dengan kolom proporsional (30/35/35).
    - Warna before=rose, after=emerald untuk diff readability.

14. **Scraper Master Barang** (`scrape-master-barang/route.ts`)
    - Multi-row VALUES chunk 200 records + Promise.all paralel.
    - Hapus `raw_data` dari storage untuk hemat ruang.
    - Tambah activity log otomatis setelah scrape.

### Keputusan Teknis
- Kolom `users.role` tetap ada dan disinkronkan ke role "utama" — backward-compat.
- Permissions menggunakan union (OR) — akses jika salah satu role punya akses.
- Scraper master barang pakai multi-row VALUES + paralel untuk throughput tinggi.
- `pending_produksi` filter di auto-generate draft cegah order pending masuk jadwal.

### File yang Diubah (Sesi Ini — Multiple Role)
- `src/lib/schema.ts`, `src/lib/session.ts`, `src/lib/permissions.ts`
- `src/lib/permissions-actions.ts`, `src/lib/activity-log-permissions.ts`
- `src/lib/users.ts`, `src/lib/auth.ts`, `src/lib/actions.ts`
- `src/app/page.tsx`, `src/app/layout.tsx`
- `src/app/users/page.tsx`, `src/app/users/UsersContent.tsx`, `src/app/users/UserFormModal.tsx`
- `src/components/Sidebar.tsx`, `src/components/MainContentWrapper.tsx`

### File Baru (Sesi Ini — Produksi Selesai)
- `src/app/data-digit/produksi/produksi-selesai/page.tsx`
- `src/app/data-digit/produksi/produksi-selesai/ProduksiSelesaiClient.tsx`
- `src/app/api/produksi-selesai/route.ts`
- `src/app/api/scrape-produksi-selesai/route.ts`

### File Diubah (Sesi Ini — Fitur Lain)
- `src/app/api/sopd/route.ts`
- `src/app/api/scrape-master-barang/route.ts`
- `src/app/api/jurnal-harian-produksi/auto-generate/draft/route.ts`
- `src/app/jurnal-harian-produksi/JurnalClient.tsx`
- `src/app/jurnal-harian-produksi/data/excel-sopd/SopdClient.tsx`
- `src/app/log-aktivitas/ActivityLogClient.tsx`
- `src/components/SearchAndReload.tsx`
- `src/components/ui/DataTable.tsx`
- `src/lib/permissions-constants.ts`
- `.gitignore`

### Sisa Pekerjaan / Backlog
- Evaluasi akurasi auto-generate jadwal dan iterasi algoritma pola historis.
- Finalisasi chart visualisasi Analisa Produksi.
- Setup backup database otomatis ke cloud storage.

---



### Konteks Sesi
- Sesi perbaikan bug, peningkatan UX, dan fitur baru pada modul Jurnal Harian Produksi (JHP).

### Pekerjaan Sesi Ini

1. **Fix: Tombol Copy Jadwal tidak berubah status setelah copy**
   - Logika `hasCopiedToday` di GET `/api/jurnal-harian-produksi/copy-jadwal` diubah dari cek `raw_data LIKE '{"from":"today"...'` (yang tidak pernah match karena modal sudah fleksibel) menjadi cek `DATE(created_at) = hari_ini`.
   - Sekarang: kalau hari ini sudah ada `COPY_JADWAL` (apapun from/to-nya dan belum di-revert), tombol copy berubah jadi info "Jadwal hari ini sudah disalin".
   - `canRevert` tetap global (tidak terbatas hari ini) — tombol revert muncul selama ada copy aktif belum di-revert.
   - Parameter `today` di URL dihapus dari requirement (tidak lagi dipakai di server).

2. **Fix: Field `keterangan` tidak tersimpan saat input realisasi**
   - `keterangan` ditambahkan ke `REALISASI_FIELDS` di `performSave` (`JurnalClient.tsx`).

3. **Fix: Field `keterangan` tidak tersimpan di baris pertama multi-realisasi**
   - Query `UPDATE` baris pertama di handler `input_multi_realisasi` (`route.ts`) ditambahkan `keterangan = ?` dengan nilai dari `baseData.keterangan`.

4. **Feat: Editable cell untuk kolom Keterangan di tabel daftar JHP**
   - Komponen baru `KeteranganEditableCell` di `JurnalClient.tsx`: double-click untuk edit, Enter/Escape untuk konfirmasi/batal, klik luar otomatis save, single-wrapper return (mencegah React `insertBefore` error).
   - Handler `handleSaveKeterangan`: memanggil `PUT /api/jurnal-harian-produksi` dengan `{ id, updated_at, keterangan }` — `updated_at` diambil dari state lokal untuk optimistic concurrency check.
   - Mode paste: klik ikon Copy → semua cell lain berubah ke mode paste dengan ikon clipboard hijau. Paste berkali-kali, keluar via tombol "Stop Copy (Esc)" atau tekan Escape. State: `keteranganPasteActive`, `keteranganCopiedValue`.

5. **Fix: Activity log PUT format before/after**
   - `raw_data` di activity log UPDATE sekarang menyimpan `{ before: {...}, after: {...} }` — dikenali oleh `computeExplicitDiff` di halaman log aktivitas untuk menampilkan diff yang jelas.
   - Query `rowAfter` dan insert log dipindahkan ke dalam blok `if (updateParts.length > 0)` — log hanya ditulis kalau benar-benar ada field yang diupdate (tidak ada lagi log noise).

### Keputusan Teknis
- `hasCopiedToday` berbasis `DATE(created_at)` (hari ini, lokal DB) bukan per tanggal jadwal — sesuai kebutuhan operasional: satu kali copy per hari sudah cukup.
- Editable cell keterangan pakai single-return pattern (semua kondisi dalam satu `<div>` wrapper) untuk menghindari React DOM reconciliation error di dalam tabel.
- `handleSaveKeterangan` meneruskan `updated_at` dari state lokal ke payload PUT — concurrency guard aktif sama seperti save via form utama.
- Activity log format `{ before, after }` dipilih karena langsung dikenali `computeExplicitDiff` di `activity-log-utils.ts` tanpa perlu perubahan di halaman log.

### File yang Diubah
- `src/app/jurnal-harian-produksi/JurnalClient.tsx`
- `src/app/api/jurnal-harian-produksi/route.ts`
- `src/app/api/jurnal-harian-produksi/copy-jadwal/route.ts`

### Sisa Pekerjaan / Backlog
- Error `insertBefore` di console masih perlu diverifikasi apakah dari browser extension atau dari kode lain (bukan dari `KeteranganEditableCell` yang sudah difix).
- Evaluasi akurasi hasil auto-generate jadwal dan iterasi algoritma pola historis.
- Finalisasi visualisasi chart di halaman Analisa Produksi.

---



### Konteks Sesi
- Sesi implementasi 3 fitur baru pada modul Jurnal Harian Produksi (JHP): Auto-Generate Jadwal, Analisa Produksi, dan Revert Copy Jadwal. Ditambah beberapa perbaikan kecil.

### Pekerjaan Sesi Ini

1. **Feat: Auto-Generate Jadwal Produksi dari Pola Historis**:
   - API `/api/jurnal-harian-produksi/auto-generate/draft`: analisis pola 7 hari terakhir, deteksi tanggal kosong terdekat, kembalikan draft baris jadwal dengan metadata (`sourceDate`, `resolvedDate`, `mode`, `meta`).
   - API `/api/jurnal-harian-produksi/auto-generate/save`: simpan draft ke tabel JHP, dukung flag `append` saat tanggal sudah ada data.
   - API `/api/jurnal-harian-produksi/auto-generate/scrape`: trigger scrape orders + barang jadi bulan berjalan sebelum generate.
   - Komponen `AutoGenerateModal`: modal 2 fase — fase 1 progress bar scraping (orders + barang jadi + analisis), fase 2 tabel draft editable dengan rekap order & pekerjaan. Support Jumat/lembur, append confirm, feedback per baris.
   - Komponen `DraftRowItem`: baris tabel draft dengan `InlineDropdown` untuk bagian/shift/karyawan/order/pekerjaan, tombol sisipkan/hapus/feedback, sub-row feedback.
   - Komponen `InlineDropdown`: dropdown ringan searchable + freeInput via `createPortal`, kalkulasi posisi fixed agar tidak terpotong overflow, keyboard navigation.
   - `TargetClient.tsx`: tombol "Generate Jadwal" di header dan di empty state, `targetDate` = hari berikutnya.

2. **Feat: Modul Analisa Produksi JHP**:
   - API `/api/jurnal-harian-produksi/analisa`: agregasi data produksi per karyawan, bagian, order dalam rentang tanggal.
   - Halaman `/jurnal-harian-produksi/analisa` + `AnalisaClient.tsx` dengan filter tanggal dan tabel rekap.
   - Permission baru `produksi_jhp_analisa` di `MODULE_REGISTRY`.
   - Menu "Analisa Produksi" di Sidebar grup Produksi, guard `canAccess('produksi_jhp_analisa')`.

3. **Feat: Revert Copy Jadwal**:
   - API POST `/api/jurnal-harian-produksi/copy-jadwal/revert`: soft delete semua data JHP yang dicopy berdasarkan `COPY_JADWAL` activity log terbaru.
   - GET `/api/jurnal-harian-produksi/copy-jadwal`: tambah field `canRevert` — true jika `COPY_JADWAL` terbaru belum di-revert (bandingkan `id DESC` antara `COPY_JADWAL` dan `REVERT_COPY_JADWAL`).
   - `JurnalClient.tsx`: tambah handler `handleRevertCopyJadwal`, tombol revert dengan `ConfirmDialog`, prop `userRole` dari `page.tsx`.

4. **Fix & Misc**:
   - API `/api/permissions/check-activity-log`: endpoint baru, cek permission `activity_log_view` dari sesi server-side.
   - `ViewActivityLogLink.tsx`: fetch check-activity-log saat mount, sembunyikan link jika tidak punya akses (fail-close).
   - `orders-count/route.ts`: fix format tanggal `DD/MM/YYYY` → `DD-MM-YYYY` agar cocok dengan format kolom database.
   - `schema.ts`: tambah tabel `generate_feedback` untuk menyimpan koreksi user saat review draft (bahan belajar sistem ke depan).
   - `docs/AUTO_GENERATE_JADWAL.md`: update jawaban 12 pertanyaan perencanaan dari masukan user.

### Keputusan Teknis
- Draft auto-generate tidak langsung disimpan — wajib review di modal sebelum klik simpan.
- `resolvedDate` dari API draft: jika tanggal target sudah ada data, sistem otomatis geser ke hari kosong terdekat.
- `generate_feedback` disimpan sebagai bahan iterasi algoritma, belum digunakan untuk training otomatis.
- `InlineDropdown` pakai `createPortal` ke `document.body` (bukan Portal.tsx) agar bisa digunakan di dalam tabel tanpa overhead komponen terpisah.
- Revert copy jadwal bersifat soft delete (set `deleted_at`) — data masih bisa dipulihkan dari trash.
- `canRevert` di GET copy-jadwal tidak membatasi per tanggal — berlaku untuk copy jadwal terakhir kapan pun.

### Commit Sesi Ini
- `890bb6a` feat: auto-generate jadwal produksi dari pola historis
- `562dc43` feat: modul Analisa Produksi JHP
- `a795972` feat: revert copy jadwal dan deteksi status canRevert
- `9138ad6` fix: permission check activity log, format tanggal orders-count, schema feedback, pass userRole ke JurnalClient

### Sisa Pekerjaan / Backlog
- Evaluasi akurasi hasil generate dan iterasi algoritma pola historis.
- Finalisasi visualisasi chart di halaman Analisa Produksi.
- Tabel `generate_feedback` sudah ada di schema — belum ada alur simpan otomatis dari modal saat koreksi.

---

## Update Sesi — 2026-06-12

### Konteks Sesi
- Sesi perbaikan bug dan optimasi pada halaman Jadwal Produksi Harian (target) dan Export JHP Excel.

### Pekerjaan Sesi Ini
1. **Fix: Race Condition Fetch Data Target Page**:
   - `TargetClient.tsx`: ubah initial `loading=false` → `true` agar tidak flash "Tidak Ada Data".
   - Tambah `fetchIdRef` + stale response guard di `fetchData`. Dua fetch concurrent (hari ini vs tanggal URL) tidak lagi saling overwrite.
   - Hasil: navigasi ke `?date=YYYY-MM-DD` langsung tampil data tanpa refresh.

2. **Fix: Auto-reset Tanggal Saat Hari Berganti**:
   - `TargetClient.tsx`: di hydration effect, cek `store.dateTag !== new Date().toDateString()`.
   - Jika hari berbeda → reset ke `getTodayStr()`. Jika hari sama → pertahankan pilihan user.
   - Hasil: logout/login di hari yang sama tidak reset tanggal, tapi besok buka halaman otomatis kembali ke hari ini.

3. **Feat: UI Empty State Baru + Tombol Aksi**:
   - `TargetClient.tsx`: hapus `opacity-30` dan `uppercase`, ganti dengan card putih `rounded-2xl` `shadow-sm`, icon emerald, tampilkan `formatIndoDate(dateStr)`.
   - Tambah tombol "Pilih Tanggal Lain" (buka DatePicker) dan "Muat Ulang" (refresh data).

4. **Fix: Tombol Pilih Tanggal Lain**:
   - `DatePicker.tsx`: tambah atribut `data-date-picker-trigger={name}` di trigger div.
   - `TargetClient.tsx`: query `[data-date-picker-trigger="filter_date"]` untuk klik trigger DatePicker.

5. **Perf: Dual Database Connection untuk Export**:
   - File baru `src/lib/db-export.ts`: koneksi SQLite kedua via `createClient()` terpisah.
   - `export-jurnal/route.ts`: ganti `import db from '@/lib/db'` → `import db from '@/lib/db-export'`.
   - Hasil: export Excel gak ngeblock halaman lain (WAL mode, concurrent readers).

6. **Fix: Pesan Export Dinamis**:
   - `JurnalClient.tsx`: tambah state `yearsCount`, simpan dari `/api/jurnal-harian-produksi/options`.
   - Teks overlay `"Sedang memproses seluruh database jurnal (~168k baris)"` diganti dengan estimasi real sesuai tahun terpilih.
   - Pesan progress bar dan modal deskripsi export juga dinamis.

### Keputusan Teknis
- `db-export.ts` adalah koneksi read-only terpisah, tanpa wrapper session logging — karena export cuma query SELECT.
- Empty state tidak lagi menggunakan `uppercase` sesuai aturan `AGENTS.md`.
- DatePicker difasilitasi dengan data attribute untuk akses dari luar komponen (tanpa ref forwarding).

### Dokumentasi Baru
- `docs/AUTO_GENERATE_JADWAL.md` — dokumen perencanaan fitur auto-generate jadwal produksi harian, berisi 12 pertanyaan untuk menentukan kebutuhan fitur.

### Sisa Pekerjaan / Backlog
- Fitur Auto-Generate Jadwal Produksi Harian menunggu jawaban dari 12 pertanyaan di `docs/AUTO_GENERATE_JADWAL.md`.

---

## Update Sesi — 2026-06-11

### Konteks Sesi
- Sesi finalisasi dan commit perubahan dari 17 file source code yang mencakup berbagai fitur dan refaktor.

### Pekerjaan Sesi Ini
1. **Refactor Unified Date Store**:
   - Migrasi `JurnalUmumClient`, `HasilProduksiClient`, `JurnalClient`, `TrackingClient` dari raw `localStorage` ke `persistDateStore`/`hydrateDateStore` di `scraper-period.ts`.
   - Menambahkan `getDefaultScraperDateRange` fix: hapus `setMonth -1` agar default range hanya hari ini, bukan 1 bulan.

2. **Feat: Copy Jadwal Multi-Select**:
   - Copy modal sekarang support pilih banyak bagian & karyawan sekaligus (array-based).
   - API `copy-jadwal/route.ts` menerima array `bagian` & `namaKaryawan` dengan `IN(...)` clause.

3. **Feat: Koordinasi Group Sort**:
   - Sorting JHP menggunakan `MIN(CASE ...) OVER (PARTITION BY tgl, nama_karyawan)` agar semua entry karyawan yg punya Koordinasi dikelompokkan duluan.
   - Diterapkan di API JHP, export-jurnal, dan sort client-side TargetClient.
   - Drop & recreate `idx_jurnal_main` tanpa expression index window function; tambah `idx_jurnal_tgl_karyawan_pekerjaan`.

4. **Feat: URL Sync Target Page**:
   - `TargetClient` menggunakan `useSearchParams` untuk persist date di URL (bukan cuma localStorage).
   - Module-level cache (`_cachedDate`) menghindari flash saat navigasi balik.
   - `target/page.tsx` dibungkus `Suspense` untuk kompatibilitas `useSearchParams`.

5. **Feat: Employee Table Sorting**:
   - `DataTable.tsx` menerima controlled `sorting` + `onSortingChange` props.
   - `EmployeeTable.tsx` mengirim state sorting ke API.
   - `employees/route.ts` menerima `sortBy`/`sortDir` params (whitelist kolom yang aman).

6. **Feat: DateRangeCard Scraper Persist**:
   - `DateRangeCard.tsx` jadi `'use client'` dan auto-persist scraper period via `PATH_MAP` ke localStorage.

7. **Feat: JHP Options API Refactor**:
   - Bagian dropdown kini dari `master_pekerjaan_jurnal_produksi`, karyawan dari `employees` table.
   - Tambah `yearsCount`, `karyawanByBagian`, dan in-memory cache (TTL 10 detik).

8. **Chore & Cleanup**:
   - Hapus `.agents/workflows/dev-with-timestamp.md`.
   - Hapus `_copy_dev_temp.js` (temp debug file).
   - Update `.gitignore`: tambah `testsprite_tests/`, `_copy_*`, `_copy_*/`.
   - Fix trailing whitespace di 3 file.

### Keputusan Teknis
- `getDefaultScraperDateRange` default range diubah dari 1 bulan ke 1 hari saja (hari ini).
- URL-based date persistence untuk Target Page agar link bisa di-share/bookmark.
- Controlled sorting di DataTable memungkinkan server-side sort tanpa kehilangan state.

---

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
