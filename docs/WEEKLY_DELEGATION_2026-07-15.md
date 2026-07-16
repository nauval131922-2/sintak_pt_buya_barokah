# Delegation Templates — Week of 2026-07-15

Generated: 2026-07-15 (WIB)
Total: 3 High, 3 Medium, 2 Low Priority Tasks

---

## 🔴 HIGH PRIORITY

### #1 — Fix 4 TypeScript Compilation Errors (EmployeeTable.tsx)

```
Kerjakan action #1 (High Priority):
Fix 4 TypeScript compilation errors di src/components/EmployeeTable.tsx

Context:
- `npm run build` (prebuild jalankan init-db) akan gagal jika ada TS error.
- Ke-4 error sama: ColumnDef `cell` typing di @tanstack/react-table tidak
  cocok dengan `CellContext<Employee, unknown>` default.
- Error ada di baris 189, 195, 206, 217.

Task:
1. Buka src/components/EmployeeTable.tsx, lihat definisi ColumnDef di baris ~189-217.
2. Perbaiki tipe `cell` renderer dengan cast eksplisit atau ubah tipe column
   jadi `ColumnDef<Employee, any>` / gunakan `accessorFn` + generic yang benar.
3. Jalankan `npx tsc --noEmit` — pastikan 0 error TS.
4. Pastikan tabel employee tetap render benar (tidak ada regresi visual).

Effort: 1–2 jam
Deliverable: `npx tsc --noEmit` keluar 0 error, tabel employee jalan normal.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical, no over-engineering)
```

---

### #2 — Resolve 8 High Severity Security Vulnerabilities

```
Kerjakan action #2 (High Priority):
Resolve 8 High severity vulnerabilities dari `npm audit`

Context:
- `npm audit` melaporkan 8 High, 6 Moderate, 2 Low (total 16).
- 0 Critical, tapi 8 High cukup berisiko untuk app ERP dengan data sensitif.
- Perlu audit manual sebelum `npm audit fix` (bisa break transitive deps).

Task:
1. Jalankan `npm audit` dan baca daftar 8 High — identifikasi package & path.
2. Untuk tiap High: cek apakah ada fix non-breaking (`npm audit fix --dry-run`).
3. Prioritaskan yang di production runtime (bukan dev-only).
4. Jalankan update yang aman, rebuild, jalankan smoke test login + 1 halaman.
5. Dokumentasikan sisa vuln yang butuh major bump di docs/SECURITY_NOTES.md.

Effort: 2–4 jam
Deliverable: 8 High resolved atau documented dengan justification; build hijau.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

### #3 — Refactor JurnalClient.tsx (3486 LOC — God Component)

```
Kerjakan action #3 (High Priority):
Pecah src/app/jurnal-harian-produksi/JurnalClient.tsx (3486 LOC)

Context:
- File terbesar di repo (3.4k LOC). Sulit di-maintain, lambat di-review,
  rawan conflict. Minggu ini sudah di-touch 3x untuk fitur search.
- Mix: state management, tabel, modal, excel import, filter — semua di 1 file.

Task:
1. Profiling: cari batas logis (tabel, filter bar, modal create/edit, excel
   import, search highlight) — ekstrak masing-masing ke sub-component.
2. Buat folder src/app/jurnal-harian-produksi/components/ dengan modul kecil.
3. Pindahkan logic tanpa ubah behavior (1 extract per commit, test manual).
4. Target: file utama < 400 LOC, sisanya di komponen terpisah.

Effort: 1 minggu (pecah bertahap, jangan sekali jalan)
Deliverable: JurnalClient.tsx < 400 LOC, fitur identik, 0 regresi.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail + TDD (test manual tiap extract)
```

---

## 🟡 MEDIUM PRIORITY

### #4 — Reduce 199 console.* Statements

```
Kerjakan action #4 (Medium Priority):
Kurangi 199 console.log/debug statement di src/

Context:
- 199 console.* di production code — noise log, bisa bocor data sensitif,
  dan memperlambat runtime di browser.
- Sebagian besar kemungkinan leftover debug dari fitur search/import.

Task:
1. `grep -rn "console\." src/` — kategorikan: debug leftover vs intentional.
2. Hapus debug leftover; untuk yang perlu (error handling) ganti dengan
   logger terpusat atau biarkan console.error minimal.
3. Pertimbangkan eslint rule `no-console` (warn) di eslint.config.mjs.
4. Target: < 30 console.* tersisa (semua intentional error/warning).

Effort: 2–4 jam
Deliverable: ~170 console.* dihapus, eslint no-console aktif (warn).

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

### #5 — Update 4 Major Outdated Packages

```
Kerjakan action #5 (Medium Priority):
Update 4 Major version outdated packages

Context:
- 17 outdated (4 Major, 6 Minor, 7 Patch). Major: typescript 5.9->7.0,
  eslint 9->10, lucide-react 0.575->1.24, @types/node 20->26.
- Major bump butuh verifikasi breaking change — jangan asal `npm up`.

Task:
1. typescript 5.9->7: cek changelog, jalankan tsc, fix strict errors baru.
2. eslint 9->10 + eslint-config-next: jalankan lint, fix rule changes.
3. lucide-react 0.575->1.24: cek renamed/deleted icons, grep pemakaian.
4. @types/node 20->26: pastikan Next 16 compatible.
5. Build + dev smoke test setelah tiap bump.

Effort: 1–2 hari
Deliverable: 4 Major ter-update, build & lint hijau, 0 icon missing.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

### #6 — Split TrackingClient.tsx (2340 LOC) & HasilProduksiClient (1461 LOC)

```
Kerjakan action #6 (Medium Priority):
Pecah 2 god-component: TrackingClient.tsx (2340) & HasilProduksiClient.tsx (1461)

Context:
- TrackingClient urutan ke-2 terbesar, HasilProduksiClient ke-4.
- Sama polanya dengan JurnalClient — state + tabel + modal + import campur.

Task:
1. Mirip #3: ekstrak sub-komponen ke folder components/ per-fitur.
2. TrackingClient target < 500 LOC; HasilProduksiClient target < 400 LOC.
3. Test manual: tracking view + hasil produksi render benar.

Effort: 3–4 hari (2 file)
Deliverable: Kedua file di bawah threshold, fitur identik.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

## 🟢 LOW PRIORITY

### #7 — Investigate ESLint Timeout (>60s)

```
Kerjakan action #7 (Low Priority):
Investigasi kenapa `npm run lint` timeout >60s

Context:
- Lint tidak selesai dalam 60s di environment ini — bisa tanda project
  makin besar atau config tidak efisien (flat config, plugin berat).

Task:
1. Jalankan lint dengan `--timeout` lebih besar untuk lihat apakah selesai.
2. Cek eslint.config.mjs — apakah ada plugin yang scan node_modules.
3. Pertimbangkan lint-staged / cache agar lebih cepat.
4. Catat baseline waktu di docs.

Effort: 1–2 jam
Deliverable: Lint selesai < 60s atau documented bottleneck + rekomendasi.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

### #8 — Apply Patch/Minor Dependency Updates

```
Kerjakan action #8 (Low Priority):
Apply 13 Minor + Patch outdated packages

Context:
- 6 Minor (next, tailwindcss, eslint-config-next, recharts, @tailwindcss/postcss,
  tsx) + 7 Patch (@libsql/client, @tanstack/react-virtual, @types/react,
  jose, jspdf-autotable, react, react-dom).
- Low risk, aman di-bump rutin.

Task:
1. `npm update` (minor+patch safe) atau bump manual per group.
2. Build + smoke test (login, 1 halaman per modul utama).
3. Catat di CHANGELOG jika ada behavior change (tailwind/recharts).

Effort: 1–2 jam
Deliverable: 13 package ter-update, build hijau.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

## 📅 SPRINT PLANNING

### Week 1 — Quick Wins

```
Sprint Week 1 (2026-07-15 s/d 2026-07-22):

Goal: Stabilisasi & security quick wins (build hijau + vuln turun)

Tasks:
1. #1 Fix TS errors EmployeeTable — 2h
2. #2 Resolve 8 High vuln — 4h
3. #8 Patch/Minor deps update — 2h
4. #4 Reduce console.log (sebagian) — 2h

Total: ~10 jam
Deliverable: tsc 0 error, 8 High resolved, build & lint bisa jalan.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

### Week 2 — Foundation

```
Sprint Week 2 (2026-07-22 s/d 2026-07-29):

Goal: Dependency foundation & lint health

Tasks:
1. #5 Major package updates (typescript/eslint/lucide/@types/node) — 1.5h
2. #7 Investigate lint timeout + cache — 2h
3. #4 Selesaikan console.log cleanup + eslint no-console — 2h

Total: ~1.5 hari
Deliverable: Semua deps current, lint < 60s, console.* < 30.

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

### Week 3 — Big Impact

```
Sprint Week 3 (2026-07-29 s/d 2026-08-05):

Goal: God-component refactor (maintainability)

Pre-requisite: #1, #2 selesai (build stabil sebelum refactor besar)

Tasks:
1. #3 Refactor JurnalClient.tsx (3486-><400) — 1 minggu (bertahap)
2. #6 Mulai split TrackingClient.tsx — 2 hari

Total: ~1.5 minggu (overlap dengan Week 4)
Deliverable: JurnalClient pecah, TrackingClient mulai dipecah.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail + TDD
```

---

### Week 4 — Quality

```
Sprint Week 4 (2026-08-05 s/d 2026-08-12):

Goal: Selesaikan refactor & polish

Tasks:
1. #6 Selesaikan TrackingClient + HasilProduksiClient — 2 hari
2. Final smoke test semua modul utama (JHP, tracking, hasil produksi, log)
3. Doc: tulis panduan struktur komponen di docs/REFACTOR_GUIDE.md

Total: ~1 minggu
Deliverable: 3 god-component dipecah, panduan maintainability ada.

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

## 📝 Usage Notes

**Format:**
- 1 task = 1 code block
- Long-press → Copy (Telegram/mobile)
- Click copy button (desktop)

**File Archival:**
- Git-tracked di docs/
- Reference untuk weekly priorities
- File baru setiap Jumat 09:00

**Template Convention:**
- Context: Business justification
- Task: Step-by-step actionable items
- Effort: Realistic time estimate
- Deliverable: Clear success criteria
- Mode: Ponytail = efficient, practical, no unnecessary abstraction
