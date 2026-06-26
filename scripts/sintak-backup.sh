#!/bin/bash
set -e

DATE=$(date +%F)
BACKUP_DIR=/var/backups/sintak
DB_PATH=/var/www/sintak/database.sqlite
FILE=database_$DATE.sqlite.gz
LOG=/var/log/sintak/backup.log

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG
  echo "$1"
}

log "Starting backup..."

if [ ! -f $DB_PATH ]; then
  log "ERROR: Database $DB_PATH not found"
  exit 1
fi

# Compress
gzip -c $DB_PATH > $BACKUP_DIR/$FILE
log "Compressed: $BACKUP_DIR/$FILE ($(du -h $BACKUP_DIR/$FILE | cut -f1))"

# Upload to Google Drive
if rclone copy $BACKUP_DIR/$FILE gdrive:sintak-backups/ 2>> $LOG; then
  log "Uploaded to Google Drive"
else
  log "WARNING: Upload failed"
fi

# Cleanup local > 3 days
find $BACKUP_DIR -type f -mtime +3 -delete
log "Cleanup done"

log "Backup complete: $FILE"
