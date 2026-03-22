# Deployment

## Overview

Client sites deploy to **Cloudflare Workers** as static assets. The admin dashboard runs on **Hetzner VPS** behind Caddy.

## Client Site Deployment

### Pipeline

```
1. Generate site files (wizard or CLI)
2. pnpm install (register workspace)
3. pnpm --filter @agency/{slug} run build (Astro static build)
4. wrangler deploy (reads wrangler.toml, uploads to Workers)
5. Create DNS CNAME → {slug}.workers.dev
6. Add Workers Custom Domain for SSL
7. Site live at {slug}.infront.cy
```

### wrangler.toml

Every site has a `wrangler.toml` generated automatically:

```toml
name = "site-slug"
compatibility_date = "2026-03-22"

[assets]
directory = "./dist"
```

This tells Wrangler to deploy the Astro build output as static assets on a Cloudflare Worker.

### Deploy Metadata (.deploy.json)

Each site has a `.deploy.json` tracking deployment state:

```json
{
  "projectName": "site-slug",
  "stagingUrl": "site-slug.infront.cy",
  "productionUrl": null,
  "workersDevUrl": "site-slug.workers.dev",
  "lastDeployId": null,
  "lastDeployAt": "2026-03-22T...",
  "status": "live",
  "error": null,
  "dnsRecordId": "cf-dns-record-id",
  "buildLog": "..."
}
```

Status values: `pending` → `building` → `deploying` → `live` (or `failed`)

### Manual Deployment

```bash
# From monorepo root
pnpm --filter @agency/{slug} run build

# From site directory
cd sites/{slug}
npx wrangler deploy
```

### Automated Deployment (via Admin UI)

The admin dashboard handles deployment automatically:
- **New site**: Wizard → generate → build → deploy (fire-and-forget background task)
- **Redeploy**: Click "Redeploy" → rebuild → re-upload to same Worker
- **Status polling**: UI polls `/api/sites/{slug}/deploy-status` every 3 seconds

### Custom Domains

- **Staging**: Auto-assigned as `{slug}.infront.cy` via DNS CNAME
- **Production**: Added via site management page, uses Workers Custom Domains API for SSL

### Environment Variables

Required in admin `.env` or `/app/runtime-env.json`:

| Variable | Purpose |
|----------|---------|
| `CLOUDFLARE_API_TOKEN` | Wrangler authentication |
| `CLOUDFLARE_ACCOUNT_ID` | Workers account |
| `CLOUDFLARE_ZONE_ID` | DNS zone (infront.cy) |
| `ADMIN_PASSWORD_HASH` | bcrypt hash for admin login |
| `SESSION_SECRET` | JWT signing key |
| `MONOREPO_ROOT` | Monorepo path (local dev only, defaults to `/app`) |

## Admin Dashboard Deployment

The admin runs on Hetzner VPS:

```bash
# Build
npm run build --workspace=sites/admin

# Start with PM2
pm2 start infra/admin/ecosystem.config.cjs
pm2 restart agency-admin
```

Uses `@astrojs/node` adapter in standalone mode, behind Caddy reverse proxy.

## Cloudflare API Calls

The platform makes these Cloudflare API calls (via `sites/admin/src/lib/cloudflare.ts`):

| API | Method | Purpose |
|-----|--------|---------|
| `/accounts/{id}/workers/scripts/{name}` | DELETE | Delete a Worker |
| `/accounts/{id}/workers/domains` | PUT | Add Workers Custom Domain |
| `/accounts/{id}/workers/domains` | GET | List Workers Custom Domains |
| `/accounts/{id}/workers/domains/{id}` | DELETE | Remove Workers Custom Domain |
| `/zones/{id}/dns_records` | POST | Create CNAME record |
| `/zones/{id}/dns_records/{id}` | DELETE | Delete DNS record |

## Version History & Rollback

Sites have git-based versioning:
- **Auto-commit**: Each editor save can trigger a git commit scoped to the site directory
- **History**: `GET /api/sites/{slug}/versions` returns git log filtered to the site
- **Revert**: `POST /api/sites/{slug}/versions` with `{ action: "revert", commitHash: "..." }` checks out the site from a previous commit and creates a new commit

## Site Export

Two export types via `POST /api/sites/{slug}/export`:

| Type | Contents | Use Case |
|------|----------|----------|
| `static` | Built HTML/CSS/JS from `dist/` | Host anywhere (Netlify, S3, etc.) |
| `source` | Full Astro source + inlined shared components + standalone config | Client takes ownership of code |

Source export generates a standalone `package.json` and `astro.config.mjs` without internal plugins.
