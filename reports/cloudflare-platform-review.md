# Cloudflare Platform Review -- infront-cms

**Date:** 2026-03-23
**Reviewer:** Claude (Senior Cloudflare Platform Engineer)
**Scope:** All Cloudflare platform usage across the infront-cms monorepo

---

## Executive Summary

The infront-cms platform deploys Astro sites to Cloudflare Workers (via `wrangler deploy`) with one site (abroad-jobs) using Cloudflare D1 for database storage. The platform currently has 5 sites (template, athena-institute, meridian-properties, atelier-kosta, abroad-jobs), of which 4 are static-only and 1 is a hybrid SSR site with D1.

The review found **3 critical issues**, **5 high-severity issues**, **6 medium issues**, and **4 low-severity items**. The most urgent problems are: (1) the import job script issues sequential D1 queries per job with no batching, risking CPU timeout and subrequest limits; (2) the checkout route issues sequential INSERT statements per job instead of using D1 batch API; and (3) the homepage SSR route executes two separate D1 queries (data + count) that should be batched.

Overall architecture is sound, but D1 query patterns need immediate optimization before the abroad-jobs site sees meaningful traffic.

---

## Current Usage vs Cloudflare Limits

| Resource | Current Usage | Free Tier Limit | Paid Tier Limit | Risk Level |
|---|---|---|---|---|
| **Workers (scripts)** | 5 (1 per site) | 100 | Unlimited | LOW |
| **Workers CPU time** | ~5-15ms per SSR route | 10ms | 30s | HIGH (free tier) |
| **Workers memory** | ~20-40MB estimated | 128MB | 128MB | LOW |
| **Workers subrequests** | Up to ~250+ during import | 50 | 1,000 | CRITICAL (free), HIGH (paid) |
| **D1 databases** | 1 | 10 | 50,000 | LOW |
| **D1 rows read/day** | Varies (est. 10K-50K) | 5M | 50B | LOW |
| **D1 rows written/day** | ~50-200 (import days) | 100K | 50B | LOW |
| **D1 database size** | ~2-5MB estimated | 500MB | 10GB | LOW |
| **D1 max query size** | Within limits | 100KB | 100KB | LOW |
| **Workers Custom Domains** | ~5-10 | Unlimited | Unlimited | LOW |
| **DNS records** | ~5-10 | 3,500/zone | 3,500/zone | LOW |
| **Deploy frequency** | Ad-hoc, ~5-10/month | N/A (Workers) | N/A | LOW |
| **Static asset file count** | ~50-200 per site | 20,000 | 20,000 | LOW |
| **Static asset file size** | <1MB per file | 25MB | 25MB | LOW |
| **Cron triggers** | 1 (abroad-jobs daily) | 5 per Worker | 5 per Worker | LOW |

---

## Issues Found

### CRITICAL

#### C1. Import script issues hundreds of sequential D1 queries with no batching
**File:** `sites/abroad-jobs/src/lib/import-jobs.ts` (lines 117-186)

**Description:** The `importJobs()` function iterates over all fetched Arbeitnow jobs and for each job executes up to 3 sequential D1 queries:
1. `SELECT 1 FROM jobs WHERE source_id = ?` (dedup check, line 140-143)
2. `SELECT 1 FROM jobs WHERE slug = ?` (slug collision check, line 152-155)
3. `INSERT INTO jobs ...` (line 162-180)

With 5 pages of Arbeitnow results (max), this could be 100+ jobs, meaning up to **300 D1 queries in a single Worker invocation**.

**Limits at risk:**
- **Free tier subrequest limit (50):** Each D1 query counts as a subrequest. This WILL fail on free tier.
- **Paid tier subrequest limit (1,000):** At 300 queries, this is within limits but leaves little headroom.
- **CPU time (10ms free, 30s paid):** Sequential queries add latency. On free tier, 10ms CPU budget will be exceeded immediately. On paid tier, 30s wall-clock timeout could be hit with network latency.

**Recommended fix:**
- Pre-fetch all existing `source_id` values in a single query: `SELECT source_id FROM jobs WHERE source LIKE 'arbeitnow:%'`
- Pre-fetch all existing slugs: `SELECT slug FROM jobs`
- Filter in-memory, then use D1 batch API (`db.batch()`) to insert all new jobs in a single batch call
- This reduces queries from ~300 to ~3

```typescript
// Fetch existing source IDs in one query
const existingSourceIds = new Set(
  (await db.prepare('SELECT source_id FROM jobs WHERE source = ?').bind('arbeitnow').all())
    .results?.map(r => r.source_id as string) ?? []
);

const existingSlugs = new Set(
  (await db.prepare('SELECT slug FROM jobs').all())
    .results?.map(r => r.slug as string) ?? []
);

// Filter and prepare batch
const inserts = [];
for (const job of arbeitnowJobs) {
  // ... filtering logic ...
  const sourceId = `arbeitnow:${job.slug}`;
  if (existingSourceIds.has(sourceId)) { skipped++; continue; }
  // ... prepare insert statement ...
  inserts.push(db.prepare('INSERT INTO jobs ...').bind(...));
}

// Single batch call
if (inserts.length > 0) {
  await db.batch(inserts);
}
```

---

#### C2. Checkout route issues sequential INSERTs per job without D1 batch API
**File:** `sites/abroad-jobs/src/pages/api/checkout.ts` (lines 53-75)

**Description:** The checkout handler loops over `jobInputs` (up to 50 per the validation schema) and issues a separate `db.insert()` for each job. The validation schema allows `z.array(jobInputSchema).min(1).max(50)`, meaning a single checkout could issue **50 separate D1 INSERT queries** plus the Stripe API call.

**Limits at risk:**
- **Free tier subrequest limit (50):** 50 DB queries + 1 Stripe API call = 51 subrequests. Exceeds free tier.
- **CPU time:** Sequential queries accumulate.

**Recommended fix:**
Use the D1 batch API or Drizzle's batch insert:

```typescript
const values = jobInputs.map(input => ({
  slug: uniqueSlug(input.title, input.country),
  companyName: input.companyName,
  // ... rest of fields
  stripeSessionId: session.id,
  createdAt: now,
}));

// Use D1 batch API via raw prepared statements
const stmts = values.map(v =>
  env.DB.prepare('INSERT INTO jobs (...) VALUES (?, ?, ...)')
    .bind(v.slug, v.companyName, /* ... */)
);
await env.DB.batch(stmts);
```

---

#### C3. Homepage SSR issues two separate D1 queries that should be batched
**File:** `sites/abroad-jobs/src/pages/index.astro` (lines 30-91)

**Description:** The homepage always executes TWO D1 queries sequentially -- one for the paginated results and one for the total count. These are independent queries that could be executed in a single D1 batch call. On the free tier, every query counts as a subrequest; combining them saves time and budget.

**Limits at risk:**
- **CPU time on free tier (10ms):** Two sequential network round-trips to D1.
- **Subrequest budget:** Unnecessarily doubled.

**Recommended fix:**
For the Drizzle path (non-FTS), use `Promise.all()` or D1 batch. For the raw SQL FTS path, use `env.DB.batch([dataStmt, countStmt])`.

---

### HIGH

#### H1. No D1 `batch()` usage anywhere in the codebase
**Files:** All files under `sites/abroad-jobs/src/`

**Description:** The D1 batch API (`env.DB.batch([stmt1, stmt2, ...])`) is never used. Every D1 interaction is a single sequential query. The D1 batch API executes all statements in a single round-trip, dramatically reducing latency and subrequest count.

**Recommended fix:** Audit every route and batch where possible:
- `checkout.ts`: Batch all job inserts
- `webhook.ts`: Batch the UPDATE + SELECT into one call
- `index.astro`: Batch data query + count query
- `import-jobs.ts`: Batch all inserts

---

#### H2. Free tier CPU time likely exceeded on SSR routes
**Files:** All `prerender = false` routes

**Description:** Cloudflare Workers free tier allows only **10ms CPU time** per invocation. SSR routes that perform D1 queries, Stripe API calls, or Resend API calls will almost certainly exceed this:
- `index.astro`: 2 D1 queries + Astro SSR rendering
- `jobs/[slug].astro`: 1 D1 query + SSR rendering
- `api/checkout.ts`: N D1 queries + 1 Stripe API call
- `api/webhook.ts`: 2 D1 queries + 1 Resend API call

**Limits at risk:** Workers free tier CPU limit (10ms).

**Recommended fix:** The abroad-jobs site MUST be on Workers Paid plan ($5/month). This is non-negotiable for a production site with D1 + Stripe.

---

#### H3. Import cron trigger has no scheduled handler defined
**File:** `sites/abroad-jobs/wrangler.toml` (line 8-9)

**Description:** The `wrangler.toml` defines a cron trigger (`[triggers] crons = ["0 6 * * *"]`), but there is no `scheduled` event handler exported from the Worker entry point. Cloudflare cron triggers invoke the `scheduled()` handler, not an HTTP endpoint. The current setup defines the cron in config but would need a `scheduled` export to actually work.

**Recommended fix:** Either:
1. Add a `scheduled` event handler that calls `importJobs()`, or
2. Remove the cron trigger from `wrangler.toml` and use an external cron service to POST to `/api/import`

---

#### H4. Webhook route has no index on `stripe_session_id`
**File:** `sites/abroad-jobs/drizzle/0000_initial.sql`

**Description:** The webhook route queries `WHERE stripe_session_id = ?` (update + select in `webhook.ts`, lines 41-54), and the checkout route inserts with `stripe_session_id`. However, there is NO index on `stripe_session_id`. As the jobs table grows, these queries will perform full table scans.

**Recommended fix:** Add a migration:
```sql
CREATE INDEX IF NOT EXISTS idx_jobs_stripe_session ON jobs(stripe_session_id);
```

---

#### H5. FTS5 content-sync triggers do not fire for import-jobs raw SQL
**File:** `sites/abroad-jobs/src/lib/import-jobs.ts` (line 162-180)

**Description:** The import script uses raw `db.prepare().bind().run()` for inserts, which correctly fires SQLite triggers. However, this is worth flagging: the FTS5 sync relies on SQLite triggers defined in the initial migration. If anyone switches to Drizzle ORM inserts for the import path, triggers SHOULD still fire because D1 executes SQL server-side. This is currently fine but fragile.

**Recommended fix:** Add a comment in `import-jobs.ts` noting the FTS trigger dependency, or add explicit FTS inserts alongside data inserts.

---

### MEDIUM

#### M1. No caching on job detail pages
**File:** `sites/abroad-jobs/src/pages/jobs/[slug].astro`

**Description:** The job detail page is SSR with no cache headers. Every page view triggers a D1 query. Since job data changes infrequently (only on creation/expiry), these pages are excellent candidates for edge caching.

**Recommended fix:** Add `Cache-Control` headers to the SSR response:
```astro
Astro.response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
```

---

#### M2. API jobs route has very short cache (30s)
**File:** `sites/abroad-jobs/src/pages/api/jobs.ts` (line 92)

**Description:** The jobs API sets `Cache-Control: public, max-age=30`. New jobs only appear when payment completes (rare events) or during the daily import. A 5-minute cache would significantly reduce D1 reads with minimal staleness.

**Recommended fix:** Increase to `max-age=300, stale-while-revalidate=600`.

---

#### M3. Sitemap has no pagination and loads ALL jobs
**File:** `sites/abroad-jobs/src/pages/sitemap.xml.ts`

**Description:** The sitemap route selects ALL live jobs with no limit. At scale (10K+ jobs), this single query could return a very large result set.

**Recommended fix:**
- Add a LIMIT (e.g., 50,000 URLs per sitemap)
- Implement sitemap index with pagination when job count exceeds threshold

---

#### M4. Missing composite indexes for common query patterns
**File:** `sites/abroad-jobs/drizzle/0000_initial.sql`

**Description:** The homepage and API query by `is_live = 1 AND (expires_at IS NULL OR expires_at > ?)` with optional `country` and `industry` filters. Current indexes are single-column.

**Recommended fix:**
```sql
CREATE INDEX IF NOT EXISTS idx_jobs_live_created ON jobs(is_live, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_live_country ON jobs(is_live, country, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_live_industry ON jobs(is_live, industry, created_at DESC);
```

---

#### M5. Static sites missing `nodejs_compat` flag
**Files:** `sites/template/wrangler.toml`, `sites/athena-institute/wrangler.toml`, `sites/meridian-properties/wrangler.toml`, `sites/atelier-kosta/wrangler.toml`

**Description:** These static sites do not include `compatibility_flags = ["nodejs_compat"]`. While not needed for pure static sites, if any later add an API route, the missing flag will cause failures.

**Recommended fix:** Add `compatibility_flags = ["nodejs_compat"]` to all wrangler.toml files for consistency.

---

#### M6. `_headers` CSP missing `connect-src` for flag CDN and Google favicons
**File:** `sites/abroad-jobs/public/_headers`

**Description:** The CSP `img-src` allows `https:` broadly, but `connect-src` only allows `'self' https://api.stripe.com`. Currently fine because flag/favicon images are loaded via `<img>` tags (covered by `img-src`), not `fetch()`. This is informational.

---

### LOW

#### L1. GitHub Actions workflow uses Pages deploy, not Workers deploy
**File:** `.github/workflows/deploy-site.yml` (line 31)

**Description:** The CI workflow uses `wrangler pages deploy` while the admin UI uses `wrangler deploy` (Workers). These are different deployment targets.

**Recommended fix:** Clarify which deployment method is canonical. Document the distinction between Pages (static sites) and Workers (SSR sites).

---

#### L2. `abroad-jobs` wrangler.toml assets directory differs from static sites
**File:** `sites/abroad-jobs/wrangler.toml` (line 6)

**Description:** abroad-jobs uses `directory = "./dist/client"` while static sites use `directory = "./dist"`. This is correct -- the `@astrojs/cloudflare` adapter outputs client assets to `dist/client`. Noting for awareness.

---

#### L3. No rate limiting on import endpoint
**File:** `sites/abroad-jobs/src/pages/api/import.ts`

**Description:** The import endpoint is protected by a Bearer token, but has no rate limiting. If the token is compromised, an attacker could trigger unlimited imports.

**Recommended fix:** Add rate limiting via Cloudflare Rate Limiting rules or a KV-based check.

---

#### L4. IMPORT_SECRET fallback allows unauthenticated access
**File:** `sites/abroad-jobs/src/pages/api/import.ts` (line 19-20)

**Description:** If `IMPORT_SECRET` is not set, the endpoint allows unauthenticated access ("for initial testing"). If accidentally unset in production, anyone can trigger imports.

**Recommended fix:** Always require the secret in production. Remove the fallback.

---

## Cost Projection

### Current State (5 sites, 1 with D1)

| Item | Free Tier | Workers Paid ($5/mo) |
|---|---|---|
| Workers requests | Likely within 100K/day | 10M included |
| D1 reads | Within 5M/day | Within 25B/mo |
| D1 writes | Within 100K/day | Within 50M/mo |
| D1 storage | ~5MB | ~5MB |
| **Monthly cost** | **$0** (if CPU limits not hit) | **$5/month** |

**Verdict:** You need Workers Paid ($5/mo) for the abroad-jobs site due to CPU time limits.

### At 10 Sites (2-3 with D1)

| Item | Estimate |
|---|---|
| Workers Paid | $5/month (covers all Workers) |
| D1 databases | 2-3 databases |
| D1 reads | ~50K-200K/day |
| D1 writes | ~500-2K/day |
| D1 storage | ~20-50MB |
| Custom domains | 10-20 |
| **Monthly cost** | **$5/month** |

### At 50 Sites (10-15 with D1)

| Item | Estimate |
|---|---|
| Workers Paid | $5/month base |
| Workers requests | ~500K-2M/day -- within 10M included |
| D1 databases | 10-15 |
| D1 reads | ~500K-2M/day |
| D1 writes | ~5K-20K/day |
| D1 storage | ~200MB-1GB |
| **Monthly cost** | **$5-15/month** (possible overage on reads) |

### At 100 Sites (20-30 with D1)

| Item | Estimate |
|---|---|
| Workers Paid | $5/month base |
| Workers requests | ~2M-10M/day -- may exceed included |
| D1 databases | 20-30 |
| D1 reads | ~2M-10M/day |
| D1 writes | ~10K-50K/day |
| D1 storage | ~500MB-3GB |
| Excess Workers requests | ~$0.30/M requests over 10M/day |
| Excess D1 reads | ~$0.001/M reads over 25B/mo |
| **Monthly cost** | **$10-30/month** |

### First Limits You Will Hit (in order)

1. **Workers CPU time (free tier)** -- Hit immediately with D1 queries. Requires $5/mo paid plan.
2. **Workers subrequest limit** -- Hit immediately by import job on free tier (50 limit). Paid tier (1,000) gives headroom but still at risk with large imports.
3. **Workers included requests (10M/month on paid)** -- Hit around 30-50 sites with moderate traffic.
4. **D1 row reads (25B/month on paid)** -- Very unlikely to hit unless you have high-traffic sites.

---

## Migration Path: Outgrowing Cloudflare Free/Paid Tier

### Workers Paid ($5/month) -- Recommended Immediately
- 10M requests/month included
- 30s CPU time per request
- 1,000 subrequests per request
- 50 D1 databases
- **What breaks:** Nothing. Strict superset of free tier.

### Workers Paid Overages
- $0.30 per additional 1M requests
- D1: $0.75/M reads beyond 25B, $1.00/M writes beyond 50M
- **What breaks:** Nothing. Auto-scales with billing.

### If You Outgrow D1
- D1 max database size is 10GB (paid). For a job board with 100K+ listings with long descriptions, you could approach this.
- **Migration path:** Move to Cloudflare Hyperdrive + external PostgreSQL (e.g., Neon, Supabase). Drizzle ORM supports PostgreSQL, so schema migration is straightforward. You would need to change `drizzle-orm/d1` to `drizzle-orm/neon-http` or similar.
- **What breaks:** D1-specific SQL (FTS5 virtual tables, SQLite-specific syntax). FTS5 would need to be replaced with PostgreSQL `tsvector` full-text search.

### If You Outgrow Workers
- Workers Unbound pricing covers most use cases up to enterprise scale.
- Alternative: Move SSR to Cloudflare Pages Functions (same underlying Workers, but with framework-specific optimizations).
- **What breaks:** Nothing significant. Both use the same runtime.

---

## Recommendations for Optimization (Prioritized)

### Priority 1: Immediate (Before Production Traffic)

1. **Switch to Workers Paid plan ($5/month)** -- The abroad-jobs site cannot reliably run on free tier due to CPU time limits.
2. **Batch all D1 queries in `import-jobs.ts`** -- Pre-fetch existing IDs in 2 queries, then batch all inserts. Reduces from ~300 queries to ~3.
3. **Batch job inserts in `checkout.ts`** -- Use `env.DB.batch()` for multi-job checkouts.
4. **Batch data+count queries on homepage** -- Use `env.DB.batch()` to execute both in one round-trip.
5. **Add index on `stripe_session_id`** -- Prevents full table scans on webhook/checkout flows.

### Priority 2: Near-Term (Next Sprint)

6. **Add `Cache-Control` headers to job detail pages** -- `s-maxage=300, stale-while-revalidate=3600` would dramatically reduce D1 reads.
7. **Increase API cache from 30s to 300s** -- Jobs change infrequently.
8. **Fix or remove the cron trigger** -- Either implement a `scheduled` handler or remove the unused cron config.
9. **Add composite indexes** -- `(is_live, created_at DESC)` etc. for common query patterns.
10. **Fix IMPORT_SECRET fallback** -- Always require auth in production.

### Priority 3: Scale Preparation (Before 20+ Sites)

11. **Add `nodejs_compat` flag to all wrangler.toml files** -- Future-proofing.
12. **Implement sitemap pagination** -- Before job count exceeds 1,000.
13. **Consider KV for caching** -- Use Workers KV to cache job listings with short TTL (5 min). This would eliminate D1 reads for the most common queries (homepage, popular filters). Cost: KV reads are $0.50/M reads, much cheaper than D1 query overhead.
14. **Consider R2 for company logos** -- If you add logo upload functionality, use R2 ($0.015/GB/month) instead of external URLs.
15. **Batch webhook queries** -- Combine the UPDATE and SELECT in `webhook.ts` into a single `env.DB.batch()` call.

### Priority 4: Documentation

16. **Document the Workers vs Pages deployment difference** -- CI uses `wrangler pages deploy`, admin uses `wrangler deploy`. Clarify which is canonical for each site type.
17. **Add D1 query budget monitoring** -- Use Workers Analytics to track D1 read/write units and set alerts before hitting limits.

---

## KV/R2 Opportunities

### Workers KV (Key-Value Store)
- **Job listing cache:** Cache the homepage query results in KV with a 5-minute TTL. Key = `jobs:${country}:${industry}:${page}`. Invalidate on new job activation (webhook) or import completion. This would reduce D1 reads by 90%+ for read-heavy traffic.
- **Sitemap cache:** Cache the generated sitemap XML in KV with a 1-hour TTL.
- **Cost:** 100K reads/day free, then $0.50/M reads. Very cheap.

### R2 (Object Storage)
- **Company logos:** If you add logo upload to the job posting form, store in R2 instead of external URLs.
- **Sitemap files:** Store pre-generated sitemaps in R2 for very large job counts.
- **Cost:** 10GB free storage, $0.015/GB/month after. 10M reads/month free.

### Not Recommended
- **Durable Objects:** Overkill for this use case. No need for coordinated state.
- **Queues:** Could be useful for decoupling import processing, but adds complexity. Consider only if import volume exceeds what a single Worker invocation can handle.

---

## Custom Domains Configuration Review

**Current approach:** The admin UI uses the Workers Custom Domains API (`/accounts/{id}/workers/domains`) to assign custom domains, with CNAME DNS records pointing to the Workers subdomain.

**Observations:**
- `proxied: false` on DNS records is correct -- avoids Cloudflare error 1014 (CNAME already used).
- Workers Custom Domains handle SSL automatically via Cloudflare's edge certificates.
- No limit on custom domains per Worker (good).
- The `removeWorkerCustomDomain` function correctly looks up the domain ID before deleting.

**Limits:**
- 100 custom domains per zone on free plan, 100+ on paid plans (not a concern at current scale).
- DNS propagation: TTL is set to 300s (5 min), which is appropriate.

**One concern:** The `addWorkerCustomDomain` function uses `method: 'PUT'` which is correct for upsert behavior, but if the domain is already assigned to a different Worker, it will silently reassign. Consider adding a check for existing assignments.

---

## Summary of Files Reviewed

| File | Issues Found |
|---|---|
| `sites/abroad-jobs/wrangler.toml` | H3 (cron without handler) |
| `sites/abroad-jobs/src/lib/import-jobs.ts` | C1 (no batching, subrequest risk) |
| `sites/abroad-jobs/src/pages/api/checkout.ts` | C2 (sequential inserts) |
| `sites/abroad-jobs/src/pages/index.astro` | C3 (unbatched dual queries) |
| `sites/abroad-jobs/src/pages/api/jobs.ts` | M2 (short cache) |
| `sites/abroad-jobs/src/pages/api/webhook.ts` | H4 (missing index) |
| `sites/abroad-jobs/src/pages/api/import.ts` | L3, L4 (no rate limit, auth fallback) |
| `sites/abroad-jobs/src/pages/jobs/[slug].astro` | M1 (no cache headers) |
| `sites/abroad-jobs/src/pages/sitemap.xml.ts` | M3 (no pagination) |
| `sites/abroad-jobs/drizzle/0000_initial.sql` | M4 (missing composite indexes) |
| `sites/abroad-jobs/public/_headers` | M6 (CSP informational) |
| `sites/template/wrangler.toml` | M5 (missing nodejs_compat) |
| `sites/athena-institute/wrangler.toml` | M5 (missing nodejs_compat) |
| `sites/meridian-properties/wrangler.toml` | M5 (missing nodejs_compat) |
| `sites/atelier-kosta/wrangler.toml` | M5 (missing nodejs_compat) |
| `sites/admin/src/lib/deploy.ts` | L1 (Workers vs Pages) |
| `sites/admin/src/lib/cloudflare.ts` | Clean |
| `.github/workflows/deploy-site.yml` | L1 (Pages deploy inconsistency) |
