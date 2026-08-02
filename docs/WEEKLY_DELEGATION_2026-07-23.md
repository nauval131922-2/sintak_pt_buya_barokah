# Delegation Templates — Week of 2026-07-16

Generated: 2026-07-23 09:50 WIB
Total: 3 High, 4 Medium, 3 Low Priority Tasks

---

## 🔴 HIGH PRIORITY

### #1 — Fix TypeScript Test Errors (3 errors)

```
Kerjakan action #1 (High Priority):
Fix TypeScript compilation errors in test files

Context:
- Running `npx tsc --noEmit` reveals 3 TS errors in test/activity-log-url.test.ts
- All errors are type mismatches: missing required fields (tableName, actionType, recordedBy, search) in test function calls
- This breaks CI/CD type checking

Task:
1. Open test/activity-log-url.test.ts
2. Locate lines 146, 152, 159
3. Add missing required fields to each test call object:
   - tableName: '' (empty string)
   - actionType: '' (empty string)
   - recordedBy: '' (empty string)
   - search: '' (empty string)
4. Run `npx tsc --noEmit` to verify 0 errors
5. Run `npx vitest run` to verify tests still pass

Effort: 15 minutes
Deliverable: `npx tsc --noEmit` exits with 0 errors

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical, no over-engineering)
```

---

### #2 — Fix SheetJS Security Vulnerabilities

```
Kerjakan action #2 (High Priority):
Address SheetJS (xlsx) security vulnerabilities

Context:
- npm audit shows 23 vulnerabilities, 14 are HIGH severity
- SheetJS has Prototype Pollution (GHSA-4r6h-8v6p-xvw6) and ReDoS (GHSA-5pgg-2g8v-p4x9)
- No fix available in current xlsx package — "No fix available" per npm audit
- This is the single biggest security risk in the project

Task:
1. Search codebase for xlsx/SheetJS usage: `grep -rn "xlsx\|SheetJS\|XLSX" src/ scripts/`
2. If usage is limited to Excel export:
   - Evaluate switching to alternative (e.g., exceljs, or native Blob API for CSV)
3. If xlsx is deeply embedded:
   - Check if there's a newer version or fork that fixes the issues
   - Consider pinning xlsx and adding a note to security documentation
4. Document findings in docs/SECURITY_NOTES.md

Effort: 2-4 hours (investigation + potential migration)
Deliverable: Security vulnerability addressed OR documented mitigation plan

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical, no over-engineering)
```

---

### #3 — Reduce ESLint `no-explicit-any` Warnings

```
Kerjakan action #3 (High Priority):
Reduce the 1,876 `@typescript-eslint/no-explicit-any` warnings

Context:
- ESLint reports 0 errors but 1,876 warnings (ALL are no-explicit-any)
- 188 files contain `any` type usage
- This masks real warnings and makes lint output noisy
- Most are likely in API routes and type definitions

Task:
1. Run `npx eslint src/ --format json` and export to a temp file
2. Identify top 10 files with most `any` warnings
3. For each file, replace `any` with proper types where feasible:
   - Request/Response bodies → define interfaces
   - Database results → use schema types from src/lib/schema.ts
   - Callback params → use generic types
4. For cases where `any` is genuinely needed, add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with comment
5. Target: reduce from 1,876 to <500 warnings
6. Run `npx eslint src/` to verify improvement

Effort: 4-8 hours (systematic, file by file)
Deliverable: <500 ESLint warnings (from 1,876)

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical, no over-engineering)
```

---

## 🟡 MEDIUM PRIORITY

### #4 — Refactor JurnalClient.tsx (3,249 LOC)

```
Kerjakan action #4 (Medium Priority):
Refactor JurnalClient.tsx — largest file in codebase

Context:
- JurnalClient.tsx is 3,249 LOC — 5.4% of entire codebase in one file
- This is the #1 candidate for refactoring
- Already partially refactored (0e598c0 extracted helper & editable cell)

Task:
1. Read src/app/jurnal-harian-produksi/JurnalClient.tsx fully
2. Identify logical sections that can be extracted:
   - Table columns definition → jurnal-columns.tsx
   - Form/edit components → jurnal-forms.tsx
   - Data transformation helpers → jurnal-helpers.ts
   - Filter/sort logic → jurnal-filters.tsx
3. Extract each section to its own file
4. Ensure all imports are updated
5. Run `npx vitest run` to verify no regressions
6. Target: reduce JurnalClient.tsx to <1,500 LOC

Effort: 1-2 days
Deliverable: JurnalClient.tsx <1,500 LOC, all tests pass

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical, no over-engineering)
```

---

### #5 — Refactor TrackingClient.tsx (1,868 LOC)

```
Kerjakan action #5 (Medium Priority):
Refactor TrackingClient.tsx — 2nd largest file

Context:
- TrackingClient.tsx is 1,868 LOC
- Was partially refactored last week (2d562b5 extracted helpers, styles & components)
- Still too large for maintainability

Task:
1. Read src/app/tracking-manufaktur/TrackingClient.tsx fully
2. Identify remaining extractable sections:
   - Status badges/renderers → tracking-badges.tsx
   - Timeline components → tracking-timeline.tsx
   - Data filtering logic → tracking-filters.tsx
3. Extract to separate files
4. Update imports
5. Run `npx vitest run` to verify no regressions
6. Target: reduce to <1,000 LOC

Effort: 4-8 hours
Deliverable: TrackingClient.tsx <1,000 LOC, all tests pass

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical, no over-engineering)
```

---

### #6 — Update Major Dependencies (TypeScript 7.0, ESLint 10, etc.)

```
Kerjakan action #6 (Medium Priority):
Plan and execute major dependency updates

Context:
- 5 major version bumps available:
  - @types/node: 20 → 26
  - better-sqlite3: 12 → 13
  - eslint: 9 → 10
  - lucide-react: 0.575 → 1.25
  - typescript: 5.9 → 7.0
- These are breaking changes and need careful evaluation

Task:
1. Create a branch: `git checkout -b chore/major-deps-update`
2. Update one major dependency at a time:
   a. TypeScript 5.9 → 7.0 first (most impactful, check for new errors)
   b. Run `npx tsc --noEmit` after each update
   c. Run `npx vitest run` after each update
3. For lucide-react: check if icon names changed (common breaking change)
4. For eslint 10: check config compatibility with eslint.config.mjs
5. Document any breaking changes found
6. Only merge if all tests pass

Effort: 1-2 days (careful, incremental updates)
Deliverable: All major deps updated, 0 new errors

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical, no over-engineering)
```

---

### #7 — Clean Up 196 Console.log Statements

```
Kerjakan action #7 (Medium Priority):
Remove debug console.log statements from production code

Context:
- 196 console.log/warn/error statements found in src/
- These pollute production logs and can leak sensitive data
- Should be replaced with proper logging or removed entirely

Task:
1. Run `grep -rn "console\.log\|console\.warn\|console\.error" src/` to list all
2. Categorize:
   - Debug logs (remove): `console.log("DEBUG: ...")`, `console.log(data)`
   - Error handling (keep or upgrade): `console.error(...)` in catch blocks
   - Intentional logging (keep): structured logs for monitoring
3. For each debug log:
   - If in a try/catch: remove entirely (error is already thrown)
   - If for debugging: remove entirely
   - If for monitoring: replace with structured logger if available
4. Run `npx vitest run` to verify no regressions
5. Target: reduce from 196 to <20

Effort: 2-4 hours
Deliverable: <20 console statements remaining, no debug noise

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical, no over-engineering)
```

---

## 🟢 LOW PRIORITY

### #8 — Add Database Indexes for Slow Queries

```
Kerjakan action #8 (Low Priority):
Analyze and optimize database performance

Context:
- Production DB is 437 MB, dev DB is 468 MB (growing)
- No performance monitoring currently in place
- Large tables likely need indexes for common queries

Task:
1. Check existing indexes: query sqlite_master for INDEX entries
2. Identify slow queries by checking schema.ts for query patterns
3. Add composite indexes for high-traffic tables:
   - activity_logs: (table_name, created_at)
   - jurnal_harian_produksi: (tanggal, status)
   - orders: (created_at, status)
4. Use IF NOT EXISTS to avoid duplicate index creation
5. Document new indexes in schema.ts comments

Effort: 2-4 hours
Deliverable: Database query performance improved, indexes documented

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical, no over-engineering)
```

---

### #9 — Refactor schema.ts (1,644 LOC)

```
Kerjakan action #9 (Low Priority):
Break up schema.ts into logical modules

Context:
- schema.ts is 1,644 LOC — contains all table definitions, types, and init logic
- Already has deduplication (f5b8feb), but still monolithic
- Makes it hard to find specific table definitions

Task:
1. Read src/lib/schema.ts fully
2. Split into:
   - src/lib/schema/tables.ts — CREATE TABLE statements
   - src/lib/schema/types.ts — TypeScript type definitions
   - src/lib/schema/migrations.ts — ALTER TABLE logic
   - src/lib/schema/index.ts — re-export everything
3. Update all imports across codebase
4. Verify `npm run init-db` still works
5. Run `npx vitest run` to verify no regressions

Effort: 4-8 hours
Deliverable: schema.ts <500 LOC, modular structure

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical, no over-engineering)
```

---

### #10 — Add Vitest Coverage Reporting

```
Kerjakan action #10 (Low Priority):
Set up test coverage reporting

Context:
- Vitest was added recently (8e4dc9a)
- Tests exist for activity-log, lib utils, date formatters
- No coverage reporting configured

Task:
1. Add coverage config to vitest.config.ts:
   - provider: 'v8'
   - reporter: ['text', 'lcov']
   - include: ['src/lib/**/*.ts']
2. Run `npx vitest run --coverage` to generate initial report
3. Set coverage threshold (start with 30% for lib/)
4. Add coverage script to package.json
5. Document coverage goals in README.md

Effort: 1-2 hours
Deliverable: Coverage report generated, baseline established

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical, no over-engineering)
```

---

## 📅 SPRINT PLANNING

### Week 1 — Quick Wins (2026-07-23 s/d 2026-07-30)

```
Sprint Week 1 (2026-07-23 s/d 2026-07-30):

Goal: Fix critical issues and stabilize codebase

Tasks:
1. Fix TypeScript test errors (#1) — 15 min
2. Clean up console.log statements (#7) — 2-4 hours
3. Add test coverage reporting (#10) — 1-2 hours
4. Investigate SheetJS security (#2) — 2-4 hours

Total: ~6-10 hours
Deliverable: 0 TS errors, clean logs, coverage baseline, security assessment

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail
```

---

### Week 2 — Foundation (2026-07-30 s/d 2026-08-06)

```
Sprint Week 2 (2026-07-30 s/d 2026-08-06):

Goal: Foundation improvements — refactoring and deps

Tasks:
1. Refactor JurnalClient.tsx (#4) — 1-2 days
2. Start reducing ESLint warnings (#3) — 4 hours (first pass)
3. Plan major deps update (#6) — 2 hours (investigation only)

Total: ~1.5-2.5 days
Deliverable: JurnalClient.tsx <1500 LOC, ESLint <1000 warnings, deps plan

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail
```

---

### Week 3 — Big Impact (2026-08-06 s/d 2026-08-13)

```
Sprint Week 3 (2026-08-06 s/d 2026-08-13):

Goal: Major refactoring and dependency updates

Pre-requisite: Week 2 complete (JurnalClient refactored)

Tasks:
1. Refactor TrackingClient.tsx (#5) — 4-8 hours
2. Execute major deps update (#6) — 1-2 days
3. Continue ESLint cleanup (#3) — 4 hours (second pass)

Total: ~2-3 days
Deliverable: All major deps updated, TrackingClient <1000 LOC

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail + careful testing for deps
```

---

### Week 4 — Quality (2026-08-13 s/d 2026-08-20)

```
Sprint Week 4 (2026-08-13 s/d 2026-08-20):

Goal: Quality improvements and optimization

Tasks:
1. Add database indexes (#8) — 2-4 hours
2. Refactor schema.ts (#9) — 4-8 hours
3. Final ESLint cleanup pass (#3) — 4 hours
4. Run full test suite + build verification — 1 hour

Total: ~1.5-2 days
Deliverable: Optimized DB, modular schema, <500 ESLint warnings

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail + TDD for schema refactoring
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
