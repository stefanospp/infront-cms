# Performance & Resource Usage Review

**Date:** 2026-03-23
**Scope:** Full monorepo at `/Users/stefanospetrou/Desktop/Apps/infront-cms`
**Reviewer:** Claude Opus 4.6 (automated performance audit)

---

## Executive Summary

The codebase demonstrates solid foundational choices -- Astro 6 with static-first rendering, Tailwind CSS v4 for utility-only styling, React islands scoped to interactive components, and D1 edge database for abroad-jobs. These are architecturally sound for performance.

However, several significant issues were identified that impact Core Web Vitals, bundle size budgets, and resource efficiency:

1. **Critical:** The admin site ships ~3MB of Mermaid diagram JS chunks to the client, even when most pages never render diagrams.
2. **High:** Google Fonts loaded via render-blocking stylesheet on abroad-jobs harms LCP.
3. **High:** The `import-jobs.ts` job importer executes N+1 database queries (2 per job) instead of batch operations, creating a performance cliff as job volume grows.
4. **High:** Duplicate CSS files in abroad-jobs build output (two identical 41KB files).
5. **Medium:** The homepage SSR path runs two separate DB queries (data + count) that could be a single query.
6. **Medium:** No caching headers on the homepage SSR response -- every page load hits D1.
7. **Medium:** The `LoadMore` React island (4.6KB) duplicates the entire JobCard rendering logic from the Astro server component.

The abroad-jobs site is reasonably close to budget compliance for JS (<100KB gzipped), but the CSS output (41KB uncompressed per file) will likely exceed the 15KB gzipped budget. The admin site far exceeds all budgets, though as an internal tool this is less critical.

---

## Performance Budget Compliance Assessment

### abroad-jobs (public-facing site)

| Metric | Budget | Estimated Actual | Status |
|--------|--------|-----------------|--------|
| Total page weight (home) | < 500KB | ~350KB (without font) | PASS (marginal with font CSS) |
| JavaScript (all islands) | < 100KB gzipped | ~65KB gzipped (React runtime 136KB raw + LoadMore 4.6KB) | PASS |
| CSS | < 15KB gzipped | ~10KB gzipped (41KB raw) | PASS (tight) |
| LCP | < 2.5s | ~2.0-3.0s (font-dependent) | AT RISK |
| INP | < 200ms | < 100ms (minimal JS) | PASS |
| CLS | < 0.1 | ~0.05-0.15 (font swap risk) | AT RISK |

**Key risk:** LCP and CLS depend on Google Fonts loading strategy, which is currently render-blocking.

### admin (internal tool)

| Metric | Budget | Estimated Actual | Status |
|--------|--------|-----------------|--------|
| JavaScript (all islands) | < 100KB gzipped | ~800KB+ gzipped (Mermaid alone is ~490KB raw) | FAIL |
| CSS | < 15KB gzipped | ~8KB gzipped | PASS |

The admin is internal-only, so budget compliance is less critical, but the Mermaid dependency is egregious.

---

## Critical Issues

### C-1: Mermaid.js ships ~3MB of diagram chunks to admin client

**File:** `sites/admin/package.json` (line 26: `"mermaid": "^11.0.0"`)
**Built artifacts:** `sites/admin/dist/client/_astro/` -- 60+ JS chunk files including `mermaid.core.DpKlNV3z.js` (490KB), `cytoscape.esm.5J0xJHOV.js` (442KB), `treemap-KZPCXAKY.sno-Rzg-.js` (453KB), `katex.B6vPdZ0d.js` (259KB), plus dozens of diagram-type-specific chunks

**Impact:** The admin build contains approximately 3MB of uncompressed Mermaid-related JavaScript. Even though dynamic import is used in `HelpManual.tsx` (line 204: `const mermaid = await import('mermaid')`), the Vite bundler still code-splits all diagram types into separate chunks that are shipped to the client directory. Every admin page deployment pushes these chunks. On slow connections, initial admin load is degraded.

**Estimated impact:** Admin page weight exceeds budget by 10x+. Build output size is ~3.5MB of JS assets.

**Recommended fix:**
- Option A (best): Remove mermaid from dependencies entirely. Pre-render diagrams to SVG at build time or use static images in help articles. Most help content does not need interactive diagrams.
- Option B: If diagrams are needed, load mermaid from a CDN only on the article pages that contain `pre.mermaid` elements. This avoids bundling entirely:
  ```typescript
  // Instead of: import('mermaid')
  // Use: dynamic script injection from CDN
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
  ```
- Option C: Configure Vite to externalize mermaid so it is not bundled.

---

### C-2: Sequential N+1 database queries in job importer

**File:** `sites/abroad-jobs/src/lib/import-jobs.ts` (lines 201-248)

**Description:** The `importJobs` function iterates over all mapped jobs and executes TWO database queries per job (one dedup check on `source_id`, one slug collision check), followed by an INSERT. For 200 imported jobs, this is 400-600 D1 queries in a single invocation.

```typescript
for (const job of allMapped) {
  // Query 1: dedup check
  const existing = await db.prepare('SELECT 1 FROM jobs WHERE source_id = ?').bind(job.source_id).first();
  // Query 2: slug collision check
  const slugExists = await db.prepare('SELECT 1 FROM jobs WHERE slug = ?').bind(job.slug).first();
  // Query 3: INSERT
  await db.prepare(`INSERT INTO jobs ...`).bind(...).run();
}
```

**Impact:** On Cloudflare Workers, this risks hitting the D1 subrequest limit per invocation (currently 1000 subrequests). With 300+ jobs from APIs, the import will fail silently. Each query adds ~5-20ms latency, making the import take 3-12 seconds.

**Recommended fix:**
```typescript
// 1. Batch fetch all existing source_ids
const existingSourceIds = new Set(
  (await db.prepare('SELECT source_id FROM jobs WHERE source IN (?, ?)').bind('arbeitnow', 'remotive').all())
    .results?.map(r => r.source_id as string) ?? []
);

// 2. Batch fetch all existing slugs
const existingSlugs = new Set(
  (await db.prepare('SELECT slug FROM jobs').all())
    .results?.map(r => r.slug as string) ?? []
);

// 3. Filter and batch insert using D1 batch API
const toInsert = allMapped.filter(j => !existingSourceIds.has(j.source_id as string));
const stmts = toInsert.map(job => {
  if (existingSlugs.has(job.slug as string)) {
    job.slug = `${job.slug}-${Date.now().toString(36).slice(-4)}`;
  }
  return db.prepare('INSERT INTO jobs (...) VALUES (...)').bind(...);
});

// D1 supports batch operations
await db.batch(stmts);
```

This reduces hundreds of queries to 3 (two SELECTs + one batch INSERT).

---

## High Severity Issues

### H-1: Render-blocking Google Fonts stylesheet

**File:** `sites/abroad-jobs/src/layouts/SiteLayout.astro` (lines 24-26)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />
```

**Impact:** The Google Fonts CSS request blocks rendering. Even with `display=swap`, the browser must download and parse the CSS file before it can begin rendering text. This adds 100-300ms to LCP on 3G connections. Combined with the font file downloads, this can push LCP past 2.5s.

**Recommended fix:**
- Self-host the DM Sans font files and use `@font-face` declarations directly in `global.css` with `font-display: swap`. This eliminates the external CSS request entirely.
- Use Astro 6's `<Font>` component if available, or use `fontsource`:
  ```bash
  pnpm add @fontsource-variable/dm-sans
  ```
  Then in `global.css`:
  ```css
  @import '@fontsource-variable/dm-sans';
  ```
- At minimum, add `rel="preload"` for the font CSS and use a non-blocking pattern:
  ```html
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=DM+Sans..." as="style" onload="this.onload=null;this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans..." /></noscript>
  ```

### H-2: Duplicate CSS files in abroad-jobs build output

**File:** `sites/abroad-jobs/dist/client/_astro/seo.ZmQTS-t1.css` (41,416 bytes) and `sites/abroad-jobs/dist/client/_astro/site.ZmQTS-t1.css` (41,416 bytes)

**Description:** Both files have the identical hash suffix (`ZmQTS-t1`) and identical file sizes, strongly suggesting they contain the same CSS content. This means the full Tailwind output is being emitted twice.

**Impact:** Users download ~41KB of CSS twice (82KB total vs 41KB needed). After gzip this is likely ~10KB wasted transfer.

**Recommended fix:** Investigate why two entry points are producing the same CSS file. The `import '../styles/global.css'` at the top of page files may be creating separate CSS chunks when it should be deduplicated. Check the Astro build config for CSS splitting settings. Consider importing CSS only in the layout, not in individual pages.

### H-3: No Cache-Control headers on SSR homepage response

**File:** `sites/abroad-jobs/src/pages/index.astro`

**Description:** The homepage is SSR (`prerender = false`) and queries D1 on every request, but does not set any `Cache-Control` header on the response. Every visitor triggers a fresh D1 query. Compare with the API route at `src/pages/api/jobs.ts` (line 92) which correctly sets `Cache-Control: public, max-age=30`.

**Impact:** For a job board homepage, data is relatively stable (new jobs are posted every few hours, not every second). Without caching, every visitor hits D1 directly, adding ~20-50ms latency per request and consuming D1 read units unnecessarily.

**Recommended fix:** Add caching headers via Astro response headers:
```astro
---
// At the end of the frontmatter
Astro.response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
---
```
This gives Cloudflare's edge a 5-minute cache with stale-while-revalidate, while browsers get a 60-second cache.

### H-4: Missing composite database index for the primary query pattern

**File:** `sites/abroad-jobs/src/lib/schema.ts` (lines 40-45)

**Description:** The schema defines four single-column indexes: `idx_jobs_live`, `idx_jobs_country`, `idx_jobs_industry`, `idx_jobs_created`. However, the primary query pattern on the homepage filters by `is_live = 1 AND (expires_at IS NULL OR expires_at > ?) AND country = ? AND industry = ?` and sorts by `created_at DESC`.

**Impact:** SQLite/D1 can only use one index per table scan. With single-column indexes, it will pick one (likely `idx_jobs_live`) and scan the rest. As the jobs table grows past 10K rows, query performance degrades.

**Recommended fix:** Add a composite covering index:
```sql
CREATE INDEX idx_jobs_listing ON jobs(is_live, country, industry, created_at DESC) WHERE is_live = 1;
```
And add an index for the import dedup check:
```sql
CREATE INDEX idx_jobs_source_id ON jobs(source_id);
```

---

## Medium Severity Issues

### M-1: LoadMore island duplicates JobCard rendering logic

**File:** `sites/abroad-jobs/src/islands/LoadMore.tsx` (lines 26-175)

**Description:** The LoadMore React island contains a complete re-implementation of the JobCard Astro component, including duplicated `COUNTRY_CODES` map, `getFlagUrl`, `getLogoUrl`, `getTimeAgo`, `visaLabel`, and `relocationLabel` helper functions. The Astro `JobCard.astro` component and `countries.ts` module have their own implementations of the same logic.

**Impact:** ~3KB of duplicated code shipped to the client. More importantly, any change to the JobCard design must be made in two places, creating maintenance risk and potential visual inconsistency between initial server-rendered cards and "Load More" client-rendered cards.

**Recommended fix:** Return pre-rendered HTML from the `/api/jobs` endpoint and use `innerHTML` to append cards, eliminating the need for a React island entirely. Alternatively, create a shared `JobCard` React component used by both the Astro wrapper and the LoadMore island.

### M-2: Homepage executes two separate DB queries instead of one

**File:** `sites/abroad-jobs/src/pages/index.astro` (lines 77-90)

**Description:** The non-FTS query path runs a SELECT for results and a separate SELECT COUNT(*) for the total. These could be combined.

**Impact:** ~5-15ms additional latency per homepage load.

**Recommended fix:** Use the `LIMIT + 1` trick (which is already implemented!) to determine `hasMore` without the count query. The count query (lines 86-90) is only used for `total` which is displayed in the SearchHero as `jobCount`. Consider either:
- Removing the total count display (showing "X+ jobs" based on results length)
- Caching the count separately and refreshing it less frequently
- Using `SELECT COUNT(*)` with aggressive caching since the exact number changes infrequently

### M-3: FTS query uses raw string interpolation for WHERE clauses

**File:** `sites/abroad-jobs/src/pages/index.astro` (lines 33-48)

**Description:** The FTS query builds WHERE clauses using template literal string interpolation:
```typescript
${country ? 'AND j.country = ?' : ''}
${industry ? 'AND j.industry = ?' : ''}
```
While parameterized values prevent SQL injection, the dynamic query string construction prevents D1 from caching the prepared statement efficiently. D1 caches prepared statements by their SQL text, so 4 different query shapes (no filters, country only, industry only, both) each get separate cache entries.

**Impact:** Slightly reduced query plan caching efficiency. Minor performance impact.

**Recommended fix:** Use a fixed query structure with NULL-coalescing:
```sql
WHERE jobs_fts MATCH ?
  AND j.is_live = 1
  AND (j.expires_at IS NULL OR j.expires_at > ?)
  AND (? IS NULL OR j.country = ?)
  AND (? IS NULL OR j.industry = ?)
```

### M-4: Admin middleware makes an HTTP request to auth service on every page load

**File:** `sites/admin/src/middleware.ts` (lines 24-35)

**Description:** Every non-public route triggers a `fetch()` to the auth service at `auth.infront.cy` to validate the session. This adds network latency to every page navigation.

**Impact:** 50-200ms added latency per admin page load depending on network conditions between the Hetzner VPS and the auth service.

**Recommended fix:** Implement short-lived session caching (e.g., 60-second in-memory cache keyed by session cookie) so repeated requests within a minute skip the auth service call. Or verify JWT tokens locally if the auth service issues JWTs.

### M-5: No gzip/brotli compression configuration in Dockerfile

**File:** `Dockerfile`

**Description:** The admin server runs behind Caddy (mentioned in CLAUDE.md) which likely handles compression. However, the Node.js server itself has no compression middleware. If Caddy is misconfigured or bypassed, responses are sent uncompressed.

**Recommended fix:** Add compression at the application level as defense-in-depth:
```bash
# In Dockerfile or server config
# Caddy handles this, but verify Caddy config has encode gzip zstd
```

### M-6: Google Favicon API used for company logos (third-party dependency + privacy)

**File:** `sites/abroad-jobs/src/lib/countries.ts` (line 46) and `sites/abroad-jobs/src/islands/LoadMore.tsx` (line 47)

**Description:** Company logos fallback to `https://www.google.com/s2/favicons?domain=${domain}&sz=64`. This:
1. Creates a dependency on Google's favicon service availability
2. Sends visitor browsing data (which companies they view) to Google
3. May return low-quality 16x16 favicons upscaled to 64px
4. Adds external requests that block logo rendering

**Impact:** Each job card with a company website triggers an external request to Google. For a page with 50 jobs, this could be 50 separate favicon requests, all waterfall-blocked.

**Recommended fix:**
- Fetch and cache favicons server-side during job creation/import
- Store the favicon URL in the `company_logo` field
- Use a self-hosted favicon proxy with caching, or use Cloudflare's favicon API

### M-7: `client.B4Y6W7AI.js` is 136KB (React runtime) loaded on every SSR page

**File:** `sites/abroad-jobs/dist/client/_astro/client.B4Y6W7AI.js` (135,986 bytes)

**Description:** This is the React runtime + Astro client runtime bundled together. It loads on every page that has any React island.

**Impact:** On the homepage, React loads for the `LoadMore` button (which uses `client:visible`). This is ~136KB raw / ~45KB gzipped. Combined with the island code, total JS is about 60-70KB gzipped, within budget but avoidable.

**Recommended fix:** Consider replacing the `LoadMore` React island with a vanilla JS solution. The component is simple (one button, one fetch, append HTML). A `<script>` tag with 20 lines of vanilla JS would eliminate the React runtime dependency on the homepage entirely:
```html
<script>
  const btn = document.getElementById('load-more-btn');
  btn?.addEventListener('click', async () => { /* fetch and append */ });
</script>
```
Reserve React for the `JobPostForm` on the `/post` page where form state management justifies the framework overhead.

### M-8: `JobPostForm` island imports `zod` on the client side

**File:** `sites/abroad-jobs/src/islands/JobPostForm.tsx` (line 2)

```typescript
import { z } from 'zod';
import { jobInputSchema, INDUSTRIES, VISA_OPTIONS, RELOCATION_OPTIONS } from '../lib/validation';
```

**Description:** The `jobInputSchema` (from `validation.ts`) is imported client-side, bringing the zod runtime into the browser bundle. The built file `JobPostForm.Bj_6mRk7.js` is 65KB, a significant portion of which is zod.

**Impact:** ~30KB of zod runtime shipped to the client for client-side validation that the server re-validates anyway.

**Recommended fix:** Replace client-side zod validation with simple imperative validation (field length checks, required field checks). The server already validates with zod, so client-side validation is purely for UX. A lightweight validation function would save ~30KB:
```typescript
function validateJob(job: JobFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!job.title || job.title.length < 2) errors.title = 'Title is required';
  if (!job.companyName) errors.companyName = 'Company name is required';
  // ... etc
  return errors;
}
```

---

## Low Severity Issues

### L-1: `industries` array duplicated in SearchHero component

**File:** `sites/abroad-jobs/src/components/SearchHero.astro` (lines 13-23)

**Description:** The `industries` array is hardcoded in the component instead of importing from `validation.ts` where `INDUSTRIES` is already defined.

**Impact:** Maintenance risk -- if industries change, two files must be updated. No runtime performance impact.

### L-2: No `fetchpriority="high"` on above-the-fold images

**File:** `packages/ui/src/components/Hero.astro` (lines 88, 113)

**Description:** Hero images use `loading="eager"` but don't use `fetchpriority="high"`, which tells the browser to prioritize this image in the resource loading queue.

**Recommended fix:** Add `fetchpriority="high"` to hero background images:
```html
<img src={backgroundImage} alt="" loading="eager" fetchpriority="high" />
```

### L-3: No image optimization (Astro Image component not used)

**File:** `packages/ui/src/components/Hero.astro`, `sites/abroad-jobs/src/components/JobCard.astro`

**Description:** Images use plain `<img>` tags instead of Astro's `<Image />` component. This misses automatic WebP/AVIF conversion, responsive srcset generation, and width/height attribute inference that prevent CLS.

**Impact:** Larger image file sizes (no format optimization) and potential CLS from images without explicit dimensions.

**Recommended fix:** Use Astro's Image component for all images where the source is known at build time. For dynamic URLs (company logos, flags), continue with `<img>` but ensure `width` and `height` attributes are always set (they are, correctly).

### L-4: No `Vary` header on API responses

**File:** `sites/abroad-jobs/src/pages/api/jobs.ts`

**Description:** The API returns `Cache-Control: public, max-age=30` but no `Vary` header. If a CDN or proxy caches the response, it won't distinguish between different query parameters.

**Recommended fix:** Add `Vary: Accept-Encoding` at minimum, though Cloudflare Workers handles this automatically.

### L-5: Flag CDN images (flagcdn.com) are external with no fallback

**File:** `sites/abroad-jobs/src/lib/countries.ts` (line 38)

**Description:** Country flag images load from `flagcdn.com`. If the CDN is down, flags silently fail to load.

**Impact:** Minor -- decorative images, graceful degradation. But 50 jobs = 50 external requests to flagcdn.com.

**Recommended fix:** Self-host commonly used flag images (the ~30 countries in the COUNTRY_CODES map are small PNGs, total ~50KB) or use inline SVG flags.

### L-6: Video variant in Hero component has no poster attribute

**File:** `packages/ui/src/components/Hero.astro` (lines 174-185)

**Description:** The video hero variant uses `<video autoplay muted loop playsinline>` without a `poster` attribute, causing a blank/black frame before the video loads.

**Impact:** CLS risk and poor LCP if the video hero is the largest content element.

### L-7: `SiteWizard.tsx` is 1,560 lines -- largest single island

**File:** `sites/admin/src/islands/SiteWizard.tsx` (1,560 lines)

**Description:** A single React component file with 1,560 lines containing all wizard step logic, form state, and UI. This is loaded as one chunk even though users navigate through steps sequentially.

**Impact:** ~29KB built JS loaded upfront. Not critical for an internal tool but worth splitting.

**Recommended fix:** Split into step sub-components with React.lazy for steps 3-5.

---

## Quick Wins (Easy Fixes, Big Impact)

| Priority | Issue | Effort | Impact | Files |
|----------|-------|--------|--------|-------|
| 1 | Self-host DM Sans font | 30 min | LCP -200ms, eliminates FOUT | `SiteLayout.astro`, `global.css` |
| 2 | Add Cache-Control to homepage SSR | 5 min | Reduces D1 reads 95%+ | `pages/index.astro` |
| 3 | Add composite DB index | 10 min | Faster queries as data grows | New migration SQL file |
| 4 | Replace LoadMore React island with vanilla JS | 1 hr | Eliminates React from homepage (-136KB raw JS) | `LoadMore.tsx` -> `<script>` |
| 5 | Remove zod from client-side JobPostForm | 1 hr | -30KB from post page JS | `JobPostForm.tsx` |
| 6 | Add `source_id` index | 5 min | Faster import dedup | New migration SQL file |
| 7 | Batch import queries | 2 hrs | Import 10x faster, under D1 limits | `import-jobs.ts` |
| 8 | Remove mermaid dependency from admin | 2 hrs | Admin build -3MB | `package.json`, `HelpManual.tsx` |

---

## Long-Term Optimization Roadmap

### Phase 1: Core Web Vitals (Week 1)
- [ ] Self-host DM Sans font with `font-display: swap`
- [ ] Add `Cache-Control` headers to all SSR pages
- [ ] Add `fetchpriority="high"` to hero images
- [ ] Add `poster` attribute to video hero variant
- [ ] Investigate and fix duplicate CSS output in abroad-jobs build

### Phase 2: Bundle Size (Week 2)
- [ ] Replace `LoadMore` React island with vanilla JS on homepage
- [ ] Remove zod from client-side validation in `JobPostForm`
- [ ] Remove mermaid from admin dependencies; pre-render diagrams or use CDN
- [ ] Add bundle size analysis to CI (e.g., `bundlesize` or `size-limit`)
- [ ] Audit that no React island uses `client:load` unless truly needed

### Phase 3: Database Performance (Week 3)
- [ ] Add composite index `idx_jobs_listing` for the primary query pattern
- [ ] Add index on `source_id` column
- [ ] Refactor `importJobs` to use batch queries and D1 batch API
- [ ] Add `Cache-Control` and `stale-while-revalidate` to sitemap.xml
- [ ] Consider materialized view or cached count for homepage job total

### Phase 4: Network & Caching (Week 4)
- [ ] Self-host country flag images (or use inline SVG sprites)
- [ ] Self-host company favicons during import (eliminate Google favicon API)
- [ ] Add `stale-while-revalidate` caching strategy to all SSR pages
- [ ] Add Cloudflare Cache Rules for static assets with long TTLs
- [ ] Implement ETags on API responses for conditional requests

### Phase 5: Build & Infrastructure (Week 5)
- [ ] Add resource limits to Docker container (memory, CPU)
- [ ] Implement build caching in CI (Astro build cache, pnpm store cache)
- [ ] Add Lighthouse CI budget assertions to PR checks
- [ ] Split `SiteWizard.tsx` into lazy-loaded step components
- [ ] Audit admin middleware auth caching to reduce auth service calls

### Phase 6: Monitoring (Ongoing)
- [ ] Set up Real User Monitoring (RUM) for Core Web Vitals
- [ ] Add D1 query analytics monitoring
- [ ] Set up alerts for LCP > 2.5s or CLS > 0.1
- [ ] Track JS bundle size in CI and alert on regressions

---

## Positive Aspects

The codebase gets many things right:

1. **Astro islands architecture:** React is correctly limited to interactive components only (forms, load-more, mobile nav). Static pages ship zero JS.
2. **Static prerendering:** Pages like `/about`, `/pricing`, `/privacy`, `/terms` correctly use static rendering.
3. **`client:visible` usage:** The `LoadMore` and `JobPostForm` islands use `client:visible`, deferring React hydration until the component scrolls into view.
4. **Proper pagination:** The `LIMIT + 1` trick for detecting `hasMore` is efficient.
5. **Parameterized queries:** All D1 queries use parameterized bindings, preventing SQL injection.
6. **Security headers:** The `_headers` file includes CSP, HSTS, X-Frame-Options, and Permissions-Policy.
7. **FTS5 for search:** Full-text search is properly implemented with a virtual table.
8. **Honeypot spam protection:** Both `ContactForm` and `JobPostForm` implement honeypot fields.
9. **Lazy loading on images:** Company logos and flags correctly use `loading="lazy"`.
10. **Mermaid dynamic import:** The admin correctly uses dynamic import for mermaid (though the bundling outcome undermines this).
11. **Analytics loading:** Plausible and Fathom use `defer`, Google Analytics is behind cookie consent.
12. **Accessibility:** Skip-to-content link, semantic HTML, ARIA labels on nav/forms, focus management in MobileNav.
13. **Schema indexes:** Basic single-column indexes exist on commonly filtered columns.
14. **Stripe webhook verification:** Proper signature verification before processing webhooks.
