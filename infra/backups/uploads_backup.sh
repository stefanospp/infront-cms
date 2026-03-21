#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# Uploads backup script for client Directus instances
# Syncs upload directories to a local backup location, then to S3.
# -------------------------------------------------------------------

UPLOADS_ROOT="${UPLOADS_ROOT:-/var/data/directus-uploads}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/uploads}"
S3_BUCKET="${S3_BUCKET:-s3://agency-cms-backups/uploads}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Syncing uploads from ${UPLOADS_ROOT} to ${BACKUP_DIR}..."
rsync -az --delete "${UPLOADS_ROOT}/" "${BACKUP_DIR}/"

echo "[$(date)] Syncing ${BACKUP_DIR} to ${S3_BUCKET}..."
aws s3 sync "${BACKUP_DIR}/" "${S3_BUCKET}/" --delete --quiet

echo "[$(date)] Uploads backup complete."
