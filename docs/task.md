# 📋 task.md

## 🔄 Sedang Dikerjakan (In Progress)

_Tidak ada task yang sedang berjalan saat ini._

---

## 📌 Akan Dikerjakan (Backlog)

- [ ] **Auto-Generate Jadwal Produksi Harian** — fitur generate draft jadwal besok berdasarkan histori JHP (lihat `docs/AUTO_GENERATE_JADWAL.md`)
- [ ] Validasi ulang quick start README setelah setup di mesin baru
- [ ] Dokumentasikan command operasional harian yang paling sering dipakai
- [ ] Integrasi Audit Log yang lebih detail untuk setiap aksi User
- [ ] Setup sistem backup database otomatis ke Cloud Storage

---

## ✅ Selesai (Done)

- [x] Perbaikan race condition fetch data halaman Target + auto-reset tanggal saat hari berganti — 2026-06-12
- [x] UI empty state baru halaman Target (emerald theme, sentence case, tombol aksi) — 2026-06-12
- [x] Dual database connection untuk export Excel agar tidak blokir user lain — 2026-06-12
- [x] Pesan export dinamis sesuai tahun terpilih (hilangkan hardcoded "168k" dan "seluruh database") — 2026-06-12
- [x] Pembersihan file tidak terpakai (file debug root, database kosong, script eksperimental, folder kosong, dan folder tmp) — 2026-06-05
- [x] Implementasi Progress Bar Hapus Log Aktivitas (Dedicated Progress Screen, Live Percentage, Dynamic Status, & Timer) di Dashboard Umum — 2026-05-20
- [x] Penghapusan Menyeluruh Fitur Statistik Performa (`statistik`) dari Navigasi, Halaman Stats, RBAC, dan Database — 2026-05-20
- [x] Implementasi modul Master Pekerjaan Jurnal Produksi (Skema DB, API, Hak Akses, Sidebar, dan UI Upload/List) — 2026-05-20
- [x] Optimasi Ekspor Excel Jurnal Harian Produksi Seluruh Data dengan ExcelJS Streaming — 2026-05-20
- [x] Dukungan Teks & Paragraf Kolom JHP (Jml. Plate, Inscheet, Rijek) + Textarea Form — 2026-05-19
- [x] Fitur "Pilih Semua Data" pada Trash JHP & Optimasi API Hard Delete/Restore Bulk — 2026-05-19
- [x] Pembuatan Script `cleanup-db.ts` & Dokumen Panduan Ukuran Database (`docs/DATABASE_CLEANUP.md`) — 2026-05-19
- [x] Dashboard Akuntansi: halaman, trend chart, warning card, jurnal terbaru, API batch — 2026-05-18
- [x] Perbaikan RBAC fail-close (permission.ts) + routing dashboard — 2026-05-18
- [x] Perbaikan trend chart legend & label X-axis (Production, HRD) — 2026-05-18
- [x] Perbaikan warning JHP tanpa target — 2026-05-18
- [x] Copy-to-clipboard log jurnal umum — 2026-05-18
- [x] Panduan PM2 deployment + ecosystem.config.js — 2026-05-18
- [x] Catatan auto-start Windows (`docs/STARTUP_WINDOWS_NOTE.md`) + skrip `scripts/startup/*` — 2026-05-21
- [x] Modernisasi Desain Premium modul Penjualan & Pembelian (sebagian) — 2026-05-18
- [x] Perbaikan Infractions: ConfirmDialog redirect + validasi API description opsional — 2026-05-17
- [x] Implementasi Dashboard HRD (RecordsTabs, tab List ↔ Form, export infractions) — 2026-05-17
- [x] JHP Soft Delete System + Audit Columns (created_by, updated_by) — 2026-05-17
- [x] Optimasi Dashboard Manufaktur (query single-table, JurnalTerbaruCard, ProduksiTrendChart) — 2026-05-17
- [x] Standarisasi Scraping Utils terpusat ke `src/lib/scraper-utils.ts` — 2026-05-17
- [x] Komponen baru dashboard: JurnalStatCard, OrdersStatCard, UsersStatCard, StatCardDropdown — 2026-05-17
- [x] Audit `.gitignore`: tambah `scratch/` agar file debug tidak ter-commit — 2026-05-17
- [x] Dokumentasi playbook scraping/import dan activity log — 2026-05-16
- [x] Pembuatan `docs/AI_WORKFLOW.md` sebagai playbook utama sesi AI — 2026-05-16
- [x] Penguatan alur lanjut kerja tanpa briefing ulang panjang — 2026-05-16
- [x] Standarisasi dokumentasi onboarding AI (`AGENTS.md`, `REPO_MAP.md`, `RESUME_SESSION.md`, `README.md`, `AI_SESSION_SUMMARY.md`) — 2026-05-16
- [x] Optimasi Dashboard & Analytics dengan visualisasi Recharts terbaru — 2026-05-15
- [x] Implementasi Standardisasi UI & BaseModal Integration — 2026-05-15
- [x] Implementasi Modul Konversi Data HPP Kalkulasi & Sinkronisasi — 2026-05-15
- [x] Analisis arsitektur sistem (Tech Stack, Vercel, Turso, Skema) — 2026-04-20
- [x] Pembuatan panduan `BUILD_FROM_SCRATCH.md` dari nol — 2026-04-20
- [x] Integrasi pola implementasi JWT, Scraper, Fuzzy Excel, dan Audit Log ke panduan — 2026-04-20
- [x] Migrasi visual seluruh modul ke sistem desain Neobrutalism (Boxy, Mechanical Yellow) — 2026-04-20
- [x] Standarisasi badge loadTime dan count badge di seluruh modul tabel — 2026-04-20
- [x] Perbaikan bug parsing JSX pada Profile page pasca-migrasi — 2026-04-20
- [x] Migrasi Neobrutalism Global Components (`ActivityTable.tsx`, `DataTable.tsx`, `Sidebar.tsx`) — 2026-04-21
- [x] Migrasi Neobrutalism SOPD & Master Pekerjaan — 2026-04-21
- [x] Migrasi Neobrutalism HPP Kalkulasi — 2026-04-21
- [x] Migrasi Neobrutalism Produksi (BOM, Barang Jadi, Bahan Baku) — 2026-04-21
- [x] Perbaikan modul Hak Akses (Grouping Sistem/Digit & Smart Expand) — 2026-04-26
- [x] Modernisasi Manajemen User (Full Width, SearchAndReload, Premium Style) — 2026-04-26
- [x] Modernisasi Halaman Profil (Typography No All-Caps & Layout Compact) — 2026-04-26
- [x] Implementasi Modul Jurnal Harian Produksi & Hasil Produksi — 2026-04-26
- [x] Transisi desain sistem dari Neobrutalism ke Modern Premium — 2026-04-26
- [x] Optimasi Layout & Sticky Header Hasil Produksi (2XL Row, Background Extension) — 2026-04-27
- [x] Stabilisasi Popup UI (Migrasi DatePicker & Sidebar ke Portal) — 2026-04-27
- [x] Optimasi Performa Dropdown (Render Limiting 30 items) — 2026-04-27
- [x] Penghapusan Nested Scroll & Sinkronisasi Native Page Scroll pada Tabel Produksi — 2026-04-27
- [x] Standarisasi Footer Pagination Dashboard (Responsif Kiri-Kanan) — 2026-04-27
- [x] Implementasi Fallback Logika Tracking Manufaktur (via BOM Faktur) — 2026-04-28
- [x] Resiliensi Build Database (Penanganan Error Turso BLOCKED) — 2026-04-28
- [x] Standarisasi Nama Produksi & Sumber Data di Dashboard Hasil Produksi — 2026-04-28
- [x] Arsitektur Pemisahan 3 Database (Dev Lokal, Prod Lokal, Turso Cloud) — 2026-04-28
- [x] Optimasi User Experience Hak Akses (Fix Click Bug, Group Cleanup, & Dashboard Focus) — 2026-04-29
- [x] Implementasi Job-Based Grouping & Kronologis ASC pada Jurnal Produksi — 2026-04-29
- [x] Standarisasi UI Tabel (Auto-fit Column, Pagination 20, & Sentence Case Policy) — 2026-04-29
- [x] Implementasi Tracking Manufaktur Dua Jalur & Backward Tracing Engine — 2026-04-29
- [x] Refinement Tata Letak & Validasi Otomatis Supplier pada Tracking — 2026-04-30
- [x] Implementasi Layout Tab & Dinamisasi Kolom pada Tracking Manufaktur — 2026-04-30
- [x] Resolusi Build Error & Stabilisasi Komponen Tracking Manufaktur — 2026-05-03
- [x] Implementasi Modul Konversi Data Jurnal Harian Produksi — 2026-05-03
- [x] Implementasi Scraper Rek Akuntansi & Standarisasi Komponen DateRangeCard — 2026-05-05
- [x] Optimasi Analisis Kas Jurnal Umum (Highlight Kas & Kolom Arus Kas) — 2026-05-05
- [x] Resolusi Bug Paginasi Infinite Scroll (Switch to Page-Based Tracking) — 2026-05-05
- [x] Stabilisasi JHP (Manual Input Protection) & Modul Jadwal Harian — 2026-05-06
- [x] Migrasi Image Export library ke modern-screenshot (Fix lab() error) — 2026-05-06
- [x] Perbaikan sistem notifikasi Toast (Ghost Toast Fix & Stability) — 2026-05-07
- [x] Optimasi Database Bloat (Pencegahan log berlebih & Cleanup) — 2026-05-08
- [x] Peningkatan Sistem Import SOPd (Refactor API & Konversi Worker) — 2026-05-08
- [x] Implementasi Multi-Realisasi Input Jurnal Harian Produksi — 2026-05-11
- [x] Perbaikan Mapping Kategori Pekerjaan & Filter API Exact Match — 2026-05-11
- [x] Implementasi Atomic Copy Jadwal & Permission canCopyJadwal — 2026-05-11
- [x] Migrasi Pagination Jurnal Umum & Integrasi TableFooter — 2026-05-12
- [x] Implementasi Akurasi Carry-over Running Total Jurnal Umum — 2026-05-12
- [x] Implementasi Modul Master Barang (Scraper & UI) — 2026-05-12
- [x] Optimasi API Barang Jadi & Stabilitas Sales Report — 2026-05-12
- [x] Implementasi Penyalinan Jadwal Fleksibel (Modal, Filter Search, Green Theme) — 2026-05-14
- [x] Implementasi Audit Log Scraping Jurnal Umum & Standarisasi DEV_RULES — 2026-05-14

---

## 🐛 Bug Diketahui (Known Bugs)

> _Belum ada bug yang tercatat._

---

## 💡 Ide & Improvement (Someday)

- [ ] Implementasi Dark Mode dengan aksen Emerald
- [ ] Fitur export laporan ke Excel dengan format yang lebih rapi (Styling)

---

## 📊 Statistik

```
Total task    : 112
Selesai       : 105
In progress   : 0
Backlog       : 5 (+ 2 ide)
Bug diketahui : 0
Progress      : 93.8%
```

### Catatan Sesi 2026-06-12
- Perbaikan race condition, auto-reset tanggal, dan UI empty state halaman Target.
- Dual database connection untuk export (db-export.ts).
- Pesan dan estimasi export dinamis sesuai tahun.

---

<!--
CATATAN UNTUK AI:
Setelah memperbarui file ini:
1. Pindahkan task selesai ke bagian ✅ Selesai dengan tanggal penyelesaian
2. Perbarui bagian 📊 Statistik
3. Tambahkan catatan progres jika task belum 100% selesai
4. Urutkan Backlog berdasarkan prioritas (paling penting di atas)
-->
