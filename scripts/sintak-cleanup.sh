#!/bin/bash
# Cleanup logs & temp files — jalan tiap minggu
set -e

LOG_FILE=/var/log/sintak/cleanup.log

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "=== Cleanup start ==="

# PM2 logs > 14 days
find /var/www/sintak/logs -type f -name "*.log" -mtime +14 -delete 2>/dev/null
log "PM2 logs >14d: cleaned"

# System logs > 30 days
find /var/log -type f -name "*.log" -mtime +30 -delete 2>/dev/null
find /var/log -type f -name "*.gz" -mtime +30 -delete 2>/dev/null
log "System logs >30d: cleaned"

# TMP files > 7 days
find /tmp -type f -mtime +7 -delete 2>/dev/null
log "TMP >7d: cleaned"

# Journal logs — keep only last 500MB
journalctl --vacuum-size=500M 2>/dev/null && log "Journal: vacuumed to 500M" || log "Journal: no vacuum"

# .next build cache — keep only latest
NEXT_DIR=/var/www/sintak/.next
if [ -d "$NEXT_DIR" ]; then
  find $NEXT_DIR/cache -type f -mtime +7 -delete 2>/dev/null || true
  log "Next.js cache >7d: cleaned"
fi

# Disk usage report
DISK_USE=$(df / | tail -1 | awk '{print $5}')
AVAIL=$(df -h / | tail -1 | awk '{print $4}')
log "Disk: $DISK_USE used, $AVAIL available"

log "=== Cleanup done ==="
