#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# PostgreSQL backup script for all client Directus databases
# Dumps each database FROM ITS DOCKER CONTAINER, compresses with gzip,
# uploads to S3, and removes local backups older than RETENTION_DAYS.
#
# Each client has a separate Docker Compose project in infra/docker/<slug>/
# with a 'database' service running PostgreSQL.
# -------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="${SCRIPT_DIR}/../docker"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgres}"
S3_BUCKET="${S3_BUCKET:-s3://agency-cms-backups/postgres}"
DATE="$(date +%Y-%m-%d_%H-%M-%S)"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"

# Discover client directories (skip 'template')
CLIENT_COUNT=0
for CLIENT_DIR in "${DOCKER_DIR}"/*/; do
  SLUG="$(basename "${CLIENT_DIR}")"

  # Skip the template directory
  if [ "${SLUG}" = "template" ]; then
    continue
  fi

  # Check if docker-compose.yml exists
  if [ ! -f "${CLIENT_DIR}/docker-compose.yml" ]; then
    echo "[$(date)] Skipping ${SLUG}: no docker-compose.yml found"
    continue
  fi

  # Read DB credentials from .env file
  ENV_FILE="${CLIENT_DIR}/.env"
  if [ ! -f "${ENV_FILE}" ]; then
    echo "[$(date)] WARNING: ${SLUG} has no .env file, skipping"
    continue
  fi

  DB_USER=$(grep -E '^DB_USER=' "${ENV_FILE}" | cut -d= -f2- || echo "directus")
  DB_NAME="directus"

  # Get the database container name
  COMPOSE_PROJECT="${SLUG}"
  DB_CONTAINER=$(docker compose -p "${COMPOSE_PROJECT}" -f "${CLIENT_DIR}/docker-compose.yml" ps -q database 2>/dev/null || true)

  if [ -z "${DB_CONTAINER}" ]; then
    echo "[$(date)] WARNING: ${SLUG} database container not running, skipping"
    continue
  fi

  DUMP_FILE="${BACKUP_DIR}/${SLUG}_${DATE}.sql.gz"
  echo "[$(date)] Backing up ${SLUG} database -> ${DUMP_FILE}"

  # Dump directly from the container
  docker exec "${DB_CONTAINER}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${DUMP_FILE}"

  # Verify dump is not empty
  DUMP_SIZE=$(stat -f%z "${DUMP_FILE}" 2>/dev/null || stat -c%s "${DUMP_FILE}" 2>/dev/null || echo "0")
  if [ "${DUMP_SIZE}" -lt 100 ]; then
    echo "[$(date)] ERROR: Dump for ${SLUG} is suspiciously small (${DUMP_SIZE} bytes), skipping S3 upload"
    rm -f "${DUMP_FILE}"
    continue
  fi

  echo "[$(date)] Uploading ${DUMP_FILE} to ${S3_BUCKET}/${SLUG}/"
  aws s3 cp "${DUMP_FILE}" "${S3_BUCKET}/${SLUG}/" --quiet

  CLIENT_COUNT=$((CLIENT_COUNT + 1))
done

# Clean up local backups older than RETENTION_DAYS
echo "[$(date)] Removing local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete

echo "[$(date)] Backup complete. ${CLIENT_COUNT} database(s) backed up."
