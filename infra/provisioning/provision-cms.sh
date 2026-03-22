#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# Directus CMS provisioning script
#
# Provisions a Directus instance for a CMS-tier client site:
#   1. Generates secure .env credentials
#   2. Starts Docker containers
#   3. Waits for Directus to be healthy
#   4. Creates all standard collections and fields
#   5. Sets public read permissions
#   6. Outputs admin credentials and API connection details
#
# Usage:
#   ./provision-cms.sh <slug> [domain]
#
# Arguments:
#   slug    The site slug (e.g. "meridian-properties")
#   domain  Optional domain (defaults to <slug>.infront.cy)
#
# Prerequisites:
#   - Docker running
#   - infra/docker/<slug>/docker-compose.yml exists
#     (created by the site generator or new-site.sh)
#
# Example:
#   ./provision-cms.sh meridian-properties meridianproperties.cy
# -------------------------------------------------------------------

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DOCKER_BASE="${REPO_ROOT}/infra/docker"
COLLECTIONS_FILE="${DOCKER_BASE}/template/collections.json"

# --- Colours ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()   { echo -e "${GREEN}[+]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[x]${NC} $1" >&2; }
info()  { echo -e "${CYAN}[-]${NC} $1"; }

# --- Argument validation ---

if [ $# -lt 1 ]; then
  echo "Usage: $0 <slug> [domain]"
  exit 1
fi

SLUG="$1"
DOMAIN="${2:-${SLUG}.infront.cy}"
DOCKER_DIR="${DOCKER_BASE}/${SLUG}"

# Validate slug
if ! echo "${SLUG}" | grep -qE '^[a-z][a-z0-9-]{1,62}$'; then
  error "Invalid slug: ${SLUG}"
  error "Must be lowercase, start with a letter, 2-63 chars, letters/numbers/hyphens only."
  exit 1
fi

# Check required tools
for cmd in curl python3 openssl docker; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    error "Required tool not found: ${cmd}"
    exit 1
  fi
done

# Check Docker is running
if ! docker info >/dev/null 2>&1; then
  error "Docker is not running. Start Docker and try again."
  exit 1
fi

# Check docker-compose.yml exists
if [ ! -f "${DOCKER_DIR}/docker-compose.yml" ]; then
  error "Docker Compose file not found: ${DOCKER_DIR}/docker-compose.yml"
  error "Run the site generator first (admin wizard or new-site.sh with tier=cms)."
  exit 1
fi

# Check collections.json exists
if [ ! -f "${COLLECTIONS_FILE}" ]; then
  error "Collections template not found: ${COLLECTIONS_FILE}"
  exit 1
fi

# ===================================================================
# Phase 1: Generate .env
# ===================================================================

if [ -f "${DOCKER_DIR}/.env" ]; then
  warn "Using existing .env (delete it to regenerate credentials)"
  # shellcheck disable=SC1090
  source "${DOCKER_DIR}/.env"
  PORT="${PORT:-8055}"
  ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${DOMAIN}}"
  ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
else
  log "Generating secure credentials..."

  # Auto-assign port by scanning existing .env files
  PORT=$(find "${DOCKER_BASE}" -name ".env" -not -path "*/template/*" -exec grep -h '^PORT=' {} \; 2>/dev/null \
    | cut -d= -f2 | sort -n | tail -1 | python3 -c "
import sys
line = sys.stdin.read().strip()
print(int(line) + 1 if line else 8055)
")

  # Check port is free
  while lsof -i :"${PORT}" >/dev/null 2>&1; do
    PORT=$((PORT + 1))
  done

  KEY=$(openssl rand -hex 32)
  SECRET=$(openssl rand -hex 32)
  DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)
  ADMIN_EMAIL="admin@${DOMAIN}"
  ADMIN_PASSWORD="$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 16)!1"

  cat > "${DOCKER_DIR}/.env" <<EOF
PORT=${PORT}
KEY=${KEY}
SECRET=${SECRET}
DB_USER=directus
DB_PASSWORD=${DB_PASSWORD}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
PUBLIC_URL=https://cms.${DOMAIN}
EOF

  log "Credentials written to ${DOCKER_DIR}/.env (port: ${PORT})"
fi

export DIRECTUS_URL="http://localhost:${PORT}"
export ADMIN_EMAIL
export ADMIN_PASSWORD
export COLLECTIONS_FILE

# ===================================================================
# Phase 2: Start Docker containers
# ===================================================================

log "Starting Docker containers..."
docker compose -f "${DOCKER_DIR}/docker-compose.yml" --env-file "${DOCKER_DIR}/.env" up -d 2>&1 \
  | grep -v "^time=" || true

# ===================================================================
# Phase 3: Wait for Directus health
# ===================================================================

log "Waiting for Directus to be healthy at ${DIRECTUS_URL}..."
MAX_ATTEMPTS=60
ATTEMPT=0
while true; do
  if curl -sf "${DIRECTUS_URL}/server/ping" 2>/dev/null | grep -q "pong"; then
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  if [ ${ATTEMPT} -ge ${MAX_ATTEMPTS} ]; then
    error "Directus did not become healthy within 2 minutes."
    error "Check logs: docker compose -f ${DOCKER_DIR}/docker-compose.yml logs directus"
    exit 1
  fi
  sleep 2
done
log "Directus is healthy."

# ===================================================================
# Phase 4-7: Create collections, fields, and permissions
# ===================================================================

log "Provisioning collections and permissions..."

python3 << 'PYTHON_SCRIPT'
import json
import sys
import os
import urllib.request
import urllib.error

DIRECTUS_URL = os.environ["DIRECTUS_URL"]
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
COLLECTIONS_FILE = os.environ["COLLECTIONS_FILE"]

def api(method, endpoint, data=None, token=None):
    """Make an API call to Directus."""
    url = f"{DIRECTUS_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read()), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return json.loads(body), e.code
        except json.JSONDecodeError:
            return {"error": body}, e.code

# --- Authenticate ---
print("  Authenticating...")
result, status = api("POST", "/auth/login", {
    "email": ADMIN_EMAIL,
    "password": ADMIN_PASSWORD,
})
if status != 200 or "data" not in result:
    print(f"  ERROR: Authentication failed (HTTP {status})")
    sys.exit(1)
token = result["data"]["access_token"]

# --- Load collections template ---
with open(COLLECTIONS_FILE) as f:
    template = json.load(f)

common_fields = template["commonFields"]
collections = template["collections"]

# --- Get existing collections ---
result, _ = api("GET", "/collections", token=token)
existing = {c["collection"] for c in result.get("data", [])}

# --- Create collections and fields ---
for coll in collections:
    name = coll["collection"]

    if name in existing:
        print(f"  {name}: already exists (checking fields)")
    else:
        result, status = api("POST", "/collections", {
            "collection": name,
            "meta": coll["meta"],
            "schema": {},
        }, token=token)
        if status in (200, 201):
            print(f"  {name}: created")
        else:
            err = result.get("errors", [{}])[0].get("message", "unknown error")
            print(f"  {name}: FAILED ({err})")
            continue

    # Get existing fields for this collection
    fields_result, _ = api("GET", f"/fields/{name}", token=token)
    existing_fields = {f["field"] for f in fields_result.get("data", [])}

    # Create common fields + collection-specific fields
    all_fields = common_fields + coll["fields"]
    for field_def in all_fields:
        field_name = field_def["field"]
        if field_name in existing_fields:
            continue

        payload = {
            "field": field_def["field"],
            "type": field_def["type"],
        }
        if "schema" in field_def:
            payload["schema"] = field_def["schema"]
        else:
            payload["schema"] = {"is_nullable": True}
        if "meta" in field_def:
            payload["meta"] = field_def["meta"]

        result, status = api("POST", f"/fields/{name}", payload, token=token)
        if status not in (200, 201):
            err = result.get("errors", [{}])[0].get("message", "unknown error")
            print(f"    field {field_name}: FAILED ({err})")

print(f"  {len(collections)} collections provisioned.")

# --- Set public read permissions ---
print("  Setting public read permissions...")

# Find the public policy
result, _ = api("GET", "/policies", token=token)
public_policy = None
for policy in result.get("data", []):
    if policy.get("name") == "$t:public_label":
        public_policy = policy["id"]
        break

if not public_policy:
    print("  WARNING: Public policy not found. Skipping permissions.")
    sys.exit(0)

# Get existing permissions
result, _ = api("GET", "/permissions", token=token)
existing_perms = set()
for perm in result.get("data", []):
    if perm.get("policy") == public_policy and perm.get("action") == "read":
        existing_perms.add(perm["collection"])

# Grant read on all collections + directus_files
perm_collections = [c["collection"] for c in collections] + ["directus_files"]
created_count = 0
for coll_name in perm_collections:
    if coll_name in existing_perms:
        continue
    result, status = api("POST", "/permissions", {
        "policy": public_policy,
        "collection": coll_name,
        "action": "read",
        "fields": ["*"],
    }, token=token)
    if status in (200, 201):
        created_count += 1
    else:
        err = result.get("errors", [{}])[0].get("message", "unknown error")
        print(f"    permission {coll_name}: FAILED ({err})")

print(f"  Public read permissions set ({created_count} new, {len(existing_perms)} existing).")
print("  Done.")
PYTHON_SCRIPT

# ===================================================================
# Phase 8: Output summary
# ===================================================================

echo ""
echo -e "${BOLD}============================================${NC}"
echo -e "${BOLD}  CMS provisioned: ${CYAN}${SLUG}${NC}"
echo -e "${BOLD}============================================${NC}"
echo ""
echo -e "  Directus Admin:  ${CYAN}${DIRECTUS_URL}${NC}"
echo -e "  Admin email:     ${ADMIN_EMAIL}"
echo -e "  Admin password:  ${ADMIN_PASSWORD}"
echo ""
echo -e "  ${BOLD}Add to site .env or Doppler:${NC}"
echo -e "    DIRECTUS_URL=${DIRECTUS_URL}"
echo ""
echo -e "  ${BOLD}Collections:${NC}"
echo -e "    pages, posts, team, services, testimonials,"
echo -e "    faqs, gallery, clients, stats, comparisons"
echo ""
echo -e "  Public read access: ${GREEN}enabled${NC}"
echo -e "${BOLD}============================================${NC}"
