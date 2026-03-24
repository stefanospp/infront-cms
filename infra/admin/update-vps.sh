#!/usr/bin/env bash
set -euo pipefail

# Quick update script — run on VPS after pushing code changes
# Usage: ssh root@49.12.4.77 'bash /opt/infront-cms/infra/admin/update-vps.sh'

cd /opt/infront-cms
ENV_FILE="/opt/infront-cms/infra/admin/.env"
SCRIPT_PATH="/opt/infront-cms/infra/admin/update-vps.sh"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found."
  echo "Run the full setup script instead: bash infra/admin/setup-vps.sh"
  exit 1
fi

# Re-exec after git pull so the rest of the script uses the latest version.
# The __PULLED marker prevents infinite recursion.
if [ "${__PULLED:-}" != "1" ]; then
  echo "Pulling latest code..."
  git pull
  echo "Re-executing updated script..."
  __PULLED=1 exec bash "$SCRIPT_PATH"
fi

echo "Building Docker image..."
docker build -t infront-admin .

echo "Restarting container..."
docker stop infront-admin 2>/dev/null || true
docker rm infront-admin 2>/dev/null || true

docker run -d \
  --name infront-admin \
  --restart unless-stopped \
  -p 127.0.0.1:4321:4321 \
  -v /opt/infront-cms/sites:/data/sites \
  -v /opt/infront-cms/infra:/data/infra:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --group-add "$(stat -c %g /var/run/docker.sock)" \
  --env-file "$ENV_FILE" \
  -e MONOREPO_ROOT=/data \
  -e APP_ROOT=/app \
  infront-admin

echo "Waiting for container to start..."
sleep 10
if docker ps --filter name=infront-admin --format '{{.Status}}' | grep -q 'Up'; then
  echo "Update complete. Admin is running at https://web.infront.cy"
else
  echo "ERROR: Container failed to start. Check: docker logs infront-admin"
fi
