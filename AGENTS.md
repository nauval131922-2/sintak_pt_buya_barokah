# AGENTS.md — SINTAK ERP

Project ERP/internal web Next.js 16 App Router (TypeScript, Tailwind v4, SQLite/libSQL) untuk PT Buya Barokah. Gunakan Bahasa Indonesia untuk penjelasan kerja & ringkasan perubahan.

## Perintah Penting

| Perintah | Catatan |
|----------|---------|
| `npm run dev` | Dev server dengan `--turbo` |
| `npm run build` | **Otomatis** jalankan `init-db` via `prebuild` — build gagal jika DB gagal init |
| `npm run lint` | ESLint (config di `eslint.config.mjs`) |
| `npm run init-db` | Init/maintain schema via `scripts/init-db.ts` (pakai `tsx`) |
| `npm run init-db:dev` | Sama, tapi `DB_PATH=database_dev.sqlite` |
| `npm run migrate:sales2025` | Migrasi spesifik — jangan jalankan tanpa alasan |

## Arsitektur & Kebiasaan

- **DB auto-init saat startup**: `src/lib/db.ts` auto-import `initSchema` dari `schema.ts` tiap kali modul di-load (termasuk Hot Reload). Schema migration (rename kolom, tambah kolom) jalan otomatis di situ.
- **Path alias**: `@/*` → `./src/*` (dari `tsconfig.json`).
- **Auth**: JWT stateless via `jose`, HTTP-only cookie `session`. Lihat `src/lib/session.ts`, `src/lib/auth.ts`, `src/lib/permissions.ts`.
- **DB**: Lokal SQLite (`database.sqlite` / `database_dev.sqlite`) atau Turso cloud. Deteksi otomatis: `USE_REMOTE_DB=true` + `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
- **Body size limit**: `next.config.ts` set `proxyClientMaxBodySize: '500mb'` dan `serverActions.bodySizeLimit: '500mb'` — penting untuk upload Excel besar.
- **PM2**: `ecosystem.config.js` untuk production — nama app `sintak-prod`, port 3000.
- **Vercel cron**: 3 job — maintenance (Minggu 01:00), archive-logs (harian 02:00), sync-daily (harian 03:00) — lihat `vercel.json`.

## Activity Log — Manual Wajib untuk Scraping/Import Massal

Tabel bervolume tinggi **tidak** punya trigger otomatis `activity_logs` (lihat exclusion list di `schema.ts:1365-1374`). Scraping/import massal ke tabel ini **wajib** insert `activity_logs` manual setelah data tersimpan. Daftar tabel:

```
jurnal_harian_produksi, jurnal_umum, orders, sopd, sopd_harga,
bahan_baku, barang_jadi, sales_reports, sales_orders, rek_akuntansi,
bill_of_materials, purchase_requests, purchase_orders,
penerimaan_pembelian, rekap_pembelian_barang, pelunasan_hutang,
pelunasan_piutang, pengiriman, spph_out, sph_in, hpp_kalkulasi
```

Pola log manual ada di `docs/DEV_RULES.md` (Bagian 1).

## Gaya & Tema

- **Warna utama**: Emerald/hijau (`emerald-600`, `green-600`) — **bukan biru**. Gunakan `rounded-xl`/`rounded-2xl`, shadow halus.
- **Typography**: Sentence case, **dilarang** `uppercase` paksa. Font: Outfit (via `next/font`).
- **Popup/dropdown**: Wajib React Portal agar tidak terpotong `overflow-hidden` — lihat `src/components/Portal.tsx`.
- **Notifikasi**: `Toast`, jangan `alert()` atau `window.confirm()`.
- **Dropdown dengan banyak data** (>100 item): batasi render 30-50 via `useMemo` + `slice`.

## Env Variable Kunci

`DB_PATH`, `USE_REMOTE_DB`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_SECRET` (wajib ganti di production), `SCRAPER_EMAIL`, `SCRAPER_PASSWORD`, `CRON_SECRET`.

## Hal yang Tidak Boleh Dilakukan Tanpa Persetujuan

- Commit, branch, push, reset git.
- Hapus/ubah database `*.sqlite`/`*.db`, file `.env`, atau data hasil scraping/import.
- Operasi destruktif (`git reset`, `rm`, migrasi besar, cleanup DB).
- Perbaiki bug di luar scope task.

## Bacaan Konteks Awal

Urutan: `AGENTS.md` → `docs/REPO_MAP.md` → `docs/DEV_RULES.md` → `docs/RESUME_SESSION.md` → `docs/AI_SESSION_SUMMARY.md`. Jika task terkait scraping/import, baca juga `docs/SCRAPING_FLOW.md`.
