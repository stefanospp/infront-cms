# Infront CMS — Solo Web Agency Platform

A monorepo platform for running a solo web agency. Create, manage, and deploy client websites from a single codebase with a web-based admin UI.

## Quick start

```bash
# Install dependencies
npm install

# Start the admin UI (site management dashboard)
npm run dev --workspace=sites/admin

# Start a client site (e.g., the template)
npm run dev --workspace=sites/template

# Run tests
npx vitest run
```

The admin UI runs at http://localhost:4321. Default password: set via `ADMIN_PASSWORD_HASH` env var (see [Admin setup](#admin-ui-setup)).

---

## Architecture overview

```
infront-cms/
├── packages/
│   ├── config/          TypeScript types, ESLint, Prettier configs, template registry
│   ├── ui/              Shared Astro components, layouts, React islands
│   └── utils/           SEO helpers, Directus client, image helpers, zod validation
│
├── sites/
│   ├── admin/           Web-based admin UI (site management, wizard, template gallery)
│   ├── template/        Base site template — copied for every new client
│   └── <client>/        Generated client sites
│
├── infra/
│   ├── admin/           PM2 + Caddy config for admin deployment
│   ├── docker/          Directus Docker Compose files (one per CMS client)
│   ├── backups/         Database and upload backup scripts
│   ├── provisioning/    CLI provisioning script (alternative to admin UI)
│   └── kamal.yml        Kamal deployment config for Directus
│
├── tests/
│   ├── e2e/             Playwright tests (navigation, forms, SEO, accessibility)
│   ├── integration/     Vitest tests (validation schemas, image URLs)
│   └── lighthouse/      Lighthouse CI configuration
│
└── .github/workflows/   CI/CD for testing, site deploys, Directus deploys
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 6 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, CSS-based `@theme` config) |
| Interactive islands | React 18 |
| CMS | Directus 11 (PostgreSQL, Docker) |
| Site hosting | Cloudflare Pages |
| CMS hosting | Hetzner VPS via Kamal |
| Admin hosting | Hetzner VPS via PM2 |
| Email | Resend |
| Analytics | Plausible / Fathom / Google Analytics (per-client) |
| Secrets | Doppler |
| Monitoring | Betterstack (uptime), Sentry (errors) |
| CI/CD | GitHub Actions |
| Licensing | Directus BSL 1.1 (free for orgs under $5M/year revenue) |

---

## Creating a new client site

There are two ways to create a site:

### Option A: Admin UI (recommended)

1. Start the admin: `npm run dev --workspace=sites/admin`
2. Open http://localhost:4321 and log in
3. Click **New Site** in the sidebar
4. Walk through the 5-step wizard:
   - **Step 1 — Client Details:** Name, slug, domain, tier (static/CMS/interactive)
   - **Step 2 — Choose Template:** Select from the template gallery
   - **Step 3 — Theme:** Pick brand colours, fonts, nav/footer/hero styles
   - **Step 4 — Configuration:** Contact info, nav items, SEO defaults, analytics
   - **Step 5 — Review & Create:** Confirm and generate
5. The site is **automatically built and deployed** to Cloudflare Pages
6. A staging URL is created at `https://<slug>.infront.cy`
7. The wizard shows real-time deploy progress (building → deploying → live)
8. Once live, you can add a custom production domain via the site management page

**What happens behind the scenes:**
- Site files are generated in `sites/<slug>/`
- `npm install` + `npm run build` runs automatically
- A Cloudflare Pages project is created via API
- Built files are deployed via `wrangler pages deploy`
- A DNS CNAME record is created: `<slug>.infront.cy` → `<slug>.pages.dev`
- SSL is provisioned automatically by Cloudflare

### Option B: CLI script

```bash
./infra/provisioning/new-site.sh <client-slug> <tier> <domain>

# Example:
./infra/provisioning/new-site.sh harrison-cole cms harrisonandcole.com
```

Then manually edit `site.config.ts` and `src/styles/global.css` in the generated site folder.

---

## Site configuration

Each client site is controlled by three files:

### `site.config.ts` — what the site contains

```typescript
const config: SiteConfig = {
  name: 'Client Name',
  tagline: 'Their tagline',
  url: 'https://clientdomain.com',
  locale: 'en-GB',
  contact: { email: '...', phone: '...', address: { ... } },
  seo: { defaultTitle: '...', titleTemplate: '%s | Client', defaultDescription: '...', defaultOgImage: '/og-default.jpg' },
  nav: { items: [{ label: 'About', href: '/about' }, ...], cta: { label: 'Contact', href: '/contact' } },
  footer: { columns: [...], socials: { linkedin: '...' }, legalLinks: [...] },
  analytics: { provider: 'plausible', siteId: 'clientdomain.com' },
  theme: { navStyle: 'sticky', footerStyle: 'multi-column', heroDefault: 'split', borderStyle: 'rounded' },
};
```

### `src/styles/global.css` — how the site looks

```css
@import "tailwindcss";
@source "../../packages/ui/src/**/*.{astro,tsx}";

@theme {
  --color-primary-600: #1a365d;    /* Navy */
  --color-secondary-600: #8b6914;  /* Gold */
  /* ... full 50-950 scales for primary, secondary, accent, neutral */
  --font-heading: "Playfair Display", serif;
  --font-body: "Inter", sans-serif;
}
```

### Page files (`src/pages/*.astro`) — what's on each page

Pages compose shared components with layout and variant choices:

```astro
---
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
import Hero from '@agency/ui/components/Hero.astro';
import CardGrid from '@agency/ui/components/CardGrid.astro';
import config from '../../site.config';
---

<FullWidth title={config.seo.defaultTitle} description={config.seo.defaultDescription} config={config}>
  <Hero variant="split" heading="..." ctaText="Contact Us" ctaHref="/contact" />
  <CardGrid variant="three-column" cards={[...]} />
</FullWidth>
```

---

## Shared packages

### `packages/ui` — Components and layouts

**Layouts** (wrap every page):

| Layout | Purpose |
|--------|---------|
| `BaseLayout.astro` | HTML shell, `<head>`, SEO meta, analytics scripts |
| `FullWidth.astro` | Edge-to-edge sections (home pages, landing pages) |
| `SingleColumn.astro` | Centred content column (about, contact, legal pages) |
| `WithSidebar.astro` | Main content + sidebar (blog listings) |
| `BlogPost.astro` | Article layout with prose typography |

**Components:**

| Component | Variants | Purpose |
|-----------|----------|---------|
| `Hero.astro` | `centered`, `split`, `fullscreen`, `minimal` | Page hero sections |
| `CardGrid.astro` | `two-column`, `three-column`, `masonry` | Service/feature cards |
| `Section.astro` | — | Generic section wrapper with heading |
| `CTA.astro` | — | Call-to-action banner |
| `Nav.astro` | — | Site navigation (config-driven) |
| `Footer.astro` | — | Site footer (adapts to `footerStyle` config) |
| `Testimonials.astro` | — | Testimonial grid |
| `TeamGrid.astro` | — | Team member grid |
| `FAQ.astro` | — | Accordion using `<details>/<summary>` |
| `Map.astro` | — | Google Maps embed |
| `SEOHead.astro` | — | Meta tags, OG, JSON-LD |

**React Islands** (interactive components):

| Island | Hydration | Purpose |
|--------|-----------|---------|
| `ContactForm.tsx` | `client:visible` | Validated contact form with honeypot |
| `MobileNav.tsx` | `client:load` | Mobile hamburger menu with focus trap |
| `CookieConsent.tsx` | `client:idle` | Cookie banner (Google Analytics only) |

### `packages/config` — Types and template registry

- `src/types.ts` — `SiteConfig`, `ThemeConfig`, `TemplateDefinition`, and all sub-interfaces
- `src/templates.ts` — Template registry (predefined site configurations)
- `eslint.config.mjs` — Shared ESLint flat config
- `prettier.config.mjs` — Shared Prettier config

### `packages/utils` — Shared utilities

| Module | Exports |
|--------|---------|
| `seo.ts` | `formatTitle()`, `generateMeta()`, `generateStructuredData()` |
| `image.ts` | `getDirectusImageUrl()` — builds Directus asset URLs with transforms |
| `directus.ts` | `createDirectusClient()`, `getPublishedItems()`, `getItemBySlug()` |
| `date.ts` | `formatDate()` — locale-aware date formatting |
| `validation.ts` | `ContactSchema` — zod schema for contact form validation |

---

## Admin UI

The admin is an Astro 6 SSR site at `sites/admin/` with a Node.js adapter (needs filesystem access to read/write sites).

### Pages

| Route | Purpose |
|-------|---------|
| `/login` | Password authentication |
| `/` | Dashboard — lists all sites with deploy status, tier badges, staging URLs |
| `/templates` | Template gallery — browse available templates |
| `/sites/new` | Site creation wizard (5-step form) with auto-deploy |
| `/sites/<slug>` | Site management — redeploy, add custom domain |

### Admin UI setup

1. Create a `.env` file in `sites/admin/`:

```bash
# Generate a password hash
node -e "import('bcryptjs').then(b => b.default.hash('yourpassword', 10).then(console.log))"

# Escape $ signs in the hash with backslashes
ADMIN_PASSWORD_HASH=\$2a\$10\$...rest-of-hash...
SESSION_SECRET=generate-a-random-64-char-hex-string

# Cloudflare (required for auto-deploy)
CLOUDFLARE_API_TOKEN=...     # Permissions: Account/Pages/Edit + Zone/DNS/Edit
CLOUDFLARE_ACCOUNT_ID=...    # From Cloudflare dashboard sidebar
CLOUDFLARE_ZONE_ID=...       # Zone ID for infront.cy
```

2. Start the admin:

```bash
npm run dev --workspace=sites/admin
```

### Deployment (Hetzner VPS)

```bash
# Build
npm run build --workspace=sites/admin

# Run with PM2
pm2 start infra/admin/ecosystem.config.cjs

# Caddy reverse proxy (see infra/admin/Caddyfile.example)
# admin.youragency.com -> localhost:4320
```

### API routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | Verify password, set session cookie |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/sites` | List all sites with deploy metadata |
| POST | `/api/sites/create` | Generate site + trigger auto-deploy |
| GET | `/api/sites/<slug>/deploy-status` | Poll deploy progress |
| POST | `/api/sites/<slug>/redeploy` | Trigger rebuild + redeploy |
| POST | `/api/sites/<slug>/custom-domain` | Add production custom domain |
| DELETE | `/api/sites/<slug>/custom-domain` | Remove production custom domain |
| GET | `/api/templates` | List available templates |

### Auto-deploy pipeline

When a site is created through the wizard, the following happens automatically in the background:

```
Create Site clicked
    |
    v
1. Generate site files in sites/<slug>/
    |
    v
2. npm install + npm run build (Astro build)
    |                                          UI polls /deploy-status
    v                                          every 3 seconds
3. Create Cloudflare Pages project via API
    |
    v
4. wrangler pages deploy (upload built files)
    |
    v
5. Create DNS CNAME: <slug>.infront.cy -> <slug>.pages.dev
    |
    v
6. Register custom domain on Pages project (SSL provisioning)
    |
    v
Site live at https://<slug>.infront.cy
```

**Staging vs Production:**
- **Staging URL** (`<slug>.infront.cy`) — auto-assigned on creation, always available
- **Production URL** (custom domain) — added later via the site management page (`/sites/<slug>`)

**Deploy metadata** is stored in `sites/<slug>/.deploy.json`:
```json
{
  "projectName": "client-slug",
  "stagingUrl": "client-slug.infront.cy",
  "productionUrl": null,
  "pagesDevUrl": "client-slug-7m3.pages.dev",
  "status": "live",
  "lastDeployAt": "2026-03-21T12:58:32.953Z",
  "dnsRecordId": "..."
}
```

**Redeploying:** Click "Redeploy" on the site management page or `POST /api/sites/<slug>/redeploy`. Rebuilds the site and pushes updated files to Cloudflare Pages.

**Custom domains:** Add a client's real domain (e.g., `clientsite.com`) via the site management page. The client needs to point their domain's DNS to the Pages URL. Cloudflare handles SSL.

---

## Template system

Templates are configuration presets stored in `packages/config/src/templates.ts`. They define page structures, component variants, theme tokens, and nav/footer defaults.

### Adding a new template

Add a new object to the `templates` array in `packages/config/src/templates.ts`:

```typescript
{
  id: 'portfolio-minimal',
  name: 'Portfolio Minimal',
  description: 'A clean portfolio template for creatives.',
  screenshot: '/templates/portfolio-minimal.png',
  category: 'portfolio',
  pages: [
    { slug: 'index', layout: 'FullWidth', sections: [...] },
    { slug: 'work', layout: 'SingleColumn', sections: [...] },
    { slug: 'contact', layout: 'SingleColumn', sections: [...] },
  ],
  defaultTheme: { navStyle: 'fixed', footerStyle: 'minimal', heroDefault: 'fullscreen', borderStyle: 'sharp' },
  defaultTokens: { colors: { primary: {...}, secondary: {...}, accent: {...}, neutral: {...} }, fonts: { heading: 'Playfair Display', body: 'Inter' } },
  defaultNav: { items: [...] },
  defaultFooter: { columns: [...], legalLinks: [...] },
  defaultSeo: { titleTemplate: '%s | Portfolio' },
}
```

The template will automatically appear in the admin gallery and wizard.

---

## Directus CMS (Tier 2+ clients)

### Setup

```bash
cd infra/docker/<client-slug>
cp .env.example .env
# Fill in .env with real values (generate KEY/SECRET with: openssl rand -hex 32)
docker compose up -d
```

### Standard collections

Create these in the Directus admin UI after first deploy:

- **pages** — title, slug, status, content, seo_title, seo_description, og_image, sort_order
- **posts** — title, slug, status, content, excerpt, featured_image, author, published_date
- **team** — name, role, bio, photo, email, sort_order, status
- **settings** (singleton) — site_name, tagline, contact_email, social_links

### Fetching CMS content in pages

```astro
---
import { getPosts } from '../lib/directus';
const posts = await getPosts();
---

{posts.map(post => <article><h2>{post.title}</h2></article>)}
```

### Licensing

Directus uses BSL 1.1. **Free for organizations under $5M/year total revenue + funding.** Commercial license required above that threshold. See [directus.io/bsl](https://directus.io/bsl).

---

## Deployment

### Client sites (Cloudflare Pages)

Each site deploys via GitHub Actions (`.github/workflows/deploy-site.yml`):

1. Push to `main` triggers build when `sites/<client>/**` or `packages/**` change
2. Builds the site workspace
3. Deploys to Cloudflare Pages via `wrangler`

### Directus instances (Kamal to Hetzner)

Triggered on changes to `infra/` (`.github/workflows/deploy-directus.yml`).

### DNS

- Client site: CNAME to Cloudflare Pages URL
- CMS subdomain (e.g., `cms.clientdomain.com`): A record to Hetzner VPS IP
- Cloudflare proxy enabled on all records, full strict SSL

---

## Backups

| Script | Schedule | What |
|--------|----------|------|
| `infra/backups/pg_backup.sh` | Daily 03:00 UTC | `pg_dump` each client database, gzip, upload to S3 |
| `infra/backups/uploads_backup.sh` | Daily | rsync Directus uploads, sync to S3 |
| `infra/backups/restore.sh` | On demand | Restore database or uploads from S3 backup |

---

## Testing

```bash
# Integration tests (validation schemas, utilities)
npx vitest run

# End-to-end tests (requires site to be built)
npm run build --workspace=sites/template
npx playwright test

# Lighthouse CI
npm run build --workspace=sites/template
npx @lhci/cli autorun --config=tests/lighthouse/lighthouserc.json
```

### Test coverage

| Suite | Tests |
|-------|-------|
| `tests/integration/contact-api.test.ts` | ContactSchema validation (5 tests) |
| `tests/integration/directus-fetch.test.ts` | Directus image URL builder (3 tests) |
| `tests/e2e/navigation.spec.ts` | Nav links resolve, mobile menu works |
| `tests/e2e/contact-form.spec.ts` | Form validation, submission, honeypot |
| `tests/e2e/seo.spec.ts` | Meta tags, JSON-LD, sitemap, robots.txt |
| `tests/e2e/accessibility.spec.ts` | WCAG 2.1 AA via axe-core |

---

## CI/CD workflows

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `test.yml` | Push to main, PRs | Lint, typecheck, security audit, vitest, playwright, lighthouse |
| `deploy-site.yml` | Push to main (site/package changes) | Build + deploy to Cloudflare Pages |
| `deploy-directus.yml` | Push to main (infra changes) | Kamal deploy to Hetzner |
| `dependabot.yml` | Weekly/monthly | Automated dependency update PRs |

---

## Security

- **No secrets in Git** — everything through Doppler or `.env` (gitignored)
- **Security headers** — CSP, HSTS, X-Frame-Options via `public/_headers`
- **API route hardening** — rate limiting (5/hr per IP), zod validation, CORS restricted to site origin, honeypot spam protection
- **Directus hardening** — public registration disabled, CORS restricted, file uploads limited to images + PDFs (10MB max)
- **Admin auth** — bcrypt password hashing, JWT session tokens (24h expiry), HttpOnly cookies

---

## Performance budgets

| Metric | Budget |
|--------|--------|
| Total page weight | < 500KB |
| JavaScript | < 100KB gzipped |
| CSS | < 15KB gzipped |
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| Lighthouse Performance | >= 90 |
| Lighthouse Accessibility | >= 95 |
| Lighthouse SEO | >= 95 |

---

## Commands reference

```bash
# Development
npm run dev --workspace=sites/<client>      # Start client site dev server
npm run dev --workspace=sites/admin         # Start admin UI dev server

# Building
npm run build --workspace=sites/<client>    # Build a client site
npm run build --workspace=sites/admin       # Build admin UI

# Code quality
npm run lint                                # ESLint
npm run typecheck                           # TypeScript type check
npm run format                              # Prettier format
npm run format:check                        # Prettier check

# Testing
npx vitest run                              # Integration tests
npx playwright test                         # E2E tests

# Provisioning (CLI alternative to admin UI)
./infra/provisioning/new-site.sh <slug> <tier> <domain>

# Directus
cd infra/docker/<client> && docker compose up -d   # Start CMS
npx directus schema snapshot                        # Export schema
npx directus schema apply                           # Import schema

# Backups
./infra/backups/pg_backup.sh                # Backup all databases
./infra/backups/uploads_backup.sh           # Backup uploads
./infra/backups/restore.sh db <file> <db>   # Restore a database
./infra/backups/restore.sh uploads <client> # Restore uploads

# Admin deployment (Hetzner VPS)
pm2 start infra/admin/ecosystem.config.cjs  # Start admin with PM2
pm2 restart agency-admin                    # Restart after rebuild
```

---

## File naming conventions

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
