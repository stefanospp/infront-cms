# Frontend Development Quality Review

**Project:** infront-cms monorepo
**Date:** 2026-03-23
**Reviewer:** Senior Frontend Developer (Automated Review)
**Scope:** packages/ui, packages/config, packages/utils, all sites, configs, dependencies

---

## Executive Summary

The codebase demonstrates strong architectural foundations: a well-structured monorepo with clear separation between shared packages and individual sites, consistent TypeScript strict mode, proper Tailwind CSS v4 usage with design tokens, and thoughtful component composition. The type system is used effectively throughout with zero `any` types and zero `@ts-ignore` directives found across the entire codebase.

However, the review identified several issues across security, performance, accessibility, and code quality categories that should be addressed. The most critical findings involve a hardcoded API key in a shared component, potential XSS vectors via `set:html` with CMS content, and the MobileNav island using `client:load` instead of `client:visible`.

**Summary by severity:**
- Critical: 3
- High: 8
- Medium: 12
- Low: 7

---

## Critical Issues

### C1. Hardcoded Google Maps API Key Placeholder

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/Map.astro`
**Lines:** 14

The Map component contains a hardcoded `YOUR_API_KEY` placeholder in the Google Maps embed URL. If deployed without replacement, the map will not function. Worse, if someone replaces it with a real key, that key becomes committed to Git across all sites, violating the project's own security policy ("No secrets in Git").

```astro
src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodedAddress}`}
```

**Recommended fix:** Accept the API key as a prop sourced from environment variables or site config, never from the component itself.

```astro
export interface Props {
  address: string;
  apiKey: string;
  class?: string;
}
```

---

### C2. XSS Risk via `set:html` with CMS Content

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/template/src/pages/[...slug].astro`, line 32
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/meridian-properties/src/pages/[...slug].astro`, line 32
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/meridian-properties/src/pages/properties/[slug].astro`, line 106
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/template/src/pages/blog/[slug].astro`, line 36
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/meridian-properties/src/pages/blog/[slug].astro`, line 36
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/atelier-kosta/src/pages/projects/[slug].astro`, line 74

Multiple pages render CMS content directly using `set:html` without sanitization. While Directus content is typically trusted, if a CMS account is compromised or an editor unknowingly pastes malicious HTML, this creates an XSS vector. This is particularly dangerous because these are user-facing pages, not admin pages.

**Recommended fix:** Sanitize all CMS HTML content before rendering. Use a library like DOMPurify or sanitize-html on the server side before passing to `set:html`.

---

### C3. Google Analytics Script Injection Without Sanitization

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/layouts/BaseLayout.astro`
**Lines:** 79-87

The Google Analytics site ID is interpolated directly into an inline script without sanitization:

```astro
set:html={`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${analyticsSiteId}');
`}
```

If `analyticsSiteId` contains malicious content (e.g., from a compromised config), this becomes an XSS vector via script injection. The same pattern exists in `CookieConsent.tsx` at line 47.

**Recommended fix:** Validate that `analyticsSiteId` matches the expected pattern (e.g., `G-XXXXXXXXXX` for GA4) before interpolation. Use a regex allowlist:

```ts
const GA_ID_PATTERN = /^G-[A-Z0-9]+$/;
if (analyticsSiteId && GA_ID_PATTERN.test(analyticsSiteId)) { ... }
```

---

## High Severity Issues

### H1. MobileNav Uses `client:load` Instead of `client:visible`

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/Nav.astro`
**Line:** 82

The MobileNav island uses `client:load`, which hydrates immediately on page load. Per the project's own CLAUDE.md conventions: "Use `client:visible` or `client:idle` over `client:load` unless immediate interactivity is required." The mobile nav is hidden on desktop (`md:hidden`) and only needed when visible on mobile, making `client:idle` the correct choice.

```astro
<MobileNav
  client:load   <!-- Should be client:idle -->
```

This adds unnecessary JavaScript execution to every page load, impacting the performance budget (JS < 100KB gzipped).

**Recommended fix:** Change to `client:idle`.

---

### H2. BlogPost Layout Uses Raw `<img>` Instead of Astro `<Image />`

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/layouts/BlogPost.astro`
**Lines:** 93-100

The featured image in BlogPost uses a raw `<img>` tag instead of Astro's `<Image />` component:

```astro
<img
  src={featuredImage}
  alt={title}
  class="h-auto w-full object-cover"
  loading="eager"
/>
```

This bypasses Astro's image optimization pipeline (format conversion, responsive srcset, proper sizing), resulting in larger downloads and worse LCP scores. The same issue exists in `Hero.astro` (lines 89, 113) for the split and fullscreen variants.

**Recommended fix:** Use Astro's `<Image />` component with appropriate `widths` and `sizes` attributes.

---

### H3. Hero Component Uses Raw `<img>` Tags

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/Hero.astro`
**Lines:** 89, 113

Both the split variant (line 89) and fullscreen variant (line 113) use raw `<img>` tags with `loading="eager"` for background images. These are above-the-fold images and should still use Astro's `<Image />` for optimization (WebP/AVIF format, responsive sizes).

---

### H4. Import API Endpoint Has Weak Authentication

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/api/import.ts`
**Lines:** 19-20

The import endpoint falls back to allowing unauthenticated access if the `IMPORT_SECRET` environment variable is not set:

```ts
if (expected && authHeader !== `Bearer ${expected}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

This means in any environment where `IMPORT_SECRET` is not configured, anyone can trigger a mass import of external jobs, consuming D1 database resources and potentially polluting the database.

**Recommended fix:** Always require authentication. Return 500 with an error if `IMPORT_SECRET` is not configured:

```ts
if (!expected) {
  return new Response('IMPORT_SECRET not configured', { status: 500 });
}
if (authHeader !== `Bearer ${expected}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

### H5. Duplicated Type Definitions in SiteWizard.tsx

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/islands/SiteWizard.tsx`
**Lines:** 1-67

The SiteWizard island re-declares `TemplateColorScale`, `TemplateThemeTokens`, `ThemeConfig`, `NavItem`, `NavCTA`, `NavConfig`, `FooterColumn`, `FooterConfig`, `ContactConfig`, and `SEOConfig` locally instead of importing them from `@agency/config`. This creates a maintenance burden where type changes in the config package will not propagate, leading to runtime type mismatches.

**Recommended fix:** Import types from `@agency/config`:

```ts
import type {
  TemplateColorScale,
  TemplateThemeTokens,
  ThemeConfig,
  NavItem,
  NavCTA,
  NavConfig,
  FooterColumn,
  FooterConfig,
  ContactConfig,
  SEOConfig,
} from '@agency/config';
```

---

### H6. LoadMore Island Duplicates Job Interface

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/islands/LoadMore.tsx`
**Lines:** 3-17

The `Job` interface is redefined locally instead of importing the `Job` type from `../lib/schema`. This creates a risk of the interface drifting from the database schema. If a field is added or renamed in `schema.ts`, the LoadMore component will silently ignore it.

**Recommended fix:** Import and pick the required fields from the schema type:

```ts
import type { Job } from '../lib/schema';
type JobListItem = Pick<Job, 'id' | 'slug' | 'title' | 'companyName' | ...>;
```

---

### H7. CSP Missing `unsafe-inline` for Google Analytics Inline Script

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/public/_headers`
**Line:** 6

The Content-Security-Policy header does not include `'unsafe-inline'` or a nonce/hash in the `script-src` directive, but BaseLayout.astro injects an inline script for Google Analytics via `set:html`. This will cause the GA script to be blocked by CSP in browsers that enforce it.

The current `script-src` is: `'self' https://js.stripe.com`

However, the inline GA script (line 82-87 of BaseLayout.astro) requires either `'unsafe-inline'` (not recommended) or a nonce/hash approach.

**Recommended fix:** Use a nonce-based CSP or move the GA initialization to an external script file. For sites using Plausible or Fathom (which only use external scripts), the current CSP is correct. The CSP should be conditional based on the analytics provider.

---

### H8. SearchHero Duplicates Industries Array

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/components/SearchHero.astro`
**Lines:** 13-23

The industries list is hardcoded locally instead of importing from `../lib/validation.ts` where `INDUSTRIES` is already defined as a const tuple. This creates a maintenance risk where the two lists can diverge.

```astro
const industries: string[] = [
  'Hospitality & Tourism',
  ...
];
```

Note that line 2 imports the type `INDUSTRIES` but doesn't actually use the value. The import statement is:

```astro
import type { INDUSTRIES } from '../lib/validation';
```

**Recommended fix:** Change to a value import:

```astro
import { INDUSTRIES } from '../lib/validation';
```

Then use `INDUSTRIES` directly in the template.

---

## Medium Severity Issues

### M1. WithSidebar Layout Props Leak to BaseLayout

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/layouts/WithSidebar.astro`
**Line:** 22

The layout destructures `sidebarPosition` but then passes all original props (including `sidebarPosition`) to BaseLayout via spread:

```astro
const { sidebarPosition = 'right', config, ...layoutProps } = Astro.props;
---
<BaseLayout {...Astro.props}>
```

It should use `layoutProps` (the rest after destructuring) instead of `Astro.props`:

```astro
<BaseLayout {...layoutProps} config={config}>
```

---

### M2. Missing `prerender = false` Export on Admin API Routes

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/pages/api/sites/create.ts`

The admin site is configured with `output: 'server'` so all routes are SSR by default. However, per project conventions, "API routes export `const prerender = false`" as a documentation signal. None of the admin API routes include this export, which could be confusing for maintainability and if the output mode is ever changed.

This applies to all files under `sites/admin/src/pages/api/`.

---

### M3. Schema Parser Uses Module-Level Mutable State

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/utils/src/schema-parser.ts`
**Line:** 251

The module uses a module-level `nextId` variable that is reassigned on each call to `parseAstroToSchema`:

```ts
let nextId: (component: string) => string = createIdGenerator();
```

While the comment at line 241 mentions creating a scoped generator, the actual implementation at line 251 uses module-level mutable state. This is not safe if `parseAstroToSchema` is ever called concurrently (e.g., in a worker or parallel build step). The `createIdGenerator` function correctly creates closure-scoped state, but it's assigned to a module-level variable.

**Recommended fix:** Pass `nextId` as a parameter through the call chain rather than using module-level mutation.

---

### M4. Missing Error Boundaries in Admin Islands

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/islands/SiteWizard.tsx`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/islands/SiteEditor.tsx`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/islands/SiteDetail.tsx`

These large React islands lack error boundaries. If any of these components throws during rendering (e.g., due to an unexpected API response shape), the entire island crashes with a white screen and no recovery path. Given these are complex admin tools with many network calls, error boundaries are essential.

**Recommended fix:** Wrap each island in a React Error Boundary component that shows a "Something went wrong" message with a retry button.

---

### M5. Abroad-Jobs Nav Missing Keyboard Accessibility for Mobile Menu

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/components/Nav.astro`
**Lines:** 98-104

The abroad-jobs site has a custom Nav component with a vanilla JS mobile menu toggle, but it lacks:
1. `aria-expanded` on the toggle button
2. `aria-controls` linking to the menu
3. Escape key to close the menu
4. Focus trapping inside the open menu

Compare this to the shared Nav component which uses the MobileNav React island with proper focus trap, scroll lock, and keyboard handling.

```astro
<script>
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  toggle?.addEventListener('click', () => {
    menu?.classList.toggle('hidden');
  });
</script>
```

**Recommended fix:** Add `aria-expanded`, `aria-controls`, escape key handling, and consider using the shared MobileNav island or replicating its accessibility features.

---

### M6. No Rate Limiting on Abroad-Jobs API Routes

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/api/checkout.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/api/jobs.ts`

The CLAUDE.md specifies "API routes: rate limiting, input validation (zod), CORS restricted to site origin." While input validation is properly implemented with Zod, there is no rate limiting on any of the abroad-jobs API routes. The checkout endpoint is particularly sensitive as it creates database records and Stripe sessions.

**Recommended fix:** Implement rate limiting using Cloudflare's built-in rate limiting rules, or add a simple in-memory rate limiter using Cloudflare Workers KV or D1.

---

### M7. No CORS Headers on API Responses

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/api/jobs.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/api/checkout.ts`

The API routes do not set CORS headers. Per project conventions, CORS should be "restricted to site origin." While Cloudflare Pages may handle this at the edge, explicit CORS headers in responses provide defense in depth and ensure the policy is enforced regardless of deployment platform.

---

### M8. Admin Logout Uses `import.meta.env.PUBLIC_AUTH_SERVICE_URL`

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/layouts/AdminLayout.astro`
**Line:** 238

The logout script uses `import.meta.env.PUBLIC_AUTH_SERVICE_URL` which is a build-time value, while the middleware at `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/middleware.ts` line 4 uses `env('AUTH_SERVICE_URL')` which is a runtime value. This inconsistency means if the auth service URL changes after build, the middleware will use the new URL but logout will still point to the old one.

**Recommended fix:** Inject the auth URL into the template from the server side (via Astro.locals or a data attribute) rather than relying on a build-time environment variable.

---

### M9. Editor Bridge PostMessage Uses Wildcard Origin

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/utils/src/vite-editor-bridge.ts`
**Lines:** 183, 239, 291

All `postMessage` calls use `'*'` as the target origin:

```js
window.parent.postMessage({ type: 'editor-bridge:section-select', sectionId }, '*');
```

While this only runs in dev mode and inside an iframe, using a wildcard origin means any page that embeds the preview iframe can intercept these messages. This could leak section content and structure to unintended recipients if the dev server is exposed to a network.

**Recommended fix:** Use a specific origin derived from the admin URL instead of `'*'`.

---

### M10. Unused Import in SearchHero

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/components/SearchHero.astro`
**Line:** 2

```astro
import type { INDUSTRIES } from '../lib/validation';
```

`INDUSTRIES` is a const array, not a type. Importing it with `import type` makes it only available as a type (not a value), and then the component redefines the array manually. This import has no effect.

---

### M11. Stripe Checkout Metadata Contains Empty Session ID

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/api/checkout.ts`
**Line:** 45

The `createCheckoutParams` function is called with an empty string as the session ID:

```ts
const sessionParams = createCheckoutParams(jobInputs.length, '', siteUrl);
```

Looking at the Stripe helper at `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/lib/stripe.ts` line 14, this `sessionId` parameter is placed into metadata but never used. The actual Stripe session ID is obtained from `session.id` after creation. The `sessionId` parameter in `createCheckoutParams` appears to be dead code.

**Recommended fix:** Remove the unused `sessionId` parameter from `createCheckoutParams`.

---

### M12. Database Queries Constructed as Raw Strings in Index Page

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/index.astro`
**Lines:** 33-47

The FTS5 query uses string interpolation to conditionally append `AND` clauses:

```ts
${country ? 'AND j.country = ?' : ''}
${industry ? 'AND j.industry = ?' : ''}
```

While parameterized values prevent SQL injection, the conditional SQL construction through template literals is fragile and duplicated between `index.astro` and `api/jobs.ts`. This should be extracted to a shared query builder function.

---

## Low Severity Issues

### L1. Admin Package Has Unnecessary Dependencies

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/package.json`
**Lines:** 20-21

The admin package lists `send` and `server-destroy` as dependencies. The `send` package (for streaming files) and `server-destroy` (for forcefully closing HTTP connections) are unusual dependencies for an Astro SSR app. Verify these are actually used; they may be leftover from a previous architecture.

Additionally, `mermaid` (line 26) is a large library (~2MB) for rendering diagrams. If it's only used in the help manual, consider lazy-loading it.

---

### L2. Copyright Year Hardcoded in Abroad-Jobs Footer

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/site.config.ts`
**Line:** 38

```ts
text: '(c) 2026 AbroadJobs.eu. All rights reserved.',
```

The year is hardcoded as 2026. The shared Footer component dynamically generates the year (`new Date().getFullYear()`), but this config text overrides it. When 2027 arrives, this will be stale.

**Recommended fix:** Remove the `text` property or use a format without a year, letting the Footer component handle year rendering.

---

### L3. Inconsistent Tailwind Breakpoints for Mobile Nav

The shared Nav component hides desktop nav at `md` breakpoint (`md:flex`, `md:hidden`), while the abroad-jobs custom Nav uses `sm` breakpoint (`sm:flex`, `sm:hidden`). This means the mobile menu triggers at different viewport widths between sites using the shared Nav and the abroad-jobs site.

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/Nav.astro` - uses `md`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/components/Nav.astro` - uses `sm`

---

### L4. Missing `key` Prop in Job Form Fieldsets

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/islands/JobPostForm.tsx`
**Line:** 149

The job form list uses `idx` as the key:

```tsx
{jobForms.map((job, idx) => (
  <fieldset key={idx} ...>
```

Using array index as a key is problematic when items can be removed (the `removeJob` function at line 55). When a middle item is removed, React will incorrectly associate the remaining items with the wrong indices, potentially causing input values to appear in the wrong fieldset.

**Recommended fix:** Generate a stable unique ID for each job form entry (e.g., using a counter or crypto.randomUUID()).

---

### L5. `LoadMore` Silently Swallows Fetch Errors

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/islands/LoadMore.tsx`
**Lines:** 97-98

```tsx
} catch {
  // Silently fail
}
```

When the fetch fails, the user sees no indication of the error. The "Load more" button remains visible but clicking it again will retry the same failing request.

**Recommended fix:** Add an error state and display a user-friendly message like "Failed to load more jobs. Try again."

---

### L6. Missing `rel="noopener noreferrer"` in Template

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/CTA.astro`
**Line:** 82

The split variant CTA image uses `loading="lazy"` which is correct, but the external links in the CTA don't have `target="_blank"` and `rel` attributes. This is fine for internal links but the component doesn't differentiate between internal and external hrefs. Consider adding detection or a prop.

---

### L7. Repeated Input Class Strings in JobPostForm

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/islands/JobPostForm.tsx`

The same Tailwind class string for form inputs is repeated 10+ times:

```
"mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
```

**Recommended fix:** Extract to a constant:

```ts
const INPUT_CLASS = "mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20";
```

---

## Positive Findings

### TypeScript Quality
- Zero `any` types found across the entire codebase
- Zero `@ts-ignore` or `@ts-expect-error` directives
- `strict: true` and `noUncheckedIndexedAccess: true` properly configured in the base tsconfig
- Proper use of `interface` for component props, inferred types from Zod schemas, and generic type parameters in Directus helpers
- Excellent type safety in the Drizzle ORM schema with `$inferSelect` and `$inferInsert` types

### Astro Best Practices
- Correct use of `prerender = false` on all SSR routes
- Proper slot usage in layouts (default slot, named `head` slot, `sidebar` slot)
- Clean frontmatter/template separation with no logic leaking into templates
- Component override Vite plugin is well-designed with proper path traversal protection

### Component Architecture
- Excellent variant-based component system with clear prop interfaces
- Component registry provides a single source of truth for the visual editor
- Clean separation: layouts compose Nav/Footer, pages compose sections
- Every component accepts a `class` prop for customization
- Footer correctly derives style from theme config rather than a direct prop

### Tailwind CSS v4
- Proper use of `@theme` blocks for design tokens
- `@source` directives correctly configured to scan shared component paths
- All sites use the token-based color system (primary, secondary, accent, neutral) with no hardcoded color values in components
- Font tokens properly defined and consumed via `font-heading` and `font-body` utilities

### React Islands
- Proper hydration directives on most islands (`client:visible` for ContactForm, CookieConsent)
- MobileNav includes focus trapping, scroll lock, escape key handling, and ARIA attributes
- CookieConsent handles SSR gracefully with the `mounted` state pattern
- ContactForm has proper honeypot field, accessible error messages with `aria-describedby` and `aria-invalid`, and `role="alert"` on errors

### Code Organization
- Clean barrel exports in packages/config and packages/utils
- No circular dependencies detected
- `@agency/ui` correctly uses path-based exports for Astro components (no barrel file for .astro files)
- File naming follows all conventions from CLAUDE.md

### Security
- Security headers properly configured in `_headers` files
- Zod validation on all API inputs (both admin and abroad-jobs)
- Honeypot spam protection on forms
- Stripe webhook signature verification
- Path traversal prevention in the component override plugin

### SEO
- Comprehensive SEOHead component with Open Graph, canonical URLs, and structured data
- JobPosting structured data on job detail pages
- Dynamic sitemap generation
- `noindex, nofollow` on admin pages

---

## Recommendations (Prioritized)

### Priority 1 - Fix Before Next Deploy
1. **Replace Map component API key handling** (C1) - Accept key as prop from environment
2. **Add HTML sanitization for CMS content** (C2) - Install and use sanitize-html/DOMPurify
3. **Validate analytics ID format** (C3) - Regex whitelist before script interpolation
4. **Change MobileNav to `client:idle`** (H1) - Single line change, immediate performance win
5. **Fix import endpoint authentication** (H4) - Require IMPORT_SECRET always

### Priority 2 - Next Sprint
6. **Replace raw `<img>` with Astro `<Image />`** (H2, H3) - Better LCP and image optimization
7. **Import shared types in SiteWizard** (H5) - Remove duplicated type definitions
8. **Import Job type in LoadMore** (H6) - Single source of truth for types
9. **Add CSP nonce for inline GA scripts** (H7) - Or move GA init to external file
10. **Import INDUSTRIES in SearchHero** (H8) - Remove duplicated array

### Priority 3 - Ongoing Improvement
11. **Add React Error Boundaries** (M4) - Wrap admin islands
12. **Add keyboard a11y to abroad-jobs Nav** (M5) - aria-expanded, escape key, focus trap
13. **Implement rate limiting** (M6) - Cloudflare rate limiting rules
14. **Fix postMessage wildcard origin** (M9) - Use specific admin origin
15. **Extract shared query builder** (M12) - DRY up FTS5 query construction
16. **Use stable keys for job form list** (L4) - Replace index keys with UUIDs
17. **Add error state to LoadMore** (L5) - Show retry UI on fetch failure

---

*Report generated by automated frontend development review.*
