# Site Lifecycle Review

**Date:** 2026-03-23
**Scope:** Full site lifecycle management -- creation, deployment, management, and decommissioning
**Reviewer:** Claude Code audit

---

## Executive Summary

The infront-cms platform provides a comprehensive site lifecycle through an admin UI with a 5-step wizard, deployment pipeline, configuration management, versioning, and site deletion. The lifecycle covers creation through decommissioning, which is architecturally sound. However, the review found **5 critical issues**, **7 high-severity issues**, **9 medium issues**, and **5 low-severity items**.

The most critical findings are: (1) no rollback on failed site creation leaves partial state on disk, (2) fire-and-forget deployment with no retry mechanism, (3) the config parser uses brittle regex/string manipulation to parse TypeScript, (4) no concurrency protection on deploys, and (5) the middleware's dependency on an external auth service means all admin APIs are inaccessible when auth is down.

---

## Lifecycle Stages Reviewed

### 1. Site Creation

**Admin UI Wizard (`SiteWizard.tsx`):**
- 5-step flow: Details -> Template -> Theme -> Config -> Create
- Calls `POST /api/sites/create` with full site configuration
- Wizard is ~700+ lines of React with client-side color scale generation

**Generator (`generator.ts`):**
- Copies template files, applies configuration, generates `site.config.ts` and `global.css`
- Registers site in `pnpm-workspace.yaml`
- Triggers build and deploy pipeline

**CLI Alternative (`new-site.sh`):**
- Shell script for headless site creation
- Uses `sed` for text substitution in copied files
- Does NOT trigger deployment (manual step required)

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| C1 | CRITICAL | **No rollback on failed creation.** If the generator creates files but the deploy fails, partial site files remain on disk. The `pnpm-workspace.yaml` is already modified, the site directory exists, but the site is not deployed. No cleanup occurs. |
| C5 | CRITICAL | **No concurrency protection.** Two simultaneous `create` requests could conflict on `pnpm install`, corrupt `pnpm-workspace.yaml`, or race on directory creation. |
| H2 | HIGH | **CLI and admin wizard are disconnected.** The CLI script creates files but does not trigger deployment. The admin wizard creates files AND deploys. A site created via CLI will not appear as "deployed" in the admin dashboard. |
| H6 | HIGH | **Docker volume means sites created via admin don't persist to git.** The admin runs in Docker with a volume mount. Sites created via the admin UI exist in the Docker volume but are not automatically committed to git. A container restart loses uncommitted sites. |
| L5 | LOW | **CLI script doesn't handle special characters** in `CLIENT_NAME` for sed substitution. Names with `/`, `&`, or quotes will break the sed command. |

---

### 2. Deployment Pipeline

**Build (`build.ts`):**
- Runs `pnpm install` (timeout: 120s) then `astro build` (timeout: 180s)
- Captures stdout/stderr for status reporting

**Deploy (`deploy.ts`):**
- Multi-step: build -> `wrangler deploy` -> DNS record -> Worker custom domain
- Writes status to `.deploy.json` per site
- Admin UI polls `/api/sites/[slug]/deploy-status` every 3s

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| C2 | CRITICAL | **Fire-and-forget deployment with no retry.** If `wrangler deploy` fails due to a transient Cloudflare API error, the deploy is marked as "failed" with no automatic retry. The user must manually trigger a redeploy. |
| H7 | HIGH | **`deploy-site.yml` only deploys the template site.** The CI workflow watches `sites/template/**` only. No client sites have automated CI/CD. All client deployments are manual via admin UI or CLI. |
| M1 | MEDIUM | **No health check or smoke test after deployment.** After `wrangler deploy` succeeds, there is no verification that the site is actually serving correctly. A deployment that produces a broken site goes undetected. |
| M2 | MEDIUM | **No deployment history.** Only the last deploy is tracked in `.deploy.json`. No history of previous deployments, no way to compare deploy times or track failures over time. |
| M6 | MEDIUM | **No way to detect stale deploy metadata.** If `.deploy.json` says "deployed" but the Worker was manually deleted, the admin UI shows a stale status. No periodic verification. |

---

### 3. Site Management

**Configuration (`config.ts`):**
- Reads `site.config.ts` via filesystem
- Parses TypeScript configuration using regex/string manipulation
- Writes updated config back to file

**Versioning (`versioning.ts`):**
- Git-based version history
- `getVersionHistory()` runs `git log` then `git diff-tree` per commit
- `revertToVersion()` checks out files from a specific commit

**Custom Domains (`custom-domain.ts`):**
- Adds CNAME DNS record via Cloudflare API
- Assigns Worker custom domain

**Promotion (`promote.ts`):**
- Marks a site as "production" in `.deploy.json`
- Updates metadata only

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| C3 | CRITICAL | **Config parser uses brittle regex/string manipulation to parse TypeScript.** The config read/write endpoint parses `site.config.ts` with regex patterns. Complex TypeScript expressions, multiline strings, comments, or non-standard formatting will break the parser. A malformed write could corrupt the config file and break the site. |
| H1 | HIGH | **No bulk redeploy capability.** After updating a shared package (`packages/ui` or `packages/utils`), there is no way to redeploy all affected sites at once. Each site must be individually redeployed from the admin dashboard. |
| H3 | HIGH | **Promote endpoint is a no-op for routing.** The promote endpoint updates metadata (`.deploy.json`) but does not actually change traffic routing. There is no staging vs production separation at the infrastructure level. Promoting a site does not add a production domain or configure DNS differently. |
| H4 | HIGH | **No domain validation beyond format check.** Adding a custom domain only validates the format. There is no DNS ownership verification (e.g., TXT record check), no check for existing domain assignments, no SSL certificate validation. |
| H5 | HIGH | **Version history is O(n*m).** `getVersionHistory()` runs `git diff-tree` per commit sequentially. For a site with hundreds of commits, this becomes very slow. No caching, no pagination. |
| M3 | MEDIUM | **No scheduled backups of site files in Docker volume.** Sites exist in the Docker volume but are not automatically backed up or committed to git. |
| M5 | MEDIUM | **Export endpoint returns file manifests but no actual downloadable archive.** The `/api/sites/[slug]/export` endpoint lists files but does not produce a zip or tarball. |
| M7 | MEDIUM | **Dev server manager is in-memory only.** Running dev servers are tracked in memory. A PM2 restart of the admin process orphans any running dev servers. |
| M9 | MEDIUM | **Checklist heuristics are simplistic.** The onboarding checklist checks like "favicon > 500 bytes = customized" are easily fooled. No actual content validation. |

---

### 4. Site Decommissioning

**Deletion (`delete.ts`):**
- Best-effort cleanup: delete Worker, delete DNS records, remove custom domain, delete local files
- Each step is individually try/caught; failures collected as warnings
- Removes site from `pnpm-workspace.yaml`

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| M8 | MEDIUM | **No rate limiting on admin API routes.** Any authenticated user can call delete (or any other API) as fast as they want. No protection against accidental rapid-fire operations. |
| L1 | LOW | **env.ts has hardcoded `/app` path.** The `getMonorepoRoot()` function in `env.ts` defaults to `/app` (Docker path). If the admin runs outside Docker, this default is wrong. |

---

### 5. Templates

**Template Registry (`packages/config/src/templates.ts`):**
- 5 templates: business-starter, restaurant, portfolio, saas, professional
- Each template defines page schemas with component variants
- Templates include screenshot URLs (static placeholders)

**Issues:**

| # | Severity | Issue |
|---|----------|-------|
| M4 | MEDIUM | **Template screenshots are static placeholders.** No live preview or dynamically generated screenshots. Users cannot see how their chosen colors/fonts will look before creating the site. |
| L3 | LOW | **Color scale generator in SiteWizard could produce inaccessible contrast ratios.** The auto-generated color scales from a single primary color may not meet WCAG AA contrast requirements for all shade combinations. |
| L4 | LOW | **No sitemap or robots.txt verification in checklist.** The onboarding checklist does not verify that these SEO essentials exist. |

---

## Issues Summary

### CRITICAL (5)

| # | Issue | Impact |
|---|-------|--------|
| C1 | No rollback on failed site creation -- partial state left on disk | Broken monorepo state, orphaned files |
| C2 | Fire-and-forget deployment with no retry mechanism | Failed deploys require manual intervention |
| C3 | Config parser uses brittle regex to parse TypeScript | Config corruption, site breakage |
| C4 | Auth middleware dependency on external service -- if auth.infront.cy is down, all APIs inaccessible | Complete admin lockout |
| C5 | No concurrency protection on deploys -- two simultaneous creates could conflict | Corrupted workspace, build failures |

### HIGH (7)

| # | Issue | Impact |
|---|-------|--------|
| H1 | No bulk redeploy capability after shared package updates | Manual work scales linearly with site count |
| H2 | CLI script and admin wizard disconnected | Inconsistent site state depending on creation method |
| H3 | Promote endpoint is a no-op for traffic routing | No actual staging/production separation |
| H4 | No domain validation beyond format check | Potential domain hijacking or misconfiguration |
| H5 | Version history is O(n*m) -- slow for sites with many commits | Admin UI hangs on version history page |
| H6 | Docker volume sites not persisted to git | Data loss on container restart |
| H7 | CI/CD only deploys template site, not client sites | No automated deployment for production sites |

### MEDIUM (9)

| # | Issue | Impact |
|---|-------|--------|
| M1 | No health check after deployment | Broken deploys go undetected |
| M2 | No deployment history (only last deploy tracked) | Cannot audit or troubleshoot past deploys |
| M3 | No scheduled backups of site files in Docker volume | Data loss risk |
| M4 | Template screenshots are static placeholders | Poor template selection UX |
| M5 | Export endpoint returns manifests, not archives | Cannot actually export/download a site |
| M6 | No detection of stale deploy metadata | Admin UI shows incorrect status |
| M7 | Dev server manager is in-memory only | Orphaned processes on restart |
| M8 | No rate limiting on admin API routes | Accidental or malicious rapid operations |
| M9 | Checklist heuristics are simplistic | False positives in onboarding status |

### LOW (5)

| # | Issue | Impact |
|---|-------|--------|
| L1 | `env.ts` has hardcoded `/app` path | Breaks if admin runs outside Docker |
| L2 | `sites.ts` duplicates `getMonorepoRoot()` | Code duplication |
| L3 | Color scale generator may produce inaccessible contrast | WCAG compliance risk |
| L4 | No sitemap/robots.txt in onboarding checklist | SEO essentials missed |
| L5 | CLI script doesn't handle special characters in names | sed command failure |

---

## Recommendations (Prioritized)

### Priority 1: Immediate
1. **Add rollback to site creation** -- If deploy fails, clean up generated files and revert `pnpm-workspace.yaml`
2. **Add concurrency lock** -- Use a file lock or in-memory mutex to prevent simultaneous creates/deploys
3. **Replace regex config parser** -- Use TypeScript AST parsing (e.g., `ts-morph`) or store config as JSON alongside TypeScript
4. **Add auth session caching** -- Cache valid sessions for 60s to survive brief auth outages

### Priority 2: Near-Term (1-2 weeks)
5. **Add deploy retry** -- Retry `wrangler deploy` up to 3 times with exponential backoff
6. **Add per-site CI/CD** -- Create deploy workflows with path filters for each site
7. **Add bulk redeploy** -- Admin API endpoint to redeploy all sites (or affected sites) after shared package changes
8. **Auto-commit sites to git** -- After successful creation/deploy, commit site files to git

### Priority 3: Medium-Term (1 month)
9. **Add deployment history** -- Store deploy records with timestamps, status, duration, error messages
10. **Add post-deploy health check** -- Fetch the deployed site URL and verify 200 response
11. **Implement domain ownership verification** -- Require TXT record before adding custom domain
12. **Make export produce downloadable archives** -- Zip site source + built output
13. **Add version history caching and pagination** -- Cache git log results, paginate API response

---

## Files Reviewed

### Site Creation
- `sites/admin/src/pages/api/sites/create.ts`
- `sites/admin/src/islands/SiteWizard.tsx`
- `sites/admin/src/lib/generator.ts`
- `infra/provisioning/new-site.sh`
- `infra/provisioning/provision-cms.sh`

### Deployment Pipeline
- `sites/admin/src/lib/deploy.ts`
- `sites/admin/src/lib/build.ts`
- `sites/admin/src/lib/cloudflare.ts`
- `sites/admin/src/pages/api/sites/[slug]/redeploy.ts`
- `sites/admin/src/pages/api/sites/[slug]/deploy-status.ts`

### Site Management
- `sites/admin/src/pages/api/sites/[slug]/config.ts`
- `sites/admin/src/pages/api/sites/[slug]/custom-domain.ts`
- `sites/admin/src/pages/api/sites/[slug]/versions.ts`
- `sites/admin/src/pages/api/sites/[slug]/promote.ts`
- `sites/admin/src/pages/api/sites/[slug]/checklist.ts`
- `sites/admin/src/pages/api/sites/[slug]/export.ts`

### Decommissioning
- `sites/admin/src/pages/api/sites/[slug]/delete.ts`

### Infrastructure
- `sites/admin/src/lib/dev-server.ts`
- `sites/admin/src/lib/sites.ts`
- `sites/admin/src/middleware.ts`
- `infra/admin/deploy.yml`
- `.github/workflows/deploy-site.yml`

### Templates & Config
- `packages/config/src/templates.ts`
- `packages/config/src/types.ts`
