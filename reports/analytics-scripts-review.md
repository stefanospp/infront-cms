# Analytics & Script Management Review

**Date:** 2026-03-23
**Reviewer:** Claude Opus 4.6 (Analytics & Script Management)
**Scope:** Full codebase at `/Users/stefanospetrou/Desktop/Apps/infront-cms`
**Focus:** Analytics integration, script injection, consent management, event tracking

---

## Executive Summary

**Overall Analytics Posture: HIGH RISK**

The platform has no script management system. Sites can only use 3 hardcoded analytics providers (Plausible, Fathom, GA) configured in site.config.ts. There is no way to add custom scripts -- tracking pixels, chat widgets, GTM containers, remarketing tags, or any third-party JavaScript -- without editing source code and CSP headers manually. None of the 4 live client sites have analytics enabled. The revenue-generating abroad-jobs site has zero visibility into traffic or conversions.

---

## Critical Issues

### C-1: No Script Management System

**Files:** `packages/config/src/types.ts`, `sites/admin/src/pages/`

**Description:** SiteConfig has no `customScripts`, `headScripts`, or `bodyScripts` field. The admin UI has no script injection interface. To add a chat widget, tracking pixel, or any third-party script, a developer must: (1) edit the site's layout or page files, (2) manually update `public/_headers` CSP to whitelist the script domain, (3) redeploy. This makes it impossible for non-technical site operators to manage scripts.

**Recommended Fix:** Add `customScripts` to SiteConfig with `head[]` and `body[]` arrays, each supporting `{ src?, inline?, consent?: boolean }`. Auto-generate CSP headers from the script domains at build time. Add a script management UI to the admin site settings page.

---

### C-2: Google Analytics Loads Without Consent

**Files:** `packages/ui/src/layouts/BaseLayout.astro` (lines 75-91), `packages/ui/src/islands/CookieConsent.tsx`

**Description:** BaseLayout injects GA unconditionally when `analytics.provider === 'google'`. The `CookieConsent.tsx` component exists in `packages/ui/src/islands/` with full consent logic (localStorage state, accept/decline, dynamic script loading) but is NEVER rendered in any layout. This is a direct GDPR and ePrivacy Directive violation. EU DPAs are actively fining EUR 50K-150K for this pattern.

**Recommended Fix:** Remove GA script injection from BaseLayout. Integrate CookieConsent into BaseLayout so it renders for GA/GTM providers. Load tracking scripts only after explicit consent via the CookieConsent component's dynamic loading mechanism.

---

### C-3: Zero Analytics on All Client Sites

**Files:** All `site.config.ts` files across `sites/abroad-jobs/`, `sites/atelier-kosta/`, `sites/athena-institute/`, `sites/meridian-properties/`

**Description:** Only the template site has analytics configured (Plausible with siteId "example.com" -- a placeholder). All 4 real sites have no analytics configured. The abroad-jobs site processes EUR 89 payments with zero visibility into traffic sources, conversion funnels, or user behavior. Operating completely blind on all production sites.

**Recommended Fix:** Enable Plausible on all sites by default (privacy-friendly, no consent needed, free for <10K monthly pageviews). Configure proper siteIds matching each site's production domain.

---

## High Severity Issues

### H-1: No GTM Support

**Files:** `packages/config/src/types.ts`, `packages/ui/src/layouts/BaseLayout.astro`

**Description:** Google Tag Manager would serve as a universal script container (add pixels, remarketing, chat widgets via GTM UI without code changes), but it's not integrated. No GTM container ID field in SiteConfig, no GTM loader in BaseLayout.

**Recommended Fix:** Add GTM as a 4th provider option in AnalyticsConfig. Add GTM container snippet to BaseLayout (head snippet + noscript fallback in body). Gate behind CookieConsent for GDPR compliance.

---

### H-2: CSP Blocks Any New Scripts

**Files:** `sites/*/public/_headers`

**Description:** `_headers` files only whitelist `plausible.io` and `cdn.usefathom.com`. Google Analytics (`googletagmanager.com`) is NOT whitelisted despite being a supported provider. Adding any third-party script requires manually editing CSP per site, which is error-prone and requires a redeploy.

**Recommended Fix:** Auto-generate CSP script-src directives at build time based on the analytics provider configured in site.config.ts and any custom scripts defined in the new `customScripts` field.

---

### H-3: No Custom Head/Body Scripts in Config

**Files:** `packages/config/src/types.ts`

**Description:** SiteConfig has an `AnalyticsConfig` with provider + siteId, but no field for arbitrary scripts. The `<slot name="head" />` exists in BaseLayout (line 44) but requires creating a custom layout file to use -- it is not config-driven.

**Recommended Fix:** Add `headScripts` and `bodyScripts` arrays to SiteConfig. Render these in BaseLayout automatically, respecting a `consent` flag per script for GDPR compliance.

---

### H-4: No Event Tracking

**Files:** Entire codebase

**Description:** Zero custom events anywhere in the codebase. No tracking for: job views, search queries, filter usage, checkout starts, checkout completions, form submissions, page scroll depth, or admin actions. No gtag/plausible/fathom event calls in any component. The abroad-jobs site has a full purchase funnel with zero conversion visibility.

**Recommended Fix:** Create event tracking utility functions in `packages/utils` that abstract over the configured provider (Plausible custom events, Fathom goals, GA events). Add event calls to key user interactions: job view, search, filter, checkout start, checkout complete, form submit.

---

### H-5: No Analytics Dashboard in Admin

**Files:** `sites/admin/src/pages/index.astro`

**Description:** The admin dashboard shows site counts (total, CMS, static, deployed) but no per-site visitor metrics, traffic trends, conversion rates, or analytics provider integration. Site operators have no way to see analytics data without visiting separate provider dashboards.

**Recommended Fix:** Integrate Plausible/Fathom APIs into the admin dashboard. Show key metrics per site: visitors (7d/30d), top pages, top referrers. Link to full analytics dashboard for each provider.

---

## Medium Severity Issues

### M-1: Only 3 Hardcoded Providers

**Files:** `packages/ui/src/layouts/BaseLayout.astro`

**Description:** Adding a 4th analytics provider (e.g., Matomo, Umami, Posthog) requires editing BaseLayout.astro. The provider logic is a series of if/else blocks, not extensible via config or plugin.

**Recommended Fix:** Refactor analytics loading to use the `customScripts` system. The 3 built-in providers become convenience presets that expand to the correct script tags.

---

### M-2: No GA IP Anonymization

**Files:** `packages/ui/src/layouts/BaseLayout.astro` (lines 83-89)

**Description:** The inline gtag config does not include `anonymize_ip: true`. While GA4 anonymizes by default in most regions, explicitly setting this ensures compliance across all jurisdictions and demonstrates intent.

**Recommended Fix:** Add `{ anonymize_ip: true }` to the gtag config call.

---

### M-3: No UTM Parameter Handling

**Files:** Entire codebase

**Description:** No code captures or forwards UTM parameters for campaign tracking. UTM values in URLs are lost on navigation. No utility to parse UTM params and forward them to analytics providers or store them for conversion attribution.

**Recommended Fix:** Create a UTM capture utility that reads `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` from the URL and stores them in sessionStorage. Forward to analytics on conversion events.

---

### M-4: No Server-Side Event Logging

**Files:** All API routes

**Description:** No analytics events are logged server-side. Form submissions, API calls, errors, checkout completions, and webhook events are not tracked. Server-side events are essential for accurate conversion tracking (client-side can be blocked by ad blockers).

**Recommended Fix:** Add a lightweight server-side event logger. At minimum, log checkout completions and webhook events to a structured log or analytics API.

---

### M-5: Head Slot Requires Custom Layout

**Files:** `packages/ui/src/layouts/BaseLayout.astro`

**Description:** `<slot name="head" />` exists in BaseLayout but sites must create a custom SiteLayout.astro wrapping BaseLayout to use it (as abroad-jobs does for Google Fonts). This is a workaround, not a first-class feature.

**Recommended Fix:** Make head injection config-driven via the `headScripts` field in SiteConfig, removing the need for custom layout wrappers for common use cases.

---

## Positive Findings

1. **Three analytics providers supported** with a clean config interface (provider + siteId pattern)
2. **Scripts load correctly** at end of `<body>` with `defer`/`async` -- no render blocking
3. **Plausible/Fathom load without consent** correctly -- these are privacy-friendly providers that do not require GDPR consent
4. **CookieConsent component is well-coded** with proper localStorage persistence, accept/decline actions, ARIA attributes, and dynamic script loading capability
5. **`<slot name="head" />` provides extensibility** -- an existing hook for custom head content, just not config-driven
6. **abroad-jobs demonstrates the custom layout pattern** for head injection (Google Fonts), proving the architecture supports it

---

## Recommendations (Prioritized)

### Immediate (Week 1)

| # | Action | Effort |
|---|--------|--------|
| 1 | Add `customScripts` to SiteConfig with `head[]` and `body[]` arrays, each supporting `{ src?, inline?, consent?: boolean }` | 4h |
| 2 | Enable Plausible on all sites by default (privacy-friendly, no consent needed, free for <10K monthly pageviews) | 1h |
| 3 | Integrate CookieConsent into BaseLayout -- render for GA/GTM, block scripts until consent | 2h |
| 4 | Add `anonymize_ip: true` to GA config | 5m |
| 5 | Whitelist `googletagmanager.com` in CSP for sites using GA provider | 30m |

### Short-Term (Week 2-4)

| # | Action | Effort |
|---|--------|--------|
| 6 | Add GTM as a 4th provider -- acts as universal script container for non-technical users | 4h |
| 7 | Add script management UI to admin site settings with CSP auto-update | 1d |
| 8 | Create event tracking helpers in `packages/utils` (page view, form submit, purchase, search) | 4h |
| 9 | Add conversion tracking to abroad-jobs checkout flow | 2h |
| 10 | Auto-generate CSP script-src from configured providers and custom scripts at build time | 4h |

### Medium-Term (Month 2)

| # | Action | Effort |
|---|--------|--------|
| 11 | Build analytics dashboard in admin pulling from Plausible/Fathom APIs | 3d |
| 12 | Add UTM parameter capture and forwarding utility | 4h |
| 13 | Add server-side event logging for conversion funnels | 1d |
| 14 | Refactor provider logic to use customScripts system (providers become presets) | 4h |

### Long-Term (Month 3+)

| # | Action | Effort |
|---|--------|--------|
| 15 | Add server-side event logging for admin audit trail | 2d |
| 16 | Add A/B testing infrastructure via GTM or custom implementation | 1w |
| 17 | Add automated conversion funnel reports in admin dashboard | 1w |

---

*Generated 2026-03-23. Review covers analytics integration, script management, consent handling, event tracking, and admin analytics visibility across the entire platform.*
