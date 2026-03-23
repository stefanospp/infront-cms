# Caching Strategy Review: Infront CMS Platform

**Date:** 2026-03-23
**Scope:** All caching layers across the infront-cms monorepo platform
**Reviewer:** CDN & Performance Specialist
**Severity Scale:** CRITICAL | HIGH | MEDIUM | LOW | INFO

---

## Executive Summary

The platform has **minimal caching infrastructure**. Static sites (template, atelier-kosta, athena-institute, meridian-properties) benefit from Cloudflare Pages' built-in static asset caching, but the dynamic abroad-jobs site and the admin UI have almost no caching strategy. There is no application-level caching, no KV/Workers Cache API usage, no Directus content caching, no cache invalidation mechanism, and no service worker. The abroad-jobs homepage hits D1 on every single request with no caching layer, which will become a bottleneck as traffic grows. The admin UI makes uncached fetch calls to a central auth service on every request through its middleware.

**Overall Grade: D** -- Caching is essentially an afterthought. The platform relies entirely on Cloudflare's default behavior for static assets and has almost nothing for dynamic content.

---

## 1. CDN / Edge Caching

### Static Sites (template, atelier-kosta, athena-institute, meridian-properties)

**Grade: B+** -- These sites are fully prerendered (`output: 'static'`), so Cloudflare Pages serves them from the CDN edge. This is the correct approach and works well out of the box.

### abroad-jobs (Hybrid SSR)

**Grade: D** -- The abroad-jobs site uses `output: 'static'` with `@astrojs/cloudflare` adapter, meaning static pages are served from CDN but SSR pages (homepage, job detail, search, post, success, sitemap, API routes) are executed by Cloudflare Workers on every request.

| Route | Type | Cache Headers | Issue |
|-------|------|--------------|-------|
| `/` (homepage) | SSR | **None** | Every visit runs 2-3 D1 queries with zero caching |
| `/jobs/[slug]` | SSR | **None** | Every job detail page runs a D1 query with no caching |
| `/post` | SSR | **None** | Acceptable -- form page |
| `/success` | SSR | **None** | Acceptable -- transactional page |
| `/about` | Static | Cloudflare default | OK |
| `/pricing` | Static | Cloudflare default | OK |
| `/privacy` | Static | Cloudflare default | OK |
| `/terms` | Static | Cloudflare default | OK |

**[HIGH] SSR pages have no Cache-Control headers.** The homepage and job detail pages do not set any response headers. Cloudflare Workers will not cache these responses by default. Every request hits the Worker, which hits D1.

**Recommendation:** Use the Cloudflare Cache API or set `Cache-Control` headers on SSR responses:
```typescript
// In index.astro frontmatter:
Astro.response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
// In jobs/[slug].astro:
Astro.response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
```

### Admin UI (Node.js SSR on Hetzner)

**Grade: F** -- No reverse proxy caching. Every request goes straight to the Node.js process. Since this is an authenticated admin panel, caching dynamic content is less critical, but the auth middleware issue (Section 3) is significant.

---

## 2. Browser Cache Headers

### `_headers` Files

All five `_headers` files only define security headers (CSP, HSTS, X-Frame-Options, etc.).

**[HIGH] No Cache-Control headers are set in any `_headers` file.** There are no rules for caching static assets like images, fonts, CSS, or JavaScript.

**Recommendation:**
```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=604800

/favicon*
  Cache-Control: public, max-age=604800
```

### API Route Response Headers

| Route | Cache-Control | Issue |
|-------|--------------|-------|
| `GET /api/jobs` | `public, max-age=30` | Could be improved |
| `POST /api/checkout` | **None** | Acceptable |
| `POST /api/webhook` | **None** | Acceptable |
| `POST /api/import` | **None** | Acceptable |
| `GET /sitemap.xml` | `public, max-age=3600` | Reasonable |
| Admin `GET /api/sites` | **None** | Should have `private, no-store` |
| Admin `GET /api/sites/[slug]/deploy-status` | **None** | Polled every 3s |
| Admin `GET /api/templates` | **None** | Static data, should cache |

**[MEDIUM] No ETag or Last-Modified headers anywhere.** None of the API routes generate ETags or Last-Modified timestamps.

---

## 3. Application-Level Caching

**Grade: F** -- Zero application-level caching anywhere.

- No in-memory cache (Map, LRU)
- No Redis
- No Cloudflare KV
- No Cloudflare Workers Cache API (`caches.default`)
- `wrangler.toml` only binds D1 -- no KV namespace

**[HIGH] Admin middleware makes uncached external auth call on every request.** (`sites/admin/src/middleware.ts`, line 25):
```typescript
const res = await fetch(`${AUTH_BASE_URL}/api/auth/get-session`, {
  headers: { cookie: cookieHeader },
});
```
No session caching. If auth service is slow or down, entire admin UI becomes unusable.

**Recommendation:** Cache session validation in-memory for 60 seconds or validate JWT locally.

---

## 4. D1 Query Caching

**Grade: F** -- No D1 query result caching at any layer.

The homepage (`index.astro`) executes 2-3 D1 queries on every request. Each `/jobs/[slug]` page runs 1 query per request. At 1000 requests/minute, that is 2000-3000 D1 queries per minute for the homepage alone.

**Recommendation (HIGH priority):**
1. **Cloudflare Workers Cache API** -- Cache entire HTML responses at the edge (60s TTL for homepage, 5min for job detail)
2. **Cloudflare KV** -- Store serialized query results with short TTLs
3. **In-Worker memory cache** -- Global `Map` with TTL (survives within a single isolate)

---

## 5. Static Asset Caching

**Grade: B** -- Astro fingerprints CSS/JS bundles under `/_astro/` with content hashes. This enables long-term caching. However, no `_headers` rule sets `immutable` or long `max-age` for these assets.

**[MEDIUM]** External images from `flagcdn.com` and `google.com/s2/favicons` (in `LoadMore.tsx`) have no `<link rel="preconnect">`.

---

## 6. API Response Caching (Detailed)

**[HIGH]** The `Cache-Control: public, max-age=30` on `/api/jobs` only instructs the **browser**. Cloudflare Workers do not cache Worker-generated responses by default -- the Cache API must be used explicitly for edge caching.

**[MEDIUM]** No `Vary` header on cacheable API responses.

**[LOW]** POST responses lack explicit `Cache-Control: no-store`.

---

## 7. Directus Content Caching

**Grade: F** -- No caching layer for Directus API responses.

CMS sites fetch content at build time only (static output). Content changes require manual redeploy.

**[HIGH] No mechanism to auto-rebuild when Directus content changes.** No webhook configuration in Docker Compose. No Directus Flows configured.

**Recommendation:** Configure a Directus Flow that POSTs to the admin redeploy endpoint on content publish/update.

---

## 8. Font Caching

**Grade: C+**

- abroad-jobs correctly uses `preconnect` for Google Fonts
- **[MEDIUM]** Google Fonts loaded as render-blocking stylesheet -- consider self-hosting
- **[MEDIUM]** No font preload for critical `.woff2` files
- **[LOW]** Self-hosting would eliminate Google CDN dependency and improve privacy

---

## 9. Build Output Caching

**Grade: C** -- No incremental builds (Astro limitation). No visible CI workflow files for build caching. Current `wrangler pages deploy` approach bypasses Cloudflare's build cache.

---

## 10. Service Worker / Offline

**Grade: N/A** -- No service worker anywhere. No references to sw.js, workbox, or client-side Cache API. A lightweight SW could benefit abroad-jobs users on slow mobile connections (cache app shell + static pages).

---

## 11. Cache Invalidation

**Grade: F** -- No cache invalidation strategy for any layer.

- Stripe webhook and import cron do not purge any cache after activating/importing jobs
- No Directus webhook to trigger rebuilds on content changes
- Static site redeployments handled correctly by Cloudflare Pages (automatic purge)

---

## 12. Cache Poisoning Risks

**Grade: B** -- Low risk overall.

- **[MEDIUM]** Admin API routes return JSON without `Cache-Control` headers. Mitigated by Cloudflare Tunnel architecture, but `private, no-store` should be added for defense-in-depth.
- **[LOW]** abroad-jobs has no user authentication, so no risk of caching user-specific content. If personalization is added later, `Vary: Cookie` becomes essential.

---

## Summary of Findings by Severity

### HIGH (5)

| # | Finding | Location |
|---|---------|----------|
| 1 | SSR pages have no cache headers | `sites/abroad-jobs/src/pages/index.astro`, `jobs/[slug].astro` |
| 2 | No D1 query caching at any layer | All SSR pages and API routes |
| 3 | No `_headers` rules for static asset caching | All `public/_headers` files |
| 4 | Admin middleware makes uncached external auth call | `sites/admin/src/middleware.ts:25` |
| 5 | No Directus webhook to trigger rebuilds | `infra/docker/*/docker-compose.yml` |

### MEDIUM (5)

| # | Finding | Location |
|---|---------|----------|
| 6 | No ETag or Last-Modified on any API response | All API routes |
| 7 | `/api/jobs` max-age=30 could use stale-while-revalidate | `sites/abroad-jobs/src/pages/api/jobs.ts:92` |
| 8 | Google Fonts render-blocking, no preload | `sites/abroad-jobs/src/layouts/SiteLayout.astro:26` |
| 9 | No `Vary` header on cacheable API responses | `/api/jobs` |
| 10 | Admin API routes lack explicit `no-store` headers | All admin API routes |

### LOW (5)

| # | Finding | Location |
|---|---------|----------|
| 11 | POST responses lack `no-store` | `/api/checkout`, `/api/webhook`, `/api/import` |
| 12 | `/api/templates` has no caching for static data | `sites/admin/src/pages/api/templates/index.ts` |
| 13 | No preconnect for flagcdn.com, google favicons | `sites/abroad-jobs/src/islands/LoadMore.tsx` |
| 14 | Self-hosting fonts would improve perf + privacy | All sites using Google Fonts |
| 15 | No service worker for offline caching | All sites |

---

## Recommended Implementation Roadmap

### Phase 1 -- Quick Wins (1-2 hours)
1. Add `/_astro/*` immutable cache rule to all `_headers` files
2. Add `Cache-Control` headers to abroad-jobs SSR pages
3. Increase `/api/jobs` cache with stale-while-revalidate
4. Add `no-store` to admin API and mutation routes

### Phase 2 -- Edge Caching (2-4 hours)
5. Implement Cloudflare Cache API for abroad-jobs SSR routes
6. Add cache purge to Stripe webhook and import route

### Phase 3 -- Directus Integration (2-4 hours)
7. Configure Directus Flows for auto-rebuild on content changes
8. Add rebuild-webhook endpoint to admin API

### Phase 4 -- Performance Polish (4-8 hours)
9. Self-host Google Fonts
10. Add font preload hints
11. Cache admin auth session validation
12. Consider Cloudflare KV for D1 query results

---

## Files Reviewed

- All 5 `_headers` files (template, athena-institute, meridian-properties, atelier-kosta, abroad-jobs)
- All `wrangler.toml` files
- All `astro.config.mjs` files
- All abroad-jobs API routes (jobs.ts, checkout.ts, webhook.ts, import.ts, sitemap.xml.ts)
- All admin API routes
- Directus client utilities
- D1 database layer (abroad-jobs/src/lib/db.ts)
- Image helper (packages/utils/src/image.ts)
- Admin middleware (sites/admin/src/middleware.ts)
- All layouts (BaseLayout.astro, SiteLayout.astro)
- CI workflows (test.yml, deploy-site.yml)
- Docker configs (template/docker-compose.yml)
- Deploy config (infra/admin/deploy.yml)
