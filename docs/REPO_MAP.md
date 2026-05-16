# Repo Map

Dokumen ini adalah peta cepat struktur repository untuk membantu AI agent atau developer baru memahami arah kerja tanpa perlu scan ulang dari nol. Detail aturan kerja tetap mengikuti `AGENTS.md`, `AI_RULES.md`, dan dokumen di `docs/`.

## Purpose

Project ini adalah aplikasi Next.js App Router berbasis TypeScript untuk operasional PT Buya Barokah. Area utamanya mencakup manufaktur, sales order, purchasing, accounting, scraping/import data, user/role management, dan monitoring aktivitas.

## Quick Start for Agents

1. Baca `AGENTS.md` terlebih dahulu untuk aturan kerja, batasan data, dan command yang aman.
2. Gunakan dokumen ini untuk menemukan folder awal sebelum mengubah kode.
3. Untuk fitur halaman, mulai dari `src/app/<module>/page.tsx`.
4. Untuk endpoint backend, mulai dari `src/app/api/<module>/route.ts` atau nested `route.ts` terkait.
5. Untuk utility bersama, cek `src/lib/` sebelum membuat helper baru.
6. Untuk komponen UI reusable, cek `src/components/` dan `src/components/ui/`.

## Main Layers

- `src/app/` — route layer Next.js App Router untuk halaman UI dan layout.
- `src/app/api/` — API route handlers untuk backend, scraping, sync, import, dan maintenance.
- `src/components/` — komponen UI reusable lintas halaman.
- `src/components/ui/` — komponen UI dasar seperti modal, tabel, dan tombol copy.
- `src/lib/` — database, auth/session, permission, logging, schema, date utilities, dan helper backend.
- `scripts/` — script setup database, migrasi, import data, pengecekan, cleanup, dan debugging.
- `docs/` — aturan developer, ringkasan sesi, task notes, dan dokumentasi pendukung.
- `test/` — test/verifier ringan yang saat ini tersedia.

## Module Groups

### Dashboard, Tracking, Sync

- Pages: `src/app/dashboard/`, `src/app/dashboard-manufaktur/`, `src/app/tracking-manufaktur/`, `src/app/stats/`, `src/app/sync/`.
- APIs: `src/app/api/stats/`, `src/app/api/tracking/`, `src/app/api/sync-status/`, `src/app/api/sync-job-status/`, `src/app/api/sync-batch-queue/`.
- Fokus: ringkasan operasional, status sinkronisasi, tracking manufaktur, dan statistik.

### Master Data, Items, Production

- Pages: `src/app/bahan-baku/`, `src/app/barang-jadi/`, `src/app/bom/`, `src/app/hasil-produksi/`, `src/app/jurnal-harian-produksi/`, `src/app/hpp-kalkulasi/`.
- APIs: `src/app/api/bahan-baku/`, `src/app/api/barang-jadi/`, `src/app/api/bom/`, `src/app/api/items/`, `src/app/api/master-barang/`, `src/app/api/master-pekerjaan/`, `src/app/api/hasil-produksi/`, `src/app/api/jurnal-harian-produksi/`, `src/app/api/hpp-kalkulasi/`.
- Fokus: master barang, bahan baku, BOM, produksi, jurnal produksi harian, dan kalkulasi HPP.

### Sales, Orders, Logistics

- Pages: `src/app/sales/`, `src/app/sales-orders/`, `src/app/orders/`, `src/app/rekap-sales-order/`, `src/app/pengiriman/`.
- APIs: `src/app/api/sales/`, `src/app/api/sales-orders/`, `src/app/api/orders/`, `src/app/api/rekap-sales-order/`, `src/app/api/pengiriman/`.
- Fokus: sales, sales order, order, rekap order, dan pengiriman.

### Purchasing and Payables

- Pages: `src/app/pr/`, `src/app/purchase-orders/`, `src/app/penerimaan-pembelian/`, `src/app/rekap-pembelian-barang/`, `src/app/pelunasan-hutang/`.
- APIs: `src/app/api/pr/`, `src/app/api/purchase-orders/`, `src/app/api/penerimaan-pembelian/`, `src/app/api/rekap-pembelian-barang/`, `src/app/api/pelunasan-hutang/`.
- Fokus: purchase request, purchase order, penerimaan pembelian, rekap pembelian, dan pelunasan hutang.

### Accounting and Receivables

- Pages: `src/app/akuntansi/`, `src/app/pelunasan-piutang/`.
- APIs: `src/app/api/jurnal-umum/`, `src/app/api/rek-akuntansi/`, `src/app/api/export-jurnal/`, `src/app/api/pelunasan-piutang/`.
- Fokus: jurnal umum, rekening akuntansi, export jurnal, dan pelunasan piutang.

### Admin, Auth, Users

- Pages: `src/app/login/`, `src/app/profile/`, `src/app/users/`, `src/app/roles/`, `src/app/settings/`, `src/app/audit-logs/`, `src/app/unauthorized/`.
- APIs: `src/app/api/auth/`, `src/app/api/activity-log/`, `src/app/api/infractions/`.
- Libraries: `src/lib/auth.ts`, `src/lib/session.ts`, `src/lib/session-cache.ts`, `src/lib/permissions.ts`, `src/lib/permissions-actions.ts`, `src/lib/permissions-constants.ts`, `src/lib/users.ts`.
- Fokus: autentikasi, session, permission, user/role, audit log, dan infractions.

### Scraping, Import, Maintenance

- APIs: `src/app/api/scrape-*`, `src/app/api/cron/`, `src/app/api/maintenance/`, `src/app/api/test-db/`, `src/app/api/debug-*`.
- Components: `src/components/ExcelUpload.tsx`, `src/components/ExcelUploadCard.tsx`, `src/components/ImportInfo.tsx`, `src/components/ScrapingHeader.tsx`.
- Scripts: `scripts/init-db.ts`, `scripts/migrate-sales-2025.mjs`, `scripts/import-master-pekerjaan.ts`, `scripts/import-master-target.ts`, serta script `check-*` dan `debug-*`.
- Fokus: scraping data eksternal, import Excel/master data, cron sync, maintenance, dan debugging.

## Common Entry Points

- Tambah/ubah halaman modul: mulai dari `src/app/<module>/page.tsx`.
- Tambah/ubah API modul: mulai dari `src/app/api/<module>/route.ts`.
- Ubah akses/role: cek `src/lib/permissions*.ts`, lalu halaman admin terkait.
- Ubah auth/session: cek `src/lib/auth.ts`, `src/lib/session.ts`, dan route `src/app/api/auth/`.
- Ubah DB/schema: cek `src/lib/db.ts`, `src/lib/schema.ts`, script `scripts/init-db.ts`, dan migrasi terkait.
- Ubah log aktivitas: cek `src/lib/activity.ts`, `src/lib/logger.ts`, dan `src/app/api/activity-log/`.
- Ubah tabel reusable: cek `src/components/ui/DataTable.tsx`, `src/components/TableFooter.tsx`, dan komponen tabel modul terkait.
- Ubah upload/import Excel: cek `src/components/ExcelUpload*.tsx`, API modul import, dan script import di `scripts/`.

## Core Libraries

- `src/lib/db.ts` — koneksi dan akses database utama.
- `src/lib/schema.ts` — definisi/rujukan schema aplikasi.
- `src/lib/auth.ts` — logika autentikasi.
- `src/lib/session.ts` dan `src/lib/session-cache.ts` — session dan caching session.
- `src/lib/permissions.ts` — permission checking.
- `src/lib/permissions-actions.ts` — aksi terkait permission.
- `src/lib/permissions-constants.ts` — konstanta permission.
- `src/lib/activity.ts` — pencatatan aktivitas.
- `src/lib/logger.ts` — logging aplikasi.
- `src/lib/api-utils.ts` — helper API bersama.
- `src/lib/date-utils.ts` — helper tanggal.
- `src/lib/fts.ts` — full-text/search helper bila digunakan modul terkait.
- `src/lib/scraper-period.ts` dan `src/lib/server-scraped-period.ts` — helper periode scraping.

## Shared Components

- Layout/navigation: `src/components/Sidebar.tsx`, `src/components/MainContentWrapper.tsx`, `src/components/PageHeader.tsx`.
- Table/data display: `src/components/ui/DataTable.tsx`, `src/components/TableFooter.tsx`, `src/components/TableTitle.tsx`, `src/components/ActivityTable.tsx`, `src/components/EmployeeTable.tsx`.
- Form/input: `src/components/DatePicker.tsx`, `src/components/SearchableDropdown.tsx`, `src/components/SearchAndReload.tsx`, `src/components/RecordsForm.tsx`, `src/components/RecordsTabs.tsx`.
- Modal/dialog/toast: `src/components/ui/BaseModal.tsx`, `src/components/ConfirmDialog.tsx`, `src/components/ManualModal.tsx`, `src/components/Portal.tsx`, `src/components/Toast.tsx`.
- Import/scraping: `src/components/ExcelUpload.tsx`, `src/components/ExcelUploadCard.tsx`, `src/components/ImportInfo.tsx`, `src/components/ScrapingHeader.tsx`.
- Misc UI: `src/components/HelpButton.tsx`, `src/components/StatsSkeleton.tsx`, `src/components/JurnalTrendChart.tsx`, `src/components/ui/CopyButton.tsx`.

## Commands

- `npm run dev` — menjalankan development server.
- `npm run build` — build production; menjalankan `prebuild` yang memanggil `npm run init-db`.
- `npm run lint` — linting.
- `npm run init-db` — inisialisasi database utama.
- `npm run init-db:dev` — inisialisasi database development.
- `npm run migrate:sales2025` — migrasi sales 2025.

## Data and DB Notes

- Repository berisi file database lokal seperti `database.sqlite`, `database_dev.sqlite`, `local.db`, dan file WAL/SHM terkait.
- Jangan hapus, reset, atau overwrite file database/env tanpa instruksi eksplisit dari user.
- Untuk perubahan schema, cari jalur migrasi/init yang sudah ada sebelum membuat script baru.
- Untuk scraping/import, pastikan perubahan selaras dengan aturan activity log dan dokumentasi developer.

## Tests and Verification

- Test/verifier yang terlihat: `test/infractions_timestamp_test.js` dan `test/verify_updated_at.js`.
- Untuk perubahan umum, mulai verifikasi dari command paling spesifik yang tersedia.
- Jika menyentuh build/runtime Next.js, pertimbangkan `npm run lint` dan/atau `npm run build` setelah perubahan siap.

## Documentation Continuity

- Update `docs/RESUME_SESSION.md` atau `docs/AI_SESSION_SUMMARY.md` bila pekerjaan perlu dilanjutkan di sesi berikutnya.
- Update `docs/task.md` bila ada daftar task aktif yang perlu dijaga.
- Jika menemukan aturan kerja baru yang berlaku umum, pertimbangkan update `AGENTS.md` atau `docs/DEV_RULES.md`.
