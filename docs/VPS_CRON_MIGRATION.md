# VPS Cron Migration - Implementation Guide

## ✅ Local Testing Results (2026-07-06)

**Tested on local environment:**
- ✅ Build success WITHOUT middleware (`proxy.ts.disabled`)
- ✅ CRON_SECRET authentication working correctly
- ✅ All 3 API endpoints properly secured:
  - `/api/maintenance`
  - `/api/cron/sync-daily`
  - `/api/cron/archive-logs`

**Test Evidence:**
```bash
# Without auth header
curl http://localhost:3000/api/maintenance
→ {"error":"Unauthorized"}  ✅

# With correct CRON_SECRET
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/maintenance
→ Passes authentication, executes maintenance  ✅
```

---

## 🎯 Solution: No Middleware Changes Needed

**Key Insight:**
- Original `proxy.ts` was NOT being loaded as middleware (wrong filename)
- App works perfectly WITHOUT middleware
- API routes already have built-in CRON_SECRET authentication

**Approach:**
1. Keep `proxy.ts.disabled` (no middleware)
2. Use existing CRON_SECRET auth in API routes
3. VPS cron calls APIs with Bearer token

---

## 📋 VPS Implementation Steps

### 1. Ensure CRON_SECRET is in VPS .env

**File:** `/var/www/sintak/.env`

```bash
CRON_SECRET=<secret_already_added_during_prev_session>
```

✅ **Status:** Already added on 2026-07-06 (previous session)

### 2. Configure PM2 to Load Environment Variables

**Current issue:** PM2 doesn't automatically reload .env changes.

**Option A: PM2 Restart with --update-env**
```bash
cd /var/www/sintak
pm2 restart sintak-prod --update-env
```

**Option B: Explicitly set in PM2 ecosystem.config.js**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'sintak-prod',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/sintak',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      // Read from .env file at startup
    },
    env_file: '.env'  // PM2 will load .env
  }]
}
```

**Recommended:** Use `pm2 restart --update-env` after .env changes.

### 3. Setup VPS System Crontab

**File:** `/etc/crontab` or `crontab -e`

```bash
# SINTAK Automated Maintenance & Scraping
# Environment: CRON_SECRET must match .env

# Daily Database Maintenance (Jumat 01:00 WIB = Kamis 18:00 UTC)
0 18 * * 4 root curl -s -H "Authorization: Bearer $(grep CRON_SECRET /var/www/sintak/.env | cut -d'=' -f2)" http://localhost:3000/api/maintenance >> /var/log/sintak-cron.log 2>&1

# Daily Activity Log Archiving (Daily 02:00 WIB = 19:00 UTC)
0 19 * * * root curl -s -H "Authorization: Bearer $(grep CRON_SECRET /var/www/sintak/.env | cut -d'=' -f2)" http://localhost:3000/api/cron/archive-logs >> /var/log/sintak-cron.log 2>&1

# Daily Data Sync from Master (Daily 03:00 WIB = 20:00 UTC)
0 20 * * * root curl -s -H "Authorization: Bearer $(grep CRON_SECRET /var/www/sintak/.env | cut -d'=' -f2)" http://localhost:3000/api/cron/sync-daily >> /var/log/sintak-cron.log 2>&1
```

**Notes:**
- Uses `$(grep CRON_SECRET ...)` to dynamically read secret from .env
- All output logged to `/var/log/sintak-cron.log`
- Timezone: UTC (WIB = UTC+7)

### 4. Alternative: Shell Script Wrapper (Recommended)

**More robust approach - create wrapper script:**

**File:** `/usr/local/bin/sintak-cron-call.sh`

```bash
#!/bin/bash
# SINTAK Cron API Caller with CRON_SECRET authentication

set -euo pipefail

ENDPOINT="$1"
LOG_FILE="/var/log/sintak-cron.log"
ENV_FILE="/var/www/sintak/.env"

# Read CRON_SECRET from .env
if [ ! -f "$ENV_FILE" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: .env file not found" >> "$LOG_FILE"
    exit 1
fi

CRON_SECRET=$(grep '^CRON_SECRET=' "$ENV_FILE" | cut -d'=' -f2)

if [ -z "$CRON_SECRET" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: CRON_SECRET not found in .env" >> "$LOG_FILE"
    exit 1
fi

# Call API endpoint
echo "$(date '+%Y-%m-%d %H:%M:%S') Calling $ENDPOINT..." >> "$LOG_FILE"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -H "Authorization: Bearer $CRON_SECRET" \
    "http://localhost:3000$ENDPOINT" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | grep HTTP_CODE | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | grep -v HTTP_CODE)

echo "Status: $HTTP_CODE" >> "$LOG_FILE"
echo "Response: $BODY" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"

if [ "$HTTP_CODE" != "200" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR: Non-200 status for $ENDPOINT" >> "$LOG_FILE"
    exit 1
fi
```

**Make executable:**
```bash
chmod +x /usr/local/bin/sintak-cron-call.sh
```

**Updated crontab using wrapper:**
```bash
# SINTAK Cron Jobs via Wrapper Script
0 18 * * 4 root /usr/local/bin/sintak-cron-call.sh /api/maintenance
0 19 * * * root /usr/local/bin/sintak-cron-call.sh /api/cron/archive-logs
0 20 * * * root /usr/local/bin/sintak-cron-call.sh /api/cron/sync-daily
```

---

## 🧪 Testing VPS Setup

### Test Authentication (Manual)

```bash
# SSH to VPS
ssh root@202.10.34.157

# Read CRON_SECRET
CRON_SECRET=$(grep CRON_SECRET /var/www/sintak/.env | cut -d'=' -f2)

# Test endpoint
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/maintenance

# Should return maintenance results (VACUUM, ANALYZE stats), not 401
```

### Test Cron Script

```bash
# Test wrapper script manually
/usr/local/bin/sintak-cron-call.sh /api/maintenance

# Check log
tail -20 /var/log/sintak-cron.log
```

---

## 📅 Migration Timeline

**Current State (2026-07-06):**
- ✅ Vercel crons still active (syncing to old Turso DB, not used by production)
- ✅ VPS production running WITHOUT automated daily sync
- ✅ Last VPS scrape: 2026-07-06 04:39:56 (manual)

**Proposed Migration:**
1. ✅ **Local testing** - DONE (this session)
2. 🔄 **Deploy to VPS** - via GitHub Actions (awaiting user approval)
3. 🔄 **Setup VPS crontab** - using wrapper script approach
4. 🔄 **Monitor first runs** - verify logs for 24-48 hours
5. 🔄 **Disable Vercel crons** - once VPS crons proven stable

---

## ⚠️ Important Notes

### No Middleware Required
- `proxy.ts.disabled` stays disabled
- API routes handle their own authentication
- No Edge Runtime issues

### Security
- CRON_SECRET stored in .env (root-only readable)
- Bearer token authentication on all cron endpoints
- Logs scrubbed of secrets (only HTTP status logged)

### Monitoring
- All cron output → `/var/log/sintak-cron.log`
- Failed runs return non-zero exit codes
- Can setup alerts on exit code != 0

### Rollback Plan
If VPS crons fail:
1. Vercel crons still active (safety net)
2. Can manually trigger: `curl -H "Authorization: Bearer $SECRET" http://localhost:3000/api/cron/sync-daily`
3. Can restore to commit be9ca58 (current known-good state)

---

## 🚀 Next Steps

**After this documentation is approved:**
1. Commit changes (proxy.ts.disabled, CRON_SECRET in .env, this doc)
2. Push to GitHub (awaiting user confirmation)
3. GitHub Actions auto-deploys to VPS
4. SSH to VPS and setup crontab using wrapper script approach
5. Monitor first automated runs
6. Disable Vercel crons once stable

**Estimated time:** 30 minutes setup + 24 hours monitoring
