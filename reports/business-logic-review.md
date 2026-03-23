# Business Logic Review: Infront CMS Platform

**Date:** 2026-03-23
**Scope:** Complete business logic correctness audit of (1) AbroadJobs.eu job board with Stripe payments, (2) Admin/Agency site creation and management platform.
**Reviewer:** Claude Opus 4.6 (1M context)
**Severity Scale:** CRITICAL (will lose money/data) > HIGH (broken user flow) > MEDIUM (degraded experience) > LOW (minor issue)

---

## EXECUTIVE SUMMARY

The platform has two well-structured business flows. The abroad-jobs payment flow is functional end-to-end but has **6 critical issues** that could result in lost revenue, orphaned data, or security vulnerabilities. The admin site creation flow is more mature but has **3 critical issues** around deployment state consistency. There are also **12 high-severity** and **15 medium-severity** issues across both systems.

**Most urgent fixes needed:**
1. No cron handler exists for job imports despite wrangler.toml declaring one
2. No refund/dispute webhook handling -- jobs stay live after refunds
3. applyUrl validation allows javascript: URIs (XSS vector)
4. FTS5 search crashes on special characters (unescaped FTS syntax)
5. Race condition between checkout DB insert and Stripe webhook
6. No job expiration cleanup -- expired jobs accumulate in database forever

---

## PART 1: ABROAD-JOBS JOB BOARD

### 1. JOB POSTING FLOW (Form -> Validation -> Stripe -> Webhook -> Activation)

#### CRITICAL: Race condition between checkout and webhook

**File:** `sites/abroad-jobs/src/pages/api/checkout.ts` (lines 43-75)
**File:** `sites/abroad-jobs/src/pages/api/webhook.ts` (lines 33-48)

The checkout endpoint creates the Stripe session first (line 50), then inserts pending jobs into D1 (lines 53-74). The Stripe webhook fires on `checkout.session.completed` and looks up jobs by `stripeSessionId`. If Stripe processes payment faster than D1 inserts complete (which is plausible with network latency to D1), the webhook will find zero jobs to activate.

The `createCheckoutParams` call on line 45 passes an empty string as `sessionId` to the metadata -- this means the Stripe session metadata contains `session_id: ''`, which is useless for correlation.

**Impact:** Customer pays EUR 89+ but jobs never go live. No retry mechanism exists.

**Fix:** Insert pending jobs first, get their IDs, then create the Stripe session with those IDs in metadata. Or use a unique batch ID generated before both operations.

#### CRITICAL: No refund/dispute webhook handling

**File:** `sites/abroad-jobs/src/pages/api/webhook.ts` (lines 33-73)

The webhook only handles `checkout.session.completed`. There is no handler for:
- `charge.refunded` -- jobs should be deactivated on refund
- `charge.dispute.created` -- Stripe disputes need acknowledgment
- `checkout.session.expired` -- pending jobs should be cleaned up

**Impact:** Refunded customers keep their jobs live for 30 days. Disputes go unhandled, potentially resulting in Stripe account penalties.

#### HIGH: Pending jobs never cleaned up

**File:** `sites/abroad-jobs/src/pages/api/checkout.ts` (lines 53-74)

Jobs are inserted with `isLive: 0` before Stripe checkout. If the user abandons checkout (closes browser, card declined, etc.), these pending jobs remain in the database forever with `isLive: 0` and `stripeSessionId` set but `activatedAt` null.

**Impact:** Database bloat over time. Could also leak information if an admin query accidentally exposes pending jobs.

**Fix:** Add a scheduled cleanup that deletes jobs where `isLive = 0 AND created_at < (now - 24 hours)`.

#### HIGH: Stripe session metadata contains empty session_id

**File:** `sites/abroad-jobs/src/pages/api/checkout.ts` (line 45)

The second argument to `createCheckoutParams` is `sessionId` which is passed as `''`. In `stripe.ts` line 33, this goes into `metadata.session_id`. This metadata is meaningless. The webhook uses `session.id` (Stripe's own ID) to look up jobs, so this empty metadata is technically harmless but confusing and wasteful.

#### MEDIUM: No idempotency protection on webhook

**File:** `sites/abroad-jobs/src/pages/api/webhook.ts`

Stripe can deliver webhooks more than once. If the `checkout.session.completed` event is delivered twice, the UPDATE query runs again but `activatedAt` gets overwritten to the second timestamp and a duplicate confirmation email is sent.

**Fix:** Check if jobs are already live (`isLive = 1`) before updating. Skip email if already activated.

#### MEDIUM: Email sends contact email from first job only

**File:** `sites/abroad-jobs/src/pages/api/webhook.ts` (line 56)

All jobs in a batch share the same `contactEmail`, so this works. But if the schema ever allows different emails per job, only the first job's email receives confirmation.

---

### 2. JOB EXPIRATION

#### CRITICAL: No expiration enforcement mechanism

**File:** `sites/abroad-jobs/wrangler.toml` (line 9)

The wrangler.toml declares a daily cron trigger at 06:00 UTC, but **there is no scheduled event handler anywhere in the codebase**. Cloudflare Workers cron triggers require a `scheduled()` export in the worker, which Astro's Cloudflare adapter does not generate by default.

**Current behavior:** Expired jobs are filtered out at query time via `AND (j.expires_at IS NULL OR j.expires_at > ?)`. This means:
- Expired jobs are correctly hidden from search and listings (GOOD)
- Expired jobs are NOT deleted from the database (data accumulates forever)
- Expired jobs with `expires_at IS NULL` (imported jobs that somehow got null) would show forever
- The sitemap includes expired jobs until they are no longer live
- FTS5 index retains expired job content, wasting storage

**Impact:** No actual breakage for users, but database and FTS index grow without bound. The declared cron trigger does nothing.

**Fix:** Either (a) implement a proper Cloudflare Workers `scheduled()` handler that runs the import AND cleans expired jobs, or (b) use an external cron service to call `POST /api/import`.

#### MEDIUM: Job detail page shows "Something went wrong" for expired jobs

**File:** `sites/abroad-jobs/src/pages/jobs/[slug].astro` (lines 20-34)

When a job expires, visiting its URL redirects to `/` with no explanation. A shared link that worked yesterday silently breaks today. Users get no "this job has expired" message.

---

### 3. SEARCH / FTS5

#### CRITICAL: FTS5 query injection / crash on special characters

**File:** `sites/abroad-jobs/src/pages/api/jobs.ts` (line 35)
**File:** `sites/abroad-jobs/src/pages/index.astro` (line 32)

```typescript
const ftsQuery = q.replace(/['"]/g, '').trim();
```

This only strips single and double quotes. FTS5 has many special syntax characters:
- `*` (prefix matching)
- `NEAR` / `AND` / `OR` / `NOT` (operators)
- `(` and `)` (grouping)
- `^` (column filter)
- `:` (column prefix)

A query like `software AND` or `engineer(` or `NEAR developer` will cause FTS5 to throw a syntax error, resulting in a 500 error to the user.

**Impact:** Any user typing certain characters or words crashes search.

**Fix:** Wrap each term in double quotes to force literal matching:
```typescript
const ftsQuery = q.replace(/['"]/g, '').trim().split(/\s+/).map(t => `"${t}"`).join(' ');
```

#### HIGH: No typo tolerance

FTS5 provides exact word matching only. A search for "developr" or "enginering" returns zero results. There is no fuzzy matching, stemming, or "did you mean" functionality.

#### MEDIUM: Duplicate search logic between index.astro and api/jobs.ts

**File:** `sites/abroad-jobs/src/pages/index.astro` (lines 30-91)
**File:** `sites/abroad-jobs/src/pages/api/jobs.ts` (lines 34-84)

The FTS5 query construction is duplicated in two places. Any fix to one must be manually replicated in the other. This is a maintenance hazard.

---

### 4. PRICING LOGIC

#### MEDIUM: Price hardcoded in two places

**File:** `sites/abroad-jobs/src/lib/stripe.ts` (line 9): `PRICE_PER_JOB_CENTS = 8900`
**File:** `sites/abroad-jobs/src/islands/JobPostForm.tsx` (line 7): `PRICE_PER_JOB = 89`

If the price changes, both files must be updated. The frontend and backend could show different prices if only one is updated.

---

### 5. IMPORT PIPELINE

#### HIGH: Import endpoint has no cron integration

**File:** `sites/abroad-jobs/src/pages/api/import.ts`

The comment says "Can be called by a Cloudflare cron trigger" but:
1. Cloudflare cron triggers call the worker's `scheduled()` handler, not HTTP endpoints
2. There is no `scheduled()` export anywhere
3. The wrangler.toml declares a cron but it does nothing

**Impact:** Job imports never run automatically. They only work if someone manually POSTs to `/api/import`.

#### HIGH: Import auth bypass when IMPORT_SECRET is not set

**File:** `sites/abroad-jobs/src/pages/api/import.ts` (lines 18-20)

If `IMPORT_SECRET` is not configured in environment variables, the endpoint is completely open.

#### MEDIUM: Sequential DB inserts in import (not batched)

**File:** `sites/abroad-jobs/src/lib/import-jobs.ts` (lines 216-297)

Each imported job does two queries (dedup check + insert) sequentially. With 250+ jobs from Arbeitnow, this means 500+ sequential D1 queries per import run.

#### MEDIUM: Dedup race condition on concurrent imports

**File:** `sites/abroad-jobs/src/lib/import-jobs.ts` (lines 159-167)

The dedup check and insert are not atomic. There is **no unique index on `source_id`** -- only on `slug`. Concurrent imports could create duplicate entries.

#### LOW: Landing.jobs company name extraction is fragile

**File:** `sites/abroad-jobs/src/lib/import-jobs.ts` (line 276)

```typescript
company_name: job.title.split(' at ')[1] ?? 'Company',
```

This assumes job titles follow the format "Role at Company". Many titles do not follow this pattern.

#### LOW: `fullCountry` variable is a no-op

**File:** `sites/abroad-jobs/src/lib/import-jobs.ts` (lines 271-272)

The ternary is a no-op -- both branches produce the same value. The `city` variable is extracted but never used.

---

### 6. JOB DATA INTEGRITY & SECURITY

#### CRITICAL: applyUrl allows javascript: URIs (Stored XSS)

**File:** `sites/abroad-jobs/src/lib/validation.ts` (line 30)

```typescript
applyUrl: z.string().min(1).max(500),
```

This accepts ANY string up to 500 characters, including `javascript:alert(document.cookie)`. The job detail page renders this as an `<a href>`.

**Impact:** An attacker pays EUR 89, posts a job with a `javascript:` applyUrl, and executes JavaScript in every visitor's browser when they click "Apply". This is a stored XSS vulnerability.

**Fix:** Validate that applyUrl starts with `https://`, `http://`, or `mailto:`.

#### HIGH: No rate limiting on checkout endpoint

No rate limiting exists. An attacker could spam the endpoint to create thousands of pending jobs and Stripe checkout sessions.

---

## PART 2: ADMIN / AGENCY PLATFORM

### 7. SITE CREATION

#### HIGH: No protection against slug collision with reserved names

**File:** `sites/admin/src/lib/generator.ts` (lines 416-427)

The generator checks if the site directory exists but does not check for reserved names beyond `template` and `admin`. Creating a site with slug `dist`, `src`, `test`, or `build` could cause issues.

**Fix:** Add a blocklist of reserved slugs.

#### MEDIUM: Race condition on concurrent site creation

If two requests try to create the same slug simultaneously, both could pass the `fs.access` check and proceed to copy the template directory.

#### MEDIUM: Template copy includes .git if present

**File:** `sites/admin/src/lib/generator.ts` (lines 442-449)

The copy filter excludes `node_modules` and `dist` but not `.git`, `.deploy.json`, or other hidden files.

---

### 8. SITE DELETION

#### GOOD: Deletion is thorough and well-ordered

The deletion process correctly validates the slug, checks no deploy is in progress, removes cloud resources (best-effort), and deletes the site directory.

#### MEDIUM: No confirmation mechanism

The DELETE endpoint has no confirmation token or two-step process. A single API call permanently destroys a site.

---

### 9. DEPLOY FLOW

#### HIGH: Fire-and-forget deployment loses errors silently

**File:** `sites/admin/src/pages/api/sites/create.ts` (lines 183-185)

If the deployment throws before writing `.deploy.json`, the status stays at "pending" forever. The admin UI polls `deploy-status` and would show "pending" indefinitely.

#### HIGH: Deploy status stuck on failure before metadata write

**File:** `sites/admin/src/lib/deploy.ts` (lines 118-122)

If `writeDeployMetadata` fails (disk full, permissions), the function returns immediately without building. The status remains whatever it was before.

#### MEDIUM: `wranglerDeploy` uses `npx wrangler` without version pinning

A wrangler major version bump could break deploys silently.

---

### 10. CUSTOM DOMAIN

#### MEDIUM: No domain format validation

**File:** `sites/admin/src/pages/api/sites/[slug]/custom-domain.ts` (line 18)

The domain is only checked for being non-empty. No format validation exists.

---

### 11. CROSS-CUTTING CONCERNS

#### MEDIUM: API routes not individually protected

The middleware protects all non-public routes by verifying session with the central auth service. However, all admin API routes share the same auth level. There is no role-based access control.

#### MEDIUM: Hardcoded monorepo root in sites.ts

**File:** `sites/admin/src/lib/sites.ts` (line 19)

`getMonorepoRoot()` returns `'/app'` without checking `process.env.MONOREPO_ROOT`, unlike `generator.ts` which does. Local development would fail to list sites.

---

## SUMMARY OF ALL ISSUES BY SEVERITY

### CRITICAL (6)
| # | Area | Issue |
|---|------|-------|
| 1 | Abroad-Jobs | Race condition: webhook may fire before DB insert completes |
| 2 | Abroad-Jobs | No refund/dispute webhook handling |
| 3 | Abroad-Jobs | applyUrl allows javascript: URIs (stored XSS) |
| 4 | Abroad-Jobs | FTS5 crashes on special characters in search query |
| 5 | Abroad-Jobs | No cron handler exists despite wrangler.toml declaring one |
| 6 | Abroad-Jobs | Expired jobs never cleaned up; no scheduled worker |

### HIGH (12)
| # | Area | Issue |
|---|------|-------|
| 1 | Abroad-Jobs | Pending (abandoned) jobs never cleaned up |
| 2 | Abroad-Jobs | Import auth bypassed when IMPORT_SECRET not set |
| 3 | Abroad-Jobs | Import endpoint has no cron integration |
| 4 | Abroad-Jobs | No rate limiting on checkout endpoint |
| 5 | Abroad-Jobs | No typo tolerance in FTS5 search |
| 6 | Abroad-Jobs | Stripe session metadata contains empty session_id |
| 7 | Admin | Fire-and-forget deployment can leave status stuck |
| 8 | Admin | Deploy status stuck on metadata write failure |
| 9 | Admin | No protection against slug collision with reserved names |
| 10 | Admin | Import has no unique index on source_id (allows duplicates) |
| 11 | Abroad-Jobs | Job detail page silently redirects expired jobs |
| 12 | Admin | Hardcoded monorepo root in sites.ts breaks local dev |

### MEDIUM (15)
| # | Area | Issue |
|---|------|-------|
| 1 | Abroad-Jobs | No webhook idempotency protection |
| 2 | Abroad-Jobs | Duplicate search logic in index.astro and api/jobs.ts |
| 3 | Abroad-Jobs | Price hardcoded in two separate files |
| 4 | Abroad-Jobs | Country is free-text with no normalization |
| 5 | Abroad-Jobs | No CSRF protection on POST endpoints |
| 6 | Abroad-Jobs | Sequential DB inserts in import (not batched) |
| 7 | Abroad-Jobs | Import dedup race condition |
| 8 | Admin | Race condition on concurrent site creation |
| 9 | Admin | Template copy includes .git and hidden files |
| 10 | Admin | Deletion does not clean pnpm workspaces |
| 11 | Admin | No deletion confirmation mechanism |
| 12 | Admin | wrangler version not pinned in deploy |
| 13 | Admin | Build timeout may be insufficient |
| 14 | Admin | Custom domain has no format validation |
| 15 | Admin | Generated sites use static output only |

### LOW (8)
| # | Area | Issue |
|---|------|-------|
| 1 | Abroad-Jobs | No bulk pricing discount |
| 2 | Abroad-Jobs | Large page offsets cause slow queries |
| 3 | Abroad-Jobs | Industry filter not validated against enum |
| 4 | Abroad-Jobs | Landing.jobs company name extraction fragile |
| 5 | Abroad-Jobs | fullCountry variable is a no-op |
| 6 | Admin | Non-wizard sites not protected from deletion |
| 7 | Admin | No duplicate domain check |
| 8 | Admin | Color values not validated despite validator existing |

---

## RECOMMENDED FIX PRIORITY

**Week 1 (Critical - do immediately):**
1. Fix applyUrl validation to block javascript:/data: URIs
2. Fix FTS5 query sanitization to escape all special characters
3. Reorder checkout to insert jobs before creating Stripe session
4. Add `charge.refunded` and `charge.dispute.created` webhook handlers
5. Implement scheduled worker or external cron for imports + cleanup

**Week 2 (High - do soon):**
6. Add unique index on `source_id` column
7. Add webhook idempotency check
8. Add rate limiting to checkout endpoint
9. Add pending job cleanup (delete after 24h if not activated)
10. Fix deploy error handling to always write final status

**Week 3 (Medium - do when convenient):**
11. Extract search logic into shared function
12. Normalize country names on insert
13. Add domain format validation for custom domains
14. Add reserved slug blocklist
15. Pin wrangler version in deploy scripts

---

## POSITIVE ASPECTS

1. **Solid validation layer:** Zod schemas are well-structured with appropriate min/max constraints
2. **Good pagination:** The `limit + 1` pattern for hasMore is correctly implemented with no off-by-one errors
3. **Proper webhook signature verification:** Stripe webhooks are correctly verified before processing
4. **Thorough site deletion:** Best-effort cleanup with warning accumulation is a good pattern
5. **Honeypot spam protection:** Present on the job posting form
6. **Security headers:** CSP, HSTS, X-Frame-Options properly configured
7. **XSS-safe templating:** Astro's auto-escaping prevents XSS in rendered content
8. **FTS5 triggers:** Properly keep the search index in sync with the jobs table
9. **Clean separation:** Business logic is well-organized into lib/ modules
10. **Deploy state machine:** The status progression (pending -> building -> deploying -> live/failed) with JSON metadata is a clean design
