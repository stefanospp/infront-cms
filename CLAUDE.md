# Agency Platform — Claude Code Reference

## What this is

A monorepo platform for running a solo web agency. Each client gets an Astro site deployed to Cloudflare Workers. CMS options: Payload CMS (primary, Cloudflare Workers), Directus (legacy, Hetzner via Kamal), or SonicJs (deprecated pilot). Shared UI components, config, and utilities live in packages.

## Payload CMS (primary)

Payload CMS is the primary CMS for all new client sites. Runs on Cloudflare Workers with D1 (SQLite) and R2 (media). Full documentation:
- **Development guide:** `infra/payload/GUIDE.md` — complete setup, deployment, migration, preview system, exit strategy
- **Overview & comparison:** `infra/payload/README.md` — architecture, limitations, why Payload over SonicJs/Directus
- **Reference implementation:** `infra/payload/nikolaspetrou/` — fully deployed Payload CMS for nikolaspetrou.com
- **Reference site:** `sites/nikolaspetrou-v2/` — Astro site wired to Payload with preview system

## SonicJs CMS (deprecated — pilot only)

SonicJs was evaluated as a Directus replacement but has been superseded by Payload CMS. Existing SonicJs sites will be migrated to Payload. Documentation preserved for reference:
- **Development guide:** `infra/sonicjs/GUIDE.md` — step-by-step for new sites, migration, export, storage, deployment
- **Pilot evaluation:** `infra/sonicjs/README.md` — current status, comparison, transferability
- **Reference implementation:** `infra/sonicjs/theorium/` — fully ported Theorium site

## Monorepo structure

```
packages/config      shared TypeScript types, ESLint, Prettier configs, template registry
packages/ui          shared Astro components and layouts
packages/utils       shared utilities (SEO, image helpers, Directus client, validation)
sites/admin          web-based admin UI (dashboard, template gallery, site wizard)
sites/template       base site — copy for every new client
sites/<client>/      generated client sites
infra/admin          PM2 + Caddy config for admin deployment
infra/docker         Directus Docker Compose files (one per CMS client)
infra/payload        Payload CMS projects (one per client) — see GUIDE.md (PRIMARY)
infra/sonicjs        SonicJs CMS projects (deprecated) — see GUIDE.md
infra/backups        database and upload backup scripts
infra/provisioning   CLI provisioning script (alternative to admin UI)
tests/               Playwright e2e, Vitest integration, Lighthouse CI
```

## Tech stack

- **Framework:** Astro 6 (static output with per-route `prerender = false` for server routes)
- **Styling:** Tailwind CSS v4 (CSS-based config via `@theme` blocks, `@tailwindcss/vite` plugin)
- **Islands:** React (for interactive components only — forms, mobile nav, cookie consent)
- **CMS:** Payload CMS (primary, D1 + R2, Cloudflare Workers) / Directus 11 (legacy, PostgreSQL, Docker)
- **Hosting:** Cloudflare Pages (sites), Hetzner VPS (Directus)
- **Email:** Resend (contact forms)
- **Analytics:** Plausible / Fathom / Google Analytics (per-client choice)
- **Secrets:** Doppler
- **Monitoring:** Betterstack (uptime), Sentry (errors)
- **CI/CD:** GitHub Actions

## Conventions

### TypeScript
- `strict: true` everywhere, no exceptions
- `noUncheckedIndexedAccess: true`
- Path aliases: `@agency/ui`, `@agency/config`, `@agency/utils`

### Components
- All shared components use Tailwind tokens only — no hardcoded colours or fonts
- All text content comes from props or `site.config.ts`, never hardcoded in components
- Every component accepts a `class` prop for additional Tailwind classes
- Images use Astro `<Image />` or `getDirectusImageUrl()` helper
- Interactive components are React islands in `packages/ui/src/islands/`
- Use `client:visible` or `client:idle` over `client:load` unless immediate interactivity is required

### Components with variants
- Components needing visual flexibility expose a `variant` prop
- Variants control visual treatment, not structural markup
- Components that don't need variants accept styling through tokens and props

### Forms and validation
- Form validation uses zod schemas from `packages/utils`
- API routes export `const prerender = false`
- Every API route validates all inputs server-side with zod
- Honeypot field for spam protection on all forms

### Site configuration
- Each site has a `site.config.ts` — single source of truth for identity, contact, SEO, nav, footer, analytics, CMS, and theme settings
- Each site defines brand tokens in `src/styles/global.css` via `@theme` blocks (Tailwind v4 CSS config)
- Use `@source` directive in CSS to include shared component paths for Tailwind scanning

### File naming
| Item | Convention | Example |
|------|-----------|---------|
| Astro components | PascalCase.astro | `Hero.astro` |
| React islands | PascalCase.tsx | `ContactForm.tsx` |
| Pages | lowercase.astro | `about.astro` |
| API routes | lowercase.ts | `contact.ts` |
| Config files | kebab-case | `site.config.ts` |
| Client folders | kebab-case | `sites/harrison-cole/` |
| Utility functions | camelCase | `getDirectusImageUrl()` |
| Environment variables | SCREAMING_SNAKE | `RESEND_API_KEY` |
| Directus collections | snake_case | `team_members` |
| CSS/Tailwind | utility classes only | no custom `.btn-primary` classes |

### Git and deployment
- Site-specific overrides go in the site folder, not in packages
- Changes to shared packages affect all sites — test across at least two sites before merging
- Never add site-specific logic to a shared component

## Design system layers

1. **Theme tokens** (`src/styles/global.css` `@theme` block) — colours, fonts, spacing per site
2. **Layout templates** (`packages/ui/src/layouts/`) — page structure (BaseLayout, SingleColumn, WithSidebar, FullWidth, BlogPost)
3. **Component variants** — visual treatment via `variant` prop on shared components
4. **Component overrides** (`sites/<slug>/src/components/`) — per-site replacements for any shared component, resolved automatically via Vite plugin

## When building a new site

### Via admin UI (recommended)
1. Go to http://localhost:4321/sites/new (or deployed admin URL)
2. Walk through the 5-step wizard (details, template, theme, config, create)
3. Site auto-builds and deploys to Cloudflare Pages in the background
4. Live at `https://<slug>.infront.cy` within ~30 seconds
5. Add custom production domain via `/sites/<slug>` management page

### Via CLI
1. Run `./infra/provisioning/new-site.sh <slug> <tier> <domain>`
2. Edit `site.config.ts` and `src/styles/global.css` with client brand
3. Choose layouts for each page, pick component variants
4. Compose pages from shared components
5. Add custom components in `sites/<client>/src/components/` if needed
6. Connect Directus data for CMS clients
7. Test locally, deploy to preview, iterate, launch

## Editing an existing site

After a site is generated and deployed, all design and content changes are made by editing files in `sites/<slug>/`. Preview locally, then redeploy.

### Workflow

```
1. Edit files in sites/<slug>/
2. Preview: pnpm dev --filter @agency/<slug>
3. Redeploy via admin UI "Redeploy" button (or: pnpm build --filter @agency/<slug> && wrangler pages deploy)
```

### Change brand colours or fonts

Edit `sites/<slug>/src/styles/global.css`. All shared components read from these tokens — a single change updates the entire site.

```css
@theme {
  /* Change primary colour from blue to green */
  --color-primary-600: #16a34a;

  /* Change heading font */
  --font-heading: "Playfair Display", serif;
}
```

Every `--color-primary-*`, `--color-secondary-*`, `--color-accent-*`, and `--color-neutral-*` shade (50–950) can be adjusted independently.

### Change site identity, nav, footer, SEO, or contact info

Edit `sites/<slug>/site.config.ts`. This is the single source of truth for all non-visual site settings.

```typescript
// Change nav items
nav: {
  items: [
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },  // add a new page
    { label: 'Contact', href: '/contact' },
  ],
  cta: { label: 'Book Now', href: '/contact' },  // change CTA text
},

// Change theme behaviour
theme: {
  navStyle: 'fixed',       // 'sticky' | 'fixed' | 'static'
  footerStyle: 'minimal',  // 'simple' | 'multi-column' | 'minimal'
  heroDefault: 'split',    // 'centered' | 'split' | 'fullscreen' | 'minimal' | 'video'
  borderStyle: 'pill',     // 'sharp' | 'rounded' | 'pill'
},
```

### Change a component variant

Edit the page file in `sites/<slug>/src/pages/`. Change the `variant` prop on any component.

```astro
<!-- Change hero from centered to split -->
<Hero variant="split" heading="..." subheading="..." />

<!-- Change card grid from 3 columns to 2 -->
<CardGrid variant="two-column" cards={[...]} />

<!-- Change CTA from default to minimal -->
<CTA variant="minimal" heading="..." buttonText="..." buttonHref="..." />
```

**Available variants:**

| Component | Variants |
|-----------|----------|
| Hero | `centered`, `split`, `fullscreen`, `minimal`, `video` |
| CTA | `default`, `split`, `minimal` |
| CardGrid | `two-column`, `three-column`, `four-column`, `masonry`, `list` |
| Testimonials | `default`, `carousel`, `featured` |
| TeamGrid | `default`, `compact`, `detailed` |
| FAQ | `default`, `two-column` |
| Features | `grid`, `alternating`, `icon-list` |
| Gallery | `grid`, `masonry` |
| Timeline | `vertical`, `alternating` |
| StatsCounter | `inline`, `grid` |
| LogoCloud | `grid`, `scrolling` |
| PricingTable | `two-column`, `three-column` |
| Section | background: `light`, `dark`, `primary` |
| Footer | via `theme.footerStyle`: `simple`, `multi-column`, `minimal` |

### Add, remove, or reorder sections on a page

Edit the `.astro` page file directly. Sections are just component invocations — move them around, delete them, or add new ones.

```astro
<!-- Add a stats section above the CTA -->
<Section heading="By the numbers">
  <StatsCounter
    variant="grid"
    stats={[
      { value: '500', suffix: '+', label: 'Clients' },
      { value: '99', suffix: '%', label: 'Satisfaction' },
    ]}
  />
</Section>

<!-- Remove testimonials: just delete the <Section>/<Testimonials> block -->
```

Import any new component at the top of the file:

```astro
---
import StatsCounter from '@agency/ui/components/StatsCounter.astro';
---
```

### Add a new page

Create a new `.astro` file in `sites/<slug>/src/pages/`. Use shared layouts and components.

```astro
---
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
import Hero from '@agency/ui/components/Hero.astro';
import Features from '@agency/ui/components/Features.astro';
import Section from '@agency/ui/components/Section.astro';
import config from '../../site.config';
---

<FullWidth title="Services" description="What we offer" config={config}>
  <Hero variant="minimal" heading="Our Services" />
  <Section heading="What we do">
    <Features variant="grid" features={[
      { title: 'Web Design', description: 'Beautiful, responsive websites.' },
      { title: 'Development', description: 'Fast, accessible, SEO-optimised.' },
    ]} />
  </Section>
</FullWidth>
```

Then add it to the nav in `site.config.ts`.

### Override a shared component (bespoke design)

For a fully custom component that only applies to one site, create a file in `sites/<slug>/src/components/` with the same name as the shared component.

```
sites/<slug>/src/components/Hero.astro    ← overrides @agency/ui/components/Hero.astro
sites/<slug>/src/components/Footer.astro  ← overrides @agency/ui/components/Footer.astro
```

**How it works:** A Vite plugin (`componentOverridePlugin`) intercepts `@agency/ui/components/*` imports and checks for a local override first. No import changes needed in page files — the override is automatic.

**Rules for overrides:**
- The override file must accept the same props interface as the shared component (or a superset)
- Use Tailwind tokens (`primary-600`, `font-heading`, etc.) so the override still respects site theming
- Overrides do **not** receive shared component bug fixes — you maintain them yourself
- The admin UI shows which components are overridden on the site management page (`/sites/<slug>`)

**To remove an override:** delete the file from `sites/<slug>/src/components/`. The site reverts to the shared version.

### Change the page layout

Each page wraps its content in a layout component. Change the import to switch layouts.

```astro
<!-- From single column... -->
import SingleColumn from '@agency/ui/layouts/SingleColumn.astro';
<!-- ...to full width -->
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
```

**Available layouts:** `FullWidth`, `SingleColumn`, `WithSidebar`, `BlogPost`, `BaseLayout`

### Quick reference: what to edit for common requests

| Client request | File to edit | What to change |
|---------------|-------------|----------------|
| "Change our brand colour" | `src/styles/global.css` | `--color-primary-*` values in `@theme` |
| "Use a different font" | `src/styles/global.css` | `--font-heading` / `--font-body` in `@theme` |
| "Update phone number" | `site.config.ts` | `contact.phone` |
| "Add a new nav link" | `site.config.ts` | `nav.items` array |
| "Make the hero bigger" | `src/pages/index.astro` | `variant="fullscreen"` on `<Hero>` |
| "Add a pricing page" | `src/pages/pricing.astro` | Create new file with `PricingTable` component |
| "Different footer style" | `site.config.ts` | `theme.footerStyle` |
| "Completely custom hero" | `src/components/Hero.astro` | Create override file |
| "Add team photos" | `src/pages/about.astro` | Add `photo` prop to `TeamGrid` members |
| "Remove the map" | `src/pages/contact.astro` | Delete the `<Map>` component |

## Help manual maintenance

The admin UI includes an in-app help manual at `sites/admin/src/data/help-content.ts`. This file contains all documentation articles.

**When modifying platform functionality, always update the corresponding help article(s):**
- Changed a shared component's props or variants → update its article in the `components` category
- Changed site.config.ts schema or options → update the `configuration` category articles
- Changed an API route → update the `api-reference` category article for that route
- Changed deployment/infrastructure scripts → update the `deployment` or `infrastructure` category articles
- Added/removed admin UI features → update the `admin-ui` category articles
- Changed the site creation wizard or CLI provisioning → update the `site-creation` category articles
- Changed testing setup or performance budgets → update the `testing` category articles
- Changed security headers or validation → update the `security-accessibility` category articles

If you add entirely new functionality that doesn't fit an existing article, create a new article entry in `help-content.ts` under the appropriate category.

## Admin UI

- **Location:** `sites/admin/` — Astro 6 SSR with `@astrojs/node` adapter
- **Auth:** bcrypt password + JWT session cookie (24h expiry)
- **Env vars:** `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`
- **Dashboard:** lists all sites with deploy status badges, staging/production URLs
- **Templates:** gallery of 5 templates (business-starter, restaurant, portfolio, saas, professional) from `packages/config/src/templates.ts`
- **Wizard:** 5-step form → auto-builds and deploys to Cloudflare Pages → live at `<slug>.infront.cy`
- **Site management** (`/sites/<slug>`): redeploy, add/remove custom domain, view component overrides
- **Deployment:** PM2 on Hetzner VPS behind Caddy reverse proxy

## Auto-deploy pipeline

- Sites auto-deploy on creation: generate → build → wrangler deploy → DNS CNAME → SSL
- Deploy metadata stored in `sites/<slug>/.deploy.json`
- UI polls `/api/sites/<slug>/deploy-status` every 3s for progress
- Staging: `<slug>.infront.cy` (auto-assigned)
- Production: custom domain added via site management page
- Redeploy: POST `/api/sites/<slug>/redeploy`
- CNAME uses `proxied: false` to avoid Cloudflare error 1014

## When adding shared components

1. Check if a similar component exists in `packages/ui` or another site
2. If yes, use it or extend it with a new variant
3. If no, build it in the site folder first, move to `packages/ui` later if reusable

## Performance budgets

| Metric | Budget |
|--------|--------|
| Total page weight (home) | < 500KB transferred |
| JavaScript (all islands) | < 100KB gzipped |
| CSS | < 15KB gzipped |
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| Lighthouse Performance | >= 90 |
| Lighthouse Accessibility | >= 95 |
| Lighthouse SEO | >= 95 |

## Accessibility

- WCAG 2.1 Level AA mandatory on all sites
- Semantic HTML (`<nav>`, `<main>`, `<article>`, etc.) — no div soup
- Skip-to-content link in BaseLayout
- One `<h1>` per page, logical heading hierarchy
- All images require alt text
- Focus indicators on all interactive elements
- Forms: labels, aria-describedby for errors, aria-live for announcements

## Security

- No secrets in Git — everything through Doppler
- Security headers via `public/_headers` (CSP, HSTS, X-Frame-Options, etc.)
- API routes: rate limiting, input validation (zod), CORS restricted to site origin
- Directus: public registration disabled, CORS restricted, file upload types limited

## File Storage (R2)

All file storage is on **Cloudflare R2** — no files are stored on the VPS disk. Full documentation: `infra/STORAGE.md`.

### Two systems, one R2 bucket

| System | Purpose | R2 Bucket | Path Prefix | Management |
|--------|---------|-----------|-------------|------------|
| **Directus CMS** | CMS-managed content (blog images, team photos) | `infront-uploads` | `<slug>/` | Directus admin panel |
| **CDN Media** | Generic media, videos, downloadable resources | `infront-cdn` (public) / `infront-uploads` (private) | `<clientId>/` | `web.infront.cy/media` or `portal.infront.cy/files` |

These are **completely separate systems** — no sync between them. They share the same R2 bucket (`infront-uploads`) but use different path prefixes.

### R2 Buckets

| Bucket | Jurisdiction | Endpoint | Custom Domain |
|--------|-------------|----------|---------------|
| `infront-cdn` | EU | `*.eu.r2.cloudflarestorage.com` | `cdn.infront.cy` |
| `infront-uploads` | Default | `*.r2.cloudflarestorage.com` | None |

**The two buckets use different endpoints.** Using the wrong endpoint returns 403.

### Directus storage config

Each Directus instance stores files in R2 with a slug-based prefix for isolation:

```yaml
# docker-compose.yml
STORAGE_LOCATIONS: "s3"
STORAGE_S3_DRIVER: "s3"
STORAGE_S3_KEY: "${STORAGE_S3_KEY}"
STORAGE_S3_SECRET: "${STORAGE_S3_SECRET}"
STORAGE_S3_BUCKET: "infront-uploads"
STORAGE_S3_REGION: "auto"
STORAGE_S3_ENDPOINT: "${STORAGE_S3_ENDPOINT}"
STORAGE_S3_ROOT: "${SLUG}/"
```

### Using CDN files in client sites

```astro
---
import { getCdnUrl } from '@agency/utils';
import Video from '@agency/ui/components/Video.astro';
---
<img src={getCdnUrl(5, 'images/hero.webp')} alt="Hero" loading="lazy" />
<Video src={getCdnUrl(5, 'videos/showreel.mp4')} />
```

### Key files
- `infra/STORAGE.md` — comprehensive storage documentation
- `infra/PLATFORM-API-OPS.md` — platform API operations guide
- `packages/utils/src/cdn.ts` — `getCdnUrl()` helper
- `packages/ui/src/components/Video.astro` — shared video component
- `sites/admin/src/islands/CDNMediaLibrary.tsx` — admin media management island
- `sites/admin/src/pages/api/cdn/[...path].ts` — proxy to platform API (uses `env()` helper, not `process.env`)

## Commands

```bash
# Development
npm run dev --workspace=sites/<client>      # client site
npm run dev --workspace=sites/admin         # admin UI

# Build
npm run build --workspace=sites/<client>
npm run build --workspace=sites/admin

# Code quality
npm run lint
npm run typecheck
npm run format

# Tests
npx vitest run                    # integration tests
npx playwright test               # e2e tests
lhci autorun                      # lighthouse CI

# Provisioning (CLI)
./infra/provisioning/new-site.sh <slug> <tier> <domain>

# Directus
npx directus schema snapshot      # export
npx directus schema apply         # import

# Admin deployment
pm2 start infra/admin/ecosystem.config.cjs
pm2 restart agency-admin
```
