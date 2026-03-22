# CMS Infrastructure

## Overview

CMS-tier sites connect to a Directus 11 instance for dynamic content management. Each client gets an isolated Directus + PostgreSQL stack running in Docker. The platform provides automated provisioning that creates the database, collections, fields, and permissions in a single command.

## Architecture

```
┌────────────────────────┐     ┌────────────────────────┐
│   Client Site (Astro)  │     │   Directus 11 (Docker) │
│                        │     │                        │
│  src/lib/directus.ts ──┼────►│  PostgreSQL + Directus │
│  (fetches at build)    │     │  Port: auto-assigned   │
│                        │     │  Collections: 10       │
└────────────────────────┘     └────────────────────────┘
        Cloudflare Workers              Hetzner VPS
```

Each CMS instance is self-contained:
- **Isolated database** — no cross-client data leakage
- **Independent lifecycle** — update, backup, or restore one client without affecting others
- **Auto-assigned ports** — no manual port management needed

## File Structure

```
infra/docker/
├── template/
│   ├── docker-compose.yml      # Base Docker Compose (Directus + PostgreSQL)
│   ├── .env.example            # Placeholder environment variables
│   └── collections.json        # Standard collection definitions (10 collections)
│
├── <client-slug>/              # One folder per CMS client
│   ├── docker-compose.yml      # Copied from template by site generator
│   ├── .env                    # Generated credentials (gitignored)
│   └── schema-snapshot.yaml    # Optional: client-specific schema additions
│
infra/provisioning/
├── provision-cms.sh            # Automated CMS provisioning script
└── new-site.sh                 # Site generation (copies docker template)

infra/backups/
├── pg_backup.sh                # Database backup (all clients, S3)
├── uploads_backup.sh           # Media file backup (S3)
└── restore.sh                  # Per-client restore (DB or uploads)
```

## Quick Start

### Provisioning a New CMS Client

After creating a CMS-tier site (via the admin wizard or `new-site.sh`), provision the Directus instance:

```bash
./infra/provisioning/provision-cms.sh <slug> [domain]
```

Example:

```bash
./infra/provisioning/provision-cms.sh meridian-properties meridianproperties.cy
```

The script handles everything:

1. Generates secure credentials (random keys, passwords)
2. Starts PostgreSQL + Directus containers
3. Waits for Directus to be healthy
4. Creates all 10 standard collections with fields
5. Sets public read permissions
6. Outputs admin URL, credentials, and site connection details

### End-to-End CMS Site Creation

```bash
# Step 1: Create the site (via admin wizard at /sites/new, or CLI)
./infra/provisioning/new-site.sh my-client cms my-client.com

# Step 2: Provision the CMS
./infra/provisioning/provision-cms.sh my-client my-client.com

# Step 3: Set DIRECTUS_URL in site environment
# Add to sites/my-client/.env or Doppler:
#   DIRECTUS_URL=http://localhost:<port>

# Step 4: Build and deploy
pnpm --filter @agency/my-client run build
cd sites/my-client && npx wrangler deploy
```

## Provisioning Script Reference

### Usage

```
./infra/provisioning/provision-cms.sh <slug> [domain]
```

| Argument | Required | Description |
|----------|----------|-------------|
| `slug` | Yes | Site slug (e.g. `meridian-properties`) |
| `domain` | No | Client domain (defaults to `<slug>.infront.cy`) |

### Prerequisites

- Docker running
- `infra/docker/<slug>/docker-compose.yml` exists (created by site generator)
- `curl`, `python3`, `openssl` available

### What It Does

| Phase | Action | Idempotent |
|-------|--------|------------|
| 1 | Validate slug, check docker-compose.yml exists | - |
| 2 | Generate `.env` with secure random credentials | Yes (skips if `.env` exists) |
| 3 | Start Docker containers (`docker compose up -d`) | Yes |
| 4 | Wait for Directus health (`/server/ping`) | Yes |
| 5 | Authenticate with Directus admin API | - |
| 6 | Create 10 collections with all fields | Yes (skips existing) |
| 7 | Set public read permissions on all collections | Yes (skips existing) |
| 8 | Output admin URL, credentials, connection details | - |

### Credential Generation

When no `.env` exists, the script generates:

| Variable | How Generated |
|----------|--------------|
| `PORT` | Auto-assigned (scans existing `.env` files, picks next available) |
| `KEY` | `openssl rand -hex 32` |
| `SECRET` | `openssl rand -hex 32` |
| `DB_PASSWORD` | `openssl rand -base64 24` (alphanumeric only) |
| `ADMIN_EMAIL` | `admin@<domain>` |
| `ADMIN_PASSWORD` | `openssl rand -base64 16` + `!1` |
| `PUBLIC_URL` | `https://cms.<domain>` |

### Re-running the Script

The script is fully idempotent. Re-running it:
- Preserves existing `.env` credentials
- Detects running containers (no restart)
- Skips existing collections and fields
- Skips existing permissions

This is useful for:
- Adding new collections after updating `collections.json`
- Recovering from a partial run that failed mid-way
- Verifying that provisioning is complete

## Standard Collections

The template defines 10 collections in `infra/docker/template/collections.json`. Every CMS client gets these by default.

| Collection | Icon | Fields | Used By |
|------------|------|--------|---------|
| `pages` | description | title, slug, content, seo_title, seo_description, og_image | `[...slug].astro` |
| `posts` | article | title, slug, content, excerpt, featured_image, published_date, author, seo_* | `blog/` pages |
| `team` | people | name, role, bio, photo, email | `about-cms.astro` |
| `services` | build | title, description, icon, image, href | `index-cms.astro` |
| `testimonials` | format_quote | quote, author, role, image | `index-cms.astro` |
| `faqs` | help | question, answer | `faq.astro` |
| `gallery` | photo_library | title, description, image, href | `gallery.astro` |
| `clients` | business | name, logo, href | `index-cms.astro` (LogoCloud) |
| `stats` | bar_chart | value, label, prefix, suffix | `index-cms.astro` (StatsCounter) |
| `comparisons` | compare | name, price, period, description, features, cta_*, highlighted | `compare.astro` |

All collections share these common fields:
- `status` — Draft / Published / Archived (default: Draft)
- `sort_order` — drag-to-reorder in Directus UI

### Adding Client-Specific Collections

For collections unique to a client (e.g. `properties` for a real estate site):

1. Add functions to `sites/<slug>/src/lib/directus.ts`
2. Create the collection via the Directus admin UI at `http://localhost:<port>`
3. Or use the Directus API directly

The standard 10 collections cover most use cases. Client-specific collections are the exception, not the rule.

## Site Integration

### Directus Client (`src/lib/directus.ts`)

Every CMS site has a Directus client in `src/lib/directus.ts` that wraps the shared utilities from `@agency/utils`:

```typescript
import { createDirectusClient, getPublishedItems, getItemBySlug } from '@agency/utils';

const directusUrl = import.meta.env.DIRECTUS_URL;
const directusToken = import.meta.env.DIRECTUS_TOKEN;

export const client = directusUrl
  ? createDirectusClient(directusUrl, directusToken)
  : null;

export async function getTeamMembers() {
  if (!client) return [];
  return getPublishedItems(client, 'team', {
    fields: ['id', 'name', 'role', 'bio', 'photo', 'email', 'sort_order'],
    sort: ['sort_order'],
  });
}
```

Key behaviours:
- Returns empty arrays when `DIRECTUS_URL` is not set (graceful fallback)
- Only fetches items with `status: "published"`
- Respects `sort_order` for consistent ordering
- Uses `getDirectusImageUrl()` helper for image transforms

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DIRECTUS_URL` | Yes | Full URL to the Directus instance (e.g. `http://localhost:8055`) |
| `DIRECTUS_TOKEN` | No | Static API token (not needed if public read permissions are set) |

Set these in the site's `.env` file or via Doppler for production.

### CMS Pages vs Static Pages

The site generator handles page swapping based on tier:

| Tier | `index.astro` | `about.astro` |
|------|---------------|---------------|
| Static | Template-generated (hardcoded content) | Template-generated |
| CMS | `index-cms.astro` (fetches from Directus) | `about-cms.astro` (fetches from Directus) |

CMS pages fetch data at build time (Astro static output). To update content:
1. Edit in Directus admin
2. Rebuild the site (`pnpm build` or "Redeploy" in admin UI)

## Backups

### Database Backup

`infra/backups/pg_backup.sh` automatically discovers and backs up all client databases:

```bash
# Run manually
./infra/backups/pg_backup.sh

# Or via cron (recommended: daily at 2 AM)
0 2 * * * /opt/infront-cms/infra/backups/pg_backup.sh
```

Backups are:
- Compressed with gzip
- Uploaded to S3 (`s3://agency-cms-backups/postgres/<db>/`)
- Locally retained for 30 days (configurable via `RETENTION_DAYS`)

### Media Backup

`infra/backups/uploads_backup.sh` syncs all Directus upload directories to S3:

```bash
./infra/backups/uploads_backup.sh
```

### Restore

```bash
# Restore database
./infra/backups/restore.sh db <slug> <backup-file.sql.gz>

# Restore uploads
./infra/backups/restore.sh uploads <slug> [s3-path]
```

## Docker Compose Configuration

### `docker-compose.yml`

```yaml
services:
  directus:
    image: directus/directus:11
    ports:
      - "${PORT:-8055}:8055"
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
    volumes:
      - directus_uploads:/directus/uploads
      - directus_extensions:/directus/extensions
    depends_on:
      database:
        condition: service_started
    restart: unless-stopped

  database:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_USER: "${DB_USER}"
      POSTGRES_PASSWORD: "${DB_PASSWORD}"
      POSTGRES_DB: "directus"
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: unless-stopped
```

### Common Docker Commands

```bash
# Start
docker compose -f infra/docker/<slug>/docker-compose.yml --env-file infra/docker/<slug>/.env up -d

# Stop
docker compose -f infra/docker/<slug>/docker-compose.yml down

# Logs
docker compose -f infra/docker/<slug>/docker-compose.yml logs -f directus

# Restart Directus only
docker compose -f infra/docker/<slug>/docker-compose.yml restart directus

# Full teardown (removes volumes/data)
docker compose -f infra/docker/<slug>/docker-compose.yml down -v
```

## Production Deployment

### DNS Setup

For production CMS instances on Hetzner:

1. Point `cms.<domain>` to the Hetzner VPS IP
2. Configure Caddy reverse proxy to route to the correct port
3. Caddy handles SSL automatically via Let's Encrypt

Example Caddy config:

```
cms.meridianproperties.cy {
    reverse_proxy localhost:8055
}
```

### Security Checklist

- [ ] Change default admin password after provisioning
- [ ] Disable public registration in Directus settings
- [ ] Restrict CORS to the site's origin domain
- [ ] Limit file upload types (images only for most sites)
- [ ] Set up automated backups via cron
- [ ] Monitor uptime via Betterstack
