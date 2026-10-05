# Handoff Prompt — SINTAK Pricelist Multi-Produk

Copy-paste ini sebagai pesan pertama di sesi/agent baru agar langsung paham tanpa baca ulang history panjang.

---

Kamu adalah dev SINTAK ERP Next.js 16 App Router (TypeScript, Tailwind v4, SQLite/libSQL).

**BACA DULU:** `AGENTS.md` → `docs/REPO_MAP.md` → `docs/DEV_RULES.md` → `docs/RESUME_SESSION.md` → `docs/AI_SESSION_SUMMARY.md`

## Konteks Sesi per 31 Agu 2026

**Sudah selesai 13 produk (100% konsisten arsitektur):**
- Kalender 2027 (Spiral & Klem) — base `PRICELIST KALENDER 2027` + `22. Pricelist Kalender 2027 Spiral` + `30. Pricelist Kalender 2027 Klem`
- 01. Pricelist Buku Manasik
- 02. Pricelist Yasin
- 03. Pricelist Nota 1 Warna
- 04. Pricelist Brosur 2026 (merge `04. Pricelist Brosur Ap 120` + `04. Pricelist Brosur Ap 150` → pilihan gramatur Art Paper 120/150 gsm di 1 modul)
- 05. Pricelist Label KHQ
- 06. Pricelist Buku Tulis (15,5 x 21 & 16 x 21 cm, 72 hal)
- 07. Pricelist Stopmap (A4 22x31 & FOLIO 24x35)
- 08. Pricelist Syahadah (21,5x33, 6 varian 1M/2M×FC/1W/2W)
- 09. Pricelist Raport Kaleb (24x34, Kosongan/Isi 6)
- 10. Pricelist Kop Surat (A4, 4 varian HVS)
- 11. Pricelist Amplop (Kecil/Sedang/Besar)
- 12. Pricelist Sertifikat (A4 AC/Ivory + laminasi/foil)

**Belum (17 folder → ~24 varian):**
13. Undangan, 14. Buku Tabungan Non Security, 15. Buku Tabungan Security, 15. kartu Koperasi Promise, 16. Lebel Kartu Obat, 17. Buku Soft Cover ( + 21x29,7), 18. Buku Soft Cover -14,5x20,25 + Hard Cover 10,5x14,8, 19. Buku Soft Cover + Poster, 20. Majalah -14,5x20,25, 21. Buku Soft Cover + Poster + Hard Cover 10,5x14,8 (duplikat), 23. Stiker + Stiker, 24. Buku Soft Cover 10,5x14,8, 25. Hard Cover 14,5x20,25, 26. Hard Cover 21x29,7, 27. Kalender Kop, 28. Packaging, 29. Paperbag

**Aturan Wajib 1-5:**
1. Dilarang `npm run build`
2. `npx tsc` / Changelog / `git push` HANYA jika eksplisit disuruh
3. Changelog tanggal akurat, jangan hapus log lama
4. Selalu commit lokal setelah selesai
5. Ragu → tanya, jangan asumsi

**Konvensi Revisi (patch dari bug kemarin, wajib reuse):**
- `ThousandInput` → `import ThousandInput from '@/components/ThousandInput'` (default) + `onValueChange={(v)=>handleChange(k,v||0)}` + `prefix="Rp"` + `text-right` + `px-2.5 py-1.5 rounded-lg shadow-2xs`
- Master Parameter card → `bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3` header `flex gap-2 border-b border-slate-100 pb-2` icon `w-4 h-4` + `text-xs font-bold`, inner `grid gap-2.5`, `fieldRow p-2.5 rounded-lg border` `bg-amber-50/70 ring-1` vs `bg-slate-50/70`, label `text-xs font-semibold truncate`, reset `text-[9.5px] bg-amber-100/80 px-1.5 py-0.5` + `Def` + `RotateCcw w-2.5`, tanpa `<p>Terkait>`
- Simulator → header `Simulator & Kalkulator ... Katalog XX` (`p-4 bg-emerald-50/70 border-emerald-200/80 rounded-2xl`) + `Salin Penawaran` / `Panduan` / `Master Parameter` (`BookOpen` + `Settings2`), alert riwayat `Hitung Tarif Master` (emerald) + `Simpan Perubahan` (amber) + `Keluar`, grid `lg:grid-cols-12` kiri `col-span-5` (form: ukuran/varian grid, oplah select+custom, finishing checkbox `p-2.5 bg-slate-50/50`, margin/nego `%` suffix overlay) kanan `col-span-7` (4 kartu finansial `p-3.5` identik Brosur: HPP/lbr, Jual, Nego, Total + breakdown `No/Komponen/Keterangan/Biaya/Porsi` + `tfoot` Total HPP + **1 tombol Simpan full-width di kanan bawah saja**, kiri hanya `Judul` auto/hapus → auto-title). Simpan `localStorage sintak_saved_[produk]_simulations`
- Pricelist Matriks → header `emerald-50`, filter + switcher `Matriks/Table` (`LayoutGrid`/`TableProperties`), card `bg-amber-50/70` + `Layers` + `bg-white rounded-xl border-gray-200`, tabel 2-level `bg-gray-100 → bg-gray-200/80 → HPP|Harga(emerald-100/50)|Nego(blue-100/50)` + `hover:bg-amber-50/30`, grid dinamis `useAutoFitColumns(min 360-560)` + `Math.min(itemCount, autoCols)` + `repeat(..., minmax(0,1fr))` → melar penuh 1 row & auto turun kalau card kekecilan (anti scroll horizontal di dalam card). Hook: `src/hooks/useAutoFitColumns.ts` (ResizeObserver, ponytail: auto-fit sederhana)
- PricelistClient → tabs `overflow-x-auto` + filter Produk `usePortal` nempel kanan `border-l` (agar tidak tertutup card Upload)

## Prompt Revisi (Copy untuk produk baru)

```markdown
Tolong buatkan modul kalkulasi dan simulator pricelist untuk produk baru: "[NAMA_FOLDER_PRODUK]" yang ada di folder:
`H:\percetakan buya barokah\backup\a1\02__PEMASARAN\0203_SURAT PENAWARAN HARGA (SPH) out\020326 2026 SURAT PENAWARAN HARGA (SPH) out\Pricelist Juli 2026\[NAMA_FOLDER_PRODUK]`

Pastikan arsitektur, fitur, dan konvensi kodenya konsisten 100% dengan modul yang sudah ada (Kalender 2027, Buku Manasik, Buku Yasin, Nota 1 Warna, Brosur 2026, Label KHQ, Buku Tulis, Stopmap, Syahadah, Raport Kaleb, Kop Surat, Amplop, Sertifikat) dengan rincian berikut:

### 1. Analisis Master Excel & Formula HPP
- Periksa file Excel master dan file di subfolder `Source/` untuk produk ini.
- Ekstrak seluruh variabel biaya: bahan baku/kertas plano, ongkos cetak (mesin/plat/drek), finishing, packaging/box, dan formula HPP serta margin/tabel matrix harga jual resminya.

### 2. Calculator Engine (`src/lib/[produk]-calculator.ts`)
- Buat `interface [Produk]MasterParams` + `const DEFAULT_[PRODUK]_PARAMS`.
- Buat `interface [Produk]SimulatorInput` + `interface [Produk]CalculationResult`.
- Fungsi utama `calculate[Produk]Hpp(...)` wajib pakai safe-merge: `const p = { ...DEFAULT_[PRODUK]_PARAMS, ...(rawParams || {}) };`
- Buat fungsi generator matriks harga multi-oplah & multi-varian.

### 3. Master Parameter Global (`src/lib/global-master-params.ts`)
- Tambah import tipe baru + daftarkan di `applyGlobalParamsToAll(...)`.
- Petakan shared rates yang relevan (kertas kg, Oliver/POD A3+, laminasi, kardus/lakban) agar sinkron saat Master Global diubah.

### 4. Komponen UI Terisolasi (`src/app/pricelist/`) — Wajib Ikuti Konvensi Reuse
**Konvensi Wajib (jangan buat ulang / jangan improvisasi):**
- `ThousandInput` → `import ThousandInput from '@/components/ThousandInput'` (default export, BUKAN `from './ThousandInput'`), pakai `onValueChange={(v)=> handleChange(key, v||0)}` + `prefix="Rp"` untuk currency, `className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-right ..."`.
- Header Master Parameter → kiri: `Manual Pengguna` (`BookOpen` 13px, `bg-white hover:bg-emerald-100/50`), kanan: `Reset Standar Master` (selalu render, `disabled={!isModified}`, `isModified ? 'bg-amber-600 ring-2 ring-amber-400/40 text-white' : 'bg-slate-100 text-slate-400 ...'`).
- Badge Dimodifikasi hanya via `VISIBLE_KEYS`.
- `PricelistClient.tsx` → tabs `overflow-x-auto` + filter Jenis Produk `usePortal` `shrink-0 border-l` sebaris kanan.
- Simulator header `Katalog XX` + grid `lg:grid-cols-12` + 4 kartu `p-3.5` + breakdown + 1 simpan full-width.
- Matrix grid dinamis `useAutoFitColumns(min)` + `Math.min(itemCount, autoCols)`.

Buat 3 komponen:
1. **`[Produk]MasterParameter.tsx`**: form terisolasi + `VISIBLE_KEYS` + reset per-field & reset all + modal pemetaan cell/sheet Excel.
2. **`[Produk]Simulator.tsx`**: form interaktif + 4 Card Finansial + breakdown + generator teks WA + simpan `localStorage` + hidrasi saat Edit dari riwayat (snapshot + tombol "Hitung Tarif Master").
3. **`[Produk]MatrixView.tsx`**: matriks vs flat table sinkron `viewMode` + search/filter + `useAutoFitColumns`.

### 5. Integrasi Hub Utama
- **`PricelistClient.tsx`**: tambah opsi dropdown Jenis Produk + state + persist `localStorage` + routing view.
- **`SavedCalculationsList.tsx`**: daftarkan storage key + filter kategori + badge + handler Edit → tab Simulator kategori yang benar + format WA.
- **`ManualModal.tsx`**: tambah panduan jika perlu.

### 6. Aturan Wajib Patuh
1. Dilarang `npm run build`.
2. `npx tsc` / Changelog / Push HANYA jika eksplisit.
3. Changelog tanggal akurat, jangan hapus log lama.
4. Selalu commit lokal setelah selesai.
5. Jika ragu → tanya dulu, jangan asumsi.
```

## Tips Handoff
- Jalankan `git log --oneline -20` untuk sinkron commit.
- Jika drive `H:` tidak terbaca di agent baru, pakai fallback heuristik dan tulis `ponytail:` di kalkulator.
- Untuk batch multi-produk, buat 1 Task yang handle 3 produk sekaligus agar integrasi hub (PricelistClient/SavedList/global) tidak tabrakan.
