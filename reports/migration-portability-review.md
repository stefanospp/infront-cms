# Migration & Portability Review

**Date:** 2026-03-23
**Scope:** Full codebase at /Users/stefanospetrou/Desktop/Apps/infront-cms
**Reviewer:** Claude Code audit

---

## Executive Summary

This review assesses how portable the infront-cms platform is across hosting providers, databases, and services, and how difficult it would be to migrate away from current vendor choices. The platform has **moderate portability** overall -- Astro as the framework is highly portable, but there are significant vendor lock-in points with Cloudflare (Workers runtime, D1, DNS API), Docker/Hetzner (Directus hosting), and several SaaS integrations (Stripe, Resend, BetterAuth).

The hardest migration would be moving away from Cloudflare D1 (FTS5 virtual tables are SQLite-specific) and the Cloudflare Workers runtime (Astro adapter is platform-specific). The easiest migrations would be swapping Resend for another email provider and moving static sites to any CDN.

---

## Vendor Lock-In Assessment

| Component | Current Vendor | Lock-In Level | Migration Effort | Notes |
|-----------|---------------|---------------|-----------------|-------|
| Static site hosting | Cloudflare Pages/Workers | Low | 1-2 days | Astro outputs static files; any CDN works |
| SSR hosting | Cloudflare Workers | Medium | 1-2 weeks | Need to swap Astro adapter; env API differs |
| Database (abroad-jobs) | Cloudflare D1 (SQLite) | High | 2-4 weeks | FTS5, SQLite syntax, D1-specific batch API |
| Database (CMS) | PostgreSQL (Docker) | Low | 1-2 days | Standard PostgreSQL; Directus is DB-agnostic |
| CMS | Directus (self-hosted) | Low | 1 day | Docker-based; runs anywhere |
| DNS | Cloudflare | Medium | 1 week | Admin API tightly integrated; need DNS API swap |
| Payments | Stripe | Medium | 2-3 weeks | Stripe-specific checkout/webhook flow |
| Email | Resend | Low | 1-2 days | Simple API; drop-in replacements exist |
| Auth | BetterAuth (self-hosted) | Low | 1 week | Self-hosted; could swap for any auth provider |
| CI/CD | GitHub Actions | Low | 1-2 days | Standard YAML workflows |
| Secrets | Doppler | Low | 1 day | Env vars; any secret manager works |
| VPS | Hetzner | Low | 1 day | Standard Docker; runs on any VPS/cloud |
| Deployment | Kamal | Low | 1-2 days | Standard Docker deployment |
| Backups | AWS S3 | Low | 1 hour | S3-compatible API; many alternatives |

---

## Detailed Migration Paths

### 1. Moving Away from Cloudflare (Hosting)

**Static sites (template, athena-institute, meridian-properties, atelier-kosta):**
- **Target:** Vercel, Netlify, AWS CloudFront + S3, any CDN
- **Effort:** 1-2 days
- **Steps:**
  1. Change Astro output adapter (or use `output: 'static'` with no adapter)
  2. Update deploy scripts/CI to use target platform's CLI
  3. Migrate DNS records
  4. Update admin UI's deploy/DNS code
- **What breaks:** Admin UI's Cloudflare API integration (deploy, DNS, custom domains). Would need to rewrite `cloudflare.ts` and `deploy.ts` for the new platform's API.

**SSR site (abroad-jobs):**
- **Target:** Vercel (Edge or Node), Netlify, Fly.io, Railway
- **Effort:** 1-2 weeks
- **Steps:**
  1. Swap `@astrojs/cloudflare` adapter for target platform's adapter
  2. Replace `context.locals.runtime.env` access pattern with standard `process.env` or platform-specific env access
  3. Replace D1 database bindings with a standard database connection (see D1 migration below)
  4. Replace `wrangler.toml` configuration with target platform's config
  5. Update cron trigger mechanism
- **What breaks:** D1 bindings, Workers-specific env access, cron triggers, `wrangler deploy` commands

### 2. Moving Away from Cloudflare D1

**Target options:** PostgreSQL (Neon, Supabase, self-hosted), PlanetScale (MySQL), Turso (SQLite-compatible)

**Easiest path: Turso (libSQL)**
- **Effort:** 1 week
- **Why:** Turso is SQLite-compatible, so most queries work unchanged. Drizzle supports `drizzle-orm/libsql`.
- **What breaks:** FTS5 virtual tables (Turso has limited FTS support). D1-specific batch API calls.
- **Steps:**
  1. Replace `drizzle-orm/d1` with `drizzle-orm/libsql`
  2. Replace D1 binding access with Turso client initialization
  3. Rewrite FTS5 queries or use Turso's search capabilities
  4. Replace `env.DB.batch()` calls with Turso's batch API

**Alternative path: PostgreSQL**
- **Effort:** 2-4 weeks
- **Why:** Better long-term scalability, rich ecosystem.
- **What breaks:** All SQLite-specific syntax, FTS5 (replace with `tsvector`), column types, migration files.
- **Steps:**
  1. Rewrite Drizzle schema for PostgreSQL (`drizzle-orm/node-postgres` or `drizzle-orm/neon-http`)
  2. Rewrite all raw SQL queries (FTS5 -> `tsvector`, SQLite types -> PostgreSQL types)
  3. Create PostgreSQL migration files
  4. Migrate data (export from D1, transform, import to PostgreSQL)
  5. Update all D1-specific code patterns

### 3. Moving Away from Stripe

- **Target:** Paddle, LemonSqueezy, PayPal
- **Effort:** 2-3 weeks
- **Files to change:**
  - `sites/abroad-jobs/src/lib/stripe.ts` -- replace checkout session creation
  - `sites/abroad-jobs/src/pages/api/checkout.ts` -- rewrite for new payment flow
  - `sites/abroad-jobs/src/pages/api/webhook.ts` -- rewrite webhook handler
  - `sites/abroad-jobs/src/pages/success.astro` -- update success page
  - `sites/abroad-jobs/src/islands/JobPostForm.tsx` -- update form submission
- **What breaks:** Checkout flow, webhook verification, pricing configuration. Database schema stores `stripe_session_id` which would need renaming.

### 4. Moving Away from Resend

- **Target:** SendGrid, Mailgun, AWS SES, Postmark
- **Effort:** 1-2 days
- **Files to change:**
  - `sites/abroad-jobs/src/lib/email.ts` -- swap SDK, same send pattern
- **What breaks:** Nothing significant. The email API is simple (send one email). All alternatives have similar APIs.

### 5. Moving Away from Hetzner

- **Target:** DigitalOcean, Linode, AWS EC2, any VPS provider
- **Effort:** 1 day (new VPS setup) + DNS propagation
- **Steps:**
  1. Provision new VPS on target provider
  2. Run `setup-vps.sh` (or equivalent) on new server
  3. Deploy admin via Kamal (update `deploy.yml` with new IP)
  4. Deploy Directus instances via Docker Compose
  5. Restore PostgreSQL backups from S3
  6. Update DNS to point to new IP
- **What breaks:** Nothing code-level. Only infrastructure configuration changes.

### 6. Moving CMS Away from Directus

- **Target:** Strapi, Payload CMS, Sanity, Contentful
- **Effort:** 2-4 weeks per CMS client
- **Files to change:**
  - `packages/utils/src/directus.ts` -- replace SDK with new CMS client
  - Each CMS site's `src/lib/directus.ts` -- rewrite data fetching functions
  - Content models need recreation in new CMS
  - Media/uploads need migration
- **What breaks:** All Directus SDK calls, content model definitions, media URL generation. The `getDirectusImageUrl()` helper would need replacement.

---

## Export Capabilities

| What | Can Export? | Format | Notes |
|------|-----------|--------|-------|
| Site source code | Yes | Git repo | Sites are in the monorepo |
| Site static output | Yes | HTML/CSS/JS | `astro build` produces standard output |
| CMS content | Yes | JSON (Directus API) | Can export via Directus REST API or direct PG dump |
| CMS media | Yes | Files | Docker volume or Directus asset API |
| D1 data | Partial | SQLite dump | Cloudflare dashboard or `wrangler d1 export` |
| Stripe data | Yes | CSV/API | Stripe dashboard export or API |
| DNS records | Yes | JSON | Cloudflare API export |
| Deploy history | Minimal | JSON files | Only last deploy in `.deploy.json` |
| Git history | Yes | Git | Full commit history |

The admin UI has an `/api/sites/[slug]/export` endpoint, but it currently returns file manifests without actual downloadable archives. This should be improved for true export capability.

---

## Portability Recommendations

### Immediate
1. **Abstract D1 access behind a repository pattern** -- Create a `JobsRepository` interface that can be implemented for D1, Turso, or PostgreSQL. This decouples business logic from the database.
2. **Abstract DNS API behind an interface** -- Create a `DnsProvider` interface so the admin UI can work with Cloudflare, AWS Route53, or any DNS provider.
3. **Make the export endpoint produce actual archives** -- Download a zip of site source + built output.

### Medium-Term
4. **Extract Stripe integration behind a payment interface** -- `PaymentProvider.createCheckout()`, `PaymentProvider.handleWebhook()`. This makes swapping payment providers much easier.
5. **Document migration procedures** -- Step-by-step guides for each vendor migration path.

### Long-Term
6. **Consider a platform abstraction layer** -- A single config file that specifies which providers are in use (hosting, DNS, database, email, payments) with swap-in implementations. This is over-engineering for now but valuable at scale.

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Cloudflare pricing change | Low | High | D1 and Workers are competitively priced; monitor alternatives |
| Cloudflare D1 deprecation | Very Low | Very High | D1 is GA; but having a Turso migration path is prudent |
| Hetzner outage | Low | High | Backups to S3; can restore on any VPS in hours |
| Stripe API changes | Low | Medium | Stripe maintains backward compatibility well |
| Resend shutdown | Medium | Low | Trivial to swap; abstract email sending |
| Directus major version break | Medium | Medium | Pin Directus version; test upgrades in staging |
| BetterAuth deprecation | Medium | Medium | Self-hosted; can fork or swap auth libraries |

---

## Files Analyzed

- All `wrangler.toml` files (5 sites)
- All `docker-compose.yml` files
- `Dockerfile`, `docker-entrypoint.sh`
- `infra/admin/deploy.yml` (Kamal config)
- `sites/admin/src/lib/cloudflare.ts` (Cloudflare API wrapper)
- `sites/admin/src/lib/deploy.ts` (deployment pipeline)
- `sites/abroad-jobs/src/lib/db.ts` (D1/Drizzle setup)
- `sites/abroad-jobs/src/lib/stripe.ts` (Stripe integration)
- `sites/abroad-jobs/src/lib/email.ts` (Resend integration)
- `packages/utils/src/directus.ts` (Directus SDK wrapper)
- `sites/admin/src/middleware.ts` (BetterAuth integration)
- `infra/backups/pg_backup.sh`, `restore.sh`
- `infra/provisioning/new-site.sh`, `provision-cms.sh`
