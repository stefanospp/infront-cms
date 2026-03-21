#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# PostgreSQL backup script for all client Directus databases
# Dumps each database, compresses with gzip, uploads to S3,
# and removes local backups older than RETENTION_DAYS.
# -------------------------------------------------------------------

BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgres}"
S3_BUCKET="${S3_BUCKET:-s3://agency-cms-backups/postgres}"
DATE="$(date +%Y-%m-%d_%H-%M-%S)"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"

# Discover client databases (all databases except system ones)
CLIENT_DATABASES=$(psql -U postgres -t -A -c \
  "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres','template0','template1') ORDER BY datname;")

if [ -z "${CLIENT_DATABASES}" ]; then
  echo "[$(date)] No client databases found to back up."
  exit 0
fi

for DB_NAME in ${CLIENT_DATABASES}; do
  DUMP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.sql.gz"
  echo "[$(date)] Backing up database: ${DB_NAME} -> ${DUMP_FILE}"

  pg_dump -U postgres "${DB_NAME}" | gzip > "${DUMP_FILE}"

  echo "[$(date)] Uploading ${DUMP_FILE} to ${S3_BUCKET}/${DB_NAME}/"
  aws s3 cp "${DUMP_FILE}" "${S3_BUCKET}/${DB_NAME}/" --quiet
done

# Clean up local backups older than RETENTION_DAYS
echo "[$(date)] Removing local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Backup complete."
