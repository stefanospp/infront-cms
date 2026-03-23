#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# D1 backup script for Cloudflare D1 databases
# Exports the abroad-jobs D1 database using wrangler, compresses with
# gzip, uploads to S3, and removes local backups older than RETENTION_DAYS.
# -------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/d1}"
S3_BUCKET="${S3_BUCKET:-s3://agency-cms-backups/d1}"
DATE="$(date +%Y-%m-%d_%H-%M-%S)"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# D1 database configuration
D1_DATABASE_NAME="${D1_DATABASE_NAME:-abroad-jobs-db}"
D1_DATABASE_ID="${D1_DATABASE_ID:-}"

mkdir -p "${BACKUP_DIR}"

# Validate wrangler is available
if ! command -v wrangler &>/dev/null; then
  echo "[$(date)] ERROR: wrangler CLI not found. Install with: npm install -g wrangler"
  exit 1
fi

# Validate D1_DATABASE_ID is set
if [ -z "${D1_DATABASE_ID}" ]; then
  echo "[$(date)] ERROR: D1_DATABASE_ID environment variable is required"
  exit 1
fi

DUMP_FILE="${BACKUP_DIR}/${D1_DATABASE_NAME}_${DATE}.sql"
DUMP_FILE_GZ="${DUMP_FILE}.gz"

echo "[$(date)] Exporting D1 database '${D1_DATABASE_NAME}' (${D1_DATABASE_ID})..."

# Export the D1 database using wrangler
wrangler d1 export "${D1_DATABASE_NAME}" \
  --remote \
  --output="${DUMP_FILE}"

# Verify export is not empty
if [ ! -f "${DUMP_FILE}" ]; then
  echo "[$(date)] ERROR: Export file was not created"
  exit 1
fi

DUMP_SIZE=$(stat -f%z "${DUMP_FILE}" 2>/dev/null || stat -c%s "${DUMP_FILE}" 2>/dev/null || echo "0")
if [ "${DUMP_SIZE}" -lt 100 ]; then
  echo "[$(date)] ERROR: Export for ${D1_DATABASE_NAME} is suspiciously small (${DUMP_SIZE} bytes)"
  rm -f "${DUMP_FILE}"
  exit 1
fi

# Compress
echo "[$(date)] Compressing export..."
gzip "${DUMP_FILE}"

echo "[$(date)] Uploading ${DUMP_FILE_GZ} to ${S3_BUCKET}/${D1_DATABASE_NAME}/"
aws s3 cp "${DUMP_FILE_GZ}" "${S3_BUCKET}/${D1_DATABASE_NAME}/" --quiet

# Clean up local backups older than RETENTION_DAYS
echo "[$(date)] Removing local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${D1_DATABASE_NAME}_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete

echo "[$(date)] D1 backup complete: ${DUMP_FILE_GZ}"
