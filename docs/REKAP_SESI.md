# Rekap Sesi — 2026-05-26

## 1. Filter "Belum Realisasi"
- **Toggle button** di filter bar JHP (antara Nama Order & Reset).
- Logika filter sama persis dengan tombol "+" di tabel: data dianggap belum realisasi jika **`realisasi`**, **`no_order_2`**, DAN **`jenis_pekerjaan_2`** semuanya kosong.
- File: `src/app/api/jurnal-harian-produksi/route.ts`, `src/app/jurnal-harian-produksi/JurnalClient.tsx`

## 2. Subtotal Realisasi & Rijek
- **Bar hijau-biru** muncul di atas tabel saat filter aktif.
- Total dihitung dari **seluruh data terfilter** (SUM realisasi + SUM rijek), bukan per halaman.
- Hanya jalan saat filter aktif — tidak full scan 170K baris tiap render.
- File: `src/app/api/jurnal-harian-produksi/route.ts`, `src/app/jurnal-harian-produksi/JurnalClient.tsx`

## 3. Optimasi Performa Query JHP
- **Count/totals query** pakai `INDEXED BY idx_jurnal_tgl_deleted` jika ada filter tanggal → langsung seek ke range tgl.
- **Totals query** hanya jalan saat filter aktif (via `needTotals`), bukan tiap render.
- **Index baru** `idx_jurnal_bagian_deleted_tgl (bagian, deleted_at, tgl)` → filter Bagian tanpa tanggal tidak scan 170K baris.
- File: `src/lib/db-indexing.ts`, `src/app/api/jurnal-harian-produksi/route.ts`

## 4. Optimasi Performa Query Activity Log
- **INDEXED BY** di route.ts ganti ke `idx_activity_logs_created_at_id_desc` — ORDER BY `created_at DESC, id DESC` jadi coverage penuh, tanpa TEMP B-tree.
- **Index baru** `idx_activity_logs_table_created (table_name, created_at DESC)` — stats GROUP BY table_name + date range tanpa TEMP B-tree.
- **Index baru** `idx_activity_logs_recorded_by_created (recorded_by, created_at DESC)` — stats GROUP BY recorded_by + date range tanpa TEMP B-tree.
- File: `src/lib/db-indexing.ts`, `src/app/api/activity-log/route.ts`

## 5. Lain-lain
- PM2 `sintak-prod` (port 3000) auto-start di Windows startup — tidak perlu `npm start` manual.
- **Belum build** → jalankan `npm run build` agar index baru ter-create.
