# Delegation Templates — Week of 2026-07-16

Generated: 2026-07-16 12:02 WIB
Total: 3 High, 3 Medium, 1 Low Priority Tasks

---

## 🔴 HIGH PRIORITY

### #1 — Split & Refactor JurnalClient.tsx (3486 LOC)

```
Kerjakan action #1 (High Priority):
Split & Refactor JurnalClient.tsx (3486 LOC)

Context:
- JurnalClient.tsx adalah file terbesar di codebase (3486 LOC), sangat sulit di-maintain & review.
- Risiko bug tinggi saat perubahan fitur jurnal harian produksi.
- TrackingClient.tsx (2340 LOC) punya pola serupa — perlu strategi serupa setelah ini.

Task:
1. Baca src/app/jurnal-harian-produksi/JurnalClient.tsx secara penuh, petakan section/logical block (tabel, form, modal, filter, export).
2. Ekstrak komponen anak ke folder src/app/jurnal-harian-produksi/components/ (mis. JurnalTable.tsx, JurnalFormModal.tsx, JurnalFilters.tsx, JurnalExport.tsx).
3. Pastikan tidak ada perubahan behavior — gunakan diff test manual (jalankan npm run dev, buka halaman, cek CRUD + export).
4. Jalankan npm run lint dan npx tsc --noEmit sebelum selesai.

Effort: 2-3 hari
Deliverable: JurnalClient.tsx terpecah jadi <400 LOC per file, semua fitur tetap jalan, lint+tsc clean.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical, no over-engineering)
```

---

### #2 — Bersihkan 199 Console Log Statements di src/

```
Kerjakan action #2 (High Priority):
Bersihkan 199 Console Log Statements di src/

Context:
- 199 console.log/error/warn tersebar di production code — noise di browser console & VPS log.
- Sebagian besar kemungkinan leftover debugging. Beberapa perlu diganti logger terstruktur.

Task:
1. Jalankan search_files pattern "console\." di src/ untuk daftar lengkap.
2. Klasifikasi: (a) debug leftover → hapus, (b) error handling penting → ganti ke util logger jika ada, atau biarkan console.error.
3. Hapus kategori (a). Untuk (b) pastikan tidak break error flow.
4. Jalankan npm run lint untuk pastikan tidak ada unused var dari removal.

Effort: 2-4 jam
Deliverable: Sisa console statement hanya yang legit (error handling), lint clean, tanpa regresi.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

### #3 — Patch 4 TypeScript Compilation Errors

```
Kerjakan action #3 (High Priority):
Patch 4 TypeScript Compilation Errors

Context:
- npx tsc --noEmit melaporkan 4 error TS — dapat break build production (prebuild jalan otomatis).
- Perlu di-fix sebelum deploy besar berikutnya.

Task:
1. Jalankan `npx tsc --noEmit` dan catat 4 error + file:line.
2. Baca konteks tiap error, tentukan root cause (typing mismatch / missing null check / wrong import).
3. Fix minimal (ponytail) — jangan refactoring luas, hanya perbaiki type error.
4. Re-run npx tsc --noEmit → harus 0 error.

Effort: 1-2 jam
Deliverable: tsc --noEmit = 0 error, build aman.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

## 🟡 MEDIUM PRIORITY

### #4 — Resolve 8 High + 6 Moderate npm Audit Vulnerabilities

```
Kerjakan action #4 (Medium Priority):
Resolve 8 High + 6 Moderate npm Audit Vulnerabilities

Context:
- npm audit: 8 high, 6 moderate, 2 low (total 16). Tidak ada critical.
- Sebagian besar likely transitive dep — perlu `npm audit fix` + review breaking changes.

Task:
1. Jalankan `npm audit` untuk lihat daftar package & advisory.
2. Jalankan `npm audit fix` (non-breaking dulu).
3. Untuk yang butuh major bump, cek changelog & test aplikasi (npm run dev + smoke test login).
4. Dokumentasikan di AGENTS.md jika ada dep yang sengaja di-pin.

Effort: 1-2 hari (termasuk test)
Deliverable: audit high+moderate = 0 (atau documented exception), app masih jalan.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

### #5 — Upgrade 4 Major Version Outdated Packages

```
Kerjakan action #5 (Medium Priority):
Upgrade 4 Major Version Outdated Packages

Context:
- npm outdated: 4 major, 6 minor, 7 patch (17 total).
- Major bump berisiko breaking — butuh test menyeluruh.

Task:
1. Lihat daftar 4 major outdated via `npm outdated`.
2. Untuk tiap major: baca release notes, cek apakah API yang dipakai berubah.
3. Upgrade satu per satu, jalankan lint + tsc + dev smoke test tiap step.
4. Jika breaking terlalu besar, tunda & catat di backlog.

Effort: 1-2 hari
Deliverable: 4 major ter-upgrade aman, atau backlog terdokumentasi dgn alasan.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

### #6 — Split TrackingClient.tsx (2340 LOC)

```
Kerjakan action #6 (Medium Priority):
Split TrackingClient.tsx (2340 LOC)

Context:
- File ke-2 terbesar (2340 LOC). Sama seperti JurnalClient, sulit di-maintain.
- Lakukan setelah #1 selesai agar pola komponen reusable bisa dipakai ulang.

Task:
1. Baca src/app/tracking-manufaktur/TrackingClient.tsx, petakan block.
2. Ekstrak ke components/ folder terpisah.
3. Smoke test halaman tracking-manufaktur (filter, tabel, navigasi).
4. lint + tsc clean.

Effort: 1-2 hari
Deliverable: TrackingClient.tsx <400 LOC per file, fitur tetap, lint+tsc clean.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

## 🟢 LOW PRIORITY

### #7 — Database Growth Monitoring & Archive Strategy

```
Kerjakan action #7 (Low Priority):
Database Growth Monitoring & Archive Strategy

Context:
- database.sqlite = 432 MB, database_dev.sqlite = 444 MB (per 15 Jul).
- Pertumbuhan dari tabel bervolume tinggi (jurnal, sales, sopd). Perlu strategi archive jangka panjang.

Task:
1. Cek ukuran per tabel (pragma table_info / select count).
2. Identifikasi tabel paling cepat growth.
3. Draft strategi: partition by year, atau archive ke table _archive.
4. Dokumentasikan rekomendasi di docs/ (bukan langsung eksekusi — butuh approval).

Effort: 2-4 jam (analysis + doc)
Deliverable: Dokumen rekomendasi archiving + top growth tables.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

## 📅 SPRINT PLANNING

### Week 1 — Quick Wins

```
Sprint Week 1 (2026-07-16):

Goal: Stabilisasi cepat — bersihkan tech debt kecil & pastikan build aman.

Tasks:
1. #3 Patch 4 TS errors — 2 jam
2. #2 Bersihkan 199 console logs — 3 jam
3. #4 npm audit fix (non-breaking) — 4 jam

Total: ~1 hari
Deliverable: tsc=0, console noise hilang, audit high turun.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

### Week 2 — Foundation

```
Sprint Week 2 (2026-07-23):

Goal: Upgrade dependencies & keamanan.

Tasks:
1. #5 Upgrade 4 major packages — 1.5 hari
2. #4 Sisa audit (breaking fixes) — 0.5 hari

Total: 2 hari
Deliverable: deps up-to-date, 0 high/moderate vuln.

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

### Week 3 — Big Impact

```
Sprint Week 3 (2026-07-30):

Goal: Refactor file raksasa (JurnalClient + TrackingClient).

Pre-requisite: #1 selesai dulu, pola komponen reusable siap.

Tasks:
1. #1 Split JurnalClient.tsx (3486 LOC) — 2.5 hari
2. #6 Split TrackingClient.tsx (2340 LOC) — 1.5 hari

Total: 4 hari
Deliverable: 2 file raksasa terpecah, maintainability naik drastis.

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail + TDD
```

---

### Week 4 — Quality

```
Sprint Week 4 (2026-08-06):

Goal: Database health & dokumentasi long-term.

Tasks:
1. #7 DB growth analysis & archive strategy doc — 0.5 hari

Total: 0.5 hari
Deliverable: Rekomendasi archiving terdokumentasi.

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
