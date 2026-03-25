# File Storage Architecture

This document covers all file storage across the platform: Directus CMS uploads, CDN media files, and the Cloudflare R2 infrastructure that backs them.

## Overview

All file storage is centralized on **Cloudflare R2** (S3-compatible object storage). No files are stored on the VPS disk. This keeps the Hetzner VPS disk clean, provides global edge caching for public files, and eliminates egress costs.

```
                     Cloudflare R2
                ┌────────────────────────┐
                │                        │
                │  infront-cdn (EU)      │   ← Public files: cdn.infront.cy
                │  infront-uploads       │   ← Private files (presigned URLs)
                │                        │      + Directus CMS uploads
                └────────┬───────────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
    Platform API    Directus CMS    Browser
    (cdn-files)     (S3 driver)     (presigned PUT)
```

## R2 Buckets

### infront-cdn (public)

| Property | Value |
|----------|-------|
| Jurisdiction | EU (GDPR compliant) |
| S3 Endpoint | `https://0d1eacba26b2f60ce76fd618ba21afa6.eu.r2.cloudflarestorage.com` |
| Custom Domain | `cdn.infront.cy` (Active, Cloudflare edge-cached) |
| Public Access | Enabled |
| Storage Class | Standard |
| Purpose | Public media files for client websites |
| Path Structure | `/<clientId>/<folder>/<filename>` |
| CORS Origins | `https://web.infront.cy`, `https://portal.infront.cy`, `http://localhost:4321` |
| CORS Methods | GET, PUT, HEAD |
| Max Age | 3600s |

**How files get here:** The admin UI (`web.infront.cy/media`) or client portal (`portal.infront.cy/files`) requests a presigned upload URL from the platform API. The browser PUTs the file directly to R2. After upload, the platform API records the file metadata in the `cdn_files` database table.

**Public URLs:** `https://cdn.infront.cy/<clientId>/images/<uuid>-<filename>`

### infront-uploads (private)

| Property | Value |
|----------|-------|
| Jurisdiction | Default (auto-selected by Cloudflare) |
| S3 Endpoint | `https://0d1eacba26b2f60ce76fd618ba21afa6.r2.cloudflarestorage.com` |
| Custom Domain | None |
| Public Access | Disabled |
| Storage Class | Standard |
| Purpose | Private CDN files (presigned URL access) + all Directus CMS uploads |
| Path Structure | CDN: `/<clientId>/...`, Directus: `/<slug>/...` |

**Jurisdiction matters:** This bucket is on the **default** (non-EU) endpoint. Using the EU endpoint (`*.eu.r2.cloudflarestorage.com`) to access this bucket returns 403. This is the most common misconfiguration.

## R2 API Token

| Property | Value |
|----------|-------|
| Token Name | `infront-platform-cdn` |
| Permission | Object Read & Write |
| Scope | `infront-cdn` (EU), `infront-uploads` |
| TTL | Forever |

This single token is used by both the platform API and all Directus instances. The credentials are:
- `Access Key ID` — stored as `R2_CDN_ACCESS_KEY_ID` / `R2_ACCESS_KEY_ID` / `STORAGE_S3_KEY`
- `Secret Access Key` — stored as `R2_CDN_SECRET_ACCESS_KEY` / `R2_SECRET_ACCESS_KEY` / `STORAGE_S3_SECRET`

Different env var names are used by different services but they all reference the same token.

## Directus CMS Storage

All Directus instances use the **shared `infront-uploads` R2 bucket** as their file storage backend, with path-based isolation per client.

### Configuration

Each Directus `docker-compose.yml` sets these environment variables:

```yaml
STORAGE_LOCATIONS: "s3"
STORAGE_S3_DRIVER: "s3"
STORAGE_S3_KEY: "${STORAGE_S3_KEY}"
STORAGE_S3_SECRET: "${STORAGE_S3_SECRET}"
STORAGE_S3_BUCKET: "${STORAGE_S3_BUCKET:-infront-uploads}"
STORAGE_S3_REGION: "auto"
STORAGE_S3_ENDPOINT: "${STORAGE_S3_ENDPOINT}"
STORAGE_S3_ROOT: "${SLUG}/"
```

The `STORAGE_S3_ROOT` is set to `${SLUG}/` — this creates a virtual folder prefix in R2 so each client's files are isolated:

```
infront-uploads/
  theorium/          ← Directus files for theorium
  nikolaspetrou/     ← Directus files for nikolaspetrou
  atelier-kosta/     ← Directus files for atelier-kosta
  meridian-properties/ ← Directus files for meridian-properties
  1/                 ← CDN files for client ID 1 (platform API)
  2/                 ← CDN files for client ID 2
```

### Instance Details

| Instance | Port | Slug/R2 Prefix | Docker Compose |
|----------|------|----------------|----------------|
| theorium | 8060 | `theorium/` | `infra/docker/theorium/docker-compose.yml` |
| nikolaspetrou | 8057 | `nikolaspetrou/` | `infra/docker/nikolaspetrou/docker-compose.yml` |
| atelier-kosta | 8055 | `atelier-kosta/` | `infra/docker/atelier-kosta/docker-compose.yml` |
| meridian-properties | 8056 | `meridian-properties/` | `infra/docker/meridian-properties/docker-compose.yml` |

### .env Variables (per instance)

Each instance's `.env` file on the VPS (`/opt/infront-cms/infra/docker/<slug>/.env`) must include:

```env
SLUG=<client-slug>
STORAGE_S3_KEY=<R2 Access Key ID>
STORAGE_S3_SECRET=<R2 Secret Access Key>
STORAGE_S3_BUCKET=infront-uploads
STORAGE_S3_ENDPOINT=https://0d1eacba26b2f60ce76fd618ba21afa6.r2.cloudflarestorage.com
```

### How Directus File Access Works

1. **Upload:** User uploads via Directus admin UI -> Directus writes file to R2 at `<slug>/<uuid>.<ext>` -> file metadata stored in Directus Postgres DB
2. **Access:** Request to `/assets/<file-id>` -> Directus reads file from R2 -> serves it with optional transformations (resize, format, quality)
3. **Auth:** File access respects Directus permissions. Public read requires `directus_files` read permission on the public policy.

### Previous Storage (deprecated)

Before this change, each Directus instance used local Docker volumes:
```yaml
STORAGE_LOCATIONS: "local"
STORAGE_LOCAL_ROOT: "/directus/uploads"
volumes:
  - directus_uploads:/directus/uploads
```

The `directus_uploads` volumes still exist on the VPS but are empty and no longer mounted. They can be safely removed:
```bash
docker volume rm theorium_directus_uploads nikolaspetrou_directus_uploads \
  atelier-kosta_directus_uploads meridian-properties_directus_uploads
```

## CDN Media Library (Admin)

The admin UI at `web.infront.cy/media` provides a management interface for CDN files (separate from Directus files).

### Request Flow

```
Browser (CDNMediaLibrary.tsx)
  → /api/cdn/?limit=100          (Astro proxy route)
  → sites/admin/src/pages/api/cdn/[...path].ts
  → env('PLATFORM_API_URL')      (reads from /app/runtime-env.json)
  → http://172.17.0.1:3002/api/cdn-files?limit=100  (platform API)
  → Postgres (cdn_files table) + R2 (presigned URLs)
```

### Key Implementation Detail

The proxy route uses the `env()` helper from `sites/admin/src/lib/env.ts` instead of `process.env` because **Vite replaces `process.env.*` references at build time**. The `docker-entrypoint.sh` writes runtime env vars to `/app/runtime-env.json`, which the `env()` helper reads.

### Upload Flow

1. Browser calls `POST /api/cdn/upload-url` with file metadata
2. Platform API generates a presigned PUT URL for R2
3. Browser PUTs the file directly to R2 (requires CORS on the bucket)
4. Browser calls `POST /api/cdn/confirm` to record the file in the database
5. File is now accessible at `https://cdn.infront.cy/<clientId>/<folder>/<filename>`

### Toggle Public/Private

Toggling visibility copies the file between buckets:
- **Public:** File in `infront-cdn` -> accessible via `cdn.infront.cy`
- **Private:** File in `infront-uploads` -> accessible via presigned URLs (1hr expiry)

This requires the R2 API token to have write access to both buckets.

## Directus vs CDN: Two Separate Systems

| Aspect | Directus Files | CDN Files |
|--------|---------------|-----------|
| Storage Backend | `infront-uploads` R2 bucket | `infront-cdn` (public) or `infront-uploads` (private) |
| Access URL | `https://cms.<client>.infront.cy/assets/<fileId>` | `https://cdn.infront.cy/<clientId>/<path>` |
| Management UI | Directus admin panel | `web.infront.cy/media` (admin) or `portal.infront.cy/files` (client) |
| API | Directus REST/GraphQL API | Platform API `/api/cdn-files/*` |
| Image Transforms | Built-in (resize, format, quality via query params) | None (raw files only) |
| Auth | Directus permissions system | Platform API internal key |
| Database | Per-instance Directus Postgres | Shared `agency` Postgres (`cdn_files` table) |
| Quota | Not enforced (R2 has no built-in limits) | Enforced per client in platform API (default 500 MB) |
| Use Case | Content managed through CMS collections | Generic media uploads, videos, downloadable resources |

**There is no sync between these two systems.** They share the same R2 bucket (`infront-uploads`) but use different path prefixes and are managed independently.

## Provisioning New CMS Instances

The provisioning script (`infra/provisioning/provision-cms.sh`) automatically:
1. Auto-detects R2 credentials from existing instances
2. Writes them to the new instance's `.env` file
3. Sets `SLUG` for path-based isolation

If R2 credentials aren't found, it warns and the instance will need them added manually before file uploads work.

## Cost

| Item | Cost |
|------|------|
| R2 Storage | $0.015/GB/month |
| R2 Class A Operations (write) | $4.50 per million |
| R2 Class B Operations (read) | $0.36 per million |
| R2 Egress via cdn.infront.cy | $0 (free via Cloudflare CDN) |
| R2 Free Tier | 10 GB storage, 1M Class A, 10M Class B per month |

At current usage (~6 MB across all clients), costs are well within the free tier.

## VPS Disk Impact

| Before (local volumes) | After (R2) |
|------------------------|------------|
| All uploads stored on VPS | Zero file storage on VPS |
| 38 GB disk, risk of filling | Disk only used for Docker images + Postgres data |
| No per-client limits | Per-client quotas via platform API |
| No redundancy | Cloudflare's global infrastructure |

Current VPS disk usage: 17 GB of 38 GB (45%). With R2 storage, file uploads will never increase this.

## Troubleshooting

### Directus upload fails with S3 error

1. Check the Directus container logs: `docker logs <slug>-directus-1`
2. Verify R2 credentials in `.env`: `grep STORAGE_S3 /opt/infront-cms/infra/docker/<slug>/.env`
3. Verify the endpoint is the **default** (non-EU) one for `infront-uploads`: `https://...r2.cloudflarestorage.com` (NOT `.eu.r2.cloudflarestorage.com`)

### CDN upload fails with 503

Platform API can't reach R2. Check:
1. R2 env vars: `docker exec infront-api env | grep R2`
2. Platform API logs: `docker logs --tail 20 infront-api`

### CDN upload fails with "Failed to fetch" (CORS)

The browser can't PUT directly to R2. Check CORS on the `infront-cdn` bucket:
- Cloudflare Dashboard > R2 > infront-cdn > Settings > CORS Policy
- Must allow origins: `https://web.infront.cy`, `https://portal.infront.cy`
- Must allow methods: GET, PUT, HEAD

### Toggle public/private fails with 403

The R2 API token can't write to one of the buckets. Check:
1. Both endpoints are correct (EU for `infront-cdn`, default for `infront-uploads`)
2. The R2 token has Object Read & Write on both buckets
3. Platform API logs: `docker logs --tail 20 infront-api`

### Files accessible in Directus but 403 without auth

This is expected. Directus files require authentication unless `directus_files` has public read permission. The provisioning script sets this automatically for new instances.
