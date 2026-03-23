# Admin UI Audit Review: Infront CMS Platform

**Date:** 2026-03-23
**Reviewer:** Full-Stack Application Auditor
**Scope:** `sites/admin/` -- all pages, API routes, middleware, libraries, islands, and layouts
**Framework:** Functionality, Security, Reliability, Usability

---

## Executive Summary

**Overall Admin UI Status: FUNCTIONAL WITH SIGNIFICANT GAPS**

The admin UI provides a working foundation for site creation, deployment, and management. The five-step site creation wizard, template gallery, and deploy pipeline are well-structured. However, the audit uncovered issues across security, reliability, and usability that need attention. The most critical gaps are: missing `prerender = false` on 7 API routes, no CSRF protection on state-changing endpoints, no per-site authorization (any authenticated user can modify any site), fire-and-forget deployment that can leave status stuck, and missing error handling that silently swallows failures.

**Finding Counts:** 3 Critical, 7 High, 10 Medium, 5 Low

---

## Critical Issues

### C-1: Seven Admin API Routes Missing `prerender = false`

**Files:**
- `sites/admin/src/pages/api/sites/create.ts`
- `sites/admin/src/pages/api/sites/index.ts`
- `sites/admin/src/pages/api/sites/[slug]/redeploy.ts`
- `sites/admin/src/pages/api/sites/[slug]/deploy-status.ts`
- `sites/admin/src/pages/api/sites/[slug]/overrides.ts`
- `sites/admin/src/pages/api/sites/[slug]/custom-domain.ts`
- `sites/admin/src/pages/api/templates/index.ts`

In Astro 6, without `export const prerender = false;`, routes may be prerendered at build time rather than handled as server-side endpoints. This could mean routes are unavailable at runtime or return stale/empty responses.

The following routes DO correctly include the directive: `delete.ts`, `export.ts`, `config.ts`, `pages.ts`, `media.ts`, `versions.ts`, `promote.ts`, `checklist.ts`, `dev-server.ts`, `dev-servers.ts`, `[page].ts`, `sections.ts`, `reorder.ts`.

**Recommended Fix:** Add `export const prerender = false;` to all 7 missing API route files.

---

### C-2: No CSRF Protection on State-Changing Endpoints

**Files:** All POST/PUT/DELETE routes in `sites/admin/src/pages/api/`

The admin middleware authenticates via session cookies forwarded to the central auth service, but does not verify a CSRF token. A malicious website visited by an authenticated admin could trigger any admin action: create sites, delete sites, modify configs, or trigger deploys.

**Recommended Fix:** Require a custom header like `X-Requested-With: XMLHttpRequest` on all non-GET API routes, checked in middleware.

---

### C-3: Fire-and-Forget Deployment Loses Errors Silently

**File:** `sites/admin/src/pages/api/sites/create.ts` (lines 183-185)
**File:** `sites/admin/src/lib/deploy.ts` (lines 118-122)

If deployment throws before writing `.deploy.json`, the status stays at "pending" forever. The admin UI polls `deploy-status` every 3 seconds and would show "pending" indefinitely with no way to recover.

Similarly, if `writeDeployMetadata` itself throws in the building step, the function silently returns with `status: 'building'` stuck forever.

**Recommended Fix:** Wrap the entire deploy pipeline in a try/catch that always writes a final status (either `live` or `failed`).

---

## High Severity Issues

### H-1: No Per-Site Authorization

**File:** `sites/admin/src/middleware.ts`

All authenticated users have identical permissions. Any authenticated admin can delete any client's site, modify any client's configuration, trigger deploys for any site, or read any site's data. There is no ownership model or role-based access control.

**Recommended Fix:** Add a site ownership field and per-site authorization checks.

---

### H-2: Deploy Concurrency Race Condition

**Files:** `sites/admin/src/lib/deploy.ts`, `sites/admin/src/pages/api/sites/[slug]/redeploy.ts`

The redeploy endpoint checks `meta.status === 'building' || 'deploying'` to prevent concurrent deploys, but this check is not atomic. Two near-simultaneous requests could both read `status: 'live'`, both pass the check, and both start deploying.

**Recommended Fix:** Use a filesystem lock or atomic compare-and-swap on the status field.

---

### H-3: Hardcoded Monorepo Root in sites.ts

**File:** `sites/admin/src/lib/sites.ts` (line 19)

`getMonorepoRoot()` returns `'/app'` without checking `process.env.MONOREPO_ROOT`, unlike `generator.ts` which does. This breaks local development -- the admin UI cannot list sites when running locally.

**Recommended Fix:** Use `process.env.MONOREPO_ROOT || '/app'` consistently.

---

### H-4: No Error Feedback in Admin UI for Partial Failures

When the deploy pipeline encounters partial failures (e.g., DNS creation fails but Worker deployment succeeds), warnings are accumulated but may not be visible to the admin user in the UI. The status shows "live" even when some infrastructure is misconfigured.

**Recommended Fix:** Display partial failure warnings in the deploy status UI.

---

### H-5: Dev Server Processes Inherit Full Environment

**File:** `sites/admin/src/lib/dev-server.ts`

Dev server processes spawned by the admin UI inherit the full environment, including `CLOUDFLARE_API_TOKEN`, `SESSION_SECRET`, and other sensitive values.

**Recommended Fix:** Sanitize the environment when spawning dev server processes.

---

### H-6: Color Validator Exists But Is Never Called

**File:** `sites/admin/src/lib/generator.ts` (lines 82-86)

The `validateColor()` function exists but is never invoked. Color values from the wizard are written directly to CSS without validation. A malicious color value could inject CSS.

**Recommended Fix:** Call `validateColor()` on all color inputs before writing to CSS.

---

### H-7: No Slug Reserved Name Blocklist

**File:** `sites/admin/src/lib/generator.ts` (lines 416-427)

The generator only blocks `template` and `admin` as slugs. Names like `dist`, `src`, `test`, `build`, `node_modules`, or `package.json` could cause filesystem issues.

**Recommended Fix:** Add a comprehensive blocklist of reserved slugs.

---

## Medium Severity Issues

### M-1: No Rate Limiting on Admin API

All admin API endpoints can be called without throttling. An attacker with valid credentials (or via CSRF) could rapidly create/delete sites.

### M-2: No CORS Headers on Admin API

Admin API responses do not include explicit CORS headers. While browsers default to same-origin, adding explicit headers provides defense-in-depth.

### M-3: Error Messages Leak Internal Details

Several API routes expose `err.message` directly to the client. Internal error messages can reveal file paths, database structure, or infrastructure details.

**Locations:**
- `sites/admin/src/pages/api/sites/create.ts` (line 204)
- `sites/admin/src/pages/api/sites/[slug]/custom-domain.ts` (lines 53, 99)
- `sites/admin/src/pages/api/sites/[slug]/config.ts` (line 219)

### M-4: structuredData Uses .passthrough() Allowing Arbitrary JSON

**File:** `sites/admin/src/pages/api/sites/create.ts` (lines 71-76)

The `structuredData` field in the site creation schema uses `.passthrough()`, allowing any arbitrary JSON to be written into generated `site.config.ts` files.

### M-5: No Deletion Confirmation Mechanism

The DELETE endpoint has no confirmation token or two-step process. A single API call permanently destroys a site.

### M-6: Template Copy Includes Hidden Files

**File:** `sites/admin/src/lib/generator.ts` (lines 442-449)

The copy filter excludes `node_modules` and `dist` but not `.git`, `.deploy.json`, or other hidden files.

### M-7: Custom Domain Has No Format Validation

**File:** `sites/admin/src/pages/api/sites/[slug]/custom-domain.ts` (line 18)

The domain is only checked for being non-empty. No hostname format validation exists.

### M-8: Wrangler Version Not Pinned in Deploy

**File:** `sites/admin/src/lib/deploy.ts` (lines 74-88)

`npx wrangler deploy` may pick up different wrangler versions across environments.

### M-9: Build Timeout May Be Insufficient

**File:** `sites/admin/src/lib/build.ts` (line 56)

The 180-second build timeout may be insufficient for complex sites with many pages and images.

### M-10: Generated Sites Use Static Output Only

**File:** `sites/admin/src/lib/generator.ts` (line 209)

All generated sites use `output: 'static'`. If a template includes server-rendered pages, they would not function.

---

## Low Severity Issues

### L-1: No Admin Operation Audit Trail

No logging of who performed what action, when, and on which site.

### L-2: Non-Wizard Sites Not Protected from Deletion

The delete endpoint only blocks `template` and `admin`. Sites like `abroad-jobs`, `atelier-kosta`, etc. can be deleted via API.

### L-3: No Duplicate Domain Check

The system does not verify whether a custom domain is already assigned to another site.

### L-4: Duplicate Step Numbering in Generator

Lines 503 and 511 both say "// 9." and lines 541 and 546 both reference "// 11." in the generator code.

### L-5: Docker Entrypoint Writes Secrets to Plaintext File

**File:** `docker-entrypoint.sh`

All secrets are written to `/app/runtime-env.json` as plaintext, readable by any process in the container.

---

## Admin UI Feature Completeness

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard / Site List | Working | Lists sites with deploy status badges |
| Template Gallery | Working | 5 templates available |
| Site Creation Wizard | Working | 5-step form with auto-deploy |
| Deploy Status Polling | Working | Polls every 3s via API |
| Redeploy | Working | Triggers full rebuild and deploy |
| Custom Domain | Working | Add/remove via Cloudflare API |
| Site Deletion | Working | Thorough multi-step cleanup |
| Component Overrides | Working | Shows which components are overridden |
| Page Editor | Working | Edit page sections and content |
| Config Editor | Working | Edit site.config.ts values |
| Media Upload | Working | Image upload with validation |
| Version History | Working | Site versioning with rollback |
| Help Manual | Working | In-app documentation |
| Auth (Login/Logout) | Working | Via central BetterAuth service |
| Multi-user / RBAC | Missing | No role-based access |
| Activity Log | Missing | No audit trail |
| Bulk Operations | Missing | No multi-site actions |
| Search / Filter | Missing | No way to filter site list |
| Analytics Dashboard | Missing | No site performance data |

---

## Prioritized Recommendations

### Immediate (This Week)

1. **Add `prerender = false`** to all 7 missing API routes (C-1)
2. **Add CSRF protection** via custom header requirement (C-2)
3. **Fix deploy error handling** to always write final status (C-3)
4. **Fix hardcoded monorepo root** in sites.ts (H-3)

### Short-Term (This Month)

5. **Add deploy locking** to prevent concurrent deploys (H-2)
6. **Call color validator** on wizard inputs (H-6)
7. **Add reserved slug blocklist** (H-7)
8. **Sanitize dev server environment** (H-5)
9. **Add deletion confirmation** mechanism (M-5)
10. **Add domain format validation** (M-7)

### Medium-Term (This Quarter)

11. **Implement per-site authorization** (H-1)
12. **Add admin audit logging** (L-1)
13. **Add rate limiting** on admin API (M-1)
14. **Pin wrangler version** (M-8)
15. **Replace error message leakage** with generic responses (M-3)

---

## Files Reviewed

- All API routes in `sites/admin/src/pages/api/` (~20 endpoints)
- Admin middleware (`sites/admin/src/middleware.ts`)
- Admin libraries: `deploy.ts`, `build.ts`, `cloudflare.ts`, `generator.ts`, `sites.ts`, `dev-server.ts`, `versioning.ts`, `env.ts`
- Admin layouts and pages
- Docker entrypoint and Dockerfile
- Infrastructure configs (`infra/admin/deploy.yml`, `setup-vps.sh`, `update-vps.sh`)
- Admin `package.json`
