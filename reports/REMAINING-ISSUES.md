# Remaining Unfixed Issues

**Generated:** 2026-03-23
**Source:** All 36 review reports cross-referenced against FIX-LOG.md
**Total fixed:** 69 issues (59 DONE, 9 PARTIAL, 1 deferred)
**Total remaining:** ~190 unfixed issues catalogued below

---

## How to read this document

Each issue includes:
- **Source report(s)** where it was identified
- **Description** of the problem
- **File(s)** affected
- **Fixability** classification

Issues that were PARTIALLY fixed in the fix log are noted with what remains.

---

## 1. CODE-FIXABLE ISSUES (can be done with code changes now)

### 1.1 Security

| # | Issue | Source Report(s) | File(s) | Notes |
|---|-------|-----------------|---------|-------|
| 1 | Shell injection in setup-vps.sh password interpolation | security-review H-5, infrastructure-review CRIT-3 | `infra/admin/setup-vps.sh` | Pass password via env var to Docker instead of interpolating into shell string |
| 2 | No CORS headers on admin API routes | security-review M-2, api-integrations M-8 | `sites/admin/src/pages/api/*` | Add explicit CORS headers restricting to admin origin |
| 3 | Error messages leak internal details to clients | security-review M-3/M-4, api-integrations H-6, authentication L-1, admin-ui M-3 | Multiple API routes: `create.ts`, `custom-domain.ts`, `config.ts`, `import.ts`, `webhook.ts` | Return generic messages to clients, log details server-side |
| 4 | structuredData uses .passthrough() allowing arbitrary JSON | security-review M-5, admin-ui M-4 | `sites/admin/src/pages/api/sites/create.ts` | Define allowed structured data fields explicitly |
| 5 | Docker entrypoint writes secrets to plaintext JSON | security-review M-6, admin-ui L-5 | `docker-entrypoint.sh` | Set chmod 600 on runtime-env.json or refactor to read from process.env |
| 6 | CSP allows unsafe-inline for styles | security-review M-7, infrastructure-review MED-9 | All `public/_headers` files | Document risk acceptance or implement nonces |
| 7 | companyWebsite rendered as link without URL validation | security-review M-8 | `sites/abroad-jobs/src/pages/jobs/[slug].astro` | Check URL starts with `http` before rendering |
| 8 | No file content validation (magic bytes) on image upload | security-review L-2, api-integrations M-7 | `sites/admin/src/pages/api/sites/[slug]/media.ts` | Add magic byte validation for common image formats |
| 9 | Provisioning script sources untrusted .env file | security-review L-4 | `infra/provisioning/provision-cms.sh` | Parse .env line-by-line with `read` instead of sourcing |
| 10 | D1 database ID exposed in wrangler.toml | security-review L-5 | `sites/abroad-jobs/wrangler.toml` | Use environment variable substitution |
| 11 | `/api/auth/` prefix still in public routes list (unused) | authentication-review M1 | `sites/admin/src/middleware.ts` | Remove `/api/auth/` from PUBLIC_PREFIXES |
| 12 | No role-based access control in admin | authentication-review M3, multi-tenancy H-2, admin-ui H-1 | `sites/admin/src/middleware.ts` | Add role checking on API routes |
| 13 | Logout does not clear local state on failure | authentication-review L3 | `sites/admin/src/layouts/AdminLayout.astro` | Add error handling and cookie clearing fallback |
| 14 | Admin security headers not configured | authentication-review L4 | `sites/admin/` (no _headers or middleware headers) | Add security headers via Astro middleware or Caddy |
| 15 | Auth middleware redirect parameter vulnerable to host manipulation | authentication-review H4 | `sites/admin/src/middleware.ts` | Construct redirect from known-safe components |
| 16 | Auth session cookie forwarding leaks all cookies | api-integrations M8 | `sites/admin/src/middleware.ts` | Extract only the session cookie by name |
| 17 | No request size limits on API routes | api-integrations M9 | `sites/abroad-jobs/src/pages/api/checkout.ts`, `sites/admin/src/pages/api/sites/create.ts` | Add Content-Length checks before parsing |
| 18 | Deploy metadata written without file locking | api-integrations H5, site-lifecycle H-4 | `sites/admin/src/lib/deploy.ts` | Use temp file + rename pattern for atomicity |
| 19 | No CORS headers on abroad-jobs API routes | api-integrations H1, compliance M4, frontend-dev M7 | `sites/abroad-jobs/src/pages/api/*` | Add explicit Access-Control-Allow-Origin |
| 20 | Cloudflare API calls have no timeout or retry | api-integrations H4, error-resilience H1 | `sites/admin/src/lib/cloudflare.ts` | Add AbortController timeout + retry with exponential backoff |
| 21 | mapRawJob uses unsafe type assertions | database-data-review M2 | `sites/abroad-jobs/src/lib/db.ts` | Add runtime validation or zod parsing |
| 22 | Slug collision resolution has race condition | database-data-review M3 | `sites/abroad-jobs/src/lib/import-jobs.ts`, `checkout.ts` | Use INSERT ON CONFLICT or UUID-based slug suffix |
| 23 | Duplicated query logic between index.astro and api/jobs.ts | database-data-review M4, business-logic M, performance M-3 | `sites/abroad-jobs/src/pages/index.astro`, `api/jobs.ts` | Extract shared query function into `src/lib/db.ts` |
| 24 | Restore script does not stop Directus before restore | infrastructure-review MED-6 | `infra/backups/restore.sh` | Stop Directus container before restore, restart after |
| 25 | No D1 backup strategy | database-data-review M7, export-migration EXP-C2, backup-verification C-4 | None exists | Create D1 export script using `wrangler d1 export` |
| 26 | Restore script does not drop/recreate database | database-data-review M8 | `infra/backups/restore.sh` | Add --clean flag or drop/recreate before restore |
| 27 | WithSidebar layout leaks props to BaseLayout | frontend-dev M1 | `packages/ui/src/layouts/WithSidebar.astro` | Use `layoutProps` spread instead of `Astro.props` |
| 28 | Schema parser uses module-level mutable state | frontend-dev M3, architecture H4 | `packages/utils/src/schema-parser.ts` | Pass nextId as parameter through call chain |
| 29 | Missing Error Boundaries in admin islands (SiteWizard, SiteEditor, SiteDetail) | frontend-dev M4, error-resilience M1 | Admin island files | Note: ErrorBoundary was created and added to ContactForm/MobileNav/CookieConsent but NOT to admin islands |
| 30 | Abroad-jobs Nav missing keyboard accessibility | frontend-dev M5, ui-ux CRIT-03 | `sites/abroad-jobs/src/components/Nav.astro` | Add aria-expanded, aria-controls, escape key, focus trap |
| 31 | Editor bridge postMessage uses wildcard origin | frontend-dev M9, architecture M3 | `packages/utils/src/vite-editor-bridge.ts` | Use specific admin origin instead of '*' |
| 32 | Stripe Checkout metadata contains empty sessionId | frontend-dev M11, api-integrations H2, business-logic H | `sites/abroad-jobs/src/pages/api/checkout.ts`, `src/lib/stripe.ts` | Remove unused sessionId parameter from createCheckoutParams |
| 33 | Database queries constructed as raw strings in index page | frontend-dev M12 | `sites/abroad-jobs/src/pages/index.astro` | Extract to shared query builder function |
| 34 | Missing key prop uses array index in JobPostForm | frontend-dev L4 | `sites/abroad-jobs/src/islands/JobPostForm.tsx` | Use stable unique ID (counter or crypto.randomUUID()) |
| 35 | LoadMore silently swallows fetch errors | frontend-dev L5, error-resilience M8 | `sites/abroad-jobs/src/islands/LoadMore.tsx` | Add error state with "Failed to load" message and retry |
| 36 | Repeated input class strings in JobPostForm | frontend-dev L7 | `sites/abroad-jobs/src/islands/JobPostForm.tsx` | Extract to a constant |
| 37 | BlogPost layout uses raw `<img>` instead of Astro Image | frontend-dev H2, performance L-3 | `packages/ui/src/layouts/BlogPost.astro` | Use Astro `<Image />` component |
| 38 | Hero component uses raw `<img>` tags | frontend-dev H3, performance L-3 | `packages/ui/src/components/Hero.astro` | Use Astro `<Image />` component |
| 39 | SearchHero duplicates industries array | frontend-dev H8 | `sites/abroad-jobs/src/components/SearchHero.astro` | Change `import type` to value import of INDUSTRIES |
| 40 | Mermaid ships ~3MB of JS chunks to admin | performance C-1, dependency M1 | `sites/admin/package.json` | Load from CDN or pre-render as SVG |
| 41 | Duplicate CSS files in abroad-jobs build output | performance H-2 | Build output | Investigate CSS splitting; import CSS only in layout |
| 42 | LoadMore island duplicates JobCard rendering logic | performance M-1, ui-ux HIGH-07 | `sites/abroad-jobs/src/islands/LoadMore.tsx` | Return pre-rendered HTML from API or share React component |
| 43 | Homepage executes two separate DB queries instead of one | performance M-2 | `sites/abroad-jobs/src/pages/index.astro` | Use D1 batch or remove count query |
| 44 | Google favicon API used for company logos (privacy + dependency) | performance M-6 | `sites/abroad-jobs/src/lib/countries.ts`, `LoadMore.tsx` | Cache favicons server-side during import |
| 45 | JobPostForm imports zod on client side (~30KB) | performance M-8 | `sites/abroad-jobs/src/islands/JobPostForm.tsx` | Replace with lightweight imperative validation |
| 46 | No fetchpriority="high" on above-the-fold images | performance L-2 | `packages/ui/src/components/Hero.astro` | Add `fetchpriority="high"` to hero images |
| 47 | Video hero variant has no poster attribute | performance L-6 | `packages/ui/src/components/Hero.astro` | Add `poster` prop |
| 48 | SiteWizard.tsx is 1560 lines | performance L-7 | `sites/admin/src/islands/SiteWizard.tsx` | Split into step sub-components with React.lazy |
| 49 | Flag CDN images (flagcdn.com) with no fallback | performance L-5 | `sites/abroad-jobs/src/lib/countries.ts` | Self-host commonly used flags |
| 50 | Features alternating variant uses invalid CSS class | ui-ux MED-03 | `packages/ui/src/components/Features.astro` | Remove dead `lg:direction-rtl` class |
| 51 | BlogPost layout uses image title as alt text | ui-ux MED-04 | `packages/ui/src/layouts/BlogPost.astro` | Add optional `featuredImageAlt` prop |
| 52 | Admin logout button has no loading state | ui-ux MED-05 | `sites/admin/src/layouts/AdminLayout.astro` | Disable button and show "Logging out..." |
| 53 | SiteWizard step labels hidden on mobile | ui-ux MED-06 | `sites/admin/src/islands/SiteWizard.tsx` | Show condensed label on mobile |
| 54 | SiteWizard step connector line uses negative margin hack | ui-ux MED-07 | `sites/admin/src/islands/SiteWizard.tsx` | Use flexbox alignment |
| 55 | Timeline alternating variant dot hidden on mobile | ui-ux MED-08 | `packages/ui/src/components/Timeline.astro` | Show left-aligned timeline on mobile |
| 56 | PricingTable "Popular" badge text hardcoded | ui-ux MED-09 | `packages/ui/src/components/PricingTable.astro` | Add `highlightedLabel` field |
| 57 | SearchHero select has poor contrast on dark background | ui-ux MED-10 | `sites/abroad-jobs/src/components/SearchHero.astro` | Test and adjust contrast ratios |
| 58 | Admin SiteTable uses undefined color token (danger-500) | ui-ux MED-11 | `sites/admin/src/islands/SiteTable.tsx` | Use standard Tailwind or add custom token |
| 59 | Admin components use undefined warning-100/700 tokens | ui-ux MED-12 | `sites/admin/src/islands/SiteTable.tsx`, `SiteDetail.tsx` | Add full warning color scale to admin theme |
| 60 | OpeningHours heading hardcoded | ui-ux LOW-01, design-system | `packages/ui/src/components/OpeningHours.astro` | Accept heading prop |
| 61 | CookieConsent banner lacks focus management | ui-ux LOW-02 | `packages/ui/src/islands/CookieConsent.tsx` | Auto-focus first button when banner appears |
| 62 | CardGrid link cards missing focus styles | ui-ux LOW-06 | `packages/ui/src/components/CardGrid.astro` | Add focus-visible ring classes |
| 63 | JobPostForm labels not associated with inputs (some fields) | ui-ux LOW-07 | `sites/abroad-jobs/src/islands/JobPostForm.tsx` | Add unique id and htmlFor pairs |
| 64 | Admin sidebar nav lacks aria-current | ui-ux LOW-08 | `sites/admin/src/layouts/AdminLayout.astro` | Add `aria-current="page"` to active links |
| 65 | FAQ summary elements hide native browser marker | ui-ux LOW-09 | `packages/ui/src/components/FAQ.astro` | Use `[&::-webkit-details-marker]:hidden` |
| 66 | Testimonials carousel has no navigation controls | ui-ux HIGH-04, design-system | `packages/ui/src/components/Testimonials.astro` | Add prev/next buttons with aria-labels |
| 67 | Admin dashboard stats loaded via DOM manipulation without loading state | ui-ux HIGH-05 | `sites/admin/src/pages/index.astro` | Add loading skeleton and error state |
| 68 | Admin sidebar no focus trap on mobile | ui-ux HIGH-06 | `sites/admin/src/layouts/AdminLayout.astro` | Add focus trap and escape key handler |
| 69 | ContactSection has hardcoded English text | ui-ux HIGH-03, design-system | `packages/ui/src/components/ContactSection.astro` | Accept heading/description props |
| 70 | Directus CORS not explicitly configured | security-review L-1, authentication H2 | `infra/docker/*/docker-compose.yml` | Add CORS_ORIGIN, RATE_LIMITER_ENABLED, etc. |
| 71 | No index on stripe_session_id | cloudflare-platform H4 | D1 migrations | Add index migration |
| 72 | Sitemap has no pagination and loads ALL jobs | cloudflare-platform M3 | `sites/abroad-jobs/src/pages/sitemap.xml.ts` | Add LIMIT and sitemap index |
| 73 | Static sites missing nodejs_compat flag in wrangler.toml | cloudflare-platform M5, infrastructure LOW-3 | Template and client wrangler.toml files | Add compatibility_flags |
| 74 | No Reply-To header on emails | email-deliverability H2 | `sites/abroad-jobs/src/lib/email.ts` | Add reply_to field |
| 75 | No HTML email templates (plain text only) | email-deliverability H3 | `sites/abroad-jobs/src/lib/email.ts` | Create HTML templates |
| 76 | Missing RESEND_API_KEY causes crash, not graceful degradation | email-deliverability H5 | `sites/abroad-jobs/src/lib/email.ts` | Validate at startup, skip email if missing |
| 77 | Sender address not configurable per client site | email-deliverability M3 | Email utility | Add email.from to site config |
| 78 | Imported jobs use fake contact email | email-deliverability M5 | Import script | Omit or source from API |
| 79 | No CAN-SPAM footer on emails | email-deliverability L1 | Email templates | Add business address footer |
| 80 | No timeout on Resend API calls | email-deliverability L3 | `sites/abroad-jobs/src/lib/email.ts` | Add AbortController timeout |
| 81 | isLive uses integer instead of boolean mode in Drizzle | database-data-review L1 | `sites/abroad-jobs/src/lib/schema.ts` | Use `integer('is_live', { mode: 'boolean' })` |
| 82 | Seed data has hardcoded expiration timestamps | database-data-review L2 | `sites/abroad-jobs/drizzle/0001_seed.sql` | Use far-future or relative timestamps |
| 83 | Country field is free-text, not normalized | database-data-review L3 | `sites/abroad-jobs/src/lib/schema.ts` | Normalize to controlled list during import/validation |
| 84 | Migrations are not reversible | database-data-review L4 | D1 migration files | Add down.sql counterparts |
| 85 | getPublishedItems does not paginate | database-data-review L5 | `packages/utils/src/directus.ts` | Add sensible default limit |
| 86 | source column application-level default masks DB issues | database-data-review L6 | `sites/abroad-jobs/src/lib/db.ts` | Make source NOT NULL in schema |
| 87 | Duplicated serializePropValue function | architecture H1 | `packages/utils/src/schema-compiler.ts`, `sites/admin/src/lib/generator.ts` | Extract to shared utility |
| 88 | Duplicate getMonorepoRoot() with inconsistent behavior | architecture H2, admin-ui H-3 | `sites/admin/src/lib/generator.ts`, `sites/admin/src/lib/sites.ts` | Consolidate into single module |
| 89 | No build isolation between sites | architecture H3 | Build pipeline | Use `pnpm deploy` for isolated builds |
| 90 | Zod schemas disconnected from TypeScript types | architecture H5 | `packages/config/src/types.ts`, `admin/api/sites/create.ts` | Define Zod schemas alongside types, use z.infer |
| 91 | CLI provisioning generates Tailwind v3 config (project uses v4) | architecture M1, dx-documentation C2 | `infra/provisioning/new-site.sh` | Generate global.css with @theme blocks |
| 92 | Site config template schema mismatch | dx-documentation C3, architecture M6 | `infra/provisioning/templates/site.config.ts.tmpl` | Rewrite to match actual SiteConfig interface |
| 93 | componentOverridePlugin uses synchronous fs.existsSync | architecture M4 | `packages/utils/src/vite-component-override.ts` | Cache directory listing at plugin init |
| 94 | Inconsistent site tier type | architecture M5 | `sites/admin/src/lib/sites.ts`, `generator.ts` | Add tier to SiteConfig |
| 95 | React as direct dependency in @agency/ui (should be peer) | architecture M7 | `packages/ui/package.json` | Move to peerDependencies |
| 96 | Admin site missing @agency/ui path mapping | architecture M2 | `sites/admin/tsconfig.json` | Add path mapping and dependency |
| 97 | Directus image tag not pinned (floating :11) | infrastructure MED-2 | Docker Compose files | Pin to specific minor version |
| 98 | Node.js base image not pinned | infrastructure MED-3 | `Dockerfile` | Pin to specific version |
| 99 | Dockerfile does not use multi-stage build | infrastructure HIGH-7 | `Dockerfile` | Implement multi-stage build |
| 100 | Docker compose files don't use Docker networks for isolation | infrastructure HIGH-8, multi-tenancy M-4 | Docker Compose files | Add per-client isolated networks |
| 101 | Deploy-site workflow only deploys template site | infrastructure HIGH-6, scalability, site-lifecycle H7 | `.github/workflows/deploy-site.yml` | Create per-site or matrix deploy workflow |
| 102 | deploy-directus workflow triggers on all infra/** changes | infrastructure LOW-5 | `.github/workflows/deploy-directus.yml` | Narrow path filter |
| 103 | Lighthouse CI results not uploaded/stored | infrastructure LOW-4 | `.github/workflows/test.yml` | Add artifact upload |
| 104 | No Directus webhook for auto-rebuild on content changes | caching-strategy H5 | Docker Compose files | Configure Directus Flow |
| 105 | Admin auth URL uses build-time env, middleware uses runtime env | frontend-dev M8 | `sites/admin/src/layouts/AdminLayout.astro` | Inject auth URL server-side |
| 106 | Deprecated `version` key in docker-compose files | infrastructure LOW-1 | Docker Compose files | Remove `version: "3.8"` |
| 107 | deploy.ts fire-and-forget can leave status stuck | site-lifecycle C2, admin-ui C-3, business-logic H | `sites/admin/src/lib/deploy.ts` | Always write final status in try/catch |
| 108 | No rollback on failed site creation | site-lifecycle C1 | `sites/admin/src/lib/generator.ts` | Clean up files and revert pnpm-workspace on failure |
| 109 | Config parser uses brittle regex to parse TypeScript | site-lifecycle C3 | `sites/admin/src/pages/api/sites/[slug]/config.ts` | Use TypeScript AST parsing or store config as JSON |
| 110 | No concurrency protection on deploys | site-lifecycle C5, admin-ui H-2, multi-tenancy H-4 | Deploy pipeline | Add filesystem lock or mutex |
| 111 | No slug reserved name blocklist | business-logic H, admin-ui H-7 | `sites/admin/src/lib/generator.ts` | Add comprehensive blocklist |
| 112 | No deletion confirmation mechanism | admin-ui M-5, business-logic M | `sites/admin/src/pages/api/sites/[slug]/delete.ts` | Add two-step confirmation |
| 113 | Template copy includes hidden files (.git) | admin-ui M-6 | `sites/admin/src/lib/generator.ts` | Exclude .git, .deploy.json from copy |
| 114 | Custom domain has no format validation | admin-ui M-7, business-logic M | `sites/admin/src/pages/api/sites/[slug]/custom-domain.ts` | Add hostname format validation |
| 115 | Wrangler version not pinned in deploy | admin-ui M-8, business-logic M | `sites/admin/src/lib/deploy.ts` | Pin wrangler version |
| 116 | Color validator exists but never called | admin-ui H-6 | `sites/admin/src/lib/generator.ts` | Call validateColor() on wizard inputs |
| 117 | Dev server processes inherit full admin environment | multi-tenancy H-5, admin-ui H-5 | `sites/admin/src/lib/dev-server.ts` | Sanitize env when spawning |
| 118 | Price hardcoded in two separate files | business-logic M, billing H-3 | `stripe.ts` (8900), `JobPostForm.tsx` (89) | Centralize to single config |
| 119 | No typo tolerance in FTS5 search | business-logic H | Search implementation | Consider fuzzy matching or stemming |
| 120 | Job detail page silently redirects expired jobs | business-logic H, error-resilience | `sites/abroad-jobs/src/pages/jobs/[slug].astro` | Show "This job has expired" message |
| 121 | Landing.jobs company name extraction is fragile | business-logic L | `sites/abroad-jobs/src/lib/import-jobs.ts` | Improve parsing logic |
| 122 | fullCountry variable is a no-op | business-logic L | `sites/abroad-jobs/src/lib/import-jobs.ts` | Fix ternary |
| 123 | Success page polls via manual refresh instead of auto-polling | error-resilience L3 | `sites/abroad-jobs/src/pages/success.astro` | Add auto-polling |
| 124 | setup-vps.sh still prompts for removed auth credentials | dx-documentation H5 | `infra/admin/setup-vps.sh` | Remove password/session prompts |
| 125 | docker-entrypoint.sh still writes stale auth vars | dx-documentation H2 | `docker-entrypoint.sh` | Remove ADMIN_PASSWORD_HASH and SESSION_SECRET |
| 126 | Copyright year hardcoded in abroad-jobs footer | frontend-dev L2 | `sites/abroad-jobs/site.config.ts` | Remove hardcoded year |
| 127 | Inconsistent Tailwind breakpoints for mobile nav | frontend-dev L3 | shared vs abroad-jobs Nav | Document or standardize |
| 128 | Webhook does not verify payment amount | billing M-2 | `sites/abroad-jobs/src/pages/api/webhook.ts` | Add amount verification |
| 129 | Backup script --delete flag is dangerous | backup-verification H-6 | `infra/backups/uploads_backup.sh` | Remove --delete flag |
| 130 | No backup encryption | backup-verification H-3 | Backup scripts | Encrypt before upload |
| 131 | No per-client backup separation | backup-verification H-7 | Backup scripts | Use per-client S3 prefixes |
| 132 | No restore post-verification | backup-verification M-4 | `infra/backups/restore.sh` | Add row count/schema check |

### 1.2 Partially Fixed Issues (remaining work)

| # | Fix Log ID | What Was Fixed | What Remains |
|---|-----------|---------------|-------------|
| 133 | SEO-1 (PARTIAL) | Acknowledged | Create branded 1200x630 OG images for each site -- requires design tool |
| 134 | H-07 (PARTIAL) | Backup scripts rewritten | VPS cron scheduling still needed (`crontab -e` with daily run) |
| 135 | TENANT-1 (PARTIAL) | Documented | Create scoped Cloudflare API tokens per site in dashboard |
| 136 | TENANT-2 (PARTIAL) | Slug validation added | Full RBAC implementation and filesystem sandboxing needed |
| 137 | H-36 (PARTIAL) | APIs exist (versions, export, checklist, promote) | UI components need to be built for all 4 endpoints |
| 138 | H-37 (PARTIAL) | Acknowledged | Responsive layout rewrite of admin editor panels needed |

### 1.3 Deferred

| # | Fix Log ID | Issue | Status |
|---|-----------|-------|--------|
| 139 | SEC-1 | Production secrets in git history | Secrets rotation needed. Files still in git history need purging via git filter-repo |

---

## 2. CONFIGURATION ISSUES (need env/DNS/dashboard/infrastructure changes)

| # | Issue | Source Report(s) | What Needs to Happen |
|---|-------|-----------------|---------------------|
| 1 | No SPF/DKIM/DMARC DNS records for email sending domains | email-deliverability H1, MASTER H-16 | Configure DNS records in Cloudflare using values from Resend dashboard |
| 2 | Workers Paid plan needed ($5/month) | cloudflare-platform H2 | Upgrade Cloudflare account for abroad-jobs CPU time limits |
| 3 | No Sentry SDK installed or configured | logging-observability C-2, error-resilience C4 | Run `pnpm add @sentry/node @sentry/cloudflare` + configure DSN via env vars |
| 4 | No Betterstack uptime monitoring configured | logging-observability M-1, error-resilience | Set up monitors in Betterstack dashboard |
| 5 | VPS cron scheduling for backups | infrastructure HIGH-4, MASTER H-07 | Add crontab entries on VPS |
| 6 | Cloudflare Logpush not configured for Workers logs | logging-observability H-4 | Enable in Cloudflare dashboard |
| 7 | No Directus CORS/rate limiting/registration lockdown | authentication H2 | Add env vars to Docker Compose files |
| 8 | S3 bucket may not exist for backups | backup-verification H-1 | Create bucket with versioning + lifecycle policies |
| 9 | No Cloudflare DNS zone export/backup | backup-verification H-4 | Add periodic DNS export |
| 10 | No Stripe webhook configuration backup | backup-verification H-5 | Document Stripe config as code |
| 11 | Zero analytics on all production client sites | analytics-scripts C-3 | Configure Plausible on all sites with proper siteIds |
| 12 | No .dockerignore file | resource-cost L4 | Create .dockerignore excluding node_modules, .git, reports, tests |
| 13 | Docker logs lost on container recreation | logging-observability H-5 | Configure Docker logging driver or mount log volume |
| 14 | No .nvmrc or .node-version file | dependency-supply-chain L1 | Create file with target Node version |
| 15 | Dependabot GitHub Actions interval is monthly | dependency-supply-chain L2 | Change to weekly in `.github/dependabot.yml` |
| 16 | Audit level in CI set to critical only | dependency-supply-chain M7 | Change to `--audit-level=high` |

---

## 3. ARCHITECTURAL ISSUES (need significant design/refactoring work)

| # | Issue | Source Report(s) | Scope |
|---|-------|-----------------|-------|
| 1 | No script management system in SiteConfig | analytics-scripts C-1 | Add customScripts field, admin UI for script injection, CSP auto-generation |
| 2 | No GTM support | analytics-scripts H-1 | Add as 4th provider option |
| 3 | No event tracking anywhere | analytics-scripts H-4 | Create event tracking utilities, add to key interactions |
| 4 | No analytics dashboard in admin | analytics-scripts H-5 | Integrate Plausible/Fathom APIs |
| 5 | No post-creation theme editing UI | customization-review CUS-C1/H3 | Port wizard theme controls to site management page |
| 6 | Visual editor not discoverable | customization-review CUS-H1 | Add prominent "Edit Site" button |
| 7 | Static site content requires code editing | customization-review CUS-H2 | Add inline text editing to visual editor |
| 8 | Visual editor cannot modify CSS theme tokens | customization-review CUS-M1 | Add Theme tab to editor sidebar |
| 9 | No template switching after creation | customization-review CUS-M3 | Build template migration tool |
| 10 | Zero PWA capabilities (no manifest, service worker, offline) | pwa-offline-review (entire report) | Full PWA implementation needed |
| 11 | No dark mode support across design system | design-system-review Section 5 | Define dark tokens, add dark: classes to all components, build ThemeToggle |
| 12 | No scroll-triggered animations | design-system-review Section 6 | Build IntersectionObserver island/directive |
| 13 | No i18n infrastructure at all | i18n-review C1 | Install i18n library, extract strings, add locale detection |
| 14 | Country names English-only on European job board | i18n-review C2 | Translate country names for key EU languages |
| 15 | No agency client billing infrastructure | billing-revenue C-3, resource-cost C3 | Implement Stripe Billing with recurring subscriptions |
| 16 | No revenue tracking or analytics for abroad-jobs | billing-revenue C-3, resource-cost H4 | Add payments table + admin dashboard |
| 17 | No admin payment operations interface | billing-revenue H-2 | Build billing section in admin |
| 18 | No renewal reminder emails | billing-revenue M-5 | Send reminder 7 days before job expiry |
| 19 | No promotional pricing / coupon mechanism | billing-revenue M-4 | Use Stripe Coupons API |
| 20 | No VAT/tax handling | billing-revenue L-3 | Implement Stripe Tax |
| 21 | No bulk pricing tiers | billing-revenue M-3, business-logic L | Add volume discount pricing |
| 22 | Export API has no UI button | export-migration EXP-C1 | Add export button to site management page |
| 23 | Version history API has no UI | export-migration EXP-H3 | Add version history section to site management |
| 24 | No CMS data export UI | export-migration EXP-H2 | Add content export button for CMS sites |
| 25 | No offboarding documentation | export-migration EXP-H1 | Create offboarding checklist |
| 26 | Deploy pipeline has no rollback on partial failure | error-resilience H3 | Track steps and implement compensating actions |
| 27 | No operational runbooks | error-resilience M6 | Create docs/runbooks/ for incident response |
| 28 | No health check endpoints | error-resilience H4, logging-observability M-2 | Add /api/health to admin and abroad-jobs |
| 29 | Build queue with concurrency limit needed | scalability, site-lifecycle C5 | Implement in-memory queue limiting concurrent builds |
| 30 | Database-backed site registry needed at scale | scalability | Replace filesystem scanning with SQLite at 50+ sites |
| 31 | Infrastructure as code (Terraform/Pulumi) | infrastructure long-term | Codify Hetzner/Cloudflare infra |

---

## 4. CONTENT ISSUES (need writing/design work)

| # | Issue | Source Report(s) | What Needs to Happen |
|---|-------|-----------------|---------------------|
| 1 | OG images referenced but don't exist (all sites) | SEO C1, content-audit C1, template-completeness TC-C2 | Create branded 1200x630 images per site |
| 2 | Athena Institute has entirely wrong content (consulting template on education site) | content-audit C2, MASTER H-26 | Full content rewrite needed |
| 3 | abroad-jobs missing favicon | content-audit C5 | Create custom favicon |
| 4 | Template placeholder text not replaced on some sites | content-audit H2 | Review and replace all placeholders |
| 5 | Contact information inconsistent within meridian-properties | content-audit H4 | Audit and fix all contact details |
| 6 | Footer copyright year hardcoded to 2024 on some sites | content-audit H7 | Update to dynamic year |
| 7 | Social media links in footer point to placeholder URLs (#) | content-audit M7 | Add real social media links or remove |
| 8 | No cookie policy page on any site | compliance H-3 (template-completeness), compliance M2 | Create cookies.astro page template |
| 9 | No Data Processing Agreements documented | compliance M5 | Sign DPAs with Cloudflare, Stripe, Resend, Hetzner |
| 10 | No ROPA (Records of Processing Activities) | compliance | Document all processing activities per Art. 30 |
| 11 | No consent withdrawal mechanism (cookie preferences) | compliance M1 | Add cookie preferences link in footer |
| 12 | Athena Institute nav labels don't match URL semantics | seo-web-standards L3 | Rename pages or labels |
| 13 | Template site robots.txt references example.com | seo-web-standards L1, content-audit | Fix placeholder URL |
| 14 | No breadcrumb component in shared library | design-system, seo | Promote from abroad-jobs to shared |
| 15 | Missing ~15 shared components for diverse agency work | design-system Section 2 | Build Pagination, BlogPostCard, GalleryLightbox, Tabs, Modal, etc. |
| 16 | No component documentation/gallery | design-system Section 9 | Build visual component gallery in admin |
| 17 | No shared Nav dropdown support | design-system Section 10 | Implement nested nav items |
| 18 | README documents removed auth routes | dx-documentation H1 | Update README |
| 19 | README admin setup references removed bcrypt/JWT auth | dx-documentation H2 | Update README |
| 20 | Architecture blueprint auth section is stale | dx-documentation M9 | Update or mark as superseded |
| 21 | Template CLAUDE.md references tailwind.config.mjs | dx-documentation M3 | Update to reference global.css |
| 22 | No CONTRIBUTING.md | dx-documentation | Create PR process guide |
| 23 | No PR template | dx-documentation M8 | Create `.github/PULL_REQUEST_TEMPLATE.md` |
| 24 | No per-package README files | dx-documentation | Create for config, ui, utils |
| 25 | No local development prerequisites documented | dx-documentation M6 | Add Prerequisites section to README |
| 26 | abroad-jobs JobPosting salary schema is incorrect | seo-web-standards H6 | Parse salaryRange into minValue/maxValue or omit |

---

## 5. TESTING ISSUES (need new tests written)

| # | Issue | Source Report(s) | What Needs Testing |
|---|-------|-----------------|-------------------|
| 1 | ~100 source-scanning tests provide false confidence | qa-testing CRITICAL-01 | Replace with behavioral tests using proper imports and mocks |
| 2 | abroad-jobs site has zero dedicated tests | qa-testing CRITICAL-02 | Add validation schema tests, webhook tests, search API tests, checkout tests |
| 3 | No tests for admin authentication middleware | qa-testing CRITICAL-03 | Test isPublicRoute(), mock auth service fetch, test redirect behavior |
| 4 | No tests for admin API routes (behavioral) | qa-testing HIGH-01 | Test create, delete, custom-domain with mocked dependencies |
| 5 | E2E tests only cover template site in Chromium | qa-testing HIGH-02 | Add Firefox/WebKit, admin UI E2E, abroad-jobs E2E |
| 6 | No Stripe webhook verification tests | qa-testing HIGH-03 | Test signature verification, activation logic, email handling |
| 7 | Contact API test only tests schema, not route | qa-testing HIGH-04 | Add actual API route integration tests |
| 8 | Lighthouse CI does not test INP metric | qa-testing MEDIUM-01 | Add INP assertion and resource size budgets |
| 9 | No test for Vite component override plugin | qa-testing MEDIUM-02 | Test resolve behavior with mock Vite context |
| 10 | No test for import pipeline security | qa-testing MEDIUM-03 | Test auth enforcement |
| 11 | E2E contact form test may be flaky | qa-testing MEDIUM-04 | Add waitFor, mock API at network level |
| 12 | Accessibility tests only cover 3 pages | qa-testing MEDIUM-05 | Parameterize across all pages and interactive states |
| 13 | No test coverage reporting configured | qa-testing LOW-01 | Add Vitest coverage config with thresholds |
| 14 | No visual regression testing | qa-testing LOW-02 | Add Playwright screenshot comparison |
| 15 | Deploy workflow does not depend on test passing | qa-testing LOW-03 | Add `needs: [test]` or branch protection rules |
| 16 | No automated export testing | export-migration EXP-M2 | Test that exported sites build independently |
| 17 | Playwright config port conflicts with admin | dx-documentation M10 | Use different port for template preview |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Code-fixable issues | 132 |
| Partially fixed (remaining work) | 6 |
| Deferred | 1 |
| Configuration issues | 16 |
| Architectural issues | 31 |
| Content issues | 26 |
| Testing issues | 17 |
| **Total remaining** | **~229** |

Note: Many issues appear in multiple reports. This list is deduplicated -- each issue appears once in its most appropriate category, even if mentioned across 5+ reports.
