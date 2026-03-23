# Progressive Web App & Offline Support Review

**Date:** 2026-03-23
**Scope:** All sites (abroad-jobs, admin, template, atelier-kosta, athena-institute, meridian-properties)
**Reviewer:** PWA Specialist
**Estimated Lighthouse PWA Score: 20-30/100**

---

## Executive Summary

The infront-cms platform has **zero PWA capabilities**. No site in the monorepo includes a web app manifest, service worker, offline fallback page, or any client-side caching strategy. Mobile meta tags are minimal (viewport only -- no theme-color, no apple-touch-icon). The sites are traditional server-rendered pages with no installability, no offline support, and no push notification infrastructure.

For the abroad-jobs site specifically, this is a significant missed opportunity. Job seekers browsing on mobile -- often in transit or with spotty international connectivity -- would benefit enormously from installability, offline job saving, and cached search results.

---

## 1. Web App Manifest

### Finding: ABSENT across all sites

No `manifest.json`, `site.webmanifest`, or `manifest.webmanifest` exists in any site's `public/` directory. No `<link rel="manifest">` tag exists in any layout file.

**Files checked:**
- `sites/abroad-jobs/public/` -- contains only `_headers` and `robots.txt`
- `sites/template/public/` -- contains `_headers`, `_redirects`, `favicon.svg`, `robots.txt`
- `sites/atelier-kosta/public/` -- same pattern
- `sites/athena-institute/public/` -- same pattern
- `sites/meridian-properties/public/` -- same pattern
- `sites/admin/public/` -- contains only `templates/` directory

**Impact:**
- Sites cannot be installed as standalone apps
- No "Add to Home Screen" prompt on Android/iOS
- No app name, icon, or theme color metadata for the OS
- Lighthouse PWA audit fails entirely on manifest requirements

### Recommendation

Add a `site.webmanifest` to every site's `public/` directory. Consider adding a `pwa` field to `SiteConfig` (in `packages/config/src/types.ts`) so each site can declare manifest properties through configuration, and the shared `BaseLayout.astro` can emit the `<link rel="manifest">` tag automatically.

---

## 2. Service Worker

### Finding: ABSENT across all sites

No service worker file (`sw.js`, `service-worker.js`, etc.) exists anywhere in the project source. No `navigator.serviceWorker.register()` call exists in any layout or component. No Workbox, vite-plugin-pwa, or @vite-pwa integration is present.

**Impact:**
- No offline capability whatsoever -- users see browser error page when offline
- No precaching of static assets (CSS, JS, fonts)
- No runtime caching of API responses
- No background sync for form submissions
- Lighthouse PWA audit fails all service worker criteria

### Recommendation

For abroad-jobs, implement a service worker with these caching strategies:

| Resource | Strategy | Rationale |
|----------|----------|-----------|
| Static assets (CSS, JS, images) | Cache-first | Rarely change, fast loads |
| Google Fonts (DM Sans) | Cache-first, 30d expiry | Font files are immutable |
| HTML pages | Network-first, offline fallback | Always show fresh content when online |
| `/api/jobs` responses | Stale-while-revalidate | Show cached results instantly, update in background |
| Flag images (flagcdn.com) | Cache-first, 90d expiry | Country flags never change |
| Company logos (Google favicons) | Cache-first, 7d expiry | External logos change rarely |

Use `@vite-pwa/astro` (the official Astro PWA integration) or a manual approach with Workbox.

---

## 3. Installability

### Finding: NOT INSTALLABLE

Without a manifest and service worker, no site meets the minimum installability criteria:
- No manifest with `name`, `short_name`, `start_url`, `display`, and icons
- No service worker with a `fetch` event handler
- Not served over HTTPS (though Cloudflare Pages provides this)

The abroad-jobs site serves over HTTPS via Cloudflare, so the only missing pieces are the manifest and service worker.

---

## 4. Offline Support

### Finding: NO OFFLINE SUPPORT

- No offline fallback page exists (e.g., `/offline.html`)
- No client-side data caching (no localStorage, sessionStorage, or IndexedDB usage for job data)
- The `LoadMore.tsx` island fetches from `/api/jobs` with no error handling beyond a silent catch -- users see no feedback when offline
- No "save job for later" or "offline reading" feature

**Specific code concern in `sites/abroad-jobs/src/islands/LoadMore.tsx` (lines 97-98):**

When the user is offline, the fetch fails silently. No offline indicator, no retry mechanism, no cached fallback.

**Impact:**
- Job seekers lose access to all content when connectivity drops
- No way to save interesting jobs for offline review
- International travelers (the primary audience) frequently have spotty connectivity

### Recommendation

1. Add an offline fallback page at `public/offline.html`
2. Cache the last N viewed job detail pages in the service worker
3. Add a "Save Job" feature using IndexedDB so users can bookmark jobs offline
4. Show an offline indicator banner when `navigator.onLine === false`
5. Add retry logic to `LoadMore.tsx` fetch calls with exponential backoff

---

## 5. Mobile Meta Tags

### Finding: MINIMAL -- only viewport tag present

**What exists:**
- `<meta name="viewport" content="width=device-width, initial-scale=1" />` -- present in `SEOHead.astro` and `AdminLayout.astro`

**What is missing:**
- `<meta name="theme-color">` -- no theme color for browser chrome on mobile
- `<link rel="apple-touch-icon">` -- no iOS home screen icon
- `<link rel="manifest">` -- no manifest link
- `<meta name="apple-mobile-web-app-capable">` -- not set
- `<meta name="apple-mobile-web-app-status-bar-style">` -- not set
- `<meta name="mobile-web-app-capable">` -- not set
- `<meta name="format-detection">` -- phone numbers not handled

**Files affected:**
- `packages/ui/src/components/SEOHead.astro`
- `packages/ui/src/layouts/BaseLayout.astro`
- `sites/abroad-jobs/src/layouts/SiteLayout.astro`

**Impact:**
- Browser address bar does not match brand colors on Android
- No proper icon when users add to home screen manually
- iOS Safari does not treat the site as a web app

---

## 6. Push Notifications

### Finding: ABSENT

No push notification infrastructure exists. No Push API usage, no notification permission requests, no push subscription endpoints, no web-push library.

**Impact for abroad-jobs:** This is the single most valuable PWA feature for a job board. Job seekers want to be notified when new jobs matching their criteria are posted. Without push notifications, the only way to stay updated is to manually revisit the site.

### Recommendation

Implement browser Push API with subscription storage in D1, job alert preferences per user, and push triggers from the Stripe webhook when new jobs are activated.

---

## 7. App Shell Architecture

### Finding: NOT IMPLEMENTED

The abroad-jobs site uses server-side rendering (SSR via Cloudflare Workers) for every page load. There is no app shell pattern:
- Full HTML rendered server-side on every request
- No skeleton/placeholder UI while content loads
- The React island (`LoadMore.tsx`) is the only client-side rendering
- No client-side routing (each navigation is a full server roundtrip)

### Assessment

For a job board like abroad-jobs, a full app shell architecture is not strictly necessary. The current SSR approach is fine for SEO and initial load performance. However, combining SSR with a service worker's navigation preload and stale-while-revalidate strategy would give users near-instant repeat visits.

The Astro View Transitions API could provide smoother page transitions without needing a full SPA architecture.

---

## 8. Estimated Lighthouse PWA Score

| Lighthouse PWA Criteria | Status | Notes |
|------------------------|--------|-------|
| Responds with 200 when offline | FAIL | No service worker, no offline page |
| Has a `<meta name="viewport">` tag | PASS | Present in SEOHead.astro |
| Uses HTTPS | PASS | Cloudflare Pages provides HTTPS |
| Redirects HTTP to HTTPS | PASS | Cloudflare handles this |
| Page has content when JS is disabled | PASS | SSR provides full HTML |
| Web app manifest meets requirements | FAIL | No manifest exists |
| Configured for a custom splash screen | FAIL | No manifest icons |
| Sets a theme color for the address bar | FAIL | No theme-color meta tag |
| Content is sized for viewport | PASS | Responsive Tailwind classes used |
| Has an apple-touch-icon | FAIL | No apple-touch-icon |
| Manifest has maskable icon | FAIL | No manifest |
| Service worker | FAIL | No service worker |

**Estimated PWA Score: ~25/100**

---

## 9. abroad-jobs Mobile Experience Deep Dive

### What works well

1. **Responsive layout** -- The `SearchHero.astro` uses `flex-col` to `sm:flex-row` patterns correctly.
2. **Touch-friendly targets** -- Buttons and links have adequate padding (`py-3.5`, `px-6`).
3. **Mobile navigation** -- `Nav.astro` has a proper hamburger menu with toggle behavior.
4. **Readable typography** -- Font sizes scale from `text-3xl` to `sm:text-5xl`.
5. **No horizontal overflow** -- `max-w-5xl` containers with responsive padding.
6. **Lazy loading** -- Company logos and flag images use `loading="lazy"`.

### What needs improvement

1. **No touch gestures** -- No swipe to save/dismiss jobs, no pull-to-refresh.
2. **Search UX on mobile** -- Full page reload on submit. Client-side search would be more mobile-friendly.
3. **Load More pagination** -- Explicit button tap required. Infinite scroll would be more natural on mobile.
4. **No skeleton loading states** -- Only "Loading..." text shown during fetch.
5. **Company logos hidden on mobile** -- `class="hidden shrink-0 sm:block"` removes visual context.
6. **External font loading blocks render** -- Google Fonts via `<link>` with no `font-display: swap` guarantee.
7. **No error state for failed searches** -- No user-facing error message if database query fails.
8. **No "save job" or "share job" functionality** -- Web Share API not used.

---

## Prioritized Recommendations

### P0 -- Critical (immediate impact, low effort)

| # | Action | Effort | Files |
|---|--------|--------|-------|
| 1 | Add `<meta name="theme-color">` to SEOHead.astro | 15 min | `packages/ui/src/components/SEOHead.astro` |
| 2 | Add apple-touch-icon PNG to each site's `public/` | 30 min | All `sites/*/public/` directories |
| 3 | Add `site.webmanifest` to abroad-jobs and template | 1 hr | `sites/abroad-jobs/public/site.webmanifest`, `sites/template/public/site.webmanifest` |
| 4 | Add `<link rel="manifest">` to BaseLayout or SEOHead | 15 min | `packages/ui/src/components/SEOHead.astro` |

### P1 -- High (significant user value)

| # | Action | Effort | Files |
|---|--------|--------|-------|
| 5 | Create service worker with offline fallback for abroad-jobs | 4 hrs | New: `sites/abroad-jobs/public/sw.js`, `sites/abroad-jobs/public/offline.html` |
| 6 | Add stale-while-revalidate caching for `/api/jobs` in SW | 2 hrs | `sites/abroad-jobs/public/sw.js` |
| 7 | Cache static assets (CSS, JS, fonts, flags) in SW | 2 hrs | `sites/abroad-jobs/public/sw.js` |
| 8 | Add offline detection banner component | 2 hrs | New island: `sites/abroad-jobs/src/islands/OfflineBanner.tsx` |
| 9 | Add error handling to LoadMore.tsx fetch | 1 hr | `sites/abroad-jobs/src/islands/LoadMore.tsx` |

### P2 -- Medium (enhanced mobile experience)

| # | Action | Effort | Files |
|---|--------|--------|-------|
| 10 | Add "Save Job" feature with IndexedDB | 6 hrs | New island + utility |
| 11 | Add Web Share API to job detail pages | 2 hrs | Job detail page component |
| 12 | Add PWA config to SiteConfig type | 2 hrs | `packages/config/src/types.ts` |
| 13 | Replace Load More button with infinite scroll | 3 hrs | `sites/abroad-jobs/src/islands/LoadMore.tsx` |
| 14 | Add skeleton loading states to job list | 2 hrs | `sites/abroad-jobs/src/components/JobList.astro` |

### P3 -- Low (advanced features, higher effort)

| # | Action | Effort | Files |
|---|--------|--------|-------|
| 15 | Implement push notifications for job alerts | 16+ hrs | New: subscription API, push worker, UI components |
| 16 | Add background sync for job post form | 4 hrs | Service worker + `JobPostForm.tsx` |
| 17 | Implement app shell with Astro View Transitions | 8 hrs | All layouts |
| 18 | Add periodic background sync for new jobs | 4 hrs | Service worker |

---

## Platform-Level Recommendation

Since this is a monorepo serving multiple client sites, the PWA infrastructure should be built into the shared platform:

1. **Add `pwa` field to `SiteConfig`** with `name`, `shortName`, `themeColor`, `backgroundColor`, `icons` array
2. **Generate `site.webmanifest` at build time** from `site.config.ts`
3. **Create a shared service worker template** in `packages/ui/`
4. **Add PWA meta tags to `SEOHead.astro`** reading from config
5. **Add `@vite-pwa/astro`** to the shared Astro config as an optional integration

This way, every new site generated from the template automatically gets PWA capabilities.

---

## Conclusion

The platform is well-built for traditional web delivery -- responsive design, good SEO, proper accessibility, fast SSR on Cloudflare's edge. But it entirely lacks the PWA layer that would transform these sites from "websites you visit" into "apps you use." For abroad-jobs in particular, where the audience is international job seekers on mobile with variable connectivity, PWA features are not a nice-to-have but a competitive differentiator.

The recommended approach is to start with P0 items (manifest, meta tags, icons) which can be done in under 2 hours, then implement the service worker (P1) for abroad-jobs as a pilot, and finally roll the pattern into the shared platform for all sites.
