# Checklist — Page Changelog (catch-up)

Versi log: `2026-07-25-catchup-1`  
Sumber path: `src/lib/page-changelogs.ts` → `PAGE_CHANGELOG_PATHS`  
Icon ✨ muncul di samping tombol Manual (header) **hanya** di path di bawah.

**Catatan:** isi bullet catch-up = ringkasan best-effort (78 commit lokal + uncommitted), bukan audit diff GitHub 100%.

---

## Cara cek per halaman

1. Buka path di browser (login, permission OK).
2. [ ] Icon **✨** (Log perubahan) di samping icon Manual / `?` pada judul.
3. [ ] Klik ✨ → modal log terbuka (footer buka manual = hanya **Tutup**).
4. [ ] (Opsional) Hard refresh tanpa “Jangan tampilkan lagi” → modal auto muncul.
5. [ ] Isi bullet masuk akal / tidak menyesatkan (coret atau catat di kolom Catatan).

---

## Daftar halaman (15)

| # | Halaman | Path | Icon ✨ | Modal buka | Auto-popup | Isi OK | Catatan |
|---|---------|------|--------|------------|------------|--------|---------|
| 1 | Dashboard | `/dashboard` | [ ] | [ ] | [ ] | [ ] | |
| 2 | Dashboard Manufaktur | `/dashboard-manufaktur` | [ ] | [ ] | [ ] | [ ] | |
| 3 | Dashboard Akunting | `/dashboard-akunting` | [ ] | [ ] | [ ] | [ ] | |
| 4 | Dashboard HRD | `/dashboard-hrd` | [ ] | [ ] | [ ] | [ ] | |
| 5 | Jurnal Harian Produksi | `/jurnal-harian-produksi` | [ ] | [ ] | [ ] | [ ] | |
| 6 | Excel SOPd | `/jurnal-harian-produksi/data/excel-sopd` | [ ] | [ ] | [ ] | [ ] | |
| 7 | Master Pekerjaan | `/jurnal-harian-produksi/data/master-pekerjaan` | [ ] | [ ] | [ ] | [ ] | |
| 8 | Master Pekerjaan Jurnal Produksi | `/jurnal-harian-produksi/data/master-pekerjaan-jurnal-produksi` | [ ] | [ ] | [ ] | [ ] | CRUD + merge Excel (sesi ini) |
| 9 | Target JHP | `/jurnal-harian-produksi/target` | [ ] | [ ] | [ ] | [ ] | |
| 10 | Analisa JHP | `/jurnal-harian-produksi/analisa` | [ ] | [ ] | [ ] | [ ] | |
| 11 | Tracking Manufaktur | `/tracking-manufaktur` | [ ] | [ ] | [ ] | [ ] | |
| 12 | Log Aktivitas | `/log-aktivitas` | [ ] | [ ] | [ ] | [ ] | |
| 13 | Records | `/records` | [ ] | [ ] | [ ] | [ ] | |
| 14 | BOM | `/bom` | [ ] | [ ] | [ ] | [ ] | |
| 15 | Hasil Produksi | `/hasil-produksi` | [ ] | [ ] | [ ] | [ ] | |

---

## Di luar daftar (by design)

Halaman **tanpa** entry di `PAGE_CHANGELOG_PATHS` → **tidak** ada icon ✨ dan **tidak** auto-popup.  
Contoh: sales, purchase order, bahan baku, users, settings, dll.

Kalau perlu log di path lain: tambah entry + path di `src/lib/page-changelogs.ts`.

---

## Reset dismiss (dev)

Kalau sudah “Jangan tampilkan lagi” dan ingin tes auto-popup lagi, hapus di DevTools → Application → Local Storage key:

`sintak_changelog_dismissed:<pageKey>:2026-07-25-catchup-1`

Contoh pageKey: `dashboard`, `jurnal-harian-produksi`, `master-pekerjaan-jurnal-produksi`.

---

## Hasil cek

- Tanggal cek:
- Yang lulus:
- Yang perlu perbaiki bullet / path:
- Keputusan: biarkan catch-up / pangkas page / bump version
