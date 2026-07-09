# Template Pesan Delegation untuk AI Agent

> Copy-paste template di bawah ke Hermes CLI atau Telegram untuk delegate task dari Weekly Intelligence Report

---

## 🔴 High Priority Tasks

### #1 — Fix ESLint Timeout Issue

```
Kerjakan action item #1 dari weekly report (2026-07-04):

Fix ESLint Performance Issue — Timeout >60s

**Context:**
- Linter timeout menghambat CI/CD dan developer experience
- Developer tidak bisa run lint locally, pre-commit hook terganggu

**Task:**
1. Investigasi eslint.config.mjs — cek file/folder yang di-scan
2. Exclude node_modules, .next, telegram-bot dari scan
3. Review rule yang kompleks (bisa di-disable selektif)
4. Test dengan: npm run lint — target runtime <10 detik
5. Document perubahan di commit message

**Effort:** 2-3 jam
**Deliverable:** ESLint config yang optimized + test result screenshot

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

### #2 — Refactor JurnalClient.tsx (3,423 LOC)

```
Kerjakan action item #2 dari weekly report (2026-07-04):

Refactor JurnalClient.tsx — File terbesar (3,423 LOC)

**Context:**
- File terbesar di codebase, sulit maintain, sering berubah (high churn)
- Sudah ada refactor guide lengkap di docs/REFACTOR_JURNAL_TODO.md

**Task:**
1. Baca docs/REFACTOR_JURNAL_TODO.md
2. Ikuti extraction order step-by-step (Step 1-8)
3. Test setiap step di local dev server (npm run dev)
4. Commit per step (jangan 1 big commit)
5. Verification checklist lengkap di akhir

**Strategy:** Split menjadi:
- components/ (JurnalTable, JurnalFilters, JurnalForm, etc)
- hooks/ (useJurnalData, useJurnalFilters, useJurnalActions)
- utils/ (formatters, constants)

**Effort:** 1-2 hari (3-4 jam termasuk testing)
**Deliverable:** JurnalClient.tsx reduced to ~400 LOC + 7-8 file baru

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail (lazy senior dev — efficient, practical)
```

---

### #3 — Update Security Vulnerabilities (8 High Severity)

```
Kerjakan action item #3 dari weekly report (2026-07-04):

Update Security Vulnerabilities — 8 High Severity

**Context:**
- 16 total vulnerabilities (8 High, 6 Moderate, 2 Low)
- Potensi exploit di production environment

**Task:**
1. Run: npm audit
2. Run: npm audit fix (tanpa --force dulu)
3. Review breaking changes untuk major updates
4. Manual update jika auto-fix gagal:
   - Update @babel/core
   - Update brace-expansion
5. Test regression: npm run dev, npm run build
6. Document packages yang di-update di commit

**Effort:** 1-2 jam
**Deliverable:** npm audit report bersih (0 high vulnerabilities)

⚠️ Note: Review breaking changes sebelum update major versions

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

### #4 — Cleanup 113 Console Statements

```
Kerjakan action item #4 dari weekly report (2026-07-04):

Cleanup 113 Console Statements

**Context:**
- Console.log pollute production logs, performance overhead
- Top files: schema.ts (14), push.ts (10), session-cache.ts (6)

**Task:**
1. Search all console statements: grep -r "console\." src/
2. Replace dengan proper logger (src/lib/logger.ts sudah ada)
3. Prioritas cleanup:
   - src/lib/schema.ts (14 statements)
   - src/lib/push.ts (10)
   - src/lib/session-cache.ts (6)
4. Keep console.error untuk critical errors (optional)
5. Remove debug logs yang tidak perlu

**Effort:** 3-4 jam
**Deliverable:** Console count reduced dari 113 → <20 statements

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

## 🟡 Medium Priority Tasks

### #5 — Refactor TrackingClient.tsx (2,339 LOC)

```
Kerjakan action item #5 dari weekly report (2026-07-04):

Refactor TrackingClient.tsx — File kedua terbesar (2,339 LOC)

**Context:**
- File kedua terbesar, kompleksitas tinggi
- Maintenance burden, harder onboarding

**Task:**
1. Analisa struktur TrackingClient.tsx (read file)
2. Identifikasi section yang bisa di-extract:
   - Tracking states management
   - Filters component
   - Chart components (multiple charts detected)
3. Extract step-by-step (mirip dengan JurnalClient pattern)
4. Test setiap extraction
5. Commit per step

**Strategy:** Extract tracking states, filters, chart components

**Effort:** 1 hari
**Deliverable:** TrackingClient.tsx reduced to ~600 LOC + sub-components

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

### #6 — Update Next.js & React

```
Kerjakan action item #6 dari weekly report (2026-07-04):

Update Next.js 16.1.6 → 16.2.10 & React 19.2.3 → 19.2.7

**Context:**
- Bug fixes, performance improvements, security patches
- Rapid patch releases (active bug fixing)

**Task:**
1. Check changelog: Next.js 16.2.x & React 19.2.7
2. Update package.json dependencies
3. Run: npm install
4. Test critical paths:
   - npm run dev (dev server start)
   - npm run build (production build)
   - Visit main pages: dashboard, jurnal, tracking
5. Check console for deprecation warnings

**Effort:** 1-2 jam
**Deliverable:** Updated deps + verified working app

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

### #7 — Reduce `any` Type Usage (29 Occurrences)

```
Kerjakan action item #7 dari weekly report (2026-07-04):

Reduce any Type Usage — 29 Occurrences

**Context:**
- Type safety loss, runtime errors tidak terdeteksi compile-time
- Better IDE autocomplete, fewer runtime bugs

**Task:**
1. Search all `any` usage: grep -r ": any" src/
2. Prioritas: src/lib dulu (shared utilities)
3. Replace dengan proper types:
   - Define interface untuk data structures
   - Use generics untuk reusable functions
   - Use unknown + type guards untuk uncertain types
4. Incremental approach (jangan semua sekaligus)

**Effort:** 4-6 jam (bisa bertahap)
**Deliverable:** any count reduced dari 29 → <15 occurrences

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

### #8 — Add TypeScript Strict Mode Incrementally

```
Kerjakan action item #8 dari weekly report (2026-07-04):

Add TypeScript Strict Mode Incrementally

**Context:**
- Codebase sudah 0 TypeScript errors, siap untuk strict mode
- Catch more bugs at compile-time, better code quality

**Task:**
1. Enable strict mode per-directory (tsconfig per folder)
2. Phase 1: src/lib (utilities first)
   - Create src/lib/tsconfig.json dengan strict: true
   - Fix violations (nullable checks, implicit any, etc)
3. Test: npx tsc --noEmit
4. Commit per phase
5. Next phases: src/components → src/app

**Effort:** 2-3 hari
**Deliverable:** Phase 1 complete (src/lib strict mode enabled)

⚠️ Note: Mulai dari src/lib, lalu src/components, terakhir src/app

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

## 🟢 Low Priority Tasks

### #9 — Add Unit Tests (0 Test Files)

```
Kerjakan action item #9 dari weekly report (2026-07-04):

Add Unit Tests — Currently 0 Test Files

**Context:**
- No test coverage, regression risk tinggi
- Confidence saat refactor, prevent future bugs

**Task:**
1. Setup test framework (pilihan: Vitest atau Jest)
   - Install dependencies
   - Configure vitest.config.ts atau jest.config.js
2. Write critical path tests:
   - src/lib/auth.ts (authentication logic)
   - src/lib/permissions.ts (authorization)
   - src/lib/session.ts (session management)
3. Run tests: npm run test
4. Add test script ke package.json

**Effort:** 1 minggu (setup + write tests)
**Deliverable:** Test framework setup + 3 test suites (auth, permissions, session)

⚠️ Note: Perlu keputusan framework choice dulu (Vitest vs Jest)

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

### #10 — Add API Documentation (125 Routes)

```
Kerjakan action item #10 dari weekly report (2026-07-04):

Documentation Debt — 48 Docs Files but No API Docs

**Context:**
- Tutorial lengkap tapi API routes tidak terdokumentasi
- 125 API routes tanpa dokumentasi
- Onboarding developer baru lebih lambat

**Task:**
1. Pilih format: OpenAPI/Swagger spec atau manual markdown
2. Prioritas document high-traffic routes:
   - /api/dashboard/*
   - /api/jurnal-harian-produksi/*
   - /api/auth/*
3. Template per route:
   - Method (GET/POST/PUT/DELETE)
   - Path params, query params, body schema
   - Response schema & status codes
   - Auth requirements
4. Generate docs: docs/API.md atau swagger.json

**Effort:** 3-4 hari
**Deliverable:** API documentation untuk 125 routes

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

### #11 — Optimize Bundle Size

```
Kerjakan action item #11 dari weekly report (2026-07-04):

Optimize Bundle Size — Check Heavy Dependencies

**Context:**
- lucide-react major upgrade available (0.575 → 1.23)
- Faster page load, better UX

**Task:**
1. Analyze bundle: npm run build -- --analyze (jika config support)
2. Check lucide-react usage: grep -r "lucide-react" src/
3. Tree-shake unused icons (only import yang dipakai)
4. Before/after bundle size comparison
5. Test: visual regression (semua icon masih muncul)

**Effort:** 2-3 jam
**Deliverable:** Bundle size report + optimization applied

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

## 📋 Multi-Task Delegation (Sprint Planning)

### Week 1 Sprint — Quick Wins

```
Kerjakan sprint Week 1 dari weekly report (2026-07-04):

**Goal:** Quick wins untuk stabilkan codebase

**Tasks:**
1. Fix ESLint timeout (action #1) — 2-3 jam
2. Update security vulnerabilities (action #3) — 1-2 jam
3. Update Next.js & React (action #6) — 1-2 jam

**Total Effort:** 4-7 jam (bisa selesai dalam 1 hari kerja)
**Deliverable:** 3 quick wins completed + test passed

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical)
```

---

### Week 2 Sprint — Foundation

```
Kerjakan sprint Week 2 dari weekly report (2026-07-04):

**Goal:** Setup test framework + Write critical path tests

**Tasks:**
1. Pilih test framework: Vitest (recommended) atau Jest
2. Setup test framework (action #9 Phase 1)
3. Write critical path tests:
   - src/lib/auth.ts
   - src/lib/permissions.ts
   - src/lib/session.ts

**Total Effort:** 1 minggu
**Deliverable:** Test framework setup + 3 test suites passing

⚠️ Note: Perlu approval framework choice sebelum mulai

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

### Week 3 Sprint — Big Impact Refactor

```
Kerjakan sprint Week 3 dari weekly report (2026-07-04):

**Goal:** Refactor JurnalClient dengan test coverage

**Pre-requisite:** Week 2 sprint complete (test framework ready)

**Tasks:**
1. Write tests untuk JurnalClient.tsx existing behavior
2. Refactor JurnalClient.tsx (action #2) step-by-step
3. Run tests setiap step untuk verify no regression
4. Final verification checklist

**Total Effort:** 1-2 hari (dengan test coverage)
**Deliverable:** JurnalClient refactored + all tests passing

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail + TDD (test before refactor)
```

---

### Week 4 Sprint — Quality Improvement

```
Kerjakan sprint Week 4 dari weekly report (2026-07-04):

**Goal:** Code quality improvement

**Tasks:**
1. Console cleanup (action #4) — 3-4 jam
2. TypeScript strict mode Phase 1 (action #8) — 2-3 hari
   - Focus: src/lib only

**Total Effort:** 1 minggu
**Deliverable:** 
- Console count <20 statements
- src/lib dengan strict mode enabled

Workdir: D:\repo github\sintak_pt_buya_barokah
```

---

## 🎯 Custom Delegation Template

```
Kerjakan [task description]:

**Context:**
[business context, why this matters]

**Task:**
1. [step 1]
2. [step 2]
3. [step 3]

**Effort:** [estimasi]
**Deliverable:** [what success looks like]

Workdir: D:\repo github\sintak_pt_buya_barokah
Mode: Ponytail
```

---

## 📝 Usage Notes

1. **Copy template yang sesuai** dari section di atas
2. **Paste ke Hermes CLI** atau Telegram chat
3. **Agent akan execute** sesuai instruction
4. **Review hasil** setelah selesai
5. **Approve atau request changes** jika perlu

**Ponytail Mode** = Lazy senior dev approach:
- Efficient & practical
- Minimum LOC
- Reuse existing patterns
- No premature abstraction
