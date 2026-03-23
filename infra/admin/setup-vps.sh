#!/usr/bin/env bash
set -euo pipefail

# ===========================================================================
# Infront Admin — VPS Setup Script
#
# Run this on your Hetzner VPS (49.12.4.77) via SSH:
#   ssh root@49.12.4.77
#   bash < setup-vps.sh
#
# This script:
#   1. Installs cloudflared (Cloudflare Tunnel)
#   2. Clones the repo and builds the Docker image
#   3. Starts the admin container on localhost:4321
#   4. Creates and configures the Cloudflare Tunnel
#   5. Sets up the tunnel as a systemd service
#
# Prerequisites:
#   - Docker installed on the VPS
#   - Git installed on the VPS
#   - You'll need to visit a URL in your browser during tunnel auth
# ===========================================================================

echo "============================================"
echo "  Infront Admin — VPS Setup"
echo "============================================"
echo ""

# -------------------------------------------------------------------
# Step 1: Install cloudflared
# -------------------------------------------------------------------
echo "[1/5] Installing cloudflared..."
if ! command -v cloudflared &>/dev/null; then
  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
  echo "  Installed cloudflared $(cloudflared --version)"
else
  echo "  cloudflared already installed: $(cloudflared --version)"
fi

# -------------------------------------------------------------------
# Step 2: Clone repo and build Docker image
# -------------------------------------------------------------------
echo ""
echo "[2/5] Setting up the application..."

REPO_DIR="/opt/infront-cms"

if [ -d "$REPO_DIR" ]; then
  echo "  Updating existing repo..."
  cd "$REPO_DIR"
  git pull
else
  echo "  Cloning repo..."
  git clone https://github.com/stefanospp/infront-cms.git "$REPO_DIR"
  cd "$REPO_DIR"
fi

echo "  Building Docker image (this may take a few minutes)..."
docker build -t infront-admin .

# -------------------------------------------------------------------
# Step 3: Start the admin container
# -------------------------------------------------------------------
echo ""
echo "[3/5] Starting admin container..."

# Stop existing container if running
docker stop infront-admin 2>/dev/null || true
docker rm infront-admin 2>/dev/null || true

# Prompt for env vars if not set
# Auth is handled by BetterAuth at auth.infront.cy — no local password hash needed.

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo ""
  echo "  Enter Cloudflare API Token:"
  read -r CLOUDFLARE_API_TOKEN
fi

if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "  Enter Cloudflare Account ID:"
  read -r CLOUDFLARE_ACCOUNT_ID
fi

if [ -z "${CLOUDFLARE_ZONE_ID:-}" ]; then
  echo "  Enter Cloudflare Zone ID (for infront.cy):"
  read -r CLOUDFLARE_ZONE_ID
fi

docker run -d \
  --name infront-admin \
  --restart unless-stopped \
  -p 127.0.0.1:4321:4321 \
  -v infront-admin-sites:/app/sites \
  -e HOST=0.0.0.0 \
  -e PORT=4321 \
  -e NODE_ENV=production \
  -e "CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}" \
  -e "CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}" \
  -e "CLOUDFLARE_ZONE_ID=${CLOUDFLARE_ZONE_ID}" \
  infront-admin

echo "  Container started. Checking health..."
sleep 3
if docker ps | grep -q infront-admin; then
  echo "  Container is running."
else
  echo "  ERROR: Container failed to start. Check: docker logs infront-admin"
  exit 1
fi

# -------------------------------------------------------------------
# Step 4: Set up Cloudflare Tunnel
# -------------------------------------------------------------------
echo ""
echo "[4/5] Setting up Cloudflare Tunnel..."

if [ ! -f ~/.cloudflared/cert.pem ]; then
  echo ""
  echo "  You need to authenticate cloudflared with your Cloudflare account."
  echo "  A URL will be shown — open it in your browser and authorize."
  echo ""
  cloudflared tunnel login
fi

# Create tunnel if it doesn't exist
if ! cloudflared tunnel list | grep -q "infront-admin"; then
  cloudflared tunnel create infront-admin
  echo "  Tunnel 'infront-admin' created."
else
  echo "  Tunnel 'infront-admin' already exists."
fi

# Get the tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep "infront-admin" | awk '{print $1}')
echo "  Tunnel ID: ${TUNNEL_ID}"

# Write tunnel config
mkdir -p /etc/cloudflared
cat > /etc/cloudflared/config.yml << TUNNELCONF
tunnel: ${TUNNEL_ID}
credentials-file: /root/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: web.infront.cy
    service: http://localhost:4321
  - service: http_status:404
TUNNELCONF

echo "  Tunnel config written to /etc/cloudflared/config.yml"

# Route DNS (creates CNAME automatically)
echo "  Setting up DNS routing..."
cloudflared tunnel route dns infront-admin web.infront.cy 2>/dev/null || echo "  DNS route may already exist."

# -------------------------------------------------------------------
# Step 5: Install tunnel as systemd service
# -------------------------------------------------------------------
echo ""
echo "[5/5] Installing tunnel as system service..."

cloudflared service install 2>/dev/null || echo "  Service may already be installed."
systemctl enable cloudflared
systemctl restart cloudflared

echo "  Tunnel service started."

# -------------------------------------------------------------------
# Done
# -------------------------------------------------------------------
echo ""
echo "============================================"
echo "  Setup complete!"
echo "============================================"
echo ""
echo "  Admin URL:  https://web.infront.cy"
echo "  Auth:       BetterAuth SSO at auth.infront.cy"
echo ""
echo "  To update the admin later:"
echo "    cd /opt/infront-cms"
echo "    git pull"
echo "    docker build -t infront-admin ."
echo "    docker stop infront-admin && docker rm infront-admin"
echo "    # Re-run the docker run command above"
echo "    systemctl restart cloudflared"
echo ""
echo "  To check status:"
echo "    docker logs infront-admin"
echo "    systemctl status cloudflared"
echo ""
