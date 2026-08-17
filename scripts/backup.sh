#!/bin/sh
set -eu

BACKUP_DIR=${BACKUP_DIR:-/backups}
UPLOAD_DIR=${UPLOAD_DIR:-/data/uploads}
DAILY_RETENTION=${BACKUP_DAILY_RETENTION:-7}
WEEKLY_RETENTION=${BACKUP_WEEKLY_RETENTION:-4}
REPLICA_DIR=${BACKUP_REPLICA_DIR:-}
REQUIRE_REPLICA=${BACKUP_REQUIRE_REPLICA:-false}
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
DAILY_ROOT="$BACKUP_DIR/daily"
WEEKLY_ROOT="$BACKUP_DIR/weekly"
DESTINATION="$DAILY_ROOT/$TIMESTAMP"

case "$DAILY_RETENTION:$WEEKLY_RETENTION" in
  *[!0-9:]*|:*|*:) echo "Retention values must be non-negative integers" >&2; exit 1 ;;
esac
case "$REQUIRE_REPLICA" in true|false) ;; *) echo "BACKUP_REQUIRE_REPLICA must be true or false" >&2; exit 1 ;; esac
if [ "$REQUIRE_REPLICA" = "true" ] && [ -z "$REPLICA_DIR" ]; then
  echo "BACKUP_REPLICA_DIR is required when replication is mandatory" >&2
  exit 1
fi
case "$REPLICA_DIR" in /) echo "Refusing unsafe BACKUP_REPLICA_DIR" >&2; exit 1 ;; esac

mkdir -p "$DESTINATION" "$WEEKLY_ROOT"
pg_dump --format=custom --file="$DESTINATION/database.dump"
tar -C "$UPLOAD_DIR" -czf "$DESTINATION/uploads.tar.gz" .
(cd "$DESTINATION" && sha256sum database.dump uploads.tar.gz > SHA256SUMS)

if [ "$(date -u +%u)" = "7" ]; then
  cp -R "$DESTINATION" "$WEEKLY_ROOT/$TIMESTAMP"
fi

replicate_backup() {
  source=$1
  target=$2
  temporary="$target.tmp.$$"
  mkdir -p "$(dirname "$target")"
  rm -rf -- "$temporary"
  if ! cp -R "$source" "$temporary"; then
    rm -rf -- "$temporary"
    return 1
  fi
  if ! (cd "$temporary" && sha256sum -c SHA256SUMS >/dev/null); then
    rm -rf -- "$temporary"
    return 1
  fi
  [ ! -e "$target" ] || { echo "Replica already exists: $target" >&2; rm -rf -- "$temporary"; return 1; }
  mv "$temporary" "$target"
}

if [ -n "$REPLICA_DIR" ]; then
  [ -d "$REPLICA_DIR" ] || { echo "Replica mount is unavailable: $REPLICA_DIR" >&2; exit 1; }
  [ -w "$REPLICA_DIR" ] || { echo "Replica mount is not writable: $REPLICA_DIR" >&2; exit 1; }
  replicate_backup "$DESTINATION" "$REPLICA_DIR/daily/$TIMESTAMP" || { echo "Off-machine replication failed" >&2; exit 1; }
  if [ "$(date -u +%u)" = "7" ]; then
    replicate_backup "$WEEKLY_ROOT/$TIMESTAMP" "$REPLICA_DIR/weekly/$TIMESTAMP" || { echo "Weekly off-machine replication failed" >&2; exit 1; }
  fi
fi

prune_backups() {
  root=$1
  keep=$2
  count=$(find "$root" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
  remove=$((count - keep))
  [ "$remove" -le 0 ] && return 0
  find "$root" -mindepth 1 -maxdepth 1 -type d | sort | head -n "$remove" | while IFS= read -r old; do
    rm -rf -- "$old"
  done
}

prune_backups "$DAILY_ROOT" "$DAILY_RETENTION"
prune_backups "$WEEKLY_ROOT" "$WEEKLY_RETENTION"
if [ -n "$REPLICA_DIR" ]; then
  prune_backups "$REPLICA_DIR/daily" "$DAILY_RETENTION"
  mkdir -p "$REPLICA_DIR/weekly"
  prune_backups "$REPLICA_DIR/weekly" "$WEEKLY_RETENTION"
fi
touch "$BACKUP_DIR/.last-success"
echo "Backup completed and verified: $DESTINATION${REPLICA_DIR:+; replica: $REPLICA_DIR/daily/$TIMESTAMP}"
