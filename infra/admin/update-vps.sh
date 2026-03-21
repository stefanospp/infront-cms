#!/usr/bin/env bash
set -euo pipefail

# Quick update script — run on VPS after pushing code changes
# Usage: ssh root@49.12.4.77 'bash /opt/infront-cms/infra/admin/update-vps.sh'

cd /opt/infront-cms
echo "Pulling latest code..."
git pull

echo "Building Docker image..."
docker build -t infront-admin .

echo "Restarting container..."
# Get current env vars from running container
ENV_ARGS=$(docker inspect infront-admin --format '{{range .Config.Env}}{{if or (eq (index (split . "=") 0) "ADMIN_PASSWORD_HASH") (eq (index (split . "=") 0) "SESSION_SECRET") (eq (index (split . "=") 0) "CLOUDFLARE_API_TOKEN") (eq (index (split . "=") 0) "CLOUDFLARE_ACCOUNT_ID") (eq (index (split . "=") 0) "CLOUDFLARE_ZONE_ID")}}-e "{{.}}" {{end}}{{end}}' 2>/dev/null || echo "")

docker stop infront-admin
docker rm infront-admin

if [ -n "$ENV_ARGS" ]; then
  eval docker run -d \
    --name infront-admin \
    --restart unless-stopped \
    -p 127.0.0.1:4321:4321 \
    -v infront-admin-sites:/app/sites \
    -e HOST=0.0.0.0 \
    -e PORT=4321 \
    -e NODE_ENV=production \
    $ENV_ARGS \
    infront-admin
else
  echo "ERROR: Could not read env vars from previous container."
  echo "Run the full setup script instead: bash infra/admin/setup-vps.sh"
  exit 1
fi

sleep 2
if docker ps | grep -q infront-admin; then
  echo "Update complete. Admin is running at https://web.infront.cy"
else
  echo "ERROR: Container failed to start. Check: docker logs infront-admin"
fi
