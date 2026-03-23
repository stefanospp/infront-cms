# API & Integrations Architecture Review

**Date:** 2026-03-23
**Scope:** All API routes, third-party integrations, and data flow across the infront-cms monorepo
**Reviewer:** Claude Opus 4.6

---

## Executive Summary

The platform integrates with Cloudflare (Workers, DNS, D1), Stripe (payments), Resend (email), Directus (CMS), and external job board APIs (Arbeitnow, Remotive). The codebase demonstrates competent fundamentals -- zod validation is present on most endpoints, the Stripe webhook correctly verifies signatures, and the admin middleware delegates authentication to a central auth service. However, the review uncovered **4 critical**, **8 high**, **11 medium**, and **6 low** severity issues across API design, security, reliability, and integration patterns. The most serious concerns are: a potential SQL injection vector in the FTS search query, missing rate limiting across all API routes, absence of retry/timeout logic on external API calls, and an import endpoint that is open when the secret is not configured.

---

## Integration Architecture Overview

```
                                  +-------------------+
                                  |   Central Auth    |
                                  | (auth.infront.cy) |
                                  +--------+----------+
                                           |
                                           | session validation
                                           v
+------------------+    Cloudflare    +-----------+    Cloudflare     +------------------+
|   Site Visitors  | <--- Workers --> | Admin UI  | --- API --------> |  Cloudflare API  |
+------------------+                  |  (SSR)    |                   |  (Workers, DNS)  |
                                      +-----------+                   +------------------+
                                           |
                                           | file system ops
                                           v
                                      +----------+
                                      | Monorepo |
                                      | (sites/) |
                                      +----------+

+------------------+    Stripe     +------------------+    D1      +------------------+
|   Employers      | -- Checkout-> | AbroadJobs       | ---------> | Cloudflare D1    |
+------------------+               | (abroad-jobs)    |            | (SQLite + FTS5)  |
                                   +------------------+            +------------------+
                                        |         |
                                        |         +--- Resend (confirmation emails)
                                        |
                                   Stripe Webhook
                                   (activates jobs)

+------------------+                +------------------+
|  Arbeitnow API   | --import--->  |  Import worker   |
|  Remotive API    |               |  (cron trigger)  |
+------------------+               +------------------+

+------------------+    Directus   +------------------+
|  CMS Clients     | -- REST ---> |  Directus        |
|  (template sites)|              |  (Docker/Hetzner)|
+------------------+              +------------------+
```

---

## Issues Found

### CRITICAL

#### C1. SQL Injection Risk in FTS Search Query

**File:** `sites/abroad-jobs/src/pages/api/jobs.ts`, lines 35-67
**Integration:** Cloudflare D1
**Description:** The FTS query sanitization only strips single and double quotes but does not protect against FTS5 injection. SQLite FTS5 has its own query syntax where operators like `AND`, `OR`, `NOT`, `NEAR`, `*`, column filters (`column:term`), and prefix queries can be injected. An attacker could craft queries that cause excessive computation or extract information about the FTS index structure.

```typescript
const ftsQuery = q.replace(/['"]/g, '').trim(); // Line 35 -- insufficient
```

**Risk:** An attacker can inject FTS5 operators to cause denial of service (expensive queries) or manipulate search results.

**Recommended fix:**
```typescript
// Escape FTS5 special characters and wrap each term in double quotes
function sanitizeFtsQuery(raw: string): string {
  return raw
    .replace(/['"]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `"${term.replace(/"/g, '')}"`)
    .join(' ');
}
```

---

#### C2. Import Endpoint Open Without Secret

**File:** `sites/abroad-jobs/src/pages/api/import.ts`, lines 19-21
**Integration:** Arbeitnow API, Remotive API, Cloudflare D1
**Description:** When `IMPORT_SECRET` is not set, the import endpoint allows unauthenticated access. The comment says "for initial testing" but this is a production codebase. An attacker can trigger unlimited imports, flooding the database with external job data and consuming D1 read/write quota.

```typescript
// If IMPORT_SECRET is set, require it. If not set, allow (for initial testing).
if (expected && authHeader !== `Bearer ${expected}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Risk:** Unauthenticated database writes, D1 quota exhaustion, content pollution.

**Recommended fix:**
```typescript
if (!expected) {
  return new Response('IMPORT_SECRET not configured', { status: 503 });
}
if (authHeader !== `Bearer ${expected}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

#### C3. No Rate Limiting on Any API Route

**File:** All files under `sites/*/src/pages/api/`
**Integration:** All
**Description:** There is zero rate limiting across the entire platform. The CLAUDE.md states "API routes: rate limiting, input validation (zod), CORS restricted to site origin" but rate limiting is not implemented anywhere. This exposes:

- **Checkout endpoint** (`/api/checkout`): An attacker can create thousands of pending jobs and Stripe sessions.
- **Jobs search** (`/api/jobs`): Unlimited queries against D1/FTS5.
- **Import endpoint** (`/api/import`): Even with a secret, no rate limit on how often it can be triggered.
- **Admin API routes**: No throttling on site creation, redeploy, or deletion.

**Risk:** Denial of service, cost amplification (Stripe API calls, D1 operations, Cloudflare API calls), resource exhaustion.

**Recommended fix:** For Cloudflare Workers (abroad-jobs), use Cloudflare's Rate Limiting rules or implement a token-bucket algorithm backed by D1 or KV. For the admin (Node.js SSR), add middleware-level rate limiting (e.g., `express-rate-limit` equivalent or a custom in-memory store, since admin is single-instance).

---

#### C4. Checkout Creates DB Records Before Payment

**File:** `sites/abroad-jobs/src/pages/api/checkout.ts`, lines 53-74
**Integration:** Stripe, Cloudflare D1
**Description:** The checkout endpoint inserts job records into D1 before the user has paid. While jobs are created with `isLive: 0`, an attacker can repeatedly call the checkout endpoint to fill the database with pending records that never get paid. There is no cleanup mechanism for abandoned checkout sessions.

```typescript
const session = await stripe.checkout.sessions.create(sessionParams);

// Insert pending jobs with the session ID
for (const input of jobInputs) { // No limit enforcement beyond zod max(50)
  await db.insert(jobs).values({ ... isLive: 0, ... });
}
```

**Risk:** Database bloat, storage cost increase, potential slug exhaustion. With `max(50)` jobs per request and no rate limit, an attacker can insert 50 records per request indefinitely.

**Recommended fix:**
1. Add rate limiting per IP (e.g., max 5 checkout attempts per hour).
2. Add a scheduled job to clean up pending records older than 24 hours where the Stripe session has expired.
3. Consider deferring DB insertion to the webhook handler (create records only after payment succeeds).

---

### HIGH

#### H1. No CORS Configuration on abroad-jobs API Routes

**File:** `sites/abroad-jobs/src/pages/api/checkout.ts`, `jobs.ts`, `webhook.ts`, `import.ts`
**Integration:** Stripe, D1
**Description:** None of the abroad-jobs API routes set CORS headers. The CLAUDE.md mandates "CORS restricted to site origin" but this is not implemented. While the Stripe webhook does not need CORS, the checkout and jobs endpoints are called from the browser and should restrict the `Access-Control-Allow-Origin` header.

**Risk:** Cross-origin requests from malicious sites could invoke the checkout endpoint on behalf of users.

**Recommended fix:** Add CORS headers to browser-facing endpoints:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': url.origin, // or the specific production domain
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

---

#### H2. Stripe Checkout Session Metadata Not Used for Reconciliation

**File:** `sites/abroad-jobs/src/lib/stripe.ts`, lines 32-33; `sites/abroad-jobs/src/pages/api/checkout.ts`, line 45
**Integration:** Stripe
**Description:** The `createCheckoutParams` function accepts a `sessionId` parameter and puts it in `metadata.session_id`, but the checkout endpoint passes an empty string `''` for this value. Meanwhile, the webhook handler uses `session.id` (the Stripe session ID) to look up jobs -- which works because jobs store `stripeSessionId`. However, the empty metadata field is misleading and suggests incomplete implementation.

```typescript
const sessionParams = createCheckoutParams(jobInputs.length, '', siteUrl); // '' passed as sessionId
```

**Risk:** Low immediate risk since the webhook uses `session.id` correctly, but the unused metadata pattern suggests an abandoned approach that could confuse future maintainers.

**Recommended fix:** Remove the `sessionId` parameter from `createCheckoutParams` since it is not used, or populate it meaningfully:
```typescript
export function createCheckoutParams(
  jobCount: number,
  siteUrl: string,
): Stripe.Checkout.SessionCreateParams {
  // Remove metadata.session_id or use a meaningful value
}
```

---

#### H3. No Idempotency on Stripe Webhook

**File:** `sites/abroad-jobs/src/pages/api/webhook.ts`, lines 33-48
**Integration:** Stripe, D1
**Description:** Stripe may deliver webhook events more than once. The webhook handler does not check whether jobs have already been activated before running the UPDATE query. While the UPDATE is idempotent in its SQL effect (setting `isLive: 1` twice is harmless), the confirmation email will be sent again on every retry.

```typescript
if (event.type === 'checkout.session.completed') {
  // No check if already processed
  await db.update(jobs).set({ isLive: 1, ... }).where(eq(...));
  // Email sent on every delivery
  await sendConfirmationEmail(...);
}
```

**Risk:** Duplicate confirmation emails to customers. Stripe retries failed webhooks up to 3 times over 72 hours.

**Recommended fix:**
```typescript
// Check if already activated
const existing = await db.select().from(jobs)
  .where(eq(jobs.stripeSessionId, sessionId));
const alreadyActivated = existing.some((j) => j.isLive === 1);
if (alreadyActivated) {
  return new Response('Already processed', { status: 200 });
}
```

---

#### H4. Cloudflare API Calls Have No Timeout or Retry Logic

**File:** `sites/admin/src/lib/cloudflare.ts`, lines 12-42
**Integration:** Cloudflare API
**Description:** The `cfFetch` helper uses the global `fetch` with no timeout, no retry logic, and no awareness of Cloudflare API rate limits (1200 requests per 5 minutes). During site creation, multiple Cloudflare API calls are made sequentially (deploy, DNS, custom domain) with no error recovery.

**Risk:** A slow or rate-limited Cloudflare API response will hang the deploy pipeline indefinitely. Network glitches during multi-step operations leave the system in an inconsistent state (e.g., Worker deployed but DNS record not created).

**Recommended fix:**
```typescript
async function cfFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // 30s timeout

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    // ... existing logic
  } finally {
    clearTimeout(timeout);
  }
}
```
Add retry with exponential backoff for 429 (rate limit) and 5xx responses.

---

#### H5. Deploy Metadata Written to Filesystem Without Locking

**File:** `sites/admin/src/lib/deploy.ts`, lines 59-64
**Integration:** Cloudflare API
**Description:** `writeDeployMetadata` uses `fs.writeFile` without any file locking mechanism. If two redeploys are triggered in rapid succession (the race check on lines 15-25 of `redeploy.ts` is not atomic), both could write to `.deploy.json` simultaneously, corrupting the metadata file.

**Risk:** Corrupted deploy metadata leading to inconsistent state, lost deploy status, or failed subsequent operations.

**Recommended fix:** Use `fs.writeFile` with a temp file + rename pattern for atomicity, and add a filesystem-based lock or in-memory mutex for concurrent access protection.

---

#### H6. Error Messages Leak Internal Details

**File:** Multiple admin API routes
**Integration:** All
**Description:** Several API routes return raw `err.message` to the client in 500 responses. This can leak file paths, database details, or stack traces:

- `sites/admin/src/pages/api/sites/create.ts`, line 204: `err instanceof Error ? err.message : 'Internal server error'`
- `sites/admin/src/pages/api/sites/[slug]/custom-domain.ts`, line 53
- `sites/abroad-jobs/src/pages/api/import.ts`, line 31

**Risk:** Information disclosure that aids further attacks.

**Recommended fix:** Log the full error server-side, return a generic message to the client:
```typescript
console.error('Operation failed:', err);
return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
```

---

#### H7. `applyUrl` Not Validated as URL

**File:** `sites/abroad-jobs/src/lib/validation.ts`, line 30
**Integration:** D1, user-facing
**Description:** The `applyUrl` field is validated only as `z.string().min(1).max(500)` but not as a valid URL. This means attackers can submit `javascript:alert(1)` or other malicious URIs that will be rendered as clickable links on the job listing pages.

```typescript
applyUrl: z.string().min(1).max(500), // Should be z.string().url()
```

**Risk:** Stored XSS via malicious `applyUrl` values rendered in `<a href>` elements.

**Recommended fix:**
```typescript
applyUrl: z.string().url().max(500),
```
Additionally, validate that the URL scheme is `http` or `https` only:
```typescript
applyUrl: z.string().url().max(500).refine(
  (url) => url.startsWith('http://') || url.startsWith('https://'),
  'URL must use http or https protocol'
),
```

---

#### H8. Admin API Routes Missing `prerender = false`

**File:** `sites/admin/src/pages/api/sites/index.ts`, `sites/admin/src/pages/api/templates/index.ts`, `sites/admin/src/pages/api/sites/[slug]/deploy-status.ts`, `sites/admin/src/pages/api/sites/[slug]/redeploy.ts`, `sites/admin/src/pages/api/sites/[slug]/custom-domain.ts`, `sites/admin/src/pages/api/sites/[slug]/overrides.ts`
**Integration:** Admin API
**Description:** Several admin API routes do not export `prerender = false`. In Astro 6 with SSR, the behavior depends on the output mode configuration, but the project convention (documented in CLAUDE.md) is that all API routes should explicitly export `prerender = false`. Some routes like `create.ts` and `delete.ts` do have it, but many others lack it, creating inconsistency and potential build-time errors.

**Risk:** Routes may be incorrectly prerendered at build time instead of serving dynamic responses, or cause build failures depending on the Astro output configuration.

**Recommended fix:** Add `export const prerender = false;` to all API route files that lack it.

---

### MEDIUM

#### M1. Directus Client Has No Error Handling or Retry

**File:** `packages/utils/src/directus.ts`, lines 13-66
**Integration:** Directus REST API
**Description:** The Directus client utility functions (`getPublishedItems`, `getItemBySlug`) have no try/catch, no timeout, and no retry logic. If the Directus instance is down or slow, the calling page will fail with an unhandled rejection. The template site's `directus.ts` wrapper returns empty arrays when the client is null (no URL configured), but does not handle runtime errors from the API.

**Risk:** Unhandled errors crash page rendering. No resilience to transient Directus outages.

**Recommended fix:** Add error handling with graceful fallbacks:
```typescript
export async function getPublishedItems<T>(client, collection, options?) {
  try {
    return await client.request<T[]>(readItems(collection, query));
  } catch (err) {
    console.error(`Directus: Failed to fetch ${collection}:`, err);
    return [] as T[];
  }
}
```

---

#### M2. Webhook Endpoint Returns Plain Text Errors

**File:** `sites/abroad-jobs/src/pages/api/webhook.ts`, lines 16, 30-31
**Integration:** Stripe
**Description:** The webhook endpoint returns plain text responses (`'Missing stripe-signature header'`, `'Webhook signature verification failed: ...'`) instead of JSON. While Stripe does not parse the response body, this is inconsistent with all other API routes that return JSON. More importantly, the verification failure message includes the raw error, which could leak information about the signing secret configuration.

**Risk:** Information leakage, inconsistent API response format.

**Recommended fix:** Return JSON responses and sanitize error messages:
```typescript
return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
  status: 400,
  headers: { 'Content-Type': 'application/json' },
});
```

---

#### M3. Import Job Slug Collision Handling is Weak

**File:** `sites/abroad-jobs/src/lib/import-jobs.ts`, lines 219-221
**Integration:** Arbeitnow API, Remotive API, D1
**Description:** When a slug collision is detected, a `Date.now().toString(36).slice(-4)` suffix is appended. This is only 4 characters of base-36, giving ~1.6 million unique values. More critically, if two import runs happen simultaneously, they could generate the same suffix for the same slug, causing an insert failure.

**Risk:** Duplicate slug failures during concurrent imports. The slug format becomes unpredictable with the timestamp suffix.

**Recommended fix:** Use `crypto.randomUUID().slice(0, 8)` or a more robust collision-avoidance strategy.

---

#### M4. No Database Cleanup for Expired Jobs

**File:** `sites/abroad-jobs/src/lib/schema.ts`
**Integration:** D1
**Description:** Jobs have an `expiresAt` field and the search query correctly filters out expired jobs, but there is no cleanup process to delete or archive expired records. Over time, the database will accumulate expired jobs from both paid listings and imported jobs (which have a 30-day expiry).

**Risk:** Database growth, slower queries (even with indexes), increased D1 storage costs.

**Recommended fix:** Add a cleanup step to the cron-triggered import job, or create a separate scheduled task:
```typescript
// Delete expired imported jobs older than 7 days past expiry
await db.prepare(
  'DELETE FROM jobs WHERE expires_at < ? AND source != ?'
).bind(now - 7 * 86400, 'paid').run();
```

---

#### M5. Sequential DB Operations in Checkout

**File:** `sites/abroad-jobs/src/pages/api/checkout.ts`, lines 53-74
**Integration:** D1
**Description:** Jobs are inserted one-by-one in a `for` loop using individual `INSERT` statements. With up to 50 jobs allowed per checkout, this means 50 sequential D1 round-trips. D1 supports batched operations which would be significantly faster.

**Risk:** Slow checkout response time, increased D1 read unit consumption, timeout risk on Workers (30s CPU limit).

**Recommended fix:** Use D1 batch or Drizzle's batch insert:
```typescript
await db.insert(jobs).values(
  jobInputs.map((input) => ({
    slug: uniqueSlug(input.title, input.country),
    // ... all fields
  }))
);
```

---

#### M6. Sequential DB Queries in Import Job

**File:** `sites/abroad-jobs/src/lib/import-jobs.ts`, lines 201-249
**Integration:** D1
**Description:** The import function performs two `SELECT` queries (dedup check + slug check) and one `INSERT` per job, all sequentially. With 100+ jobs from Remotive and 3 pages from Arbeitnow, this could mean 300+ sequential D1 operations.

**Risk:** Import exceeds Workers CPU time limit (especially on the free plan), slow execution, high D1 costs.

**Recommended fix:** Batch the dedup check -- fetch all existing `source_id` values in a single query, then batch the inserts:
```typescript
const existingIds = new Set(
  (await db.prepare('SELECT source_id FROM jobs WHERE source IN (?, ?)').bind('arbeitnow', 'remotive').all())
    .results.map((r) => r.source_id as string)
);
```

---

#### M7. File Upload Lacks Content Validation

**File:** `sites/admin/src/pages/api/sites/[slug]/media.ts`, lines 82-177
**Integration:** Admin file system
**Description:** The media upload endpoint validates file extension and size but does not validate the actual file content. An attacker with admin access could upload a file with a `.jpg` extension that contains HTML/JavaScript (polyglot file), which when served could execute as a web page.

**Risk:** Stored XSS through polyglot files if images are served without proper `Content-Type` headers.

**Recommended fix:** Validate the file's magic bytes match the expected type:
```typescript
const MAGIC_BYTES: Record<string, number[]> = {
  '.jpg': [0xFF, 0xD8, 0xFF],
  '.png': [0x89, 0x50, 0x4E, 0x47],
  '.gif': [0x47, 0x49, 0x46],
  '.webp': [0x52, 0x49, 0x46, 0x46],
};
```

---

#### M8. Auth Session Forwarding May Leak Cookies

**File:** `sites/admin/src/middleware.ts`, lines 22-25
**Integration:** Central Auth Service
**Description:** The middleware forwards the entire `Cookie` header to the auth service. If any other cookies are set on the admin domain (e.g., analytics, third-party), they will all be sent to the auth service.

```typescript
const cookieHeader = context.request.headers.get('cookie') ?? '';
const res = await fetch(`${AUTH_BASE_URL}/api/auth/get-session`, {
  headers: { cookie: cookieHeader },
});
```

**Risk:** Unintended cookie leakage to the auth service. Low severity since auth service is self-hosted, but still a privacy concern.

**Recommended fix:** Extract only the session cookie by name:
```typescript
const sessionCookie = context.cookies.get('better-auth.session_token')?.value;
const res = await fetch(`${AUTH_BASE_URL}/api/auth/get-session`, {
  headers: sessionCookie ? { cookie: `better-auth.session_token=${sessionCookie}` } : {},
});
```

---

#### M9. No Request Size Limits on API Routes

**File:** `sites/abroad-jobs/src/pages/api/checkout.ts`, `sites/admin/src/pages/api/sites/create.ts`
**Integration:** All
**Description:** API routes that parse JSON bodies (`request.json()`) do not enforce a maximum request body size. While Cloudflare Workers has a default 100MB limit, the admin (Node.js) has no such limit. A large JSON payload could consume excessive memory.

**Risk:** Memory exhaustion on the admin server.

**Recommended fix:** Add `Content-Length` checks before parsing:
```typescript
const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
if (contentLength > 1_000_000) { // 1MB max
  return new Response(JSON.stringify({ error: 'Request too large' }), { status: 413 });
}
```

---

#### M10. Wrangler Deploy Exposes Secrets via Environment

**File:** `sites/admin/src/lib/deploy.ts`, lines 74-88
**Integration:** Cloudflare API
**Description:** The wrangler deploy command is spawned with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` injected into the process environment along with all of `globalThis.process.env`. If any other secret is in the process environment, it becomes available to the spawned wrangler process.

```typescript
env: {
  ...globalThis.process?.env, // Spreads ALL env vars
  CLOUDFLARE_API_TOKEN: env('CLOUDFLARE_API_TOKEN') ?? '',
  CLOUDFLARE_ACCOUNT_ID: env('CLOUDFLARE_ACCOUNT_ID') ?? '',
},
```

**Risk:** Secret leakage to child processes. Wrangler could log or transmit environment variables during telemetry.

**Recommended fix:** Explicitly list only required environment variables:
```typescript
env: {
  PATH: process.env.PATH ?? '',
  HOME: process.env.HOME ?? '',
  CLOUDFLARE_API_TOKEN: env('CLOUDFLARE_API_TOKEN') ?? '',
  CLOUDFLARE_ACCOUNT_ID: env('CLOUDFLARE_ACCOUNT_ID') ?? '',
},
```

---

#### M11. Auth Middleware Has No Caching for Session Validation

**File:** `sites/admin/src/middleware.ts`, lines 24-26
**Integration:** Central Auth Service
**Description:** Every single request to the admin (including API calls, asset requests not matched by `PUBLIC_PREFIXES`) makes a `fetch` call to the auth service. For an admin session making multiple API calls, this creates unnecessary latency and load on the auth service.

**Risk:** Increased latency on every admin request. Auth service becomes a single point of failure with no caching layer.

**Recommended fix:** Cache the session validation result for a short period (e.g., 60 seconds) using an in-memory store keyed by the session cookie hash.

---

### LOW

#### L1. Inconsistent Response Format Across API Routes

**File:** Multiple
**Description:** Admin API routes use a local `json()` helper function defined per-file, while abroad-jobs routes construct `new Response(JSON.stringify(...))` inline. The response structure also varies: some return `{ error: 'message' }`, others return `{ error: 'message', details: {...} }`, and the webhook returns plain text. There is no standardized error envelope.

**Recommended fix:** Create a shared response helper:
```typescript
// packages/utils/src/api-response.ts
export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status: number, details?: unknown) {
  return jsonResponse({ error: message, ...(details ? { details } : {}) }, status);
}
```

---

#### L2. No API Versioning Strategy

**File:** All API routes
**Description:** API routes are served under `/api/` with no version prefix. If the job search response format changes, existing clients (the LoadMore island, external integrations) will break.

**Recommended fix:** For external-facing APIs (abroad-jobs), consider versioning: `/api/v1/jobs`. For internal APIs (admin), this is less critical but document the contract.

---

#### L3. Hardcoded `noreply@abroadjobs.eu` Sender

**File:** `sites/abroad-jobs/src/lib/email.ts`, line 19
**Integration:** Resend
**Description:** The sender email is hardcoded. If the domain or brand changes, this must be updated in code.

**Recommended fix:** Move to a configuration value or environment variable.

---

#### L4. Missing `Cache-Control` Headers on Admin API Responses

**File:** All admin API routes
**Description:** Admin API responses do not set `Cache-Control` headers. While the middleware-authenticated responses are unlikely to be cached by CDNs, explicit `Cache-Control: no-store` prevents any intermediate caching of sensitive admin data.

**Recommended fix:** Add `'Cache-Control': 'no-store'` to all admin API responses.

---

#### L5. `getVersionHistory` Makes N+1 Git Queries

**File:** `sites/admin/src/lib/versioning.ts`, lines 96-153
**Description:** For each commit in the log (up to 20 by default), a separate `git diff-tree` command is executed to count changed files. This is an N+1 query pattern.

**Recommended fix:** Use `--stat` or `--numstat` in the initial `git log` command to get file counts in a single invocation:
```typescript
'--format=%H|%h|%s|%an|%aI',
'--numstat',
```

---

#### L6. Env Helper Reads .env with Synchronous I/O on First Access

**File:** `sites/admin/src/lib/env.ts`, lines 5-43
**Description:** The `loadEnv` function uses `readFileSync` which blocks the Node.js event loop. While this only happens once (due to caching), it blocks during the first request to the admin server.

**Recommended fix:** Use async file reading during server startup, or accept the one-time blocking cost with a comment explaining the trade-off.

---

## Data Flow Concerns

### Single Points of Failure

1. **Auth service (`auth.infront.cy`)**: If this service is down, the entire admin UI is inaccessible. No fallback authentication exists. Every request requires a live connection to the auth service.

2. **Filesystem-based deploy metadata**: All deploy state is stored in `.deploy.json` files within the monorepo. If the Docker volume is lost, all deploy metadata is gone. There is no backup or external state store.

3. **D1 database for abroad-jobs**: All job data lives in a single D1 database with no replication strategy documented. D1 is eventually consistent; during writes, brief inconsistencies may occur.

### Race Conditions

1. **Concurrent deploys**: The redeploy endpoint checks `meta.status` before starting, but the check-then-act is not atomic. Two near-simultaneous requests could both pass the check.

2. **Concurrent site config edits**: Two admin users editing `site.config.ts` simultaneously will overwrite each other's changes (last-write-wins, no optimistic locking).

3. **Import job overlap**: If the cron trigger fires while a previous import is still running, two import processes will run concurrently, potentially inserting duplicate jobs (the source_id dedup helps but slug collisions become more likely).

### Data Integrity

1. **Checkout-to-webhook flow**: Jobs are created in `checkout.ts` and activated in `webhook.ts`. If the webhook fails (Resend error, network issue), jobs remain pending but the customer has paid. There is no admin interface to manually activate jobs or refund.

2. **Site deletion**: The delete endpoint makes best-effort cleanup of Cloudflare resources (Worker, DNS, custom domain). If any step fails, orphaned resources remain on Cloudflare with no reconciliation process.

---

## Recommendations (Prioritized)

### Immediate (before next deployment)

1. **Fix the FTS query sanitization** (C1) -- Wrap search terms in double quotes to prevent FTS5 operator injection.
2. **Require IMPORT_SECRET** (C2) -- Never allow unauthenticated access to the import endpoint.
3. **Validate `applyUrl` as a URL** (H7) -- Prevent stored XSS via malicious URIs.
4. **Add idempotency to the Stripe webhook** (H3) -- Check if already processed before sending emails.

### Short-term (within 2 weeks)

5. **Implement rate limiting** (C3) -- Start with per-IP limits on checkout (5/hour) and jobs search (60/minute). Use Cloudflare Rate Limiting rules for Workers.
6. **Add abandoned checkout cleanup** (C4) -- Scheduled task to delete pending jobs older than 24 hours.
7. **Add CORS headers** (H1) -- Restrict checkout and jobs endpoints to the site origin.
8. **Add timeouts to Cloudflare API calls** (H4) -- 30-second timeout with retry for 429/5xx.
9. **Sanitize error messages** (H6) -- Return generic messages to clients, log details server-side.
10. **Add `prerender = false` to all API routes** (H8).

### Medium-term (within 1 month)

11. **Batch D1 operations** (M5, M6) -- Use batch inserts for checkout and import.
12. **Add expired job cleanup** (M4) -- Part of the daily cron job.
13. **Add file content validation for uploads** (M7) -- Magic byte checking.
14. **Cache auth session validation** (M11) -- 60-second in-memory cache.
15. **Restrict env spreading in deploy** (M10) -- Explicitly list required variables.
16. **Standardize API response format** (L1) -- Shared response helpers.

### Long-term (architecture improvements)

17. **Externalize deploy state** -- Move from filesystem `.deploy.json` to a database (D1 or PostgreSQL) for reliability and auditability.
18. **Add a dead-letter queue** -- For failed webhook processing, failed deploys, and failed email sends. Currently failures are logged but not retried.
19. **Add health checks** -- Each integration should have a health check endpoint that monitors connectivity to Stripe, Resend, Cloudflare API, auth service, and Directus.
20. **Add structured logging** -- Replace `console.error` with a structured logging library that includes request IDs, integration names, and timing information.
21. **Document API contracts** -- Create OpenAPI specs for external-facing APIs (jobs, checkout) and internal admin APIs.

---

## Positive Aspects

- **Zod validation is consistently applied** across nearly all write endpoints, with proper error reporting using `safeParse` and `flatten()`.
- **Stripe webhook signature verification** is correctly implemented using `constructEventAsync`.
- **Path traversal protection** is present in the media upload and delete endpoints (`path.basename` + startsWith check).
- **Honeypot spam protection** is implemented on the checkout form.
- **Security headers** are configured in `_headers` with a comprehensive CSP that correctly allows Stripe domains.
- **Fire-and-forget deploy pattern** with status polling is well-designed -- the admin UI does not block on slow deploys.
- **Slug validation** using regex patterns is consistently applied across admin routes to prevent injection.
- **Graceful degradation** in the Directus client (returns empty arrays when CMS is not configured).
- **Build process uses `execFile` not `exec`** -- prevents shell injection in the build pipeline.
- **Central auth delegation** via the middleware is clean and avoids duplicating auth logic in the admin.
