#!/bin/sh
set -eu

RESTORE_SOURCE=${1:-}
UPLOAD_DIR=${UPLOAD_DIR:-/data/uploads}

if [ -z "$RESTORE_SOURCE" ] || [ ! -d "$RESTORE_SOURCE" ]; then
  echo "Usage: restore.sh /backups/daily/<timestamp>" >&2
  exit 1
fi
if [ ! -f "$RESTORE_SOURCE/database.dump" ] || [ ! -f "$RESTORE_SOURCE/uploads.tar.gz" ] || [ ! -f "$RESTORE_SOURCE/SHA256SUMS" ]; then
  echo "Backup is incomplete: $RESTORE_SOURCE" >&2
  exit 1
fi
case "$UPLOAD_DIR" in ''|/) echo "Refusing unsafe UPLOAD_DIR" >&2; exit 1 ;; esac

(cd "$RESTORE_SOURCE" && sha256sum -c SHA256SUMS)
pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error --dbname="${PGDATABASE:?set PGDATABASE}" "$RESTORE_SOURCE/database.dump"
mkdir -p "$UPLOAD_DIR"
find "$UPLOAD_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
tar -C "$UPLOAD_DIR" -xzf "$RESTORE_SOURCE/uploads.tar.gz"
echo "Restore completed from: $RESTORE_SOURCE"

