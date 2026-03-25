# Platform API (infront-api) — VPS Operations

The platform API (`infront-platform` repo) runs as a Docker container on the Hetzner VPS (49.12.4.77). It serves CDN file management, client data, and other platform-level endpoints.

## Container: `infront-api`

- **Image:** `infront-api`
- **Network:** `--network host` (binds directly to host network)
- **Port:** 3002
- **Database:** PostgreSQL container (`postgres`) on port 5432

## Environment Variables

```bash
docker run -d \
  --name infront-api \
  --network host \
  --restart unless-stopped \
  -e PORT=3002 \
  -e INTERNAL_API_KEY=<key> \
  # R2 CDN bucket (EU jurisdiction, public files)
  -e R2_CDN_ACCESS_KEY_ID=<key> \
  -e R2_CDN_SECRET_ACCESS_KEY=<secret> \
  -e R2_CDN_ENDPOINT=https://<account-id>.eu.r2.cloudflarestorage.com \
  -e R2_CDN_BUCKET=infront-cdn \
  -e R2_CDN_PUBLIC_URL=https://cdn.infront.cy \
  # R2 uploads bucket (default jurisdiction, private files)
  -e R2_ACCESS_KEY_ID=<key> \
  -e R2_SECRET_ACCESS_KEY=<secret> \
  -e R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com \
  -e R2_BUCKET=infront-uploads \
  infront-api
```

### R2 Endpoint Jurisdictions

The two R2 buckets use **different endpoints** because they are in different jurisdictions:

| Bucket | Jurisdiction | Endpoint |
|--------|-------------|----------|
| `infront-cdn` | EU | `https://<account-id>.eu.r2.cloudflarestorage.com` |
| `infront-uploads` | Default (auto) | `https://<account-id>.r2.cloudflarestorage.com` |

Using the wrong endpoint for a bucket returns 403.

### R2 API Token

Token name: `infront-platform-cdn`
- Permission: Object Read & Write
- Scoped to: `infront-cdn` (EU), `infront-uploads`
- Both `R2_CDN_ACCESS_KEY_ID` and `R2_ACCESS_KEY_ID` use the same token credentials

### R2 CORS Policy

The `infront-cdn` bucket has a CORS policy allowing browser uploads from:
- `https://web.infront.cy` (admin UI)
- `https://portal.infront.cy` (client portal)
- `http://localhost:4321` (local dev)

Methods: GET, PUT, HEAD. This is required because the upload flow uses presigned URLs — the browser PUTs directly to R2.

## PostgreSQL

- **Container:** `postgres` (postgres:17-alpine)
- **Database:** `agency`
- **Connection:** `postgresql://postgres:postgres@localhost:5432/agency`

### Auth Configuration

The platform API connects via `--network host`, so connections enter the Postgres container through Docker NAT with source IP `172.17.0.1`. The `pg_hba.conf` includes:

```
host all all 172.17.0.0/16 trust
```

This allows Docker containers to connect without password auth. Safe because port 5432 is only exposed on localhost (not to the internet via `0.0.0.0:5432` Docker port mapping).

### Troubleshooting: Password Auth Failed

If you see `password authentication failed for user "postgres"` after a Postgres container restart:

```bash
# Option A: Re-add the trust rule (it may have been lost if the volume was recreated)
docker exec -u postgres postgres sh -c \
  'echo "host all all 172.17.0.0/16 trust" >> /var/lib/postgresql/data/pg_hba.conf'
docker exec -u postgres postgres pg_ctl reload -D /var/lib/postgresql/data
docker restart infront-api

# Option B: Reset the password to match the connection string
docker exec postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
docker restart infront-api
```

## CDN Custom Domain

`cdn.infront.cy` is a custom domain on the `infront-cdn` R2 bucket. Public files are served globally via Cloudflare's edge cache.

## Common Operations

```bash
# View logs
docker logs --tail 50 infront-api

# Restart (e.g. after env var changes)
docker restart infront-api

# Health check
curl http://127.0.0.1:3002/health

# Test CDN files endpoint
curl -H "x-internal-key: <key>" http://127.0.0.1:3002/api/cdn-files?limit=10
```
