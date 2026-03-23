# UI/UX Review Report

**Project:** infront-cms (Agency Platform Monorepo)
**Date:** 2026-03-23
**Reviewer:** Claude Code (Opus 4.6)
**Scope:** All shared UI components, layouts, islands, admin UI, site-specific overrides, CSS theme files

---

## Executive Summary

The codebase demonstrates strong foundational design principles: a well-structured component library with consistent variant patterns, proper use of Tailwind CSS v4 theme tokens for brand customization, and good semantic HTML practices across most components. The admin UI provides a functional dashboard with a clear wizard flow for site creation.

However, the review uncovered several accessibility gaps (particularly around empty alt text, missing ARIA attributes, and keyboard navigation), a hardcoded API key in the Map component, inconsistent responsive behavior in certain components, duplicated rendering logic between server and client components, and some missing loading/error states. The abroad-jobs site overrides deviate from the shared component patterns in ways that introduce accessibility regressions.

**Overall Quality: Good with actionable improvements needed**

- Accessibility: 6/10 (several WCAG 2.1 AA violations)
- Responsive Design: 7/10 (generally good, some edge cases)
- Design Consistency: 8/10 (strong token system, minor deviations)
- Component API Design: 8/10 (well-structured variants)
- Loading States & Error Handling: 7/10 (good in some places, missing in others)

---

## Critical Issues

### CRIT-01: Hardcoded Google Maps API Key Placeholder in Map Component

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/Map.astro`
**Lines:** 14

The Map component contains a hardcoded `YOUR_API_KEY` string in the Google Maps embed URL. This will cause the map to fail silently for every site that uses the ContactSection component.

```
src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodedAddress}`}
```

**Impact:** Every site using ContactSection displays a broken/unauthorized map iframe. Users see a Google error instead of a map.

**Recommended fix:** Accept the API key as a prop or read it from site config/environment:
```astro
---
export interface Props {
  address: string;
  apiKey: string;
  class?: string;
}
const { address, apiKey, class: className } = Astro.props;
---
```

### CRIT-02: Hero Split Variant Has Empty Alt Text on Meaningful Image

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/Hero.astro`
**Lines:** 89-92, 112-114

The split and fullscreen hero variants use `alt=""` on their background images. While decorative images can have empty alt text, in the split variant the image is a primary content element alongside the heading -- it is not purely decorative. The fullscreen variant's image provides essential context for the text overlay.

```html
<img src={backgroundImage} alt="" class="h-full w-full object-cover" loading="eager" />
```

**Impact:** WCAG 2.1 AA violation (1.1.1 Non-text Content). Screen reader users miss meaningful visual content.

**Recommended fix:** Add an `imageAlt` prop to the Hero component:
```typescript
export interface Props {
  // ... existing props
  imageAlt?: string;
}
```

### CRIT-03: Abroad-Jobs Mobile Nav Lacks Keyboard Navigation and Focus Management

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/components/Nav.astro`
**Lines:** 58-67, 71-95, 98-104

The abroad-jobs site overrides the shared Nav component with a custom implementation. The mobile menu toggle simply toggles a `hidden` class with no focus trap, no Escape key handler, no body scroll lock, and no `aria-expanded` attribute. This is a significant regression from the shared MobileNav island which handles all of these correctly.

```javascript
toggle?.addEventListener('click', () => {
  menu?.classList.toggle('hidden');
});
```

The button also lacks `aria-expanded`:
```html
<button type="button" class="sm:hidden ..." aria-label="Toggle menu" id="mobile-menu-toggle">
```

**Impact:** WCAG 2.1 AA violations (2.1.1 Keyboard, 2.4.3 Focus Order, 4.1.2 Name/Role/Value). Keyboard-only users cannot close the menu with Escape, focus escapes the open menu, and the toggle state is not communicated to screen readers.

**Recommended fix:** Either use the shared MobileNav island (which already handles all this), or add focus trap, Escape handling, `aria-expanded`, `aria-controls`, and body scroll lock to the custom implementation.

---

## High Severity Issues

### HIGH-01: CTA Split Variant Image Has Empty Alt Text

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/CTA.astro`
**Line:** 82

```html
<img src={image} alt="" class="h-full w-full object-cover" loading="lazy" />
```

Same issue as CRIT-02. The split CTA variant uses an image as a meaningful content element but provides empty alt text.

**Recommended fix:** Add an `imageAlt` prop.

### HIGH-02: Gallery Items Without Titles Have Effectively Empty Alt Text

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/Gallery.astro`
**Line:** 35

```html
<img src={item.image} alt={item.title ?? ''} class="w-full object-cover ..." />
```

When a gallery item has no title, the alt text falls back to an empty string. In a gallery context, images are content -- they need descriptive alt text.

**Impact:** WCAG 2.1 AA violation when gallery items lack titles. Images become invisible to screen readers.

**Recommended fix:** Make `alt` a required field on `GalleryItem`, or at minimum log a dev-time warning when `title` is not provided.

### HIGH-03: ContactSection Has Hardcoded English Text

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/ContactSection.astro`
**Lines:** 20, 23-24

```html
<h1 class="...">Contact Us</h1>
<p class="...">Have a project in mind? Fill out the form and we'll get back to you within 24 hours.</p>
```

The CLAUDE.md explicitly states: "All text content comes from props or site.config.ts, never hardcoded in components." This shared component hardcodes English text, making it unusable for non-English sites.

**Recommended fix:** Accept `heading` and `description` props:
```typescript
export interface Props {
  config: SiteConfig;
  heading?: string;
  description?: string;
  class?: string;
}
```

### HIGH-04: Testimonials Carousel Variant Has No Navigation Controls

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/Testimonials.astro`
**Lines:** 88-117

The carousel variant uses CSS `snap-x snap-mandatory` for horizontal scrolling but provides no visible navigation controls (previous/next buttons, pagination dots). Users must discover that horizontal scrolling is possible on their own.

**Impact:** Poor discoverability, especially on desktop where horizontal scrolling is unexpected. Keyboard users cannot navigate between slides. Touch users may miss the interaction pattern.

**Recommended fix:** Add previous/next buttons with `aria-label` attributes, or pagination indicators. Consider making this a React island for proper keyboard arrow-key navigation.

### HIGH-05: Admin Dashboard Stats Loaded via DOM Manipulation Without Loading State

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/pages/index.astro`
**Lines:** 8-25, 30-57

The dashboard stats cards show em-dash placeholders and are populated via a `<script>` tag that directly manipulates DOM elements by ID. There is no loading indicator, no error state shown to users, and no ARIA live region to announce when data arrives.

```javascript
.catch(() => {
  // Stats will remain as em-dash on error
});
```

**Impact:** Users see stale/meaningless placeholders with no indication that data is loading or has failed. Screen reader users are never informed of updates.

**Recommended fix:** Convert stats to a React island with proper loading skeleton, error state, and `aria-live="polite"` announcements, or at minimum add a loading spinner and error message to the script handler.

### HIGH-06: Admin Sidebar Has No Focus Trap When Open on Mobile

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/layouts/AdminLayout.astro`
**Lines:** 210-234

The mobile sidebar open/close is managed via vanilla JS class toggling. When the sidebar is open on mobile, there is no focus trap and no Escape key handler. The overlay handles click-to-close but not keyboard dismiss.

**Impact:** Keyboard users can tab past the sidebar into the obscured main content. WCAG 2.1 AA violation (2.1.1 Keyboard).

**Recommended fix:** Add focus trap logic and Escape key handler, similar to the shared MobileNav island pattern.

### HIGH-07: LoadMore Component Duplicates JobCard Rendering Logic

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/islands/LoadMore.tsx`
**Lines:** 104-175

The LoadMore React island re-implements the entire JobCard rendering inline, duplicating the visual structure from `JobCard.astro`. This means any visual change to JobCard must be replicated in two places, and the two versions can drift.

Also, the duplicated version uses `alt=""` on logo images (line 121) while the Astro version uses `alt={job.companyName + " logo"}` (JobCard.astro line 42). This is already an inconsistency.

**Impact:** Maintenance burden and visual inconsistency between server-rendered and client-loaded job cards. Accessibility regression in the client-rendered version.

**Recommended fix:** Extract a shared `JobCardContent` React component that is used by both the LoadMore island and imported into JobCard.astro via a React wrapper.

---

## Medium Severity Issues

### MED-01: Nav Component Uses client:load Instead of client:visible for MobileNav

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/Nav.astro`
**Line:** 82

```html
<MobileNav client:load ... />
```

The CLAUDE.md states: "Use `client:visible` or `client:idle` over `client:load` unless immediate interactivity is required." The mobile nav is behind a button click, so it does not need to hydrate immediately on page load.

**Impact:** Unnecessary JavaScript execution on initial page load, hurting LCP and time-to-interactive.

**Recommended fix:** Change to `client:idle` since the mobile nav should hydrate before it becomes visible (it is hidden until toggled).

### MED-02: LogoCloud Scrolling Variant Has No Pause Mechanism or prefers-reduced-motion Handling

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/LogoCloud.astro`
**Lines:** 49-64

The scrolling variant uses `animate-scroll` (a CSS animation) for continuous horizontal scrolling. There is no pause-on-hover, no pause button, and no check for `prefers-reduced-motion`.

**Impact:** WCAG 2.1 AA violation (2.2.2 Pause/Stop/Hide). Users who are motion-sensitive or have vestibular disorders cannot stop the animation.

**Recommended fix:** Add a `@media (prefers-reduced-motion: reduce)` rule to stop the animation, and optionally a pause/play button.

### MED-03: Features Alternating Variant Uses Invalid CSS Class

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/Features.astro`
**Line:** 48

```typescript
i % 2 === 1 && 'lg:direction-rtl',
```

`lg:direction-rtl` is not a standard Tailwind utility. The alternating layout uses `lg:order-1` / `lg:order-2` correctly on lines 50 and 59, so this class appears to be a leftover that does nothing (or produces an invalid CSS rule).

**Impact:** Dead code. The alternating layout works despite this because the order classes handle it, but it adds confusion.

**Recommended fix:** Remove the `lg:direction-rtl` class from the condition.

### MED-04: BlogPost Layout Uses Image Title as Alt Text

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/layouts/BlogPost.astro`
**Line:** 97

```html
<img src={featuredImage} alt={title} class="h-auto w-full object-cover" loading="eager" />
```

Using the article title as the image alt text is not always appropriate -- the image may not depict what the title describes. A dedicated `featuredImageAlt` prop would be more accurate.

**Impact:** Potentially misleading for screen reader users.

**Recommended fix:** Add optional `featuredImageAlt` prop, falling back to title.

### MED-05: Admin Logout Button Does Not Indicate Loading State

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/layouts/AdminLayout.astro`
**Lines:** 236-243

The logout button fires an async fetch to the auth service and then redirects. During the network request, there is no visual feedback -- the button remains clickable and the user may click it multiple times.

```javascript
logoutBtn?.addEventListener('click', async () => {
  await fetch(`${authBaseUrl}/api/auth/sign-out`, { ... });
  window.location.href = `${authBaseUrl}/login`;
});
```

**Recommended fix:** Disable the button and show a loading state (e.g., "Logging out...") during the fetch.

### MED-06: SiteWizard Step Indicator Labels Hidden on Mobile

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/islands/SiteWizard.tsx`
**Lines:** 268-272

```jsx
<span className={`mt-2 text-xs font-medium hidden sm:block ...`}>{label}</span>
```

Step labels are hidden below `sm` breakpoint. On mobile, users only see numbered circles with no text explaining what each step is. This reduces usability for the most constrained viewport.

**Impact:** Mobile users lack context about what each wizard step represents.

**Recommended fix:** Show a condensed label (e.g., just "Details" instead of "Client Details") on mobile, or show the current step label prominently below the step indicator.

### MED-07: SiteWizard Step Connector Line Has Negative Margin Hack

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/islands/SiteWizard.tsx`
**Line:** 278

```jsx
className={`flex-1 h-0.5 mx-2 mt-[-1rem] sm:mt-0 ...`}
```

The `mt-[-1rem]` is a fragile layout hack to vertically align the connector line. On different font sizes or zoom levels, this will misalign.

**Recommended fix:** Use flexbox alignment (`items-center` on the parent) to naturally center the connector line relative to the step circles.

### MED-08: Timeline Alternating Variant Dot Hidden on Mobile

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/Timeline.astro`
**Line:** 70

```html
<div class="absolute left-1/2 top-1 hidden h-3 w-3 -translate-x-1/2 rounded-full border-2 border-primary-600 bg-white md:block" />
```

The timeline dot and center line are only visible on `md:` screens. On mobile, the alternating variant shows content blocks with no timeline visual treatment at all -- just stacked divs with no visual indicator of sequence.

**Recommended fix:** Show a left-aligned timeline on mobile (like the vertical variant) instead of hiding the timeline elements entirely.

### MED-09: PricingTable "Popular" Badge Text is Hardcoded

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/PricingTable.astro`
**Line:** 40

```html
<div class="...">Popular</div>
```

The highlighted plan badge text "Popular" is hardcoded. Sites may want different text ("Recommended", "Best Value", etc.).

**Recommended fix:** Add an optional `highlightedLabel` field to the `PricingPlan` interface.

### MED-10: Abroad-Jobs SearchHero Select Element Has Poor Contrast on Dark Background

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/components/SearchHero.astro`
**Lines:** 101-109

The industry filter `<select>` uses `bg-white/15 text-white` on a dark gradient background. The `<option>` elements inside have `class="text-neutral-900"` but the select element itself has white text on a semi-transparent white background, which may have insufficient contrast depending on the background gradient.

**Impact:** Potential WCAG 2.1 AA contrast violation (1.4.3 Contrast Minimum).

**Recommended fix:** Test contrast ratios and consider using a slightly more opaque background (`bg-white/20` or `bg-white/25`) or ensure the text contrasts sufficiently.

### MED-11: Admin SiteTable Error State Uses Undefined Color Token

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/islands/SiteTable.tsx`
**Line:** 64

```jsx
<p className="text-sm text-danger-500">
```

The admin global CSS defines `--color-danger-500` but `text-danger-500` may not be automatically available as a Tailwind utility unless explicitly configured. This may render as unstyled text.

**Impact:** Error state may not display in red, reducing visibility of the error.

**Recommended fix:** Use `text-red-600` (standard Tailwind) or verify the custom color token is properly registered.

### MED-12: SiteTable and SiteDetail Use warning-100 and warning-700 Color Tokens Not Defined

**Files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/islands/SiteTable.tsx` (line 185)
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/islands/SiteDetail.tsx` (line 39)

The admin CSS only defines `--color-warning-500` but the components reference `bg-warning-500/10`, `bg-warning-100`, and `text-warning-700`. The `warning-100` and `warning-700` shades are not defined in the admin global.css theme.

**Impact:** Badge colors may not render correctly.

**Recommended fix:** Add the full warning color scale to the admin theme, or use standard Tailwind `yellow-*` utilities.

---

## Low Severity Issues

### LOW-01: OpeningHours Component Heading is Hardcoded

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/OpeningHours.astro`
**Line:** 17

```html
<h3 class="...">Opening Hours</h3>
```

**Recommended fix:** Accept a `heading` prop with default value "Opening Hours".

### LOW-02: CookieConsent Banner Lacks Focus Management

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/islands/CookieConsent.tsx`
**Lines:** 90-120

The cookie consent banner appears at the bottom of the page but does not trap focus or auto-focus the first button. Keyboard users may not discover it.

**Recommended fix:** Auto-focus the "Accept" or "Decline" button when the banner appears.

### LOW-03: SEOHead Missing Twitter Card Meta Tags

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/SEOHead.astro`
**Lines:** 37-63

The SEOHead component includes Open Graph meta tags but does not include Twitter-specific card meta tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).

**Impact:** Twitter/X shares may not render rich cards optimally.

**Recommended fix:** Add Twitter card meta tags.

### LOW-04: BaseLayout Google Analytics Script Interpolates siteId Unsanitized

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/layouts/BaseLayout.astro`
**Lines:** 82-88

The Google Analytics `analyticsSiteId` is interpolated directly into a `<script>` tag via `set:html`. If the siteId were ever to contain malicious content, this could be exploited.

**Impact:** Low risk since siteId comes from `site.config.ts` (developer-controlled), but worth sanitizing.

**Recommended fix:** Validate that `analyticsSiteId` matches a safe pattern (e.g., `/^G-[A-Z0-9]+$/` for GA4).

### LOW-05: Section Component Default Background Same as Body

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/Section.astro`
**Line:** 23

The "light" background variant uses `bg-neutral-50` which is the same as the body background in BaseLayout. When two consecutive "light" sections are rendered, they blend together with no visual separation.

**Recommended fix:** Alternate between `bg-white` and `bg-neutral-50` or add a subtle border between sections.

### LOW-06: CardGrid Link Cards Missing Focus Styles

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/CardGrid.astro`
**Lines:** 83-85

```html
<a href={card.href} class="block no-underline">
```

Cards with `href` are wrapped in anchor tags but have no visible focus indicator beyond the browser default.

**Recommended fix:** Add `focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded-xl` to the link wrapper.

### LOW-07: Abroad-Jobs JobPostForm Labels Not Associated with Inputs (Some Fields)

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/islands/JobPostForm.tsx`
**Lines:** 172, 185, 197, 212, 225-226

Several form labels in the JobPostForm use `<label>` without `htmlFor` attributes, and the corresponding inputs lack `id` attributes. This breaks the label-input association.

**Impact:** Clicking the label does not focus the input. Screen readers may not associate the label with the field.

**Recommended fix:** Add unique `id` and `htmlFor` pairs (e.g., `id={`job-${idx}-companyName`}`).

### LOW-08: Admin Sidebar Navigation Lacks aria-current

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/layouts/AdminLayout.astro`
**Lines:** 56-59

Active nav items are visually styled differently but do not include `aria-current="page"` to communicate the active state to screen readers.

**Recommended fix:** Add `aria-current={isActive ? 'page' : undefined}` to each nav link.

### LOW-09: FAQ Summary Elements Hide Native Browser Marker

**File:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/src/components/FAQ.astro`
**Line:** 23

```html
<summary class="flex cursor-pointer list-none ...">
```

The `list-none` class removes the native disclosure triangle. While a custom plus icon is provided, `list-none` on `<summary>` can cause issues in some browsers where the element is no longer keyboard-operable.

**Impact:** Minor -- most modern browsers handle this fine, but Safari has had historical issues.

**Recommended fix:** Use `[&::-webkit-details-marker]:hidden` instead of `list-none` for better cross-browser compatibility.

### LOW-10: No Shared Breadcrumb Component

The abroad-jobs site has a local `Breadcrumb.astro` component but the shared component library lacks one. Sites that need breadcrumbs must implement their own.

**Recommended fix:** Consider adding a shared Breadcrumb component to `packages/ui/`.

---

## Positive Findings

### Theme Token System (Excellent)
The `@theme` block approach in Tailwind CSS v4 is well-implemented across all sites. Every site defines a complete color scale (primary, secondary, accent, neutral) with 50-950 shades, plus font tokens. Shared components consistently use these tokens rather than hardcoded values (with the few exceptions noted above). The abroad-jobs site demonstrates excellent token usage with warm grays, indigo primary, emerald secondary, and orange accent.

### Shared Component Variant Architecture (Strong)
The variant pattern across Hero, CTA, CardGrid, Features, FAQ, Testimonials, TeamGrid, etc. is consistent and well-designed. Each component has clearly defined variant options with sensible defaults. The TypeScript interfaces provide good type safety for variant props.

### MobileNav Island (Excellent Accessibility)
The shared MobileNav island (`packages/ui/src/islands/MobileNav.tsx`) is an exemplary implementation:
- Focus trap with Tab/Shift+Tab cycling
- Escape key to close
- Body scroll lock when open
- `aria-expanded`, `aria-controls`, `aria-modal`, `role="dialog"`
- Focus restored to toggle button on close
- Smooth slide-in animation with backdrop

### ContactForm Island (Strong)
The shared ContactForm (`packages/ui/src/islands/ContactForm.tsx`) demonstrates good practices:
- Proper `aria-describedby` and `aria-invalid` for error states
- Honeypot spam protection
- Loading spinner during submission
- Success state with `role="status"` and `aria-live="polite"`
- Server error display with `role="alert"`
- Client-side validation before network request

### BaseLayout Skip Link (Good)
The BaseLayout correctly implements a skip-to-content link that is screen-reader visible by default and becomes visible on focus.

### Consistent Spacing and Typography Scale
Components use a consistent spacing scale (gap-4, gap-6, gap-8, gap-12) and typography scale (text-sm, text-base, text-lg, text-xl, text-3xl, text-4xl). Heading hierarchy is generally maintained with h1 in Hero/page header, h2 in Section, h3 in cards/items.

### CookieConsent Implementation (Good)
Handles Google Analytics consent properly with localStorage persistence, proper dialog semantics, and clean accept/decline flow.

### Admin SiteTable (Good UX)
Provides proper loading, error, and empty states. The empty state includes a clear call-to-action to create a new site with a descriptive message.

### Abroad-Jobs Site-Specific Components (Strong Custom Design)
The abroad-jobs overrides (Nav, Footer, SearchHero, JobCard, RelocationBadges) demonstrate the component override system working well. The custom designs are cohesive and purpose-built for a job board rather than using generic shared components.

### Atelier Kosta Hero Override (Excellent Custom Design)
The custom Hero override for Atelier Kosta demonstrates sophisticated editorial design: bottom-left aligned content, cinematic gradient overlay, thin accent line, generous typography with tracking, and a scroll indicator. This shows the override system enables truly bespoke designs while still leveraging the shared layout infrastructure.

---

## Recommendations (Prioritized)

### Priority 1 (Critical -- fix immediately)

1. **Fix Map component API key** (CRIT-01) -- Accept API key as prop or from config. Every site using ContactSection is affected.

2. **Fix abroad-jobs mobile nav accessibility** (CRIT-03) -- Either switch to the shared MobileNav island or add the missing keyboard/ARIA support.

3. **Add imageAlt prop to Hero, CTA, and Gallery components** (CRIT-02, HIGH-01, HIGH-02) -- All image-bearing components should accept explicit alt text.

### Priority 2 (High -- fix before next release)

4. **Remove hardcoded text from ContactSection** (HIGH-03) -- Add heading/description props per the project convention.

5. **Add navigation controls to Testimonials carousel** (HIGH-04) -- Previous/next buttons and keyboard support.

6. **Improve admin dashboard stats UX** (HIGH-05) -- Add loading skeletons and error states.

7. **Add focus trap to admin sidebar on mobile** (HIGH-06) -- Align with the MobileNav pattern.

8. **Deduplicate JobCard rendering in LoadMore** (HIGH-07) -- Single source of truth for card markup.

### Priority 3 (Medium -- address in upcoming sprint)

9. **Change MobileNav from client:load to client:idle** (MED-01) -- Performance improvement.

10. **Add prefers-reduced-motion support to LogoCloud** (MED-02) -- WCAG compliance.

11. **Remove dead lg:direction-rtl class** (MED-03) -- Code cleanup.

12. **Fix undefined color tokens in admin** (MED-11, MED-12) -- Add full warning/danger color scales.

13. **Add step labels on mobile for SiteWizard** (MED-06) -- UX improvement.

14. **Fix Timeline alternating variant on mobile** (MED-08) -- Show linear timeline instead of hiding it.

### Priority 4 (Low -- address when touching these files)

15. **Add Twitter card meta tags to SEOHead** (LOW-03).
16. **Add aria-current to admin sidebar nav** (LOW-08).
17. **Associate all JobPostForm labels with inputs** (LOW-07).
18. **Add focus styles to CardGrid link cards** (LOW-06).
19. **Add shared Breadcrumb component** (LOW-10).
20. **Parameterize hardcoded text in OpeningHours and PricingTable** (LOW-01, MED-09).

---

## Appendix: Files Reviewed

**Shared Components (packages/ui/src/components/):**
Hero.astro, Nav.astro, Footer.astro, Section.astro, CTA.astro, CardGrid.astro, Features.astro, FAQ.astro, Testimonials.astro, ContactSection.astro, TeamGrid.astro, Gallery.astro, StatsCounter.astro, PricingTable.astro, Timeline.astro, LogoCloud.astro, Map.astro, OpeningHours.astro, SEOHead.astro

**Shared Islands (packages/ui/src/islands/):**
ContactForm.tsx, MobileNav.tsx, CookieConsent.tsx

**Shared Layouts (packages/ui/src/layouts/):**
BaseLayout.astro, FullWidth.astro, SingleColumn.astro, WithSidebar.astro, BlogPost.astro

**Admin UI (sites/admin/):**
AdminLayout.astro, index.astro, login.astro, SiteTable.tsx, SiteWizard.tsx, SiteDetail.tsx, HelpManual.tsx, middleware.ts, global.css

**Abroad-Jobs Overrides (sites/abroad-jobs/):**
Nav.astro, Footer.astro, SearchHero.astro, JobCard.astro, JobList.astro, RelocationBadges.astro, JobPostForm.tsx, LoadMore.tsx, SiteLayout.astro, global.css, _headers

**Other Sites:**
sites/atelier-kosta/src/components/Hero.astro, sites/template/src/styles/global.css
