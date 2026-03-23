# Internationalization (i18n) Review

**Date:** 2026-03-23
**Scope:** Full codebase at /Users/stefanospetrou/Desktop/Apps/infront-cms
**Reviewer:** Claude Code audit

---

## Executive Summary

**i18n Readiness Score: 1.5 / 5 (Very Low)**

The infront-cms platform has effectively zero internationalization infrastructure despite serving a European audience (Cyprus-based agency, abroad-jobs targeting EU job seekers). There are approximately 200+ hardcoded English strings across the codebase, no i18n library, no translation files, no hreflang tags, no RTL support, no localized URL routing strategy, hardcoded date/currency formatting, English-only country names despite targeting a multilingual European audience, English-only email templates, and English-only Zod validation error messages.

**Estimated migration effort for full i18n support: 7-10 weeks.**

---

## Current State Assessment

### What Exists
- Country names are defined in `sites/abroad-jobs/src/lib/countries.ts` -- but in English only
- Currency is EUR (correct for Cyprus/EU market)
- Site configuration (`site.config.ts`) has a `locale` concept but it is not used for i18n

### What Is Missing

| Capability | Status | Notes |
|-----------|--------|-------|
| i18n library/framework | Not installed | No `astro-i18n`, `i18next`, `paraglide`, or similar |
| Translation files | None exist | All strings hardcoded in components |
| Locale detection | Not implemented | No Accept-Language header parsing |
| Locale routing | Not implemented | No `/en/`, `/de/`, `/el/` URL prefixes |
| hreflang tags | Not present | No `<link rel="alternate" hreflang="...">` |
| RTL support | Not present | No `dir="rtl"` support in layouts |
| Localized date formatting | Not implemented | Dates use hardcoded `toLocaleDateString('en-GB')` or similar |
| Localized number/currency formatting | Partially | EUR symbol used but no `Intl.NumberFormat` with locale |
| Translated validation messages | Not implemented | Zod uses English defaults |
| Translated email templates | Not implemented | All emails hardcoded in English |
| Content translation workflow | Not implemented | No Directus translation fields or multilingual content model |
| Localized SEO metadata | Not implemented | Meta descriptions English-only |
| Translated UI components | Not implemented | Button labels, nav items, footer text all hardcoded English |

---

## Hardcoded String Inventory

### Shared Packages (~40 strings)
- `packages/ui/src/islands/ContactForm.tsx` -- Form labels, placeholders, button text, error messages, success messages
- `packages/ui/src/components/` -- Various UI text ("Read more", "View all", "Back to top", etc.)
- `packages/utils/src/validation.ts` -- Zod schema error messages use English defaults

### abroad-jobs Site (~100+ strings)
- `src/components/SearchHero.astro` -- Search placeholder, filter labels, button text
- `src/components/JobCard.astro` -- "Posted", "Expires", date labels
- `src/components/JobList.astro` -- "No jobs found", result count text
- `src/components/Nav.astro` -- Navigation labels
- `src/components/Footer.astro` -- Footer text, copyright
- `src/components/RelocationBadges.astro` -- Badge labels
- `src/islands/JobPostForm.tsx` -- All form labels, placeholders, validation messages, help text (~50 strings)
- `src/islands/LoadMore.tsx` -- "Load more", "Loading..." button states
- `src/pages/index.astro` -- Page title, heading, description
- `src/pages/success.astro` -- Success message, instructions
- `src/lib/email.ts` -- Email subject, body text
- `src/lib/countries.ts` -- Country names (English only)

### Admin UI (~60+ strings)
- All admin pages, wizard steps, form labels, error messages, success messages
- Help documentation content

### Client Sites (~20 strings each)
- Navigation labels, footer text, page headings, CTA buttons
- These come from `site.config.ts` which is English-only

---

## Key Issues

### CRITICAL

#### C1. No i18n infrastructure at all
The platform has no foundation for supporting multiple languages. Every UI string is hardcoded in English within component files. Adding i18n retroactively requires touching every component, page, and island in the codebase.

#### C2. Country names English-only on a European job board
The `countries.ts` file contains 44 European country names in English only. A German user searching for jobs in "Deutschland" would not find results because the country is listed as "Germany". This directly impacts the abroad-jobs site's ability to serve its target audience.

### HIGH

#### H1. No hreflang tags for SEO
Search engines cannot determine the language of the content or suggest alternate language versions. For a platform serving the EU market, this hurts discoverability in non-English search results.

#### H2. Hardcoded date/time formatting
Dates use English formatting patterns (e.g., "23 March 2026") with no locale awareness. European countries use different date formats (DD.MM.YYYY in Germany, DD/MM/YYYY in France, etc.).

#### H3. Zod validation messages are English-only
All form validation uses Zod with default English error messages. Users filling out the job posting form or contact forms in non-English locales will see English error text regardless of their language preference.

#### H4. Email templates hardcoded in English
Confirmation emails after Stripe checkout are hardcoded in English. No mechanism to detect the customer's preferred language or send localized emails.

### MEDIUM

#### M1. No locale-aware URL routing
There is no URL structure for localized content (e.g., `/de/jobs/` vs `/en/jobs/`). Adding this retroactively requires significant routing changes.

#### M2. No RTL support in CSS/layouts
The Tailwind setup and layout components have no RTL considerations. If any client site needs Arabic or Hebrew content, the entire layout system would break.

#### M3. CMS (Directus) not configured for multilingual content
The Directus instances have no translation fields or multilingual content model. CMS-powered sites can only serve content in one language.

#### M4. Currency formatting not locale-aware
While EUR is used correctly, the formatting (e.g., EUR 89 vs 89 EUR vs 89,00 EUR) varies by locale and is currently hardcoded.

### LOW

#### L1. No language switcher component
No UI component exists for switching between languages.

#### L2. No locale in HTML lang attribute
Some pages are missing the `lang="en"` attribute on the `<html>` tag, and there is no mechanism to set it dynamically based on content language.

#### L3. Number formatting not locale-aware
Numbers use English formatting (e.g., 1,000) without `Intl.NumberFormat`. Some European locales use periods as thousand separators (1.000).

---

## Migration Roadmap

### Phase 1: Foundation (2-3 weeks)
1. Choose and install an i18n library (recommended: `paraglide-js` for Astro or `astro-i18n-aut`)
2. Extract all hardcoded strings into translation files (JSON/YAML)
3. Create English translation as the baseline
4. Add `lang` attribute handling to `BaseLayout`
5. Add locale detection (Accept-Language header + cookie preference)

### Phase 2: Core Content (2-3 weeks)
6. Translate country names in `countries.ts` (at minimum: German, French, Greek, Turkish for Cyprus market)
7. Add locale-aware date/number/currency formatting using `Intl` APIs
8. Add hreflang tags to all pages
9. Add localized Zod validation messages
10. Create a language switcher component

### Phase 3: Full i18n (3-4 weeks)
11. Implement locale-prefixed URL routing (`/en/`, `/de/`, `/el/`)
12. Add RTL support to CSS and layout components
13. Configure Directus for multilingual content fields
14. Localize email templates
15. Add translation workflow documentation

### Estimated Total Effort: 7-10 weeks

---

## Recommendations

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| 1 | Add `lang="en"` to all `<html>` tags | 1 hour | Fixes accessibility and SEO baseline |
| 2 | Translate country names for key EU languages | 1 day | Directly improves abroad-jobs usability |
| 3 | Use `Intl.DateTimeFormat` and `Intl.NumberFormat` | 2 days | Locale-aware formatting without full i18n |
| 4 | Install i18n library and extract strings | 1 week | Foundation for all future i18n work |
| 5 | Add hreflang tags | 1 day | SEO improvement for EU market |
| 6 | Full translation for top 3 languages | 3-4 weeks | Complete multilingual support |
