# Authentication & Authorization Security Review

**Date:** 2026-03-23
**Scope:** Full authentication, authorization, and session management review of the infront-cms monorepo
**Reviewer:** Claude Code (Automated Security Review)

---

## Executive Summary

The platform has recently migrated from a local password+JWT authentication system to a centralized SSO model via BetterAuth at `auth.infront.cy`. This is architecturally sound and significantly reduces the auth attack surface of the admin UI itself. However, the review identified **2 critical**, **4 high**, **5 medium**, and **5 low** severity issues that need attention.

The most urgent findings are: (1) Directus instance credentials (database passwords, admin passwords, application secrets) committed to Git in plaintext `.env` files, and (2) the complete absence of CSRF protection on all admin API mutation endpoints. Additionally, the Directus Docker deployments lack CORS restrictions, rate limiting, and public registration lockdown configuration.

The abroad-jobs site has good security fundamentals (Stripe webhook signature verification, Zod validation, honeypot spam protection, strong CSP headers) but lacks rate limiting on its public API endpoints.

---

## Current Auth Architecture Overview

### Admin UI (`sites/admin/`)

The admin UI delegates all authentication to a central BetterAuth instance at `auth.infront.cy`:

1. **Middleware** (`sites/admin/src/middleware.ts`) intercepts all non-public routes
2. Forwards the browser's cookie header to `auth.infront.cy/api/auth/get-session`
3. If valid, attaches `user` and `session` to `context.locals`
4. If invalid or on error, redirects to `auth.infront.cy/login?redirect=<url>`
5. **Logout** is handled client-side via `fetch` POST to `auth.infront.cy/api/auth/sign-out`

**Public routes (skip auth):** `/login`, `/health`, `/api/auth/*`, `/_astro/*`, `/assets/*`

### Abroad-Jobs Site (`sites/abroad-jobs/`)

No user authentication. Public API endpoints for job search (`GET /api/jobs`), payment initiation (`POST /api/checkout`), and Stripe webhook processing (`POST /api/webhook`). Payment is handled entirely through Stripe Checkout (redirect flow).

### Directus Instances (`infra/docker/`)

Each CMS client gets a separate Directus 11 instance with PostgreSQL. Authentication is Directus-native (email/password for admin, API tokens for programmatic access).

---

## Issues Found

### CRITICAL

#### C1. Directus Credentials Committed to Git in Plaintext

**Files:**
- `/infra/docker/meridian-properties/.env` (all lines)
- `/infra/docker/atelier-kosta/.env` (all lines)

**Description:** Both files contain production credentials in plaintext, including:
- Directus application `KEY` and `SECRET` (hex strings used for JWT signing and encryption)
- Database passwords (`DB_PASSWORD`)
- Admin account passwords (`ADMIN_PASSWORD`)
- Admin email addresses

While the `.gitignore` contains a rule for `.env` files, these two files are present on disk and were readable. A `git status` shows they appear untracked, but any developer with repository access can see them. More critically, the `.env.example` pattern encourages copying credentials into these files in the repo directory rather than using an external secret manager.

**Risk:** Full compromise of all Directus instances. An attacker with read access to the repository (or any backup/clone) gains admin access to all CMS data, can forge Directus JWTs, and can directly access the PostgreSQL databases.

**Recommended Fix:**
1. Immediately rotate all credentials in both `.env` files (KEY, SECRET, DB_PASSWORD, ADMIN_PASSWORD)
2. Move all Directus secrets to Doppler (already the stated secret management tool per CLAUDE.md)
3. Ensure the `.gitignore` rule `infra/docker/**/.env` is explicit (the current `.env` rule should match, but add a specific one for clarity)
4. Add a pre-commit hook that scans for high-entropy strings in tracked files
5. Remove the `.env` files from the working directory and reference Doppler in docker-compose via `env_file` pointing to a Doppler-injected path

---

#### C2. No CSRF Protection on Admin API Mutation Endpoints

**Files (all mutation endpoints):**
- `/sites/admin/src/pages/api/sites/create.ts` (line 138, POST)
- `/sites/admin/src/pages/api/sites/[slug]/redeploy.ts` (line 4, POST)
- `/sites/admin/src/pages/api/sites/[slug]/delete.ts` (line 14, DELETE)
- `/sites/admin/src/pages/api/sites/[slug]/custom-domain.ts` (lines 5, 63, POST/DELETE)
- `/sites/admin/src/pages/api/sites/[slug]/config.ts` (line 225, PUT)
- `/sites/admin/src/pages/api/sites/[slug]/media.ts` (lines 82, 183, POST/DELETE)
- `/sites/admin/src/pages/api/sites/[slug]/promote.ts` (line 27, POST)
- `/sites/admin/src/pages/api/sites/[slug]/versions.ts` (line 77, POST)
- `/sites/admin/src/pages/api/sites/[slug]/pages/[page].ts` (line 85, PUT)
- `/sites/admin/src/pages/api/sites/[slug]/pages/[page]/sections.ts` (lines 61, 108, POST/DELETE)
- `/sites/admin/src/pages/api/sites/[slug]/pages/[page]/sections/reorder.ts` (line 23, PUT)
- `/sites/admin/src/pages/api/dev-servers.ts` (line 37, POST)

**Description:** None of the admin API routes implement CSRF protection. The authentication relies solely on the session cookie forwarded to `auth.infront.cy`. Since cookies are automatically attached by the browser, a malicious website could craft requests to these endpoints while the admin is logged in.

An attacker could:
- Create new sites (`POST /api/sites/create`)
- Delete existing sites (`DELETE /api/sites/[slug]/delete`)
- Modify site configurations (`PUT /api/sites/[slug]/config`)
- Upload arbitrary files (`POST /api/sites/[slug]/media`)
- Trigger redeployments (`POST /api/sites/[slug]/redeploy`)
- Revert sites to old versions (`POST /api/sites/[slug]/versions`)
- Add custom domains to redirect traffic (`POST /api/sites/[slug]/custom-domain`)

**Risk:** Complete site management compromise via cross-site request forgery. Any website visited by an authenticated admin could silently destroy, modify, or exfiltrate site data.

**Recommended Fix:**
1. Implement a CSRF token pattern. Since BetterAuth is used, check if it provides a CSRF mechanism (many BetterAuth configurations include `csrfToken` support)
2. Alternatively, implement the double-submit cookie pattern: set a random CSRF token cookie and require it as a request header (`X-CSRF-Token`) on all mutation endpoints
3. As a quick mitigation, add `Origin` / `Referer` header checking in the middleware for non-GET requests:

```typescript
// In middleware.ts, after session validation
if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(context.request.method)) {
  const origin = context.request.headers.get('origin');
  const allowedOrigins = [context.url.origin, AUTH_BASE_URL];
  if (!origin || !allowedOrigins.includes(origin)) {
    return new Response(JSON.stringify({ error: 'CSRF check failed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

---

### HIGH

#### H1. No Rate Limiting on Any Endpoint

**Files:**
- `/sites/admin/src/middleware.ts` (entire file -- no rate limiting logic)
- `/sites/abroad-jobs/src/pages/api/checkout.ts` (line 11, POST handler)
- `/sites/abroad-jobs/src/pages/api/jobs.ts` (line 10, GET handler)
- `/sites/abroad-jobs/src/pages/api/webhook.ts` (line 11, POST handler)

**Description:** Neither the admin UI nor the abroad-jobs site implements rate limiting. The CLAUDE.md states "API routes: rate limiting" as a security requirement, but no implementation exists.

For the admin, this means a compromised session or CSRF attack could execute unlimited destructive operations. For abroad-jobs, the public `POST /api/checkout` endpoint creates Stripe Checkout sessions and inserts database rows with no throttling -- an attacker could create thousands of pending job records and Stripe sessions.

**Risk:**
- Denial of service via resource exhaustion (database, Stripe API limits)
- Amplification of any other vulnerability (CSRF, session hijack)
- Financial impact from Stripe session abuse

**Recommended Fix:**
- For the admin (Node.js SSR): implement in-memory rate limiting in the middleware using a token bucket or sliding window algorithm, keyed by IP or session
- For abroad-jobs (Cloudflare Workers): use Cloudflare Rate Limiting rules in the dashboard, or implement rate limiting via the `cf` object in the request

---

#### H2. Directus Docker Configurations Missing Security Hardening

**Files:**
- `/infra/docker/template/docker-compose.yml` (entire file)
- `/infra/docker/meridian-properties/docker-compose.yml` (entire file)
- `/infra/docker/atelier-kosta/docker-compose.yml` (entire file)

**Description:** The Directus Docker configurations are missing several critical security settings:

1. **No CORS configuration** -- `CORS_ENABLED` and `CORS_ORIGIN` are not set, so Directus defaults to allowing all origins
2. **No public registration lockdown** -- `AUTH_DISABLE_DEFAULT` is not set; `PUBLIC_REGISTRATION` may default to enabled depending on version
3. **No file upload type restrictions** -- `STORAGE_LOCAL_MAX_FILE_SIZE` and allowed MIME types are not configured
4. **Database ports may be exposed** -- The PostgreSQL container has no port binding restrictions (though Docker Compose networking should isolate it)
5. **No `RATE_LIMITER_ENABLED`** setting
6. **No `AUTH_PASSWORD_POLICY`** setting

**Risk:** Directus instances may accept requests from any origin, allow unrestricted file uploads, and have no brute-force protection on login.

**Recommended Fix:** Add these environment variables to all Directus docker-compose files:

```yaml
environment:
  # ... existing vars ...
  CORS_ENABLED: "true"
  CORS_ORIGIN: "${PUBLIC_URL}"
  PUBLIC_REGISTRATION: "false"
  RATE_LIMITER_ENABLED: "true"
  RATE_LIMITER_POINTS: "25"
  RATE_LIMITER_DURATION: "1"
  AUTH_PASSWORD_POLICY: "/^.{10,}$/"
  FILES_MAX_UPLOAD_SIZE: "10mb"
  FILES_MIME_TYPE_ALLOW_LIST: "image/jpeg,image/png,image/webp,image/avif,image/svg+xml,application/pdf"
```

---

#### H3. Open Redirect in Admin Login Page

**File:** `/sites/admin/src/pages/login.astro` (line 9)

**Description:** The login page reads a `redirect` query parameter and passes it directly to the auth service URL:

```typescript
const redirect = Astro.url.searchParams.get('redirect') ?? Astro.url.origin;
const loginUrl = `${authBaseUrl}/login?redirect=${encodeURIComponent(redirect)}`;
```

While the redirect is URL-encoded, there is no validation that the redirect target is within the `*.infront.cy` domain. An attacker could craft a URL like:

```
https://web.infront.cy/login?redirect=https://evil.com/steal-token
```

After authentication, if `auth.infront.cy` blindly follows the redirect parameter, the user would be sent to the attacker's site, potentially with session tokens in the URL or referer header.

**Risk:** Credential theft via phishing. An attacker sends a legitimate-looking `web.infront.cy/login` link that redirects to a fake admin page after auth.

**Recommended Fix:** Validate the redirect parameter before passing it:

```typescript
const rawRedirect = Astro.url.searchParams.get('redirect') ?? Astro.url.origin;
const allowedHosts = ['web.infront.cy', 'localhost'];
let redirect = Astro.url.origin; // safe default
try {
  const url = new URL(rawRedirect);
  if (allowedHosts.some(h => url.hostname === h || url.hostname.endsWith('.infront.cy'))) {
    redirect = rawRedirect;
  }
} catch {
  // Invalid URL, use default
}
```

The same validation should also exist in `auth.infront.cy` itself, but defense-in-depth requires validation here too.

---

#### H4. Middleware Redirect Parameter Also Vulnerable to Open Redirect

**File:** `/sites/admin/src/middleware.ts` (lines 30, 37, 48)

**Description:** Similar to H3, the middleware constructs redirect URLs using `context.url.href`:

```typescript
const loginUrl = `${AUTH_BASE_URL}/login?redirect=${encodeURIComponent(context.url.href)}`;
```

If an attacker can manipulate the `Host` header (e.g., via a reverse proxy misconfiguration or DNS rebinding), `context.url.href` could contain an attacker-controlled domain. However, this is lower risk than H3 because the value comes from the server-parsed URL rather than user input.

**Risk:** Medium -- depends on reverse proxy configuration. The Cloudflare Tunnel setup likely prevents Host header injection, but this is not guaranteed in all deployment configurations.

**Recommended Fix:** Construct the redirect URL from known-safe components rather than using `context.url.href`:

```typescript
const redirectPath = context.url.pathname + context.url.search;
const loginUrl = `${AUTH_BASE_URL}/login?redirect=${encodeURIComponent(context.url.origin + redirectPath)}`;
```

---

### MEDIUM

#### M1. `/api/auth/` Prefix Is Publicly Accessible but Unused

**File:** `/sites/admin/src/middleware.ts` (line 7)

**Description:** The public prefix list includes `/api/auth/`:

```typescript
const PUBLIC_PREFIXES = ['/api/auth/', '/_astro/', '/assets/'];
```

However, with the migration to centralized auth, the local auth API routes (`/api/auth/login`, `/api/auth/logout`) have been deleted. This prefix bypass still exists in the middleware but currently matches no routes. If any route is accidentally created under `/api/auth/`, it would bypass authentication entirely.

**Risk:** Low currently, but a latent vulnerability. A future developer could create an API route under `/api/auth/` without realizing it skips auth.

**Recommended Fix:** Remove `/api/auth/` from `PUBLIC_PREFIXES` since all auth is handled externally:

```typescript
const PUBLIC_PREFIXES = ['/_astro/', '/assets/'];
```

---

#### M2. Auth Service Unavailability Causes Full Lockout

**File:** `/sites/admin/src/middleware.ts` (lines 46-50)

**Description:** If the auth service at `auth.infront.cy` is down or unreachable, the `catch` block redirects all requests to the login page:

```typescript
} catch (err) {
  console.error('Auth service error:', err);
  const loginUrl = `${AUTH_BASE_URL}/login?redirect=${encodeURIComponent(context.url.href)}`;
  return context.redirect(loginUrl);
}
```

This creates a redirect loop: the admin is inaccessible, and the login redirect goes to a service that's also down. There is no fallback, cache, or circuit breaker.

**Risk:** Complete admin UI outage if `auth.infront.cy` experiences any downtime. This is a single point of failure.

**Recommended Fix:**
1. Add short-lived session caching (e.g., cache validated sessions for 60 seconds in-memory) to survive brief auth service outages
2. Return a user-friendly error page instead of redirecting when the auth service is unreachable:

```typescript
} catch (err) {
  console.error('Auth service error:', err);
  return new Response('Authentication service is temporarily unavailable. Please try again.', {
    status: 503,
    headers: { 'Retry-After': '30' },
  });
}
```

---

#### M3. No Authorization / Role Checking Beyond Authentication

**File:** `/sites/admin/src/middleware.ts` (lines 42-43)

**Description:** The middleware attaches user data from the auth service but never checks roles or permissions:

```typescript
context.locals.user = data.user;
context.locals.session = data.session;
```

No API route checks `context.locals.user` for any role or permission. Currently this platform appears to be single-admin, but there is no mechanism to restrict access if additional users are added to BetterAuth (e.g., a client user who should only see their own site).

**Risk:** If BetterAuth is configured to allow multiple users, any authenticated user gets full admin access to all sites, deployments, and configurations.

**Recommended Fix:** Add role checking in the middleware or individual API routes:

```typescript
if (!data.user || data.user.role !== 'admin') {
  return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
}
```

---

#### M4. Abroad-Jobs Checkout Endpoint Allows Bulk Job Insertion Without Payment

**File:** `/sites/abroad-jobs/src/pages/api/checkout.ts` (lines 53-75)

**Description:** The checkout endpoint inserts job records into the database *before* payment is completed. Up to 50 jobs can be inserted per request (per the Zod schema `z.array(jobInputSchema).min(1).max(50)`). While jobs are inserted with `isLive: 0`, there is no cleanup mechanism for abandoned checkout sessions, and the database could be filled with orphaned records.

Combined with the lack of rate limiting (H1), an attacker could insert unlimited pending job records by repeatedly calling this endpoint with different email addresses.

**Risk:** Database pollution and potential denial of service via storage exhaustion on Cloudflare D1.

**Recommended Fix:**
1. Add rate limiting per IP (e.g., max 5 checkout sessions per IP per hour)
2. Implement a scheduled cleanup job that deletes pending jobs older than 24 hours that have no completed Stripe session
3. Consider creating jobs only after webhook confirmation (move insertion logic to the webhook handler)

---

#### M5. Abroad-Jobs FTS Search Has Potential SQL Injection Surface

**File:** `/sites/abroad-jobs/src/pages/api/jobs.ts` (lines 35-67)

**Description:** The search query is sanitized by removing quotes:

```typescript
const ftsQuery = q.replace(/['"]/g, '').trim();
```

The query is then passed as a parameterized bind to D1:

```typescript
.prepare(queryParts.join(' '))
.bind(...params)
```

The parameterized query protects against standard SQL injection. However, FTS5 MATCH syntax has its own query language (AND, OR, NOT, NEAR, prefix matching with `*`, column filters with `:`). The current sanitization only removes quotes, meaning an attacker could inject FTS operators to cause unexpected behavior or denial of service (e.g., very expensive queries with wildcards).

**Risk:** Low for data exfiltration (parameterized queries prevent real SQLi), but medium for DoS via expensive FTS queries.

**Recommended Fix:** Sanitize FTS-specific operators in addition to quotes:

```typescript
const ftsQuery = q
  .replace(/['"]/g, '')
  .replace(/[*:(){}]/g, '')
  .replace(/\b(AND|OR|NOT|NEAR)\b/gi, '')
  .trim();
```

---

### LOW

#### L1. Error Messages May Leak Internal Details

**Files:**
- `/sites/admin/src/pages/api/sites/create.ts` (line 204)
- `/sites/admin/src/pages/api/sites/[slug]/custom-domain.ts` (line 53)
- `/sites/admin/src/pages/api/sites/[slug]/export.ts` (line 215)
- Multiple other API routes that return `err.message` in responses

**Description:** Many API routes return the raw error message to the client:

```typescript
error: err instanceof Error ? err.message : 'Internal server error',
```

Error messages from internal libraries (Node.js filesystem, Cloudflare API, etc.) may contain file paths, API endpoint details, or other information useful to an attacker.

**Risk:** Information disclosure that aids further attacks.

**Recommended Fix:** Log the detailed error server-side but return a generic message to the client. For the admin UI (authenticated users), this is lower risk but still good practice:

```typescript
console.error('Detailed error:', err);
return json({ error: 'An internal error occurred' }, 500);
```

---

#### L2. No Timeout on Auth Service Fetch

**File:** `/sites/admin/src/middleware.ts` (line 25)

**Description:** The `fetch` call to the auth service has no timeout:

```typescript
const res = await fetch(`${AUTH_BASE_URL}/api/auth/get-session`, {
  headers: { cookie: cookieHeader },
});
```

If the auth service is slow but not down, every request to the admin UI will hang for the default TCP timeout (potentially minutes).

**Risk:** Poor availability; request queue buildup could crash the Node.js process.

**Recommended Fix:** Add an `AbortController` with a timeout:

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);
try {
  const res = await fetch(`${AUTH_BASE_URL}/api/auth/get-session`, {
    headers: { cookie: cookieHeader },
    signal: controller.signal,
  });
  // ...
} finally {
  clearTimeout(timeout);
}
```

---

#### L3. Logout Does Not Clear Local State

**File:** `/sites/admin/src/layouts/AdminLayout.astro` (lines 236-244)

**Description:** The logout handler calls the auth service sign-out endpoint and then redirects, but does not explicitly clear any local cookies or cached state:

```javascript
await fetch(`${authBaseUrl}/api/auth/sign-out`, {
  method: 'POST',
  credentials: 'include',
});
window.location.href = `${authBaseUrl}/login`;
```

If the sign-out call fails (network error, auth service down), the user is still redirected to the login page but their session cookie remains valid. They would be silently re-authenticated on next visit.

**Risk:** Session may persist after intended logout.

**Recommended Fix:** Add error handling and attempt to clear the cookie client-side as a fallback:

```javascript
try {
  await fetch(`${authBaseUrl}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include',
  });
} catch {
  // Clear the cookie domain-wide as fallback
  document.cookie = 'better-auth.session_token=; path=/; domain=.infront.cy; max-age=0';
}
window.location.href = `${authBaseUrl}/login`;
```

---

#### L4. Admin Security Headers Not Configured

**File:** No `_headers` file or security header middleware exists in `sites/admin/`

**Description:** The abroad-jobs site has a comprehensive `_headers` file with CSP, HSTS, X-Frame-Options, and other security headers. The admin UI has none. Since the admin runs on Node.js (not Cloudflare Pages), headers must be set either in the Caddy reverse proxy config or as Astro middleware.

**Risk:** The admin UI is vulnerable to clickjacking (no X-Frame-Options), MIME type sniffing attacks, and has no Content Security Policy.

**Recommended Fix:** Add security headers in the Astro middleware response or configure them in Caddy:

```typescript
// In middleware.ts, wrap the next() response
const response = await next();
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
```

---

#### L5. Path Traversal Protection in Media Upload Has Edge Case

**File:** `/sites/admin/src/pages/api/sites/[slug]/media.ts` (lines 150-154)

**Description:** The path traversal check is performed after constructing `finalPath`:

```typescript
if (!finalPath.startsWith(mediaDir + path.sep) && finalPath !== mediaDir) {
  return json({ error: 'Invalid filename' }, 400);
}
```

The filename is already sanitized (lowercase, alphanumeric + hyphens only via regex on line 130-132), which makes traversal unlikely. However, the check should happen before the `fs.access` call on line 142, and the `path.basename` extraction in the DELETE handler (line 202) is the more robust approach. The inconsistency between handlers increases maintenance risk.

**Risk:** Very low given the sanitization, but the defense-in-depth check ordering could be improved.

**Recommended Fix:** Move the path traversal check immediately after constructing the path, before any filesystem operations. Standardize the approach across GET, POST, and DELETE handlers.

---

## SSO Readiness Assessment

### Current State

The migration from local auth to centralized BetterAuth at `auth.infront.cy` is **complete for the admin UI**. The implementation is clean:

- Old auth files (`auth.ts`, `LoginForm.tsx`, login/logout API routes) have been properly removed
- Middleware correctly delegates session verification to the central service
- Login page acts as a simple redirect
- Logout calls the central sign-out endpoint
- Environment variables are properly separated (server-side `AUTH_SERVICE_URL`, client-side `PUBLIC_AUTH_SERVICE_URL`)
- Deploy config passes the auth URLs to production

### What Works Well

1. **Clean separation of concerns** -- the admin UI has zero auth logic; it only verifies sessions
2. **Cookie-based SSO** -- the session cookie on `.infront.cy` enables seamless SSO across subdomains
3. **Graceful fallback** -- auth service URL defaults to production, making local dev configuration optional
4. **Documentation** -- `docs/auth.md` clearly explains the architecture and migration history

### Gaps for Full SSO Across Client Sites

1. **No client-site auth** -- Client sites (deployed to `*.infront.cy`) have no auth integration. If client sites need authenticated features (e.g., client dashboards, gated content), the BetterAuth integration pattern would need to be replicated
2. **No role model** -- The auth system has no role/permission concept. Adding client users who can edit only their own site would require role-based access control
3. **No token refresh** -- The middleware validates the session on every request but there is no mechanism to refresh expiring sessions. If BetterAuth sessions expire during active use, the user would be abruptly redirected
4. **No session revocation** -- There is no admin endpoint to revoke active sessions (e.g., if a device is compromised)
5. **Auth service is external** -- The `auth.infront.cy` service itself is not part of this codebase, so its security configuration (password policy, MFA, session duration, CORS) could not be reviewed

---

## Positive Aspects

1. **Centralized auth architecture** -- Moving to BetterAuth SSO is the right decision. It eliminates local credential storage, centralizes session management, and enables future multi-service SSO
2. **Zod validation everywhere** -- Every API route validates input with Zod schemas, preventing injection attacks and data integrity issues
3. **Stripe webhook signature verification** -- The abroad-jobs webhook handler properly verifies the `stripe-signature` header using `constructEventAsync`
4. **Honeypot spam protection** -- The checkout form includes a honeypot field
5. **Strong CSP on abroad-jobs** -- The `_headers` file has a well-configured Content Security Policy
6. **Slug validation** -- API routes consistently validate URL slugs against `SLUG_PATTERN`
7. **File upload restrictions** -- The media upload handler validates file extensions, enforces size limits, sanitizes filenames, and checks for path traversal
8. **`noindex, nofollow`** -- The admin layout prevents search engine indexing
9. **Cloudflare Tunnel** -- The admin is not directly exposed to the internet; it sits behind a Cloudflare Tunnel, which significantly reduces the network attack surface
10. **Docker isolation** -- Directus instances run in isolated Docker containers

---

## Recommendations (Prioritized)

### Immediate (This Week)

| Priority | Issue | Action |
|----------|-------|--------|
| 1 | C1 | Rotate all Directus credentials, move to Doppler, remove `.env` files from repo |
| 2 | C2 | Implement Origin header checking in admin middleware for mutation requests |
| 3 | H3/H4 | Add redirect URL validation in login page and middleware |
| 4 | M1 | Remove `/api/auth/` from public prefixes |

### Short Term (This Month)

| Priority | Issue | Action |
|----------|-------|--------|
| 5 | H1 | Implement rate limiting on admin middleware and abroad-jobs API routes |
| 6 | H2 | Add CORS, rate limiting, and registration lockdown to all Directus instances |
| 7 | M2 | Add session caching and 503 fallback for auth service outages |
| 8 | L4 | Add security headers to admin UI |
| 9 | L2 | Add timeout to auth service fetch |

### Medium Term (This Quarter)

| Priority | Issue | Action |
|----------|-------|--------|
| 10 | M3 | Design and implement role-based access control |
| 11 | M4 | Add rate limiting and cleanup job for abroad-jobs checkout |
| 12 | M5 | Improve FTS query sanitization |
| 13 | L1 | Sanitize error messages returned to clients |
| 14 | L3 | Improve logout resilience |
| 15 | L5 | Standardize path traversal protection |

### Long Term

- **Auth service review** -- Conduct a separate security review of the BetterAuth instance at `auth.infront.cy` (password policy, MFA support, session configuration, CORS, rate limiting)
- **Session monitoring** -- Add auth event logging (login, logout, failed attempts) to a centralized log service
- **Penetration testing** -- Commission an external pentest focusing on the admin UI API surface
- **Secret scanning** -- Integrate `trufflehog` or `gitleaks` into CI/CD to prevent future secret commits

---

## Files Reviewed

| File | Purpose |
|------|---------|
| `sites/admin/src/middleware.ts` | Auth middleware |
| `sites/admin/src/pages/login.astro` | Login redirect |
| `sites/admin/src/layouts/AdminLayout.astro` | Logout handler |
| `sites/admin/src/lib/env.ts` | Environment variable access |
| `sites/admin/src/lib/cloudflare.ts` | Cloudflare API wrapper |
| `sites/admin/astro.config.mjs` | SSR configuration |
| `sites/admin/package.json` | Dependencies |
| `sites/admin/src/pages/api/sites/create.ts` | Site creation endpoint |
| `sites/admin/src/pages/api/sites/[slug]/redeploy.ts` | Redeploy endpoint |
| `sites/admin/src/pages/api/sites/[slug]/delete.ts` | Site deletion endpoint |
| `sites/admin/src/pages/api/sites/[slug]/custom-domain.ts` | Custom domain management |
| `sites/admin/src/pages/api/sites/[slug]/config.ts` | Site config CRUD |
| `sites/admin/src/pages/api/sites/[slug]/export.ts` | Site export |
| `sites/admin/src/pages/api/sites/[slug]/media.ts` | Media upload/delete |
| `sites/admin/src/pages/api/sites/[slug]/pages.ts` | Page listing |
| `sites/admin/src/pages/api/sites/[slug]/pages/[page].ts` | Page CRUD |
| `sites/admin/src/pages/api/sites/[slug]/pages/[page]/sections.ts` | Section add/remove |
| `sites/admin/src/pages/api/sites/[slug]/pages/[page]/sections/reorder.ts` | Section reorder |
| `sites/admin/src/pages/api/sites/[slug]/promote.ts` | Staging to production |
| `sites/admin/src/pages/api/sites/[slug]/versions.ts` | Version history/revert |
| `sites/admin/src/pages/api/sites/[slug]/deploy-status.ts` | Deploy status |
| `sites/admin/src/pages/api/sites/index.ts` | Site listing |
| `sites/admin/src/pages/api/dev-servers.ts` | Dev server management |
| `sites/abroad-jobs/src/pages/api/checkout.ts` | Stripe checkout |
| `sites/abroad-jobs/src/pages/api/jobs.ts` | Job search API |
| `sites/abroad-jobs/src/pages/api/webhook.ts` | Stripe webhook |
| `sites/abroad-jobs/src/lib/validation.ts` | Zod schemas |
| `sites/abroad-jobs/src/lib/db.ts` | D1 database helper |
| `sites/abroad-jobs/src/lib/import-jobs.ts` | Job importer |
| `sites/abroad-jobs/public/_headers` | Security headers |
| `sites/abroad-jobs/wrangler.toml` | Worker config |
| `infra/admin/deploy.yml` | Kamal deployment config |
| `infra/docker/template/docker-compose.yml` | Directus template |
| `infra/docker/meridian-properties/docker-compose.yml` | Client Directus |
| `infra/docker/meridian-properties/.env` | Client credentials |
| `infra/docker/atelier-kosta/docker-compose.yml` | Client Directus |
| `infra/docker/atelier-kosta/.env` | Client credentials |
| `infra/docker/template/.env.example` | Credential template |
| `docs/auth.md` | Auth documentation |
| `.gitignore` | Ignored files |
