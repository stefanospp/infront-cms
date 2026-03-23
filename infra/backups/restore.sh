#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# Restore script for client Directus databases and uploads
#
# Usage:
#   ./restore.sh db      <client-slug> <backup-file.sql.gz>
#   ./restore.sh uploads <client-slug> [s3-path]
#
# Examples:
#   ./restore.sh db meridian-properties /var/backups/postgres/meridian-properties_2026-03-20_02-00-00.sql.gz
#   ./restore.sh uploads meridian-properties
#
# Prerequisites:
#   - Docker running with the client's containers
#   - AWS CLI configured for S3 access (for uploads restore from S3)
# -------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="${SCRIPT_DIR}/../docker"
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

CLIENT_DIR="${DOCKER_DIR}/${CLIENT_SLUG}"
if [ ! -d "${CLIENT_DIR}" ]; then
  echo "Error: Client directory not found: ${CLIENT_DIR}"
  exit 1
fi

case "${COMMAND}" in
  db)
    if [ $# -lt 3 ]; then
      echo "Error: backup file path required for db restore."
      usage
    fi

    BACKUP_FILE="$3"
    if [ ! -f "${BACKUP_FILE}" ]; then
      echo "Error: Backup file not found: ${BACKUP_FILE}"
      exit 1
    fi

    # Read DB credentials from .env
    ENV_FILE="${CLIENT_DIR}/.env"
    DB_USER=$(grep -E '^DB_USER=' "${ENV_FILE}" | cut -d= -f2- || echo "directus")
    DB_NAME="directus"

    # Get database container
    COMPOSE_PROJECT="${CLIENT_SLUG}"
    DB_CONTAINER=$(docker compose -p "${COMPOSE_PROJECT}" -f "${CLIENT_DIR}/docker-compose.yml" ps -q database 2>/dev/null || true)

    if [ -z "${DB_CONTAINER}" ]; then
      echo "Error: Database container for ${CLIENT_SLUG} is not running."
      echo "Start it with: docker compose -p ${CLIENT_SLUG} -f ${CLIENT_DIR}/docker-compose.yml up -d database"
      exit 1
    fi

    echo "[$(date)] Restoring database for '${CLIENT_SLUG}'..."
    echo "[$(date)] Source: ${BACKUP_FILE}"
    echo ""
    echo "WARNING: This will overwrite the current database. Press Ctrl+C to abort."
    sleep 3

    # Decompress and pipe into the container's psql
    gunzip -c "${BACKUP_FILE}" | docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"

    echo "[$(date)] Database restore complete for ${CLIENT_SLUG}."
    ;;

  uploads)
    S3_PATH="${3:-${S3_BUCKET}/uploads/${CLIENT_SLUG}}"

    # Get Directus container
    COMPOSE_PROJECT="${CLIENT_SLUG}"
    DIRECTUS_CONTAINER=$(docker compose -p "${COMPOSE_PROJECT}" -f "${CLIENT_DIR}/docker-compose.yml" ps -q directus 2>/dev/null || true)

    if [ -z "${DIRECTUS_CONTAINER}" ]; then
      echo "Error: Directus container for ${CLIENT_SLUG} is not running."
      exit 1
    fi

    LOCAL_RESTORE_DIR="/tmp/restore-uploads-${CLIENT_SLUG}"
    echo "[$(date)] Downloading uploads from ${S3_PATH}..."
    mkdir -p "${LOCAL_RESTORE_DIR}"
    aws s3 sync "${S3_PATH}" "${LOCAL_RESTORE_DIR}/" --quiet

    echo "[$(date)] Copying uploads into container..."
    docker cp "${LOCAL_RESTORE_DIR}/." "${DIRECTUS_CONTAINER}:/directus/uploads/"

    echo "[$(date)] Cleaning up temp directory..."
    rm -rf "${LOCAL_RESTORE_DIR}"

    echo "[$(date)] Uploads restore complete for ${CLIENT_SLUG}."
    ;;

  *)
    echo "Error: Unknown command '${COMMAND}'"
    usage
    ;;
esac
