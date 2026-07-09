# 📊 SINTAK Weekly Intelligence
**Periode**: 27 Juni – 4 Juli 2026  
**Tanggal Analisis**: 4 Juli 2026

---

## 📈 Metrics Codebase

| Metrik | Jumlah |
|--------|--------|
| **Total Files (TS/TSX)** | 316 |
| **Components** | 40 |
| **API Routes** | 125 |
| **Lib Utilities** | 33 |
| **Commits (30 hari)** | 109 |
| **Commits (7 hari)** | 20 |
| **Console.log Statements** | 264 |
| **Ponytail Comments** | 30+ |

---

## 🎯 Prioritized Tasks (Top 5)

### 1. Refactor JurnalClient.tsx — Split Jadi 3-4 Sub-Components
**Effort**: 6-8 jam  
**Impact**: HIGH | **Complexity**: MEDIUM  

**Reasoning**:
- File terbesar: **3,423 baris** — maintainability nightmare
- Sudah pakai virtual scroll, tapi logic masih monolitik
- Sudah ada 23 `useMemo`/`useCallback` — sign of over-complexity
- CEK_PAGE_SIZE = 50 dengan comment "upgrade ke virtual scroll jika > 10k baris" — tapi virtual scroll sudah ada

**Action Plan**:
```
src/app/jurnal-harian-produksi/
├── JurnalClient.tsx (main orchestrator, 800 baris max)
├── components/
│   ├── JurnalTable.tsx (table + virtual scroll logic)
│   ├── JurnalFilters.tsx (date, bagian, search, dll)
│   ├── JurnalToolbar.tsx (buttons: reload, cek karyawan, reset sort)
│   └── JurnalModals.tsx (all modals grouped)
```

**Win**: Faster Hot Reload, easier testing, mengurangi mental load saat debug.

---

### 2. Cleanup Console.log — 264 Statements → <50
**Effort**: 3-4 jam  
**Impact**: MEDIUM | **Complexity**: LOW  

**Reasoning**:
- 264 console.log scattered di 48 files
- Production logs bisa leak sensitive data (lihat `scripts/`, `telegram-bot/`)
- Logger utility (`src/lib/logger.ts`) sudah ada tapi jarang dipakai

**Action Plan**:
1. Ganti semua `console.log` di `src/app/api/` dengan conditional logger:
   ```ts
   if (process.env.NODE_ENV === 'development') console.log(...)
   ```
2. Ganti `console.error` di error handlers dengan logger utility
3. Hapus debug logs di client components (kecuali wrapped `if (DEV_MODE)`)

**Win**: Cleaner production bundle, no data leaks, professional error handling.

---

### 3. Audit dangerouslySetInnerHTML — 48 Usage Sites
**Effort**: 2-3 jam  
**Impact**: HIGH (Security) | **Complexity**: LOW  

**Reasoning**:
- 48 occurrences di Client components (BOM, Barang Jadi, Bahan Baku, dll.)
- Kemungkinan besar untuk render HTML dari Digit (nama produk, keterangan)
- XSS risk jika data tidak di-sanitize

**Action Plan**:
1. Audit tiap usage: apakah data berasal dari user input atau trusted source (Digit)?
2. Jika dari Digit (trusted): OK, tapi tambah comment `// Safe: dari Digit, no user input`
3. Jika ada user input: ganti dengan sanitizer library (DOMPurify) atau plain text
4. Dokumentasikan pattern di `DEV_RULES.md`

**Win**: Security hardening, audit trail untuk compliance.

---

### 4. TrackingClient.tsx Performance — Lazy Load Cards + Pagination
**Effort**: 4-5 jam  
**Impact**: MEDIUM | **Complexity**: MEDIUM  

**Reasoning**:
- File kedua terbesar: **2,339 baris**
- Render 11 `useMemo`/`useCallback` — heavy computation
- Pipeline view bisa render ratusan cards sekaligus (BOM → SO → PR → SPPH → SPH → PO → PB → RPB → PH)
- Sudah ada `[content-visibility:auto]` di card CSS, tapi no pagination

**Action Plan**:
1. Tambah pagination/infinite scroll: render 20 pipeline items per load
2. Lazy load collapsed sections: jangan fetch detail sampai user expand
3. Debounce search filter (sekarang langsung re-filter tiap keystroke)

**Win**: Faster initial render, smooth UX untuk dataset besar (500+ orders).

---

### 5. Setup Automated DB Backup ke Cloud Storage
**Effort**: 3-4 jam  
**Impact**: HIGH | **Complexity**: LOW  

**Reasoning**:
- Backlog item sejak 2026-06-24 (10 hari lalu)
- Tidak ada DB files di repo (`.gitignore`-ed) — data loss risk tinggi
- Sudah ada `scripts/checkpoint-db.ts` tapi manual execution
- Production pakai Turso (cloud), tapi development pakai lokal SQLite

**Action Plan**:
1. Buat cron job (`npm run backup-db`) yang zip `database*.sqlite` + upload ke S3/Cloudflare R2
2. Schedule via Vercel Cron (harian jam 03:00 WIB)
3. Keep 7 hari backup, auto-delete older files
4. Tambah health check: kirim notif Telegram jika backup gagal

**Win**: Data safety net, compliance-ready, sleep better at night.

---

## 🔧 Technical Debt

### Priority 1 (Urgent)
- **264 console.log statements** — production data leak risk
- **48 dangerouslySetInnerHTML** — XSS vulnerability audit needed
- **No automated DB backup** — data loss risk

### Priority 2 (Medium)
- **JurnalClient.tsx (3,423 lines)** — maintainability bottleneck
- **TrackingClient.tsx (2,339 lines)** — performance bottleneck untuk large datasets
- **Global search employees table** — masih simplified setelah schema verification loop (Phase 4 stalled)

### Priority 3 (Low)
- **Virtual scroll comment mismatch** — JurnalClient sudah pakai @tanstack/react-virtual, tapi ada comment "upgrade jika > 10k"
- **Activity log trend chart** — 4 ponytail comments tentang drill-down false triggers (fixed tapi banyak workarounds)

---

## 💡 Quick Wins (Selesai dalam <2 jam)

1. **Hapus `icon.png.bak` dari `src/app/`** — unused file, cuma bloat repo
2. **Tambah JSDoc di utility functions** — `src/lib/date-utils.ts`, `src/lib/utils/date-formatters.ts` tidak ada docs
3. **Unify date parsing logic** — ada 3 parser berbeda: `parseIndoDate`, `parseLooseDate`, `formatMdtDate` (TrackingClient.tsx:32-43)
4. **Enable TypeScript strict mode** — `tsconfig.json` belum strict, bisa catch hidden bugs
5. **Add loading states to scraper buttons** — beberapa scraper di `src/app/*/` tidak show loading indicator saat scraping

---

## ⚠️ Blockers / Risks

### 🔴 High Priority
1. **Global Search Employees Table Incomplete**  
   - Phase 4 global search improvements stalled karena schema verification loop
   - Employees query simplified jadi single-table, no UNION
   - Orders/PO/SO/PR tables dihapus temporary untuk unblock
   - **Risk**: Search coverage incomplete, user tidak bisa cari Orders dari global search
   - **Mitigation**: Re-verify schema dengan `PRAGMA table_info(orders)` sebelum re-add UNION queries

### 🟡 Medium Priority
2. **Hermes Gateway Telegram Deployment Gagal**  
   - Adapter hang di "Discovering Telegram API fallback IPs via DNS-over-HTTPS"
   - Bot token valid, network OK, tapi DoH discovery timeout
   - **Workaround**: Manual trigger via laptop gateway atau custom script
   - **Note**: Tidak blocker untuk development, tapi notifikasi cron jobs tidak deliver

### 🟢 Low Priority
3. **Auto-Generate Jadwal Accuracy Belum Dievaluasi**  
   - Fitur sudah live sejak 2026-06-17 (17 hari lalu)
   - Feedback table (`generate_feedback`) sudah ada tapi belum ada iterasi algoritma
   - **Risk**: User mungkin tidak pakai fitur karena hasil generate tidak akurat

---

## 📊 Insights & Trends

### Positive
✅ **Ponytail approach working well** — 30+ documented design decisions dengan keterbatasan jelas  
✅ **DB indexing comprehensive** — 129 lines of indexes, `PRAGMA optimize` included  
✅ **Recent activity focused** — 20 commits dalam 7 hari terakhir, momentum bagus  
✅ **Modern stack adopted** — Next.js 16, React 19, Tailwind 4, TypeScript 5  

### Areas for Improvement
⚠️ **Large component files** — Top 3 client files: 3,423 + 2,339 + 1,461 lines  
⚠️ **Console.log overuse** — 264 statements, banyak di API routes  
⚠️ **No component testing** — Tidak ada test files di repo  
⚠️ **Documentation gaps** — Utility functions tidak ada JSDoc, inline comments minimal  

---

## 🚀 Recommendation Summary

**Minggu depan prioritaskan:**
1. **Security audit** (dangerouslySetInnerHTML) — 2-3 jam, high impact
2. **Console.log cleanup** — 3-4 jam, medium impact, easy win
3. **DB backup automation** — 3-4 jam, high impact, compliance-ready

**Sprint berikutnya (2 minggu):**
1. **Refactor JurnalClient.tsx** — 6-8 jam, maintainability boost
2. **TrackingClient.tsx performance** — 4-5 jam, UX improvement
3. **Complete global search Phase 4** — 2-3 jam, feature completion

**Long-term (backlog):**
- Setup testing framework (Vitest + Testing Library)
- Add JSDoc/TSDoc untuk public APIs
- Evaluate auto-generate jadwal accuracy dengan real user feedback

---

**Total effort untuk Top 5 tasks**: 18-24 jam (3 hari kerja fokus)  
**Quick wins total**: <10 jam (1 hari santai)

---

_Generated by Hermes Agent Weekly Intelligence_  
_Next review: 11 Juli 2026 (Jumat)_
