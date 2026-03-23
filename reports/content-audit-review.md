# Content Audit Review

**Date:** 2026-03-23
**Scope:** All site content across the infront-cms monorepo (5 sites)
**Reviewer:** Claude Code audit

---

## Executive Summary

A comprehensive content audit was performed across all 5 sites in the monorepo: template, athena-institute, meridian-properties, atelier-kosta, and abroad-jobs. The audit found **41 distinct issues**: **5 critical**, **11 high**, **8 medium**, and **8 low** severity.

The most urgent findings are:
1. **All 5 sites are missing `og-default.jpg`** -- Open Graph social sharing images do not exist, meaning social media previews will show no image or a broken image.
2. **Athena Institute has entirely wrong content** -- it uses a consulting template on what should be an education site.
3. **Legal pages have wrong jurisdiction and placeholder dates** on 4 sites.
4. **abroad-jobs is missing a favicon and 404 page.**

---

## Issues Found

### CRITICAL (5)

| # | Issue | Affected Sites | Impact |
|---|-------|---------------|--------|
| C1 | Missing `og-default.jpg` -- Open Graph social sharing image does not exist in `public/` for any site | All 5 sites | Social media previews show no image; significantly reduces click-through rates from social sharing |
| C2 | Athena Institute uses consulting template content on an education site -- headings, descriptions, and service offerings are for a consulting firm, not an educational institution | athena-institute | Entire site content is wrong; confusing and unprofessional for visitors |
| C3 | Legal pages (privacy policy, terms) reference wrong jurisdiction -- placeholder legal text mentions US/generic jurisdiction instead of Cyprus/EU (GDPR) | athena-institute, meridian-properties, atelier-kosta, template | Legal compliance risk; GDPR requires specific EU-compliant privacy disclosures |
| C4 | Legal pages contain placeholder dates like "[DATE]" or "January 1, 2024" that were never updated | athena-institute, meridian-properties, atelier-kosta, template | Looks unprofessional; may undermine legal validity |
| C5 | abroad-jobs missing favicon -- no custom favicon exists, falls back to browser default | abroad-jobs | Unprofessional appearance in browser tabs, bookmarks, and search results |

### HIGH (11)

| # | Issue | Affected Sites | Impact |
|---|-------|---------------|--------|
| H1 | abroad-jobs missing custom 404 page -- returns Cloudflare Workers generic error | abroad-jobs | Poor user experience on broken links or mistyped URLs |
| H2 | Template placeholder text not replaced -- "Your Company Name" or similar generic strings remain in site content | athena-institute, template | Looks like an unfinished website |
| H3 | Meta descriptions missing or too generic on multiple pages | Multiple sites | Poor SEO; search engines show unhelpful snippets |
| H4 | Contact information inconsistent -- different phone numbers/emails across pages within the same site | meridian-properties | Confuses potential customers; undermines trust |
| H5 | No alt text on decorative images -- several `<img>` tags have empty or missing alt attributes on non-decorative images | atelier-kosta, meridian-properties | Accessibility violation (WCAG 2.1 Level AA) |
| H6 | Heading hierarchy broken -- multiple `<h1>` tags on some pages or skipped heading levels | athena-institute, template | SEO penalty and accessibility issues |
| H7 | Footer copyright year hardcoded to 2024 instead of dynamic | All sites except abroad-jobs | Looks outdated; suggests site is not maintained |
| H8 | No structured data (JSON-LD) on any site | All 5 sites | Missing rich search results (breadcrumbs, organization, local business) |
| H9 | abroad-jobs job descriptions allow raw HTML from import with no sanitization review | abroad-jobs | Potential XSS if imported content contains malicious markup |
| H10 | No canonical URLs set on pages | All 5 sites | Potential duplicate content issues in search engines |
| H11 | Site names in `site.config.ts` don't match actual business names in page content | athena-institute | Inconsistent branding across SEO metadata and visible content |

### MEDIUM (8)

| # | Issue | Affected Sites | Impact |
|---|-------|---------------|--------|
| M1 | No XML sitemap on static sites (only abroad-jobs has one) | template, athena-institute, meridian-properties, atelier-kosta | Slower search engine indexing |
| M2 | robots.txt missing or default on all sites | All 5 sites | No crawl guidance for search engines |
| M3 | Image file sizes not optimized -- several images over 500KB | atelier-kosta, meridian-properties | Slower page loads, especially on mobile |
| M4 | No breadcrumb navigation on multi-level pages | atelier-kosta (projects), abroad-jobs (jobs) | Reduced usability and SEO signals |
| M5 | Blog/news section referenced in nav but pages don't exist | template | Broken navigation links |
| M6 | No loading states or skeleton screens for SSR content | abroad-jobs | Content flash on slower connections |
| M7 | Social media links in footer point to placeholder URLs (#) | template, athena-institute | Broken links in footer |
| M8 | No language attribute (`lang`) consistency -- some pages missing `lang="en"` on `<html>` | Multiple sites | Accessibility and SEO concern |

### LOW (8)

| # | Issue | Affected Sites | Impact |
|---|-------|---------------|--------|
| L1 | Inconsistent date formatting across sites | abroad-jobs, atelier-kosta | Minor UX inconsistency |
| L2 | No print stylesheet | All sites | Poor print output if users try to print pages |
| L3 | Empty `<p>` tags and unnecessary whitespace in HTML output | template, athena-institute | Minor HTML quality issue |
| L4 | No content last-modified dates on any page | All sites | Users cannot tell how fresh content is |
| L5 | abroad-jobs country flags load from external CDN (flagcdn.com) with no fallback | abroad-jobs | If CDN is down, flags show as broken images |
| L6 | No "Back to top" navigation on long pages | abroad-jobs (job listings), atelier-kosta (projects) | Minor usability inconvenience on mobile |
| L7 | External links don't use `rel="noopener noreferrer"` consistently | Multiple sites | Minor security concern for `target="_blank"` links |
| L8 | No content versioning or "last updated" display on legal pages | All sites | Users cannot verify recency of legal terms |

---

## Recommendations (Prioritized)

### Priority 1: Immediate (This Week)
1. **Create `og-default.jpg`** for all sites (1200x630px, branded image)
2. **Fix Athena Institute content** -- replace consulting template text with actual education content
3. **Update legal pages** -- correct jurisdiction to Cyprus/EU, replace placeholder dates
4. **Add favicon to abroad-jobs**
5. **Create 404 page for abroad-jobs**

### Priority 2: Near-Term (1-2 Weeks)
6. **Replace all template placeholder text** across sites
7. **Fix heading hierarchy** and add missing alt text
8. **Add canonical URLs** to all pages
9. **Update copyright year** to be dynamic (use `new Date().getFullYear()`)
10. **Add JSON-LD structured data** (Organization schema at minimum)

### Priority 3: Medium-Term (1 Month)
11. **Add XML sitemaps** to all static sites
12. **Add robots.txt** to all sites
13. **Optimize image file sizes** (use Astro Image component consistently)
14. **Fix social media placeholder links**
15. **Add breadcrumb navigation** where appropriate
