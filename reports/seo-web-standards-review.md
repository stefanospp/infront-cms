# SEO & Web Standards Review

**Date:** 2026-03-23
**Scope:** Full monorepo — packages/ui, packages/utils, all client sites (abroad-jobs, atelier-kosta, athena-institute, meridian-properties), template site, admin site
**Reviewer:** Claude Opus 4.6 (SEO & Web Standards Specialist)

---

## Executive Summary

The platform has a **solid foundation** for SEO: the shared `BaseLayout` and `SEOHead` components correctly implement title tags, meta descriptions, Open Graph tags, canonical URLs, and JSON-LD structured data injection. The `html lang` attribute is dynamically set from `site.config.ts`, skip-to-content links are present, and semantic landmark elements (`<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`) are used consistently.

However, there are **significant gaps** that are costing organic visibility today:

1. **No Twitter Card meta tags** across the entire platform (affects social sharing on X/Twitter).
2. **Canonical URLs are not set on any page** — only the prop plumbing exists, but no page actually passes `canonicalUrl`, meaning Google may index duplicate URLs (trailing slash variants, query-string variants).
3. **Structured data is almost entirely absent** — only `abroad-jobs/jobs/[slug].astro` emits `JobPosting` schema. No site has Organization, LocalBusiness, BreadcrumbList, WebSite, or FAQPage schema.
4. **OG images referenced in every `site.config.ts` (`/og-default.jpg`) do not exist** in any site's `public/` directory.
5. **abroad-jobs has no 404 page**, privacy/terms pages are noindexed (acceptable for terms, questionable for privacy), and the homepage sitemap includes privacy/terms but those pages tell Google not to index them.
6. **No `@astrojs/sitemap` integration** for abroad-jobs — it uses a hand-rolled sitemap that misses edge cases. Static sites reference `sitemap-index.xml` in robots.txt but rely on `@astrojs/sitemap` which may not emit that exact filename.

**Estimated ranking impact:** Fixing the top 5 issues below could measurably improve click-through rates from search (OG images, Twitter cards), reduce index bloat (canonicals), and unlock rich result eligibility (structured data).

---

## Issues by Severity

### CRITICAL

#### C1. OG images do not exist — all sites

**Files affected:**
- `/sites/abroad-jobs/site.config.ts` (line 17)
- `/sites/atelier-kosta/site.config.ts` (line 25)
- `/sites/athena-institute/site.config.ts` (line 24)
- `/sites/meridian-properties/site.config.ts` (line 24)
- `/sites/template/site.config.ts` (line 24)

**Description:** Every `site.config.ts` sets `defaultOgImage: '/og-default.jpg'`, and `SEOHead.astro` resolves this to an absolute URL. However, **no site has an `og-default.jpg` (or any `og-*` file) in its `public/` directory**. When this page is shared on Facebook, LinkedIn, Twitter, Slack, or any platform that reads OG tags, the image will 404.

**SEO impact:** HIGH. Social sharing is a major traffic driver. A broken OG image means posts will render with a generic link preview or no image at all, drastically reducing click-through rates. Some crawlers also flag broken OG images as quality signals.

**Recommended fix:**
1. Create a branded 1200x630px OG image for each site and place it at `sites/<slug>/public/og-default.jpg`.
2. Add an automated check in CI that validates all referenced OG images exist.
3. Consider generating per-page OG images dynamically using `@vercel/og` or `satori` for important pages (especially job detail pages on abroad-jobs).

---

#### C2. Canonical URLs never set on any page

**Files affected:**
- `/packages/ui/src/components/SEOHead.astro` (lines 30-34, 49-50)
- Every page file across all sites (none pass `canonicalUrl` prop)

**Description:** The `SEOHead` component supports `canonicalUrl` and will render `<link rel="canonical">` and `<meta property="og:url">` when provided. However, **no page in the entire codebase actually passes this prop**. This means:
- No page has a canonical URL tag.
- No page has `og:url` set.
- Google may index both `/about` and `/about/` (or query-string variants like `/?q=test&country=Germany`) as separate pages, splitting page authority.

**SEO impact:** CRITICAL for abroad-jobs where the homepage is SSR with query parameters (`?q=...&country=...&industry=...&page=...`). Google could index hundreds of filter URL variations as separate pages, causing severe index bloat and diluted rankings.

**Recommended fix:**
1. In `BaseLayout.astro`, auto-compute the canonical URL from `Astro.url` when `canonicalUrl` is not explicitly provided:
```astro
const resolvedCanonical = canonicalUrl ?? new URL(Astro.url.pathname, config.url).href;
```
2. Pass this to `SEOHead` so every page automatically gets a canonical URL.
3. For abroad-jobs specifically, the homepage canonical should always be `https://abroadjobs.eu/` regardless of query parameters, to consolidate all search/filter variations.
4. For pagination (`?page=2`, `?page=3`), use `rel="next"` and `rel="prev"` link elements (Google has de-emphasized these, but Bing still uses them).

---

#### C3. No Twitter Card meta tags anywhere

**File affected:** `/packages/ui/src/components/SEOHead.astro`

**Description:** The `SEOHead` component renders Open Graph tags (`og:title`, `og:description`, `og:type`, `og:image`, `og:url`) but **completely omits Twitter Card meta tags**. Twitter/X uses its own meta tags and falls back to OG only partially.

**SEO impact:** HIGH. Links shared on X/Twitter will have degraded previews. Twitter Cards also affect how links appear in DMs and embeds across platforms that respect Twitter Card markup.

**Recommended fix:** Add to `SEOHead.astro`:
```html
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
{resolvedOgImage && <meta name="twitter:image" content={resolvedOgImage} />}
```

---

### HIGH

#### H1. No structured data on any site except abroad-jobs job detail pages

**Files affected:** All page files across all sites (only `/sites/abroad-jobs/src/pages/jobs/[slug].astro` uses `structuredData`)

**Description:** The platform has full infrastructure for structured data — `SEOHead` renders JSON-LD, `BaseLayout` accepts a `structuredData` prop, and `packages/utils/src/seo.ts` has a `generateStructuredData()` helper. Yet **almost no page uses it**:
- No site emits `Organization` or `LocalBusiness` schema (even though `site.config.ts` has all the data needed: name, address, phone, email).
- No site emits `WebSite` schema with `SearchAction` (especially important for abroad-jobs).
- No site emits `BreadcrumbList` schema (abroad-jobs has a visual breadcrumb but no schema).
- Athena Institute's FAQ page has no `FAQPage` schema.
- Meridian Properties property pages have no `RealEstateListing` schema.
- Atelier Kosta project pages have no `ArchitectureProject` or `CreativeWork` schema.
- abroad-jobs homepage has no `WebSite` schema with `SearchAction` for Google job search integration.

**SEO impact:** Structured data unlocks rich results in Google Search (rich snippets, FAQ dropdowns, job search integration, breadcrumb trails). Missing it means missing out on enhanced SERP visibility.

**Recommended fix (prioritized):**

1. **Organization schema on every site's homepage** — use `generateStructuredData()` from utils:
```typescript
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization', // or 'LocalBusiness' for atelier-kosta, meridian-properties
  name: config.name,
  url: config.url,
  description: config.seo.defaultDescription,
  email: config.contact.email,
  telephone: config.contact.phone,
  address: config.contact.address ? {
    '@type': 'PostalAddress',
    streetAddress: config.contact.address.street,
    addressLocality: config.contact.address.city,
    postalCode: config.contact.address.postcode,
    addressCountry: config.contact.address.country,
  } : undefined,
};
```

2. **WebSite + SearchAction on abroad-jobs homepage**:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AbroadJobs.eu",
  "url": "https://abroadjobs.eu",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://abroadjobs.eu/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

3. **BreadcrumbList on abroad-jobs job detail pages** — the visual Breadcrumb component already has the data:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Jobs", "item": "https://abroadjobs.eu/" },
    { "@type": "ListItem", "position": 2, "name": "Job Title" }
  ]
}
```

4. **FAQPage schema on Athena Institute services page** (which uses the `FAQ` component).

5. **LocalBusiness schema for Atelier Kosta and Meridian Properties** (both have physical addresses).

---

#### H2. abroad-jobs: Missing `Disallow: /api/` in robots.txt

**File:** `/sites/abroad-jobs/public/robots.txt`

**Description:** The abroad-jobs robots.txt allows all paths:
```
User-agent: *
Allow: /
Sitemap: https://abroadjobs.eu/sitemap.xml
```
Unlike all other sites (which have `Disallow: /api/`), abroad-jobs does not block the `/api/` routes. This means Google could crawl and attempt to index `/api/jobs` and `/api/checkout`.

**SEO impact:** API endpoints returning JSON will confuse crawlers and waste crawl budget. The checkout endpoint could expose internal structure.

**Recommended fix:** Add `Disallow: /api/` to abroad-jobs robots.txt:
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /success

Sitemap: https://abroadjobs.eu/sitemap.xml
```
Also disallow `/success` as it's already noindexed and contains session-specific content.

---

#### H3. abroad-jobs: No 404 page

**Description:** abroad-jobs has no `src/pages/404.astro` file. When a user hits a non-existent URL, they will get the default Cloudflare or Astro error page with no branding, no navigation, and no way to find their way back to the site.

**SEO impact:** MEDIUM. Custom 404 pages improve user experience, reduce bounce rates, and provide internal linking opportunities. Search engines also evaluate 404 handling as a quality signal.

**Recommended fix:** Create `/sites/abroad-jobs/src/pages/404.astro` following the pattern from other sites (e.g., atelier-kosta).

---

#### H4. abroad-jobs: Privacy and Terms pages are noindexed

**Files:**
- `/sites/abroad-jobs/src/pages/privacy.astro` (line 12)
- `/sites/abroad-jobs/src/pages/terms.astro` (line 12)

**Description:** Both privacy and terms pages have `noIndex={true}`, yet they are included in the sitemap (`sitemap.xml.ts`, line 21: `staticPages` array includes `/privacy` and `/terms`). This sends conflicting signals to Google: the sitemap says "index this page" while the meta tag says "don't index this page."

**SEO impact:** MEDIUM. The conflicting signals may cause Google to ignore the noindex and index the pages anyway, or vice versa. More importantly, privacy pages can rank for branded "privacy policy" queries and build topical authority for trust signals.

**Recommended fix:**
- Either remove `noIndex={true}` from privacy/terms (recommended — these are legitimate pages), or
- Remove `/privacy` and `/terms` from the sitemap entries in `sitemap.xml.ts`.
- The `success` page correctly has `noIndex={true}` and should also be excluded from the sitemap.

---

#### H5. Sitemap inconsistencies across sites

**Files:**
- `/sites/abroad-jobs/public/robots.txt` references `sitemap.xml`
- `/sites/atelier-kosta/public/robots.txt` references `sitemap-index.xml`
- `/sites/athena-institute/public/robots.txt` references `sitemap-index.xml`
- `/sites/meridian-properties/public/robots.txt` references `sitemap-index.xml`
- `/sites/template/public/robots.txt` references `sitemap-index.xml`

**Description:**
1. Static sites (atelier-kosta, athena-institute, meridian-properties) use `@astrojs/sitemap` which generates `sitemap-index.xml`. This should work correctly.
2. abroad-jobs has a hand-rolled `sitemap.xml.ts` at the correct URL, but it does **not** include dynamic job URLs with `<lastmod>` for jobs that have been updated (only `activatedAt`).
3. abroad-jobs sitemap includes `/privacy` and `/terms` which are noindexed (see H4).
4. Template site's robots.txt references `https://example.com/sitemap-index.xml` — a placeholder URL that was never updated.

**SEO impact:** Sitemaps are the primary mechanism for search engines to discover and prioritize URLs. Inconsistencies reduce crawl efficiency.

**Recommended fix:**
1. Fix template robots.txt to use a placeholder that makes the issue obvious (e.g., `TODO_REPLACE_SITE_URL`).
2. Remove noindexed pages from abroad-jobs sitemap.
3. Consider adding `<lastmod>` to static pages in abroad-jobs sitemap based on build time.

---

#### H6. abroad-jobs JobPosting schema: salary structure is incorrect

**File:** `/sites/abroad-jobs/src/pages/jobs/[slug].astro` (lines 66-75)

**Description:** The `baseSalary` structured data uses `salaryRange` (a free-text string like "EUR 50,000 - 70,000") as the `value` of a `QuantitativeValue`. Google expects `value` to be a number, or `minValue`/`maxValue` for ranges, not a string.

```typescript
baseSalary: {
  '@type': 'MonetaryAmount',
  currency: 'EUR',
  value: {
    '@type': 'QuantitativeValue',
    value: job.salaryRange,  // This is a string like "EUR 50,000 - 70,000"
  },
},
```

**SEO impact:** Google's Rich Results validator will reject this. The salary won't appear in Google for Jobs results.

**Recommended fix:** Either:
1. Parse `salaryRange` into `minValue`/`maxValue` numbers, or
2. Omit `baseSalary` entirely when the value can't be parsed to a numeric format, or
3. Store salary min/max as separate integer columns in the database schema.

---

### MEDIUM

#### M1. No favicon for abroad-jobs

**Description:** abroad-jobs has no `favicon.svg` or `favicon.ico` in its `public/` directory (all other sites have `favicon.svg`). Additionally, no site has a `<link rel="icon">` tag in `SEOHead.astro` or `BaseLayout.astro`.

**SEO impact:** LOW-MEDIUM. Browsers will request `/favicon.ico` by default, causing 404s in logs. Missing favicons reduce brand recognition in browser tabs, bookmarks, and Google search results (which display favicons).

**Recommended fix:**
1. Add a favicon to abroad-jobs `public/`.
2. Add `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />` to `SEOHead.astro`.
3. Consider adding `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` for iOS.

---

#### M2. No `<link rel="alternate">` or `hreflang` tags on abroad-jobs

**File:** `/packages/ui/src/components/SEOHead.astro`

**Description:** abroad-jobs targets an international audience (jobs across Germany, Netherlands, UAE, Japan, etc.) but has no `hreflang` tags. While the site is in English only, the `locale` is set to just `'en'` without a region qualifier.

**SEO impact:** MEDIUM for international targeting. Without hreflang, Google may not correctly understand that the English content is intended for an international audience. For a job board competing in multiple national markets, this matters.

**Recommended fix:**
- For now, add `<link rel="alternate" hreflang="en" href="https://abroadjobs.eu/" />` and `<link rel="alternate" hreflang="x-default" href="https://abroadjobs.eu/" />` to the homepage.
- If/when the site adds multilingual content, implement full hreflang tag sets.

---

#### M3. abroad-jobs: Filter URLs are not SEO-friendly

**Description:** Job filtering on abroad-jobs uses query parameters: `/?q=developer&country=Germany&industry=Technology`. These URLs are not crawlable as distinct landing pages and provide no long-tail SEO value.

**SEO impact:** MEDIUM. A job board could rank for queries like "developer jobs in Germany with visa sponsorship" if there were dedicated landing pages at URLs like `/jobs/germany/` or `/jobs/technology/germany/`.

**Recommended fix:** Create static or SSR landing pages for high-value filter combinations:
- `/jobs/germany/` — all jobs in Germany
- `/jobs/technology/` — all technology jobs
- `/jobs/technology/germany/` — technology jobs in Germany

These pages should have unique titles, meta descriptions, and H1 headings optimized for those search terms. The search form can remain for ad-hoc filtering.

---

#### M4. MobileNav uses `client:load` instead of `client:visible`

**File:** `/packages/ui/src/components/Nav.astro` (line 82)

**Description:** The `MobileNav` React island uses `client:load` which loads the JavaScript immediately on page load, even on desktop where it's hidden (`class="md:hidden"`). This adds unnecessary JavaScript to the initial bundle.

**SEO impact:** MEDIUM. Additional JS on initial load increases Total Blocking Time (TBT) and can hurt INP/LCP scores, which are Core Web Vitals ranking factors.

**Recommended fix:** Change to `client:idle` or `client:visible`:
```astro
<MobileNav client:idle items={...} />
```

---

#### M5. Blog post featured images use title as alt text

**File:** `/packages/ui/src/layouts/BlogPost.astro` (line 97)

**Description:** The featured image in blog posts uses the article title as alt text:
```astro
<img src={featuredImage} alt={title} ... />
```
While not terrible, this is a missed opportunity. The alt text should describe the image, not repeat the page title.

**SEO impact:** LOW-MEDIUM. Google Image Search uses alt text for ranking. Descriptive alt text could drive additional traffic from image searches.

**Recommended fix:** Add a `featuredImageAlt` prop to `BlogPost.astro`:
```astro
<img src={featuredImage} alt={featuredImageAlt ?? title} ... />
```

---

#### M6. athena-institute: Placeholder content in production-ready site

**File:** `/sites/athena-institute/src/pages/index.astro`

**Description:** The homepage contains obvious placeholder content:
- Testimonial authors: "CEO Name", "CFO Name", "COO Name"
- Companies: "Enterprise Co", "Growth Co", "Scale Co"
- Logo cloud: "Client A", "Client B", etc. with likely non-existent images

**SEO impact:** MEDIUM. Google's Helpful Content system penalizes thin or placeholder content. If this site is live, it's actively hurting its rankings.

**Recommended fix:** Replace all placeholder content with real content before the site goes live.

---

#### M7. Heading hierarchy issues on several pages

**Files affected:**
- `/sites/atelier-kosta/src/pages/index.astro`: The Hero uses `<h1>` ("Atelier Kosta"), then projects section uses `<h2>`, but the stats section has no heading — it jumps to the philosophy section with another `<h2>`. The testimonials `<blockquote>` has no heading level context.
- `/sites/abroad-jobs/src/pages/index.astro`: The `SearchHero` component correctly uses `<h1>`, but the `JobList` component has no heading — the job cards use `<h2>` directly inside a list without a parent section heading.
- `/sites/atelier-kosta/src/pages/projects/index.astro` (line 63): Project titles in the grid use `<h2>`, which is correct. But the hover-only text means the heading is invisible to most users.

**SEO impact:** LOW-MEDIUM. Proper heading hierarchy helps Google understand page structure and content importance.

**Recommended fix:** Ensure every `<section>` has a heading (even if visually hidden with `sr-only` class) and that headings follow a logical h1 > h2 > h3 hierarchy.

---

#### M8. No `<meta name="theme-color">` tag

**File:** `/packages/ui/src/components/SEOHead.astro`

**Description:** None of the sites declare a theme-color meta tag for mobile browsers.

**SEO impact:** LOW. Not a direct ranking factor, but improves perceived quality on mobile and in PWA contexts.

**Recommended fix:** Add to `SEOHead.astro` or allow it through `site.config.ts`:
```html
<meta name="theme-color" content="#1e40af" />
```

---

### LOW

#### L1. Template site robots.txt references `example.com`

**File:** `/sites/template/public/robots.txt`

**Description:** The template site's robots.txt still references `https://example.com/sitemap-index.xml`. When a new site is generated from this template, this URL may not be updated.

**Recommended fix:** The site generation process should replace the sitemap URL. Add a TODO comment or use the `site` field from `astro.config.mjs`.

---

#### L2. No `rel="noopener"` on some external links

**Description:** Most external links correctly use `rel="noopener noreferrer"`, but this should be verified across all components that render user-provided URLs (e.g., `applyUrl` in job listings).

---

#### L3. athena-institute: Nav labels don't match URL semantics

**File:** `/sites/athena-institute/site.config.ts` (lines 30-33)

**Description:** Nav items use labels that don't match the URLs:
- "Programs" links to `/services`
- "Admissions" links to `/case-studies`

**SEO impact:** LOW. Confusing URL structure can affect user experience and make internal linking patterns less clear to crawlers.

**Recommended fix:** Rename the pages to match the labels, or vice versa.

---

#### L4. No `<meta property="og:locale">` tag

**File:** `/packages/ui/src/components/SEOHead.astro`

**Description:** The `og:locale` tag is not set. While Facebook defaults to `en_US`, setting it explicitly is good practice, especially for sites targeting non-US audiences (all Cyprus-based sites use `en-GB`).

**Recommended fix:** Add to SEOHead:
```html
<meta property="og:locale" content={locale} />
```
Pass `locale` from BaseLayout alongside `siteUrl`.

---

#### L5. abroad-jobs: `trailingSlash` not configured

**File:** `/sites/abroad-jobs/astro.config.mjs`

**Description:** No `trailingSlash` setting is configured, meaning Astro will use its default behavior. This can lead to both `/about` and `/about/` being accessible, creating duplicate content.

**Recommended fix:** Set `trailingSlash: 'never'` in the Astro config to enforce consistent URLs, and ensure canonical URLs handle this.

---

#### L6. No `<meta name="generator">` tag

**Description:** Astro normally injects a generator meta tag, but this should be verified. Some SEO tools use this to identify the framework.

**Recommendation:** This is informational only. The tag is harmless and can be left as-is.

---

## Structured Data Recommendations (Complete Roadmap)

| Site | Schema Type | Where | Priority |
|------|------------|-------|----------|
| All sites | `Organization` | Homepage | HIGH |
| abroad-jobs | `WebSite` + `SearchAction` | Homepage | HIGH |
| abroad-jobs | `JobPosting` (fix salary) | `/jobs/[slug]` | HIGH (already exists, needs fix) |
| abroad-jobs | `BreadcrumbList` | `/jobs/[slug]` | HIGH |
| abroad-jobs | `ItemList` | Homepage (job list) | MEDIUM |
| atelier-kosta | `LocalBusiness` + `ArchitectProject` | Homepage, `/projects/[slug]` | MEDIUM |
| meridian-properties | `LocalBusiness` + `RealEstateListing` | Homepage, `/properties/[slug]` | MEDIUM |
| athena-institute | `EducationalOrganization` | Homepage | MEDIUM |
| athena-institute | `FAQPage` | `/services` (FAQ section) | MEDIUM |
| All sites | `BreadcrumbList` | All interior pages | LOW |

---

## Quick Wins (Ranked by Effort vs. Impact)

| # | Action | Impact | Effort | Files |
|---|--------|--------|--------|-------|
| 1 | Add Twitter Card meta tags to SEOHead | HIGH | 10 min | `packages/ui/src/components/SEOHead.astro` |
| 2 | Auto-compute canonical URL in BaseLayout | HIGH | 15 min | `packages/ui/src/layouts/BaseLayout.astro`, `SEOHead.astro` |
| 3 | Add `Disallow: /api/` to abroad-jobs robots.txt | HIGH | 2 min | `sites/abroad-jobs/public/robots.txt` |
| 4 | Create OG images for all sites | HIGH | 1 hour | All `sites/*/public/` directories |
| 5 | Add Organization schema to all homepages | HIGH | 30 min | All `sites/*/src/pages/index.astro` |
| 6 | Add favicon link tag to SEOHead | MEDIUM | 5 min | `packages/ui/src/components/SEOHead.astro` |
| 7 | Create abroad-jobs 404 page | MEDIUM | 10 min | `sites/abroad-jobs/src/pages/404.astro` |
| 8 | Fix abroad-jobs sitemap (remove noindexed pages) | MEDIUM | 10 min | `sites/abroad-jobs/src/pages/sitemap.xml.ts` |
| 9 | Fix salary format in JobPosting schema | MEDIUM | 20 min | `sites/abroad-jobs/src/pages/jobs/[slug].astro` |
| 10 | Change MobileNav from client:load to client:idle | MEDIUM | 2 min | `packages/ui/src/components/Nav.astro` |
| 11 | Add WebSite + SearchAction schema to abroad-jobs | MEDIUM | 15 min | `sites/abroad-jobs/src/pages/index.astro` |
| 12 | Add BreadcrumbList schema to abroad-jobs job pages | MEDIUM | 15 min | `sites/abroad-jobs/src/pages/jobs/[slug].astro` |
| 13 | Set trailingSlash in all astro.config.mjs files | LOW | 5 min | All `sites/*/astro.config.mjs` |
| 14 | Add og:locale meta tag | LOW | 5 min | `packages/ui/src/components/SEOHead.astro` |

---

## Positive Aspects

1. **Well-architected SEO infrastructure.** The `SEOHead` component, `BaseLayout` props, and `site.config.ts` pattern make it easy to add SEO features across all sites at once.
2. **Semantic HTML usage is strong.** `<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`, `<section>`, `<aside>` are used correctly and consistently.
3. **Skip-to-content link** is present in `BaseLayout.astro`.
4. **Proper `html lang` attribute** set dynamically from config.
5. **Security headers** are comprehensive (`CSP`, `HSTS`, `X-Frame-Options`, etc.) and well-configured per site.
6. **Admin site is properly noindexed** via `<meta name="robots" content="noindex, nofollow" />`.
7. **Image loading strategy is correct** — hero/above-fold images use `loading="eager"`, below-fold images use `loading="lazy"`.
8. **abroad-jobs JobPosting schema** is mostly correct and includes hiring organization, job location, and date posted.
9. **abroad-jobs dynamic sitemap** correctly includes live jobs with `lastmod` dates.
10. **aria-label on nav elements** (`"Main navigation"`) and social links (`"Visit our ${platform} page"`) follow accessibility best practices.
11. **Proper form labeling** in abroad-jobs SearchHero with `<label>` elements and `sr-only` class.

---

## Site-by-Site Summary

### abroad-jobs (abroadjobs.eu)
- **Good:** Dynamic sitemap, JobPosting schema, SSR for fresh content, proper search form labeling.
- **Needs work:** Canonical URLs (critical for query-string pages), Twitter Cards, missing 404 page, robots.txt missing `/api/` disallow, salary schema format, SEO-friendly filter URLs, no WebSite schema.
- **Priority:** This site benefits most from SEO fixes since it relies on organic search for both employers and job seekers.

### atelier-kosta (atelierkosta.cy)
- **Good:** Beautiful semantic HTML, proper image loading strategy, correct heading hierarchy, `@astrojs/sitemap` integration.
- **Needs work:** No structured data (LocalBusiness, ArchitectureProject), missing canonical URLs, no Twitter Cards, no OG image file.
- **Priority:** MEDIUM. Architecture firms benefit heavily from local SEO (LocalBusiness schema).

### athena-institute (athenainstitute.edu.cy)
- **Good:** Sitemap integration, proper layout structure.
- **Needs work:** Placeholder content, nav/URL mismatch, no structured data (EducationalOrganization, FAQPage), missing canonical URLs, no Twitter Cards, no OG image file.
- **Priority:** LOW until placeholder content is replaced.

### meridian-properties (meridianproperties.cy)
- **Good:** Sitemap integration, CMS-powered content, good page structure.
- **Needs work:** No structured data (LocalBusiness, RealEstateListing), missing canonical URLs, no Twitter Cards, no OG image file.
- **Priority:** HIGH. Real estate sites depend heavily on local SEO and rich results.

### template site
- **Good:** Complete example site with all patterns.
- **Needs work:** robots.txt still references `example.com`, placeholder URLs throughout.
- **Priority:** LOW (template only, not deployed).

### admin site
- **Good:** Properly noindexed.
- **No SEO concerns** — internal tool, not intended for indexing.
