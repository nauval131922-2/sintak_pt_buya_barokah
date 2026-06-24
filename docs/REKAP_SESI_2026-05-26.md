# Rekap Sesi — 2026-05-26

## 1. Filter "Belum Realisasi" (JHP)
- **Toggle button** di filter bar JHP (antara Nama Order & Reset).
- Logika filter = 3 field kosong: **`realisasi`**, **`no_order_2`**, **`jenis_pekerjaan_2`** semuanya NULL/empty.
- **Subtotal Realisasi & Rijek** — bar hijau-biru muncul saat filter aktif, API hanya hitung jika `needTotals=true`.
- File: `src/app/api/jurnal-harian-produksi/route.ts`, `src/app/jurnal-harian-produksi/JurnalClient.tsx`

## 2. Optimasi Performa Query JHP
- **Count/totals** pakai `INDEXED BY idx_jurnal_tgl_deleted` (langsung seek ke range tgl).
- **Totals query** hanya jalan saat filter aktif (`needTotals`), bukan tiap render.
- **Index baru** `idx_jurnal_bagian_deleted_tgl (bagian, deleted_at, tgl)` — filter Bagian tanpa tanggal tidak scan 170K baris.
- File: `src/lib/db-indexing.ts`, `src/app/api/jurnal-harian-produksi/route.ts`

## 3. Optimasi Performa Query Activity Log
- **INDEXED BY** ganti ke `idx_activity_logs_created_at_id_desc` — ORDER BY `created_at DESC, id DESC` coverage penuh, tanpa TEMP B-tree.
- **Index baru** `idx_activity_logs_table_created (table_name, created_at DESC)` — stats GROUP BY table_name + date range tanpa TEMP B-tree.
- **Index baru** `idx_activity_logs_recorded_by_created (recorded_by, created_at DESC)` — stats GROUP BY recorded_by + date range tanpa TEMP B-tree.
- Duplicate index untuk `activity_logs_archive`.
- LIKE `raw_data` tetap dipertahankan (pencarian di before/after/diff).
- File: `src/lib/db-indexing.ts`, `src/app/api/activity-log/route.ts`

## 4. Perubahan Halaman `/hasil-produksi` (Tab Jurnal Produksi)
- **Kolom Target** — ditambahkan sebelum Realisasi (header + body row + subtotal).
- **Freeze** — Jenis Pekerjaan ikut sticky (`lg:sticky lg:left-[500px]`), freeze sampai kolom itu.
- **Subtotal** — selalu muncul tiap ganti job streak (tidak peduli 1 atau banyak baris), menjumlah **Rijek + Target + Realisasi**.
- **Sort** — tidak diubah (job first date → job name → date ASC).
- **Footer totals** — nambah display Total Target.
- File: `src/app/api/hasil-produksi/details/route.ts`, `src/app/hasil-produksi/HasilProduksiClient.tsx`

## 5. Lain-lain
- PM2 `sintak-prod` auto-start di Windows startup — tidak perlu `npm start` manual.
- **Belum build** → jalankan `npm run build` agar index baru ter-create (via prebuild → init-db).
