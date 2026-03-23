# Resource & Cost Management Review

**Date:** 2026-03-23
**Scope:** All infrastructure, hosting, and service costs across the infront-cms platform
**Reviewer:** Claude Code audit

---

## Executive Summary

This platform runs a solo web agency with 4 client sites (3 static Cloudflare Pages + 1 hybrid SSR), 2 Directus CMS instances on Hetzner, 1 admin dashboard, and 1 job board (abroad-jobs) with Stripe payments. The architecture is cost-efficient by design -- static sites on Cloudflare's free tier, shared VPS for CMS -- but has **zero billing infrastructure, zero resource monitoring, zero budget alerts, and no per-client cost tracking**. The Stripe integration handles one-time payments only with no refund handling, no failed payment recovery, and no revenue dashboards. Docker containers run without memory/CPU limits, creating risk as CMS clients scale. The estimated monthly cost for the current setup is EUR 15-25/month, which is excellent, but there is no infrastructure to track margins or bill clients automatically.

---

## 1. Service Inventory

| Service | Component | Tier | Est. Monthly Cost | Free Tier Limits | Current Usage Est. |
|---------|-----------|------|-------------------|------------------|--------------------|
| **Cloudflare Pages** | 4 static sites + abroad-jobs | Free | $0 | 500 builds/mo, 1 build at a time | ~20-30 builds/mo |
| **Cloudflare D1** | abroad-jobs database | Free | $0 | 5M reads/day, 100K writes/day, 5GB storage | Low (early stage) |
| **Cloudflare Workers** | abroad-jobs SSR + cron | Free | $0 | 100K req/day, 10ms CPU/req | Low |
| **Hetzner VPS** | Admin + 2 Directus + PostgreSQL | CX22 (est.) | ~EUR 5-8 | N/A (paid) | 2 Directus + 2 PG + admin container |
| **Cloudflare Tunnel** | Admin access | Free | $0 | Unlimited | 1 tunnel |
| **GitHub Actions** | CI/CD (3 workflows) | Free | $0 | 2000 min/mo (free tier) | ~200-400 min/mo |
| **Stripe** | abroad-jobs payments | Standard | 1.5% + EUR 0.25/txn | N/A | Low volume |
| **Resend** | Confirmation emails | Free | $0 | 100 emails/day, 3000/mo | Very low |
| **Doppler** | Secrets management | Developer (free) | $0 | 5 projects, unlimited secrets | 1-3 projects |
| **Betterstack** | Uptime monitoring | Free | $0 | 5 monitors | Unknown |
| **Sentry** | Error tracking | Developer (free) | $0 | 5K events/mo | Unknown |
| **AWS S3** | Backups | Usage-based | ~$0.50-2 | N/A | DB dumps + uploads |
| **BetterAuth** | Central SSO at auth.infront.cy | Self-hosted | $0 | N/A | 1 user (admin) |

**Estimated Total Monthly Cost: EUR 15-25/month** (Hetzner VPS dominates)

---

## 2. Issues Found

### CRITICAL Issues

#### C1: No Docker Resource Limits on Shared VPS
**Files:** `infra/docker/meridian-properties/docker-compose.yml`, `infra/docker/atelier-kosta/docker-compose.yml`

**Description:** All Docker Compose files for Directus instances have zero `mem_limit`, `cpus`, `deploy.resources`, or any resource constraints. Two Directus instances + two PostgreSQL containers + the admin container all share one Hetzner VPS with no isolation. A single runaway PostgreSQL query or Directus memory leak will crash every service on the box.

**Cost Impact:** Total platform outage = lost client revenue + reputation damage. No way to diagnose which client is consuming resources.

**Recommended Fix:** Add resource limits to every docker-compose.yml:
```yaml
services:
  directus:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
  database:
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.5'
```

#### C2: No Stripe Refund or Dispute Handling
**Files:** `sites/abroad-jobs/src/pages/api/webhook.ts`

**Description:** The webhook handler only processes `checkout.session.completed`. There is no handling for `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`, `payment_intent.payment_failed`, or `checkout.session.expired`. If a customer disputes a charge or gets a refund through Stripe dashboard, the job listing stays live. Disputed charges cost EUR 15 per dispute on top of the refund.

**Cost Impact:** Revenue leakage from unhandled refunds; EUR 15/dispute fee if disputes escalate; jobs staying live after refund = free service.

**Recommended Fix:** Add handlers for refund/dispute events that deactivate jobs (`isLive = 0`) when payment is reversed.

#### C3: No Billing Infrastructure for Client Sites
**Files:** Entire `sites/admin/` directory

**Description:** There is zero billing, invoicing, or payment collection infrastructure for the agency's client websites. No Stripe subscriptions, no invoice generation, no payment tracking, no client usage metering. The platform has tiers (static, cms, interactive) but no automated way to charge clients or track who has paid.

**Cost Impact:** Manual billing = missed invoices, delayed payments, no recurring revenue automation. As client count grows, this becomes unsustainable.

**Recommended Fix:** Implement Stripe Billing with recurring subscriptions per client tier. Add a `billing` section to the admin dashboard showing payment status per client.

---

### HIGH Issues

#### H1: GitHub Actions CI Runs 5 Parallel Jobs on Every Push to Main
**Files:** `.github/workflows/test.yml`

**Description:** The CI workflow runs 5 separate jobs (`lint-and-typecheck`, `security-audit`, `integration-tests`, `e2e-tests`, `lighthouse`) on every push to main AND every PR. Each job does a full `npm ci` install independently. The e2e job installs Playwright browsers. The lighthouse job builds the template site AND installs a global npm package. This is ~15-25 minutes of total CI time per push.

**Cost Impact:** GitHub free tier gives 2000 min/month. With 2-3 pushes/day, that's ~1500-2250 min/month, which could exceed the free tier. At $0.008/min overage, that's $2-4/month wasted.

**Recommended Fix:**
1. Combine `lint-and-typecheck` and `security-audit` into one job (saves 3-5 min/push).
2. Cache `node_modules` properly (currently only caches npm's download cache, not installed modules).
3. Share build artifacts between e2e and lighthouse jobs instead of building twice.
4. Add path filters to skip CI when only docs/reports change.

#### H2: Deploy Workflow Only Deploys Template Site
**Files:** `.github/workflows/deploy-site.yml`

**Description:** The deploy workflow only watches `sites/template/**` and deploys the template site. There is no automated deployment for actual client sites. Client site deployments appear to be manual via wrangler CLI or the admin dashboard's redeploy button.

**Cost Impact:** Manual deployments waste developer time (~10 min per deployment). No CI/CD for the revenue-generating abroad-jobs site means deployments are error-prone.

**Recommended Fix:** Create per-site deploy workflows with path filters, or a matrix strategy that detects which sites changed and deploys only those.

#### H3: Daily Cron Job Import Without D1 Write Budget Awareness
**Files:** `sites/abroad-jobs/wrangler.toml`, `sites/abroad-jobs/src/lib/import-jobs.ts`

**Description:** The daily cron fetches up to 5 pages from Arbeitnow API, then does per-job dedup checks (2 queries each: source_id check + slug check) plus an INSERT for each new job. With 100 jobs per page and 5 pages, that is up to 500 jobs = 1500 D1 queries per run. The D1 free tier allows 100K writes/day, so this is fine now, but there is no monitoring or alerting if the import suddenly processes thousands of jobs.

**Cost Impact:** D1 free tier has 5M reads/day and 100K writes/day. The import is currently well within limits, but with no monitoring, a bug could blow through the write budget silently. D1 paid tier is $0.75/million writes.

**Recommended Fix:** Add import result logging to an external service (Betterstack/Sentry). Add a safeguard max import count (e.g., bail after 200 new inserts per run).

#### H4: No Revenue Tracking or Analytics for abroad-jobs
**Files:** `sites/abroad-jobs/src/lib/stripe.ts`, `sites/abroad-jobs/src/pages/api/webhook.ts`

**Description:** There is no dashboard, database table, or analytics tracking for Stripe revenue. No way to see total revenue, revenue per month, average order value, conversion rates, or refund rates. The only data is in the Stripe dashboard itself and the `stripe_session_id` field on jobs.

**Cost Impact:** Cannot calculate margins, cannot forecast revenue, cannot identify trends or pricing optimization opportunities.

**Recommended Fix:** Add a `payments` table to D1 tracking session_id, amount, status, created_at. Build a simple admin endpoint to query Stripe for revenue summaries, or use Stripe's reporting features.

---

### MEDIUM Issues

#### M1: PostGIS Image Used Instead of Standard PostgreSQL
**Files:** All `infra/docker/*/docker-compose.yml`

**Description:** All Directus PostgreSQL containers use `postgis/postgis:16-3.4` instead of the standard `postgres:16`. PostGIS adds ~200MB to the image size and consumes more memory at runtime for the GIS extensions. None of the client sites appear to use geospatial features.

**Cost Impact:** ~200MB extra disk per container (400MB total for 2 instances), ~50-100MB extra RAM per container from loaded extensions, longer pull times on deploy.

**Recommended Fix:** Switch to `postgres:16-alpine` unless a client specifically needs geospatial queries.

#### M2: Backup Scripts Reference AWS S3 but No S3 Configuration Exists
**Files:** `infra/backups/pg_backup.sh`, `infra/backups/uploads_backup.sh`

**Description:** Both backup scripts upload to `s3://agency-cms-backups/` using `aws s3 cp` and `aws s3 sync`, but there is no AWS configuration, no IAM credentials in Doppler or environment configs, and no cron job scheduling these backups. The scripts exist but may not be running.

**Cost Impact:** If backups are not running, a data loss event could destroy client CMS content with no recovery path. Cost of data recovery >> cost of S3 storage ($0.023/GB/month).

**Recommended Fix:** Verify backups are actually running (check crontab on VPS). Consider using Hetzner Object Storage (S3-compatible, EUR 0.006/GB) instead of AWS S3.

#### M3: No Per-Client Resource Isolation or Usage Tracking
**Files:** `infra/docker/*/docker-compose.yml`, `sites/admin/`

**Description:** There is no way to know how much CPU, memory, bandwidth, or storage each client's Directus instance consumes. The admin dashboard shows deploy status but has no resource usage metrics.

**Cost Impact:** Cannot right-size VPS, cannot justify tier pricing to clients, cannot identify clients that need to be on a larger plan.

**Recommended Fix:** Add cAdvisor or Prometheus + Grafana lightweight monitoring to the VPS.

#### M4: Admin Container Includes All Site Source Code
**Files:** `Dockerfile`

**Description:** The Dockerfile copies ALL `sites/` and `packages/` into the admin container image. This includes abroad-jobs source, all client site source, node_modules, etc. The image is likely 1-2GB.

**Cost Impact:** Larger image = longer build times (~2-5 min extra), more GHCR storage, slower deploys.

**Recommended Fix:** Use `.dockerignore` to exclude `node_modules` from non-admin sites, or use a multi-stage build.

#### M5: Checkout Allows Up to 50 Jobs Per Transaction with No Volume Pricing
**Files:** `sites/abroad-jobs/src/lib/validation.ts`, `sites/abroad-jobs/src/lib/stripe.ts`

**Description:** The checkout schema allows up to 50 jobs per checkout at a flat EUR 89/job. There is no volume discount, no bulk pricing tier. The `sessionId` passed to `createCheckoutParams` is always an empty string.

**Cost Impact:** Missed upsell opportunity for bulk posters. Empty sessionId means Stripe metadata is not useful for reconciliation.

**Recommended Fix:** Add volume pricing tiers (e.g., 5+ jobs at EUR 79, 10+ at EUR 69). Fix the empty sessionId metadata.

#### M6: Import Job Auth Bypass When IMPORT_SECRET Not Set
**Files:** `sites/abroad-jobs/src/pages/api/import.ts`

**Description:** The import endpoint allows unauthenticated access when `IMPORT_SECRET` is not set. Anyone who discovers the endpoint can trigger unlimited imports.

**Cost Impact:** Unauthorized imports could consume D1 write budget.

**Recommended Fix:** Always require the secret. Remove the "for initial testing" bypass.

---

### LOW Issues

#### L1: No Cache Headers on Homepage SSR Response
**Files:** `sites/abroad-jobs/src/pages/index.astro`

**Description:** The homepage is SSR with no cache headers. Every visit triggers fresh D1 reads.

**Recommended Fix:** Add `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.

#### L2: Duplicate Query Logic Between index.astro and /api/jobs
**Files:** `sites/abroad-jobs/src/pages/index.astro`, `sites/abroad-jobs/src/pages/api/jobs.ts`

**Description:** Nearly identical query logic exists in two places. Bug fixes must be applied twice.

**Recommended Fix:** Extract shared query logic into a `queryJobs()` function in `src/lib/db.ts`.

#### L3: Resend Free Tier Limit is 100 emails/day
**Files:** `sites/abroad-jobs/src/lib/email.ts`

**Description:** Resend free tier allows 100 emails/day. No fallback or alerting if the limit is hit.

**Recommended Fix:** Add error logging for email failures. Consider Resend Pro ($20/month) if volume increases.

#### L4: No .dockerignore File
**Files:** Root directory

**Description:** No `.dockerignore` means the entire repo context is sent to Docker daemon.

**Recommended Fix:** Add `.dockerignore` excluding `node_modules/`, `.git/`, `reports/`, `tests/`, `*.md`.

---

## 3. Per-Client Cost Model

### Static Tier (athena-institute, template sites)
| Resource | Provider | Monthly Cost |
|----------|----------|-------------|
| Hosting | Cloudflare Pages (free) | $0 |
| Builds | Cloudflare Pages (free, ~2-5 builds/mo) | $0 |
| DNS/SSL | Cloudflare (free) | $0 |
| Analytics | Plausible/Fathom (if used) | $0-9 |
| **Total per static client** | | **$0-9/month** |

### CMS Tier (meridian-properties, atelier-kosta)
| Resource | Provider | Monthly Cost |
|----------|----------|-------------|
| Hosting | Cloudflare Pages (free) | $0 |
| CMS (Directus) | Shared Hetzner VPS | ~EUR 2-3 (proportional share) |
| PostgreSQL | Shared Hetzner VPS | ~EUR 1-2 (proportional share) |
| CMS Storage | Docker volume on VPS | Included |
| Backups | S3 (if running) | ~$0.50 |
| Analytics | Plausible/Fathom (if used) | $0-9 |
| **Total per CMS client** | | **EUR 3-15/month** |

### abroad-jobs (Special: SSR + D1 + Stripe)
| Resource | Provider | Monthly Cost |
|----------|----------|-------------|
| Hosting + SSR | Cloudflare Workers (free) | $0 |
| Database | Cloudflare D1 (free) | $0 |
| Payments | Stripe (1.5% + EUR 0.25/txn) | Variable |
| Email | Resend (free) | $0 |
| Cron (imports) | Cloudflare Workers (free) | $0 |
| **Total fixed cost** | | **$0/month** |
| **Stripe fee per EUR 89 posting** | | **~EUR 1.59** |
| **Net revenue per posting** | | **~EUR 87.41** |

### Break-Even Analysis
- **Fixed monthly infrastructure cost:** ~EUR 15-25 (dominated by Hetzner VPS)
- **Break-even for abroad-jobs:** 1 paid job posting covers the entire platform's infrastructure costs
- **Static client margin:** If charging EUR 30-50/month = 100% margin (zero hosting cost)
- **CMS client margin:** If charging EUR 80-150/month = 80-95% margin (EUR 3-15 hosting cost)
- **Scaling threshold:** VPS upgrade needed at ~5-6 CMS clients (EUR 8-12/month for CX32)

---

## 4. Cost Optimization Recommendations

### Immediate (no code changes needed)
1. **Add `.dockerignore`** -- saves 30-60s per admin deploy
2. **Switch from PostGIS to postgres:16-alpine** -- saves ~200MB RAM and ~400MB disk
3. **Verify backups are running** -- prevents catastrophic data loss
4. **Set IMPORT_SECRET in production** -- prevents unauthorized D1 writes

### Short-term (1-2 weeks of work)
5. **Add Docker resource limits** -- prevents cascading failures on shared VPS
6. **Consolidate CI jobs** -- save ~500 CI minutes/month
7. **Add cache headers to abroad-jobs homepage** -- reduce D1 reads by 90%
8. **Add Stripe refund/dispute webhook handlers** -- prevent revenue leakage
9. **Fix empty sessionId in Stripe metadata** -- enable payment reconciliation

### Medium-term (1-2 months of work)
10. **Build billing infrastructure** -- Stripe Billing subscriptions per client tier
11. **Add resource monitoring** -- cAdvisor + simple dashboard in admin UI
12. **Add revenue dashboard for abroad-jobs** -- payments table + admin endpoint
13. **Add budget alerts** -- Cloudflare, Stripe, and Hetzner usage notifications

### Long-term (3+ months)
14. **Per-client cost tracking** -- attribute VPS resources to specific clients
15. **Automated scaling** -- detect when VPS needs upgrade based on container metrics
16. **Client self-service billing portal** -- clients can view/pay invoices

---

## 5. Billing Infrastructure Gaps

| Capability | Status | Impact |
|-----------|--------|--------|
| Client invoicing | Missing | Manual billing, missed payments |
| Recurring subscriptions | Missing | No automated revenue collection |
| Payment tracking per client | Missing | Cannot calculate margins |
| Usage metering per client | Missing | Cannot justify pricing tiers |
| Revenue dashboard | Missing | No visibility into business health |
| Stripe refund handling | Missing | Revenue leakage |
| Failed payment recovery (dunning) | Missing | Lost revenue from card failures |
| Tax calculation/reporting | Missing | Compliance risk (EU VAT) |
| Client billing portal | Missing | All billing is manual |
| Stripe webhook for abroad-jobs disputes | Missing | EUR 15/dispute risk |

---

## 6. Cloudflare Free Tier Risk Assessment

| Resource | Free Limit | Est. Current Usage | Headroom | Upgrade Trigger |
|----------|-----------|-------------------|----------|-----------------|
| Pages builds | 500/month | ~20-30/month | 94% available | >10 client sites with frequent deploys |
| Workers requests | 100K/day | ~100-500/day | 99% available | abroad-jobs hits ~50K daily visitors |
| D1 reads | 5M/day | ~1K-5K/day | 99.9% available | abroad-jobs homepage without caching at scale |
| D1 writes | 100K/day | ~100-500/day (import days) | 99.5% available | Multiple bulk imports or very high posting volume |
| D1 storage | 5GB | <100MB | 98% available | Tens of thousands of job listings |
| Workers CPU time | 10ms/request | ~2-5ms/request | 50-75% available | Complex queries or heavy FTS |

**Verdict:** Cloudflare free tier is extremely generous for current scale. Upgrade unlikely needed until 50K+ daily visitors or 10+ sites.

---

## 7. Hetzner VPS Assessment

**Current setup:** Single VPS (likely CX22: 2 vCPU, 4GB RAM, 40GB disk, ~EUR 5.39/month)

**Running containers (estimated):**
- Admin dashboard: ~200-400MB RAM
- Directus (meridian-properties): ~300-500MB RAM
- PostgreSQL (meridian-properties): ~100-200MB RAM
- Directus (atelier-kosta): ~300-500MB RAM
- PostgreSQL (atelier-kosta): ~100-200MB RAM
- Cloudflare Tunnel (cloudflared): ~50MB RAM
- **Total estimated: 1.1-1.8GB RAM**

**Assessment:** The VPS is likely adequately sized for 2 CMS clients. With 4GB RAM and ~1.5GB used, there is headroom for 1-2 more CMS clients before needing an upgrade. The CX32 (3 vCPU, 8GB RAM) at EUR 8.49/month would be the next step.

**Risk:** Without resource limits, a single container could consume all available RAM and crash everything via OOM killer.
