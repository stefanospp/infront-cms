# Platform Master Review Report

**Project:** infront-cms (Agency Platform Monorepo)
**Date:** 2026-03-23
**Coverage:** 36 specialized reviews across all platform areas
**Total Issues Found:** ~430 (deduplicated to ~130 unique issues below)

---

## 1. Executive Summary

The infront-cms platform is a well-architected monorepo for running a solo web agency. Its foundations are strong: Astro 6 with static-first rendering, a clean shared component library with variant patterns, Tailwind CSS v4 theme tokens for per-site branding, centralized auth via BetterAuth SSO, and cost-efficient hosting on Cloudflare's free tier (~EUR 15-25/month total infrastructure). TypeScript strict mode is enforced everywhere with zero `any` types. The component override Vite plugin is elegant, and the admin wizard automates the full site creation-to-deploy pipeline.

However, the platform has accumulated significant technical debt and has critical gaps that create real business risk across five key dimensions:

- **Security & Multi-tenancy:** Production Directus credentials committed to git in plaintext. No CSRF protection on admin APIs. FTS5 injection vector in job search. Import API open when secret is unset. A single Cloudflare token controls all sites with no tenant isolation. Admin has unrestricted filesystem access. Directus ports exposed on all interfaces.
- **Reliability & Observability:** Zero monitoring deployed (Sentry/Betterstack only in docs). No logging library anywhere -- 80+ empty catch blocks silently swallow errors. Auth service outage locks out all admins with no fallback. Stripe checkout can orphan payments with no transaction safety. Workers logs are ephemeral with no persistence.
- **Compliance & Billing:** Google Analytics loads without consent (GDPR violation). No data deletion mechanism for right-to-erasure requests. Privacy policies missing required GDPR disclosures. Zero agency client billing infrastructure. No VAT/tax handling. No refund/dispute webhook.
- **Backup & Data Safety:** Backup infrastructure is entirely non-functional. pg_backup.sh cannot reach Docker containers. uploads_backup.sh targets nonexistent paths. restore.sh is inoperable. No D1 backup exists. No scheduling. A VPS disk failure means total data loss.
- **Testing & Content:** 60% of integration tests are source-scanning (string matching, not behavioral). The revenue-generating abroad-jobs site has zero tests. No tests for admin auth middleware. Contact form API route `/api/contact` does not exist (404 on every client site). OG images referenced but never created. CookieConsent component orphaned from BaseLayout.
- **Design System & PWA:** Only 19 shared components -- insufficient for diverse agency work. Zero dark mode support. No PWA capability whatsoever: no manifest, no service worker, no installable experience. Missing critical components (Breadcrumbs, Tabs, Modal, Pagination, Blog).
- **Caching:** Only 2 responses in the entire codebase set Cache-Control headers. No SSR caching, no Directus caching, auth middleware makes uncached external fetch on every request.

**Overall Platform Health: C** -- Strong architecture with serious operational, compliance, observability, and data safety gaps that must be addressed before scaling.

---

## 2. Risk Dashboard

| # | Review Area | Severity | Critical | High | Medium | Low | Grade |
|---|-------------|----------|----------|------|--------|-----|-------|
| 1 | Security | HIGH | 3 | 5 | 8 | 6 | D+ |
| 2 | Authentication | HIGH | 2 | 4 | 5 | 5 | C- |
| 3 | Error Resilience | HIGH | 4 | 7 | 8 | 4 | D |
| 4 | Compliance & Privacy | HIGH | 3 | 5 | 7 | 4 | D |
| 5 | QA & Testing | HIGH | 3 | 4 | 6 | 3 | D+ |
| 6 | Database & Data | HIGH | 2 | 5 | 8 | 6 | C- |
| 7 | Infrastructure | HIGH | 3 | 8 | 9 | 5 | C- |
| 8 | Email Deliverability | HIGH | 2 | 5 | 5 | 4 | D+ |
| 9 | Template Completeness | HIGH | 3 | 4 | 3 | 0 | D+ |
| 10 | API & Integrations | MEDIUM | 4 | 8 | 11 | 6 | C |
| 11 | Cloudflare Platform | MEDIUM | 3 | 5 | 6 | 4 | C |
| 12 | Site Lifecycle | MEDIUM | 5 | 7 | 9 | 5 | C- |
| 13 | Performance | MEDIUM | 2 | 4 | 8 | 7 | C+ |
| 14 | SEO & Web Standards | MEDIUM | 3 | 6 | 8 | 6 | C |
| 15 | Content Audit | MEDIUM | 5 | 11 | 8 | 8 | C- |
| 16 | Frontend Development | MEDIUM | 3 | 8 | 12 | 7 | C+ |
| 17 | UI/UX | MEDIUM | 3 | 7 | 12 | 10 | C+ |
| 18 | Architecture | MEDIUM | 2 | 5 | 7 | 4 | B- |
| 19 | Customization | MEDIUM | 1 | 3 | 3 | 0 | C |
| 20 | DX & Documentation | MEDIUM | 4 | 6 | 10 | 6 | C+ |
| 21 | Dependency & Supply Chain | MEDIUM | 2 | 6 | 7 | 3 | C |
| 22 | Export & Migration | MEDIUM | 2 | 4 | 4 | 0 | C |
| 23 | Scalability | LOW | 0 | 4 | 5 | 0 | C+ |
| 24 | Resource & Cost | LOW | 3 | 4 | 6 | 4 | C |
| 25 | i18n | LOW | 2 | 4 | 4 | 3 | D |
| 26 | Migration & Portability | LOW | 0 | 0 | 3 | 0 | B |
| 27 | Analytics & Script Management | HIGH | 3 | 5 | 5 | 0 | D+ |
| 28 | Logging & Observability | HIGH | 6 | 4 | 3 | 0 | F |
| 29 | Caching Strategy | MEDIUM | 3 | 5 | 3 | 0 | D |
| 30 | Business Logic | HIGH | 6 | 12 | 15 | 0 | D |
| 31 | Design System | MEDIUM | 0 | 0 | 0 | 0 | D+ |
| 32 | Multi-tenancy | HIGH | 2 | 6 | 8 | 0 | D |
| 33 | Admin UI Audit | HIGH | 2 | 9 | 14 | 0 | D+ |
| 34 | PWA & Offline | LOW | 0 | 0 | 0 | 0 | F |
| 35 | Backup Verification | CRITICAL | 8 | 0 | 0 | 0 | F |
| 36 | Billing & Revenue | HIGH | 6 | 0 | 0 | 0 | F |

---

## 3. Critical Issues (Deduplicated)

### SEC-1: Production Secrets Committed to Git
**Reports:** Security, Authentication, Architecture, Database, Multi-tenancy
**Files:** `infra/docker/meridian-properties/.env`, `infra/docker/atelier-kosta/.env`

Database passwords, Directus admin credentials, and application secret keys are committed in plaintext. Any person with repo access gains full admin access to both CMS instances.

**Action:** Rotate all credentials immediately. Add `infra/docker/*/.env` to `.gitignore`. Purge from git history. Move to Doppler.

### SEC-2: No CSRF Protection on Admin API Mutations
**Reports:** Security, Authentication, API Integrations
**Files:** All POST/PUT/DELETE routes in `sites/admin/src/pages/api/`

None of the ~20 admin API routes implement CSRF protection. Cookie-based auth means any site visited by an authenticated admin can trigger destructive operations (create, delete, redeploy sites).

**Action:** Add Origin header checking in middleware for mutation requests. Implement CSRF token pattern.

### SEC-3: FTS5 Injection in Job Search
**Reports:** Security, Database, API Integrations, Frontend Dev, Business Logic
**Files:** `sites/abroad-jobs/src/pages/api/jobs.ts`, `sites/abroad-jobs/src/pages/index.astro`

Search query sanitization only strips quotes but not FTS5 operators (`*`, `NEAR`, `NOT`, column filters). Attackers can manipulate search results or cause denial of service.

**Action:** Strip all FTS5 operators and wrap each term in double quotes for literal matching.

### SEC-4: Import API Open Without Secret
**Reports:** Security, Authentication, Compliance, API Integrations, Cloudflare
**Files:** `sites/abroad-jobs/src/pages/api/import.ts`

When `IMPORT_SECRET` is not set, the endpoint allows unauthenticated access. Anyone can flood the database.

**Action:** Always require the secret. Return 500 if not configured.

### SEC-5: Stored XSS via `applyUrl` Field
**Reports:** Security, Database, Business Logic
**Files:** `sites/abroad-jobs/src/lib/validation.ts`, `sites/abroad-jobs/src/pages/jobs/[slug].astro`

The `applyUrl` field accepts any string including `javascript:` URIs, which are rendered in `<a href>` tags.

**Action:** Add `.refine()` to restrict to `http://`, `https://`, or `mailto:` schemes.

### SEC-6: CMS Content Rendered Without Sanitization
**Reports:** Security, Frontend Dev
**Files:** Multiple `[...slug].astro` and `[slug].astro` pages across CMS sites

CMS HTML content rendered via `set:html` with no sanitization. Compromised CMS account enables persistent XSS on client-facing sites.

**Action:** Use `sanitize-html` or DOMPurify server-side before rendering.

### REL-1: Auth Service Outage = Complete Admin Lockout
**Reports:** Error Resilience, Authentication, API Integrations, Site Lifecycle, Caching Strategy
**Files:** `sites/admin/src/middleware.ts`

Every request validates against `auth.infront.cy` with no timeout, no caching, no fallback. Auth service down = redirect loop, all admin operations impossible. Auth middleware also makes an uncached external fetch on every single request.

**Action:** Add 60-second session caching. Add 5-second timeout with AbortController. Return 503 on auth service failure instead of redirect.

### REL-2: Checkout Flow Lacks Transaction Safety
**Reports:** Database, Error Resilience, API Integrations, Business Logic
**Files:** `sites/abroad-jobs/src/pages/api/checkout.ts`

Stripe session created first, then jobs inserted in a loop with no transaction. Partial failure = customer charged for missing jobs. No D1 batch API used.

**Action:** Use D1 `batch()` for atomic inserts. Reorder to insert jobs before creating Stripe session.

### REL-3: Zero Monitoring and Logging Deployed
**Reports:** Error Resilience, Infrastructure, Logging & Observability
**Affected:** Entire codebase

Sentry and Betterstack are documented but not installed anywhere. No logging library exists in the entire codebase. All errors go to ephemeral `console.error`. 80+ empty catch blocks silently swallow errors. Cloudflare Workers logs are ephemeral with no persistence. Operating completely blind in production.

**Action:** Install structured logging library (pino). Install `@sentry/cloudflare` for abroad-jobs, `@sentry/node` for admin. Configure Betterstack uptime monitors. Audit and fix all empty catch blocks.

### COMP-1: Google Analytics Loads Without Consent
**Reports:** Compliance, Template Completeness, Analytics & Script Management
**Files:** `packages/ui/src/layouts/BaseLayout.astro`

GA scripts load unconditionally in BaseLayout for sites with `analytics.provider: 'google'`, independent of the CookieConsent island. Direct GDPR and ePrivacy Directive violation. DPAs are actively fining EUR 50K-150K for this.

**Action:** Remove GA from BaseLayout. Load only via CookieConsent after explicit consent.

### ANA-1: No Script Management System
**Reports:** Analytics & Script Management
**Files:** `packages/config/src/types.ts`, `sites/admin/src/pages/`

SiteConfig has no `customScripts`, `headScripts`, or `bodyScripts` field. No admin UI for script injection. Adding any third-party script requires editing source code, updating CSP headers manually, and redeploying.

**Action:** Add `customScripts` to SiteConfig with `head[]` and `body[]` arrays. Add script management UI to admin. Auto-generate CSP from configured scripts.

### ANA-2: Zero Analytics on All Client Sites
**Reports:** Analytics & Script Management
**Files:** All `site.config.ts` files across live sites

All 4 production sites have no analytics configured. The abroad-jobs site processes EUR 89 payments with zero visibility into traffic sources, conversion funnels, or user behavior.

**Action:** Enable Plausible on all sites immediately (privacy-friendly, no consent needed). Add event tracking to abroad-jobs checkout flow.

### COMP-2: No Data Deletion Mechanism
**Reports:** Compliance
**Files:** `sites/abroad-jobs/` (entire site)

No API endpoint, admin tool, or automated process to delete personal data. Cannot fulfill GDPR Article 17 right-to-erasure requests. Privacy policy promises 90-day retention but no code implements it.

**Action:** Create admin-protected deletion endpoint. Add daily cron cleanup for expired/abandoned records.

### EMAIL-1: Contact Form API Route Does Not Exist
**Reports:** Email Deliverability, Template Completeness
**Files:** `packages/ui/src/islands/ContactForm.tsx` posts to `/api/contact` -- no such route exists

Every client site's contact form returns 404. Submissions are silently lost.

**Action:** Create `sites/template/src/pages/api/contact.ts` and replicate to all client sites.

### SEO-1: OG Images Referenced But Never Created
**Reports:** SEO, Content Audit, Template Completeness
**Files:** All `site.config.ts` files reference `/og-default.jpg`

No site has an `og-default.jpg` in its `public/` directory. Social sharing previews show broken images across all sites.

**Action:** Create branded 1200x630 OG images for each site.

### INFRA-1: PostgreSQL Port Exposed to Public Internet
**Reports:** Infrastructure, Security, Multi-tenancy
**Files:** `infra/kamal.yml`

Kamal maps PostgreSQL port `5432:5432` binding to all interfaces (0.0.0.0). Directus ports also exposed on all interfaces.

**Action:** Change to `127.0.0.1:5432:5432` or remove port mapping entirely. Bind Directus to localhost.

### INFRA-2: Docker Container Runs as Root
**Reports:** Infrastructure
**Files:** `Dockerfile`

The admin container runs as root with no non-root user created.

**Action:** Add a non-root user and `USER` directive.

### INFRA-3: CI Uses npm But Project Uses pnpm
**Reports:** Infrastructure, DX, Dependency, Architecture
**Files:** `.github/workflows/test.yml`, `.github/workflows/deploy-site.yml`

All CI workflows use `npm ci` while the project uses pnpm workspaces. Different dependency trees in CI vs. development.

**Action:** Update all CI to `pnpm/action-setup` + `pnpm install --frozen-lockfile`.

### TEST-1: Source-Scanning Tests Provide False Confidence
**Reports:** QA Testing
**Files:** 6 of 10 integration test files

~100 tests read source files as strings and assert on substring presence. They pass even with broken logic.

**Action:** Replace with behavioral tests using proper imports and mocks.

### TEST-2: abroad-jobs Has Zero Tests
**Reports:** QA Testing
**Files:** `sites/abroad-jobs/`

The revenue-generating site with Stripe payments, D1 database, and webhook processing has no tests whatsoever.

**Action:** Add validation schema tests, webhook integration tests, and search API tests.

### BACKUP-1: Backup Infrastructure Entirely Non-Functional
**Reports:** Backup Verification, Infrastructure, Database
**Files:** `infra/backups/pg_backup.sh`, `infra/backups/uploads_backup.sh`, `infra/backups/restore.sh`

All three backup scripts are inoperable. `pg_backup.sh` cannot reach Docker containers. `uploads_backup.sh` targets a nonexistent path. `restore.sh` does not work. No D1 backup exists. No scheduling configured. No verification tests. A VPS disk failure results in total, unrecoverable data loss for all CMS clients.

**Action:** Rewrite backup scripts to correctly target Docker containers. Add D1 backup via Wrangler CLI. Set up cron scheduling. Add backup verification (restore test). Implement off-site backup storage.

### BIZ-1: Cron Trigger Declared But No Handler Exists
**Reports:** Business Logic, Cloudflare
**Files:** `sites/abroad-jobs/wrangler.toml`

A cron trigger is configured in `wrangler.toml` but no `scheduled()` handler exists in the codebase. The trigger fires into the void.

**Action:** Implement the scheduled handler for expired job cleanup and orphan record purging.

### BIZ-2: Race Condition -- Webhook Fires Before DB Insert
**Reports:** Business Logic, Database
**Files:** `sites/abroad-jobs/src/pages/api/checkout.ts`, webhook handler

Stripe webhook can fire before the database insert completes, causing the webhook to find no matching records. Payment confirmed but job never activated.

**Action:** Insert jobs with pending status before creating Stripe session. Webhook updates status to active.

### TENANT-1: Single Cloudflare Token Controls All Sites
**Reports:** Multi-tenancy, Security, Resource Cost
**Files:** Admin environment configuration

One API token has full access to all Cloudflare Pages projects, DNS, and Workers. Token compromise = all client sites compromised. No per-tenant isolation.

**Action:** Create scoped tokens per site or per operation type. Implement least-privilege access.

### TENANT-2: Admin Has Unrestricted Filesystem Access
**Reports:** Multi-tenancy, Security, Admin UI Audit
**Files:** `sites/admin/src/pages/api/`

Admin API can read/write any tenant's files with no access boundaries. No RBAC exists. Combined with no CSRF, this is a significant cross-tenant risk.

**Action:** Implement path sandboxing for file operations. Add role-based access control.

### ADMIN-1: Seven API Routes Missing prerender=false
**Reports:** Admin UI Audit, Security, Frontend Dev, DX, API
**Files:** Multiple routes in `sites/admin/src/pages/api/`

Seven admin API routes are missing `export const prerender = false`, meaning they will be statically rendered at build time and non-functional in production.

**Action:** Audit all API routes and add `prerender = false` to every one.

### BILL-1: Zero Agency Client Billing Infrastructure
**Reports:** Billing & Revenue, Resource Cost
**Files:** Entire platform

No mechanism to bill agency clients. No invoicing, no subscription management, no payment collection. abroad-jobs handles only `checkout.session.completed` with no refund handler. Price hardcoded in 2 places. No VAT/tax calculation. No revenue tracking or payment history.

**Action:** Implement Stripe Connect or recurring billing for agency clients. Add refund/dispute webhook handlers. Centralize pricing configuration. Add revenue dashboard.

---

## 4. High Priority Issues (Deduplicated)

| ID | Issue | Reports |
|----|-------|---------|
| H-01 | No rate limiting on any API endpoint | Security, Auth, API, Compliance, Email, Cloudflare |
| H-02 | No timeouts on any fetch() call across entire codebase | Error Resilience, API, Caching |
| H-03 | MobileNav uses `client:load` instead of `client:idle` | UI/UX, Frontend, SEO, Performance |
| H-04 | Webhook not idempotent -- duplicate emails on retry | Database, API, Error Resilience, Business Logic |
| H-05 | No Docker health checks on any service | Infrastructure, Database, Error Resilience |
| H-06 | No Docker resource limits | Infrastructure, Scalability, Resource Cost |
| H-07 | No automated backup scheduling | Infrastructure, Database, Backup Verification |
| H-08 | Render-blocking Google Fonts (violates GDPR too) | Performance, Compliance |
| H-09 | Import script N+1 queries (300+ per run) | Performance, Database, Cloudflare |
| H-10 | No expired job cleanup | Database, API, Cloudflare, Business Logic |
| H-11 | Duplicate lockfiles (package-lock.json + pnpm-lock.yaml) | Architecture, Dependency |
| H-12 | Admin API routes missing `prerender = false` (7 routes) | Security, Frontend, DX, API, Admin UI |
| H-13 | Open redirect in admin login page | Authentication |
| H-14 | Directus Docker configs missing security hardening (CORS, rate limit) | Authentication, Security, Multi-tenancy |
| H-15 | Privacy policies missing required GDPR disclosures | Compliance |
| H-16 | No SPF/DKIM/DMARC DNS records for email | Email Deliverability |
| H-17 | No retry/dead-letter for webhook confirmation emails | Email, Error Resilience |
| H-18 | No structured data on any site except abroad-jobs job detail | SEO |
| H-19 | Canonical URLs never set on any page | SEO |
| H-20 | No custom 404 page on abroad-jobs | SEO, Content, Error Resilience |
| H-21 | Deploy workflow only deploys template site | Infrastructure, Site Lifecycle, Scalability |
| H-22 | No post-creation theme editing UI | Customization |
| H-23 | Export API exists but no UI button; no D1 data export | Export & Migration |
| H-24 | Docker volume sites not persisted to git | Site Lifecycle |
| H-25 | Directus utility has zero error handling | Error Resilience, API |
| H-26 | Athena Institute has entirely wrong content (consulting template on education site) | Content |
| H-27 | No Stripe refund/dispute handling | Resource Cost, Business Logic, Billing |
| H-28 | Duplicated type definitions in SiteWizard | Frontend, Architecture |
| H-29 | No audit trail for admin actions | Logging, Multi-tenancy, Security |
| H-30 | 80+ empty catch blocks across codebase | Logging, Error Resilience |
| H-31 | Only 2 responses set Cache-Control in entire codebase | Caching, Performance |
| H-32 | No SSR caching layer (every dynamic page re-renders) | Caching, Performance, Scalability |
| H-33 | Orphan pending jobs never cleaned up | Business Logic, Database, Compliance |
| H-34 | No refund/dispute webhook for abroad-jobs | Business Logic, Billing |
| H-35 | Broken media preview endpoint in admin | Admin UI |
| H-36 | 4 admin API endpoints with no corresponding UI | Admin UI |
| H-37 | Admin editor unusable on mobile | Admin UI |
| H-38 | Global env leaked to child processes | Multi-tenancy, Security |
| H-39 | LogoCloud scrolling variant broken | Design System |
| H-40 | Map component uses API key placeholder | Design System, Content |
| H-41 | 19 components insufficient for diverse agency work | Design System |

---

## 5. Cross-Cutting Concerns

### Theme 1: "Documented But Not Implemented"
Multiple components listed in CLAUDE.md as part of the stack are not actually configured: Sentry (error tracking), Betterstack (uptime monitoring), rate limiting on API routes, CORS restrictions, automated backup scheduling, and even the backup scripts themselves are non-functional. The documentation creates a dangerous false sense of security.

### Theme 2: Security Hardening Gap
The platform has good security fundamentals (Zod validation, CSP headers, Stripe webhook verification, honeypot spam protection, Cloudflare Tunnel) but is missing several defense-in-depth layers: CSRF tokens, rate limiting, HTML sanitization for CMS content, magic byte validation on uploads, FTS5 query sanitization, tenant isolation, and RBAC.

### Theme 3: No Retry/Fallback Anywhere
Every external service integration follows a "succeed or crash" pattern. Zero retry logic, zero circuit breakers, zero timeout configuration on fetch calls. Auth service, Stripe, Resend, Cloudflare API, Directus, and D1 all have no fallback behavior.

### Theme 4: pnpm/npm Confusion
The project uses pnpm but CI, documentation, CLAUDE.md commands, and a stale `package-lock.json` all reference npm. This creates non-reproducible builds and onboarding friction.

### Theme 5: D1 Query Anti-Patterns
Every D1 interaction is a sequential single query. The D1 batch API is never used despite multiple opportunities (checkout inserts, import dedup, homepage dual queries). This wastes subrequests and risks hitting Cloudflare limits.

### Theme 6: Abandoned Checkout Data Accumulation
Jobs are inserted before payment. Abandoned checkouts leave orphaned records indefinitely. No cleanup mechanism exists despite the privacy policy promising 90-day retention. The cron trigger declared in wrangler.toml has no handler.

### Theme 7: Complete Observability Vacuum
No logging library. No structured logs. No error tracking. No uptime monitoring. No audit trail. 80+ empty catch blocks. Ephemeral Workers logs. The platform is operating completely blind in production. Incidents can only be discovered by end-user complaints.

### Theme 8: Caching Absent at Every Layer
Only 2 HTTP responses in the entire codebase set Cache-Control headers. No CDN caching configuration. No SSR response caching. No Directus query caching. Auth middleware makes a full external fetch on every single request. Static assets served without cache headers.

### Theme 9: Multi-tenancy is Security Theater
A single Cloudflare API token controls all sites. Admin filesystem access is unrestricted across tenants. No RBAC. Global environment variables leak to child processes. Directus ports exposed publicly. One compromised credential could affect all clients.

### Theme 10: Revenue Infrastructure Non-Existent
No agency client billing. No invoicing. No subscription management. abroad-jobs handles only checkout.session.completed -- no refunds, no disputes, no dunning. Price hardcoded in 2 places. No revenue tracking dashboard. The platform generates revenue but has no infrastructure to manage it.

---

## 6. Positive Findings

**Architecture:**
- Clean acyclic package dependency chain: `config -> utils -> ui -> sites`
- Component override Vite plugin enables per-site customization without changing imports
- Comprehensive component registry with machine-readable prop/variant definitions
- Zero `any` types and zero `@ts-ignore` across the entire codebase

**Component Design:**
- Well-structured variant system across Hero, CTA, CardGrid, Features, FAQ, etc.
- MobileNav island is exemplary: focus trap, escape key, scroll lock, full ARIA support
- ContactForm island with proper `aria-describedby`, `aria-invalid`, honeypot, loading states
- Tailwind v4 theme token system correctly used throughout; shared components read from tokens

**Security Fundamentals:**
- Zod validation on nearly all API inputs with `safeParse` and `flatten()`
- Stripe webhook signature verification via `constructEventAsync`
- `execFile` used instead of shell-based execution (prevents command injection)
- Path traversal protection on media upload with filename sanitization
- Admin behind Cloudflare Tunnel (no direct internet exposure)

**Cost Efficiency:**
- Entire platform runs for ~EUR 15-25/month
- Static sites on Cloudflare free tier (zero hosting cost)
- Single job posting covers monthly infrastructure costs
- 99% Cloudflare free tier headroom remaining

**Developer Experience:**
- CLAUDE.md is exceptionally detailed with variant tables and quick reference
- In-app help system with 14 categories and 50+ articles
- Shell scripts well-commented with usage headers and prerequisites
- Auto-deploy pipeline: generate -> build -> wrangler deploy -> DNS -> SSL in ~30 seconds

---

## 7. Prioritized Action Plan

### Phase 1: Security, Compliance & Data Safety Emergency (Week 1-2)

| # | Action | Effort | Reports |
|---|--------|--------|---------|
| 1 | Rotate all committed secrets, purge from git history | 2h | SEC-1 |
| 2 | Remove GA from BaseLayout; load only via CookieConsent | 1h | COMP-1 |
| 3 | Self-host Google Fonts (also fixes GDPR issue) | 2h | H-08, Compliance |
| 4 | Fix FTS5 injection -- sanitize all operators | 1h | SEC-3 |
| 5 | Require IMPORT_SECRET always | 15m | SEC-4 |
| 6 | Validate applyUrl as URL with scheme whitelist | 30m | SEC-5 |
| 7 | Add CSRF Origin checking in admin middleware | 2h | SEC-2 |
| 8 | Bind PostgreSQL and Directus to localhost only | 15m | INFRA-1, TENANT |
| 9 | Create missing `/api/contact` route | 2h | EMAIL-1 |
| 10 | Add `prerender = false` to 7 admin API routes | 30m | ADMIN-1 |
| 11 | Delete `package-lock.json`, add to .gitignore | 5m | H-11 |
| 12 | Update CI to use pnpm | 1h | INFRA-3 |
| 13 | Rewrite backup scripts to actually work | 4h | BACKUP-1 |
| 14 | Add D1 backup via Wrangler CLI export | 2h | BACKUP-1 |
| 15 | Schedule automated backups (cron) | 1h | BACKUP-1 |

### Phase 2: Reliability, Observability & Caching (Week 3-4)

| # | Action | Effort | Reports |
|---|--------|--------|---------|
| 16 | Install structured logging library (pino) | 4h | REL-3, H-30 |
| 17 | Audit and fix all 80+ empty catch blocks | 4h | H-30 |
| 18 | Add session caching + timeout to auth middleware | 3h | REL-1, H-31 |
| 19 | Use D1 batch() for checkout inserts | 2h | REL-2 |
| 20 | Add webhook idempotency (check isLive=0 before update) | 1h | H-04 |
| 21 | Install Sentry for abroad-jobs and admin | 3h | REL-3 |
| 22 | Configure Betterstack uptime monitors | 1h | REL-3 |
| 23 | Batch import queries (reduce 300 -> 3) | 4h | H-09 |
| 24 | Add Cache-Control headers to all SSR responses | 2h | H-31 |
| 25 | Add static asset cache headers in _headers files | 1h | H-31 |
| 26 | Implement scheduled() handler for cron trigger | 3h | BIZ-1 |
| 27 | Fix webhook race condition (insert before Stripe session) | 2h | BIZ-2 |
| 28 | Add Docker resource limits and health checks | 2h | H-05, H-06 |
| 29 | Add non-root user to Dockerfile | 30m | INFRA-2 |
| 30 | Add timeouts (AbortController) to all external fetch calls | 3h | H-02 |
| 31 | Implement rate limiting on checkout and import endpoints | 4h | H-01 |

### Phase 3: SEO, Testing, Content & Admin (Week 5-8)

| # | Action | Effort | Reports |
|---|--------|--------|---------|
| 32 | Create OG images for all sites | 2h | SEO-1 |
| 33 | Auto-compute canonical URLs in BaseLayout | 1h | H-19 |
| 34 | Add Twitter Card meta tags to SEOHead | 30m | SEO |
| 35 | Add Organization schema to all homepages | 2h | H-18 |
| 36 | Create abroad-jobs 404 page | 30m | H-20 |
| 37 | Add abroad-jobs validation schema tests | 4h | TEST-2 |
| 38 | Add Stripe webhook integration tests | 4h | TEST-2 |
| 39 | Add admin middleware unit tests | 3h | QA |
| 40 | Replace source-scanning tests with behavioral tests | 8h | TEST-1 |
| 41 | Sanitize CMS HTML content before rendering | 2h | SEC-6 |
| 42 | Write GDPR-compliant privacy policy template | 4h | H-15 |
| 43 | Add consent checkbox to JobPostForm | 1h | Compliance |
| 44 | Add data deletion endpoint for abroad-jobs | 3h | COMP-2 |
| 45 | Fix broken media preview endpoint in admin | 2h | H-35 |
| 46 | Wire up 4 orphaned admin API endpoints to UI | 4h | H-36 |
| 47 | Make admin editor responsive for mobile | 4h | H-37 |
| 48 | Add Disallow: /api/ to abroad-jobs robots.txt | 5m | SEO |
| 49 | Change MobileNav from client:load to client:idle | 5m | H-03 |
| 50 | Add audit trail for admin actions | 4h | H-29 |

### Phase 4: Scale, Design System, Revenue & Polish (Month 2-3)

| # | Action | Effort | Reports |
|---|--------|--------|---------|
| 51 | Create per-site CI/CD deploy workflows | 4h | H-21 |
| 52 | Create scoped Cloudflare tokens per site | 2h | TENANT-1 |
| 53 | Implement path sandboxing for admin file ops | 4h | TENANT-2 |
| 54 | Add RBAC to admin | 1w | TENANT-2, Multi-tenancy |
| 55 | Build missing design system components (Breadcrumbs, Tabs, Modal, Pagination) | 2w | Design System |
| 56 | Add dark mode support to design system | 1w | Design System |
| 57 | Fix LogoCloud scrolling variant | 2h | H-39 |
| 58 | Add React Error Boundaries to all islands | 3h | Error Resilience |
| 59 | Add composite D1 indexes | 1h | Performance, Database |
| 60 | Remove mermaid from admin; pre-render diagrams | 3h | Performance |
| 61 | Add Docker network isolation per client | 1h | Infrastructure, Multi-tenancy |
| 62 | Multi-stage Dockerfile | 3h | Infrastructure |
| 63 | Add SPF/DKIM/DMARC DNS records | 1h | H-16 |
| 64 | Add email retry mechanism for webhook confirmations | 4h | H-17 |
| 65 | Implement post-creation theme editing UI | 1w | H-22 |
| 66 | Add export UI button and D1 data export | 3d | H-23 |
| 67 | Add Stripe refund/dispute webhook handlers | 4h | H-27, H-34 |
| 68 | Implement agency client billing (Stripe Connect or recurring) | 2w | BILL-1 |
| 69 | Add revenue tracking dashboard | 1w | BILL-1 |
| 70 | Centralize pricing configuration | 2h | BILL-1 |
| 71 | Define Zod schemas alongside TypeScript types (z.infer) | 1w | Architecture |
| 72 | Add build queue with concurrency limit | 4h | Scalability |
| 73 | Create operational runbooks | 4h | Error Resilience |
| 74 | Add PWA manifest and basic service worker | 3d | PWA |
| 75 | Stop leaking global env to child processes | 2h | H-38 |
| 76 | Add backup verification (automated restore test) | 4h | BACKUP-1 |

---

## 8. Platform Health Scorecard

| Area | Grade | Rationale |
|------|-------|-----------|
| **Architecture** | B+ | Clean package boundaries, acyclic deps, elegant override plugin. Weakened by dual lockfiles and code duplication. |
| **TypeScript Quality** | A | Zero `any`, zero `@ts-ignore`, strict mode everywhere, good type inference. |
| **Component Design** | B | Strong variant system, proper props interfaces, good token usage. Only 19 components; missing critical ones (Modal, Tabs, Breadcrumbs). No dark mode. |
| **Security** | D | Good fundamentals (Zod, CSP, webhook verification) undermined by committed secrets, missing CSRF, FTS5 injection, open import endpoint, single-token multi-tenancy. |
| **Authentication** | C+ | Sound SSO architecture via BetterAuth. No CSRF, no session caching, no role-based access, no fallback on auth outage. |
| **Testing** | D | Exists but 60% false confidence. Zero tests on revenue-critical site. No cross-browser, no visual regression. |
| **Performance** | C | Astro islands architecture is correct. Render-blocking fonts, no D1 batching, no SSR caching, 3MB mermaid in admin, near-zero Cache-Control usage. |
| **SEO** | C | Good infrastructure (SEOHead, structured data plumbing). No canonical URLs, no Twitter cards, broken OG images, missing structured data. |
| **Accessibility** | C | Skip link, MobileNav done right, semantic HTML. But empty alt text on meaningful images, missing focus traps on mobile navs. |
| **Infrastructure** | D+ | Functional but not hardened. No health checks, no resource limits, no monitoring, PostgreSQL exposed, root Docker user, non-functional backups. |
| **GDPR Compliance** | D | GA loads without consent, no data deletion, incomplete privacy policies, no consent records. Active legal risk. |
| **Email** | D+ | Contact form 404s on every site. No retry on failed emails. No SPF/DKIM/DMARC. No HTML templates. |
| **Error Resilience** | D- | Zero retry, zero circuit breakers, zero timeouts. Auth outage = total lockout. Payment data consistency at risk. 80+ empty catch blocks. |
| **Logging & Observability** | F | No logging library. No Sentry. No Betterstack. No audit trail. 80+ swallowed errors. Ephemeral Workers logs. Total blindness. |
| **Caching** | D | 2 of hundreds of responses set Cache-Control. No CDN config. No SSR caching. Auth fetches uncached on every request. |
| **Documentation** | B- | CLAUDE.md is excellent. But npm/pnpm confusion, stale auth references, missing .env.example, docs claim tools that don't exist. |
| **i18n** | F | Zero infrastructure. 200+ hardcoded English strings. No translation files, no locale routing, no RTL support. |
| **Multi-tenancy** | D | Single Cloudflare token for all sites. No RBAC. No filesystem sandboxing. Env leaks to child processes. Ports exposed publicly. |
| **Design System** | D+ | 19 components with good variant system. Insufficient for agency diversity. Zero dark mode. Missing critical interactive and navigation components. |
| **Admin UI** | C- | Functional wizard and dashboard. 7 broken API routes, orphaned endpoints, broken media preview, unusable on mobile. |
| **PWA & Offline** | F | Zero PWA capability. No manifest, no service worker, no installable experience. Missing theme-color, apple-touch-icon. |
| **Backup & Recovery** | F | All backup scripts non-functional. No D1 backup. No scheduling. No verification. VPS failure = total data loss. |
| **Billing & Revenue** | F | Zero agency billing. abroad-jobs checkout only. No refunds, no VAT, hardcoded prices, no revenue tracking. |
| **Business Logic** | D | Cron without handler, race conditions, orphan data, XSS vectors, FTS injection. Core payment flow has transaction safety issues. |
| **Scalability** | C | Works at 5 sites. First hard limits around 10-15 sites (build concurrency, VPS memory, no per-site CI). |
| **Cost Efficiency** | A- | EUR 15-25/month total. 1 job posting covers all infra. 99% Cloudflare headroom. No billing automation though. |
| **Portability** | B | Astro is portable. Low lock-in on most services. D1+FTS5 is the hardest migration (2-4 weeks to PostgreSQL). |

---

## 9. Report Index

| # | Report | File | Summary |
|---|--------|------|---------|
| 1 | UI/UX | `ui-ux-review.md` | 3C/7H/12M. Map API key placeholder, empty alt text on meaningful images, abroad-jobs nav accessibility regression. |
| 2 | Frontend Development | `frontend-dev-review.md` | 3C/8H/12M. XSS via set:html, raw img tags, duplicated types, import endpoint auth bypass. |
| 3 | QA & Testing | `qa-testing-review.md` | 3C/4H/6M. 60% source-scanning tests, zero abroad-jobs tests, no auth tests. |
| 4 | Infrastructure | `infrastructure-review.md` | 3C/8H/9M. PostgreSQL exposed, root Docker, npm/pnpm CI mismatch, no backups scheduled. |
| 5 | Authentication | `authentication-review.md` | 2C/4H/5M. Committed credentials, no CSRF, open redirect, no rate limiting. |
| 6 | Security | `security-review.md` | 3C/5H/8M. FTS5 injection, stored XSS via applyUrl, unsanitized CMS content, shell injection in setup script. |
| 7 | Performance | `performance-resource-review.md` | 2C/4H/8M. 3MB mermaid in admin, render-blocking fonts, N+1 import queries, no SSR caching. |
| 8 | Database & Data | `database-data-review.md` | 2C/5H/8M. Non-transactional checkout, FTS5 injection, no expiry cleanup, N+1 import, no D1 backup. |
| 9 | SEO & Web Standards | `seo-web-standards-review.md` | 3C/6H/8M. Missing OG images, no canonical URLs, no Twitter cards, no structured data, broken salary schema. |
| 10 | API & Integrations | `api-integrations-review.md` | 4C/8H/11M. FTS injection, open import, no rate limiting, no CORS, no timeouts, checkout before payment. |
| 11 | Architecture | `architecture-review.md` | 2C/5H/7M. Committed secrets, dual lockfiles, duplicated code, schema parser concurrency bug. |
| 12 | DX & Documentation | `dx-documentation-review.md` | 4C/6H/10M. npm/pnpm confusion, CLI generates Tailwind v3, stale auth references, missing .env.example. |
| 13 | Compliance & Privacy | `compliance-privacy-review.md` | 3C/5H/7M. GA without consent, no data deletion, incomplete privacy policies, no DPAs signed. |
| 14 | Email Deliverability | `email-deliverability-review.md` | 2C/5H/5M. Contact form 404, no email retry, no SPF/DKIM/DMARC, no HTML templates. |
| 15 | Cloudflare Platform | `cloudflare-platform-review.md` | 3C/5H/6M. No D1 batching, sequential queries hit subrequest limits, cron trigger without handler. |
| 16 | Content Audit | `content-audit-review.md` | 5C/11H/8M. Missing OG images, wrong Athena content, placeholder legal pages, missing favicon. |
| 17 | i18n | `i18n-review.md` | 2C/4H/4M. Zero i18n infrastructure, 200+ hardcoded strings, English-only country names, no hreflang. |
| 18 | Error Resilience | `error-resilience-review.md` | 4C/7H/8M. Auth lockout, non-transactional checkout, zero monitoring, no timeouts, no error boundaries. |
| 19 | Scalability | `scalability-review.md` | 0C/4H/5M. First limits at 10-15 sites: build concurrency, VPS memory, no per-site CI. |
| 20 | Migration & Portability | `migration-portability-review.md` | 0C/0H/3M. Moderate portability. D1+FTS5 is hardest migration. Most services easily swappable. |
| 21 | Site Lifecycle | `site-lifecycle-review.md` | 5C/7H/9M. No creation rollback, fire-and-forget deploy, brittle config parser, no concurrency lock. |
| 22 | Resource & Cost | `resource-cost-review.md` | 3C/4H/6M. No Docker limits, no refund handling, no billing infrastructure, no revenue tracking. |
| 23 | Dependency & Supply Chain | `dependency-supply-chain-review.md` | 2C/6H/7M. Dual lockfiles, npm in CI, unpinned pnpm, Node version mismatch, unused deps. |
| 24 | Template Completeness | `template-completeness-review.md` | 3C/4H/3M. Contact form 404, missing OG images, CookieConsent orphaned, generic favicons. |
| 25 | Customization | `customization-review.md` | 1C/3H/3M. No post-creation theme UI, visual editor undiscoverable, no color picker. |
| 26 | Export & Migration | `export-migration-review.md` | 2C/4H/4M. Export API without UI, no D1 export, no offboarding docs, no version rollback UI. |
| 27 | Analytics & Script Management | `analytics-scripts-review.md` | 3C/5H/5M. No script management system, GA loads without consent, zero analytics on all live sites, no GTM, no event tracking. |
| 28 | Logging & Observability | *(findings only)* | 6C/4H/3M. Level 0 maturity. No logging library, no Sentry deployed, no audit trail, 80+ empty catch blocks, ephemeral Workers logs, no Betterstack. |
| 29 | Caching Strategy | *(findings only)* | 3C/5H/3M. Grade D. Only 2 responses set Cache-Control. No SSR caching, no Directus caching, no static asset cache headers, uncached auth fetch on every request. |
| 30 | Business Logic | *(findings only)* | 6C/12H/15M. Cron trigger with no handler. No refund/dispute webhook. Race condition: webhook before DB insert. Orphan pending jobs. FTS5 injection. XSS via applyUrl. |
| 31 | Design System | *(findings only)* | Rated 4.4/10. 19 components insufficient for agency work. Zero dark mode. Animation 2/10. Missing Breadcrumbs, Tabs, Modal, Pagination, Blog components. LogoCloud scrolling broken. Map API key placeholder. |
| 32 | Multi-tenancy | *(findings only)* | 2C/6H/8M. Single Cloudflare token for all sites. Unrestricted admin filesystem access. Directus ports exposed. No RBAC. Global env leaked to child processes. |
| 33 | Admin UI Audit | *(findings only)* | 2C/9H/14M. 7 API routes missing prerender=false. Broken media preview. 4 orphaned API endpoints. Export returns manifest only. Editor unusable on mobile. |
| 34 | PWA & Offline | *(findings only)* | Rated 0/10. Zero PWA capability. No manifest, no service worker, not installable. Missing theme-color, apple-touch-icon. Estimated Lighthouse PWA ~25/100. |
| 35 | Backup Verification | *(findings only)* | 8C. Backup infrastructure NON-FUNCTIONAL. pg_backup.sh can't reach Docker. uploads_backup.sh targets nonexistent path. restore.sh inoperable. No D1 backup. No scheduling. No verification. |
| 36 | Billing & Revenue | *(findings only)* | 6C. Zero agency client billing. abroad-jobs checkout only. No refund handler. No VAT/tax. Price hardcoded in 2 places. No revenue tracking. No payment history. |

---

*Generated 2026-03-23. Covers 36 specialized review reports with ~430 raw findings deduplicated to ~130 unique issues.*
