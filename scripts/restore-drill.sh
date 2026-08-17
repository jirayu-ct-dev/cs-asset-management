#!/bin/sh
set -eu

SOURCE_DATABASE=${PGDATABASE:?set PGDATABASE}
DRILL_DATABASE="${SOURCE_DATABASE}_restore_drill_$$"
DRILL_ROOT=$(mktemp -d)
SOURCE_UPLOADS="$DRILL_ROOT/source-uploads"
RESTORED_UPLOADS="$DRILL_ROOT/restored-uploads"
DRILL_BACKUPS="$DRILL_ROOT/backups"
DRILL_REPLICA="$DRILL_ROOT/off-machine-replica"
FAILURE_BACKUPS="$DRILL_ROOT/failure-backups"

cleanup() {
  PGDATABASE=$SOURCE_DATABASE dropdb --if-exists "$DRILL_DATABASE" >/dev/null 2>&1 || true
  rm -rf -- "$DRILL_ROOT"
}
trap cleanup EXIT INT TERM

mkdir -p "$SOURCE_UPLOADS/assets/example" "$RESTORED_UPLOADS" "$DRILL_BACKUPS" "$DRILL_REPLICA"
printf '%s\n' 'restore drill attachment' > "$SOURCE_UPLOADS/assets/example/attachment.txt"
printf '%s\n' 'ข้อมูลทดสอบภาษาไทย' > "$SOURCE_UPLOADS/assets/example/thai.txt"

source_counts=$(psql -Atqc 'SELECT (SELECT count(*) FROM users) || '"'|'"' || (SELECT count(*) FROM assets) || '"'|'"' || (SELECT count(*) FROM attachments)')
source_file_count=$(find "$SOURCE_UPLOADS" -type f | wc -l | tr -d ' ')
source_file_hash=$(find "$SOURCE_UPLOADS" -type f -exec sha256sum {} + | sed "s|$SOURCE_UPLOADS/||" | sort | sha256sum | cut -d ' ' -f 1)

if BACKUP_DIR=$FAILURE_BACKUPS \
  UPLOAD_DIR=$SOURCE_UPLOADS \
  BACKUP_REPLICA_DIR="$DRILL_ROOT/missing-replica" \
  BACKUP_REQUIRE_REPLICA=true \
  ./scripts/backup.sh >/dev/null 2>&1; then
  echo 'Backup unexpectedly succeeded without its required replica mount' >&2
  exit 1
fi

BACKUP_DIR=$DRILL_BACKUPS \
UPLOAD_DIR=$SOURCE_UPLOADS \
BACKUP_DAILY_RETENTION=1 \
BACKUP_WEEKLY_RETENTION=0 \
BACKUP_REPLICA_DIR=$DRILL_REPLICA \
BACKUP_REQUIRE_REPLICA=true \
./scripts/backup.sh >/dev/null

backup=$(find "$DRILL_REPLICA/daily" -mindepth 1 -maxdepth 1 -type d | sort | tail -n 1)
[ -n "$backup" ] || { echo 'Restore drill did not replicate a backup' >&2; exit 1; }

createdb "$DRILL_DATABASE"
PGDATABASE=$DRILL_DATABASE UPLOAD_DIR=$RESTORED_UPLOADS ./scripts/restore.sh "$backup" >/dev/null

restored_counts=$(PGDATABASE=$DRILL_DATABASE psql -Atqc 'SELECT (SELECT count(*) FROM users) || '"'|'"' || (SELECT count(*) FROM assets) || '"'|'"' || (SELECT count(*) FROM attachments)')
restored_file_count=$(find "$RESTORED_UPLOADS" -type f | wc -l | tr -d ' ')
restored_file_hash=$(find "$RESTORED_UPLOADS" -type f -exec sha256sum {} + | sed "s|$RESTORED_UPLOADS/||" | sort | sha256sum | cut -d ' ' -f 1)

[ "$source_counts" = "$restored_counts" ] || { echo "Database counts differ: $source_counts != $restored_counts" >&2; exit 1; }
[ "$source_file_count" = "$restored_file_count" ] || { echo "Upload counts differ: $source_file_count != $restored_file_count" >&2; exit 1; }
[ "$source_file_hash" = "$restored_file_hash" ] || { echo 'Upload checksums differ' >&2; exit 1; }

echo "Restore drill passed (database counts $restored_counts, files $restored_file_count)"
