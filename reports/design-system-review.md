# Design System Review: Component Library Completeness

**Date:** 2026-03-23
**Scope:** `packages/ui/src/components/`, `packages/ui/src/islands/`, `packages/ui/src/layouts/`, `packages/config/src/templates.ts`
**Reviewer:** Design Systems Architect
**Verdict:** Solid foundation for simple brochure sites. Significant gaps for a full-service web agency handling diverse client verticals.

---

## 1. Component Inventory

### Shared Astro Components (19 total)

| Component | File | Purpose | Variants | Props Quality |
|-----------|------|---------|----------|---------------|
| **Hero** | `Hero.astro` | Page hero/banner | `centered`, `split`, `fullscreen`, `minimal`, `video` (5) | Good -- heading, subheading, CTA, background image/video, class |
| **Nav** | `Nav.astro` | Site navigation | No variant prop -- style driven by `theme.navStyle` (`sticky`/`fixed`/`static`) and `theme.borderStyle` | Good -- reads from SiteConfig |
| **Footer** | `Footer.astro` | Site footer | Driven by `theme.footerStyle` (`simple`/`multi-column`/`minimal`) (3) | Good -- social icons, legal links, columns |
| **Section** | `Section.astro` | Generic content wrapper | `background`: `light`/`dark`/`primary` (3) | Good -- heading, subheading, id, slot |
| **CTA** | `CTA.astro` | Call-to-action banner | `default`, `split`, `minimal` (3) | Good -- heading, description, button, image |
| **Features** | `Features.astro` | Feature highlights | `grid`, `alternating`, `icon-list` (3) | Good -- title, description, icon, image per item |
| **CardGrid** | `CardGrid.astro` | Multi-purpose card layout | `two-column`, `three-column`, `four-column`, `masonry`, `list` (5) | Good -- title, description, image, href per card |
| **Testimonials** | `Testimonials.astro` | Customer quotes | `default`, `carousel`, `featured` (3) | Good -- quote, author, role, image |
| **TeamGrid** | `TeamGrid.astro` | Team member display | `default`, `compact`, `detailed` (3) | Good -- name, role, bio, photo, email |
| **FAQ** | `FAQ.astro` | Accordion Q&A | `default`, `two-column` (2) | Adequate -- uses native `<details>` |
| **PricingTable** | `PricingTable.astro` | Pricing plans | `two-column`, `three-column` (2) | Good -- name, price, period, features, CTA, highlighted |
| **Gallery** | `Gallery.astro` | Image gallery | `grid`, `masonry` (2) | Adequate -- image, title, description, href |
| **Timeline** | `Timeline.astro` | Chronological events | `vertical`, `alternating` (2) | Adequate -- year, title, description |
| **StatsCounter** | `StatsCounter.astro` | Number statistics | `inline`, `grid` (2) | Good -- value, label, prefix, suffix |
| **LogoCloud** | `LogoCloud.astro` | Client/partner logos | `grid`, `scrolling` (2) | Good -- name, image, href, heading |
| **OpeningHours** | `OpeningHours.astro` | Business hours display | None (1) | Minimal -- day, hours pairs |
| **Map** | `Map.astro` | Google Maps embed | None (1) | Broken -- hardcoded `YOUR_API_KEY` placeholder |
| **ContactSection** | `ContactSection.astro` | Full contact page section | None (1) | Good -- reads from SiteConfig, includes form and map |
| **SEOHead** | `SEOHead.astro` | HTML head meta tags | None (1) | Good -- title, description, OG, canonical, structured data, noIndex |

### React Islands (3 total)

| Island | File | Purpose | Hydration |
|--------|------|---------|-----------|
| **ContactForm** | `ContactForm.tsx` | Contact form with validation | `client:visible` -- honeypot, field validation, loading states, error/success UI, ARIA |
| **MobileNav** | `MobileNav.tsx` | Slide-out mobile navigation | `client:load` -- focus trap, Escape close, body scroll lock, backdrop |
| **CookieConsent** | `CookieConsent.tsx` | Cookie consent banner | `client:idle` -- Google Analytics only, localStorage persistence |

### Layouts (5 total)

| Layout | File | Purpose |
|--------|------|---------|
| **BaseLayout** | `BaseLayout.astro` | Root HTML shell -- `<head>`, skip-to-content, analytics scripts |
| **FullWidth** | `FullWidth.astro` | Nav + full-width content + Footer. No max-width on `<main>` |
| **SingleColumn** | `SingleColumn.astro` | Nav + `max-w-3xl` centered content + Footer |
| **WithSidebar** | `WithSidebar.astro` | Nav + main + sidebar (left or right) + Footer |
| **BlogPost** | `BlogPost.astro` | Nav + article with prose styling, author/date/featured image + Footer |

---

## 2. Missing Components

### CRITICAL -- Components Nearly Every Agency Client Needs

| Missing Component | Priority | Rationale |
|-------------------|----------|-----------|
| **Breadcrumbs** | High | Already built as a one-off in `sites/abroad-jobs/`. Needs promotion to shared. Essential for SEO and multi-page sites. |
| **Pagination** | High | No shared pagination. `abroad-jobs` has a `LoadMore.tsx` island, but no traditional page-number pagination. Every blog, portfolio, or listing site needs this. |
| **BlogPostCard** | High | No shared blog post card for listing pages. |
| **BlogPostList** | High | No component to render a grid/list of blog post cards with filtering or categories. |
| **BackToTop** | Medium | Scroll-to-top button. Common client request, trivial to build but should be shared. |
| **Divider / Separator** | Medium | Decorative section dividers (wave, angle, curve). Common visual request. |
| **Alert / Notice** | Medium | Informational banners (site-wide announcements, COVID notices, holiday hours). |
| **Badge** | Medium | Status badges, tags, labels. `abroad-jobs` built a one-off `RelocationBadges.astro`. |
| **Tabs** | Medium | Tabbed content panels. Needs an island for interactivity. |
| **Modal / Dialog** | Medium | Lightbox for gallery images, confirmation dialogs, video popups. Needs an island. |
| **Toast / Notification** | Low | Success/error notifications. |
| **Tooltip** | Low | Hover/focus information popups. |

### IMPORTANT -- Blog/Content Components

| Missing Component | Priority | Rationale |
|-------------------|----------|-----------|
| **AuthorBio** | High | Author card for blog posts (photo, name, bio, social links). |
| **RelatedPosts** | Medium | "You might also like" section at the end of blog posts. |
| **TableOfContents** | Medium | Auto-generated TOC for long-form content. Needs an island for scroll-spy. |
| **ShareButtons** | Medium | Social sharing for blog posts and portfolio items. |
| **CategoryFilter** | Medium | Tag/category filter for blog listings and portfolios. Needs an island. |
| **NewsletterSignup** | Medium | Email signup form (Mailchimp, ConvertKit, etc.). |

### USEFUL -- Trust & Social Components

| Missing Component | Priority | Rationale |
|-------------------|----------|-----------|
| **SocialLinks** | Medium | Standalone social media links (currently only in Footer). |
| **VideoEmbed** | Medium | Responsive YouTube/Vimeo embed with lazy loading and privacy-first thumbnail. |
| **AwardsBadges** | Low | Certifications, awards, trust seals. |
| **BeforeAfter** | Low | Image comparison slider. Needs an island. |

---

## 3. Variant Completeness

### Components with Sufficient Variants
- **Hero** (5 variants) -- Excellent coverage.
- **CardGrid** (5 variants) -- Excellent coverage.
- **Testimonials** (3 variants) -- Good. The carousel variant is CSS-only snap scroll.
- **TeamGrid** (3 variants) -- Good range from compact to detailed.
- **CTA** (3 variants) -- Good.
- **Features** (3 variants) -- Good.

### Components Missing Variants

| Component | Current | Missing Variants | Rationale |
|-----------|---------|------------------|-----------|
| **FAQ** | 2 (`default`, `two-column`) | `bordered` (card-style), `simple` (non-collapsible) | Some clients want a non-collapsible FAQ layout. |
| **PricingTable** | 2 (`two-column`, `three-column`) | `single-highlight`, `comparison-table` (feature matrix) | Comparison tables are very common for SaaS clients. |
| **Gallery** | 2 (`grid`, `masonry`) | `carousel`, `lightbox` (click-to-enlarge) | Lightbox is the number one missing gallery feature. Requires an island. |
| **Timeline** | 2 (`vertical`, `alternating`) | `horizontal`, `compact` | Horizontal timelines are common for process/workflow visuals. |
| **StatsCounter** | 2 (`inline`, `grid`) | `animated` (count-up on scroll) | Animated counters are one of the most requested features. Requires an island. |
| **LogoCloud** | 2 (`grid`, `scrolling`) | **BUG:** The scrolling variant references `animate-scroll` but no corresponding keyframe is defined. This variant is broken. |
| **Section** | 3 backgrounds | `gradient`, `image` (background image with overlay) | Background image sections are extremely common. |
| **Nav** | 3 styles (via config) | `transparent` (for fullscreen hero overlay), `dark` | Transparent nav over hero images is a very common design pattern that currently requires a site-level override. |

---

## 4. Responsive Behavior

### Strengths
- All components use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) correctly.
- Grid layouts collapse to single column on mobile.
- MobileNav island has proper slide-out panel, body scroll lock, and focus trap.
- Typography scales down appropriately on smaller screens.

### Issues

| Issue | Severity | Location |
|-------|----------|----------|
| **Testimonials carousel has no mobile indicators** | Medium | `Testimonials.astro` line 90 -- CSS snap scroll with no dots, arrows, or swipe hints |
| **LogoCloud scrolling has no pause-on-hover** | Low | `LogoCloud.astro` line 52 -- May cause accessibility issues for motion-sensitive users |
| **Timeline alternating collapses poorly on mobile** | Medium | `Timeline.astro` line 43 -- Empty `<div>`s render in a confusing layout |
| **PricingTable three-column can be cramped on tablet** | Low | Jumps from 1 to 2 columns at `sm:` then 3 at `lg:` |
| **Gallery images have no fixed aspect ratio in grid variant** | Low | No `aspect-*` class, causing uneven row heights |

---

## 5. Dark Mode

### Status: NOT IMPLEMENTED

There is zero dark mode support across the entire design system.

- No `dark:` prefixed classes in any component.
- No `@media (prefers-color-scheme: dark)` in any CSS.
- No dark mode tokens defined in `@theme` blocks.
- No theme toggle island exists.
- `BaseLayout.astro` body is hardcoded to `bg-neutral-50 text-neutral-900`.

### Recommendation
1. **Phase 1 (token-level):** Define dark mode color tokens in `@theme`. Add `dark:bg-*`, `dark:text-*` classes to all components.
2. **Phase 2 (toggle island):** Create a `ThemeToggle.tsx` island that persists preference to localStorage.
3. **Estimate:** 3-5 days to retrofit all 19 components + 3 islands + 5 layouts.

---

## 6. Animation / Motion

### Status: MINIMAL

| What Exists | Location |
|-------------|----------|
| `transition-colors` on links and buttons | All components |
| `group-hover:scale-105` on card/gallery images | `CardGrid.astro`, `Gallery.astro` |
| `transition-transform duration-300` on mobile nav slide | `MobileNav.tsx` |
| `group-open:rotate-45` on FAQ expand icon | `FAQ.astro` |
| `animate-spin` on form submit button | `ContactForm.tsx` |
| `animate-scroll` on LogoCloud scrolling | `LogoCloud.astro` (BROKEN -- keyframe not defined) |

### What is Missing

| Missing Animation | Priority | Rationale |
|-------------------|----------|-----------|
| **Scroll-triggered fade-in/slide-up** | High | The single most requested animation pattern. Needs an `IntersectionObserver` island or Astro directive. |
| **Counter animation** (count-up) | Medium | For StatsCounter. Numbers animating from 0 to value on scroll. |
| **Stagger animations** | Medium | Grid items appearing one-by-one instead of all at once. |
| **Page transitions** | Low | Astro supports View Transitions. Not configured in BaseLayout. |
| **Prefers-reduced-motion** | High | No `motion-safe:` / `motion-reduce:` guards on any existing animations. This is an accessibility failure. |
| **LogoCloud keyframes** | High (bug fix) | `animate-scroll` class is used but `@keyframes scroll` is missing. The scrolling variant is non-functional. |

---

## 7. Layout Completeness

### Missing Layouts

| Missing Layout | Priority | Rationale |
|----------------|----------|-----------|
| **LandingPage** | High | Like FullWidth but without Nav/Footer. Essential for marketing campaigns, coming-soon pages. |
| **TwoColumn** | Medium | Equal-width two-column layout. Useful for comparison pages. |
| **Documentation** | Medium | Left sidebar navigation + main content + optional right TOC sidebar. |
| **Portfolio** | Low | Full-bleed image sections with minimal chrome. |
| **BlankCanvas** | Low | Absolutely minimal -- no max-width, no padding. For fully custom page designs. |

---

## 8. Island Architecture

### Missing Islands

| Missing Island | Priority | Rationale |
|----------------|----------|-----------|
| **GalleryLightbox** | High | Click-to-enlarge for Gallery component. Every portfolio, restaurant, and real estate client needs this. |
| **AnimatedCounter** | Medium | Count-up animation for StatsCounter. |
| **Tabs** | Medium | Tabbed content switcher. |
| **Modal** | Medium | Generic modal/dialog. |
| **ThemeToggle** | Medium | Dark/light mode switcher. |
| **TableOfContents** | Medium | Scroll-spy table of contents for blog posts. |
| **BackToTop** | Low | Scroll-to-top floating button. |
| **CategoryFilter** | Low | Client-side filtering for blog posts, portfolio items. |

---

## 9. Component Documentation

### Status: NO DEDICATED DOCUMENTATION

- No JSDoc comments beyond TypeScript interfaces.
- No Storybook, component playground, or documentation site.
- Props are discoverable only by reading `export interface Props` blocks.
- Variant previews are not available anywhere.
- CLAUDE.md has a variant table but no visual reference.

### What is Missing

| Gap | Priority | Recommendation |
|-----|----------|----------------|
| **Visual component gallery** | High | Build a `/components` page in the admin UI that renders every component in every variant. |
| **Props documentation** | Medium | Add JSDoc comments to all component interfaces. |
| **Usage examples** | Medium | Copy-paste examples per component. |
| **Variant screenshots** | Medium | Generate screenshots for the template gallery. |

---

## 10. Bugs and Quality Issues Found During Review

| Issue | Severity | File | Detail |
|-------|----------|------|--------|
| **Map API key is hardcoded placeholder** | Critical | `Map.astro:9` | `key=YOUR_API_KEY` is hardcoded. Map will not work for any site. |
| **LogoCloud `animate-scroll` keyframes missing** | High | `LogoCloud.astro:52` | The scrolling variant renders a static row. |
| **Hero split variant has empty alt on image** | Medium | `Hero.astro:90` | Should accept an `imageAlt` prop. |
| **CTA split variant has empty alt on image** | Medium | `CTA.astro:82` | Same issue. |
| **ContactSection hardcodes English text** | Medium | `ContactSection.astro:24-25` | "Contact Us", "Get in Touch" are hardcoded. |
| **OpeningHours hardcodes heading** | Low | `OpeningHours.astro:16` | Should be a prop. |
| **Nav does not render nested items** | Low | `Nav.astro` | `NavItem.children` exists in types but dropdowns are not implemented. |
| **BaseLayout loads GA unconditionally** | Medium | `BaseLayout.astro:75-91` | GA loads without cookie consent, plus CookieConsent island also loads GA, creating double-loading. |
| **Testimonials carousel has no navigation controls** | Low | `Testimonials.astro:88-117` | CSS snap scroll only. No prev/next buttons or dots. |

---

## 11. Summary Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| **Component Count** | 6/10 | 19 components + 3 islands covers basics but misses many common needs |
| **Variant Completeness** | 7/10 | Most components have 2-5 variants. Gallery lightbox and animated counters are notable gaps |
| **Responsive Design** | 8/10 | Generally solid. Minor issues with carousel indicators and timeline mobile layout |
| **Dark Mode** | 0/10 | Not implemented at all |
| **Animation/Motion** | 2/10 | Only basic hover transitions. No scroll animations, no reduced-motion support, one broken animation |
| **Layout Completeness** | 7/10 | 5 layouts cover most cases. Missing LandingPage is the biggest gap |
| **Island Architecture** | 5/10 | Only 3 islands. Gallery lightbox and tabs are significant gaps |
| **Documentation** | 3/10 | TypeScript interfaces only. No visual gallery, no usage docs |
| **Bug-free Quality** | 6/10 | Map is broken, LogoCloud animation is broken, GA double-loading, hardcoded strings |
| **Overall** | 5/10 | Functional for simple brochure sites. Not yet ready for diverse agency client work |

---

## 12. Prioritized Roadmap

### Phase 1 -- Bug Fixes and Quick Wins (1-2 days)
1. Fix Map.astro to read API key from environment/config
2. Add `@keyframes scroll` for LogoCloud animation
3. Add `motion-reduce:` guards to all existing animations
4. Fix GA double-loading between BaseLayout and CookieConsent
5. Add `imageAlt` prop to Hero and CTA split variants
6. Make ContactSection and OpeningHours text configurable via props

### Phase 2 -- High-Priority Missing Components (3-5 days)
1. Promote Breadcrumbs from abroad-jobs to shared
2. Build Pagination component
3. Build BlogPostCard and BlogPostList components
4. Build GalleryLightbox island
5. Build AnimateOnScroll wrapper component
6. Build LandingPage layout (no nav/footer)
7. Build BackToTop island

### Phase 3 -- Variant Expansion (2-3 days)
1. Add `transparent` Nav style for fullscreen hero overlay
2. Add `lightbox` Gallery variant (wraps GalleryLightbox island)
3. Add `animated` StatsCounter variant (wraps AnimatedCounter island)
4. Add `image` Section background variant
5. Add `simple` (non-collapsible) FAQ variant
6. Add carousel navigation controls to Testimonials

### Phase 4 -- Dark Mode (3-5 days)
1. Define dark mode token layer in @theme
2. Add `dark:` classes to all 19 components
3. Update all 3 islands with dark mode classes
4. Update all 5 layouts
5. Build ThemeToggle island
6. Add color-scheme meta tag to BaseLayout

### Phase 5 -- Interactive Components (3-5 days)
1. Build Tabs island
2. Build Modal/Dialog island
3. Build VideoEmbed component
4. Build ShareButtons island
5. Build CategoryFilter island
6. Build Nested Nav dropdown support

### Phase 6 -- Content & Blog Components (2-3 days)
1. Build AuthorBio component
2. Build RelatedPosts component
3. Build TableOfContents island
4. Build NewsletterSignup island
5. Build Alert/Notice component
6. Build Badge component

### Phase 7 -- Documentation (2-3 days)
1. Add JSDoc comments to all component interfaces
2. Build component gallery page in admin UI
3. Add visual variant previews
4. Document best practices for component composition

---

**Total estimated effort:** 16-26 days of focused development to bring the design system to full agency readiness.
