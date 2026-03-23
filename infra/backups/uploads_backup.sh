#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# Uploads backup script for client Directus instances.
# Copies uploads FROM DOCKER VOLUMES to a local backup dir, then to S3.
#
# Each client has a Docker volume named <project>_directus_uploads.
# -------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="${SCRIPT_DIR}/../docker"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/uploads}"
S3_BUCKET="${S3_BUCKET:-s3://agency-cms-backups/uploads}"

mkdir -p "${BACKUP_DIR}"

CLIENT_COUNT=0
for CLIENT_DIR in "${DOCKER_DIR}"/*/; do
  SLUG="$(basename "${CLIENT_DIR}")"

  if [ "${SLUG}" = "template" ]; then
    continue
  fi

  if [ ! -f "${CLIENT_DIR}/docker-compose.yml" ]; then
    continue
  fi

  # Get the Directus container name
  COMPOSE_PROJECT="${SLUG}"
  DIRECTUS_CONTAINER=$(docker compose -p "${COMPOSE_PROJECT}" -f "${CLIENT_DIR}/docker-compose.yml" ps -q directus 2>/dev/null || true)

  if [ -z "${DIRECTUS_CONTAINER}" ]; then
    echo "[$(date)] WARNING: ${SLUG} Directus container not running, skipping uploads"
    continue
  fi

  CLIENT_BACKUP_DIR="${BACKUP_DIR}/${SLUG}"
  mkdir -p "${CLIENT_BACKUP_DIR}"

  echo "[$(date)] Copying uploads from ${SLUG} container..."
  docker cp "${DIRECTUS_CONTAINER}:/directus/uploads/." "${CLIENT_BACKUP_DIR}/"

  echo "[$(date)] Syncing ${SLUG} uploads to ${S3_BUCKET}/${SLUG}/"
  aws s3 sync "${CLIENT_BACKUP_DIR}/" "${S3_BUCKET}/${SLUG}/" --quiet

  CLIENT_COUNT=$((CLIENT_COUNT + 1))
done

echo "[$(date)] Uploads backup complete. ${CLIENT_COUNT} client(s) backed up."
