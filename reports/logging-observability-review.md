# Logging & Observability Review Report: Infront CMS Platform

**Date:** 2026-03-23
**Reviewer:** Platform Reliability Engineer
**Scope:** Full codebase at `/Users/stefanospetrou/Desktop/Apps/infront-cms`
**Framework:** Observability Best Practices (Logging, Monitoring, Alerting, Tracing)

---

## Executive Summary

**Overall Observability Posture: CRITICAL RISK**

The Infront CMS platform has virtually no observability infrastructure. There is zero structured logging -- only bare `console.log` and `console.error` calls scattered across 30+ locations. No logging library is installed in any `package.json`. Sentry is documented in CLAUDE.md as the error monitoring tool and Betterstack as the uptime monitor, but neither is actually installed or configured. There is no audit trail for admin operations, no request logging in middleware, and 80+ empty catch blocks silently swallowing errors. The Stripe webhook -- the critical revenue path -- has zero observability beyond a `console.error` on failure.

**Finding Counts:** 12 significant issues identified across logging, monitoring, alerting, and debugging categories.

---

## Critical Issues

### C-1: Zero Structured Logging -- Only Bare console.log/error Calls

**Files:** All API routes in `sites/admin/src/pages/api/` and `sites/abroad-jobs/src/pages/api/`
**Impact:** No queryable log data, no severity levels, no contextual metadata

The entire platform uses bare `console.log()` and `console.error()` calls (30+ instances) with no structured format, no log levels, no timestamps, no request correlation IDs, and no contextual metadata (user, site slug, operation). These logs are ephemeral -- on Cloudflare Workers they vanish after the request completes, and on the Node.js admin server they go to stdout with no persistence.

**Recommended Fix:** Install a structured logging library (e.g., pino) for the admin Node.js server. For Cloudflare Workers, use `console.log(JSON.stringify({...}))` with structured fields and enable Logpush for persistence.

---

### C-2: Sentry Documented But Not Installed

**Files:** All `package.json` files (root, admin, abroad-jobs)

CLAUDE.md lists Sentry as the error monitoring tool, but no `@sentry/*` package exists in any `package.json`. There is no Sentry DSN configured, no Sentry initialization code, and no error boundary integration. Runtime errors in production are invisible.

**Recommended Fix:** Install `@sentry/astro` for both the admin and abroad-jobs sites. Configure Sentry DSN via environment variables. Add Sentry error boundaries to React islands.

---

### C-3: No Audit Trail for Admin Operations

**Files:** All admin API routes in `sites/admin/src/pages/api/`

There is no audit logging for any admin operation. The following actions leave zero trace:
- Site creation (who created it, when, with what config)
- Site deletion (who deleted it, which site, was it accidental?)
- Site redeployment (who triggered it, why?)
- Custom domain changes
- Config modifications
- Page and section edits

If a site is accidentally deleted or misconfigured, there is no way to determine who did it or when.

**Recommended Fix:** Log all admin write operations to a structured log with: timestamp, authenticated user, action, target site slug, request body summary, and result (success/failure).

---

## High Severity Issues

### H-1: 80+ Empty Catch Blocks Silently Swallowing Errors

**Files:** Multiple API routes, lib files, and islands across admin and abroad-jobs

Over 80 catch blocks across the codebase either swallow errors silently (`catch {}`) or log a minimal message and continue. This makes debugging production issues extremely difficult because errors leave no trace.

Key locations include:
- Deploy pipeline (`sites/admin/src/lib/deploy.ts`)
- Build system (`sites/admin/src/lib/build.ts`)
- Import jobs (`sites/abroad-jobs/src/lib/import-jobs.ts`)
- LoadMore island (`sites/abroad-jobs/src/islands/LoadMore.tsx`, line 97)

**Recommended Fix:** Replace all empty catch blocks with proper error logging. At minimum, log the error message, stack trace, and context of what operation was being attempted.

---

### H-2: No Request Logging in Admin Middleware

**File:** `sites/admin/src/middleware.ts`

The middleware authenticates requests via the central auth service but does not log any request metadata: no IP address, no endpoint, no method, no response status, no latency. There is no way to see who is accessing the admin panel or detect suspicious activity.

**Recommended Fix:** Add request logging to the middleware that captures method, path, authenticated user, response status, and latency.

---

### H-3: Stripe Webhook Has Zero Observability

**File:** `sites/abroad-jobs/src/pages/api/webhook.ts`

The Stripe webhook endpoint -- the critical path for activating paid job listings -- has minimal logging. If a webhook is received but fails to activate jobs, the only trace is a `console.error` that vanishes after the Cloudflare Worker execution completes.

There is no logging of:
- Webhook event type and ID
- Session ID and payment amount
- Number of jobs activated
- Email delivery success/failure
- Processing latency

**Recommended Fix:** Add structured logging for every webhook event with event ID, session ID, job count, activation result, and email delivery status. Persist these logs via Cloudflare Logpush.

---

### H-4: No Cloudflare Workers Persistent Logging

**Files:** All abroad-jobs API routes, `sites/abroad-jobs/wrangler.toml`

Cloudflare Workers `console.log` output is only visible during `wrangler tail` (real-time streaming). There is no persistent log storage configured. When a production error occurs and nobody is tailing, the log is lost forever.

**Recommended Fix:** Enable Cloudflare Logpush to push Worker logs to an external destination (S3, R2, or a log management service). Alternatively, use Workers Analytics Engine for structured event logging.

---

### H-5: Docker Logs Lost on Container Recreation

**Files:** `infra/admin/update-vps.sh`

The VPS update script runs `docker rm` on the admin container during updates. Docker logs (which contain application stdout/stderr) are destroyed when the container is removed. Any errors that occurred before the update are permanently lost.

**Recommended Fix:** Configure Docker logging driver to persist logs externally (e.g., `json-file` with log rotation, or a remote logging driver). Or mount a log volume.

---

## Medium Severity Issues

### M-1: Betterstack Documented But Not Configured

Betterstack is listed in CLAUDE.md as the uptime monitoring solution, but there is no Betterstack configuration, status page integration, or heartbeat endpoint anywhere in the codebase. Uptime monitoring is not functional.

**Recommended Fix:** Configure Betterstack uptime monitors for each deployed site and the admin panel. Add a health check endpoint to the admin API.

---

### M-2: No Health Check Endpoints

**Files:** All API routes

Neither the admin server nor the abroad-jobs Worker exposes a health check endpoint. Load balancers, uptime monitors, and container orchestrators have no way to verify application health.

**Recommended Fix:** Add `GET /api/health` endpoints that check database connectivity, auth service reachability, and return application version.

---

### M-3: No Error Boundaries in React Islands

**Files:** `sites/abroad-jobs/src/islands/LoadMore.tsx`, `sites/abroad-jobs/src/islands/JobPostForm.tsx`

React islands have no error boundaries. If a rendering error occurs, the entire island crashes with no fallback UI and no error reporting.

**Recommended Fix:** Wrap each island in a React Error Boundary that displays a fallback UI and reports the error to Sentry.

---

## Low Severity Issues

### L-1: No Source Maps in Production

No source map configuration exists for production builds. Stack traces from minified code are unreadable without source maps.

**Recommended Fix:** Generate source maps during build and upload to Sentry for deobfuscation.

---

### L-2: No Debug Mode or Diagnostic Tools

There is no debug mode, no diagnostic endpoint, and no way to increase log verbosity without code changes.

**Recommended Fix:** Add a `DEBUG` environment variable that enables verbose logging when set.

---

### L-3: No Alerting for Any Failure Condition

There are no alerts configured for any failure condition: build failures, deploy failures, webhook errors, auth service outages, database errors, or disk space issues. All failures are silent.

**Recommended Fix:** Integrate alerting via Betterstack, PagerDuty, or Slack webhooks for critical failure conditions.

---

## Observability Maturity Assessment

| Category | Score | Notes |
|----------|-------|-------|
| Structured Logging | 0/10 | No logging library, no structure, no persistence |
| Error Tracking | 0/10 | Sentry documented but not installed |
| Request Tracing | 0/10 | No request IDs, no correlation, no latency tracking |
| Uptime Monitoring | 0/10 | Betterstack documented but not configured |
| Alerting | 0/10 | No alerts for any failure condition |
| Audit Logging | 0/10 | No admin operation audit trail |
| Health Checks | 0/10 | No health endpoints |
| Dashboards | 0/10 | No observability dashboards |
| **Overall** | **0/10** | **The platform is flying blind in production** |

---

## Prioritized Recommendations

### Immediate (This Week)

1. Install a structured logging library (pino) for the admin server
2. Add structured console.log for Cloudflare Workers with JSON format
3. Replace all empty catch blocks with proper error logging
4. Add request logging to admin middleware
5. Add comprehensive logging to the Stripe webhook handler

### Short-Term (This Month)

6. Install and configure Sentry for both admin and abroad-jobs
7. Add admin operation audit logging
8. Configure Cloudflare Logpush for Worker log persistence
9. Configure Betterstack uptime monitors
10. Add health check endpoints

### Medium-Term (This Quarter)

11. Add React error boundaries to all islands
12. Set up alerting for critical failures
13. Configure Docker log persistence
14. Generate and upload source maps to Sentry
15. Build an observability dashboard

---

## Files Reviewed

- 20+ admin API route files
- 4 abroad-jobs API route files
- Admin middleware (`sites/admin/src/middleware.ts`)
- Deploy pipeline (`sites/admin/src/lib/deploy.ts`, `build.ts`, `cloudflare.ts`)
- Dev server manager (`sites/admin/src/lib/dev-server.ts`)
- Versioning system (`sites/admin/src/lib/versioning.ts`)
- Import jobs (`sites/abroad-jobs/src/lib/import-jobs.ts`)
- Infrastructure configs (`infra/admin/deploy.yml`, `setup-vps.sh`, `update-vps.sh`, `Dockerfile`, `docker-entrypoint.sh`)
- Docker compose template (`infra/docker/template/docker-compose.yml`)
- All package.json files (root, admin, abroad-jobs)
- Wrangler config (`sites/abroad-jobs/wrangler.toml`)
