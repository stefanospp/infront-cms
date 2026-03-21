#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# Restore script for client Directus databases and uploads
#
# Usage:
#   ./restore.sh db    <client-slug> <backup-file.sql.gz>
#   ./restore.sh uploads <client-slug> [s3-path]
#
# Examples:
#   ./restore.sh db acme-corp /var/backups/postgres/directus_2026-03-20_02-00-00.sql.gz
#   ./restore.sh uploads acme-corp s3://agency-cms-backups/uploads/acme-corp
#
# Prerequisites:
#   - psql and gunzip available on the host
#   - AWS CLI configured for S3 access
#   - Docker running with the client's Directus container
# -------------------------------------------------------------------

S3_BUCKET="${S3_BUCKET:-s3://agency-cms-backups}"

usage() {
  echo "Usage:"
  echo "  $0 db      <client-slug> <backup-file.sql.gz>"
  echo "  $0 uploads <client-slug> [s3-path]"
  exit 1
}

if [ $# -lt 2 ]; then
  usage
fi

COMMAND="$1"
CLIENT_SLUG="$2"

case "${COMMAND}" in
  db)
    # ---------------------------------------------------------------
    # Database restore: decompress the .sql.gz dump and pipe to psql
    # ---------------------------------------------------------------
    if [ $# -lt 3 ]; then
      echo "Error: backup file path required for db restore."
      usage
    fi

    BACKUP_FILE="$3"

    if [ ! -f "${BACKUP_FILE}" ]; then
      echo "Error: Backup file not found: ${BACKUP_FILE}"
      exit 1
    fi

    DB_NAME="${DB_NAME:-directus}"
    DB_USER="${DB_USER:-directus}"
    DB_HOST="${DB_HOST:-localhost}"

    echo "[$(date)] Restoring database '${DB_NAME}' for client '${CLIENT_SLUG}'..."
    echo "[$(date)] Source: ${BACKUP_FILE}"

    gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}"

    echo "[$(date)] Database restore complete."
    ;;

  uploads)
    # ---------------------------------------------------------------
    # Uploads restore: sync from S3 then copy into the container
    # ---------------------------------------------------------------
    S3_PATH="${3:-${S3_BUCKET}/uploads/${CLIENT_SLUG}}"
    LOCAL_RESTORE_DIR="/tmp/restore-uploads-${CLIENT_SLUG}"
    CONTAINER_NAME="${CLIENT_SLUG}-directus-1"

    echo "[$(date)] Downloading uploads from ${S3_PATH}..."
    mkdir -p "${LOCAL_RESTORE_DIR}"
    aws s3 sync "${S3_PATH}" "${LOCAL_RESTORE_DIR}/" --quiet

    echo "[$(date)] Copying uploads into container '${CONTAINER_NAME}'..."
    docker cp "${LOCAL_RESTORE_DIR}/." "${CONTAINER_NAME}:/directus/uploads/"

    echo "[$(date)] Cleaning up temp directory..."
    rm -rf "${LOCAL_RESTORE_DIR}"

    echo "[$(date)] Uploads restore complete."
    ;;

  *)
    echo "Error: Unknown command '${COMMAND}'"
    usage
    ;;
esac
