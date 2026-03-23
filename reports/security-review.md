# Security Review Report: Infront CMS Platform

**Date:** 2026-03-23
**Reviewer:** Application Security Engineer
**Scope:** Full codebase at `/Users/stefanospetrou/Desktop/Apps/infront-cms`
**Framework:** OWASP Top 10 (2021) + Web Application Security Best Practices

---

## Executive Summary

**Overall Security Posture: MODERATE-HIGH RISK**

The Infront CMS platform demonstrates solid security fundamentals in several areas -- zod validation on most API routes, parameterized queries via Drizzle ORM, proper use of execFile instead of shell-based command execution to prevent command injection, path traversal protections on file upload, and comprehensive security headers on all sites. The authentication model has been migrated to a centralized auth service (BetterAuth at auth.infront.cy), which is a sound architectural choice.

However, the review uncovered **3 Critical**, **5 High**, **8 Medium**, and **6 Low** severity issues. The most urgent are: incomplete FTS5 injection sanitization in the abroad-jobs search, an unvalidated URL field enabling stored XSS, missing CSRF protection across all state-changing API endpoints, and several admin API routes that lack the `prerender = false` directive.

---

## Critical Issues

### C-1: Incomplete FTS5 Query Sanitization (SQLi via FTS Syntax)

**File:** `sites/abroad-jobs/src/pages/api/jobs.ts`, lines 35-36
**CWE:** CWE-89 (SQL Injection)
**OWASP:** A03:2021 - Injection

**Description:** The full-text search query sanitizes single and double quotes but does NOT sanitize FTS5 special operators. SQLite FTS5 has its own query syntax including `*`, `NEAR`, `OR`, `AND`, `NOT`, `{`, `}`, `^`, `"`, and column filters like `title:`. An attacker can inject FTS5 operators to manipulate search results or trigger errors.

The current sanitization only strips quote characters:
```
const ftsQuery = q.replace(/['"]/g, '').trim();
```

**Proof of Concept:** A request to `GET /api/jobs?q=*` or `GET /api/jobs?q=title:hacker OR description:test` would be passed directly to the FTS5 MATCH expression, allowing attackers to craft queries that bypass intended search behavior or cause application errors.

**Recommended Fix:** Remove all FTS5 operators and boolean keywords, then wrap the cleaned input in double quotes for a literal phrase match:
```
const ftsQuery = q
  .replace(/['"*{}^():\-]/g, '')
  .replace(/\b(AND|OR|NOT|NEAR)\b/gi, '')
  .trim();
```

---

### C-2: Missing applyUrl URL Scheme Validation (Stored XSS via javascript: URLs)

**File:** `sites/abroad-jobs/src/lib/validation.ts`, line 30
**File:** `sites/abroad-jobs/src/pages/jobs/[slug].astro`, lines 150-154
**CWE:** CWE-79 (Cross-Site Scripting)
**OWASP:** A03:2021 - Injection

**Description:** The `applyUrl` field in the job posting form accepts `z.string().min(1).max(500)` -- it does NOT enforce a URL scheme whitelist. An attacker who pays EUR 89 for a job listing could submit `applyUrl` with a `javascript:` scheme. This URL is rendered directly in an `<a href>` tag on the job detail page with no sanitization.

The current validation only checks for minimum length (1) and maximum length (500), but does not validate URL format or restrict to safe schemes like `http:`, `https:`, or `mailto:`.

**Recommended Fix:** Add a `.refine()` call to restrict to safe URL schemes:
```
applyUrl: z.string().min(1).max(500).refine(
  (url) => /^(https?:\/\/|mailto:)/i.test(url),
  'Apply URL must start with http://, https://, or mailto:'
),
```

Also validate imported job URLs in `import-jobs.ts`.

---

### C-3: Import API Endpoint Open by Default When IMPORT_SECRET Is Not Set

**File:** `sites/abroad-jobs/src/pages/api/import.ts`, lines 19-21
**CWE:** CWE-306 (Missing Authentication for Critical Function)
**OWASP:** A07:2021 - Identification and Authentication Failures

**Description:** The import endpoint explicitly allows unauthenticated access when `IMPORT_SECRET` is not configured. The code comments confirm this is intentional "for initial testing," but it means if the environment variable is missing or empty, anyone can trigger a bulk import of jobs from external APIs, potentially filling the database with spam data, exhausting D1 write limits, or causing denial of service.

**Recommended Fix:** Always require the secret; return a 500 error if it is not configured rather than silently allowing unauthenticated access.

---

## High Severity Issues

### H-1: No CSRF Protection on Any State-Changing API Endpoint

**Files:** All POST/PUT/DELETE routes in `sites/admin/src/pages/api/` and `sites/abroad-jobs/src/pages/api/`
**CWE:** CWE-352 (Cross-Site Request Forgery)
**OWASP:** A01:2021 - Broken Access Control

**Description:** None of the API routes implement CSRF protection. The admin middleware authenticates via session cookies forwarded to the central auth service, but does not verify a CSRF token. This means a malicious website visited by an authenticated admin could trigger any admin action: create sites, delete sites, modify configs, or trigger deploys.

Critical attack scenarios:
- An attacker embeds a form on a malicious page targeting the site deletion endpoint -- if the admin visits the page, the site is deleted.
- Creating a rogue site deployment via POST to the create endpoint.
- Triggering redeploys that could serve attacker-modified content.

**Recommended Fix:** For API routes consumed by JavaScript (which they all are), require a custom header like `X-Requested-With: XMLHttpRequest` that cannot be set by cross-origin form submissions. Add this check in the middleware for all non-GET API routes.

---

### H-2: Admin API Routes Missing `prerender = false` Directive

**Files:**
- `sites/admin/src/pages/api/sites/create.ts`
- `sites/admin/src/pages/api/sites/index.ts`
- `sites/admin/src/pages/api/sites/[slug]/redeploy.ts`
- `sites/admin/src/pages/api/sites/[slug]/deploy-status.ts`
- `sites/admin/src/pages/api/sites/[slug]/overrides.ts`
- `sites/admin/src/pages/api/sites/[slug]/custom-domain.ts`
- `sites/admin/src/pages/api/templates/index.ts`

**CWE:** CWE-16 (Configuration)
**OWASP:** A05:2021 - Security Misconfiguration

**Description:** Seven admin API routes do not include `export const prerender = false;`. In Astro 6, without this directive, routes may be prerendered at build time rather than handled as server-side endpoints. This could mean the routes are not available at runtime, or they are prerendered with static responses that leak build-time data.

The following routes DO correctly have the directive: `delete.ts`, `export.ts`, `config.ts`, `pages.ts`, `media.ts`, `versions.ts`, `promote.ts`, `checklist.ts`, `dev-server.ts`, `dev-servers.ts`, `[page].ts`, `sections.ts`, `reorder.ts`.

**Recommended Fix:** Add `export const prerender = false;` to all 7 missing API route files.

---

### H-3: Docker Compose Exposes Directus Ports to All Network Interfaces

**Files:**
- `infra/docker/template/docker-compose.yml`, line 7
- `infra/docker/meridian-properties/docker-compose.yml`, line 7
- `infra/docker/atelier-kosta/docker-compose.yml`, line 7

**CWE:** CWE-284 (Improper Access Control)
**OWASP:** A05:2021 - Security Misconfiguration

**Description:** Directus ports are exposed as `${PORT:-8055}:8055`, which binds to `0.0.0.0` (all network interfaces). If the VPS firewall is misconfigured or the containers run on a machine with a public IP, the Directus admin panel and PostgreSQL-backed API become directly accessible from the internet without any reverse proxy or additional authentication layer.

Compare with the admin container which correctly binds only to localhost: `127.0.0.1:4321:4321`.

**Recommended Fix:** Change port binding to `127.0.0.1:${PORT:-8055}:8055` in all Docker Compose files.

---

### H-4: CMS Content Rendered as Raw HTML Without Sanitization

**Files:**
- `sites/meridian-properties/src/pages/[...slug].astro`, line 32
- `sites/meridian-properties/src/pages/properties/[slug].astro`, line 106
- `sites/meridian-properties/src/pages/blog/[slug].astro`, line 36
- `sites/atelier-kosta/src/pages/projects/[slug].astro`, line 74
- `sites/template/src/pages/[...slug].astro`, line 32
- `sites/template/src/pages/blog/[slug].astro`, line 36
- `sites/admin/src/islands/HelpManual.tsx`, line 523

**CWE:** CWE-79 (Cross-Site Scripting)
**OWASP:** A03:2021 - Injection

**Description:** Multiple pages render CMS-sourced HTML content using Astro's `set:html` directive. If a CMS admin account is compromised, or if Directus has an authentication bypass, an attacker could inject malicious JavaScript into CMS content that would run in visitors' browsers.

While the CMS is trusted (only admins can write content), defense-in-depth dictates sanitizing HTML output. A compromised CMS account or XSS in the Directus admin could chain into persistent XSS on all client-facing sites.

**Recommended Fix:** Use a server-side HTML sanitizer like `sanitize-html` before rendering. Configure it to allow standard HTML formatting tags but strip script tags, event handlers, and other executable content.

---

### H-5: Shell Command Injection Vector in VPS Setup Script

**File:** `infra/admin/setup-vps.sh`, line 77
**CWE:** CWE-78 (OS Command Injection)
**OWASP:** A03:2021 - Injection

**Description:** The setup script interpolates user-provided password directly into a shell command string passed to `docker run ... node -e`. The password value `${ADMIN_PASSWORD}` is placed inside single quotes within a double-quoted string, but if the password contains a single quote followed by shell metacharacters, it would break out of the string context and allow arbitrary command execution.

**Recommended Fix:** Pass the password via environment variable to the Docker container instead of interpolating it into the command string:
```
docker run --rm -e "PW=${ADMIN_PASSWORD}" infront-admin \
  node -e "import('bcryptjs').then(b=>b.default.hash(process.env.PW,10).then(console.log))"
```

---

## Medium Severity Issues

### M-1: No Rate Limiting on Any API Endpoint

**Files:** All API routes in `sites/admin/src/pages/api/` and `sites/abroad-jobs/src/pages/api/`
**CWE:** CWE-770 (Allocation of Resources Without Limits)
**OWASP:** A04:2021 - Insecure Design

**Description:** Despite the documentation (CLAUDE.md and prd.md) claiming rate limiting is implemented, no actual rate limiting exists in the codebase. The checkout endpoint, job search, import trigger, and all admin endpoints can be called without any throttling. This enables brute-force enumeration, spam checkout sessions, DoS via the import endpoint, and exhaustion of Cloudflare API rate limits.

**Recommended Fix:** Implement per-IP sliding window rate limiting. For Cloudflare Workers, use D1 or in-memory counters. For the admin Node.js server, use middleware-based rate limiting with an in-memory Map.

---

### M-2: No CORS Headers on Admin API Routes

**Files:** All routes in `sites/admin/src/pages/api/`
**CWE:** CWE-942 (Permissive Cross-domain Policy)
**OWASP:** A05:2021 - Security Misconfiguration

**Description:** Admin API responses do not include any CORS headers. While browsers default to same-origin (which is restrictive), simple POST requests from cross-origin forms (which do not trigger CORS preflight) can still reach the server. Explicit CORS headers would provide defense-in-depth.

**Recommended Fix:** Add explicit CORS headers in the middleware that restrict API access to the admin origin only.

---

### M-3: Error Messages Leak Internal Details

**Files:** Multiple API routes
**CWE:** CWE-209 (Information Exposure Through an Error Message)
**OWASP:** A04:2021 - Insecure Design

**Description:** Several API routes expose `err.message` directly to the client in error responses. Locations include:

- `sites/admin/src/pages/api/sites/create.ts`, line 204
- `sites/admin/src/pages/api/sites/[slug]/custom-domain.ts`, lines 53, 99
- `sites/admin/src/pages/api/sites/[slug]/config.ts`, line 219
- `sites/abroad-jobs/src/pages/api/import.ts`, line 31
- `sites/abroad-jobs/src/pages/api/webhook.ts`, line 30

Internal error messages can reveal file paths, database structure, or infrastructure details that aid further attacks.

**Recommended Fix:** Log detailed errors server-side but return generic "Internal server error" messages to clients.

---

### M-4: Stripe Webhook Error Leaks Verification Failure Details

**File:** `sites/abroad-jobs/src/pages/api/webhook.ts`, lines 28-31
**CWE:** CWE-209 (Information Exposure)

**Description:** The webhook endpoint returns the exact Stripe signature verification error message to the caller. This could help an attacker understand why their forged webhook failed and iteratively improve their attack.

**Recommended Fix:** Log the detailed error server-side and return a generic "Invalid webhook signature" message to the client.

---

### M-5: structuredData Field Uses .passthrough() Allowing Arbitrary Data

**File:** `sites/admin/src/pages/api/sites/create.ts`, lines 71-76
**CWE:** CWE-20 (Improper Input Validation)

**Description:** The `structuredData` field in the site creation schema uses `.passthrough()`, allowing any arbitrary JSON to pass through validation and be written into generated `site.config.ts` files. While data is JSON-serialized (preventing direct code injection), misleading structured data could be injected that search engines would index.

**Recommended Fix:** Define allowed structured data fields explicitly or validate the shape more strictly.

---

### M-6: Docker Entrypoint Writes Secrets to Plaintext JSON File

**File:** `docker-entrypoint.sh`, lines 5-13
**CWE:** CWE-312 (Cleartext Storage of Sensitive Information)
**OWASP:** A02:2021 - Cryptographic Failures

**Description:** The Docker entrypoint writes all secrets (including `CLOUDFLARE_API_TOKEN`, `SESSION_SECRET`, and `ADMIN_PASSWORD_HASH`) to a plaintext JSON file at `/app/runtime-env.json`. This file persists on disk, is readable by any process in the container, and could be exposed via path traversal or debugging dumps.

**Recommended Fix:** Set restrictive file permissions (chmod 600) on the file, and consider refactoring `env.ts` to read from `process.env` directly in Docker environments.

---

### M-7: CSP Allows unsafe-inline for Styles Across All Sites

**Files:** All `public/_headers` files
**CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers)
**OWASP:** A05:2021 - Security Misconfiguration

**Description:** All Content Security Policy headers include `style-src 'self' 'unsafe-inline'`. While less dangerous than for scripts, this weakens the CSP and allows CSS injection attacks. The abroad-jobs `_headers` also allows `img-src 'self' data: https:` which is broadly permissive.

**Recommended Fix:** If Tailwind requires `unsafe-inline`, document the risk acceptance. Consider restricting `img-src` to known domains.

---

### M-8: companyWebsite Rendered as Link Without URL Validation on Job Detail Page

**File:** `sites/abroad-jobs/src/pages/jobs/[slug].astro`, lines 99-110
**CWE:** CWE-79 (Cross-Site Scripting)

**Description:** The `companyWebsite` field from the database is rendered as an `<a href>` without validating the URL scheme. While the checkout schema validates it as `z.string().url()`, imported jobs from external APIs set `companyWebsite: null`, and the field could be populated with a dangerous URL scheme if the database is modified directly.

**Recommended Fix:** Check that the URL starts with `http` before rendering it as a link.

---

## Low Severity Issues

### L-1: Directus Docker CORS Not Explicitly Configured

**Files:** All `infra/docker/*/docker-compose.yml`
**CWE:** CWE-942

**Description:** The Directus Docker Compose files do not set `CORS_ENABLED`, `CORS_ORIGIN`, or `CORS_METHODS` environment variables. Directus 11 defaults to allowing all origins, meaning any website can read CMS content if the instance is accessible.

**Recommended Fix:** Add explicit CORS origin configuration restricted to the client site domain.

---

### L-2: No File Content Validation (Magic Bytes) on Image Upload

**File:** `sites/admin/src/pages/api/sites/[slug]/media.ts`
**CWE:** CWE-434 (Unrestricted Upload of File with Dangerous Type)

**Description:** The media upload endpoint validates file extension but not the actual file content (magic bytes). A file with a `.jpg` extension could actually be an SVG with embedded script content. Current protections (extension allowlist, size limit, filename sanitization, path traversal checks) are good but incomplete.

**Recommended Fix:** Add magic byte validation for common image formats. For `.svg` files specifically, consider rejecting them or sanitizing with a dedicated library, as SVGs can contain executable script content.

---

### L-3: Admin Session Cookie Not Validated for Expiry Locally

**File:** `sites/admin/src/middleware.ts`
**CWE:** CWE-613 (Insufficient Session Expiration)

**Description:** Every page load requires an HTTP round-trip to the auth service. If the auth service is down, all users are logged out. No local caching or JWT verification exists.

**Recommended Fix:** Cache session validity locally for short periods or use JWT tokens verifiable with a shared public key.

---

### L-4: Provisioning Script Sources Untrusted .env File

**File:** `infra/provisioning/provision-cms.sh`, line 100
**CWE:** CWE-78 (OS Command Injection)

**Description:** The provisioning script uses `source` to load an `.env` file, which could execute arbitrary shell commands if the file is tampered with.

**Recommended Fix:** Parse the `.env` file line-by-line with `read` instead of sourcing it.

---

### L-5: D1 Database ID Exposed in wrangler.toml

**File:** `sites/abroad-jobs/wrangler.toml`, line 14
**CWE:** CWE-200 (Exposure of Sensitive Information)

**Description:** The D1 database ID is committed to the repository. While Cloudflare requires authentication to access D1, the ID should not be publicly exposed as it aids targeted attacks with leaked credentials.

**Recommended Fix:** Use environment variable substitution for the database ID.

---

### L-6: Backup Scripts Assume Passwordless PostgreSQL Access

**Files:** `infra/backups/pg_backup.sh`, `infra/backups/restore.sh`
**CWE:** CWE-256 (Plaintext Storage of a Password)

**Description:** Scripts use `psql -U postgres` and `pg_dump -U postgres` without password, relying on trust authentication.

**Recommended Fix:** Use `.pgpass` files or `PGPASSWORD` from a secrets manager.

---

## OWASP Top 10 (2021) Coverage Assessment

| # | Category | Status | Notes |
|---|----------|--------|-------|
| A01 | Broken Access Control | PARTIAL | CSRF missing (H-1). Auth delegated to external service (good). |
| A02 | Cryptographic Failures | GOOD | HSTS, TLS via Cloudflare, secrets in env vars. Runtime-env.json concern (M-6). |
| A03 | Injection | NEEDS WORK | FTS5 injection (C-1), stored XSS (C-2), raw HTML rendering (H-4). Drizzle ORM is good. |
| A04 | Insecure Design | PARTIAL | No rate limiting (M-1), error leakage (M-3). Honeypot on forms is good. |
| A05 | Security Misconfiguration | PARTIAL | Missing prerender (H-2), Docker ports (H-3), CSP unsafe-inline (M-7). Headers solid. |
| A06 | Vulnerable Components | GOOD | Modern stack. Needs automated dependency scanning. |
| A07 | Auth Failures | PARTIAL | Import endpoint bypass (C-3). Central auth is good. |
| A08 | Data Integrity | GOOD | Stripe webhook verification, pnpm lockfiles. |
| A09 | Logging and Monitoring | PARTIAL | Console.error only. No structured logging or audit trail. |
| A10 | SSRF | GOOD | Hardcoded external URLs. No user-controlled URL fetching. |

---

## Prioritized Recommendations

### Immediate (Fix This Week)

1. **Fix FTS5 injection** (C-1) -- Sanitize FTS5 special operators from search query input.
2. **Validate applyUrl scheme** (C-2) -- Restrict to http://, https://, or mailto: schemes.
3. **Require IMPORT_SECRET always** (C-3) -- Remove the "allow if not set" fallback.
4. **Add CSRF protection** (H-1) -- Require custom header on state-changing API requests.
5. **Add prerender = false** (H-2) -- To all 7 admin API routes missing it.

### Short-Term (Fix This Month)

6. **Bind Directus Docker ports to localhost** (H-3).
7. **Sanitize CMS HTML content** (H-4) before raw HTML rendering.
8. **Fix shell injection in setup-vps.sh** (H-5).
9. **Implement rate limiting** (M-1) on checkout, import, and admin write endpoints.
10. **Restrict error message exposure** (M-3, M-4).

### Medium-Term (Fix This Quarter)

11. **Add explicit CORS headers on admin API** (M-2).
12. **Restrict structuredData schema** (M-5).
13. **Secure runtime-env.json** (M-6) or remove it entirely.
14. **Add magic byte validation on uploads** (L-2).
15. **Configure Directus CORS** (L-1).
16. **Set up automated dependency vulnerability scanning** (Dependabot/Renovate + npm audit in CI).
17. **Add structured security event logging** for auth failures, admin actions, and rate limit violations.

---

## Positive Aspects

1. **Consistent use of execFile** -- The build and deploy system correctly uses execFile (not shell-based execution), preventing command injection through slug values.

2. **Comprehensive zod validation** -- Nearly every API route validates input with zod schemas before processing.

3. **Drizzle ORM for parameterized queries** -- Standard database queries use Drizzle ORM, preventing SQL injection.

4. **Strong security headers** -- All sites have HSTS with preload, X-Frame-Options DENY, strict CSP, Referrer-Policy.

5. **Path traversal protection** -- Media upload includes explicit path traversal checks and filename sanitization.

6. **Slug validation everywhere** -- API routes consistently validate slug parameters against regex patterns.

7. **Centralized authentication** -- Migration to central auth service reduces attack surface.

8. **Honeypot spam protection** -- Checkout form includes honeypot field for bot detection.

9. **Proper Stripe webhook verification** -- Uses constructEventAsync with signature verification.

10. **Docker admin binds to localhost only** -- Port binding restricted to 127.0.0.1 with Cloudflare Tunnel for external access.

---

## Files Reviewed

A total of **60+ files** were reviewed across the following categories:

- 24 API route files (admin + abroad-jobs)
- 3 middleware/auth files
- 9 library files (deploy, cloudflare, versioning, dev-server, generator, build, db, schema, validation, import-jobs)
- 11 infrastructure files (Docker Compose, shell scripts, Kamal deploy, Dockerfile)
- 5 security header files
- 5 template/component files (XSS review)
- 4 configuration files (.gitignore, package.json, wrangler.toml)
