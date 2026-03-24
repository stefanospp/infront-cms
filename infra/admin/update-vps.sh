#!/usr/bin/env bash
set -euo pipefail

# Quick update script — run on VPS after pushing code changes
# Usage: ssh root@49.12.4.77 'bash /opt/infront-cms/infra/admin/update-vps.sh'

cd /opt/infront-cms
ENV_FILE="/opt/infront-cms/infra/admin/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found."
  echo "Run the full setup script instead: bash infra/admin/setup-vps.sh"
  exit 1
fi

echo "Pulling latest code..."
git pull

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
  --env-file "$ENV_FILE" \
  -e MONOREPO_ROOT=/data \
  -e APP_ROOT=/app \
  infront-admin

sleep 3
if docker ps | grep -q infront-admin; then
  echo "Update complete. Admin is running at https://web.infront.cy"
else
  echo "ERROR: Container failed to start. Check: docker logs infront-admin"
fi
