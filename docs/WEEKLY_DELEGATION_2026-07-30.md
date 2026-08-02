# Delegation Templates — Week of 2026-07-30

Generated: 2026-07-30 12:05 WIB
Total: 2 High, 3 Medium, 3 Low Priority Tasks

---

## 🔴 HIGH PRIORITY

### #1 — Fix TypeScript Test Compilation Errors

```
Kerjakan action #1 (High Priority):
Fix TypeScript compilation errors in test/activity-log-url.test.ts

Context:
- tsc --noEmit reports 3 TS2345 errors in test/activity-log-url.test.ts
- Test function signature changed (added required fields: tableName, actionType, recordedBy, search)
- Tests are failing to compile, blocking CI/CD quality gate

Task:
1. Open test/activity-log-url.test.ts
2. Update the function calls at lines 146, 152, 159 to include missing required fields
3. Add tableName, actionType, recordedBy, search parameters (can use empty string for existing tests)
4. Verify: run `npx tsc --noEmit` — expect 0 errors

Effort: 30 minutes
Deliverable: Clean TypeScript compilation, 0 errors

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail (efficient, practical, no over-engineering)
```

### #2 — Address High-Severity Security Vulnerabilities

```
Kerjakan action #2 (High Priority):
Address critical/high security vulnerabilities in npm dependencies

Context:
- npm audit reports 23 vulnerabilities: 3 low, 5 moderate, 15 high
- High severity: axios DoS (excessive recursion in formDataToJSON), xlsx prototype pollution (no fix)
- xlsx has NO fix available — needs evaluation of alternative or risk acceptance
- 15 high-severity issues is concerning for a production ERP system

Task:
1. Run `npm audit fix` to resolve fixable vulnerabilities
2. For xlsx: evaluate if SheetJS usage can be replaced with exceljs (already a dependency) or if risk is acceptable
3. For axios: check if direct dependency, update if possible
4. Document remaining unfixed vulnerabilities in docs/SECURITY_AUDIT.md
5. Verify: `npm audit` should show reduced severity after fix

Effort: 2-3 hours
Deliverable: Reduced vulnerability count, security audit document

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail — practical approach, don't over-engineer the audit
```

---

## 🟡 MEDIUM PRIORITY

### #3 — Refactor JurnalClient.tsx (3288 LOC)

```
Kerjakan action #3 (Medium Priority):
Refactor src/app/jurnal-harian-produksi/JurnalClient.tsx — largest file at 3288 LOC

Context:
- Largest file in codebase at 3288 LOC, well above 500 LOC threshold
- Contains jurnal harian produksi UI logic — likely a candidate for component splitting
- High LOC increases maintenance burden and merge conflict risk

Task:
1. Analyze JurnalClient.tsx to identify logical sections (forms, tables, modals, filters)
2. Extract sub-components: filter panel, data table, form modal into separate files
3. Keep JurnalClient.tsx as orchestrator only
4. Verify: `npm run build` passes, manual smoke test

Effort: 1 day
Deliverable: JurnalClient.tsx reduced to ~500 LOC, sub-components in separate files

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail — extract only when there's clear separation, no premature abstraction
```

### #4 — Update Outdated Major Dependencies

```
Kerjakan action #4 (Medium Priority):
Evaluate and update major version dependencies

Context:
- 20 outdated packages, 3 are major version bumps:
  - better-sqlite3: 12.11.1 → 13.0.2 (native SQLite binding)
  - eslint: 9.39.3 → 10.8.0 (linting)
  - @types/node: 20.19.35 → 26.1.2 (Node.js types)
- Major bumps may have breaking changes

Task:
1. Check changelogs for better-sqlite3 v13 — assess breaking changes for local SQLite usage
2. Check eslint v10 — verify eslint.config.mjs compatibility
3. Update @types/node to latest (usually safe)
4. For each: update in package.json, run `npm install`, verify `npm run build`
5. Document any breaking changes encountered

Effort: 2-3 hours
Deliverable: Dependencies updated, build passing, changelog notes

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail — update one at a time, test between each
```

### #5 — Cleanup 48 Console.log Statements

```
Kerjakan action #5 (Medium Priority):
Remove console.log/debug/info statements from production code

Context:
- 48 console.log statements found in src/
- Production ERP should not have debug logs leaking to server console
- Many may be leftover from development/debugging sessions

Task:
1. Run `grep -rn "console\.\(log\|debug\|info\)" src/ --include="*.ts" --include="*.tsx"` to list all
2. Categorize: intentional logging (keep) vs debug leftovers (remove)
3. For intentional ones: consider using a proper logger or remove if not needed
4. Remove debug leftovers
5. Verify: `npm run build` passes

Effort: 1-2 hours
Deliverable: Clean console output in production

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail — don't add a logger library, just clean up unnecessary ones
```

---

## 🟢 LOW PRIORITY

### #6 — Refactor TrackingClient.tsx (1895 LOC)

```
Kerjakan action #6 (Low Priority):
Refactor src/app/tracking-manufaktur/TrackingClient.tsx

Context:
- Second largest file at 1895 LOC
- Recently modified in performance audit commit
- May benefit from same component extraction pattern as JurnalClient

Task:
1. Analyze TrackingClient.tsx for logical component boundaries
2. Extract sub-components where clear separation exists
3. Target: reduce to ~600-800 LOC

Effort: 4-6 hours
Deliverable: Cleaner component structure

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail — only extract if there's natural boundary
```

### #7 — Refactor Schema.ts (1703 LOC)

```
Kerjakan action #7 (Low Priority):
Evaluate src/lib/schema.ts structure (1703 LOC)

Context:
- Schema file is 1703 LOC — this is expected for a database schema definition
- Contains table definitions, migrations, triggers
- May not need refactoring if it's mostly declarative

Task:
1. Review schema.ts structure
2. If it's mostly table definitions: no refactor needed (this is normal for schema files)
3. If there's procedural logic mixed in: extract to separate migration files
4. Document decision

Effort: 1-2 hours (mostly analysis)
Deliverable: Decision documented, refactor if warranted

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail — don't refactor what doesn't need it
```

### #8 — Audit Database Size (475 MB Production)

```
Kerjakan action #8 (Low Priority):
Audit production database size and plan cleanup

Context:
- database.sqlite is 475 MB (+ 87 MB WAL)
- database_dev.sqlite is 485 MB (+ 62 MB WAL)
- Large database affects backup time, deployment speed, and dev experience

Task:
1. Run `sqlite3 database.sqlite ".tables"` to list tables
2. Check largest tables: `SELECT name, pgsize FROM dbstat ORDER BY pgsize DESC LIMIT 10`
3. Identify candidates for archival (old logs, historical data)
4. Document recommendations in docs/DATABASE_CLEANUP.md
5. DO NOT run cleanup without approval — just document

Effort: 1-2 hours
Deliverable: Database size audit report with recommendations

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail — analyze only, don't touch production data
```

---

## 📅 SPRINT PLANNING

### Week 1 — Quick Wins (2026-07-30 → 2026-08-05)

```
Sprint Week 1 (2026-07-30 → 2026-08-05):

Goal: Fix critical issues and clean up immediate technical debt

Tasks:
1. Fix TypeScript test errors (30 min) — #1 High
2. Address security vulnerabilities with npm audit fix (1-2 hours) — #2 High
3. Cleanup console.log statements (1-2 hours) — #5 Medium

Total: 3-4 hours
Deliverable: Clean build, reduced vulnerabilities, no debug logs

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail
```

---

### Week 2 — Foundation (2026-08-06 → 2026-08-12)

```
Sprint Week 2 (2026-08-06 → 2026-08-12):

Goal: Update dependencies and evaluate database health

Tasks:
1. Update major dependencies one by one (2-3 hours) — #4 Medium
2. Audit database size and document cleanup plan (1-2 hours) — #8 Low
3. Verify all changes with full build + lint (30 min)

Total: 4-6 hours
Deliverable: Updated dependencies, database audit report

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail — update dependencies carefully, test between each
```

---

### Week 3 — Big Impact (2026-08-13 → 2026-08-19)

```
Sprint Week 3 (2026-08-13 → 2026-08-19):

Goal: Major component refactoring for maintainability

Pre-requisite: Weeks 1 & 2 completed (clean build, updated deps)

Tasks:
1. Refactor JurnalClient.tsx (1 day) — #3 Medium
2. Refactor TrackingClient.tsx (4-6 hours) — #6 Low

Total: 1.5 days
Deliverable: Two largest files reduced to manageable size

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail + TDD — extract components, verify each with build
```

---

### Week 4 — Quality (2026-08-20 → 2026-08-26)

```
Sprint Week 4 (2026-08-20 → 2026-08-26):

Goal: Schema analysis and final quality polish

Tasks:
1. Evaluate schema.ts structure (1-2 hours) — #7 Low
2. Run full lint + type check, fix any new issues (1 hour)
3. Update docs with session summary (30 min)

Total: 3-4 hours
Deliverable: Clean codebase, updated documentation

Workdir: D:\Projects\sintak_pt_buya_barokah
Mode: Ponytail — analyze schema, don't over-refactor
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
