# Error Resilience & Fault Tolerance Review

**Date:** 2026-03-23
**Scope:** Full codebase at /Users/stefanospetrou/Desktop/Apps/infront-cms
**Reviewer:** SRE audit via Claude Code

---

## Executive Summary

**Overall Resilience Rating: 3/10 (Poor)**

This platform has significant resilience gaps across nearly every external service integration. The codebase follows a "happy path" development pattern: operations either succeed or throw unhandled exceptions that surface as 500 errors. There are **zero** retry mechanisms, **zero** circuit breakers, **zero** timeouts on fetch calls, **no** Sentry integration (only mentioned in docs), **no** Betterstack integration (only mentioned in docs), **no** Docker health checks, **no** health check endpoints, and **no** graceful degradation for any external service failure.

The most critical finding is that the Stripe checkout flow can leave orphaned database records with no cleanup mechanism, and the auth middleware treats auth service failures as "unauthorized" -- locking all admins out of the dashboard when auth.infront.cy is down.

**Immediate risk areas:**
1. Auth service outage = complete admin lockout (no fallback)
2. Stripe checkout creates DB records before payment, with no cleanup for abandoned sessions
3. Directus outage crashes CMS-powered sites at build time (no caching, no fallback)
4. D1 failures crash the entire abroad-jobs site with no error page
5. No monitoring or alerting infrastructure is actually deployed

---

## Dependency Map & Single Points of Failure

```
                    +------------------+
                    |  auth.infront.cy |  <-- SPOF for ALL admin access
                    +--------+---------+
                             |
                    +--------v---------+
                    |   Admin UI       |
                    |   (Hetzner VPS)  |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v---+  +------v------+  +----v-------+
     | Cloudflare |  | Cloudflare  |  |   GitHub   |
     | API        |  | Workers     |  |   (CI/CD)  |
     | (DNS/Wkrs) |  | (sites)     |  +------------+
     +--------+---+  +------+------+
              |              |
              |     +--------v---------+
              |     |   Cloudflare D1  |  <-- SPOF for abroad-jobs
              |     +------------------+
              |
     +--------v-----------+    +-------------------+
     |  Directus (Docker) |    |  Stripe API       |  <-- SPOF for job posting
     |  (Hetzner VPS)     |    +-------------------+
     +-----+--------------+
           |                   +-------------------+
     +-----v---------+        |  Resend API       |  <-- SPOF for confirmation emails
     |  PostgreSQL    |        +-------------------+
     |  (Docker)      |
     +----------------+        +-------------------+
                               | Arbeitnow API    |  <-- External job import
                               +-------------------+
```

**Single Points of Failure:**
- `auth.infront.cy` -- all admin access
- Cloudflare D1 -- entire abroad-jobs site
- Stripe API -- job posting payment flow
- Directus -- all CMS-powered site content
- Hetzner VPS -- admin UI + all Directus instances
- S3 bucket for backups (no verification of backup integrity)

---

## Failure Mode Analysis (Service-by-Service)

### 1. Directus Failure

**Current behavior:** When Directus is down, CMS-powered sites (atelier-kosta, athena-institute, meridian-properties) behave differently depending on their build mode:

- **Static sites (build-time fetch):** `getProjects()`, `getTeamMembers()`, etc. in `sites/atelier-kosta/src/lib/directus.ts` have a null-client guard (`if (!client) return []`), so if `DIRECTUS_URL` is unset, they return empty arrays. However, if Directus is configured but **down**, the `@directus/sdk` `readItems()` call in `packages/utils/src/directus.ts` (lines 40, 64) will throw an unhandled exception. There is **no try/catch** around any Directus call in the utility layer.

- **Impact:** Build fails for static sites, and SSR pages crash with a 500 error. No stale content cache exists. No fallback content mechanism.

- **File:** `packages/utils/src/directus.ts` -- zero error handling
- **File:** `sites/atelier-kosta/src/lib/directus.ts` -- null-client guard only, no fetch error handling
- **File:** `sites/atelier-kosta/src/pages/index.astro` -- calls `await getProjects()` with no try/catch

**Severity: HIGH**

### 2. D1 Failure

**Current behavior:** The abroad-jobs site depends on Cloudflare D1 for every SSR page. If D1 is unavailable or slow:

- **Homepage (`index.astro`):** Lines 50-91 perform raw D1 queries and Drizzle queries with no try/catch. An exception crashes the page.
- **Job detail (`jobs/[slug].astro`):** Same pattern -- unhandled DB errors.
- **API routes (`api/jobs.ts`, `api/checkout.ts`):** These also lack top-level try/catch. The checkout route performs multiple sequential DB inserts (lines 53-75) with no transaction wrapping.
- **No timeouts:** D1 queries have no timeout configuration.
- **No connection pooling concerns** (D1 handles this), but there is no retry on transient failures.

**Severity: HIGH**

### 3. Stripe Failure

**Current behavior -- Checkout (`api/checkout.ts`):**
- Line 50: `stripe.checkout.sessions.create()` -- no try/catch. If Stripe is down, the entire request crashes with a 500.
- **Critical data consistency issue:** Lines 53-75 insert jobs into D1 *after* creating the Stripe session. If the DB insert fails partway, some jobs exist and some do not, but the Stripe session is already created. The user would be charged but only some jobs would appear.
- **No timeout on Stripe API calls.**

**Current behavior -- Webhook (`api/webhook.ts`):**
- Lines 41-48: Activates jobs via DB update. If the D1 update fails, Stripe has already charged the customer, but jobs remain inactive. There is **no retry mechanism** and **no dead letter queue**.
- Lines 56-68: Email sending failure is correctly caught and logged (good). However, the error is only `console.error` with no context -- no session ID, no customer email, no job IDs.
- **Idempotency:** If Stripe sends the same webhook twice, the `UPDATE` on line 41 runs again. This is safe (sets same values) but `activatedAt` gets overwritten to the current time, and a duplicate confirmation email may be sent.

**Severity: CRITICAL** (payment accepted, jobs not activated scenario)

### 4. Auth Service Down

**Current behavior (`sites/admin/src/middleware.ts`):**
- Line 25: `fetch(auth.infront.cy/api/auth/get-session)` -- no timeout, no retry.
- Lines 46-49: **On any error (including network timeout), the middleware redirects to the login page.** This means if auth.infront.cy is down for even a moment, ALL admin users are immediately locked out of the dashboard. Every page load, every API call triggers an auth check that will fail.
- There is no session caching -- every single request validates against the remote auth service.
- There is no fallback authentication mechanism.
- The `/health` endpoint is in the public routes list (line 6) but **no actual health endpoint exists** -- it would just 404.

**Severity: CRITICAL** (complete admin lockout on auth service outage)

### 5. Resend Failure

**Current behavior (`sites/abroad-jobs/src/lib/email.ts`):**
- Line 18: `resend.emails.send()` -- no timeout, no retry.
- The webhook handler (`api/webhook.ts` line 57-68) correctly catches email failures and continues. This is the one bright spot in the codebase.
- However: email failures are logged with `console.error('Failed to send confirmation email')` -- no context about which customer, which jobs, which session. In production on Cloudflare Workers, these logs are ephemeral and likely lost.
- **No queue or retry:** If the email fails, it is permanently lost. The customer receives no confirmation.
- **Contact form emails:** The shared `ContactForm.tsx` calls `/api/contact` but there is no contact API route in the abroad-jobs site. For template/CMS sites that do have one, the Resend integration follows the same no-retry pattern.

**Severity: MEDIUM**

### 6. Cloudflare API Failure

**Current behavior (`sites/admin/src/lib/cloudflare.ts`):**
- The `cfFetch` helper (lines 12-42) correctly checks `res.ok` and parses error messages. This is reasonable.
- **No retry logic** on any Cloudflare API call.
- **No timeout** on fetch calls to `api.cloudflare.com`.

**Deploy pipeline (`sites/admin/src/lib/deploy.ts`):**
- `deployNewSite()` (lines 99-179) is a multi-step pipeline: build -> wrangler deploy -> DNS record -> Worker custom domain. If DNS creation succeeds but `addWorkerCustomDomain()` fails (line 156), the deploy is marked as "failed" but:
  - The Worker is already deployed and running
  - The DNS record exists and points to the Worker
  - The `.deploy.json` says "failed" so the UI shows a failure
  - There is **no rollback** of the DNS record or Worker
  - **Inconsistent state:** site is accessible via workers.dev URL but deploy shows "failed"

- `redeploySite()` similarly has no rollback on partial failure.

**Site deletion (`api/sites/[slug]/delete.ts`):**
- Lines 49-95: Uses "best-effort" cleanup pattern -- each Cloudflare operation is individually try/caught, failures are collected as warnings. This is actually a **good pattern** for cleanup. However, if the Worker deletion fails, the DNS record may still point to a non-existent Worker (or worse, the Worker keeps running and serving stale content).

**Severity: HIGH** (inconsistent infrastructure state)

### 7. Network Failures

**Finding: ZERO timeout configuration across the entire codebase.**

Every external `fetch()` call in the codebase lacks:
- Timeout configuration (no `AbortController`, no `signal`)
- Retry with backoff
- Circuit breaker patterns

Specific instances:

| File | Line | External Call | Timeout |
|------|------|---------------|---------|
| `admin/src/middleware.ts` | 25 | auth.infront.cy | None |
| `admin/src/lib/cloudflare.ts` | 19 | api.cloudflare.com | None |
| `abroad-jobs/src/lib/import-jobs.ts` | 94 | arbeitnow.com API | None |
| `abroad-jobs/src/pages/api/checkout.ts` | 50 | Stripe API | None* |
| `abroad-jobs/src/pages/api/webhook.ts` | 23 | Stripe (signature verify) | None |
| `abroad-jobs/src/lib/email.ts` | 18 | Resend API | None |
| `packages/utils/src/directus.ts` | 40,64 | Directus API | None |

*Note: The Stripe Node SDK has internal timeouts (80s default), but other fetch calls have no protection against hanging connections.

The only timeouts in the codebase are on child process executions:
- `build.ts` line 39: `timeout: 120_000` (pnpm install)
- `build.ts` line 54: `timeout: 180_000` (astro build)
- `deploy.ts` line 82: `timeout: 120_000` (wrangler deploy)

**Severity: HIGH**

### 8. Error Boundaries

**React islands:**
- **No React Error Boundaries exist anywhere in the codebase.** If a React island throws during render, the entire component tree crashes. The user sees a blank space where the component should be.
- `JobPostForm.tsx`, `LoadMore.tsx`, `ContactForm.tsx`, `SiteWizard.tsx`, `SiteEditor.tsx` -- none wrap their content in error boundaries.
- The `LoadMore.tsx` component (line 97-98) silently swallows fetch errors (`catch { // Silently fail }`), which means the "Load more" button may stop working with no feedback to the user.

**Astro error pages:**
- `atelier-kosta` has a `404.astro` page.
- `abroad-jobs` has NO custom 404 page -- Cloudflare Workers will serve a generic error.
- No custom 500 error page exists for any site.
- No Astro `error.astro` page exists.

**Admin UI:**
- The `SiteEditor.tsx` has some error state handling (`loadState === 'error'`) and shows error messages via `alert()`. This is minimal but present.
- Other admin islands like `SiteWizard.tsx` and `SiteTable.tsx` follow similar `try/catch with alert()` patterns.

**Severity: MEDIUM**

### 9. Data Consistency Under Failure

**Checkout flow (CRITICAL):**
1. Stripe session created (line 50) -- money committed
2. DB inserts loop (lines 53-75) -- if insert #3 of 5 fails, you have:
   - A valid Stripe session
   - 2 jobs in the database
   - 3 jobs the customer paid for but don't exist
   - No transaction wrapping (D1 does not support multi-statement transactions in the same way)
   - No compensation/rollback mechanism

**Webhook processing:**
1. If `checkout.session.completed` fires and the DB update (line 41) succeeds but the SELECT (line 51) fails, no email is sent but jobs are activated. This is acceptable.
2. If the webhook fires twice (Stripe retry), the DB update is idempotent (good), but the confirmation email sends again (minor issue).

**Deploy pipeline:**
1. If wrangler deploy succeeds but DNS creation fails, the site is deployed but unreachable via the expected domain.
2. The `.deploy.json` file is the single source of truth for deploy state. It is written to disk with no locking -- concurrent deploys (though guarded by status check) could corrupt it.

**Import jobs (`import-jobs.ts`):**
1. Each job is inserted individually with a per-row try/catch (lines 162-185). This is **good** -- one failure does not abort the entire import.
2. However, the dedup check (line 140-148) and slug collision check (lines 152-158) are not atomic. Under concurrent imports, you could get duplicate entries.

**Severity: CRITICAL** (checkout flow data loss)

### 10. Monitoring & Alerting

**Sentry:**
- CLAUDE.md lists Sentry as part of the tech stack, but **Sentry is not installed or configured anywhere in the codebase**. No `@sentry/astro`, no `@sentry/node`, no `@sentry/cloudflare` package. No DSN configured. No error capture calls. The only mention of Sentry in code is in the help documentation (`help-content.ts`).
- **All errors go to `console.error` which is ephemeral** on Cloudflare Workers (logs disappear after request completion) and limited on the admin VPS (stdout only, no structured logging).

**Betterstack:**
- Referenced in CLAUDE.md and docs but **not configured anywhere**. No uptime monitoring endpoints, no status page, no alerting webhooks.

**Actual monitoring: NONE.**

**Severity: CRITICAL** (operating blind in production)

### 11. Health Checks

**Docker:**
- The `Dockerfile` has **no HEALTHCHECK instruction**. Docker/Kamal cannot determine if the admin container is healthy.
- The `docker-compose.yml` for Directus uses `condition: service_started` (not `service_healthy`), meaning the Directus container starts even if PostgreSQL is not ready to accept connections.

**Application:**
- The admin middleware lists `/health` as a public route, but **no health check endpoint exists**. Visiting `/health` would return a 404.
- No health check for the abroad-jobs site.
- No health check for Directus instances.
- No dependency health verification (can we reach D1? Can we reach Stripe? Can we reach auth.infront.cy?).

**Severity: HIGH**

### 12. Recovery Procedures

**Database backups:**
- `infra/backups/pg_backup.sh` backs up PostgreSQL to S3 -- **good**.
- `infra/backups/restore.sh` provides restore scripts -- **good**.
- However: no backup verification (restored data is never checksummed or tested).
- **D1 (abroad-jobs) has no backup strategy at all.** Cloudflare D1 does have point-in-time recovery, but there is no documented procedure.

**Rollback mechanisms:**
- `sites/admin/src/lib/versioning.ts` provides git-based versioning with `revertToVersion()`. This allows reverting site files to a previous commit. **Good for site content rollback.**
- No rollback for infrastructure changes (DNS, Workers, custom domains).
- No rollback for database schema changes.

**Runbooks:**
- No operational runbooks exist. The closest is CLAUDE.md which documents commands but not incident response.
- No documented procedure for "auth service is down, how do I access admin."
- No documented procedure for "Stripe webhook failed, customer was charged but jobs are inactive."
- No documented procedure for "Directus is down, CMS sites are crashing."

**Severity: HIGH**

### 13. Cascading Failures

**Auth service -> Admin UI:**
- If auth.infront.cy is slow (not down, just slow), every admin page load blocks on the auth verification fetch. Since there is no timeout, a slow auth service would make the admin UI appear to hang indefinitely. All admin operations (deploy, redeploy, delete, config changes) would be blocked.

**D1 -> abroad-jobs:**
- If D1 is slow, the homepage, job detail pages, API routes, and sitemap all block. Since abroad-jobs runs on Cloudflare Workers with a 30s execution limit, slow D1 queries could cause the Worker to timeout, returning a Cloudflare 524 error to every user.

**Directus -> CMS sites (build time):**
- A slow Directus response during `astro build` would cause build timeouts. The build timeout is 180s, but a slow Directus could eat into that budget. Failed builds leave sites undeployed.

**Arbeitnow API -> Import:**
- The import job fetches up to 5 pages from arbeitnow.com (line 92). If the API is slow, the cron-triggered import could timeout. The `fetchArbeitnow()` function catches errors and returns `[]` (line 114), which is correct.

**Cloudflare API -> Deploy pipeline:**
- A slow Cloudflare API during deploy would not cascade (deploys are fire-and-forget with status polling). However, if the admin UI's auth check to auth.infront.cy is slow, the deploy-status polling endpoint also gets blocked by the middleware auth check.

**Severity: HIGH**

---

## Issues Summary

### CRITICAL (Must fix immediately)

| # | Issue | File(s) | Impact |
|---|-------|---------|--------|
| C1 | Auth service down = complete admin lockout. No fallback, no cached sessions, no emergency access. | `admin/src/middleware.ts` | All admin operations impossible |
| C2 | Stripe checkout creates Stripe session then inserts jobs in a loop with no transaction/rollback. Partial insert = customer charged for missing jobs. | `abroad-jobs/src/pages/api/checkout.ts:50-75` | Revenue loss, customer complaints |
| C3 | Stripe webhook failure has no retry/dead-letter. If D1 is down when webhook fires, jobs stay inactive permanently despite payment. | `abroad-jobs/src/pages/api/webhook.ts:41-48` | Revenue loss, customer complaints |
| C4 | Zero monitoring deployed. Sentry not installed. Betterstack not configured. Errors vanish into ephemeral console.error on Workers. | Entire codebase | Operating blind, no alerting |

### HIGH (Fix within 1-2 weeks)

| # | Issue | File(s) | Impact |
|---|-------|---------|--------|
| H1 | No timeouts on any fetch call. Slow external services hang indefinitely. | All files with `fetch()` | Cascading slowdowns, Worker timeouts |
| H2 | Directus utility has zero error handling. Directus down = CMS site crash (500 errors). | `packages/utils/src/directus.ts` | CMS sites down |
| H3 | Deploy pipeline has no rollback on partial failure. DNS/Worker left in inconsistent state. | `admin/src/lib/deploy.ts:99-179` | Orphaned infrastructure |
| H4 | No health check endpoints. Docker has no HEALTHCHECK. Cannot verify service health. | `Dockerfile`, middleware | No automated recovery |
| H5 | D1 query failures on abroad-jobs homepage crash the entire page with no error handling. | `abroad-jobs/src/pages/index.astro` | Full site outage |
| H6 | No retry logic on any external service call. Transient failures are permanent failures. | All API integrations | Unnecessary failures |
| H7 | Cloudflare Workers console.error logs are ephemeral. No persistent logging for abroad-jobs. | All abroad-jobs files | Cannot debug production issues |

### MEDIUM (Fix within 1 month)

| # | Issue | File(s) | Impact |
|---|-------|---------|--------|
| M1 | No React Error Boundaries. Island crash = blank component area. | All `.tsx` islands | Degraded UX on JS errors |
| M2 | abroad-jobs has no custom 404 or 500 error pages. | `abroad-jobs/src/pages/` | Poor UX on errors |
| M3 | Email confirmation failure logged without context (no session ID, email, job IDs). | `abroad-jobs/src/pages/api/webhook.ts:65-68` | Cannot manually resend |
| M4 | Webhook not idempotent for email -- duplicate webhook = duplicate email. | `abroad-jobs/src/pages/api/webhook.ts:56-68` | Duplicate customer emails |
| M5 | D1 backup strategy undocumented. No automated D1 export. | No file exists | Data loss risk |
| M6 | No operational runbooks for incident response. | No file exists | Slow incident resolution |
| M7 | Directus docker-compose uses `service_started` not `service_healthy` for PostgreSQL dependency. | `infra/docker/template/docker-compose.yml:27` | Directus may crash on startup |
| M8 | LoadMore component silently swallows errors with no user feedback. | `abroad-jobs/src/islands/LoadMore.tsx:97-98` | Silent degradation |

### LOW (Fix when convenient)

| # | Issue | File(s) | Impact |
|---|-------|---------|--------|
| L1 | Backup script does not verify backup integrity after S3 upload. | `infra/backups/pg_backup.sh` | Corrupted backups go unnoticed |
| L2 | Import dedup check + insert not atomic. Theoretical duplicate under concurrent imports. | `abroad-jobs/src/lib/import-jobs.ts:140-180` | Duplicate imported jobs |
| L3 | Success page polls via manual "Refresh" link instead of auto-polling. | `abroad-jobs/src/pages/success.astro:73-76` | Poor UX for webhook delay |
| L4 | `IMPORT_SECRET` auth is optional -- if unset, endpoint is public. | `abroad-jobs/src/pages/api/import.ts:19-21` | Unauthorized import triggers |

---

## Recommended Resilience Improvements

### Priority 1: Authentication Fallback (fixes C1)

**Add session caching to admin middleware with emergency bypass:**

```typescript
// middleware.ts - add short-lived session cache
const sessionCache = new Map<string, { user: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute cache

// In the middleware:
const cacheKey = cookieHeader; // or extract session token
const cached = sessionCache.get(cacheKey);
if (cached && cached.expiresAt > Date.now()) {
  context.locals.user = cached.user;
  return next();
}

try {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const res = await fetch(`${AUTH_BASE_URL}/api/auth/get-session`, {
    headers: { cookie: cookieHeader },
    signal: controller.signal,
  });
  clearTimeout(timeout);
  // ... validate and cache
  sessionCache.set(cacheKey, { user: data.user, expiresAt: Date.now() + CACHE_TTL_MS });
} catch (err) {
  // If auth service is down but we have a cached session, use it
  if (cached) {
    context.locals.user = cached.user;
    return next();
  }
  // Only redirect to login if no cached session exists
  return context.redirect(loginUrl);
}
```

### Priority 2: Checkout Transaction Safety (fixes C2, C3)

1. Insert all jobs BEFORE creating the Stripe session. If any insert fails, return an error before any money is involved.
2. Add a cleanup cron that deletes orphaned jobs (jobs with `isLive=0` and `createdAt` older than 24 hours with no successful Stripe session).
3. Add webhook retry handling: store the last processed webhook event ID and skip duplicates.

### Priority 3: Install Sentry (fixes C4)

Install `@sentry/cloudflare` for abroad-jobs and `@sentry/node` for the admin UI. Configure DSN via environment variables. Wrap all API routes with Sentry error capture.

### Priority 4: Add Timeouts to All Fetch Calls (fixes H1)

Create a shared `fetchWithTimeout` utility:

```typescript
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...fetchOptions, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}
```

### Priority 5: Directus Error Handling (fixes H2)

Wrap all Directus SDK calls in try/catch with fallback to empty arrays:

```typescript
export async function getPublishedItems<T>(...) {
  try {
    return await client.request<T[]>(readItems(collection, query));
  } catch (err) {
    console.error(`Directus fetch failed for ${collection}:`, err);
    return [] as T[];
  }
}
```

### Priority 6: Health Check Endpoints (fixes H4)

Add `/health` endpoint to admin that checks: auth service reachability, filesystem access, git availability.
Add a health endpoint to abroad-jobs that checks: D1 connectivity.
Add `HEALTHCHECK` to Dockerfile.
Add `healthcheck` to Docker Compose for PostgreSQL.

### Priority 7: Deploy Pipeline Rollback (fixes H3)

Track each infrastructure step's output and implement compensating actions on failure:

```typescript
// If DNS creation succeeded but Worker domain failed:
if (dnsRecordId) {
  await deleteDnsRecord(dnsRecordId).catch(() => {});
}
```

### Priority 8: Error Pages and Boundaries (fixes M1, M2)

1. Add `abroad-jobs/src/pages/404.astro` and a generic error layout
2. Create a shared `ErrorBoundary` React component in `packages/ui/src/islands/ErrorBoundary.tsx`
3. Wrap all React islands with ErrorBoundary

### Priority 9: Structured Logging (fixes H7, M3)

Replace `console.error` with structured JSON logging that includes request context:

```typescript
console.error(JSON.stringify({
  event: 'email_send_failed',
  sessionId,
  contactEmail: activatedJobs[0]?.contactEmail,
  jobCount: activatedJobs.length,
  timestamp: new Date().toISOString(),
}));
```

### Priority 10: Operational Runbooks (fixes M6)

Create `docs/runbooks/` with:
- `auth-service-outage.md` -- emergency admin access procedure
- `stripe-webhook-failure.md` -- how to manually activate jobs
- `directus-outage.md` -- restart procedure, cache clearing
- `d1-issues.md` -- point-in-time recovery procedure
- `deploy-failure-cleanup.md` -- how to clean up orphaned Workers/DNS

---

## Appendix: Files Reviewed

### API Routes
- `sites/abroad-jobs/src/pages/api/checkout.ts`
- `sites/abroad-jobs/src/pages/api/webhook.ts`
- `sites/abroad-jobs/src/pages/api/jobs.ts`
- `sites/abroad-jobs/src/pages/api/import.ts`
- `sites/abroad-jobs/src/pages/sitemap.xml.ts`
- `sites/admin/src/pages/api/sites/create.ts`
- `sites/admin/src/pages/api/sites/[slug]/redeploy.ts`
- `sites/admin/src/pages/api/sites/[slug]/custom-domain.ts`
- `sites/admin/src/pages/api/sites/[slug]/delete.ts`
- `sites/admin/src/pages/api/sites/[slug]/deploy-status.ts`
- `sites/admin/src/pages/api/sites/[slug]/promote.ts`
- `sites/admin/src/pages/api/sites/[slug]/config.ts`

### Service Integrations
- `packages/utils/src/directus.ts`
- `sites/atelier-kosta/src/lib/directus.ts`
- `sites/abroad-jobs/src/lib/stripe.ts`
- `sites/abroad-jobs/src/lib/email.ts`
- `sites/abroad-jobs/src/lib/db.ts`
- `sites/abroad-jobs/src/lib/import-jobs.ts`
- `sites/admin/src/lib/cloudflare.ts`
- `sites/admin/src/lib/deploy.ts`
- `sites/admin/src/lib/build.ts`

### Middleware & Auth
- `sites/admin/src/middleware.ts`
- `sites/admin/src/lib/env.ts`
- `sites/admin/src/pages/login.astro`

### Infrastructure
- `Dockerfile`
- `docker-entrypoint.sh`
- `infra/admin/deploy.yml`
- `infra/docker/template/docker-compose.yml`
- `infra/kamal.yml`
- `infra/backups/pg_backup.sh`
- `infra/backups/restore.sh`

### Client-side Components
- `packages/ui/src/islands/ContactForm.tsx`
- `sites/abroad-jobs/src/islands/JobPostForm.tsx`
- `sites/abroad-jobs/src/islands/LoadMore.tsx`

### Pages
- `sites/abroad-jobs/src/pages/index.astro`
- `sites/abroad-jobs/src/pages/jobs/[slug].astro`
- `sites/abroad-jobs/src/pages/success.astro`
- `sites/atelier-kosta/src/pages/index.astro`
- `sites/atelier-kosta/src/pages/projects/index.astro`
- `sites/atelier-kosta/src/pages/projects/[slug].astro`
- `sites/atelier-kosta/src/pages/404.astro`

### CI/CD
- `.github/workflows/deploy-site.yml`
- `.github/workflows/test.yml`
