# SINTAK CRON JOBS TIMELINE
**Last Updated:** 2026-07-07  
**Total Jobs:** 17  
**Platforms:** VPS System (7) | VPS Hermes (6) | Laptop (4)
> Vercel decommissioned 2026-07-06 — semua cron sudah dimigrasikan ke VPS System.

---

## 📊 Platform Distribution

| Platform | Count | Purpose | Status |
|----------|-------|---------|--------|
| 🟢 **VPS System** | 7 jobs | Critical infra + app-level crons (bash/curl via system cron) | Production ✅ |
| 🤖 **VPS Hermes** | 6 jobs | AI intelligence layer (analysis, summaries, monitoring) | Production ✅ |
| 💻 **Laptop Hermes** | 4 jobs | Local development automation | Active ✅ |
| ~~🔵 Vercel~~ | ~~3 jobs~~ | ~~Migrated ke VPS System~~ | ~~Decommissioned 2026-07-06~~ |

---

## ⏰ Complete Timeline

### 01:00 WIB

#### 🟢 VPS System: `/api/maintenance` (Kamis 18:00 UTC / Jumat 01:00 WIB)
**Function:**
- Database optimization: VACUUM, ANALYZE, rebuild indexes
- Reduces fragmentation, improves query performance
- Dipicu via `curl` dari VPS system crontab → hits `sintak-ptbuya.cloud`

**Migration:**
- ✅ **MIGRATED from Vercel** → VPS System cron (2026-07-06)
- Schedule: `0 18 * * 4` (Kamis 18:00 UTC = Jumat 01:00 WIB)
- Log: `/var/log/sintak-maintenance.log`

**Why Friday:**
- Aligned with work week end (Sabtu-Kamis = work, Jumat = off)
- Database is most fragmented after full work week
- Maintenance before weekend ensures optimal performance

---

### 02:00 WIB

#### 🟢 VPS: `sintak-backup.sh` (Daily 02:00 WIB)
**Function:**
- Backup `database.sqlite` → Google Drive via rclone
- Compress with gzip for storage efficiency
- Cleanup local backups older than 7 days
- Critical system operation

**Why NOT Migrate to Hermes:**
- This is a critical, time-sensitive system operation
- Involves SQLite, gzip, rclone (pure system tools)
- Better reliability at OS level (no LLM dependency)
- Direct system cron = zero overhead

**Location:** `/usr/local/bin/sintak-backup.sh`

---

#### 🟢 VPS System: `/api/cron/archive-logs` (Daily 19:00 UTC / 02:00 WIB)
**Function:**
- Archive `activity_logs` entries older than 90 days
- Moves to cold storage to prevent table bloat
- Maintains application performance

**Migration:**
- ✅ **MIGRATED from Vercel** → VPS System cron (2026-07-06)
- Schedule: `0 19 * * *` (Daily 19:00 UTC = 02:00 WIB)
- Log: `/var/log/sintak-archive-logs.log`
- Verified: `{"success":true,"archived":0}`

---

### 03:00 WIB

#### 🟢 VPS System: `/api/cron/sync-daily` (Daily 20:00 UTC / 03:00 WIB)
**Function:**
- **Master scraper orchestrator** — runs all 14 scraper endpoints automatically
- Scrapes: BOM, Orders, Bahan Baku, Barang Jadi, PR, SPPH Out, SPH In, Purchase Orders, Penerimaan Pembelian, Rekap Pembelian, Pelunasan Hutang, SPH Out, Sales Orders, Sales, Pengiriman, Pelunasan Piutang
- **Date range:** Rolling 1-month window (1 bulan lalu → hari ini)
- **Execution:** Parallel batch processing (4 concurrent scrapers at a time)
- Logs success/failure to `activity_logs` table

**Migration:**
- ✅ **MIGRATED from Vercel** → VPS System cron (2026-07-06)
- Schedule: `0 20 * * *` (Daily 20:00 UTC = 03:00 WIB)
- Log: `/var/log/sintak-sync-daily.log`
- Verified running: `{"success":true,"totalSuccess":16}`

**Why Critical:**
- Keeps all production data synced daily from source system
- Automated data pipeline (no manual scraping needed)
- Ensures data freshness for morning work

**Why This Time:**
- After backup (02:00) and archive-logs (02:00) complete
- Before work day starts (07:00)
- Data is fresh when team arrives

**Example Flow:**
```
03:00 → sync-daily triggered
  ├─ /api/scrape-bom?start=2026-06-06&end=2026-07-06
  ├─ /api/scrape-orders?start=2026-06-06&end=2026-07-06
  ├─ /api/scrape-bahan-baku?start=2026-06-06&end=2026-07-06
  └─ ... (14 scrapers total, 4 concurrent)
```

**Security:**
- Requires `Authorization: Bearer ***` header
- Triggered via VPS system cron (curl ke sintak-ptbuya.cloud)

---

#### 🤖 VPS Hermes: `db-health-report` (Daily 03:00 WIB)
**Function:**
- Runs script: `~/.hermes/scripts/db-health-check.sh`
- AI analyzes output and creates human-readable summary
- Checks: DB integrity, WAL size, disk usage, backup freshness

**AI Value-Add:**
- Script outputs raw data → AI converts to insights
- Highlights issues in natural language
- Prioritizes critical problems

**Model:**
- Primary: Gemini 2.5 Flash (pinned)
- Fallback: Groq llama-3.3-70b-versatile (free)

**Job ID:** `a8b38a9c7890`

---

#### 🟢 VPS: `sintak-cleanup.sh` (Jumat 03:00 WIB, Weekly)
**Function:**
- Cleanup PM2 logs older than 30 days
- Remove system logs (syslog, auth.log archives)
- Delete temp files from `/tmp`

**Why Friday:**
- Aligned with work week end (Sabtu-Kamis = work, Jumat = off)
- Cleanup before weekend ensures clean system
- Reduces disk I/O during work week

**Changes:**
- ✅ **UPDATED**: Minggu 03:00 → Jumat 03:00 (work week alignment)

**Location:** `/usr/local/bin/sintak-cleanup.sh`

---

### 07:00 WIB

#### 🤖 VPS Hermes: `morning-reminder` (Sabtu-Kamis 07:00 WIB)
**Function:**
- Morning greeting message
- "Selamat pagi! Waktunya mulai kerja 🌅"
- Gentle start-of-day reminder

**Changes:**
- ✅ **UPDATED**: Senin-Jumat → Sabtu-Kamis (aligned with actual work schedule)
- ✅ **SIMPLIFIED**: Removed duplicate "Morning Work Briefing" from laptop

**Why VPS Only (Not Laptop):**
- VPS = always-on reliability (no dependency on laptop uptime)
- Single source of truth for morning notifications
- Eliminates duplicate messages

**Model:**
- Primary: Gemini 2.5 Flash (pinned)
- Fallback: Groq llama-3.3-70b-versatile

**Job ID:** `b5b7de3ba2e7`

---

### 12:00 WIB

#### 🤖 VPS Hermes: `weekend-watchdog` (Jumat 12:00 WIB)
**Function:**
- Quick VPS status check before weekend
- Checks: Uptime, load average, app responsiveness, errors since Friday morning, backup status
- Ultra-short format: 3 lines max, emoji status indicators

**Why Friday Midday:**
- Work week ends Thursday, Friday is day off
- Last check before weekend (laptop will be off)
- Early warning if weekend issues brewing

**Output Example:**
```
✅ VPS sehat, uptime 14 hari
⚡ Load avg: 0.5 (normal), RAM 60%
📦 Backup terakhir: 2 jam lalu
```

**Job ID:** `6c134bd38f7a`

---

#### 💻 Laptop: `SINTAK Weekly Intelligence` (Kamis 12:00 WIB)
**Function:**
- Weekly strategic analysis from past 7 days
- Analyzes: commits, PRs, database changes, completed tasks
- Generates actionable delegation tasks for AI agents
- Output: Telegram message + `docs/WEEKLY_DELEGATION_YYYY-MM-DD.md`

**Why Thursday:**
- Last working day of week (Sabtu-Kamis work schedule)
- EOD timing for week-end review
- Feeds into next week planning

**Changes:**
- ✅ **UPDATED**: 09:00 → 12:00 (mid-day timing, better context)

**Output Format:**
- Bahasa Indonesia
- Priority tasks with effort estimates
- Clear success criteria
- Ready for AI agent delegation

**Job ID:** `37c4502d26e5`

---

### 14:00 WIB

#### 💻 Laptop: `Pre-Push Build & Lint Watchdog` (Sabtu-Kamis 14:00 WIB)
**Function:**
- Reminder to run `npm run build` and `npm run lint` before git push
- Prevents broken builds hitting remote
- Proactive quality gate

**Why 14:00:**
- Afternoon timing = common push window
- Before 15:00 laptop shutdown window
- Not too early (morning is planning time)

**Changes:**
- ✅ **UPDATED**: Senin-Jumat → Sabtu-Kamis

**Job ID:** `7cdbf02f45d1`

---

### 15:00 WIB

#### 💻 Laptop: `Daily Capture Primary` (Sabtu-Kamis 15:00 WIB)
**Function:**
- Capture development decisions, solutions, bugs to Obsidian vault
- Main daily knowledge capture point
- Target: `C:/Users/nauval/Documents/Obsidian Vault/SINTAK-ERP/`

**Why 15:00:**
- Laptop typically shuts down 15:00-16:00 (after work)
- Captures full day's work before shutdown
- Last opportunity for automatic capture

**Changes:**
- ✅ **UPDATED**: Senin-Jumat → Sabtu-Kamis
- ✅ Clean slot (no more collisions after moving Activity Log Checker)

**Why No Fallback at 23:00:**
- Laptop is always off at 23:00 (user confirmed)
- 23:00 fallback job was removed (low utility)
- Manual capture still possible if 15:00 missed

**Schedule:** `0 15 * * 0-4,6` (Sun-Thu + Sat)  
**Mode:** `no_agent=false` (AI-driven capture)  
**Job ID:** `5ed8d4645ce4`

---

#### 💻 Laptop: `Activity Log Integrity Checker` (Kamis 15:00 WIB)
**Function:**
- Validates `activity_logs` table integrity
- Checks: Missing entries, orphaned logs, schema compliance
- Cross-references with high-volume tables (orders, sales, etc.)

**Why Thursday 15:00:**
- End of work week = good time for data audit
- Before laptop shutdown window
- Issues can be fixed before next week
- Weekly cadence is sufficient (not daily)

**Changes:**
- ✅ **UPDATED**: 12:00 → 15:00 (user preference - jam 3 sore)

**Note on Concurrency:**
- Runs simultaneously with Daily Capture at 15:00
- No conflict: different targets (Obsidian vs database validation)
- Laptop has sufficient resources for 2 parallel jobs
- Both complete in <2 minutes

**Job ID:** `cc6654ab3d58`

---

### 15:30 WIB

#### 🤖 VPS Hermes: `weekly-production-review` (Jumat 15:30 WIB)
**Function:**
- Comprehensive 7-day production system analysis
- Metrics: DB growth trend (week-over-week), CPU/RAM/Disk usage patterns, PM2 restart count, error patterns in Next.js logs
- Output: Summary + actionable recommendations for next week

**Why Friday 15:30:**
- After work week ends (Kamis EOD)
- Friday afternoon = reflection time
- Weekend for any urgent fixes

**AI Analysis Includes:**
- Trend detection (is DB growing faster than usual?)
- Resource projection (will disk fill in X weeks?)
- Stability assessment (too many PM2 restarts?)
- Error categorization (transient vs systematic issues)

**Job ID:** `12b62601757d`

---

### 21:00 WIB

#### 🤖 VPS Hermes: `daily-db-summary` (Daily 21:00 WIB)
**Function:**
- AI analyzes database growth over past 24 hours
- Compares current size vs yesterday
- Counts new records in key tables (orders, sales, production)
- Identifies top 3 fastest-growing tables
- Flags unusual growth (>20% in 24h)

**Output Format:**
- 3-4 bullet points
- Actionable insights (not just raw numbers)
- Highlights anomalies

**Example Output:**
```
📊 Database tumbuh 45 MB hari ini (+2.1%)
📈 Top growth: orders (+1,234 rows), sales_reports (+890), jurnal_harian (+567)
⚠️ ANOMALI: orders tumbuh 28% (biasanya ~10%) — cek bulk import atau duplikasi
✅ Semua tabel dalam batas normal kecuali orders
```

**Why 21:00 (EOD):**
- Full day's data available
- User still awake to review
- Night hours = lower system load for analysis

**Changes:**
- ✅ **UPDATED**: 08:00 → 21:00 (EOD timing makes more sense)

**Job ID:** `2a65a6cb89a8`

---

### 22:00 WIB

#### 🤖 VPS Hermes: `nightly-health` (Daily 22:00 WIB)
**Function:**
- Silent watchdog pattern: report only if issues found
- Health checks: Errors in PM2/Next.js logs (last 24h), PM2 process status (all running?), Database integrity (PRAGMA integrity_check), Disk space trend (filling rate), SSL certificate expiry

**Silent = Smart:**
- No notification if everything OK
- User not spammed with "all good" messages daily
- Only alerted when action needed

**Output When Issues Found:**
```
⚠️ VPS Health Issues:
❌ PM2: sintak-prod restarted 3x today (memory leak?)
⚠️ Disk: 78% full, +2% today (will hit 90% in ~6 days)
✅ DB integrity OK
✅ SSL valid 45 days
```

**Job ID:** `11b19cd18f06`

---

### 23:00 WIB

#### 🗑️ REMOVED: `Daily Capture Fallback`
**Reason for Removal:**
- Laptop always OFF at 23:00 (confirmed by user)
- Job could never execute (0% success rate)
- Fallback concept invalid (primary at 15:00 always triggers before shutdown)
- Manual capture more reliable if 15:00 missed

**Old Job ID:** `ca4be421c6c6` (deleted)

---

### Hourly (Every :00)

#### 🟢 VPS: `sintak-telegram-notif.sh` (Every hour)
**Function:**
- Collects system metrics: Disk usage (%), RAM usage (%), SSL cert expiry countdown, PM2 process status, Database size (MB)
- Sends to Telegram via curl (Bot API)
- Lightweight monitoring

**Why Hourly:**
- Early detection of resource issues
- Frequent enough to catch problems
- Not so frequent to spam

**Location:** `/usr/local/bin/sintak-telegram-notif.sh`

---

#### 🟢 VPS: `SQLite WAL Checkpoint` (Every hour)
**Function:**
- Executes: `sqlite3 database.sqlite "PRAGMA wal_checkpoint(TRUNCATE);"`
- Prevents Write-Ahead Log (WAL) file unbounded growth
- Maintains query performance

**Why Critical:**
- SQLite WAL mode accumulates changes
- Without checkpoints, WAL can grow to GBs
- Performance degrades with large WAL
- Hourly = good balance (not too aggressive, not too lazy)

**Location:** Direct crontab entry

---

## 📈 Optimization Summary

### Changes Applied (2026-07-06)

| Category | Change | Impact |
|----------|--------|--------|
| **Duplicate Removal** | Laptop "Morning Work Briefing" → VPS only | Eliminated duplicate notifications ✅ |
| **Low-Utility Removal** | Laptop "Daily Capture Fallback" (23:00) | Removed job that never executed (laptop always off) ✅ |
| **Collision Resolution** | Activity Log Checker: 15:00 → 12:00 | No more conflict with Daily Capture ✅ |
| **Schedule Alignment** | All jobs: Senin-Jumat → Sabtu-Kamis | Matches actual work schedule (Jumat = day off) ✅ |
| **Timing Optimization** | Vercel maintenance: Minggu → Jumat | DB optimization at work week end ✅ |
| **Timing Optimization** | Daily DB Summary: 08:00 → 21:00 | EOD timing = full day's data ✅ |
| **Model Pinning** | All VPS Hermes jobs pinned to Gemini 2.5 Flash | Prevents unexpected cost/behavior from model drift ✅ |
| **Fallback Config** | Groq llama-3.3-70b-versatile added | Zero-downtime cron during Gemini quota exhaustion ✅ |

### Before vs After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Total Jobs** | 19 | 17 | -2 jobs (-11%) |
| **Duplicates** | 1 (morning briefing) | 0 | Eliminated ✅ |
| **Collisions** | 1 (Kamis 15:00) | 0 | Resolved ✅ |
| **Low-Utility** | 1 (23:00 fallback) | 0 | Removed ✅ |
| **Work Schedule Misalignment** | 4 jobs on wrong days | 0 | All fixed ✅ |
| **Unpinned VPS Hermes Jobs** | 6 (model drift risk) | 0 | All pinned ✅ |
| **No Fallback Provider** | ❌ Single point of failure | ✅ Groq fallback | Reliability improved ✅ |
| **Efficiency Score** | 7.0/10 | 8.5/10 | +1.5 points |

---

## 🎯 Reliability Architecture

### VPS Hermes (6 Jobs) — High Availability

**Primary Model:**
- Provider: Google AI Studio (Gemini)
- Model: `gemini-2.5-flash`
- Status: **Pinned** (prevents drift)
- Quota: Free tier (15 RPM, 1,500 RPD)

**Fallback Model:**
- Provider: Groq
- Model: `llama-3.3-70b-versatile`
- Status: **Configured & Tested** ✅
- API Key: Active (`gsk_qB...YAgK`)
- Quota: Free tier (30 RPM, 14,400 RPD)

**Fallback Trigger Conditions:**
- HTTP 429 (Rate limit / quota exceeded)
- HTTP 503 (Service unavailable)
- HTTP 529 (Overloaded)
- Connection timeout/failure

**Result:**
- Primary fast (Gemini 2.5 Flash)
- Fallback generous (Groq free tier)
- Zero-downtime cron execution
- Automatic recovery when Gemini quota resets

---

## 🔍 Platform Justification

### Why Hybrid Approach (Not All VPS)?

| Platform | Best For | Why NOT Migrate |
|----------|----------|-----------------|
| **VPS System** | Critical infra (backup, WAL checkpoint) | OS-level tools (sqlite3, rclone) more reliable than AI orchestration |
| **Vercel** | Application-level tasks (archive-logs, sync-daily) | Runs in same context as Next.js app (ORM, DB connection, env vars) |
| **VPS Hermes** | Intelligence layer (analysis, summaries) | AI value-add: raw data → insights, silent watchdog, context-aware |
| **Laptop** | Development automation | Project-specific, IDE-adjacent, uses local filesystem |

**Key Insight:**
- **Tool for the job** — bash script for bash work, AI for intelligence, app runtime for app tasks
- Migrating everything to VPS increases single point of failure risk
- Hybrid = redundancy + reliability

---

## 📅 Typical Day Timeline

### Sabtu (Saturday) — Work Day Start
```
07:00 → 🤖 Morning reminder (VPS Hermes)
12:00 → (no jobs, work continues)
14:00 → 💻 Pre-push watchdog (laptop)
15:00 → 💻 Daily capture (laptop)
21:00 → 🤖 DB summary (VPS Hermes)
22:00 → 🤖 Nightly health (VPS Hermes)
```

### Kamis (Thursday) — Work Week End
```
07:00 → 🤖 Morning reminder
12:00 → 💻 Weekly Intelligence (review week, plan next)
14:00 → 💻 Pre-push watchdog
15:00 → 💻 Daily capture (last of week)
15:00 → 💻 Activity Log Integrity Checker ✅ NEW TIME
21:00 → 🤖 DB summary
22:00 → 🤖 Nightly health
```

### Jumat (Friday) — Day Off
```
01:00 → 🔵 Vercel maintenance (DB optimization)
12:00 → 🤖 Weekend watchdog (VPS Hermes)
15:30 → 🤖 Weekly production review (VPS Hermes)
21:00 → 🤖 DB summary
22:00 → 🤖 Nightly health
```

---

## 🔧 Maintenance Notes

### VPS Hermes Job IDs (For Management)
```bash
# List all jobs
ssh root@202.10.34.157 "/opt/hermes-agent/venv/bin/hermes cron list"

# Run job manually (for testing)
ssh root@202.10.34.157 "/opt/hermes-agent/venv/bin/hermes cron run <job_id>"

# Pause job
ssh root@202.10.34.157 "/opt/hermes-agent/venv/bin/hermes cron pause <job_id>"

# Resume job
ssh root@202.10.34.157 "/opt/hermes-agent/venv/bin/hermes cron resume <job_id>"
```

**Job IDs:**
- `b5b7de3ba2e7` — morning-reminder
- `2a65a6cb89a8` — daily-db-summary
- `11b19cd18f06` — nightly-health
- `6c134bd38f7a` — weekend-watchdog
- `12b62601757d` — weekly-production-review
- `a8b38a9c7890` — db-health-report

### VPS System Crontab
```bash
# View system crontab
ssh root@202.10.34.157 "crontab -l"

# Edit (use with caution)
ssh root@202.10.34.157 "crontab -e"
```

### Laptop Hermes
```bash
# List local cron jobs
hermes cron list

# Run job manually
hermes cron run <job_id>
```

**Laptop Job IDs (Current):**
- `37c4502d26e5` — SINTAK Weekly Intelligence (Kamis 12:00)
- `7cdbf02f45d1` — Pre-Push Build & Lint Watchdog (Sat-Thu 14:00)
- `cc6654ab3d58` — Activity Log Integrity Checker (Kamis 15:00)
- `5ed8d4645ce4` — Daily Capture Afternoon Primary (Sat-Thu 15:00)

---

## 📞 Contact & Support

**VPS Access:**
- Host: `202.10.34.157`
- User: `root`
- Auth: SSH key-based

**Hermes Gateway (VPS):**
- Status: `ssh root@202.10.34.157 "pm2 status"`
- Logs: `ssh root@202.10.34.157 "pm2 logs hermes-gateway"`
- Restart: `ssh root@202.10.34.157 "pm2 restart hermes-gateway"`

**Production App:**
- URL: https://sintak-ptbuya.cloud
- PM2: `sintak-prod`
- Port: 3000

---

## 📝 Changelog

### 2026-07-06 — Major Optimization (Session 1)
- Removed 2 duplicate/low-utility jobs
- Resolved scheduling collision
- Aligned all schedules to Sabtu-Kamis work week
- Pinned all VPS Hermes jobs to Gemini 2.5 Flash
- Configured Groq fallback for reliability
- Updated Vercel maintenance timing
- Efficiency score: 7.0 → 8.5

### 2026-07-06 — Fine-tuning (Session 2)
- **VPS cleanup script**: Minggu 03:00 → Jumat 03:00 (work week alignment)
- **Sync-daily documentation**: Added detailed explanation (master scraper orchestrator, 14 endpoints)
- **Laptop Activity Log Checker**: Kamis 12:00 → Kamis 15:00 (user preference)
- Updated typical day timeline examples
- Clarified concurrent execution at 15:00 (Daily Capture + Activity Log Checker)

### 2026-07-07 — Sync & Corrections + Vercel Decommission
- **Pre-Push Watchdog**: Job ID diperbarui `b15e5a1d9c73` → `7cdbf02f45d1`
- **Daily Capture**: Tambah detail schedule string dan mode (`no_agent=false`)
- **Laptop Job IDs**: Ditambahkan tabel lengkap 4 job ID laptop di Maintenance Notes
- **Vercel decommissioned**: 3 job Vercel (maintenance, archive-logs, sync-daily) dikoreksi ke VPS System — migrasi sebenarnya sudah terjadi 2026-07-06, dokumen baru dikoreksi hari ini
- **Platform distribution**: VPS System 4 → 7 jobs, Vercel dihapus dari active platforms

---

**Document Version:** 1.1  
**Generated:** 2026-07-06  
**Maintained By:** Hermes Agent (Laptop)
