# Infrastructure Review Report

**Date:** 2026-03-23
**Reviewer:** Infrastructure / DevOps Review (automated)
**Scope:** Docker, CI/CD, backups, admin deployment, DNS/SSL, security, monitoring, scalability, disaster recovery, provisioning

---

## Executive Summary

The infront-cms platform has a functional infrastructure foundation with reasonable separation of concerns: Cloudflare Pages for static/SSR sites, Hetzner VPS for Directus CMS instances and the admin UI, and Docker Compose for CMS containers. The platform successfully deploys sites and manages multiple clients.

However, the infrastructure has significant gaps in production hardening. The most urgent issues are: the admin Docker container runs as root, the Kamal configuration exposes PostgreSQL port 5432 to the public internet, there are no health checks on any Docker service, the CI/CD pipeline uses `npm` instead of the project's `pnpm` package manager, and there is no automated backup scheduling or monitoring/alerting integration despite both being documented as part of the stack. The backup scripts exist but have no cron or CI trigger to run them.

**Summary by severity:**
- Critical: 3
- High: 8
- Medium: 9
- Low: 5

---

## Architecture Overview (Current State)

```
Internet
  |
  +-- Cloudflare Pages (CDN + edge) -- sites: template, abroad-jobs, meridian-properties, atelier-kosta, athena-institute
  |     |
  |     +-- abroad-jobs uses Cloudflare D1 (SQLite) + Stripe
  |     +-- Other sites are static or fetch from Directus at build time
  |
  +-- Cloudflare Tunnel (cloudflared) --> Hetzner VPS (49.12.4.77)
        |
        +-- Admin UI container (localhost:4321) -- Docker, no orchestrator
        |     +-- Persistent volume: infront-admin-sites (site data)
        |
        +-- Directus containers (per CMS client) -- Docker Compose
        |     +-- meridian-properties: Directus + PostgreSQL
        |     +-- atelier-kosta: Directus + PostgreSQL
        |
        +-- Kamal (deploy tool, used for Directus management)
        |
        +-- Backups: pg_backup.sh + uploads_backup.sh --> S3
```

**Single points of failure:**
- One Hetzner VPS runs everything server-side (admin, all CMS instances, tunnel)
- No container orchestration (plain Docker, not Swarm/K8s)
- No load balancing or failover

---

## Critical Issues

### CRIT-1: Kamal exposes PostgreSQL 5432 to the public internet

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/kamal.yml` (line 36)

**Description:** The Kamal accessory configuration maps PostgreSQL port `"5432:5432"`, which binds to all interfaces (0.0.0.0:5432). This exposes the database directly to the internet.

**Risk:** Remote attackers can attempt brute-force or exploit PostgreSQL vulnerabilities. Even with a strong password, this is an unnecessary attack surface. Database ports should never be publicly accessible.

**Recommended fix:**
```yaml
# Change from:
port: "5432:5432"
# To:
port: "127.0.0.1:5432:5432"
```
Or better, remove the port mapping entirely and let Docker networking handle inter-container communication via service name.

---

### CRIT-2: Admin Docker container runs as root

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/Dockerfile`

**Description:** The Dockerfile never creates or switches to a non-root user. The Node.js process inside the container runs as root, and the entrypoint script runs as root.

**Risk:** If the application is compromised (e.g., via an SSR vulnerability), the attacker has root access inside the container. Combined with volume mounts, this could enable container escape or data exfiltration.

**Recommended fix:**
```dockerfile
# Add before ENTRYPOINT:
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser
RUN chown -R appuser:appuser /app
USER appuser

ENTRYPOINT ["/app/docker-entrypoint.sh"]
```
Note: The entrypoint's volume sync (`cp -r`) will need write permissions to the mounted volumes, so ensure the volume directories are owned by the non-root user.

---

### CRIT-3: Password hashing in setup script is vulnerable to shell injection

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/admin/setup-vps.sh` (line 77)

**Description:** The admin password is interpolated directly into a `node -e` command:
```bash
ADMIN_PASSWORD_HASH=$(docker run --rm infront-admin node -e "import('bcryptjs').then(b=>b.default.hash('${ADMIN_PASSWORD}',10).then(console.log))")
```
If the password contains single quotes, backticks, dollar signs, or other shell metacharacters, this will break or execute arbitrary commands.

**Risk:** Shell injection during initial setup. An attacker who can influence the password input could execute arbitrary commands on the VPS.

**Recommended fix:** Pass the password via an environment variable instead of string interpolation:
```bash
ADMIN_PASSWORD_HASH=$(docker run --rm -e "PW=${ADMIN_PASSWORD}" infront-admin \
  node -e "import('bcryptjs').then(b=>b.default.hash(process.env.PW,10).then(console.log))")
```

---

## High Issues

### HIGH-1: CI/CD uses npm but project uses pnpm

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/.github/workflows/test.yml` (lines 15, 17-19, 30, 40-42, 54-55, 66-68)
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/.github/workflows/deploy-site.yml` (lines 14-15, 19-20)

**Description:** All CI workflows use `npm ci` and `npm run build`, but the project uses pnpm (evidenced by `pnpm-lock.yaml`, `pnpm-workspace.yaml`, the Dockerfile using `pnpm install --frozen-lockfile`). This means CI installs from a non-existent `package-lock.json` or falls back to generating one, producing a different dependency tree than local development.

**Risk:** CI may test and deploy with different dependency versions than development. Builds may succeed in CI but fail locally or vice versa. Security audit runs against wrong dependency tree.

**Recommended fix:** Replace npm commands with pnpm across all workflows:
```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 9
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: pnpm
- run: pnpm install --frozen-lockfile
```

---

### HIGH-2: No health checks on any Docker service

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/Dockerfile`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/docker/template/docker-compose.yml`
- All client docker-compose files

**Description:** No HEALTHCHECK instruction in the Dockerfile, and no `healthcheck:` configuration in any docker-compose.yml. The `depends_on` uses `condition: service_started` instead of `condition: service_healthy`.

**Risk:** Docker and Docker Compose cannot distinguish a running-but-broken container from a healthy one. The `restart: unless-stopped` policy will restart crashed containers, but not containers that are stuck or returning errors. The Directus service starts before PostgreSQL is ready to accept connections, which could cause initial startup failures.

**Recommended fix for Dockerfile:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:4321/ || exit 1
```

**Recommended fix for docker-compose.yml:**
```yaml
database:
  image: postgis/postgis:16-3.4
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
    interval: 10s
    timeout: 5s
    retries: 5

directus:
  depends_on:
    database:
      condition: service_healthy
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8055/server/ping"]
    interval: 30s
    timeout: 5s
    retries: 3
```

---

### HIGH-3: No Docker resource limits

**Files:** All docker-compose.yml files in `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/docker/`

**Description:** No `mem_limit`, `cpus`, or `deploy.resources` configuration on any service. Multiple Directus + PostgreSQL stacks run on a single VPS with no resource isolation.

**Risk:** A single runaway container (e.g., a memory leak in Directus or a heavy PostgreSQL query) can consume all system resources, taking down every other service on the VPS including the admin UI and the Cloudflare tunnel.

**Recommended fix:**
```yaml
services:
  directus:
    mem_limit: 512m
    cpus: "0.5"
  database:
    mem_limit: 256m
    cpus: "0.25"
    shm_size: 64m
```

---

### HIGH-4: No automated backup scheduling

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/backups/pg_backup.sh`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/backups/uploads_backup.sh`

**Description:** The backup scripts exist and are well-structured, but there is no cron job, systemd timer, or CI/CD scheduled workflow to run them. They only run if someone manually invokes them.

**Risk:** If nobody remembers to run backups, a data loss event (disk failure, accidental deletion, ransomware) results in complete loss of all CMS content and uploads.

**Recommended fix:** Add a GitHub Actions scheduled workflow or a crontab on the VPS:
```yaml
# .github/workflows/backup.yml
name: Scheduled Backups
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2am UTC
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run backup via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: root
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            /opt/infront-cms/infra/backups/pg_backup.sh
            /opt/infront-cms/infra/backups/uploads_backup.sh
```
Or on the VPS directly:
```bash
# crontab -e
0 2 * * * /opt/infront-cms/infra/backups/pg_backup.sh >> /var/log/pg_backup.log 2>&1
0 3 * * * /opt/infront-cms/infra/backups/uploads_backup.sh >> /var/log/uploads_backup.log 2>&1
```

---

### HIGH-5: No monitoring or alerting integration

**Description:** Despite CLAUDE.md listing Betterstack (uptime) and Sentry (errors) as part of the stack, there is zero actual integration. No Sentry DSN configured anywhere, no Betterstack heartbeat URLs, no log aggregation, no alerting.

**Risk:** Service outages, application errors, failed backups, and security incidents go undetected until someone manually checks or a user reports an issue.

**Recommended fix:**
1. Add Sentry SDK to the admin UI and configure DSN via environment variable
2. Set up Betterstack uptime monitors for:
   - `https://web.infront.cy` (admin UI)
   - Each Directus instance's `/server/ping` endpoint
   - Each deployed client site
3. Add a backup heartbeat: have backup scripts ping a Betterstack heartbeat URL on success
4. Configure log shipping from the VPS to a log aggregation service

---

### HIGH-6: Deploy-site workflow only deploys template site

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/.github/workflows/deploy-site.yml`

**Description:** The deploy-site workflow only triggers on changes to `sites/template/**` and `packages/**`, and only builds/deploys the template site. Changes to `abroad-jobs`, `meridian-properties`, `atelier-kosta`, or any other site do not trigger CI/CD deployment.

**Risk:** Client sites must be deployed manually. There is no automated deployment pipeline for any production client site changes pushed to main.

**Recommended fix:** Either create per-site workflows triggered by path filters, or create a dynamic workflow that detects which sites changed and deploys them:
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'sites/**'
      - 'packages/**'
jobs:
  detect-changes:
    # Use dorny/paths-filter to detect which sites changed
    # Then deploy only affected sites
```

---

### HIGH-7: Dockerfile does not use multi-stage build

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/Dockerfile`

**Description:** The Dockerfile installs all development dependencies, copies all source code (including all client sites), builds the admin, then ships everything in a single image. Build tools, dev dependencies, source code for all sites, and the entire `infra/` directory are included in the production image.

**Risk:** Bloated image size (longer pull times, more attack surface), unnecessary files in production (source code, build tools, infra scripts).

**Recommended fix:**
```dockerfile
# Build stage
FROM node:22-slim AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# ... copy package.jsons, install, copy source, build ...

# Production stage
FROM node:22-slim AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=builder /app/sites/admin/dist ./sites/admin/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
# ... copy only what's needed at runtime
```

---

### HIGH-8: Directus docker-compose files do not use Docker networks

**Files:** All docker-compose.yml files in `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/docker/`

**Description:** No custom network is defined. All containers land on the default Docker bridge network. With multiple Directus instances on the same VPS, containers from different clients could potentially communicate with each other.

**Risk:** No network isolation between client environments. A compromised Directus instance for one client could potentially reach another client's PostgreSQL.

**Recommended fix:** Add per-client isolated networks:
```yaml
services:
  directus:
    networks:
      - internal
  database:
    networks:
      - internal

networks:
  internal:
    driver: bridge
```

---

## Medium Issues

### MED-1: Node version mismatch between CI and Docker

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/Dockerfile` (uses `node:22-slim`)
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/.github/workflows/test.yml` (uses `node-version: 20`)
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/.github/workflows/deploy-site.yml` (uses `node-version: 20`)

**Description:** The Dockerfile uses Node 22, but all CI workflows use Node 20. This means code is tested on Node 20 but runs in production on Node 22.

**Risk:** Subtle behavioral differences between Node versions could cause bugs that pass CI but fail in production.

**Recommended fix:** Align all environments to Node 22.

---

### MED-2: No image tag pinning for Directus

**Files:**
- All docker-compose.yml files: `image: directus/directus:11`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/kamal.yml`: `image: directus/directus:11`

**Description:** The Directus image tag `11` is a floating major version tag. A `docker compose pull` could pull a breaking minor update (e.g., 11.1 to 11.5).

**Risk:** Unexpected Directus upgrades could break API schemas, admin UI, or client site data fetching.

**Recommended fix:** Pin to a specific minor version: `directus/directus:11.4.1` (or whatever the current version is).

---

### MED-3: No image tag pinning for Node.js base image

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/Dockerfile` (line 1)

**Description:** `FROM node:22-slim` uses a floating tag. Every Docker build could pull a different Node.js patch version.

**Risk:** Non-reproducible builds. A Node.js patch release could introduce a regression.

**Recommended fix:** Pin to a specific version: `FROM node:22.14.0-slim` (or current latest).

---

### MED-4: `pnpm@latest` in Dockerfile is non-deterministic

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/Dockerfile` (line 4)

**Description:** `corepack prepare pnpm@latest --activate` fetches the latest pnpm version at build time. Different builds get different pnpm versions.

**Risk:** Non-reproducible builds; a pnpm update could change resolution behavior.

**Recommended fix:** Pin to a specific version: `corepack prepare pnpm@9.15.0 --activate`.

---

### MED-5: Backup script runs pg_dump as postgres superuser

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/backups/pg_backup.sh` (lines 18, 30)

**Description:** The backup script runs `psql -U postgres` and `pg_dump -U postgres`, using the PostgreSQL superuser. But the Docker Compose files create databases with `DB_USER` (typically "directus"), not "postgres".

**Risk:** The backup script will fail unless there is a separate PostgreSQL instance running directly on the host (not in Docker) with a "postgres" user. This indicates the backup script may not be compatible with the Docker-based PostgreSQL setup.

**Recommended fix:** Either:
1. Run `pg_dump` inside the Docker container: `docker exec <container> pg_dump -U directus directus`
2. Or use `docker compose exec` within the script

---

### MED-6: Restore script does not stop Directus before restore

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/backups/restore.sh`

**Description:** The database restore pipes directly into a running PostgreSQL without stopping Directus first. This can cause data inconsistency if Directus is actively writing during the restore.

**Risk:** Corrupted or inconsistent data after restore.

**Recommended fix:** Stop the Directus container before restore and restart after:
```bash
docker stop "${CLIENT_SLUG}-directus-1"
gunzip -c "${BACKUP_FILE}" | psql ...
docker start "${CLIENT_SLUG}-directus-1"
```

---

### MED-7: No cache headers in _headers files

**Files:** All `public/_headers` files across sites

**Description:** No `Cache-Control` headers are set for any assets. While Cloudflare applies its own caching, explicit cache headers ensure correct behavior at all layers.

**Risk:** Suboptimal caching behavior, especially for fonts, images, and static assets. Users may re-download assets unnecessarily.

**Recommended fix:**
```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate
```

---

### MED-8: Missing security headers

**Files:** All `public/_headers` files

**Description:** Several recommended security headers are missing:
- `X-XSS-Protection: 0` (disable legacy XSS auditor to prevent it from causing issues)
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

**Risk:** Slightly reduced defense-in-depth for cross-origin attacks.

**Recommended fix:** Add these headers to all `_headers` files.

---

### MED-9: CSP allows `'unsafe-inline'` for styles across all sites

**Files:** All `public/_headers` files

**Description:** Every site's CSP includes `style-src 'self' 'unsafe-inline'`. While this is common and often necessary for framework-generated inline styles, it weakens CSS injection protection.

**Risk:** CSS injection attacks are possible if there is an XSS vector. Low practical risk for static sites, but worth noting.

**Recommended fix:** If feasible, use CSP nonces for inline styles. For Astro sites this may require middleware. Otherwise, accept this as a known trade-off and document it.

---

## Low Issues

### LOW-1: Deprecated `version` key in docker-compose files

**Files:** All docker-compose.yml files use `version: "3.8"`

**Description:** The `version` key is deprecated in modern Docker Compose and is ignored by Docker Compose V2.

**Risk:** No functional impact, but generates deprecation warnings and indicates the files haven't been updated recently.

**Recommended fix:** Remove the `version: "3.8"` line from all docker-compose.yml files.

---

### LOW-2: PostGIS image used when GIS features are not needed

**Files:** All docker-compose.yml files and kamal.yml use `postgis/postgis:16-3.4`

**Description:** Every PostgreSQL instance uses the PostGIS image, which is significantly larger than the standard PostgreSQL image. There is no evidence of GIS/spatial data usage in any Directus instance.

**Risk:** Larger image pulls, more attack surface, and unnecessary disk usage.

**Recommended fix:** Use `postgres:16-alpine` unless a specific client requires PostGIS. If one client needs GIS, only that client's compose file should use the PostGIS image.

---

### LOW-3: Template wrangler.toml has no compatibility_flags

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/template/wrangler.toml`

**Description:** The template site's wrangler.toml does not include `compatibility_flags = ["nodejs_compat"]`, while the abroad-jobs site does. New sites created from the template will lack this flag.

**Risk:** Sites that need Node.js APIs (e.g., for SSR API routes using crypto, buffer, etc.) will fail at runtime on Cloudflare.

**Recommended fix:** Add `compatibility_flags = ["nodejs_compat"]` to the template wrangler.toml.

---

### LOW-4: Lighthouse CI in test workflow runs without uploading results

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/.github/workflows/test.yml` (line 69)

**Description:** The Lighthouse job runs `lhci autorun` but results are not uploaded to a Lighthouse CI server or stored as artifacts. Results are lost after the workflow completes.

**Risk:** No historical performance tracking. Regressions can't be identified over time.

**Recommended fix:** Add artifact upload or configure a Lighthouse CI server:
```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: lighthouse-results
    path: .lighthouseci/
```

---

### LOW-5: deploy-directus workflow triggers on all infra/** changes

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/.github/workflows/deploy-directus.yml`

**Description:** The Directus deployment triggers on any push to `infra/**`, including changes to backup scripts, admin config, or provisioning scripts. This could trigger unnecessary Kamal deployments.

**Risk:** Unintended deployments when editing backup scripts or admin configs.

**Recommended fix:** Narrow the path filter:
```yaml
paths:
  - 'infra/kamal.yml'
  - 'infra/docker/**'
```

---

## Disaster Recovery Assessment

### Scenario 1: Hetzner VPS goes down

**Impact:** Admin UI, all Directus CMS instances, and Cloudflare Tunnel become unavailable. Static client sites on Cloudflare Pages remain operational. CMS-powered sites continue serving cached/static content but cannot update content.

**Current recovery plan:** Manual. SSH into a new VPS, run `setup-vps.sh`, restore backups.

**Gaps:**
- No documented runbook for VPS recovery
- Backup restoration depends on S3 backups existing (no verification that backups are actually running)
- No way to verify backup integrity (no checksums, no test restores)
- Recovery time estimate: 1-2 hours minimum (provision new VPS, install Docker, restore data)

**Recommendations:**
1. Document a recovery runbook with step-by-step instructions
2. Add backup verification (weekly test restore to a staging instance)
3. Consider a warm standby VPS or automated VPS provisioning via Terraform/Pulumi
4. Store VPS configuration as code (Ansible/cloud-init) for reproducibility

### Scenario 2: Cloudflare has issues

**Impact:** All client sites become unavailable. DNS resolution may fail.

**Current recovery plan:** None. The platform is fully dependent on Cloudflare for DNS, CDN, and site hosting.

**Gaps:**
- No secondary DNS provider
- No fallback hosting
- Cloudflare Tunnel is the only ingress path to the VPS

**Recommendations:**
1. Keep a secondary DNS provider ready (can be configured but inactive)
2. Ensure the VPS has a direct IP fallback for admin access (it does: 49.12.4.77)
3. Document manual failover procedures

### Scenario 3: Data corruption / accidental deletion

**Impact:** CMS content lost, client sites may display broken/missing content.

**Current recovery plan:** Restore from S3 backups using `restore.sh`.

**Gaps:**
- Backups may not exist if no cron is configured (see HIGH-4)
- No point-in-time recovery (only full dumps)
- No backup verification or integrity checks
- Uploads backup uses `--delete` flag, so if uploads are accidentally deleted on the source, the next backup run propagates the deletion to S3

**Recommendations:**
1. Enable S3 versioning on the backup bucket
2. Add backup integrity checks (verify dump can be restored)
3. Consider WAL archiving for PostgreSQL point-in-time recovery
4. Remove `--delete` from the uploads S3 sync or enable S3 object versioning

---

## Recommendations (Prioritized)

### Immediate (do this week)

1. **Fix Kamal PostgreSQL port exposure** (CRIT-1) -- Change to `127.0.0.1:5432:5432` or remove port mapping
2. **Add non-root user to Dockerfile** (CRIT-2) -- Standard security hardening
3. **Fix shell injection in setup-vps.sh** (CRIT-3) -- Pass password via env var
4. **Fix CI to use pnpm** (HIGH-1) -- Align CI with actual package manager
5. **Add health checks to Docker services** (HIGH-2) -- Enable proper orchestration

### Short-term (this month)

6. **Add Docker resource limits** (HIGH-3) -- Prevent resource exhaustion
7. **Set up automated backups** (HIGH-4) -- Cron job or scheduled workflow
8. **Integrate monitoring/alerting** (HIGH-5) -- Sentry + Betterstack
9. **Create per-site deployment workflows** (HIGH-6) -- Automate client site deploys
10. **Add Docker networks for isolation** (HIGH-8) -- Per-client network isolation
11. **Multi-stage Dockerfile** (HIGH-7) -- Reduce image size and attack surface

### Medium-term (this quarter)

12. Pin all image versions (MED-2, MED-3, MED-4)
13. Fix backup scripts for Docker-based PostgreSQL (MED-5)
14. Add cache headers (MED-7)
15. Add missing security headers (MED-8)
16. Create disaster recovery runbook
17. Set up backup verification (automated test restores)
18. Align Node.js versions across environments (MED-1)

### Long-term

19. Infrastructure as code (Terraform/Pulumi for Hetzner, Cloudflare)
20. Consider container orchestration (Docker Swarm at minimum) for the VPS
21. Warm standby VPS or automated provisioning for disaster recovery
22. Centralized log aggregation
23. Automated performance regression detection (Lighthouse CI server)

---

## Positive Aspects

1. **Good secret management pattern** -- Secrets are passed via environment variables and Doppler, `.env` files are properly gitignored, Kamal uses secret references
2. **Cloudflare Tunnel for admin access** -- No ports exposed to the internet for the admin UI, SSL handled by Cloudflare
3. **Well-structured backup scripts** -- The scripts themselves are solid with proper error handling (`set -euo pipefail`), S3 offloading, and local retention
4. **Comprehensive security headers** -- CSP, HSTS with preload, X-Frame-Options, Permissions-Policy all present
5. **Provisioning scripts have good validation** -- Input validation for slugs, tiers, domains with clear error messages
6. **Idempotent CMS provisioning** -- The provision-cms.sh checks for existing collections and fields before creating, handles re-runs gracefully
7. **Dependabot configured** -- Automated dependency updates for both npm and GitHub Actions
8. **CI has good coverage categories** -- Linting, type checking, security audit, integration tests, e2e tests, and Lighthouse
9. **The admin deploy configuration correctly binds to localhost only** -- `127.0.0.1:4321:4321` in deploy.yml
10. **Docker entrypoint handles volume/baked-site sync well** -- Clever pattern to merge git-committed sites with volume-managed sites without data loss
