# Template Completeness & Site Generation Defaults Review

**Date:** 2026-03-23
**Reviewer:** Claude Opus 4.6 (Template Completeness)
**Scope:** Template system, site generator, and default site output at `/Users/stefanospetrou/Desktop/Apps/infront-cms`

---

## Executive Summary

**Overall Completeness: MODERATE RISK**

Generated sites have a solid foundation -- 19 components, 5 distinct templates, security headers, sitemap, 404 page -- but ship with 3 critical gaps that break core functionality on every site. The contact form posts to a nonexistent API route, OG images are referenced but never generated, and the cookie consent component exists but is never rendered while analytics scripts load unconditionally without consent.

The review uncovered **3 Critical**, **4 High**, and **3 Medium** severity issues.

---

## Critical Issues

### TC-C1: Contact Form API Route Does Not Exist

**File:** `packages/ui/src/islands/ContactForm.tsx`
**File:** `sites/template/src/pages/api/` (missing `contact.ts`)

**Description:** The `ContactForm.tsx` island in `packages/ui/src/islands/ContactForm.tsx` POSTs to `/api/contact` but no `contact.ts` exists in `sites/template/src/pages/api/` or any generated site. Every contact form submission returns a 404 error. This is a core business function -- every template includes a contact page with this form.

**Impact:** Every generated site has a broken contact form. Leads are silently lost.

**Recommended Fix:** Create `/api/contact.ts` in the template site with Resend integration, zod validation, and honeypot spam protection. Ensure `export const prerender = false` is set.

---

### TC-C2: OG Image Never Generated

**File:** `packages/config/src/templates.ts`
**File:** `sites/admin/src/lib/generator.ts`

**Description:** All 5 templates in `packages/config/src/templates.ts` set `defaultOgImage: '/og-default.jpg'` but the generator in `sites/admin/src/lib/generator.ts` never creates this file. The image is referenced in meta tags but does not exist in the generated site's public directory.

**Impact:** Social sharing previews (Facebook, Twitter/X, LinkedIn, Slack) show a broken image or no preview on every generated site. This significantly reduces click-through rates on shared links.

**Recommended Fix:** Either generate a branded OG image during site creation (using the site name, colors, and logo) or include a well-designed generic placeholder in the template's public directory.

---

### TC-C3: Cookie Consent Component Is Orphaned -- GDPR Violation

**File:** `packages/ui/src/islands/CookieConsent.tsx`
**File:** `packages/ui/src/layouts/BaseLayout.astro`, lines 75-89

**Description:** `packages/ui/src/islands/CookieConsent.tsx` exists with full functionality -- it blocks Google Analytics until consent is given and persists state to localStorage. However, this component is NEVER rendered in `packages/ui/src/layouts/BaseLayout.astro` or any other layout. Meanwhile, BaseLayout lines 75-89 load GA scripts unconditionally without waiting for consent.

**Impact:** GDPR violation on every generated site that uses Google Analytics. Tracking cookies are set before user consent. This exposes the agency and its clients to regulatory risk.

**Recommended Fix:** Integrate `CookieConsent` into `BaseLayout.astro`. Render it conditionally when the analytics provider is Google Analytics. Defer GA script injection until the user grants consent via the CookieConsent island.

---

## High Issues

### TC-H1: Generic Favicon on All Generated Sites

**File:** `sites/template/public/favicon.svg`

**Description:** The template includes a generic SVG placeholder favicon. The site generator does not create a client-specific favicon from the brand colors or logo. Every generated site ships with the same generic icon.

**Impact:** Poor brand identity in browser tabs, bookmarks, and mobile home screens. Makes all generated sites look unfinished.

**Recommended Fix:** Generate a simple text-initial or color-branded favicon during site creation using the primary color and site name initial.

---

### TC-H2: Legal Pages Contain Hardcoded Placeholders and Wrong Jurisdiction

**File:** `sites/template/src/pages/privacy.astro`
**File:** `sites/template/src/pages/terms.astro`, lines 37-38

**Description:** The privacy policy and terms of service pages contain `[Date]` placeholder text that is never replaced by the generator. Additionally, `terms.astro` hardcodes "England and Wales" as the governing jurisdiction on lines 37-38, which is inappropriate for a Cyprus-based agency.

**Impact:** Generated sites ship with visibly incomplete legal pages. Incorrect jurisdiction references could have legal implications.

**Recommended Fix:** Replace placeholders with values from `site.config.ts` (creation date, company name, jurisdiction). Add a `legal.jurisdiction` field to the site config schema. Default to Cyprus.

---

### TC-H3: No Cookie Policy Page

**Description:** Generated sites include privacy and terms pages but no dedicated cookie policy page, despite cookies being set by analytics providers and potentially by other third-party integrations.

**Impact:** Incomplete legal compliance. Many jurisdictions (including the EU) require a separate or clearly identifiable cookie policy.

**Recommended Fix:** Add a `cookies.astro` page template that documents what cookies are set, their purpose, and duration. Populate dynamically based on the analytics provider configured in `site.config.ts`.

---

### TC-H4: Template Gallery Has No Real Previews

**File:** `sites/admin/src/islands/TemplateGallery.tsx`

**Description:** The template gallery in the admin wizard shows category-colored placeholder boxes instead of real screenshots. There are no live demo links and no "preview before selecting" capability.

**Impact:** Users cannot make informed template choices. This leads to template switching requests or recreated sites, wasting time.

**Recommended Fix:** Add screenshot images for each template. Implement a "Preview" button that opens a demo site or renders a static preview. Consider adding a short description of which business types each template suits.

---

## Medium Issues

### TC-M1: No Post-Creation Onboarding Checklist in Admin UI

**Description:** The generator logs a post-creation checklist to the console (update contact info, add logo, customize colors, etc.) but there is no in-app walkthrough or checklist in the admin UI after site creation.

**Impact:** New sites require manual review to identify what still needs customization. Easy to miss steps.

**Recommended Fix:** Add an onboarding checklist component to the site management page that tracks completion of key setup steps (logo, contact info, legal pages, analytics, custom domain).

---

### TC-M2: Generic Privacy and Terms Content Not Tailored to Client

**Description:** Legal page content is generic boilerplate not tailored to the client's business type, location, data collection practices, or specific services.

**Impact:** Legal pages may not adequately cover the client's actual data processing activities.

**Recommended Fix:** Create legal page variants based on common business types (e-commerce, service business, portfolio). Use site config to select the appropriate variant.

---

### TC-M3: No Analytics Setup Guidance

**Description:** The site config accepts `analytics.provider` and `analytics.siteId` but there is no documentation or in-app guidance explaining what third-party setup is needed (creating a Plausible account, getting a GA measurement ID, etc.).

**Impact:** Users may leave analytics unconfigured or misconfigure it.

**Recommended Fix:** Add inline help text in the wizard's config step explaining the required setup for each analytics provider. Link to provider-specific setup guides.

---

## Positive Findings

1. All 5 templates have genuinely different page structures and component selections -- not just color and font swaps
2. Restaurant template includes OpeningHours component; Portfolio includes Timeline; SaaS includes PricingTable and FAQ
3. 19 shared components with meaningful variant options provide significant design flexibility
4. Security headers (`_headers`) included by default with CSP, HSTS, X-Frame-Options
5. Sitemap auto-generated via `@astrojs/sitemap` integration
6. `robots.txt` generated with correct domain substitution
7. Custom 404 page included in every generated site
8. Per-site `CLAUDE.md` generated with key file references for developer onboarding

---

## Recommendations (Prioritized)

| Priority | Action | Issue |
|----------|--------|-------|
| Immediate | Create `/api/contact.ts` in template with Resend integration, zod validation, honeypot | TC-C1 |
| Immediate | Add OG image generation to wizard or include branded placeholder | TC-C2 |
| Immediate | Integrate CookieConsent into BaseLayout; block GA scripts until consent | TC-C3 |
| Short-term | Replace legal page templates with configurable versions using jurisdiction from site.config.ts | TC-H2 |
| Short-term | Add template screenshots and previews to gallery | TC-H4 |
| Medium-term | Add cookie policy page template | TC-H3 |
| Medium-term | Build post-creation onboarding checklist in admin UI | TC-M1 |
