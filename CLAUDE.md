# Agency Platform — Claude Code Reference

## What this is

A monorepo platform for running a solo web agency. Each client gets an Astro site deployed to Cloudflare Pages. CMS clients get a Directus instance on Hetzner via Kamal. Shared UI components, config, and utilities live in packages.

## Monorepo structure

```
packages/ui          shared Astro components and layouts
packages/config      shared TypeScript, ESLint, Prettier configs and types
packages/utils       shared utilities (SEO, image helpers, Directus client, validation)
sites/template       base site — copy for every new client
sites/<client>/      per-client sites extending the template
infra/               Kamal config, Docker Compose files, backup scripts, provisioning
tests/               Playwright e2e, Vitest integration, Lighthouse CI
```

## Tech stack

- **Framework:** Astro 6 (static output with per-route `prerender = false` for server routes)
- **Styling:** Tailwind CSS v4 (CSS-based config via `@theme` blocks, `@tailwindcss/vite` plugin)
- **Islands:** React (for interactive components only — forms, mobile nav, cookie consent)
- **CMS:** Directus 11 (PostgreSQL, Docker, deployed via Kamal)
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

## When building a new site

1. Run the provisioning script (`infra/provisioning/new-site.sh`)
2. Write `site.config.ts` and define brand tokens in `src/styles/global.css` `@theme` block
3. Choose layouts for each page, pick component variants
4. Compose pages from shared components
5. Add custom components in `sites/<client>/src/components/` if needed
6. Connect Directus data for CMS clients
7. Test locally, deploy to preview, iterate, launch

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

## Commands

```bash
# Development
npm run dev --workspace=sites/<client>

# Build
npm run build --workspace=sites/<client>

# Preview built site
npm run preview --workspace=sites/<client>

# Lint
npm run lint

# Type check
npm run typecheck

# Tests
npx vitest run                    # integration tests
npx playwright test               # e2e tests
lhci autorun                      # lighthouse CI

# Directus schema
npx directus schema snapshot      # export
npx directus schema apply         # import
```
