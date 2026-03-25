# Phase 2: CMS Setup (Directus on VPS)

Set up a Directus CMS instance on the Hetzner VPS with Docker, expose it via Cloudflare Tunnel, configure collections, users, and transactional email.

## Step 2.1: Provision Docker infrastructure

If not already done, create the Docker config directory:

```bash
ssh root@49.12.4.77
mkdir -p /opt/infront-cms/infra/docker/<slug>
```

### docker-compose.yml

Create `infra/docker/<slug>/docker-compose.yml`:

```yaml
services:
  directus:
    image: directus/directus:11.17
    ports:
      - "127.0.0.1:${PORT:-8055}:8055"
    environment:
      KEY: "${KEY}"
      SECRET: "${SECRET}"
      DB_CLIENT: "pg"
      DB_HOST: "database"
      DB_PORT: "5432"
      DB_DATABASE: "directus"
      DB_USER: "${DB_USER}"
      DB_PASSWORD: "${DB_PASSWORD}"
      ADMIN_EMAIL: "${ADMIN_EMAIL}"
      ADMIN_PASSWORD: "${ADMIN_PASSWORD}"
      PUBLIC_URL: "${PUBLIC_URL}"
      CORS_ENABLED: "true"
      CORS_ORIGIN: "false"
      RATE_LIMITER_ENABLED: "true"
      STORAGE_LOCATIONS: "s3"
      STORAGE_S3_DRIVER: "s3"
      STORAGE_S3_KEY: "${STORAGE_S3_KEY}"
      STORAGE_S3_SECRET: "${STORAGE_S3_SECRET}"
      STORAGE_S3_BUCKET: "${STORAGE_S3_BUCKET:-infront-uploads}"
      STORAGE_S3_REGION: "auto"
      STORAGE_S3_ENDPOINT: "${STORAGE_S3_ENDPOINT}"
      STORAGE_S3_ROOT: "${SLUG}/"
      EMAIL_FROM: "${EMAIL_FROM}"
      EMAIL_TRANSPORT: "${EMAIL_TRANSPORT}"
      EMAIL_SMTP_HOST: "${EMAIL_SMTP_HOST}"
      EMAIL_SMTP_PORT: "${EMAIL_SMTP_PORT}"
      EMAIL_SMTP_SECURE: "${EMAIL_SMTP_SECURE}"
      EMAIL_SMTP_USER: "${EMAIL_SMTP_USER}"
      EMAIL_SMTP_PASSWORD: "${EMAIL_SMTP_PASSWORD}"
      CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC: "'self' https://<client-domain>"
    volumes:
      - directus_extensions:/directus/extensions
    depends_on:
      database:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8055/server/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  database:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: "${DB_USER}"
      POSTGRES_PASSWORD: "${DB_PASSWORD}"
      POSTGRES_DB: "directus"
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-directus} -d directus"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.25'

volumes:
  directus_extensions:
  db_data:
```

**Critical notes:**
- `EMAIL_*` env vars MUST be listed explicitly in the `environment:` section. They are NOT auto-passed from `.env` to the container.
- `CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC` must include the client's domain to allow preview iframe embedding.
- Use Directus **11.17** (not 11.5) — needed for MCP server and visual editing features.

### .env file

Create `infra/docker/<slug>/.env` using the provisioning script or manually:

```bash
PORT=<next-available-port>  # Check existing .env files, increment from last used
KEY=<openssl rand -hex 32>
SECRET=<openssl rand -hex 32>
DB_USER=directus
DB_PASSWORD=<openssl rand -base64 24>
ADMIN_EMAIL=hello@<client-domain>
ADMIN_PASSWORD=<openssl rand -base64 16>
PUBLIC_URL=https://cms.<client-domain>
SLUG=<slug>

EMAIL_FROM=noreply@infront.cy
EMAIL_TRANSPORT=smtp
EMAIL_SMTP_HOST=smtp.resend.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=resend
EMAIL_SMTP_PASSWORD=<resend-api-key>
```

**Email port:** Use **587** (STARTTLS), NOT 465. Port 465 is blocked on the Hetzner VPS.

### Start the containers

```bash
cd /opt/infront-cms/infra/docker/<slug>
docker compose --env-file .env up -d
```

Verify:
```bash
curl -sf http://localhost:<port>/server/ping
# Should return: pong
```

## Step 2.2: Expose CMS via Cloudflare Tunnel

### Add ingress rule

Edit `/etc/cloudflared/config.yml` on the VPS:

```yaml
ingress:
  # ... existing rules ...
  - hostname: cms.<client-domain>
    service: http://localhost:<port>
  - service: http_status:404
```

**Insert the new rule BEFORE the catch-all `- service: http_status:404` line.**

### Create DNS record

The CNAME must be created in the **client's domain** zone (not infront.cy):

```bash
# If cloudflared has access to the client's zone:
cloudflared tunnel route dns infront-admin cms.<client-domain>

# If not (different zone), create the CNAME via Cloudflare API or dashboard:
# Type: CNAME
# Name: cms
# Target: <tunnel-id>.cfargotunnel.com
# Proxy: Proxied (orange cloud)
```

The tunnel ID can be found in `/etc/cloudflared/config.yml`.

### Restart tunnel

```bash
systemctl restart cloudflared
```

Verify:
```bash
curl -sf https://cms.<client-domain>/server/ping
# Should return: pong
```

## Step 2.3: Create collections and schema

### Option A: Apply schema snapshot (if one exists)

```bash
docker cp snapshot.yaml <slug>-directus-1:/directus/snapshot.yaml
docker exec <slug>-directus-1 npx directus schema apply --yes /directus/snapshot.yaml
```

### Option B: Use the provisioning script

```bash
./infra/provisioning/provision-cms.sh <slug> <client-domain>
```

This creates standard collections (pages, posts, team, etc.). For custom collections (like the videoshoot site's projects, services, testimonials, reels, hero, about, site_settings), create them via the Directus API.

### Option C: Create collections via API

Example for creating a collection:
```bash
curl -X POST "https://cms.<client-domain>/collections" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"collection":"projects","meta":{"icon":"videocam","singleton":false},"schema":{"name":"projects"}}'
```

Then add fields:
```bash
curl -X POST "https://cms.<client-domain>/fields/projects" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"field":"title","type":"string","meta":{"interface":"input","required":true}}'
```

**Remember to add `status` and `sort_order` fields to every collection.**

## Step 2.4: Set up users and permissions

### Create admin user (for yourself)

```bash
# Login as the initial admin
TOKEN=$(curl -s https://cms.<domain>/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<initial-admin>","password":"<password>"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_token'])")

# Create your admin user
curl -X POST "https://cms.<domain>/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"hello@infront.cy","password":"<password>","role":"<admin-role-id>"}'
```

### Create Editor role

```bash
# Create role
EDITOR_ROLE=$(curl -s -X POST "https://cms.<domain>/roles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Editor","admin_access":false,"app_access":true}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

# Create policy for the role
EDITOR_POLICY=$(curl -s -X POST "https://cms.<domain>/policies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Editor Policy","admin_access":false,"app_access":true}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

# Link policy to role via access
curl -X POST "https://cms.<domain>/access" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"role\":\"$EDITOR_ROLE\",\"policy\":\"$EDITOR_POLICY\"}"

# Add CRUD permissions on all content collections
for coll in projects services testimonials reels hero about site_settings directus_files directus_folders; do
  for action in create read update delete; do
    curl -X POST "https://cms.<domain>/permissions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"policy\":\"$EDITOR_POLICY\",\"collection\":\"$coll\",\"action\":\"$action\",\"fields\":[\"*\"]}"
  done
done
```

### Create client user

```bash
curl -X POST "https://cms.<domain>/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"client@example.com","password":"<random>","first_name":"Client","last_name":"Name","role":"'$EDITOR_ROLE'"}'
```

### Set public read permissions

Required for the Astro build to fetch published content:

```bash
# Get the public policy ID
PUBLIC_POLICY=$(curl -s "https://cms.<domain>/policies" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; [print(p['id']) for p in json.load(sys.stdin)['data'] if p['name']=='\$t:public_label']")

# Grant public read on all content collections + files
for coll in projects services testimonials reels hero about site_settings directus_files; do
  curl -X POST "https://cms.<domain>/permissions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"policy\":\"$PUBLIC_POLICY\",\"collection\":\"$coll\",\"action\":\"read\",\"fields\":[\"*\"]}"
done
```

### Create static API token

For build-time access (used in `.env` and GitHub secrets):

```bash
STATIC_TOKEN=$(openssl rand -hex 32)
curl -X PATCH "https://cms.<domain>/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$STATIC_TOKEN\"}"
echo "Static token: $STATIC_TOKEN"
```

## Step 2.5: Set default status to draft

```bash
for coll in projects services testimonials reels hero about site_settings; do
  curl -X PATCH "https://cms.<domain>/fields/$coll/status" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"schema":{"default_value":"draft"}}'
done
```

## Step 2.6: Seed content

Populate collections with the hardcoded content from the static site pages. For list collections, POST to `/items/<collection>`. For singletons, PATCH to `/items/<collection>`.

```bash
# List item example
curl -X POST "https://cms.<domain>/items/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"published","title":"Project Title","slug":"project-slug",...}'

# Singleton example
curl -X PATCH "https://cms.<domain>/items/hero" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"heading":"Hero Heading","subheading":"..."}'
```

## Step 2.7: Enable MCP server (optional)

Directus 11.12+ supports MCP for AI-assisted content management:

```bash
curl -X PATCH "https://cms.<domain>/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mcp_enabled":true}'
```

MCP URL: `https://cms.<domain>/mcp?access_token=<STATIC_TOKEN>`

## Step 2.8: Verify CMS setup

- [ ] CMS admin loads at `https://cms.<domain>/admin`
- [ ] Admin user can log in
- [ ] Editor user can log in and see content collections
- [ ] Editor cannot access Settings, Schema, or Roles
- [ ] All collections have data
- [ ] Password reset email works (trigger via `/auth/password/request`)
- [ ] Public API returns published items: `curl https://cms.<domain>/items/projects?limit=1`
