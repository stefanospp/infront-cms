# Scalability Review

**Date:** 2026-03-23
**Scope:** Full codebase at /Users/stefanospetrou/Desktop/Apps/infront-cms
**Reviewer:** Claude Code audit

---

## Executive Summary

The infront-cms platform was evaluated for its ability to scale from the current 5 sites to 20, 50, and 100+ sites. The architecture makes good foundational choices -- static sites on Cloudflare's free tier, shared VPS for CMS, monorepo for code sharing -- but has significant scalability bottlenecks in the admin pipeline, database query patterns, CI/CD, and infrastructure management.

The platform will encounter its first hard scaling limits around **10-15 sites**, primarily due to: (1) the admin UI running builds as child processes on a single VPS with no queuing or concurrency control, (2) all Directus instances sharing a single VPS with no resource isolation, and (3) CI/CD workflows that do not support per-site deployment.

---

## Scalability Assessment by Component

### 1. Site Hosting (Cloudflare Workers/Pages)

| Scale | Status | Notes |
|-------|--------|-------|
| 5 sites | OK | Well within all limits |
| 20 sites | OK | Free tier supports 100 Workers scripts |
| 50 sites | OK | Still within limits, may need Workers Paid for SSR sites |
| 100 sites | Caution | Workers Paid recommended; may hit 10M requests/month |

**Verdict:** Cloudflare hosting scales extremely well. No architectural changes needed up to 100 sites.

### 2. Admin UI & Build Pipeline

| Scale | Status | Notes |
|-------|--------|-------|
| 5 sites | OK | Builds complete in ~2-3 minutes |
| 10 sites | Strained | Concurrent builds compete for VPS CPU/memory |
| 20 sites | Bottleneck | Single VPS cannot handle multiple simultaneous builds |
| 50+ sites | Broken | Need external build service or queue |

**Key issues:**
- **No build queue:** `deployNewSite()` and `redeploySite()` spawn `pnpm install` and `astro build` as child processes. If two sites deploy simultaneously, both compete for the same CPU and memory. No lock, no queue, no concurrency limit.
- **Build process runs on the admin VPS:** The same VPS running the admin dashboard, Directus instances, and PostgreSQL also runs site builds. A heavy build can starve other services.
- **No build caching across sites:** Each build runs a full `pnpm install` even though sites share most dependencies. A shared `node_modules` cache or workspace-level install would dramatically reduce build times.

**Recommended fix:**
1. Add a build queue (simple in-memory queue with concurrency limit of 1)
2. At 20+ sites, move builds to GitHub Actions or a dedicated build worker
3. Implement shared dependency caching

### 3. CMS Infrastructure (Directus + PostgreSQL)

| Scale | Status | Notes |
|-------|--------|-------|
| 2 CMS clients | OK | ~1.5GB RAM used of 4GB available |
| 5 CMS clients | Strained | VPS needs upgrade to CX32 (8GB RAM) |
| 10 CMS clients | Bottleneck | Single VPS insufficient; need multiple VPS or managed DB |
| 20+ CMS clients | Broken | Need Kubernetes, managed services, or multi-VPS |

**Key issues:**
- **No Docker resource limits:** All containers share VPS resources with no isolation. One runaway PostgreSQL query can crash everything.
- **No per-client database connection pooling:** Each Directus + PostgreSQL pair runs independently. At 10 clients, that is 20 containers.
- **No horizontal scaling:** Directus does not support clustering. Each instance is a single container.
- **Backup scripts not scaling:** `pg_backup.sh` loops through a hardcoded list. Adding a new CMS client requires manually updating the backup script.

**Recommended fix:**
1. Add Docker resource limits immediately
2. At 5 CMS clients, upgrade to CX32 (8GB RAM, EUR 8.49/month)
3. At 10 CMS clients, consider managed PostgreSQL (Hetzner Managed DB or Neon) to reduce container count
4. At 20+ CMS clients, split across multiple VPS instances or move to Kubernetes

### 4. D1 Database (abroad-jobs)

| Scale | Status | Notes |
|-------|--------|-------|
| 1,000 jobs | OK | All queries fast |
| 10,000 jobs | Caution | Missing composite indexes will slow queries |
| 50,000 jobs | Strained | Sitemap loads all jobs; FTS index grows |
| 100,000+ jobs | Bottleneck | D1 10GB size limit; need migration to PostgreSQL |

**Key issues:**
- **No D1 batch API usage:** Every query is sequential, consuming subrequests and CPU time
- **Missing indexes:** No composite indexes for common query patterns
- **Sitemap loads all jobs:** No pagination; will fail at scale
- **No query result caching:** Every page view hits D1

**Recommended fix:** See Cloudflare Platform Review for detailed D1 optimization recommendations.

### 5. CI/CD

| Scale | Status | Notes |
|-------|--------|-------|
| 5 sites | OK | Template site only has CI |
| 10 sites | Broken | No CI for client sites; manual deploys only |
| 20+ sites | Broken | Cannot maintain quality without per-site CI |

**Key issues:**
- **Only template site has CI:** The deploy workflow only watches `sites/template/**`. Client sites have no automated testing or deployment.
- **No matrix deployment:** Cannot deploy multiple sites in parallel.
- **Shared package changes require manual redeploy of all affected sites:** No mechanism to detect which sites are affected by a change to `packages/ui` or `packages/utils`.
- **GitHub Actions free tier (2000 min/month) may be insufficient** at 10+ sites with regular deployments.

**Recommended fix:**
1. Add path-filtered deploy workflows per site
2. Add a "detect affected sites" workflow that triggers per-site deploys when shared packages change
3. Consider self-hosted runners on the Hetzner VPS for unlimited CI minutes

### 6. Admin Dashboard

| Scale | Status | Notes |
|-------|--------|-------|
| 5 sites | OK | Site listing is fast |
| 20 sites | OK | Dashboard performance still acceptable |
| 50 sites | Caution | Site listing reads filesystem for each site |
| 100+ sites | Strained | Need database-backed site registry |

**Key issues:**
- **Site discovery is filesystem-based:** `sites.ts` scans the `sites/` directory to find sites. This works but does not scale well for large numbers of sites.
- **No pagination on site listing:** All sites loaded at once.
- **Deploy status stored in JSON files:** `.deploy.json` per site, read on every dashboard load.

**Recommended fix:**
1. Add a simple SQLite database for site metadata at 50+ sites
2. Add pagination to the site listing API
3. Cache deploy status in memory with TTL

---

## Scaling Thresholds

| Threshold | Trigger | Action Required |
|-----------|---------|----------------|
| **10 sites** | Build concurrency issues, VPS memory pressure | Add build queue, upgrade VPS to CX32 |
| **15 sites** | CI/CD insufficient, manual deploys unsustainable | Add per-site CI workflows, detect affected sites |
| **20 sites** | CMS infrastructure strained | Consider managed PostgreSQL, multi-VPS |
| **30 sites** | Admin dashboard slow, GitHub Actions minutes exhausted | Database-backed site registry, self-hosted runners |
| **50 sites** | Single VPS cannot handle all CMS clients | Multi-VPS or Kubernetes for CMS |
| **100 sites** | Workers request limits, D1 storage for job board | Workers Paid overages, D1 migration plan |

---

## Recommendations (Prioritized)

### Immediate (Before 10 sites)
1. **Add build queue with concurrency limit of 1** -- prevents resource contention
2. **Add Docker resource limits** -- prevents cascading failures
3. **Batch D1 queries** -- prevents subrequest limit issues
4. **Add composite database indexes** -- prevents slow queries at scale

### Short-Term (Before 20 sites)
5. **Add per-site CI/CD workflows** -- enables automated testing and deployment
6. **Implement "affected sites" detection** -- auto-redeploy when shared packages change
7. **Upgrade VPS to CX32** -- doubles available RAM
8. **Add edge caching on SSR routes** -- reduces D1 load

### Medium-Term (Before 50 sites)
9. **Move builds to GitHub Actions or dedicated worker** -- decouple from admin VPS
10. **Consider managed PostgreSQL** -- reduce container count on VPS
11. **Database-backed site registry** -- replace filesystem scanning
12. **Implement sitemap pagination** -- handle growing job counts

### Long-Term (Before 100 sites)
13. **Multi-VPS architecture** -- split CMS clients across VPS instances
14. **D1 to PostgreSQL migration path** -- if job board outgrows 10GB limit
15. **Self-hosted CI runners** -- unlimited build minutes
16. **Admin dashboard performance overhaul** -- pagination, caching, async operations

---

## Files Analyzed

- All CI workflows (`.github/workflows/`)
- All admin API routes (`sites/admin/src/pages/api/`)
- Admin core libs: `sites.ts`, `deploy.ts`, `build.ts`, `generator.ts`, `cloudflare.ts`, `dev-server.ts`, `versioning.ts`
- Docker configs: template `docker-compose.yml`, `meridian-properties/docker-compose.yml`, `kamal.yml`
- Infrastructure scripts: `new-site.sh`, `provision-cms.sh`, `setup-vps.sh`, `update-vps.sh`, `pg_backup.sh`, `uploads_backup.sh`, `restore.sh`
- `Dockerfile`, `docker-entrypoint.sh`
- abroad-jobs: `schema.ts`, `db.ts`, `jobs.ts`, `checkout.ts`, `import-jobs.ts`, `validation.ts`, `wrangler.toml`, all migrations
- Root: `package.json`, `pnpm-workspace.yaml`
