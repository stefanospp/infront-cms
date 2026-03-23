# Database & Data Management Review

**Date:** 2026-03-23
**Scope:** Full codebase at `/Users/stefanospetrou/Desktop/Apps/infront-cms`
**Reviewer:** Senior Database Engineer (automated review)

---

## Executive Summary

This platform uses two database systems: **Cloudflare D1** (SQLite) for the AbroadJobs.eu job board site via Drizzle ORM, and **PostgreSQL** via Directus for CMS-powered client sites. The overall architecture is sound for its scale, but this review identified **2 critical**, **5 high**, **8 medium**, and **6 low** severity issues. The most urgent problems are committed production secrets in plaintext `.env` files and a lack of transactional safety in the checkout payment flow, which could result in orphaned charges or lost job postings.

---

## 1. Schema Analysis (Cloudflare D1 / Drizzle)

### 1.1 Schema Design: `sites/abroad-jobs/src/lib/schema.ts`

The schema is a single `jobs` table -- appropriate for the current scale. The Drizzle schema definition is well-structured with proper type annotations and enum constraints.

**Strengths:**
- Appropriate use of `text` with `enum` option for `visa_support` and `relocation_pkg`
- Good index selection for the primary query patterns (live status, country, industry, created_at)
- Unique constraint on `slug` prevents duplicate URLs
- Unix timestamps in integers -- correct for D1/SQLite

**Weaknesses identified below as individual issues.**

### 1.2 FTS5 Setup: `sites/abroad-jobs/drizzle/0000_initial.sql`

The FTS5 virtual table with content-sync triggers is correctly implemented. The `content='jobs'` with `content_rowid='id'` pattern is the standard approach for external-content FTS5 tables. Insert, update, and delete triggers are all present.

### 1.3 Directus Data Model

The template `collections.json` and `meridian-properties/schema-snapshot.yaml` define reasonable collection schemas with proper `status` fields, `sort_order`, and standard CMS patterns.

---

## 2. Issues Found

### CRITICAL

---

#### C1. Production Secrets Committed to Git in Plaintext

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/docker/meridian-properties/.env` (lines 1-8)
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/docker/atelier-kosta/.env` (lines 1-8)

**Description:** Both `.env` files contain real production credentials -- database passwords, Directus admin passwords, application keys, and secrets -- committed directly to Git. The `meridian-properties/.env` contains:
```
DB_PASSWORD=BavotOIuDNsnbKpWga9ObvnE
ADMIN_PASSWORD=TiESEHk47NkfT4Wv!1
KEY=9e6c14d0107b596cd82cb9d720293104df10433f307abacda7770d828e80874d
SECRET=38f4205390223dd4241f4c807ae59c870c23388b5773aff4b3d80b59361479d8
```

**Risk:** Any person or system with read access to this repository can obtain full administrative access to both Directus instances and their underlying PostgreSQL databases. This directly violates the project's own security policy ("No secrets in Git -- everything through Doppler"). Even if the repo is private, this is a credential leak waiting to happen via accidental fork, CI log exposure, or developer machine compromise.

**Recommended Fix:**
1. Immediately rotate all credentials in both `.env` files.
2. Add `infra/docker/*/.env` to `.gitignore`.
3. Remove the files from Git history using `git filter-repo` or BFG Repo-Cleaner.
4. Store secrets in Doppler as documented, and have the deployment pipeline inject them.

---

#### C2. Checkout Flow Lacks Transactional Safety -- Risk of Orphaned Payments or Lost Jobs

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/api/checkout.ts` (lines 50-75)

**Description:** The checkout handler creates a Stripe session first (line 50), then inserts pending jobs in a loop (lines 53-75). There are two failure modes:

1. **Stripe session created but job inserts fail:** If any `db.insert()` call fails after the Stripe session is created, the user is redirected to a Stripe Checkout page. If they pay, the webhook fires, but finds no jobs (or only partial jobs) to activate. The customer is charged with nothing to show for it.

2. **No batch insert / no transaction:** Each job is inserted individually with `await db.insert()`. If the second of three inserts fails, the first job is orphaned in the database as a pending job that can never be activated (wrong `stripeSessionId` or missing sibling jobs). D1 supports transactions via `db.batch()` -- this should be used.

**Risk:** Financial loss, customer disputes, Stripe chargebacks, orphaned database records.

**Recommended Fix:**
```typescript
// Use D1 batch to insert all jobs atomically
const insertStatements = jobInputs.map((input) => {
  const slug = uniqueSlug(input.title, input.country);
  return db.insert(jobs).values({ slug, /* ... */, stripeSessionId: session.id });
});

try {
  await env.DB.batch(insertStatements.map(q => q.toSQL()));
} catch (err) {
  // If inserts fail, we should NOT redirect to Stripe.
  // Optionally expire/cancel the Stripe session.
  return new Response(JSON.stringify({ error: 'Failed to create job listings' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
```
Alternatively, insert jobs first, then create the Stripe session. If Stripe fails, delete the pending jobs. This ordering is safer because uncommitted pending jobs (is_live=0) are harmless, while an unpaid Stripe session auto-expires.

---

### HIGH

---

#### H1. FTS5 Injection via Unsanitised Search Query

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/api/jobs.ts` (lines 35-36)
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/index.astro` (lines 32-33)

**Description:** The FTS5 query sanitisation only strips single and double quotes:
```typescript
const ftsQuery = q.replace(/['"]/g, '').trim();
```
FTS5 supports a rich query syntax including `NEAR`, `AND`, `OR`, `NOT`, column filters (`title:keyword`), and prefix queries (`keyword*`). Operators like `*`, `NEAR`, `NOT`, and parentheses are not stripped. A malicious or accidental query like `"* OR title:password"` or `"NOT anything"` could cause unexpected results or FTS5 query parse errors that crash the request.

**Risk:** Application errors (500 responses), potential information leakage through FTS5 column targeting, denial of service through expensive FTS5 queries.

**Recommended Fix:** Escape all FTS5 special characters or wrap each search term in double quotes to force literal matching:
```typescript
function sanitizeFtsQuery(raw: string): string {
  // Remove FTS5 operators and special chars, keep only alphanumeric and spaces
  const cleaned = raw.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  if (!cleaned) return '';
  // Wrap each word in quotes for literal matching
  return cleaned.split(/\s+/).map(w => `"${w}"`).join(' ');
}
```

---

#### H2. No Index on `source_id` in the Drizzle Schema (Schema/Migration Drift)

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/lib/schema.ts` (lines 40-44)

**Description:** Migration `0003_add_source.sql` creates `idx_jobs_source_id` on the `source_id` column, but the Drizzle schema definition does not declare this index. The Drizzle schema only defines indexes for `is_live`, `country`, `industry`, and `created_at`. This means:

1. If you ever regenerate migrations from the Drizzle schema, the `source_id` index will be lost.
2. The Drizzle schema is not the source of truth -- the SQL migrations are, creating confusion.

Additionally, there is no composite index for the most common query pattern: `WHERE is_live = 1 AND (expires_at IS NULL OR expires_at > ?) ORDER BY created_at DESC`. A composite index `(is_live, expires_at, created_at)` would significantly improve query performance as the dataset grows.

**Risk:** Schema drift, index loss on migration regeneration, suboptimal query performance at scale.

**Recommended Fix:** Add to schema.ts:
```typescript
index('idx_jobs_source_id').on(table.sourceId),
index('idx_jobs_live_expires_created').on(table.isLive, table.expiresAt, table.createdAt),
```

---

#### H3. Import Script Performs N+1 Queries (One Per Job)

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/lib/import-jobs.ts` (lines 201-249)

**Description:** For each imported job (potentially 300+ from Arbeitnow and 100 from Remotive), the script executes:
1. A `SELECT` to check for `source_id` deduplication (line 203-206)
2. A `SELECT` to check for slug collision (line 213-217)
3. An `INSERT` to add the job (line 225-242)

That is up to 1,200 individual D1 queries for 400 jobs. D1 has per-request limits on subrequests and total execution time. This pattern is both slow and likely to hit D1's limits on Cloudflare Workers (1000 subrequests per invocation on the free plan).

**Risk:** Import failures due to D1 subrequest limits, excessive execution time, potential timeout.

**Recommended Fix:** Batch the dedup checks:
```typescript
// Fetch all existing source_ids in one query
const existingSourceIds = new Set(
  (await db.prepare('SELECT source_id FROM jobs WHERE source IS NOT NULL')
    .all()).results?.map(r => r.source_id as string) ?? []
);

// Fetch all existing slugs in one query
const existingSlugs = new Set(
  (await db.prepare('SELECT slug FROM jobs').all()).results?.map(r => r.slug as string) ?? []
);

// Then filter and batch-insert
const toInsert = allMapped.filter(job => !existingSourceIds.has(job.source_id as string));
// Resolve slug collisions in memory
// Use D1 batch() for the inserts
```

---

#### H4. No Expiration Cleanup for Stale Jobs

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/lib/schema.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/wrangler.toml` (line 9)

**Description:** The `wrangler.toml` has a cron trigger (`0 6 * * *`), but there is no handler that cleans up expired jobs. Jobs with `expires_at` in the past are filtered out of queries at read time (`WHERE expires_at IS NULL OR expires_at > ?`), but they remain in the database and in the FTS5 index forever. Over time, this will:
1. Grow the D1 database size (D1 free tier has a 500MB limit)
2. Slow down FTS5 searches (the FTS index includes expired job descriptions)
3. Waste storage

Additionally, pending jobs (is_live = 0) where the customer never completed payment are never cleaned up. These accumulate indefinitely.

**Risk:** Database bloat, degraded search performance, hitting D1 storage limits.

**Recommended Fix:** Add a scheduled handler that:
1. Deletes jobs where `expires_at < now - 30_days` (keep a grace period)
2. Deletes pending jobs where `is_live = 0 AND created_at < now - 7_days` (abandoned checkouts)
3. Runs FTS5 `rebuild` periodically to reclaim space: `INSERT INTO jobs_fts(jobs_fts) VALUES('rebuild')`

---

#### H5. Webhook Does Not Verify Idempotency

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/api/webhook.ts` (lines 33-69)

**Description:** Stripe may deliver the same `checkout.session.completed` event multiple times (retries, network issues). The webhook handler blindly runs `UPDATE ... SET isLive = 1` each time. While the UPDATE itself is idempotent (setting isLive to 1 when it is already 1), the `activatedAt` and `expiresAt` timestamps get overwritten on each retry. This means a retry could reset the expiration date, giving the customer extra free days.

More critically, the confirmation email is sent on every webhook delivery, not just the first one.

**Risk:** Customers receive duplicate emails; expiration dates shift on retries.

**Recommended Fix:**
```typescript
// Only activate jobs that are not yet live
await db
  .update(jobs)
  .set({ isLive: 1, activatedAt: now, expiresAt: now + thirtyDays })
  .where(and(eq(jobs.stripeSessionId, sessionId), eq(jobs.isLive, 0)));

// Check if any rows were actually updated before sending email
const updated = /* check rows affected or query for newly activated */;
if (updated > 0) {
  // Send email only on first activation
}
```

---

### MEDIUM

---

#### M1. Validation Schema Does Not Validate `applyUrl` as a URL

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/lib/validation.ts` (line 30)

**Description:** The `applyUrl` field is validated as `z.string().min(1).max(500)` -- it accepts any string, not a valid URL or mailto link. The job detail page (`[slug].astro` line 43) checks for `mailto:` prefix and renders it as an external link otherwise. Arbitrary strings like `javascript:alert(1)` would pass validation and be rendered as `<a href="javascript:alert(1)">`.

**Risk:** Stored XSS via `javascript:` protocol URLs. While CSP headers mitigate inline script execution, not all browsers handle CSP edge cases identically, and the `connect-src` and `frame-src` directives do not cover navigation-triggered JavaScript URIs.

**Recommended Fix:**
```typescript
applyUrl: z.string().min(1).max(500).refine(
  (val) => {
    if (val.startsWith('mailto:')) return true;
    try { new URL(val); return val.startsWith('http://') || val.startsWith('https://'); }
    catch { return false; }
  },
  { message: 'Must be a valid URL (https://) or mailto: link' }
),
```

---

#### M2. `mapRawJob` Uses Unsafe Type Assertions

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/lib/db.ts` (lines 12-37)

**Description:** The `mapRawJob` function casts every field with `as string`, `as number`, etc. without any runtime validation. If D1 returns an unexpected `null` for a `NOT NULL` column (which can happen due to schema drift or raw SQL inserts that bypass constraints), the function silently produces a malformed `Job` object that will cause runtime errors elsewhere.

**Risk:** Runtime type errors that are hard to trace, silent data corruption in responses.

**Recommended Fix:** Add a lightweight runtime check or use zod to parse raw rows:
```typescript
export function mapRawJob(row: Record<string, unknown>): Job {
  if (!row.id || !row.slug || !row.title) {
    throw new Error(`Invalid job row: missing required fields (id=${row.id})`);
  }
  // ... rest of mapping
}
```

---

#### M3. Slug Collision Resolution Has a Race Condition

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/lib/import-jobs.ts` (lines 213-221)

**Description:** The slug collision check reads from the database, then appends a suffix and inserts. Between the read and write, another concurrent request could insert the same slug. While D1 serialises writes within a single worker, this is still vulnerable if:
1. Two import runs execute simultaneously (e.g., cron trigger overlaps with manual trigger)
2. An import and a checkout happen concurrently

The `UNIQUE` constraint on `slug` in the database will catch this and throw, but the error is caught generically and the job is silently skipped (line 244-248).

Similarly, in `checkout.ts` (line 54), `uniqueSlug()` uses `Date.now().toString(36).slice(-4)` which provides only ~1.6 million unique suffixes and resets over time. Two checkouts submitted at the same millisecond for the same job title and country will produce identical slugs.

**Risk:** Silently dropped jobs during import, potential slug collisions in checkout.

**Recommended Fix:** Use `INSERT ... ON CONFLICT(slug) DO NOTHING` with a retry loop that generates a new slug, or use a UUID-based slug suffix instead of timestamp-based:
```typescript
export function uniqueSlug(title: string, country: string): string {
  const base = slugify(title, country);
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${base}-${suffix}`;
}
```

---

#### M4. Duplicated Query Logic Between `index.astro` and `api/jobs.ts`

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/index.astro` (lines 30-91)
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/api/jobs.ts` (lines 32-84)

**Description:** The FTS5 search query and standard filtered query are implemented independently in both files with near-identical logic. This violates DRY and means any bug fix or query optimization must be applied in two places. They already differ slightly: `index.astro` also runs a `COUNT(*)` query, while `api/jobs.ts` does not.

**Risk:** Divergent query behaviour, double maintenance burden, inconsistent results between SSR page and API.

**Recommended Fix:** Extract the query logic into a shared function in `src/lib/db.ts`:
```typescript
export async function searchJobs(db: Database, d1: D1Database, params: SearchParams): Promise<{
  jobs: Job[];
  total: number;
  hasMore: boolean;
}> { /* shared implementation */ }
```

---

#### M5. PostgreSQL Docker Containers Lack Health Checks

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/docker/template/docker-compose.yml` (lines 30-37)
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/docker/meridian-properties/docker-compose.yml` (lines 30-37)

**Description:** The PostgreSQL service uses `condition: service_started` for the Directus dependency. This means Directus starts as soon as the PostgreSQL container starts, not when the database is actually ready to accept connections. PostgreSQL can take several seconds to initialise, especially on first run. Directus will crash-loop until PostgreSQL is ready, relying on `restart: unless-stopped` to eventually succeed.

**Risk:** Unreliable startups, crash-loops in Docker logs, delayed availability after deployment.

**Recommended Fix:**
```yaml
database:
  image: postgis/postgis:16-3.4
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
    interval: 5s
    timeout: 5s
    retries: 10
  # ...

directus:
  depends_on:
    database:
      condition: service_healthy
```

---

#### M6. Backup Script Does Not Verify Backup Integrity

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/backups/pg_backup.sh` (lines 30-33)

**Description:** The backup script pipes `pg_dump` through `gzip` and uploads to S3, but never verifies:
1. That the dump completed successfully (a partial dump still produces a gzip file)
2. That the gzip file is valid
3. That the S3 upload matched the local file (checksum verification)

If `pg_dump` fails mid-stream (e.g., out of disk space, database crash), the script will upload a truncated, corrupt backup file and report success.

**Risk:** Corrupt backups discovered only during a disaster recovery attempt.

**Recommended Fix:**
```bash
pg_dump -U postgres "${DB_NAME}" > "${DUMP_FILE%.gz}"
if [ $? -ne 0 ]; then
  echo "[$(date)] ERROR: pg_dump failed for ${DB_NAME}"
  rm -f "${DUMP_FILE%.gz}"
  continue
fi
gzip "${DUMP_FILE%.gz}"
# Verify gzip integrity
gzip -t "${DUMP_FILE}" || { echo "ERROR: corrupt gzip"; continue; }
```

---

#### M7. No D1 Backup Strategy

**Description:** The `infra/backups/` directory has scripts for PostgreSQL and Directus uploads, but there is no backup strategy for the Cloudflare D1 database used by AbroadJobs.eu. D1 provides automatic backups, but Cloudflare's retention and recovery guarantees should not be the only strategy for a production revenue-generating database.

**Risk:** Data loss if D1 automatic backups fail or are insufficient.

**Recommended Fix:** Add a scheduled job (via the existing cron trigger) that exports critical data:
```typescript
// Export live jobs as JSON to R2 or external storage
const allJobs = await db.prepare('SELECT * FROM jobs WHERE is_live = 1').all();
await env.BACKUP_BUCKET.put(`jobs-${Date.now()}.json`, JSON.stringify(allJobs.results));
```
Alternatively, use `wrangler d1 export` in CI/CD.

---

#### M8. Restore Script Does Not Drop/Recreate Database Before Restore

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/backups/restore.sh` (lines 58-63)

**Description:** The database restore runs `gunzip -c | psql` directly against the existing database. If the database has tables or data that conflict with the backup, the restore will produce errors (e.g., duplicate key violations). A proper restore should drop and recreate the database first.

**Risk:** Failed or partial restores.

**Recommended Fix:** Add a `--clean` flag or drop/recreate:
```bash
echo "[$(date)] Dropping and recreating database '${DB_NAME}'..."
psql -h "${DB_HOST}" -U postgres -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";"
psql -h "${DB_HOST}" -U postgres -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";"
gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}"
```

---

### LOW

---

#### L1. `isLive` Uses Integer Instead of SQLite Boolean Convention

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/lib/schema.ts` (line 29)

**Description:** SQLite does not have a native boolean type, so using `INTEGER` with 0/1 is standard. However, the Drizzle schema uses `integer('is_live')` rather than Drizzle's `integer('is_live', { mode: 'boolean' })` which would provide TypeScript-level boolean typing and automatic 0/1 conversion.

**Risk:** Minor type confusion -- `isLive` is typed as `number` rather than `boolean` throughout the codebase.

**Recommended Fix:** Change to `integer('is_live', { mode: 'boolean' })` and update comparisons from `eq(jobs.isLive, 1)` to `eq(jobs.isLive, true)`.

---

#### L2. Seed Data Has Hardcoded Expiration Timestamps

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/drizzle/0001_seed.sql` (lines 3-31)

**Description:** The seed data uses fixed `expires_at` values (e.g., `1774136000` which is approximately 2026-03-19). These seeds will appear expired in development environments after that date.

**Risk:** Dev environment shows no jobs, causing confusion.

**Recommended Fix:** Use very large expiration timestamps (e.g., year 2099) for seed data, or create a seed script that computes `expires_at` relative to `now()`.

---

#### L3. `country` Field Is Free-Text, Not Normalised

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/lib/schema.ts` (line 16)

**Description:** The `country` column is free text. The import script produces values like "Germany", "Remote", or raw location strings. The validation schema allows any string up to 100 characters. This means the same country can appear as "UAE", "United Arab Emirates", "Uae", etc. The `idx_jobs_country` index and country filter will treat these as different values.

**Risk:** Fragmented filter results, inconsistent data, poor user experience.

**Recommended Fix:** Normalise country values to a controlled list (e.g., ISO country names). The `countries.ts` file already has a mapping -- use it during import and validation to normalise all country values.

---

#### L4. Migrations Are Not Reversible

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/drizzle/0002_add_company_logo.sql`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/drizzle/0003_add_source.sql`

**Description:** The migration files contain only "up" operations (`ALTER TABLE ADD COLUMN`). There are no corresponding "down" migration files. While SQLite's `ALTER TABLE DROP COLUMN` support is limited, having documented rollback procedures is important.

**Risk:** No ability to roll back a failed migration without manual intervention.

**Recommended Fix:** Add a `down.sql` counterpart for each migration, even if it is just a comment documenting the manual rollback steps. For D1 specifically, consider using Drizzle Kit's migration management which tracks applied migrations.

---

#### L5. Directus `getPublishedItems` Does Not Paginate

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/utils/src/directus.ts` (lines 13-41)

**Description:** The `getPublishedItems` helper passes an optional `limit` but defaults to no limit if not provided. For collections with many items (e.g., a blog with hundreds of posts), this will load all items into memory in a single request.

**Risk:** Memory pressure, slow responses for large collections.

**Recommended Fix:** Add a sensible default limit (e.g., 100) and provide a pagination helper:
```typescript
if (options?.limit != null) {
  query.limit = options.limit;
} else {
  query.limit = 100; // Sensible default
}
```

---

#### L6. `mapRawJob` Defaults `source` to `'paid'` on Null

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/lib/db.ts` (line 34)

**Description:** Line 34 reads `(row.source as string | null) ?? 'paid'`. This means any job inserted before migration `0003_add_source.sql` (which added the `source` column with `DEFAULT 'paid'`) will be correctly defaulted. However, this application-level default masks potential database issues -- if a new insert path is added that forgets to set `source`, it will silently default to `'paid'` in the application layer without any database constraint catching the omission.

**Risk:** Silent data quality issues for future code paths.

**Recommended Fix:** Make the `source` column `NOT NULL` with a default in the schema, and remove the application-level fallback so that missing values surface as errors rather than being silently papered over.

---

## 3. Connection Management Assessment

### D1 (Cloudflare)
D1 connections are handled by the Cloudflare runtime -- each request gets a binding to the D1 database via `env.DB`. The `getDb()` function in `db.ts` creates a new Drizzle wrapper per request, which is correct for the serverless model. There is no connection pool to manage; Cloudflare handles this transparently. **No issues found.**

### Directus (PostgreSQL)
Directus manages its own connection pool internally. The Docker Compose setup does not configure PostgreSQL connection limits or Directus pool settings. For single-client instances with low traffic, this is acceptable. For higher-traffic clients, consider adding `DB_POOL_MIN`, `DB_POOL_MAX` environment variables to the Directus container.

---

## 4. D1 Limitations Assessment

| D1 Limitation | Current Handling | Assessment |
|---|---|---|
| **Row size limit (1MB)** | `description` is capped at 10,000 chars in validation | OK |
| **Database size (500MB free, 5GB paid)** | No cleanup of expired/abandoned jobs | Risk (see H4) |
| **No concurrent writes** | Serialised by Workers runtime | OK for current scale |
| **1000 subrequests/request** | Import does 3 queries per job (~1200 total) | Risk (see H3) |
| **30s CPU time limit** | Import processes 400+ jobs sequentially | Risk of timeout |
| **FTS5 support** | Used correctly with content-sync triggers | OK |
| **No ALTER TABLE DROP COLUMN** | Migrations are additive only | OK |

---

## 5. Data Consistency Assessment

| Scenario | Risk Level | Details |
|---|---|---|
| **Checkout creates Stripe session then inserts jobs** | Critical | See C2 -- partial failure leaves inconsistent state |
| **Webhook retries reset expiration** | High | See H5 -- non-idempotent updates |
| **Import concurrent with checkout** | Medium | Slug collision possible, caught by UNIQUE constraint |
| **FTS5 sync with jobs table** | Low | Triggers handle this correctly |
| **Expired jobs remain in FTS index** | Medium | Degrades search quality over time |

---

## 6. Recommendations (Prioritised)

### Immediate (This Week)

1. **Rotate and remove committed secrets** (C1) -- this is a security emergency
2. **Add transactional safety to checkout** (C2) -- use D1 `batch()` or reorder operations
3. **Sanitise FTS5 queries properly** (H1) -- prevents crashes and potential information leakage

### Short-Term (Next 2 Weeks)

4. **Add webhook idempotency** (H5) -- check `isLive = 0` before updating
5. **Batch import queries** (H3) -- fetch all source_ids/slugs upfront, use batch insert
6. **Add expired job cleanup** (H4) -- implement in cron handler
7. **Validate `applyUrl` as URL** (M1) -- prevent stored XSS

### Medium-Term (Next Month)

8. **Extract shared query logic** (M4) -- DRY up search queries
9. **Add PostgreSQL health checks** (M5) -- improve deployment reliability
10. **Add backup verification** (M6) -- prevent corrupt backups
11. **Add D1 backup strategy** (M7) -- export to R2 or external storage
12. **Normalise country values** (L3) -- use `countries.ts` mapping consistently
13. **Sync Drizzle schema with actual indexes** (H2) -- add missing indexes to schema.ts

### Long-Term

14. **Add database monitoring** -- track D1 database size, query latency, error rates
15. **Add data integrity checks** -- periodic job that validates FTS5 consistency, orphaned records
16. **Consider separating paid vs imported jobs** -- different tables or a more structured `source` system with proper foreign keys for provenance tracking
