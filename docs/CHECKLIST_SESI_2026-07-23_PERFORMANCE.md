# Checklist Sesi OpenCode — Performance & Bugfix

**Tanggal:** 2026-07-23  
**Topik:** Audit performa SINTAK + fix hot-path + regresi UI  
**Catatan sesi:** Obsidian `SINTAK-ERP/Sessions/Session-2026-07-23-Performance-Audit.md` · `docs/AI_SESSION_SUMMARY.md`

---

## A. Deploy / prep

- [ tolong nanti kamu yang jalankan] `npx tsc --noEmit` (tanpa error di file yang disentuh)
- [ tolong nanti kamu yang jalankan] `npm run lint` (opsional)
- [ ✅] Dev/prod server jalan ulang (`npm run dev` atau restart PM2)
- [✅ ] (Opsional) DB lain belum denorm tracking:  
  `node scripts/backfill-tracking-cols.mjs`

---

## B. Smoke test UI

### B1. Auth & navigasi

- [ ✅] Login OK
- [ ✅] Pindah menu cepat: Dashboard → Orders → JHP → Tracking (terasa lebih ringan)

### B2. Dashboard

| Halaman | Cek |
|---------|-----|
| `/dashboard` | Aktivitas terbaru tampil |✅
| `/dashboard-manufaktur` | Chart + kartu summary; skeleton chart sebentar OK |✅
| `/dashboard-manufaktur` | Dropdown **periode** di kartu Order/Jurnal **tidak** ketutup card di bawah |✅
| `/dashboard-manufaktur` | Pilih Hari Ini / Bulan Ini / Tahun Ini → angka update |✅
| `/dashboard-hrd` | Chart tren kesalahan |✅
| `/dashboard-akunting` | Chart + warning barang jadi |✅

### B3. Tracking manufaktur — `/tracking-manufaktur` ⚠️ regresi

- [ ✅] Cari **BOM** (contoh: `BM00126042800002`)
- [✅ ] Tab terisi: SPH, SO, Order Produksi, PR, BBB, Barang Jadi (bukan kosong)
- [✅ ] Jalur rekap / PB / PO (jika dipakai) masih cascade
- [ ❌ kalau lewat jalur yang tidak pilih bom, tidak work] **Rentang tanggal** memfilter baris di tab (BOM + rekap)

### B4. Barang jadi — `/barang-jadi`

- [✅ ] List + pagination
- [ ✅] Filter warning / SO only (jika ada) hasil masuk akal

### B5. Sales

| Halaman | Cek |
|---------|-----|
| `/sales-orders` | Search FTS + kolom UI (SJ/lunas jika ada) |✅
| `/rekap-sales-order` | Search + filter harga |✅
| `/rekap-sales-order` | Klik input min/max harga → panel **tidak** langsung tutup |✅
| `/rekap-sales-order` | **Enter** di min/max = tombol **Terapkan** |✅
| `/sales` | Search produk / pelanggan |

❌ tanggal di rentang tanggal di rekap sales order kalau direload kembali ke default, buat sama seperti halaman scraper yang lain

### B6. List modul scrap (payload tanpa blob `raw_data`)

- [ ✅] `/orders` — kolom qty order / spesifikasi / BOM / SO masih ada
- [ ✅] `/bom`
- [ ✅] `/pr`
- [✅ ] `/purchase-orders`
- [✅ ] `/bahan-baku`
- [✅ ] `/pengiriman`
- [ ✅] `/pelunasan-hutang`
- [ ✅] `/pelunasan-piutang`
- [✅ ] `/sph-out`, `/sph-in`, `/spph-out`
- [ ✅] `/rekap-pembelian-barang`
- [ ✅] `/penerimaan-pembelian`

### B7. Jurnal harian produksi — `/jurnal-harian-produksi` ⚠️ regresi

- [ ✅] Filter **Bagian** — buka, ketik search, pilih → tabel ter-filter
- [ ✅] Filter **Karyawan** — sama
- [ ✅] Filter **No order** — search order, pilih → filter jalan
- [✅ ] Filter **Jenis pekerjaan** — sama
- [ ✅] Panel dropdown filter **tidak** hilang saat klik search/item
- [✅ ] Tab form: dropdown karyawan & order masih bisa dipilih
- [✅ ] `/jurnal-harian-produksi/target` — export PDF (jspdf load saat klik)

### B8. Log aktivitas — `/log-aktivitas`

- [✅ ] List cepat
- [ ✅] Expand baris → detail before/after JSON muncul
- [ ✅] Chart tren (jika dibuka) OK

### B9. Export on-demand

- [ ✅] `/bom` — export Excel
- [ ✅] Infractions / records — export PDF

### B10. Build Next.js 16

- [ tolong nanti kamu yang jalankan build] Dashboard manufaktur / HRD / akunting **tidak** error `ssr: false` di Server Component
- [ tolong nanti kamu yang jalankan build] Build/dev jalan tanpa Ecmascript error di `next/dynamic`

---

## C. Ringkasan perubahan sesi

| Area | Status |
|------|--------|
| Session `cache()` + `getMergedPermissions` cache | ✅ |
| Activity log: strip `raw_data`, lazy expand, pageSize cap 200 | ✅ |
| Barang jadi: JOIN pre-aggregate + warning 1 query | ✅ |
| Tracking: denorm kolom + strip HTML di `faktur_prd`/`faktur_sph` | ✅ |
| JHP: prefetch + fix `SearchableDropdown` Portal click-outside | ✅ |
| Strip `raw_data` di list API modul utama | ✅ |
| Dashboard / options cache (30–120s) | ✅ |
| FTS: `JOIN … MATCH` (bukan unbounded `id IN`) | ✅ |
| Dynamic import chart / xlsx / jspdf | ✅ |
| Rekap harga: Portal click-outside + Enter = Terapkan | ✅ |
| Next 16: hapus `ssr: false` di Server Component dashboard | ✅ |
| `StatCardDropdown`: Portal + fixed (tidak ketutup card) | ✅ |

---

## D. File kunci yang disentuh

### Core / lib
- `src/lib/session.ts`
- `src/lib/permissions.ts`
- `src/lib/api-utils.ts` (`stripRawData`)
- `src/lib/actions.ts` (dashboard cache)
- `src/lib/schema.ts`, `src/lib/db-indexing.ts`
- `src/lib/export-excel.ts`
- `src/components/SearchableDropdown.tsx`
- `src/components/StatCardDropdown.tsx`

### API
- `src/app/api/tracking/route.ts`
- `src/app/api/barang-jadi/route.ts`
- `src/app/api/dashboard/*`
- `src/app/api/activity-log/route.ts`
- `src/app/api/sales-orders/route.ts`
- `src/app/api/rekap-sales-order/route.ts`
- `src/app/api/sales/route.ts`
- `src/app/api/employees/route.ts`
- List + scrape routes (strip raw / denorm scrape)

### UI
- `src/app/jurnal-harian-produksi/JurnalClient.tsx`
- `src/app/log-aktivitas/ActivityLogClient.tsx`
- `src/app/rekap-sales-order/RekapSalesOrderClient.tsx`
- `src/app/dashboard-manufaktur/page.tsx`
- `src/app/dashboard-hrd/page.tsx`
- `src/app/dashboard-akunting/page.tsx`
- `src/components/InfractionsTable/InfractionsTable.tsx`
- `src/app/jurnal-harian-produksi/target/TargetClient.tsx`

### Script
- `scripts/backfill-tracking-cols.mjs`

---

## E. Backlog (jangan kerjakan dulu kecuali ada gejala)

- [❌] Export jurnal dropdownnyad lebar sekali, ngga proper
- [✅sementara ini masih oke] Export jurnal chunk per bulan
- [ ✅ sementara ini masih oke] Cron sync: call internal + incremental
- [ ✅ sementara ini masih oke] Denorm penuh kolom orders (qty_order, spesifikasi, …)
- [ ✅ sementara ini masih oke] Soften `force-dynamic` page shell master
- [ ✅ sementara ini masih oke] Split chart di halaman Hasil Produksi

---

## F. Prioritas cek hari ini

1. Tracking — tab tidak kosong  
2. JHP filters — dropdown bisa dipakai  
3. Rekap filter harga — panel stabil + Enter  
4. Dashboard manufaktur — dropdown periode di atas card  
5. Build Next 16 tanpa error `ssr: false`

---

## G. Tutup sesi

- [ ] Checklist B lulus (atau catat bug sisa: path + faktur/filter)
- [ commit local aja] Commit **hanya jika** user minta secara eksplisit
- [ ] Jangan push / reset / hapus DB tanpa izin

---

## H. Smoke test 5 menit (jalur cepat)

1. Login → `/dashboard-manufaktur` (chart + dropdown periode)  
2. Tracking 1 faktur BOM  
3. `/sales-orders` search  
4. `/barang-jadi` list  
5. `/jurnal-harian-produksi` buka 1 filter dropdown  
6. `/rekap-sales-order` filter harga min + Enter  
7. `/log-aktivitas` expand 1 baris  

Jika semuanya OK → sesi optimasi siap production path.
