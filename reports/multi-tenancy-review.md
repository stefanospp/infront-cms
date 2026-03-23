# Multi-Tenancy Isolation Security Review: Infront CMS Platform

**Date:** 2026-03-23
**Reviewer:** Cloud Infrastructure Security Engineer
**Scope:** Tenant isolation across all layers -- filesystem, Docker, Cloudflare, admin API, database, networking
**Severity Scale:** CRITICAL | HIGH | MEDIUM | LOW | INFO

---

## Executive Summary

**Overall Multi-Tenancy Isolation: MODERATE RISK**

The Infront CMS platform operates as a single-admin monorepo where each client site is a directory under `sites/`. The isolation model is filesystem-based (each site is a separate directory) with shared infrastructure (one VPS, one Cloudflare account, one admin panel). This review found **2 critical**, **6 high**, **8 medium**, and **5 low** severity issues. The most urgent are production Directus credentials committed to the Git repository and PostgreSQL exposed on all network interfaces.

---

## Critical Issues

### C-1: Production Directus Credentials Committed to Git Repository

**Files:**
- `infra/docker/meridian-properties/.env`
- `infra/docker/atelier-kosta/.env`

Both files contain plaintext database passwords, Directus admin passwords, and Directus KEY/SECRET values committed to the Git repository. While `.gitignore` has `.env` rules, these files were committed before the rules were added (or the rules do not match the nested path).

**Impact:** Anyone with repository access (current or former team members, CI systems, GitHub in case of a breach) can read all production CMS credentials. A single compromised credential gives full access to client data.

**Recommended Fix:**
1. Rotate all credentials immediately
2. Remove files from Git history using `git filter-repo`
3. Move secrets to Doppler (as documented in CLAUDE.md)
4. Verify `.gitignore` rules match `infra/docker/*/.env` paths

---

### C-2: PostgreSQL Exposed on All Network Interfaces

**File:** `infra/kamal.yml` (line 36)

The Kamal deployment configuration maps PostgreSQL port as `"5432:5432"` instead of `"127.0.0.1:5432:5432"`. This exposes the database to all network interfaces, meaning if the VPS firewall is misconfigured or has an exception, PostgreSQL is directly accessible from the internet.

**Recommended Fix:** Change port binding to `"127.0.0.1:5432:5432"` to restrict access to localhost only.

---

## High Severity Issues

### H-1: Single Cloudflare API Token Controls Everything

**Files:** `sites/admin/src/lib/cloudflare.ts`, environment configuration

One Cloudflare API token is used for all operations: creating Workers, modifying DNS, managing custom domains, and deploying all sites. If this token is compromised, an attacker can:
- Delete all deployed sites
- Redirect all DNS records
- Deploy malicious content to any site
- Access D1 databases

**Recommended Fix:** Create per-capability tokens with minimum required permissions. Separate DNS management from Worker deployment tokens.

---

### H-2: No Per-Site Authorization in Admin API

**Files:** `sites/admin/src/middleware.ts`, all admin API routes

The middleware authenticates users via the central auth service, but all authenticated users have identical permissions. Any authenticated admin can:
- Delete any client's site
- Modify any client's configuration
- Trigger deploys for any site
- Read any site's data

There is no role-based access control or per-site ownership model.

**Recommended Fix:** Add site ownership tracking and per-site authorization checks to API routes.

---

### H-3: Import API Allows Unauthenticated Access When IMPORT_SECRET Unset

**File:** `sites/abroad-jobs/src/pages/api/import.ts` (lines 19-21)

When the `IMPORT_SECRET` environment variable is not configured, the import endpoint is completely open. This allows anyone to trigger bulk database writes and external API calls.

**Recommended Fix:** Always require the secret. Return 500 if not configured.

---

### H-4: Race Condition in Concurrent Deploys

**Files:** `sites/admin/src/lib/deploy.ts`, `sites/admin/src/pages/api/sites/[slug]/redeploy.ts`

The deploy status check is not atomic. Two near-simultaneous redeploy requests could both pass the "not currently building" check and start deploying concurrently, causing wrangler conflicts and potentially corrupted deployments.

**Recommended Fix:** Implement a filesystem lock or atomic status check-and-set.

---

### H-5: Dev Server Processes Inherit Admin's Full Environment

**File:** `sites/admin/src/lib/dev-server.ts`

Dev server processes spawned by the admin UI inherit the full environment of the admin process, including `CLOUDFLARE_API_TOKEN`, `SESSION_SECRET`, and other sensitive values. A malicious or compromised site template could read these environment variables.

**Recommended Fix:** Sanitize the environment when spawning dev server processes, passing only the variables needed for development.

---

### H-6: Docker Compose Exposes Directus Ports to All Interfaces

**Files:**
- `infra/docker/template/docker-compose.yml`
- `infra/docker/meridian-properties/docker-compose.yml`
- `infra/docker/atelier-kosta/docker-compose.yml`

Directus ports are bound as `${PORT:-8055}:8055` (all interfaces) instead of `127.0.0.1:${PORT:-8055}:8055` (localhost only).

**Recommended Fix:** Bind to `127.0.0.1` in all Docker Compose files.

---

## Medium Severity Issues

### M-1: No Docker Resource Limits on Any Container

**Files:** All `docker-compose.yml` files

No container has CPU, memory, or storage limits configured. A runaway Directus instance or PostgreSQL query could consume all VPS resources, affecting all other tenants on the same server.

**Recommended Fix:** Add `deploy.resources.limits` to Docker Compose services.

---

### M-2: No Filesystem Isolation Between Site Directories

**File:** `sites/admin/src/lib/generator.ts`

All site directories exist under the same `sites/` directory in the monorepo. The admin process has full read/write access to all sites. A bug in the generator or deploy pipeline could accidentally modify the wrong site's files.

**Recommended Fix:** Add explicit path validation to ensure operations only affect the target site directory. Consider running builds in isolated containers.

---

### M-3: Shared Node Modules at Monorepo Root

**File:** Root `package.json`, `pnpm-workspace.yaml`

All sites share the same `node_modules` at the monorepo root. A compromised dependency affects all sites simultaneously. There is no per-site dependency isolation.

**Recommended Fix:** Use pnpm's strict isolation features. Consider vendoring critical dependencies.

---

### M-4: No Network Isolation Between Docker Containers

**Files:** All `docker-compose.yml` files

Docker Compose creates default networks per project, but there are no explicit network names or firewall rules. If containers from different client stacks somehow end up on the same Docker network (e.g., via manual commands), they could access each other's databases.

**Recommended Fix:** Define explicit network names per client. Add `internal: true` to database networks.

---

### M-5: Backup Restore Script Could Overwrite Wrong Database

**File:** `infra/backups/restore.sh`

The restore script accepts a client slug parameter but does not verify that the backup file corresponds to the target database. Restoring the wrong backup to a client's database would overwrite their data.

**Recommended Fix:** Add backup file metadata validation (client slug, timestamp) before restore.

---

### M-6: Cloudflare D1 Database Shared Per Site Only

**File:** `sites/abroad-jobs/wrangler.toml`

The abroad-jobs site has its own D1 database, which is good isolation. However, if more sites adopt D1, the admin process would need access to all D1 databases, creating a single point of compromise.

---

### M-7: No Audit Trail for Cross-Site Operations

**Files:** All admin API routes

There is no logging of which admin performed what operation on which site. If a site is accidentally deleted or misconfigured, there is no way to trace the action.

**Recommended Fix:** Add structured audit logging with user identity, action, target site, and timestamp.

---

### M-8: DNS Record Management Not Scoped Per Site

**File:** `sites/admin/src/lib/cloudflare.ts`

DNS operations use the same Cloudflare zone and API token for all sites. A bug in the custom domain logic could accidentally modify or delete another site's DNS records.

**Recommended Fix:** Add explicit domain ownership verification before DNS modifications.

---

## Low Severity Issues

### L-1: No Docker Network Segmentation Documentation

There is no documentation of the intended network isolation model between Docker containers. The implicit Docker Compose per-project isolation works but is not documented or enforced.

### L-2: Single VPS Hosting All Services

All Directus instances, the admin panel, and backup infrastructure share a single Hetzner VPS. A DoS on one service affects all others.

### L-3: No Resource Quotas for Generated Sites

Generated sites have no build time limits (beyond the 180s timeout), no output size limits, and no asset count limits. A maliciously crafted site could consume excessive build resources.

### L-4: Git Repository Is Single Point of Failure for All Sites

All client site source code lives in one Git repository. A force-push accident or repository corruption affects all clients simultaneously.

### L-5: No Tenant Data Encryption at Rest

Client data in PostgreSQL and D1 is not encrypted at rest beyond the infrastructure provider's default encryption.

---

## Isolation Matrix

| Layer | Isolation Method | Rating | Notes |
|-------|-----------------|--------|-------|
| **Filesystem** | Separate directories | Weak | No permission boundaries, shared node_modules |
| **Database (Directus)** | Separate PostgreSQL per client | Good | Each client has own Docker stack |
| **Database (D1)** | Separate D1 per site | Good | Cloudflare-managed isolation |
| **Cloudflare Workers** | Separate Worker per site | Good | Cloudflare-managed isolation |
| **DNS** | Shared zone | Weak | Single API token, no per-site scoping |
| **Docker** | Separate Compose stacks | Moderate | No resource limits, implicit network isolation |
| **Admin API** | No isolation | Poor | Any authenticated user can modify any site |
| **Secrets** | Shared environment | Weak | Single Cloudflare token, dev servers inherit secrets |
| **Backups** | No isolation | Poor | Scripts could restore wrong data |

---

## Prioritized Recommendations

### Immediate (This Week)

1. **Rotate all committed credentials** (C-1) and remove from Git history
2. **Bind PostgreSQL to localhost** (C-2) in Kamal config
3. **Bind Directus ports to localhost** (H-6) in all Docker Compose files
4. **Require IMPORT_SECRET always** (H-3)

### Short-Term (This Month)

5. **Sanitize dev server environment** (H-5)
6. **Add deploy locking mechanism** (H-4)
7. **Create scoped Cloudflare API tokens** (H-1)
8. **Add Docker resource limits** (M-1)
9. **Add audit logging** (M-7)

### Medium-Term (This Quarter)

10. **Implement per-site authorization** (H-2) with ownership model
11. **Add explicit Docker network isolation** (M-4)
12. **Add backup file validation** (M-5)
13. **Document the isolation model** (L-1)

---

## Files Reviewed

- All docker-compose files (template, meridian-properties, atelier-kosta)
- All .env and .env.example files
- kamal.yml
- All backup scripts (pg_backup.sh, uploads_backup.sh, restore.sh)
- Admin setup/update scripts
- docker-entrypoint.sh and Dockerfile
- Admin middleware (auth)
- All admin API routes (~20 endpoints)
- Admin lib files (cloudflare.ts, deploy.ts, build.ts, generator.ts, sites.ts, dev-server.ts, versioning.ts, env.ts)
- abroad-jobs API routes and D1/Drizzle setup
- All wrangler.toml files
- Security headers (_headers files)
- .gitignore
