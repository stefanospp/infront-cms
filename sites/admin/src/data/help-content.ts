import type { HelpCategoryMeta, HelpArticle } from './help-types';

export const categories: HelpCategoryMeta[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    description: 'Platform overview, quick start guide, and key concepts.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    order: 1,
  },
  {
    id: 'architecture',
    label: 'Architecture',
    description: 'Monorepo structure, tech stack, and design system layers.',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    order: 2,
  },
  {
    id: 'admin-ui',
    label: 'Admin UI',
    description: 'Dashboard, template gallery, site wizard, and site management.',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    order: 3,
  },
  {
    id: 'site-creation',
    label: 'Site Creation',
    description: 'Creating and configuring new client sites via wizard or CLI.',
    icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z',
    order: 4,
  },
  {
    id: 'shared-packages',
    label: 'Shared Packages',
    description: 'Config, utilities, and UI packages that power all sites.',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    order: 5,
  },
  {
    id: 'components',
    label: 'Components',
    description: 'All shared UI components with props, variants, and usage examples.',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
    order: 6,
  },
  {
    id: 'deployment',
    label: 'Deployment',
    description: 'Auto-deploy pipeline, Cloudflare Pages, staging, and production.',
    icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
    order: 7,
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    description: 'Hetzner VPS, Directus Docker, Kamal, Cloudflare Tunnel, and backups.',
    icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
    order: 8,
  },
  {
    id: 'testing',
    label: 'Testing',
    description: 'Vitest, Playwright, Lighthouse CI, and performance budgets.',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    order: 9,
  },
  {
    id: 'configuration',
    label: 'Configuration',
    description: 'Site config, Tailwind tokens, templates, environment variables.',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    order: 10,
  },
  {
    id: 'api-reference',
    label: 'API Reference',
    description: 'All admin API endpoints with request/response schemas.',
    icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    order: 11,
  },
  {
    id: 'developer-workflows',
    label: 'Developer Workflows',
    description: 'Day-to-day development, editing sites, adding components, git conventions.',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    order: 12,
  },
  {
    id: 'security-accessibility',
    label: 'Security & Accessibility',
    description: 'Security headers, validation, WCAG compliance, and best practices.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    order: 13,
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting',
    description: 'Common issues, error resolution, and FAQ.',
    icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
    order: 14,
  },
];

export const articles: HelpArticle[] = [
  // =========================================================================
  // GETTING STARTED
  // =========================================================================
  {
    id: 'platform-overview',
    title: 'Platform Overview',
    description: 'What this platform is, who it is for, and how it works at a high level.',
    category: 'getting-started',
    tags: ['overview', 'introduction', 'agency', 'monorepo', 'platform'],
    relatedArticles: ['monorepo-structure', 'quick-start-guide'],
    body: `
## What is this?

A monorepo platform for running a solo web agency. Each client gets an Astro site deployed to Cloudflare Pages. CMS clients get a Directus instance on Hetzner via Kamal. Shared UI components, config, and utilities live in packages.

## Key concepts

| Concept | Description |
|---------|-------------|
| **Monorepo** | All code lives in a single repository, organized into packages and sites |
| **Sites** | Each client has their own Astro site in \`sites/<slug>/\` |
| **Shared packages** | Reusable code in \`packages/config\`, \`packages/ui\`, and \`packages/utils\` |
| **Templates** | Predefined site structures that serve as starting points |
| **Admin UI** | This web-based dashboard for managing all sites |
| **Tiers** | \`static\` (no CMS), \`cms\` (Directus), or \`interactive\` (CMS + React islands) |

## How a site goes from idea to live

1. **Create** — Use the admin wizard or CLI to generate a new site from a template
2. **Configure** — Set brand colours, fonts, content, and navigation in \`site.config.ts\` and \`global.css\`
3. **Compose** — Build pages from shared components, choosing variants and layouts
4. **Deploy** — Auto-deploys to Cloudflare Pages; live at \`<slug>.infront.cy\` in ~30 seconds
5. **Manage** — Redeploy, add custom domains, and monitor via this admin UI

## Tech stack at a glance

- **Framework:** Astro 6 (static + SSR)
- **Styling:** Tailwind CSS v4 (CSS-based config)
- **Islands:** React (forms, mobile nav, cookie consent)
- **CMS:** Directus 11 (PostgreSQL, Docker)
- **Hosting:** Cloudflare Pages (sites), Hetzner VPS (Directus + admin)
- **Email:** Resend
- **CI/CD:** GitHub Actions
`,
  },
  {
    id: 'quick-start-guide',
    title: 'Quick Start Guide',
    description: 'Step-by-step instructions for common tasks: create a site, develop locally, deploy.',
    category: 'getting-started',
    tags: ['quick start', 'getting started', 'first site', 'development', 'deploy'],
    relatedArticles: ['site-wizard-walkthrough', 'cli-site-creation', 'editing-existing-sites'],
    body: `
## Create your first site

### Via admin UI (recommended)

1. Click **New Site** in the sidebar
2. Walk through the 5-step wizard:
   - **Details** — name, tagline, slug, domain, tier
   - **Template** — pick a starting template
   - **Theme** — colours, fonts, nav/footer style
   - **Config** — SEO, nav items, footer, contact info
   - **Create** — review and confirm
3. Site auto-builds and deploys in the background
4. Live at \`https://<slug>.infront.cy\` within ~30 seconds

### Via CLI

\`\`\`bash
./infra/provisioning/new-site.sh acme-corp cms acme-corp.com
\`\`\`

Then edit \`site.config.ts\` and \`src/styles/global.css\` with client branding.

## Develop locally

\`\`\`bash
# Client site
npm run dev --workspace=sites/<slug>

# Admin UI
npm run dev --workspace=sites/admin
\`\`\`

## Build & deploy

\`\`\`bash
# Build
npm run build --workspace=sites/<slug>

# Or redeploy via admin UI — click "Redeploy" on the site management page
\`\`\`

## Code quality

\`\`\`bash
npm run lint        # ESLint
npm run typecheck   # TypeScript strict
npm run format      # Prettier
\`\`\`

## Run tests

\`\`\`bash
npx vitest run          # Integration tests
npx playwright test     # E2E tests
lhci autorun            # Lighthouse CI
\`\`\`
`,
  },

  // =========================================================================
  // ARCHITECTURE
  // =========================================================================
  {
    id: 'monorepo-structure',
    title: 'Monorepo Structure',
    description: 'How the repository is organized: packages, sites, infrastructure, and tests.',
    category: 'architecture',
    tags: ['monorepo', 'structure', 'directories', 'organization', 'workspace'],
    relatedArticles: ['tech-stack-overview', 'design-system-layers'],
    body: `
## Directory layout

\`\`\`
packages/config      Shared TypeScript types, ESLint, Prettier configs, template registry
packages/ui          Shared Astro components and layouts
packages/utils       Shared utilities (SEO, image helpers, Directus client, validation)
sites/admin          This admin UI (dashboard, template gallery, site wizard)
sites/template       Base site — copied for every new client
sites/<client>/      Generated client sites
infra/admin          PM2 + Caddy config for admin deployment
infra/docker         Directus Docker Compose files (one per CMS client)
infra/backups        Database and upload backup scripts
infra/provisioning   CLI provisioning script
tests/               Playwright e2e, Vitest integration, Lighthouse CI
\`\`\`

## Dependency graph

\`\`\`mermaid
graph TD
    A[sites/admin] --> D[packages/config]
    A --> E[packages/utils]
    B[sites/template] --> C[packages/ui]
    B --> D
    B --> E
    C --> D
    F[sites/client-a] --> C
    F --> D
    F --> E
    G[sites/client-b] --> C
    G --> D
    G --> E
    style A fill:#3b82f6,color:#fff
    style B fill:#6b7280,color:#fff
    style C fill:#8b5cf6,color:#fff
    style D fill:#f59e0b,color:#fff
    style E fill:#22c55e,color:#fff
    style F fill:#ef4444,color:#fff
    style G fill:#ef4444,color:#fff
\`\`\`

## Key rules

- **Site-specific overrides** go in the site folder, not in shared packages
- **Changes to shared packages** affect all sites — test across at least two sites before merging
- **Never add site-specific logic** to a shared component
- Build a new component in a site folder first, then promote to \`packages/ui\` if reusable

## Workspace commands

All workspaces are managed via npm. To target a specific workspace:

\`\`\`bash
npm run dev --workspace=sites/<slug>
npm run build --workspace=sites/<slug>
\`\`\`

## Path aliases

| Alias | Maps to |
|-------|---------|
| \`@agency/config\` | \`packages/config/src\` |
| \`@agency/ui\` | \`packages/ui/src\` |
| \`@agency/utils\` | \`packages/utils/src\` |
`,
  },
  {
    id: 'tech-stack-overview',
    title: 'Tech Stack Overview',
    description: 'Every technology used in the platform with its role and version.',
    category: 'architecture',
    tags: ['tech stack', 'astro', 'tailwind', 'react', 'directus', 'cloudflare', 'typescript'],
    relatedArticles: ['monorepo-structure', 'design-system-layers'],
    body: `
## Core technologies

| Technology | Version | Role |
|-----------|---------|------|
| **Astro** | 6 | Site framework — static output with per-route SSR |
| **Tailwind CSS** | v4 | Styling — CSS-based config via \`@theme\` blocks |
| **React** | 18 | Interactive islands (forms, mobile nav, cookie consent) |
| **TypeScript** | Strict | Type safety across all packages |
| **Directus** | 11 | Headless CMS for CMS-tier clients |
| **PostgreSQL** | 16 | Database for Directus (with PostGIS) |

## Hosting & infrastructure

| Service | Role |
|---------|------|
| **Cloudflare Pages** | Static site hosting + CDN |
| **Cloudflare DNS** | Domain management (CNAME records) |
| **Cloudflare Tunnel** | Secure access to admin VPS (no open ports) |
| **Hetzner VPS** | Runs Directus instances + admin UI |
| **Docker** | Containerization for Directus + admin |
| **Kamal** | Deployment orchestration |

## Services

| Service | Role |
|---------|------|
| **Resend** | Transactional email (contact forms) |
| **Doppler** | Secrets management |
| **Betterstack** | Uptime monitoring |
| **Sentry** | Error tracking |
| **GitHub Actions** | CI/CD pipelines |

## Dev tools

| Tool | Role |
|------|------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Vitest** | Integration testing |
| **Playwright** | E2E browser testing |
| **Lighthouse CI** | Performance, accessibility, SEO auditing |
| **Wrangler** | Cloudflare Pages deployment CLI |

## TypeScript configuration

- \`strict: true\` everywhere
- \`noUncheckedIndexedAccess: true\`
- Path aliases for shared packages
`,
  },
  {
    id: 'design-system-layers',
    title: 'Design System Layers',
    description: 'How theming works: tokens, layouts, component variants, and overrides.',
    category: 'architecture',
    tags: ['design system', 'theming', 'tokens', 'variants', 'overrides', 'tailwind'],
    relatedArticles: ['theme-customization', 'component-variants-reference', 'component-overrides'],
    body: `
## Four layers of customization

The design system has four layers, from broadest to most specific:

### 1. Theme tokens (\`src/styles/global.css\`)

CSS custom properties defined in a Tailwind \`@theme\` block. Every site defines its own colours, fonts, and spacing here.

\`\`\`css
@theme {
  --color-primary-600: #2563eb;
  --font-heading: "Inter", system-ui, sans-serif;
}
\`\`\`

All shared components read from these tokens — change a token and the entire site updates.

### 2. Layout templates (\`packages/ui/src/layouts/\`)

Structural page wrappers that control the overall page shape:

| Layout | Description |
|--------|-------------|
| \`BaseLayout\` | Root HTML shell with \`<head>\`, analytics, skip-to-content |
| \`FullWidth\` | Nav + full-width main + Footer |
| \`SingleColumn\` | Nav + max-w-3xl centered main + Footer |
| \`WithSidebar\` | Nav + 2-column (main + sidebar) + Footer |
| \`BlogPost\` | Nav + article with title/date/author metadata + Footer |

### 3. Component variants

Components that need visual flexibility expose a \`variant\` prop. Variants control visual treatment, not structural markup.

\`\`\`astro
<Hero variant="split" heading="Welcome" />
<CardGrid variant="masonry" cards={[...]} />
\`\`\`

See the [Component Variants Reference](#article/component-variants-reference) for all available variants.

### 4. Component overrides (\`sites/<slug>/src/components/\`)

For fully bespoke designs, create a file in \`sites/<slug>/src/components/\` with the same name as a shared component. A Vite plugin automatically intercepts imports and uses your local version.

\`\`\`
sites/acme/src/components/Hero.astro  ← overrides @agency/ui Hero
\`\`\`

**Rules:**
- Must accept the same props interface (or a superset)
- Use Tailwind tokens so it respects site theming
- You maintain overrides yourself — they don't get shared component bug fixes
- Delete the file to revert to the shared version
`,
  },

  // =========================================================================
  // ADMIN UI
  // =========================================================================
  {
    id: 'dashboard-guide',
    title: 'Dashboard',
    description: 'How to use the admin dashboard: site listing, status badges, and actions.',
    category: 'admin-ui',
    tags: ['dashboard', 'sites', 'status', 'badges', 'overview'],
    relatedArticles: ['site-management-page', 'site-wizard-walkthrough'],
    body: `
## Overview

The dashboard is the home page of the admin UI. It shows:

1. **Stats cards** — Total Sites, CMS Sites, Static Sites, and Deployed count
2. **Site table** — All client sites (excluding the template) with key info

## Site table columns

| Column | Description |
|--------|-------------|
| **Name** | Site display name from \`site.config.ts\` |
| **Domain** | Primary domain extracted from site URL |
| **Tier** | \`static\` or \`cms\` (determined by \`infra/docker/<slug>\` existence) |
| **Status** | Deploy status badge: pending, building, deploying, live, or failed |
| **URL** | Link to staging URL (\`<slug>.infront.cy\`) |
| **Actions** | "Manage" link to the site detail page |

## Status badges

| Badge | Meaning |
|-------|---------|
| **Pending** (yellow) | Site created, build not started yet |
| **Building** (blue) | \`npm install\` + \`npm run build\` in progress |
| **Deploying** (blue) | Uploading to Cloudflare Pages |
| **Live** (green) | Successfully deployed and accessible |
| **Failed** (red) | Build or deploy error — check site detail for error message |

## Template site

The template site (\`sites/template\`) appears in the table marked as "Template". It serves as the base that gets copied when creating new sites. You generally don't need to manage it directly.
`,
  },
  {
    id: 'template-gallery-guide',
    title: 'Template Gallery',
    description: 'Browsing and selecting templates for new client sites.',
    category: 'admin-ui',
    tags: ['templates', 'gallery', 'browse', 'select', 'starter'],
    relatedArticles: ['site-wizard-walkthrough', 'template-definitions'],
    body: `
## Overview

The template gallery shows all available site templates. Each template is a predefined site structure with pages, components, and default configuration.

Navigate to **Templates** in the sidebar to browse them.

## Template cards

Each card displays:
- **Name** — Template display name
- **Category** — Colour-coded badge (business, hospitality, creative, technology, services)
- **Description** — What the template is designed for
- **Page count** — Number of predefined pages
- **Features** — Tags showing included features (e.g., "Contact Form", "Blog", "Gallery")
- **Use Template** button — Starts the site wizard with this template pre-selected

## Available templates

Templates are defined in \`packages/config/src/templates.ts\`. Current templates:

| Template | Category | Pages | Best for |
|----------|----------|-------|----------|
| Business Starter | Business | 4 | General business websites |
| Restaurant | Hospitality | 5 | Restaurants, cafes, food service |
| Portfolio | Creative | 4 | Photographers, designers, agencies |
| SaaS | Technology | 5 | Software products, startups |
| Professional | Services | 4 | Consultants, lawyers, accountants |

## Using a template

Click **Use Template** on any card. This takes you to the site wizard (\`/sites/new?template=<id>\`) with the template pre-selected at step 2.
`,
  },
  {
    id: 'site-wizard-walkthrough',
    title: 'Site Wizard Walkthrough',
    description: 'Detailed walkthrough of the 5-step site creation wizard.',
    category: 'admin-ui',
    tags: ['wizard', 'create', 'new site', 'steps', 'form'],
    relatedArticles: ['cli-site-creation', 'dashboard-guide', 'theme-customization'],
    body: `
## Overview

The site wizard at \`/sites/new\` guides you through creating a new client site in 5 steps. The site auto-deploys to Cloudflare Pages after creation.

## Wizard flow

\`\`\`mermaid
flowchart LR
    A[Step 1<br/>Details] --> B[Step 2<br/>Template]
    B --> C[Step 3<br/>Theme]
    C --> D[Step 4<br/>Config]
    D --> E[Step 5<br/>Create]
    E --> F((Live site))
    style F fill:#22c55e,color:#fff
\`\`\`

## Step 1: Site Details

| Field | Description | Validation |
|-------|-------------|------------|
| **Name** | Display name (e.g., "Acme Corp") | Required, min 1 char |
| **Tagline** | Short description | Required, min 1 char |
| **Slug** | URL-safe identifier (e.g., "acme-corp") | Lowercase, letters/numbers/hyphens, 2-63 chars |
| **Domain** | Production domain (e.g., "acme-corp.com") | Valid domain format, min 3 chars |
| **Tier** | Service tier | \`static\`, \`cms\`, or \`interactive\` |

The slug determines:
- Site folder name: \`sites/<slug>/\`
- Staging URL: \`https://<slug>.infront.cy\`
- Workspace name: \`@agency/<slug>\`

## Step 2: Template

Select a template from the gallery. If you arrived via the template gallery's "Use Template" button, it will be pre-selected.

Each template defines:
- Which pages to create (e.g., home, about, contact, services)
- Which components to include on each page
- Default theme settings

## Step 3: Theme

Customize the visual identity:

- **Colour scales** — Primary, secondary, accent, and neutral colour palettes (50–950 shades)
- **Fonts** — Heading and body fonts
- **Nav style** — \`sticky\`, \`fixed\`, or \`static\`
- **Footer style** — \`simple\`, \`multi-column\`, or \`minimal\`
- **Hero default** — \`centered\`, \`split\`, \`fullscreen\`, or \`minimal\`
- **Border style** — \`sharp\`, \`rounded\`, or \`pill\`

## Step 4: Configuration

Set up the site's identity and metadata:

- **Contact info** — Email, phone, address
- **SEO settings** — Default title, title template, meta description, OG image
- **Navigation** — Menu items and CTA button
- **Footer** — Column links, social links, legal links
- **Analytics** — Provider (Plausible/Fathom/Google) and site ID

## Step 5: Create

Review all settings and click **Create Site**. The system:

1. Generates the site from the template
2. Writes \`site.config.ts\` and \`global.css\` with your settings
3. Builds the site (\`npm install\` + \`npm run build\`)
4. Deploys to Cloudflare Pages via \`wrangler\`
5. Creates DNS CNAME record for \`<slug>.infront.cy\`
6. Site goes live at the staging URL

The entire process takes about 30 seconds. You can monitor progress on the site detail page.
`,
  },
  {
    id: 'site-management-page',
    title: 'Site Management',
    description: 'Managing a deployed site: redeploying, custom domains, and component overrides.',
    category: 'admin-ui',
    tags: ['manage', 'redeploy', 'custom domain', 'overrides', 'site detail'],
    relatedArticles: ['dashboard-guide', 'custom-domains', 'component-overrides'],
    body: `
## Overview

Each site has a management page at \`/sites/<slug>\`. Navigate there by clicking **Manage** on the dashboard table.

## Deploy status

The top of the page shows the current deploy status with a colour-coded badge:

- **Live** (green) — Site is deployed and accessible
- **Building** (blue) — Build in progress
- **Deploying** (blue) — Uploading to Cloudflare
- **Failed** (red) — Error occurred; error message displayed
- **Pending** (yellow) — Waiting to start

The page polls \`/api/sites/<slug>/deploy-status\` every 3 seconds during active deploys.

## URLs

| URL type | Format | Description |
|----------|--------|-------------|
| **Staging** | \`https://<slug>.infront.cy\` | Auto-assigned on creation |
| **Production** | Custom domain | Added via domain management |
| **Pages.dev** | \`<slug>-xxx.pages.dev\` | Direct Cloudflare Pages URL |

## Redeploy

Click the **Redeploy** button to rebuild and redeploy the site. This is useful after:
- Editing site files locally
- Updating shared packages
- Fixing a failed deploy

A redeploy is blocked if a build/deploy is already in progress (returns 409 Conflict).

## Custom domain management

**Adding a domain:**
1. Enter the domain in the input field (e.g., \`acme-corp.com\`)
2. Click **Add Domain**
3. The system registers the domain with Cloudflare Pages and provisions SSL

**Removing a domain:**
- Click **Remove** next to the domain to deregister it

**DNS setup:** You need to point the domain's DNS to Cloudflare. The system uses non-proxied CNAME records (proxied: false) to avoid Cloudflare error 1014.

## Component overrides

The bottom of the page lists any custom component overrides in \`sites/<slug>/src/components/\`. These files replace shared components from \`@agency/ui\` for this specific site.
`,
  },
  {
    id: 'deleting-a-site',
    title: 'Deleting a Site',
    description: 'Permanently removing a site and all its associated resources.',
    category: 'admin-ui',
    tags: ['delete', 'remove', 'cleanup', 'danger zone', 'permanent'],
    relatedArticles: ['site-management-page', 'auto-deploy-pipeline'],
    body: `
## Overview

Sites can be permanently deleted from the site management page (\`/sites/<slug>\`). Deletion removes **all** associated resources and **cannot be undone**.

## What gets deleted

| Resource | Location |
|----------|----------|
| Cloudflare Pages project | Cloudflare account |
| Staging DNS record | \`<slug>.infront.cy\` CNAME on Cloudflare |
| Staging custom domain | Pages project domain registration |
| Production custom domain | Pages project domain registration (if set) |
| Site source files | \`sites/<slug>/\` directory |
| CMS Docker infrastructure | \`infra/docker/<slug>/\` directory (if CMS tier) |

## How to delete

1. Navigate to the site management page at \`/sites/<slug>\`
2. Scroll to the **Danger Zone** section at the bottom
3. Type the site slug into the confirmation input
4. Click **Delete Site Permanently**

The deletion is synchronous — you will see either a success (redirect to dashboard) or an error message.

## Restrictions

- The **template** site cannot be deleted
- You cannot delete a site while a build or deploy is in progress
- If some Cloudflare resources fail to clean up, the site files are still deleted and any cleanup failures are returned as warnings

## API

\`DELETE /api/sites/<slug>/delete\`

Returns \`{ success: true }\` on success, optionally with a \`warnings\` array if any Cloudflare cleanup steps failed.
`,
  },

  // =========================================================================
  // SITE CREATION
  // =========================================================================
  {
    id: 'wizard-creation-flow',
    title: 'Wizard Creation Flow (Technical)',
    description: 'What happens behind the scenes when you create a site via the wizard.',
    category: 'site-creation',
    tags: ['wizard', 'generation', 'pipeline', 'behind the scenes', 'technical'],
    relatedArticles: ['site-wizard-walkthrough', 'auto-deploy-pipeline'],
    body: `
## Generation pipeline

When you click **Create Site** in the wizard, the following happens:

\`\`\`mermaid
sequenceDiagram
    participant UI as Site Wizard
    participant API as POST /api/sites/create
    participant Gen as Generator
    participant Build as Build Process
    participant CF as Cloudflare Pages
    participant DNS as Cloudflare DNS

    UI->>API: Submit site config
    API->>API: Validate with Zod
    API->>Gen: generateSite(payload)
    Gen->>Gen: Copy template → sites/<slug>
    Gen->>Gen: Generate pages from template
    Gen->>Gen: Write site.config.ts
    Gen->>Gen: Write global.css
    Gen->>Gen: Update astro.config.mjs
    Gen->>API: Return success
    API-->>UI: 201 Created (staging URL)
    API->>Build: Fire-and-forget deploy
    Build->>Build: npm install
    Build->>Build: npm run build
    Build->>CF: wrangler pages deploy
    CF-->>Build: Deploy ID
    Build->>DNS: Create CNAME record
    DNS-->>Build: Record ID
    Build->>CF: Add custom domain (staging)
    Note over UI: Polls deploy-status every 3s
\`\`\`

## Generation steps (detail)

1. **Validate slug** — lowercase, 2-63 chars, alphanumeric + hyphens
2. **Validate domain** — valid domain format
3. **Check uniqueness** — site directory must not exist
4. **Validate template** — template ID must exist in registry
5. **Copy template** — \`sites/template/\` → \`sites/<slug>/\` (excludes node_modules, dist)
6. **Delete hardcoded pages** — Removes index.astro, about.astro, contact.astro
7. **Generate pages** — Creates new pages from template definition sections
8. **Create overrides directory** — Empty \`src/components/\` for future overrides
9. **Update package.json** — Workspace name → \`@agency/<slug>\`
10. **Generate site.config.ts** — Full config with all provided settings
11. **Generate global.css** — Tailwind \`@theme\` block with colour/font tokens
12. **Update astro.config.mjs** — Site URL + component override plugin
13. **Update robots.txt** — Client domain
14. **Write CLAUDE.md** — Site-specific documentation
15. **Copy Docker template** (CMS/interactive tiers only) → \`infra/docker/<slug>/\`

## Error handling

If any step fails, the generator cleans up by removing the partially created site directory. The API returns a 400/500 error with details.

## Deploy metadata

After creation, a \`.deploy.json\` file is written to \`sites/<slug>/\` tracking:

\`\`\`json
{
  "projectName": "<slug>",
  "stagingUrl": "<slug>.infront.cy",
  "productionUrl": null,
  "pagesDevUrl": "<slug>-xxx.pages.dev",
  "lastDeployId": null,
  "lastDeployAt": null,
  "status": "pending",
  "error": null,
  "dnsRecordId": null,
  "buildLog": null
}
\`\`\`
`,
  },
  {
    id: 'cli-site-creation',
    title: 'CLI Site Creation',
    description: 'Creating a new site using the provisioning script instead of the admin UI.',
    category: 'site-creation',
    tags: ['cli', 'provisioning', 'script', 'new-site.sh', 'terminal'],
    relatedArticles: ['site-wizard-walkthrough', 'wizard-creation-flow'],
    body: `
## Usage

\`\`\`bash
./infra/provisioning/new-site.sh <client-slug> <tier> <domain>
\`\`\`

**Example:**
\`\`\`bash
./infra/provisioning/new-site.sh acme-corp cms acme-corp.com
\`\`\`

## Arguments

| Argument | Description | Validation |
|----------|-------------|------------|
| \`client-slug\` | URL-safe identifier | Lowercase alphanumeric + hyphens, min 2 chars |
| \`tier\` | Service tier | \`static\`, \`cms\`, or \`interactive\` |
| \`domain\` | Production domain | Valid domain format |

## What the script does

1. **Copies template** — \`sites/template\` → \`sites/<slug>\`
2. **Updates package.json** — Name → \`@agency/<slug>\`
3. **Generates site.config.ts** — Scaffold with placeholder values
4. **Generates tailwind.config.mjs** — Placeholder brand colours
5. **Writes CLAUDE.md** — Site-specific documentation
6. **Copies Docker template** (CMS/interactive only) → \`infra/docker/<slug>/\`
7. **Creates git branch** — \`onboard/<slug>\`

## Post-provisioning checklist

After running the script, you need to:

- [ ] Update brand colours in \`src/styles/global.css\`
- [ ] Update fonts in \`src/styles/global.css\`
- [ ] Fill in \`site.config.ts\` with real client data
- [ ] (CMS tiers) Fill in \`infra/docker/<slug>/.env\`
- [ ] (CMS tiers) Generate KEY and SECRET: \`openssl rand -hex 32\`
- [ ] (CMS tiers) Start CMS: \`cd infra/docker/<slug> && docker compose up -d\`
- [ ] Add DNS records for the domain
- [ ] Add client content and pages
- [ ] Test locally: \`npm run dev --workspace=sites/<slug>\`
- [ ] Deploy via admin UI or manually

## Differences from wizard

The CLI script creates a **scaffold** with placeholder values. The admin wizard creates a **fully configured, auto-deployed** site. Use the CLI when you need more control over the initial setup or are working offline.
`,
  },
  {
    id: 'site-config-reference',
    title: 'site.config.ts Reference',
    description: 'Complete reference for the site configuration file with all options.',
    category: 'site-creation',
    tags: ['site.config', 'configuration', 'settings', 'options', 'reference'],
    relatedArticles: ['theme-customization', 'nav-component', 'footer-component'],
    body: `
## Overview

Every site has a \`site.config.ts\` at its root. This is the single source of truth for site identity, contact info, SEO, navigation, footer, analytics, CMS settings, and theme behaviour.

## Full interface

\`\`\`typescript
interface SiteConfig {
  name: string;           // Display name ("Acme Corp")
  tagline: string;        // Short description
  url: string;            // Production URL ("https://acme-corp.com")
  locale: string;         // Locale ("en-GB", "en-US")
  contact: ContactConfig;
  seo: SEOConfig;
  nav: NavConfig;
  footer: FooterConfig;
  analytics?: AnalyticsConfig;
  cms?: CMSConfig;
  theme: ThemeConfig;
}
\`\`\`

## ContactConfig

\`\`\`typescript
interface ContactConfig {
  email: string;          // "hello@acme-corp.com"
  phone?: string;         // "+44 123 456 7890"
  address?: {
    street: string;
    city: string;
    postcode: string;
    country: string;
    region?: string;
  };
}
\`\`\`

## SEOConfig

\`\`\`typescript
interface SEOConfig {
  defaultTitle: string;        // Fallback page title
  titleTemplate: string;       // "%s | Acme Corp" (%s is replaced)
  defaultDescription: string;  // Fallback meta description
  defaultOgImage: string;      // Path to default OG image
  structuredData?: {
    type: string;              // e.g., "LocalBusiness"
    [key: string]: unknown;
  };
}
\`\`\`

## NavConfig

\`\`\`typescript
interface NavConfig {
  items: NavItem[];
  cta?: { label: string; href: string };
}

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];  // Dropdown items
}
\`\`\`

## FooterConfig

\`\`\`typescript
interface FooterConfig {
  columns: Array<{
    title: string;
    links: Array<{ label: string; href: string }>;
  }>;
  socials?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
  };
  legalLinks: Array<{ label: string; href: string }>;
  text?: string;  // Custom footer text
}
\`\`\`

## ThemeConfig

\`\`\`typescript
interface ThemeConfig {
  navStyle: 'sticky' | 'fixed' | 'static';
  footerStyle: 'simple' | 'multi-column' | 'minimal';
  heroDefault: 'centered' | 'split' | 'fullscreen' | 'minimal';
  borderStyle: 'sharp' | 'rounded' | 'pill';
}
\`\`\`

## AnalyticsConfig

\`\`\`typescript
interface AnalyticsConfig {
  provider: 'plausible' | 'fathom' | 'google';
  siteId: string;
}
\`\`\`

## CMSConfig

\`\`\`typescript
interface CMSConfig {
  url: string;      // Directus URL ("https://cms.acme-corp.com")
  token: string;    // Directus API token
}
\`\`\`

## Quick reference: common changes

| Want to change | Property |
|---------------|----------|
| Site name | \`name\` |
| Phone number | \`contact.phone\` |
| Nav links | \`nav.items\` |
| CTA button text | \`nav.cta.label\` |
| Footer style | \`theme.footerStyle\` |
| Analytics provider | \`analytics.provider\` |
| OG image | \`seo.defaultOgImage\` |
`,
  },
  {
    id: 'theme-customization',
    title: 'Theme Customization',
    description: 'How to customize colours, fonts, and visual styles via Tailwind tokens.',
    category: 'site-creation',
    tags: ['theme', 'colours', 'fonts', 'tokens', 'tailwind', 'global.css', 'branding'],
    relatedArticles: ['design-system-layers', 'site-config-reference'],
    body: `
## How theming works

Each site defines brand tokens in \`src/styles/global.css\` using Tailwind v4's \`@theme\` block. All shared components read from these tokens, so a single change updates the entire site.

## Colour scales

Four colour scales are available, each with shades 50–950:

| Scale | Purpose |
|-------|---------|
| \`primary\` | Main brand colour — CTAs, links, active states |
| \`secondary\` | Supporting colour — secondary buttons, accents |
| \`accent\` | Highlight colour — badges, notifications |
| \`neutral\` | Grey scale — text, borders, backgrounds |

### Example: Changing primary colour

\`\`\`css
@theme {
  --color-primary-50: #f0fdf4;
  --color-primary-100: #dcfce7;
  --color-primary-200: #bbf7d0;
  --color-primary-300: #86efac;
  --color-primary-400: #4ade80;
  --color-primary-500: #22c55e;
  --color-primary-600: #16a34a;
  --color-primary-700: #15803d;
  --color-primary-800: #166534;
  --color-primary-900: #14532d;
  --color-primary-950: #052e16;
}
\`\`\`

## Fonts

\`\`\`css
@theme {
  --font-heading: "Playfair Display", serif;
  --font-body: "Inter", system-ui, sans-serif;
}
\`\`\`

Make sure to include the font (e.g., via Google Fonts link in BaseLayout or a local font file).

## Full global.css structure

\`\`\`css
@import "tailwindcss";

/* Include shared component paths for Tailwind scanning */
@source "../../packages/ui/src/components";
@source "../../packages/ui/src/layouts";
@source "../../packages/ui/src/islands";
@source "./components";

@theme {
  /* Colour scales (50-950 for each) */
  --color-primary-*: ...;
  --color-secondary-*: ...;
  --color-accent-*: ...;
  --color-neutral-*: ...;

  /* Fonts */
  --font-heading: "...";
  --font-body: "...";
}

/* Base styles */
body {
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
\`\`\`

## Theme config in site.config.ts

Visual behaviour settings that don't map to CSS tokens:

\`\`\`typescript
theme: {
  navStyle: 'sticky',      // How the nav behaves on scroll
  footerStyle: 'minimal',  // Footer layout complexity
  heroDefault: 'split',    // Default hero variant for new pages
  borderStyle: 'rounded',  // Button/card corner treatment
}
\`\`\`
`,
  },
  {
    id: 'component-variants-reference',
    title: 'Component Variants Reference',
    description: 'Quick reference table of all component variants.',
    category: 'site-creation',
    tags: ['variants', 'components', 'quick reference', 'table'],
    relatedArticles: ['design-system-layers', 'hero-component', 'card-grid-component'],
    body: `
## All variants at a glance

| Component | Variants |
|-----------|----------|
| **Hero** | \`centered\`, \`split\`, \`fullscreen\`, \`minimal\`, \`video\` |
| **CTA** | \`default\`, \`split\`, \`minimal\` |
| **CardGrid** | \`two-column\`, \`three-column\`, \`four-column\`, \`masonry\`, \`list\` |
| **Testimonials** | \`default\`, \`carousel\`, \`featured\` |
| **TeamGrid** | \`default\`, \`compact\`, \`detailed\` |
| **FAQ** | \`default\`, \`two-column\` |
| **Features** | \`grid\`, \`alternating\`, \`icon-list\` |
| **Gallery** | \`grid\`, \`masonry\` |
| **Timeline** | \`vertical\`, \`alternating\` |
| **StatsCounter** | \`inline\`, \`grid\` |
| **LogoCloud** | \`grid\`, \`scrolling\` |
| **PricingTable** | \`two-column\`, \`three-column\` |
| **Section** | background: \`light\`, \`dark\`, \`primary\` |

## Theme-controlled variants

These are set in \`site.config.ts\` \`theme\` object, not as component props:

| Setting | Options | Controls |
|---------|---------|----------|
| \`navStyle\` | \`sticky\`, \`fixed\`, \`static\` | Nav scroll behaviour |
| \`footerStyle\` | \`simple\`, \`multi-column\`, \`minimal\` | Footer layout |
| \`heroDefault\` | \`centered\`, \`split\`, \`fullscreen\`, \`minimal\` | Default hero variant |
| \`borderStyle\` | \`sharp\`, \`rounded\`, \`pill\` | Button/card corners |

## How to change a variant

Edit the \`variant\` prop in the page file:

\`\`\`astro
<!-- Before -->
<Hero variant="centered" heading="Welcome" />

<!-- After -->
<Hero variant="split" heading="Welcome" />
\`\`\`
`,
  },
  {
    id: 'component-overrides',
    title: 'Component Overrides',
    description: 'How to override shared components with site-specific implementations.',
    category: 'site-creation',
    tags: ['overrides', 'custom', 'bespoke', 'vite plugin', 'per-site'],
    relatedArticles: ['design-system-layers', 'site-management-page'],
    body: `
## What are overrides?

When a shared component doesn't meet a client's needs, you can create a site-specific version that automatically replaces it. A Vite plugin (\`componentOverridePlugin\`) intercepts \`@agency/ui/components/*\` imports and checks for a local file first.

## How to create an override

Create a file in \`sites/<slug>/src/components/\` with the **same name** as the shared component:

\`\`\`
sites/acme/src/components/Hero.astro    ← overrides @agency/ui/components/Hero.astro
sites/acme/src/components/Footer.astro  ← overrides @agency/ui/components/Footer.astro
\`\`\`

No import changes needed in page files — the override is automatic.

## Rules

1. **Same props interface** — The override must accept the same props as the shared component (or a superset)
2. **Use Tailwind tokens** — Use \`primary-600\`, \`font-heading\`, etc. so it respects the site's theming
3. **You maintain it** — Overrides don't get shared component bug fixes or updates
4. **Visible in admin** — The site management page (\`/sites/<slug>\`) lists all overrides

## How to remove an override

Delete the file from \`sites/<slug>/src/components/\`. The site reverts to the shared version immediately.

## Technical details

The \`componentOverridePlugin\` (from \`@agency/utils\`) is a Vite plugin configured in each site's \`astro.config.mjs\`. It:

1. Intercepts module resolution for \`@agency/ui/components/*\`
2. Checks if \`sites/<slug>/src/components/<ComponentName>.astro\` exists
3. If yes, resolves to the local file instead of the shared package
4. If no, resolves normally to \`packages/ui/src/components/\`
`,
  },

  // =========================================================================
  // SHARED PACKAGES
  // =========================================================================
  {
    id: 'agency-config-package',
    title: '@agency/config Package',
    description: 'Shared TypeScript types, template registry, and configuration schemas.',
    category: 'shared-packages',
    tags: ['config', 'types', 'templates', 'registry', 'typescript'],
    relatedArticles: ['site-config-reference', 'template-definitions'],
    body: `
## Overview

\`packages/config\` is the central type definition package. It exports TypeScript interfaces used across all sites and the admin UI.

## Key exports

### Type interfaces

| Type | Purpose |
|------|---------|
| \`SiteConfig\` | Root site configuration |
| \`ContactConfig\` | Email, phone, address |
| \`SEOConfig\` | Title, description, OG image, structured data |
| \`NavConfig\` | Navigation items and CTA |
| \`FooterConfig\` | Columns, socials, legal links |
| \`AnalyticsConfig\` | Provider and site ID |
| \`CMSConfig\` | Directus URL and token |
| \`ThemeConfig\` | Nav style, footer style, hero default, border style |

### Template system types

| Type | Purpose |
|------|---------|
| \`TemplateDefinition\` | Full template with pages, theme, defaults |
| \`TemplatePageDefinition\` | Single page within a template |
| \`TemplateSectionDefinition\` | Component instance within a page |
| \`TemplateThemeTokens\` | Colour scales and font definitions |

### Template registry

| Function | Purpose |
|----------|---------|
| \`listTemplates()\` | Returns all registered templates |
| \`getTemplate(id)\` | Returns a specific template by ID |

## Usage

\`\`\`typescript
import type { SiteConfig, ThemeConfig } from '@agency/config';
import { listTemplates, getTemplate } from '@agency/config';
\`\`\`
`,
  },
  {
    id: 'agency-utils-package',
    title: '@agency/utils Package',
    description: 'Shared utilities for SEO, images, Directus, dates, validation, and component overrides.',
    category: 'shared-packages',
    tags: ['utils', 'utilities', 'seo', 'directus', 'image', 'validation'],
    relatedArticles: ['agency-config-package', 'agency-ui-package'],
    body: `
## Overview

\`packages/utils\` provides utility functions used across all sites. It covers SEO, image handling, CMS integration, date formatting, form validation, and the component override system.

## SEO utilities

\`\`\`typescript
// Format page title with template
formatTitle("About Us", "%s | Acme Corp")
// → "About Us | Acme Corp"

// Generate meta tag objects
generateMeta({ title, description, ogImage, siteUrl, canonicalUrl })

// Generate JSON-LD structured data
generateStructuredData({ type: "LocalBusiness", name: "Acme", ... })
\`\`\`

## Image utilities

\`\`\`typescript
// Construct Directus image URL with transformations
getDirectusImageUrl(baseUrl, fileId, {
  width: 800,
  height: 600,
  fit: 'cover',       // 'cover' | 'contain' | 'inside' | 'outside'
  format: 'webp',     // 'webp' | 'jpg' | 'png' | 'avif'
  quality: 80,        // 1-100
})
// → "https://cms.example.com/assets/<fileId>?width=800&height=600&fit=cover&format=webp&quality=80"
\`\`\`

## Directus client

\`\`\`typescript
// Create a typed Directus REST client
const client = createDirectusClient(url, token);

// Fetch published items from a collection
const posts = await getPublishedItems(client, 'blog_posts', {
  fields: ['title', 'slug', 'content'],
  sort: ['-date_published'],
  limit: 10,
});

// Fetch a single item by slug
const post = await getItemBySlug(client, 'blog_posts', 'my-post');
\`\`\`

## Date formatting

\`\`\`typescript
formatDate("2026-03-21", "en-GB")
// → "21 March 2026"
\`\`\`

## Form validation

\`\`\`typescript
import { ContactSchema, type ContactFormData } from '@agency/utils';

// Validate contact form data
const result = ContactSchema.safeParse({
  name: "John",
  email: "john@example.com",
  message: "Hello there",
  honeypot: "",  // Must be empty (spam protection)
});
\`\`\`

## Component override plugin

\`\`\`typescript
import { componentOverridePlugin } from '@agency/utils';

// In astro.config.mjs
export default defineConfig({
  vite: {
    plugins: [componentOverridePlugin('sites/acme-corp')],
  },
});
\`\`\`
`,
  },
  {
    id: 'agency-ui-package',
    title: '@agency/ui Package',
    description: 'All shared Astro components, layouts, and React islands.',
    category: 'shared-packages',
    tags: ['ui', 'components', 'layouts', 'islands', 'shared'],
    relatedArticles: ['agency-config-package', 'agency-utils-package', 'hero-component'],
    body: `
## Overview

\`packages/ui\` contains all shared visual components used across client sites. Components are Astro files; interactive ones are React islands.

## Components (\`packages/ui/src/components/\`)

| Component | Type | Variants |
|-----------|------|----------|
| **Hero** | Section | centered, split, fullscreen, minimal, video |
| **Section** | Wrapper | light, dark, primary (background) |
| **CardGrid** | Content | two-column, three-column, four-column, masonry, list |
| **CTA** | Section | default, split, minimal |
| **Features** | Content | grid, alternating, icon-list |
| **FAQ** | Content | default, two-column |
| **Testimonials** | Content | default, carousel, featured |
| **Gallery** | Content | grid, masonry |
| **Timeline** | Content | vertical, alternating |
| **StatsCounter** | Content | inline, grid |
| **LogoCloud** | Content | grid, scrolling |
| **PricingTable** | Content | two-column, three-column |
| **TeamGrid** | Content | default, compact, detailed |
| **ContactSection** | Section | — |
| **OpeningHours** | Content | — |
| **Map** | Embed | — |
| **Nav** | Navigation | via theme.navStyle |
| **Footer** | Navigation | via theme.footerStyle |
| **SEOHead** | Meta | — |

## Layouts (\`packages/ui/src/layouts/\`)

| Layout | Description |
|--------|-------------|
| **BaseLayout** | Root HTML shell — \`<head>\`, analytics, skip-to-content |
| **FullWidth** | Nav + full-width main + Footer |
| **SingleColumn** | Nav + max-w-3xl centered main + Footer |
| **WithSidebar** | Nav + 2-column (main + sidebar) + Footer |
| **BlogPost** | Nav + article with metadata + Footer |

## Islands (\`packages/ui/src/islands/\`)

| Island | Directive | Purpose |
|--------|-----------|---------|
| **ContactForm** | \`client:visible\` | Form with validation + honeypot |
| **MobileNav** | \`client:idle\` | Hamburger menu with slide-in panel |
| **CookieConsent** | \`client:idle\` | Cookie banner (Google Analytics only) |

## Conventions

- All components accept a \`class\` prop for additional Tailwind classes
- Use only Tailwind tokens — no hardcoded colours or fonts
- Text content comes from props or \`site.config.ts\`, never hardcoded
- Interactive components are React islands in \`packages/ui/src/islands/\`
- Use \`client:visible\` or \`client:idle\` over \`client:load\`
`,
  },

  // =========================================================================
  // COMPONENTS (one per component)
  // =========================================================================
  {
    id: 'hero-component',
    title: 'Hero',
    description: 'Full-width hero section with 5 variants: centered, split, fullscreen, minimal, video.',
    category: 'components',
    tags: ['hero', 'banner', 'header', 'landing', 'above the fold'],
    relatedArticles: ['section-component', 'cta-component'],
    body: `
## Props

\`\`\`typescript
interface Props {
  variant: 'centered' | 'split' | 'fullscreen' | 'minimal' | 'video';
  heading: string;
  subheading?: string;
  ctaText?: string;
  ctaHref?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  class?: string;
}
\`\`\`

## Variants

### \`centered\`
Heading and subheading centred. Optional CTA button. Image placeholder below text.

### \`split\`
Two-column grid — heading/subheading/CTA on left, image on right.

### \`fullscreen\`
Full viewport height (min-h-screen). Dark overlay on background image. White text.

### \`minimal\`
Simple heading and subheading with generous padding. No image area.

### \`video\`
Background video with min-h-[70vh]. Dark overlay. White text. Falls back to image if no video provided.

## Usage

\`\`\`astro
---
import Hero from '@agency/ui/components/Hero.astro';
---

<Hero
  variant="split"
  heading="Welcome to Acme Corp"
  subheading="We build amazing things"
  ctaText="Get Started"
  ctaHref="/contact"
/>
\`\`\`

## Notes

- \`backgroundVideo\` is only used by the \`video\` variant
- \`backgroundImage\` is used by \`fullscreen\` and \`video\` (as fallback)
- The CTA renders as an \`<a>\` tag when both \`ctaText\` and \`ctaHref\` are provided
- All text uses Tailwind theme tokens for colours
`,
  },
  {
    id: 'section-component',
    title: 'Section',
    description: 'Generic section wrapper with optional heading, subheading, and background variants.',
    category: 'components',
    tags: ['section', 'wrapper', 'container', 'background'],
    relatedArticles: ['hero-component', 'features-component'],
    body: `
## Props

\`\`\`typescript
interface Props {
  heading?: string;
  subheading?: string;
  background?: 'light' | 'dark' | 'primary';
  class?: string;
  id?: string;
}
\`\`\`

## Background variants

| Variant | Style |
|---------|-------|
| \`light\` (default) | \`bg-neutral-50\` with dark text |
| \`dark\` | \`bg-neutral-900\` with white text |
| \`primary\` | \`bg-primary-50\` with dark text |

## Usage

\`\`\`astro
<Section heading="Our Services" subheading="What we offer" background="light">
  <Features variant="grid" features={[...]} />
</Section>

<Section heading="Why Choose Us" background="primary">
  <StatsCounter variant="grid" stats={[...]} />
</Section>
\`\`\`

## Notes

- Heading renders as \`<h2>\` centred with bottom margin
- Subheading renders as a paragraph below the heading
- Uses \`<slot />\` for child content
- \`id\` prop is useful for anchor links (\`#services\`)
`,
  },
  {
    id: 'card-grid-component',
    title: 'CardGrid',
    description: 'Responsive card grid with 5 layout variants for content cards.',
    category: 'components',
    tags: ['cards', 'grid', 'masonry', 'list', 'content'],
    relatedArticles: ['features-component', 'gallery-component'],
    body: `
## Props

\`\`\`typescript
interface CardItem {
  title: string;
  description: string;
  image?: string;
  href?: string;
}

interface Props {
  variant: 'two-column' | 'three-column' | 'four-column' | 'masonry' | 'list';
  cards: CardItem[];
  class?: string;
}
\`\`\`

## Variants

| Variant | Columns | Layout |
|---------|---------|--------|
| \`two-column\` | 1 → 2 | CSS Grid |
| \`three-column\` | 1 → 2 → 3 | CSS Grid |
| \`four-column\` | 1 → 2 → 4 | CSS Grid |
| \`masonry\` | 1 → 2 → 3 | CSS Columns |
| \`list\` | 1 | Vertical stack with side image |

## Usage

\`\`\`astro
<CardGrid
  variant="three-column"
  cards={[
    { title: "Web Design", description: "Beautiful websites.", image: "/design.jpg", href: "/services/design" },
    { title: "Development", description: "Fast, accessible.", image: "/dev.jpg", href: "/services/dev" },
    { title: "SEO", description: "Rank higher.", image: "/seo.jpg", href: "/services/seo" },
  ]}
/>
\`\`\`

## Notes

- Images have a hover scale effect (1.05 on hover)
- Cards with \`href\` wrap the entire card in an \`<a>\` tag
- Masonry uses CSS \`columns\` with \`break-inside: avoid\`
- List variant places image to the left on desktop
`,
  },
  {
    id: 'cta-component',
    title: 'CTA',
    description: 'Call-to-action section with 3 variants: default, split, and minimal.',
    category: 'components',
    tags: ['cta', 'call to action', 'button', 'conversion'],
    relatedArticles: ['hero-component', 'section-component'],
    body: `
## Props

\`\`\`typescript
interface Props {
  variant?: 'default' | 'split' | 'minimal';  // default: 'default'
  heading: string;
  description?: string;
  buttonText: string;
  buttonHref: string;
  image?: string;
  class?: string;
}
\`\`\`

## Variants

| Variant | Layout |
|---------|--------|
| \`default\` | Centred text on primary-600 background, white button |
| \`split\` | Left text + right image, primary-600 background |
| \`minimal\` | Horizontal layout — left text, right button, light background |

## Usage

\`\`\`astro
<CTA
  variant="split"
  heading="Ready to get started?"
  description="Contact us today."
  buttonText="Get in Touch"
  buttonHref="/contact"
  image="/cta-image.jpg"
/>
\`\`\`
`,
  },
  {
    id: 'features-component',
    title: 'Features',
    description: 'Feature showcase with grid, alternating, and icon-list layouts.',
    category: 'components',
    tags: ['features', 'showcase', 'benefits', 'icons', 'grid'],
    relatedArticles: ['card-grid-component', 'section-component'],
    body: `
## Props

\`\`\`typescript
interface FeatureItem {
  title: string;
  description: string;
  icon?: string;    // SVG path or icon identifier
  image?: string;   // Used by alternating variant
}

interface Props {
  variant?: 'grid' | 'alternating' | 'icon-list';  // default: 'grid'
  features: FeatureItem[];
  class?: string;
}
\`\`\`

## Variants

| Variant | Layout |
|---------|--------|
| \`grid\` | 3-column grid with icon, title, description |
| \`alternating\` | Full-width blocks alternating text left/right with image |
| \`icon-list\` | Vertical list — icon left, title + description right |

## Usage

\`\`\`astro
<Features
  variant="grid"
  features={[
    { title: "Fast", description: "Lightning fast load times.", icon: "⚡" },
    { title: "Secure", description: "Enterprise-grade security.", icon: "🔒" },
    { title: "Scalable", description: "Grows with your business.", icon: "📈" },
  ]}
/>
\`\`\`
`,
  },
  {
    id: 'faq-component',
    title: 'FAQ',
    description: 'Collapsible FAQ accordion with default and two-column variants.',
    category: 'components',
    tags: ['faq', 'accordion', 'questions', 'answers', 'collapsible'],
    relatedArticles: ['section-component', 'features-component'],
    body: `
## Props

\`\`\`typescript
interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  variant?: 'default' | 'two-column';  // default: 'default'
  items: FAQItem[];
  class?: string;
}
\`\`\`

## Variants

| Variant | Layout |
|---------|--------|
| \`default\` | Single column accordion with dividers |
| \`two-column\` | 2-column grid on desktop |

## Usage

\`\`\`astro
<FAQ
  variant="default"
  items={[
    { question: "How long does a project take?", answer: "Typically 4-6 weeks." },
    { question: "Do you offer support?", answer: "Yes, ongoing support packages." },
  ]}
/>
\`\`\`

## Notes

- Uses native \`<details>\` / \`<summary>\` elements for accessibility
- Plus icon rotates to X when expanded (CSS transform)
- No JavaScript required — works with CSS only
`,
  },
  {
    id: 'testimonials-component',
    title: 'Testimonials',
    description: 'Client testimonials with default grid, carousel, and featured variants.',
    category: 'components',
    tags: ['testimonials', 'reviews', 'quotes', 'social proof'],
    relatedArticles: ['logo-cloud-component', 'section-component'],
    body: `
## Props

\`\`\`typescript
interface TestimonialItem {
  quote: string;
  author: string;
  role?: string;
  image?: string;
}

interface Props {
  variant?: 'default' | 'carousel' | 'featured';  // default: 'default'
  testimonials: TestimonialItem[];
  class?: string;
}
\`\`\`

## Variants

| Variant | Layout |
|---------|--------|
| \`default\` | 3-column grid of cards with quote icon |
| \`carousel\` | Horizontal snap-scroll container |
| \`featured\` | Single large testimonial (first item) centred |

## Usage

\`\`\`astro
<Testimonials
  variant="default"
  testimonials={[
    { quote: "Excellent work!", author: "Jane Smith", role: "CEO, TechCo", image: "/jane.jpg" },
    { quote: "Highly recommend.", author: "John Doe", role: "CTO, StartupInc" },
  ]}
/>
\`\`\`
`,
  },
  {
    id: 'gallery-component',
    title: 'Gallery',
    description: 'Image gallery with grid and masonry layout variants.',
    category: 'components',
    tags: ['gallery', 'images', 'photos', 'portfolio', 'masonry'],
    relatedArticles: ['card-grid-component', 'section-component'],
    body: `
## Props

\`\`\`typescript
interface GalleryItem {
  image: string;
  title?: string;
  description?: string;
  href?: string;
}

interface Props {
  variant?: 'grid' | 'masonry';  // default: 'grid'
  items: GalleryItem[];
  class?: string;
}
\`\`\`

## Variants

| Variant | Layout |
|---------|--------|
| \`grid\` | 3-column even grid |
| \`masonry\` | CSS columns with variable heights |

## Usage

\`\`\`astro
<Gallery
  variant="masonry"
  items={[
    { image: "/project1.jpg", title: "Project One", href: "/work/project-1" },
    { image: "/project2.jpg", title: "Project Two" },
  ]}
/>
\`\`\`

## Notes

- Images zoom slightly on hover (scale-105)
- Title/description overlay on hover if provided
- Linked items wrap in \`<a>\` tags
`,
  },
  {
    id: 'timeline-component',
    title: 'Timeline',
    description: 'Chronological timeline for milestones with vertical and alternating variants.',
    category: 'components',
    tags: ['timeline', 'milestones', 'history', 'roadmap', 'chronological'],
    relatedArticles: ['section-component', 'stats-counter-component'],
    body: `
## Props

\`\`\`typescript
interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

interface Props {
  variant?: 'vertical' | 'alternating';  // default: 'vertical'
  events: TimelineEvent[];
  class?: string;
}
\`\`\`

## Variants

| Variant | Layout |
|---------|--------|
| \`vertical\` | Left-aligned with vertical line and dots |
| \`alternating\` | Centred line, events alternate left and right |

## Usage

\`\`\`astro
<Timeline
  variant="alternating"
  events={[
    { year: "2020", title: "Founded", description: "Started from a garage." },
    { year: "2022", title: "100 Clients", description: "Reached our milestone." },
    { year: "2024", title: "Global Expansion", description: "Opened offices worldwide." },
  ]}
/>
\`\`\`
`,
  },
  {
    id: 'stats-counter-component',
    title: 'StatsCounter',
    description: 'Key metrics display with inline and grid variants.',
    category: 'components',
    tags: ['stats', 'counter', 'metrics', 'numbers', 'kpi'],
    relatedArticles: ['section-component', 'features-component'],
    body: `
## Props

\`\`\`typescript
interface StatItem {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
}

interface Props {
  variant?: 'inline' | 'grid';  // default: 'inline'
  stats: StatItem[];
  class?: string;
}
\`\`\`

## Variants

| Variant | Layout |
|---------|--------|
| \`inline\` | Centred flex-wrap, large bold text |
| \`grid\` | 2→4 column grid with bordered cards, primary-600 text |

## Usage

\`\`\`astro
<StatsCounter
  variant="grid"
  stats={[
    { value: "500", suffix: "+", label: "Projects Delivered" },
    { value: "99", suffix: "%", label: "Client Satisfaction" },
    { value: "10", suffix: "+", label: "Years Experience" },
    { value: "24", suffix: "/7", label: "Support" },
  ]}
/>
\`\`\`
`,
  },
  {
    id: 'logo-cloud-component',
    title: 'LogoCloud',
    description: 'Partner/client logo display with static grid and scrolling animation variants.',
    category: 'components',
    tags: ['logos', 'partners', 'clients', 'social proof', 'scrolling'],
    relatedArticles: ['testimonials-component', 'section-component'],
    body: `
## Props

\`\`\`typescript
interface LogoItem {
  name: string;
  image: string;
  href?: string;
}

interface Props {
  variant?: 'grid' | 'scrolling';  // default: 'grid'
  logos: LogoItem[];
  heading?: string;
  class?: string;
}
\`\`\`

## Variants

| Variant | Layout |
|---------|--------|
| \`grid\` | Flex-wrap grid, logos are greyscale, colour on hover |
| \`scrolling\` | Infinite horizontal scroll animation |

## Usage

\`\`\`astro
<LogoCloud
  variant="scrolling"
  heading="Trusted by"
  logos={[
    { name: "Acme", image: "/logos/acme.svg", href: "https://acme.com" },
    { name: "TechCo", image: "/logos/techco.svg" },
  ]}
/>
\`\`\`
`,
  },
  {
    id: 'pricing-table-component',
    title: 'PricingTable',
    description: 'Pricing tier comparison with two-column and three-column variants.',
    category: 'components',
    tags: ['pricing', 'plans', 'tiers', 'comparison', 'features'],
    relatedArticles: ['cta-component', 'section-component'],
    body: `
## Props

\`\`\`typescript
interface PricingPlan {
  name: string;
  price: string;
  period?: string;         // e.g., "/month"
  description?: string;
  features: string[];      // List of included features
  ctaText: string;
  ctaHref: string;
  highlighted?: boolean;   // Shows "Popular" badge + primary button
}

interface Props {
  variant?: 'two-column' | 'three-column';  // default: 'three-column'
  plans: PricingPlan[];
  class?: string;
}
\`\`\`

## Usage

\`\`\`astro
<PricingTable
  variant="three-column"
  plans={[
    {
      name: "Starter",
      price: "£499",
      period: "/month",
      features: ["5 Pages", "Basic SEO", "Email Support"],
      ctaText: "Get Started",
      ctaHref: "/contact",
    },
    {
      name: "Professional",
      price: "£999",
      period: "/month",
      highlighted: true,
      features: ["Unlimited Pages", "Advanced SEO", "Priority Support", "CMS"],
      ctaText: "Get Started",
      ctaHref: "/contact",
    },
  ]}
/>
\`\`\`

## Notes

- \`highlighted: true\` adds a "Popular" badge and uses primary-600 for the CTA button
- Non-highlighted plans use a neutral outline button
- Features render as a checklist with checkmark icons
`,
  },
  {
    id: 'team-grid-component',
    title: 'TeamGrid',
    description: 'Team member profiles with default, compact, and detailed variants.',
    category: 'components',
    tags: ['team', 'members', 'profiles', 'staff', 'people'],
    relatedArticles: ['section-component', 'card-grid-component'],
    body: `
## Props

\`\`\`typescript
interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  photo?: string;
  email?: string;
}

interface Props {
  variant?: 'default' | 'compact' | 'detailed';  // default: 'default'
  members: TeamMember[];
  class?: string;
}
\`\`\`

## Variants

| Variant | Layout |
|---------|--------|
| \`default\` | 3-column grid — photo, name, role, bio, email link |
| \`compact\` | 2→3→4 column grid — circular photos, name and role only |
| \`detailed\` | Full-width horizontal cards with larger photos |

## Usage

\`\`\`astro
<TeamGrid
  variant="default"
  members={[
    {
      name: "Jane Smith",
      role: "CEO",
      bio: "20 years of industry experience.",
      photo: "/team/jane.jpg",
      email: "jane@acme.com",
    },
  ]}
/>
\`\`\`
`,
  },
  {
    id: 'contact-section-component',
    title: 'ContactSection',
    description: 'Two-column contact section with form and contact info.',
    category: 'components',
    tags: ['contact', 'form', 'email', 'phone', 'address', 'map'],
    relatedArticles: ['contact-form-island', 'map-component'],
    body: `
## Props

\`\`\`typescript
interface Props {
  config: SiteConfig;  // Full site config (reads contact info from it)
  class?: string;
}
\`\`\`

## Layout

Two-column section:
- **Left:** ContactForm React island for message submission
- **Right:** Contact information (email, phone, address) + embedded Google Map

## Usage

\`\`\`astro
---
import ContactSection from '@agency/ui/components/ContactSection.astro';
import config from '../../site.config';
---

<ContactSection config={config} />
\`\`\`

## Notes

- Requires \`config.contact\` to be populated with at least an email
- Map renders if \`config.contact.address\` is provided
- ContactForm posts to \`/api/contact\` by default
`,
  },
  {
    id: 'opening-hours-component',
    title: 'OpeningHours',
    description: 'Business hours display component.',
    category: 'components',
    tags: ['hours', 'opening', 'business hours', 'schedule'],
    relatedArticles: ['contact-section-component', 'map-component'],
    body: `
## Props

\`\`\`typescript
interface HoursEntry {
  day: string;
  hours: string;
}

interface Props {
  hours: HoursEntry[];
  class?: string;
}
\`\`\`

## Usage

\`\`\`astro
<OpeningHours
  hours={[
    { day: "Monday - Friday", hours: "9:00 AM - 5:00 PM" },
    { day: "Saturday", hours: "10:00 AM - 2:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ]}
/>
\`\`\`

## Notes

- Renders as a bordered card with "Opening Hours" heading
- Uses a definition list (\`<dl>\`) for semantic markup
`,
  },
  {
    id: 'map-component',
    title: 'Map',
    description: 'Embedded Google Maps component using an address string.',
    category: 'components',
    tags: ['map', 'google maps', 'location', 'embed', 'address'],
    relatedArticles: ['contact-section-component', 'opening-hours-component'],
    body: `
## Props

\`\`\`typescript
interface Props {
  address: string;
  class?: string;
}
\`\`\`

## Usage

\`\`\`astro
<Map address="1 Main Street, London, UK" />
\`\`\`

## Notes

- Embeds a Google Maps iframe
- Address is URL-encoded and passed to the embed URL
- Default height is 450px
- Requires Google Maps API key in the embed URL template
`,
  },
  {
    id: 'nav-component',
    title: 'Nav',
    description: 'Navigation header with desktop links, CTA button, and mobile menu.',
    category: 'components',
    tags: ['nav', 'navigation', 'header', 'menu', 'mobile'],
    relatedArticles: ['mobile-nav-island', 'footer-component'],
    body: `
## Props

\`\`\`typescript
interface Props {
  config: SiteConfig;  // Reads nav items, CTA, theme from config
  class?: string;
}
\`\`\`

## Features

- **Site name** as logo (links to /)
- **Desktop nav links** (hidden on mobile)
- **CTA button** from \`config.nav.cta\`
- **MobileNav island** (hamburger menu on mobile)

## Behaviour controlled by theme

| Setting | Effect |
|---------|--------|
| \`theme.navStyle: 'sticky'\` | Sticks to top on scroll |
| \`theme.navStyle: 'fixed'\` | Always at top, content scrolls behind |
| \`theme.navStyle: 'static'\` | Scrolls with page |
| \`theme.borderStyle: 'pill'\` | Pill-shaped CTA button |
| \`theme.borderStyle: 'rounded'\` | Rounded CTA button |
| \`theme.borderStyle: 'sharp'\` | Square CTA button |

## Usage

\`\`\`astro
<Nav config={config} />
\`\`\`

Typically included in layouts, not used directly in page files.
`,
  },
  {
    id: 'footer-component',
    title: 'Footer',
    description: 'Site footer with multi-column, simple, and minimal variants.',
    category: 'components',
    tags: ['footer', 'links', 'social', 'copyright', 'legal'],
    relatedArticles: ['nav-component', 'site-config-reference'],
    body: `
## Props

\`\`\`typescript
interface Props {
  config: SiteConfig;  // Reads footer config, socials, theme from config
  class?: string;
}
\`\`\`

## Variants (via \`theme.footerStyle\`)

| Style | Layout |
|-------|--------|
| \`multi-column\` | 4-column grid of links + social icons + legal + copyright |
| \`simple\` | Single row — copyright left, legal links + socials right |
| \`minimal\` | Centred — copyright + legal links stacked |

## Social icons

Supported platforms (inline SVG icons):
- LinkedIn, Twitter/X, Facebook, Instagram, YouTube, GitHub

## Usage

\`\`\`astro
<Footer config={config} />
\`\`\`

Typically included in layouts, not used directly in page files. Set the style in \`site.config.ts\`:

\`\`\`typescript
theme: {
  footerStyle: 'multi-column',
}
\`\`\`
`,
  },
  {
    id: 'seohead-component',
    title: 'SEOHead',
    description: 'Meta tags component for SEO, Open Graph, canonical URL, and structured data.',
    category: 'components',
    tags: ['seo', 'meta', 'open graph', 'canonical', 'structured data', 'json-ld'],
    relatedArticles: ['site-config-reference', 'agency-utils-package'],
    body: `
## Props

\`\`\`typescript
interface Props {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonicalUrl?: string;
  structuredData?: Record<string, unknown>;
  noIndex?: boolean;
  siteUrl: string;
}
\`\`\`

## What it generates

- \`<meta charset>\` and \`<meta viewport>\`
- \`<title>\` tag
- \`<meta name="description">\`
- Open Graph tags (og:title, og:description, og:image, og:type, og:url)
- \`<link rel="canonical">\`
- \`<meta name="robots" content="noindex">\` (when noIndex=true)
- JSON-LD \`<script>\` for structured data

## Usage

Typically used inside BaseLayout, not directly. If you need to customise SEO for a specific page:

\`\`\`astro
<BaseLayout
  title="About Us"
  description="Learn about our team."
  ogImage="/og-about.jpg"
  structuredData={{ type: "Organization", name: "Acme Corp" }}
  config={config}
>
  ...
</BaseLayout>
\`\`\`
`,
  },
  {
    id: 'contact-form-island',
    title: 'ContactForm (Island)',
    description: 'React contact form with validation, honeypot spam protection, and server submission.',
    category: 'components',
    tags: ['contact form', 'react', 'island', 'validation', 'honeypot', 'email'],
    relatedArticles: ['contact-section-component', 'api-contact'],
    body: `
## Props

\`\`\`typescript
interface Props {
  action?: string;         // default: '/api/contact'
  successMessage?: string; // default: 'Thank you! Your message has been sent successfully.'
}
\`\`\`

## Features

- **3 fields:** Name, Email, Message
- **Honeypot field:** Hidden field for spam protection (bots fill it, humans don't)
- **Client-side validation:** Required fields, email format
- **Server submission:** POST to \`action\` URL with JSON body
- **Error display:** Per-field error messages with \`aria-describedby\`
- **Success state:** Shows success message after submission
- **Loading state:** Button disabled with spinner during submission

## Form data schema

\`\`\`typescript
// Validated by ContactSchema from @agency/utils (Zod)
{
  name: string;      // min 1 char
  email: string;     // valid email format
  message: string;   // min 10 chars, max 5000 chars
  honeypot: string;  // must be empty
}
\`\`\`

## Usage

\`\`\`astro
---
import ContactForm from '@agency/ui/islands/ContactForm';
---

<ContactForm client:visible />

<!-- Or with custom action -->
<ContactForm client:visible action="/api/enquiry" successMessage="We'll be in touch!" />
\`\`\`
`,
  },
  {
    id: 'mobile-nav-island',
    title: 'MobileNav (Island)',
    description: 'React mobile navigation with slide-in panel, focus trap, and accessibility.',
    category: 'components',
    tags: ['mobile', 'navigation', 'hamburger', 'menu', 'react', 'accessible'],
    relatedArticles: ['nav-component'],
    body: `
## Props

\`\`\`typescript
interface Props {
  items: Array<{ label: string; href: string }>;
  cta?: { label: string; href: string };
}
\`\`\`

## Features

- Hamburger button (hidden on md+)
- Slide-in panel from the right
- Backdrop overlay
- Focus trap (Tab stays within panel)
- Escape key closes
- Body scroll lock when open
- \`aria-expanded\`, \`aria-controls\`, \`aria-modal\` for screen readers

## Usage

Used internally by the Nav component — you don't need to use it directly.

\`\`\`astro
<!-- This is how Nav uses it internally -->
<MobileNav client:idle items={config.nav.items} cta={config.nav.cta} />
\`\`\`
`,
  },
  {
    id: 'cookie-consent-island',
    title: 'CookieConsent (Island)',
    description: 'Cookie consent banner for Google Analytics with accept/decline.',
    category: 'components',
    tags: ['cookie', 'consent', 'gdpr', 'privacy', 'analytics', 'google'],
    relatedArticles: ['seohead-component', 'site-config-reference'],
    body: `
## Props

\`\`\`typescript
interface Props {
  analyticsProvider?: 'plausible' | 'fathom' | 'google';
  siteId?: string;
}
\`\`\`

## Behaviour

- **Only renders for Google Analytics** — Plausible and Fathom are privacy-respecting and don't need consent
- **Only shows if consent is undecided** — checks \`localStorage\` for previous decision
- **Accept:** Stores consent, loads Google Analytics script
- **Decline:** Stores decline, no analytics loaded
- **Sticky bottom banner** with Accept/Decline buttons

## Usage

Used internally by BaseLayout — you don't need to use it directly.

\`\`\`astro
<!-- BaseLayout includes it when analytics.provider is 'google' -->
<CookieConsent client:idle analyticsProvider="google" siteId="G-XXXXXXX" />
\`\`\`
`,
  },

  // =========================================================================
  // DEPLOYMENT
  // =========================================================================
  {
    id: 'auto-deploy-pipeline',
    title: 'Auto-Deploy Pipeline',
    description: 'How sites are automatically built and deployed to Cloudflare Pages.',
    category: 'deployment',
    tags: ['deploy', 'pipeline', 'auto', 'cloudflare', 'wrangler', 'build'],
    relatedArticles: ['wizard-creation-flow', 'cloudflare-pages', 'redeployment'],
    body: `
## Pipeline overview

\`\`\`mermaid
sequenceDiagram
    participant Admin as Admin UI
    participant API as API Route
    participant Build as Build Process
    participant CF as Cloudflare Pages
    participant DNS as Cloudflare DNS

    Admin->>API: Create / Redeploy
    API->>API: Write .deploy.json (pending)
    API-->>Admin: 200 OK (fire-and-forget)
    API->>Build: npm install + npm run build
    Note over Build: Status: building
    Build->>CF: wrangler pages deploy
    Note over CF: Status: deploying
    CF-->>Build: Deploy complete
    Build->>DNS: CNAME → pages.dev subdomain
    Note over DNS: Status: live
    Admin->>API: Poll /deploy-status every 3s
    API-->>Admin: Current status + URLs
\`\`\`

## Build step

1. \`npm install\` at monorepo root (registers workspace, 60s timeout)
2. \`npm run build --workspace=sites/<slug>\` (Astro build, 120s timeout)
3. Output goes to \`sites/<slug>/dist/\`

Uses \`execFile\` (not \`exec\`) for security — slug is passed as an argument, not interpolated into a shell command.

## Deploy step

1. Checks for \`dist/client\` (Astro SSR output) or \`dist/\` (static output)
2. Runs: \`npx wrangler pages deploy <distDir> --project-name <slug>\`
3. Uses \`CLOUDFLARE_API_TOKEN\` and \`CLOUDFLARE_ACCOUNT_ID\` env vars
4. 120-second timeout

## DNS step

Creates a CNAME record pointing \`<slug>.infront.cy\` to the Pages subdomain.

**Important:** Uses \`proxied: false\` to avoid Cloudflare error 1014 ("CNAME Cross-User Banned"). This means the DNS record is not proxied through Cloudflare's CDN — Pages handles SSL/CDN directly.

## Deploy metadata (.deploy.json)

Stored at \`sites/<slug>/.deploy.json\`:

\`\`\`json
{
  "projectName": "acme-corp",
  "stagingUrl": "acme-corp.infront.cy",
  "productionUrl": null,
  "pagesDevUrl": "acme-corp-abc.pages.dev",
  "lastDeployId": "deploy-123",
  "lastDeployAt": "2026-03-21T10:00:00Z",
  "status": "live",
  "error": null,
  "dnsRecordId": "rec-456",
  "buildLog": null
}
\`\`\`

## Error handling

If any step fails:
- Status is set to \`failed\` in .deploy.json
- Error message is stored
- The UI shows the error on the site management page
- You can retry with the "Redeploy" button
`,
  },
  {
    id: 'cloudflare-pages',
    title: 'Cloudflare Pages',
    description: 'How sites are hosted on Cloudflare Pages: projects, deployments, and URLs.',
    category: 'deployment',
    tags: ['cloudflare', 'pages', 'hosting', 'cdn', 'static'],
    relatedArticles: ['auto-deploy-pipeline', 'custom-domains'],
    body: `
## How it works

Each site gets its own Cloudflare Pages project. The project name matches the site slug.

## URLs

| URL type | Format | Example |
|----------|--------|---------|
| Pages.dev | \`<slug>-<hash>.pages.dev\` | \`acme-corp-abc.pages.dev\` |
| Staging | \`<slug>.infront.cy\` | \`acme-corp.infront.cy\` |
| Production | Custom domain | \`acme-corp.com\` |

## Project creation

When a site is created, the system calls the Cloudflare API to create a Pages project:

\`\`\`
POST /accounts/<accountId>/pages/projects
{ "name": "<slug>", "production_branch": "main" }
\`\`\`

## Deployment

Deployments use \`wrangler pages deploy\`:

\`\`\`bash
npx wrangler pages deploy sites/<slug>/dist --project-name <slug>
\`\`\`

This uploads the built static assets to Cloudflare's CDN. No build happens on Cloudflare — we build locally and upload the output.

## Environment variables required

| Variable | Purpose |
|----------|---------|
| \`CLOUDFLARE_API_TOKEN\` | API authentication |
| \`CLOUDFLARE_ACCOUNT_ID\` | Account identifier |
| \`CLOUDFLARE_ZONE_ID\` | DNS zone for infront.cy domain |
`,
  },
  {
    id: 'staging-production-domains',
    title: 'Staging vs Production Domains',
    description: 'How staging and production URLs work for deployed sites.',
    category: 'deployment',
    tags: ['staging', 'production', 'domains', 'urls', 'dns'],
    relatedArticles: ['custom-domains', 'cloudflare-pages'],
    body: `
## Staging (automatic)

Every site gets a staging URL automatically on creation:

**Format:** \`https://<slug>.infront.cy\`

This is set up by:
1. Creating a CNAME DNS record: \`<slug>.infront.cy\` → \`<slug>.pages.dev\`
2. Registering the domain with Cloudflare Pages for SSL

The staging URL is permanent and always points to the latest deployment.

## Production (manual)

Production domains are added manually via the site management page:

1. Navigate to \`/sites/<slug>\`
2. Enter the custom domain (e.g., \`acme-corp.com\`)
3. Click **Add Domain**

The system:
1. Registers the domain with the Cloudflare Pages project
2. Updates \`.deploy.json\` with the production URL

**You need to configure DNS** at the domain registrar to point to Cloudflare. Typically a CNAME record pointing to the Pages subdomain.

## DNS configuration

| Record type | Name | Target |
|-------------|------|--------|
| CNAME | \`<slug>\` | \`<slug>.pages.dev\` |

The system uses \`proxied: false\` for CNAME records to avoid error 1014.
`,
  },
  {
    id: 'custom-domains',
    title: 'Custom Domains',
    description: 'How to add and remove custom production domains for deployed sites.',
    category: 'deployment',
    tags: ['custom domain', 'production', 'dns', 'ssl', 'domain management'],
    relatedArticles: ['staging-production-domains', 'site-management-page'],
    body: `
## Adding a custom domain

### Via admin UI

1. Go to \`/sites/<slug>\`
2. Enter domain in the input field
3. Click **Add Domain**

### Via API

\`\`\`bash
curl -X POST /api/sites/<slug>/custom-domain \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "acme-corp.com"}'
\`\`\`

### What happens

1. Domain is registered with the Cloudflare Pages project (provisions SSL)
2. \`.deploy.json\` is updated with the production URL

### DNS setup required

At your domain registrar, add a CNAME record:

| Type | Name | Value |
|------|------|-------|
| CNAME | \`@\` or \`www\` | \`<slug>.pages.dev\` |

SSL is provisioned automatically by Cloudflare Pages.

## Removing a custom domain

### Via admin UI

Click **Remove** next to the domain on the site management page.

### Via API

\`\`\`bash
curl -X DELETE /api/sites/<slug>/custom-domain \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "acme-corp.com"}'
\`\`\`

This deregisters the domain from Cloudflare Pages and sets \`productionUrl\` to null.
`,
  },
  {
    id: 'redeployment',
    title: 'Redeployment',
    description: 'How to redeploy a site after making changes.',
    category: 'deployment',
    tags: ['redeploy', 'rebuild', 'update', 'changes'],
    relatedArticles: ['auto-deploy-pipeline', 'site-management-page'],
    body: `
## When to redeploy

Redeploy after:
- Editing site files (pages, components, config, styles)
- Updating shared packages that the site depends on
- Fixing a previously failed deployment

## Via admin UI

1. Go to \`/sites/<slug>\`
2. Click the **Redeploy** button
3. Monitor the status badge (building → deploying → live)

## Via API

\`\`\`bash
curl -X POST /api/sites/<slug>/redeploy
\`\`\`

Returns 409 if a deploy is already in progress.

## Via CLI

\`\`\`bash
npm run build --workspace=sites/<slug>
npx wrangler pages deploy sites/<slug>/dist --project-name <slug>
\`\`\`

## What happens during redeploy

1. Status set to \`building\`
2. \`npm install\` at monorepo root
3. \`npm run build --workspace=sites/<slug>\`
4. Status set to \`deploying\`
5. \`wrangler pages deploy\` uploads new assets
6. Status set to \`live\`

The redeploy skips project creation and DNS setup (already done on first deploy).
`,
  },

  // =========================================================================
  // INFRASTRUCTURE
  // =========================================================================
  {
    id: 'infrastructure-overview',
    title: 'Infrastructure Overview',
    description: 'Architecture diagram showing how all infrastructure components connect.',
    category: 'infrastructure',
    tags: ['infrastructure', 'architecture', 'topology', 'overview'],
    relatedArticles: ['hetzner-vps-setup', 'directus-docker', 'cloudflare-pages'],
    body: `
## Infrastructure topology

\`\`\`mermaid
graph TB
    subgraph Internet
        User[Browser]
        GH[GitHub Actions]
    end

    subgraph Cloudflare
        CF_DNS[Cloudflare DNS]
        CF_Pages[Cloudflare Pages CDN]
        CF_Tunnel[Cloudflare Tunnel]
    end

    subgraph Hetzner VPS
        Admin[Admin UI<br/>Docker + Node.js]
        D1[Directus Client A<br/>Docker + PostgreSQL]
        D2[Directus Client B<br/>Docker + PostgreSQL]
    end

    subgraph AWS S3
        Backups[Backup Storage]
    end

    User --> CF_DNS
    CF_DNS -->|sites| CF_Pages
    CF_DNS -->|web.infront.cy| CF_Tunnel
    CF_Tunnel --> Admin
    CF_DNS -->|cms.client.com| D1
    CF_DNS -->|cms.client2.com| D2
    GH -->|deploy| CF_Pages
    Admin -->|wrangler deploy| CF_Pages
    D1 --> Backups
    D2 --> Backups

    style CF_Pages fill:#f59e0b,color:#fff
    style CF_Tunnel fill:#f59e0b,color:#fff
    style Admin fill:#3b82f6,color:#fff
    style D1 fill:#8b5cf6,color:#fff
    style D2 fill:#8b5cf6,color:#fff
\`\`\`

## Component summary

| Component | Location | Purpose |
|-----------|----------|---------|
| **Client sites** | Cloudflare Pages | Static site hosting + CDN |
| **Admin UI** | Hetzner VPS (Docker) | Site management dashboard |
| **Directus instances** | Hetzner VPS (Docker) | Headless CMS per client |
| **Cloudflare Tunnel** | Hetzner VPS → Cloudflare | Secure admin access (no open ports) |
| **PostgreSQL** | Hetzner VPS (Docker) | Database for each Directus instance |
| **S3 backups** | AWS S3 | Database and upload backups |
| **GitHub Actions** | GitHub | CI/CD pipelines |
`,
  },
  {
    id: 'hetzner-vps-setup',
    title: 'Hetzner VPS Setup',
    description: 'How the admin VPS is provisioned with Cloudflare Tunnel, Docker, and admin container.',
    category: 'infrastructure',
    tags: ['hetzner', 'vps', 'setup', 'cloudflare tunnel', 'docker', 'provisioning'],
    relatedArticles: ['infrastructure-overview', 'admin-deployment'],
    body: `
## Overview

The admin UI runs on a Hetzner VPS (49.12.4.77) behind a Cloudflare Tunnel. No ports are exposed to the internet — the tunnel handles SSL and routing.

**Admin URL:** \`https://web.infront.cy\`

## Setup script

\`infra/admin/setup-vps.sh\` performs a 5-step setup:

### 1. Install cloudflared

Downloads the latest Linux amd64 binary from GitHub and places it in \`/usr/local/bin/cloudflared\`.

### 2. Clone repo and build Docker image

\`\`\`bash
git clone https://github.com/stefanospp/infront-cms.git /opt/infront-cms
docker build -t infront-admin /opt/infront-cms
\`\`\`

### 3. Start admin container

\`\`\`bash
docker run -d --name infront-admin --restart unless-stopped \\
  -p 127.0.0.1:4321:4321 \\
  -v infront-admin-sites:/app/sites \\
  -e HOST=0.0.0.0 -e PORT=4321 -e NODE_ENV=production \\
  -e ADMIN_PASSWORD_HASH=... \\
  -e SESSION_SECRET=... \\
  -e CLOUDFLARE_API_TOKEN=... \\
  -e CLOUDFLARE_ACCOUNT_ID=... \\
  -e CLOUDFLARE_ZONE_ID=... \\
  infront-admin
\`\`\`

**Key points:**
- Binds to \`127.0.0.1:4321\` only (localhost, not exposed)
- Docker volume \`infront-admin-sites\` persists generated site files
- Environment variables prompted interactively if not set

### 4. Set up Cloudflare Tunnel

\`\`\`yaml
# /etc/cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json
ingress:
  - hostname: web.infront.cy
    service: http://localhost:4321
  - service: http_status:404
\`\`\`

Routes DNS: \`cloudflared tunnel route dns infront-admin web.infront.cy\`

### 5. Install as systemd service

\`\`\`bash
cloudflared service install
systemctl enable cloudflared
systemctl restart cloudflared
\`\`\`

## Updating the admin

\`\`\`bash
# Quick update
./infra/admin/update-vps.sh

# Or via Kamal
kamal deploy -c infra/admin/deploy.yml
\`\`\`
`,
  },
  {
    id: 'directus-docker',
    title: 'Directus Docker Deployment',
    description: 'How Directus CMS instances are deployed per client using Docker Compose.',
    category: 'infrastructure',
    tags: ['directus', 'docker', 'cms', 'postgresql', 'compose'],
    relatedArticles: ['infrastructure-overview', 'cms-data-flow'],
    body: `
## Architecture

Each CMS client gets their own Directus instance running in Docker:

\`\`\`mermaid
graph LR
    A[Astro Site] -->|REST API| B[Directus Container<br/>Port 8055]
    B -->|SQL| C[PostgreSQL Container<br/>Port 5432]
    C -->|Volume| D[(db_data)]
    B -->|Volume| E[(uploads)]
    style B fill:#8b5cf6,color:#fff
    style C fill:#3b82f6,color:#fff
\`\`\`

## Docker Compose template

Location: \`infra/docker/template/docker-compose.yml\`

Two services:
1. **Directus** — Image: \`directus/directus:11\`, port 8055
2. **PostgreSQL** — Image: \`postgis/postgis:16-3.4\`

Three persistent volumes:
- \`directus_uploads\` — uploaded media files
- \`directus_extensions\` — custom extensions
- \`db_data\` — PostgreSQL data

## Required .env variables

\`\`\`bash
KEY=<32-byte encryption key>           # openssl rand -hex 32
SECRET=<32-byte JWT secret>            # openssl rand -hex 32
DB_USER=<postgres username>
DB_PASSWORD=<strong password>
ADMIN_EMAIL=<directus admin email>
ADMIN_PASSWORD=<strong admin password>
PUBLIC_URL=https://cms.<domain>
PORT=8055                              # optional, defaults to 8055
\`\`\`

## Starting a client's CMS

\`\`\`bash
cd infra/docker/<slug>
# Create .env file with above variables
docker compose up -d
\`\`\`

## Connecting from Astro

In the client's \`site.config.ts\`:

\`\`\`typescript
cms: {
  url: 'https://cms.acme-corp.com',
  token: '<directus-api-token>',
}
\`\`\`

Then in page files:

\`\`\`typescript
import { createDirectusClient, getPublishedItems } from '@agency/utils';

const client = createDirectusClient(config.cms.url, config.cms.token);
const posts = await getPublishedItems(client, 'blog_posts');
\`\`\`
`,
  },
  {
    id: 'kamal-deployment',
    title: 'Kamal Deployment',
    description: 'Using Kamal for Docker deployment orchestration on the VPS.',
    category: 'infrastructure',
    tags: ['kamal', 'deployment', 'orchestration', 'docker', 'registry'],
    relatedArticles: ['hetzner-vps-setup', 'directus-docker'],
    body: `
## Overview

Kamal is used to orchestrate Docker deployments to the Hetzner VPS. Configuration files are in \`infra/admin/deploy.yml\` and \`infra/kamal.yml\`.

## Admin deployment config

\`\`\`yaml
# infra/admin/deploy.yml
service: infront-admin
image: infront-admin
servers:
  web:
    hosts:
      - 49.12.4.77
    options:
      publish:
        - "127.0.0.1:4321:4321"
      volume:
        - infront-admin-sites:/app/sites
registry:
  server: ghcr.io
  username: <github-username>
  password: <github-token>
builder:
  dockerfile: Dockerfile
  context: .
proxy:
  disabled: true  # Cloudflare Tunnel handles routing
env:
  clear:
    HOST: "0.0.0.0"
    PORT: "4321"
    NODE_ENV: "production"
  secret:
    - ADMIN_PASSWORD_HASH
    - SESSION_SECRET
    - CLOUDFLARE_API_TOKEN
    - CLOUDFLARE_ACCOUNT_ID
    - CLOUDFLARE_ZONE_ID
\`\`\`

## Commands

\`\`\`bash
# Deploy admin
kamal deploy -c infra/admin/deploy.yml

# Deploy Directus
kamal deploy -c infra/kamal.yml

# View logs
kamal logs -c infra/admin/deploy.yml

# Rollback
kamal rollback -c infra/admin/deploy.yml
\`\`\`
`,
  },
  {
    id: 'doppler-secrets',
    title: 'Doppler Secrets Management',
    description: 'How secrets are managed with Doppler across environments.',
    category: 'infrastructure',
    tags: ['doppler', 'secrets', 'environment', 'env vars', 'security'],
    relatedArticles: ['hetzner-vps-setup', 'environment-variables'],
    body: `
## Overview

All secrets are managed through Doppler — no secrets in Git. Doppler provides environment variables to:
- Local development
- CI/CD pipelines (GitHub Actions)
- Production servers (Hetzner VPS)

## Key secrets

| Secret | Used by | Purpose |
|--------|---------|---------|
| \`ADMIN_PASSWORD_HASH\` | Admin UI | bcrypt hash for login |
| \`SESSION_SECRET\` | Admin UI | JWT token signing |
| \`CLOUDFLARE_API_TOKEN\` | Admin UI, CI/CD | Cloudflare API auth |
| \`CLOUDFLARE_ACCOUNT_ID\` | Admin UI, CI/CD | Cloudflare account |
| \`CLOUDFLARE_ZONE_ID\` | Admin UI | DNS zone for infront.cy |
| \`RESEND_API_KEY\` | Client sites | Email sending |
| \`DIRECTUS_TOKEN\` | Client sites | CMS API access |

## Never in Git

The following should never appear in the repository:
- \`.env\` files with real values
- API keys, tokens, or passwords
- \`credentials.json\` or similar files
`,
  },
  {
    id: 'backups-recovery',
    title: 'Backups & Disaster Recovery',
    description: 'Database and upload backup scripts, S3 storage, and restore procedures.',
    category: 'infrastructure',
    tags: ['backup', 'restore', 'disaster recovery', 's3', 'postgresql', 'uploads'],
    relatedArticles: ['directus-docker', 'infrastructure-overview'],
    body: `
## Database backups

**Script:** \`infra/backups/pg_backup.sh\`

Discovers all client databases, dumps each with \`pg_dump\`, compresses with gzip, uploads to S3.

\`\`\`bash
# Run manually
./infra/backups/pg_backup.sh

# Environment variables
BACKUP_DIR=/var/backups/postgres
S3_BUCKET=s3://agency-cms-backups/postgres
RETENTION_DAYS=30
\`\`\`

**Output:** \`<db_name>_<date>.sql.gz\` files locally and in S3.

## Upload backups

**Script:** \`infra/backups/uploads_backup.sh\`

Syncs Directus upload directories to S3.

\`\`\`bash
./infra/backups/uploads_backup.sh

# Environment variables
UPLOADS_ROOT=/var/data/directus-uploads
BACKUP_DIR=/var/backups/uploads
S3_BUCKET=s3://agency-cms-backups/uploads
\`\`\`

## Restore

**Script:** \`infra/backups/restore.sh\`

### Restore database

\`\`\`bash
./restore.sh db <client-slug> <backup-file.sql.gz>
# Example:
./restore.sh db acme-corp /var/backups/postgres/directus_2026-03-20.sql.gz
\`\`\`

### Restore uploads

\`\`\`bash
./restore.sh uploads <client-slug> [s3-path]
# Example:
./restore.sh uploads acme-corp s3://agency-cms-backups/uploads/acme-corp
\`\`\`

Downloads from S3 and copies into the Directus Docker container.

## Recommended schedule

Set up cron jobs for automated backups:

\`\`\`bash
# Daily database backup at 2 AM
0 2 * * * /opt/infront-cms/infra/backups/pg_backup.sh

# Daily upload sync at 3 AM
0 3 * * * /opt/infront-cms/infra/backups/uploads_backup.sh
\`\`\`
`,
  },

  // =========================================================================
  // TESTING
  // =========================================================================
  {
    id: 'vitest-integration-tests',
    title: 'Vitest Integration Tests',
    description: 'How integration tests work with Vitest: setup, running, and writing tests.',
    category: 'testing',
    tags: ['vitest', 'integration', 'tests', 'unit tests'],
    relatedArticles: ['playwright-e2e-tests', 'lighthouse-ci'],
    body: `
## Configuration

\`\`\`typescript
// vitest.config.ts
test: {
  include: [
    'tests/integration/**/*.test.ts',
    'packages/*/src/**/*.test.ts'
  ]
}
\`\`\`

## Running tests

\`\`\`bash
npx vitest run          # Run once
npx vitest              # Watch mode
npx vitest --ui         # UI dashboard
\`\`\`

## Existing tests

### Contact API validation (\`tests/integration/contact-api.test.ts\`)
- Empty name rejected
- Invalid email rejected
- Honeypot field blocks spam
- Message length limits enforced
- Valid submission passes

### Directus image helper (\`tests/integration/directus-fetch.test.ts\`)
- Default parameters work
- All options (width, height, fit, format, quality) applied
- Missing options handled gracefully

## Writing new tests

Place integration tests in \`tests/integration/\` or alongside package source in \`packages/*/src/\`.

\`\`\`typescript
import { describe, it, expect } from 'vitest';

describe('myFunction', () => {
  it('should do the thing', () => {
    expect(myFunction('input')).toBe('output');
  });
});
\`\`\`
`,
  },
  {
    id: 'playwright-e2e-tests',
    title: 'Playwright E2E Tests',
    description: 'End-to-end browser tests with Playwright: setup, running, and test coverage.',
    category: 'testing',
    tags: ['playwright', 'e2e', 'browser', 'end-to-end', 'chromium'],
    relatedArticles: ['vitest-integration-tests', 'lighthouse-ci'],
    body: `
## Configuration

\`\`\`typescript
// playwright.config.ts
testDir: './tests/e2e'
fullyParallel: true
retries: process.env.CI ? 2 : 0
workers: process.env.CI ? 1 : undefined
reporter: 'html'
use: {
  baseURL: 'http://localhost:4321'
  trace: 'on-first-retry'
}
webServer: {
  command: 'npm run preview --workspace=sites/template'
  port: 4321
  reuseExistingServer: !process.env.CI
}
projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }]
\`\`\`

## Running tests

\`\`\`bash
npx playwright test              # Run all
npx playwright test --ui         # Interactive mode
npx playwright test --debug      # Debug mode
npx playwright show-report       # View HTML report
\`\`\`

## Existing test suites

### Accessibility (\`accessibility.spec.ts\`)
- Axe Core WCAG 2A/2AA checks on home, contact, about pages
- Catches colour contrast, missing labels, heading hierarchy issues

### Contact form (\`contact-form.spec.ts\`)
- Form validation (empty fields, invalid email)
- Successful submission flow
- Honeypot spam protection

### Navigation (\`navigation.spec.ts\`)
- All nav links resolve to 200 status
- Mobile nav toggle opens/closes menu

### SEO (\`seo.spec.ts\`)
- Meta tags present (title, description)
- Open Graph tags correct
- Canonical links set
- JSON-LD structured data valid
- sitemap.xml accessible
- robots.txt accessible
`,
  },
  {
    id: 'lighthouse-ci',
    title: 'Lighthouse CI',
    description: 'Performance, accessibility, and SEO auditing with Lighthouse CI.',
    category: 'testing',
    tags: ['lighthouse', 'performance', 'accessibility', 'seo', 'audit', 'budgets'],
    relatedArticles: ['performance-budgets', 'playwright-e2e-tests'],
    body: `
## Configuration

\`\`\`json
// tests/lighthouse/lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": [
        "http://localhost:4321/",
        "http://localhost:4321/about",
        "http://localhost:4321/contact"
      ]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "interactive": ["error", { "maxNumericValue": 3500 }]
      }
    }
  }
}
\`\`\`

## Running

\`\`\`bash
lhci autorun --config=tests/lighthouse/lighthouserc.json
\`\`\`

## Thresholds

| Metric | Minimum |
|--------|---------|
| Performance score | 90 |
| Accessibility score | 95 |
| Best Practices score | 90 |
| SEO score | 95 |
| LCP | ≤ 2500ms |
| CLS | ≤ 0.1 |
| Interactive (TTI) | ≤ 3500ms |

## In CI

Lighthouse runs as the final CI job (after e2e tests). It builds the template site and runs 3 audits per page, failing the pipeline if any threshold is missed.
`,
  },
  {
    id: 'performance-budgets',
    title: 'Performance Budgets',
    description: 'Target performance budgets for all client sites.',
    category: 'testing',
    tags: ['performance', 'budgets', 'page weight', 'javascript', 'css', 'lcp', 'cls'],
    relatedArticles: ['lighthouse-ci', 'tech-stack-overview'],
    body: `
## Budgets

| Metric | Budget |
|--------|--------|
| Total page weight (home) | < 500KB transferred |
| JavaScript (all islands) | < 100KB gzipped |
| CSS | < 15KB gzipped |
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 95 |
| Lighthouse SEO | ≥ 95 |

## How to stay within budget

- Use \`client:visible\` or \`client:idle\` instead of \`client:load\` for islands
- Optimize images with Astro's \`<Image />\` component or \`getDirectusImageUrl()\` with format/quality params
- Keep React islands small — only for interactivity (forms, menus, consent)
- Use CSS-only solutions where possible (e.g., FAQ accordion uses \`<details>\`)
- Avoid loading Mermaid, large chart libraries, or heavy dependencies client-side
`,
  },

  // =========================================================================
  // CONFIGURATION
  // =========================================================================
  {
    id: 'tailwind-v4-tokens',
    title: 'Tailwind v4 Theme Tokens',
    description: 'How Tailwind CSS v4 configuration works with @theme blocks and CSS custom properties.',
    category: 'configuration',
    tags: ['tailwind', 'css', 'tokens', 'theme', 'custom properties', 'v4'],
    relatedArticles: ['theme-customization', 'design-system-layers'],
    body: `
## How it works in Tailwind v4

Tailwind v4 uses CSS-based configuration instead of JavaScript config files. Themes are defined in \`@theme\` blocks inside CSS files.

## Token structure

\`\`\`css
@import "tailwindcss";

/* Tell Tailwind where to find component classes */
@source "../../packages/ui/src/components";
@source "../../packages/ui/src/layouts";
@source "../../packages/ui/src/islands";
@source "./components";

@theme {
  /* Each token becomes a CSS custom property AND a Tailwind class */
  --color-primary-600: #2563eb;    /* → bg-primary-600, text-primary-600, etc. */
  --font-heading: "Inter", serif;  /* → font-heading */
}
\`\`\`

## Available token namespaces

| Prefix | Generates | Example |
|--------|-----------|---------|
| \`--color-*\` | \`bg-*\`, \`text-*\`, \`border-*\`, etc. | \`--color-primary-600\` |
| \`--font-*\` | \`font-*\` | \`--font-heading\` |
| \`--spacing-*\` | \`p-*\`, \`m-*\`, \`gap-*\`, etc. | \`--spacing-lg\` |

## @source directive

The \`@source\` directive tells Tailwind where to scan for utility classes. This is essential for shared components — without it, Tailwind won't generate the classes used in \`packages/ui\`.

\`\`\`css
@source "../../packages/ui/src/components";
@source "./components";  /* local overrides */
\`\`\`

## Using the @tailwindcss/vite plugin

Tailwind v4 uses a Vite plugin instead of PostCSS:

\`\`\`javascript
// astro.config.mjs
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
\`\`\`
`,
  },
  {
    id: 'template-definitions',
    title: 'Template Definitions',
    description: 'How templates are structured and how to add new templates.',
    category: 'configuration',
    tags: ['templates', 'definition', 'registry', 'pages', 'sections'],
    relatedArticles: ['template-gallery-guide', 'agency-config-package'],
    body: `
## Template structure

Templates are defined in \`packages/config/src/templates.ts\`. Each template specifies:

\`\`\`typescript
interface TemplateDefinition {
  id: string;                    // "business-starter"
  name: string;                  // "Business Starter"
  description: string;           // What it's for
  screenshot: string;            // Screenshot path
  category: string;              // "business", "hospitality", etc.
  features?: string[];           // ["Contact Form", "Blog", "Gallery"]
  pages: TemplatePageDefinition[];
  defaultTheme: ThemeConfig;
  defaultTokens: TemplateThemeTokens;
  defaultNav: NavConfig;
  defaultFooter: FooterConfig;
  defaultSeo: Partial<SEOConfig>;
}
\`\`\`

## Page definitions

Each page within a template:

\`\`\`typescript
interface TemplatePageDefinition {
  slug: string;           // "index", "about", "contact"
  title: string;          // "Home"
  description: string;    // SEO description
  layout: string;         // "FullWidth", "SingleColumn", etc.
  sections: TemplateSectionDefinition[];
}
\`\`\`

## Section definitions

Each section within a page:

\`\`\`typescript
interface TemplateSectionDefinition {
  component: string;      // "Hero", "Section", "CardGrid"
  variant?: string;       // "centered", "three-column"
  props: Record<string, unknown>;
  children?: TemplateSectionDefinition[];
  isIsland?: boolean;
  clientDirective?: 'visible' | 'idle' | 'load';
}
\`\`\`

## Adding a new template

1. Define the template in \`packages/config/src/templates.ts\`
2. Add it to the \`templates\` array
3. Ensure all referenced components exist in \`packages/ui\`
4. The template will appear in the gallery and wizard automatically
`,
  },
  {
    id: 'environment-variables',
    title: 'Environment Variables',
    description: 'All environment variables used across the platform.',
    category: 'configuration',
    tags: ['env', 'environment', 'variables', 'secrets', 'configuration'],
    relatedArticles: ['doppler-secrets', 'hetzner-vps-setup'],
    body: `
## Admin UI

| Variable | Required | Description |
|----------|----------|-------------|
| \`ADMIN_PASSWORD_HASH\` | Yes | bcrypt hash of admin password |
| \`SESSION_SECRET\` | Yes | 32-byte hex string for JWT signing |
| \`CLOUDFLARE_API_TOKEN\` | Yes | Cloudflare API bearer token |
| \`CLOUDFLARE_ACCOUNT_ID\` | Yes | Cloudflare account identifier |
| \`CLOUDFLARE_ZONE_ID\` | Yes | DNS zone ID for infront.cy |
| \`HOST\` | No | Server host (default: localhost) |
| \`PORT\` | No | Server port (default: 4321) |
| \`NODE_ENV\` | No | Environment (production/development) |

## Client sites

| Variable | Required | Description |
|----------|----------|-------------|
| \`PUBLIC_SITE_URL\` | Yes | Full production URL |
| \`DIRECTUS_URL\` | CMS only | Directus instance URL |
| \`DIRECTUS_TOKEN\` | CMS only | Directus API token |
| \`RESEND_API_KEY\` | If contact form | Resend email API key |
| \`CONTACT_EMAIL\` | If contact form | Recipient email address |

## Directus instances

| Variable | Required | Description |
|----------|----------|-------------|
| \`KEY\` | Yes | 32-byte encryption key |
| \`SECRET\` | Yes | 32-byte JWT secret |
| \`DB_USER\` | Yes | PostgreSQL username |
| \`DB_PASSWORD\` | Yes | PostgreSQL password |
| \`ADMIN_EMAIL\` | Yes | Directus admin email |
| \`ADMIN_PASSWORD\` | Yes | Directus admin password |
| \`PUBLIC_URL\` | Yes | Public-facing Directus URL |
| \`PORT\` | No | HTTP port (default: 8055) |

## Generating secrets

\`\`\`bash
# Generate a random 32-byte hex string
openssl rand -hex 32

# Generate a bcrypt hash
npx bcryptjs "your-password"
\`\`\`
`,
  },
  {
    id: 'security-headers',
    title: 'Security Headers',
    description: 'CSP, HSTS, and other security headers configured for all sites.',
    category: 'configuration',
    tags: ['security', 'headers', 'csp', 'hsts', 'x-frame-options'],
    relatedArticles: ['api-validation', 'directus-hardening'],
    body: `
## Overview

Security headers are configured in \`public/_headers\` for each site. These are served by Cloudflare Pages.

## Headers

| Header | Value | Purpose |
|--------|-------|---------|
| \`Content-Security-Policy\` | Strict CSP | Prevents XSS and injection attacks |
| \`Strict-Transport-Security\` | \`max-age=31536000; includeSubDomains\` | Forces HTTPS |
| \`X-Frame-Options\` | \`DENY\` | Prevents clickjacking |
| \`X-Content-Type-Options\` | \`nosniff\` | Prevents MIME type sniffing |
| \`Referrer-Policy\` | \`strict-origin-when-cross-origin\` | Controls referrer info |
| \`Permissions-Policy\` | Restrictive | Limits browser features |

## CSP directives

The Content-Security-Policy is configured to allow:
- **Scripts:** Self-hosted + analytics providers
- **Styles:** Self-hosted + Tailwind inline
- **Images:** Self, Directus CMS domain, data URIs
- **Fonts:** Self, Google Fonts
- **Frames:** Google Maps (for Map component)
- **Connect:** Self, analytics endpoints

## Adding third-party scripts

If you need to add a third-party script (e.g., chat widget, analytics):

1. Add the domain to the CSP in \`public/_headers\`
2. Update the \`script-src\` directive to include the domain
3. Test that the script loads without CSP violations
`,
  },

  // =========================================================================
  // API REFERENCE
  // =========================================================================
  {
    id: 'api-auth-login',
    title: 'POST /api/auth/login',
    description: 'Authenticate with the admin password and receive a session cookie.',
    category: 'api-reference',
    tags: ['auth', 'login', 'password', 'session', 'jwt', 'cookie'],
    relatedArticles: ['api-auth-logout'],
    body: `
## Request

\`\`\`
POST /api/auth/login
Content-Type: application/json

{
  "password": "your-admin-password"
}
\`\`\`

## Response (200 OK)

\`\`\`json
{ "ok": true }
\`\`\`

Sets a \`session\` cookie:
- \`httpOnly: true\`
- \`secure: true\`
- \`sameSite: strict\`
- \`maxAge: 86400\` (24 hours)
- Contains a JWT signed with \`SESSION_SECRET\`

## Error responses

| Status | Body | Cause |
|--------|------|-------|
| 400 | \`{ "error": "Password is required" }\` | Missing or non-string password |
| 400 | \`{ "error": "Invalid request" }\` | JSON parsing failed |
| 401 | \`{ "error": "Invalid password" }\` | bcrypt comparison failed |
| 500 | \`{ "error": "Server configuration error" }\` | Missing env vars |
`,
  },
  {
    id: 'api-auth-logout',
    title: 'POST /api/auth/logout',
    description: 'Clear the session cookie and log out.',
    category: 'api-reference',
    tags: ['auth', 'logout', 'session', 'clear'],
    relatedArticles: ['api-auth-login'],
    body: `
## Request

\`\`\`
POST /api/auth/logout
\`\`\`

No body required.

## Response (200 OK)

\`\`\`json
{ "ok": true }
\`\`\`

Clears the \`session\` cookie (\`maxAge: 0\`).
`,
  },
  {
    id: 'api-sites-list',
    title: 'GET /api/sites',
    description: 'List all sites with metadata, deploy status, and URLs.',
    category: 'api-reference',
    tags: ['sites', 'list', 'dashboard', 'status'],
    relatedArticles: ['api-sites-create', 'dashboard-guide'],
    body: `
## Request

\`\`\`
GET /api/sites
\`\`\`

## Response (200 OK)

Array of site objects:

\`\`\`typescript
{
  slug: string;
  name: string;
  domain: string;
  tier: 'static' | 'cms';
  lastModified: string;           // ISO 8601
  isTemplate: boolean;
  deployStatus?: 'pending' | 'building' | 'deploying' | 'live' | 'failed' | null;
  stagingUrl?: string | null;
  productionUrl?: string | null;
  lastDeployAt?: string | null;
}[]
\`\`\`

## Notes

- Excludes the \`admin\` site
- Template site has \`isTemplate: true\`
- Sorted: template last, others alphabetically
- Reads \`site.config.ts\` via regex (not dynamic import)
- Checks \`infra/docker/<slug>\` for tier detection
`,
  },
  {
    id: 'api-sites-create',
    title: 'POST /api/sites/create',
    description: 'Create a new site from a template with full configuration.',
    category: 'api-reference',
    tags: ['create', 'site', 'generate', 'wizard', 'deploy'],
    relatedArticles: ['wizard-creation-flow', 'api-sites-list'],
    body: `
## Request

\`\`\`
POST /api/sites/create
Content-Type: application/json
\`\`\`

See the [Wizard Creation Flow](#article/wizard-creation-flow) for the full request schema. Key fields:

| Field | Type | Validation |
|-------|------|------------|
| \`slug\` | string | Lowercase, 2-63 chars, alphanumeric + hyphens |
| \`name\` | string | Min 1 char |
| \`tagline\` | string | Min 1 char |
| \`domain\` | string | Min 3 chars |
| \`tier\` | enum | \`static\`, \`cms\`, \`interactive\` |
| \`templateId\` | string | Must exist in template registry |
| \`theme\` | object | Nav style, footer style, hero default, border style |
| \`tokens\` | object | Colour scales (50-950) + fonts |
| \`contact\` | object | Email (required), phone, address |
| \`seo\` | object | Titles, descriptions, OG image |
| \`nav\` | object | Items array + optional CTA |
| \`footer\` | object | Columns, socials, legal links |
| \`analytics\` | object? | Provider + site ID |

## Response (201 Created)

\`\`\`json
{
  "success": true,
  "sitePath": "/app/sites/acme-corp",
  "checklist": ["pnpm install", "pnpm dev --filter @agency/acme-corp"],
  "stagingUrl": "https://acme-corp.infront.cy",
  "deployStatus": "pending"
}
\`\`\`

## Error responses

| Status | Body | Cause |
|--------|------|-------|
| 400 | \`{ "error": "Validation failed", "details": {...} }\` | Zod validation errors |
| 400/500 | \`{ "success": false, "error": "..." }\` | Generation or build error |

## Notes

- Deploy is fire-and-forget — returns immediately with \`pending\` status
- Poll \`/api/sites/<slug>/deploy-status\` for progress
`,
  },
  {
    id: 'api-deploy-status',
    title: 'GET /api/sites/[slug]/deploy-status',
    description: 'Get current deploy status and metadata for a site.',
    category: 'api-reference',
    tags: ['deploy', 'status', 'polling', 'metadata'],
    relatedArticles: ['api-sites-create', 'api-redeploy'],
    body: `
## Request

\`\`\`
GET /api/sites/<slug>/deploy-status
\`\`\`

## Response (200 OK)

\`\`\`typescript
{
  projectName: string;
  stagingUrl: string;
  productionUrl: string | null;
  pagesDevUrl: string;
  lastDeployId: string | null;
  lastDeployAt: string | null;     // ISO 8601
  status: 'pending' | 'building' | 'deploying' | 'live' | 'failed';
  error: string | null;
  dnsRecordId: string | null;
  buildLog: string | null;
}
\`\`\`

## Error responses

| Status | Body | Cause |
|--------|------|-------|
| 404 | \`{ "error": "Site not found" }\` | No .deploy.json exists |

## Usage

The admin UI polls this endpoint every 3 seconds during active deploys to update the status badge.
`,
  },
  {
    id: 'api-redeploy',
    title: 'POST /api/sites/[slug]/redeploy',
    description: 'Trigger a rebuild and redeployment of a site.',
    category: 'api-reference',
    tags: ['redeploy', 'rebuild', 'trigger'],
    relatedArticles: ['api-deploy-status', 'redeployment'],
    body: `
## Request

\`\`\`
POST /api/sites/<slug>/redeploy
\`\`\`

No body required.

## Response (200 OK)

\`\`\`json
{
  "status": "building",
  "message": "Redeploy started"
}
\`\`\`

## Error responses

| Status | Body | Cause |
|--------|------|-------|
| 404 | \`{ "error": "Site not found" }\` | No .deploy.json |
| 409 | \`{ "error": "A deploy is already in progress", "status": "building" }\` | Build/deploy running |

## Notes

- Fire-and-forget: returns immediately
- Blocks concurrent deploys (409 Conflict)
- Skips project creation and DNS setup (already done on first deploy)
`,
  },
  {
    id: 'api-custom-domain',
    title: 'POST/DELETE /api/sites/[slug]/custom-domain',
    description: 'Add or remove a custom production domain for a site.',
    category: 'api-reference',
    tags: ['custom domain', 'production', 'dns', 'domain'],
    relatedArticles: ['custom-domains', 'api-deploy-status'],
    body: `
## Add domain (POST)

\`\`\`
POST /api/sites/<slug>/custom-domain
Content-Type: application/json

{ "domain": "acme-corp.com" }
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "productionUrl": "acme-corp.com"
}
\`\`\`

## Remove domain (DELETE)

\`\`\`
DELETE /api/sites/<slug>/custom-domain
Content-Type: application/json

{ "domain": "acme-corp.com" }
\`\`\`

**Response (200):**
\`\`\`json
{ "success": true }
\`\`\`

## Error responses

| Status | Body | Cause |
|--------|------|-------|
| 400 | \`{ "error": "domain is required and must be non-empty" }\` | Missing domain |
| 400 | \`{ "error": "Invalid JSON body" }\` | Parse error |
| 404 | \`{ "error": "Site not found" }\` | No .deploy.json |
| 500 | \`{ "error": "..." }\` | Cloudflare API error |
`,
  },
  {
    id: 'api-overrides',
    title: 'GET /api/sites/[slug]/overrides',
    description: 'List component override files for a site.',
    category: 'api-reference',
    tags: ['overrides', 'components', 'custom', 'files'],
    relatedArticles: ['component-overrides', 'site-management-page'],
    body: `
## Request

\`\`\`
GET /api/sites/<slug>/overrides
\`\`\`

## Response (200 OK)

\`\`\`json
{
  "files": ["Hero.astro", "Footer.astro", "ContactForm.tsx"]
}
\`\`\`

Returns an empty array if no overrides exist:

\`\`\`json
{ "files": [] }
\`\`\`

## Notes

- Lists files in \`sites/<slug>/src/components/\`
- Filters for \`.astro\`, \`.tsx\`, \`.ts\` extensions only
- Returns empty array if the directory doesn't exist
`,
  },
  {
    id: 'api-templates',
    title: 'GET /api/templates',
    description: 'List all available site templates.',
    category: 'api-reference',
    tags: ['templates', 'list', 'gallery'],
    relatedArticles: ['template-gallery-guide', 'template-definitions'],
    body: `
## Request

\`\`\`
GET /api/templates
\`\`\`

## Response (200 OK)

Array of template definitions:

\`\`\`typescript
{
  id: string;
  name: string;
  description: string;
  screenshot: string;
  category: string;
  features?: string[];
  pages: TemplatePageDefinition[];
  defaultTheme: ThemeConfig;
  defaultTokens: TemplateThemeTokens;
  defaultNav: NavConfig;
  defaultFooter: FooterConfig;
  defaultSeo: Partial<SEOConfig>;
}[]
\`\`\`

## Notes

- Calls \`listTemplates()\` from \`@agency/config\`
- Always returns 200, even if empty
`,
  },

  // =========================================================================
  // DEVELOPER WORKFLOWS
  // =========================================================================
  {
    id: 'editing-existing-sites',
    title: 'Editing Existing Sites',
    description: 'Day-to-day workflow for making changes to deployed client sites.',
    category: 'developer-workflows',
    tags: ['editing', 'workflow', 'changes', 'update', 'preview', 'redeploy'],
    relatedArticles: ['quick-start-guide', 'redeployment', 'component-variants-reference'],
    body: `
## Workflow

\`\`\`
1. Edit files in sites/<slug>/
2. Preview: npm run dev --workspace=sites/<slug>
3. Redeploy via admin UI "Redeploy" button
   (or: npm run build --workspace=sites/<slug> && wrangler pages deploy)
\`\`\`

## Quick reference: what to edit

| Client request | File to edit | What to change |
|---------------|-------------|----------------|
| "Change brand colour" | \`src/styles/global.css\` | \`--color-primary-*\` in \`@theme\` |
| "Use a different font" | \`src/styles/global.css\` | \`--font-heading\` / \`--font-body\` |
| "Update phone number" | \`site.config.ts\` | \`contact.phone\` |
| "Add a new nav link" | \`site.config.ts\` | \`nav.items\` array |
| "Make the hero bigger" | \`src/pages/index.astro\` | \`variant="fullscreen"\` on Hero |
| "Add a pricing page" | \`src/pages/pricing.astro\` | Create new file with PricingTable |
| "Different footer style" | \`site.config.ts\` | \`theme.footerStyle\` |
| "Custom hero design" | \`src/components/Hero.astro\` | Create override file |
| "Add team photos" | \`src/pages/about.astro\` | Add \`photo\` prop to TeamGrid members |
| "Remove the map" | \`src/pages/contact.astro\` | Delete the \`<Map>\` component |

## Adding a new page

1. Create \`.astro\` file in \`src/pages/\`
2. Import a layout and components
3. Add nav link in \`site.config.ts\`

\`\`\`astro
---
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
import Hero from '@agency/ui/components/Hero.astro';
import config from '../../site.config';
---

<FullWidth title="Services" description="What we offer" config={config}>
  <Hero variant="minimal" heading="Our Services" />
</FullWidth>
\`\`\`

## Adding/removing/reordering sections

Edit the page file directly — sections are just component invocations:

\`\`\`astro
<!-- Add a stats section -->
<Section heading="By the numbers">
  <StatsCounter variant="grid" stats={[...]} />
</Section>

<!-- Remove testimonials: delete the block -->
<!-- Reorder: move component blocks up or down -->
\`\`\`
`,
  },
  {
    id: 'adding-shared-components',
    title: 'Adding Shared Components',
    description: 'How to create new reusable components for the shared UI package.',
    category: 'developer-workflows',
    tags: ['component', 'shared', 'reusable', 'packages/ui', 'new'],
    relatedArticles: ['agency-ui-package', 'design-system-layers'],
    body: `
## Process

1. **Check if a similar component exists** in \`packages/ui\` or another site
2. **If yes**, extend it with a new variant
3. **If no**, build it in a site folder first
4. **Once validated**, move it to \`packages/ui\` if reusable

## Building a new component

### Step 1: Create in site folder

\`\`\`astro
---
// sites/acme-corp/src/components/PriceCard.astro
interface Props {
  title: string;
  price: string;
  features: string[];
  class?: string;
}

const { title, price, features, class: className } = Astro.props;
---

<div class:list={["bg-white rounded-xl p-6 shadow-sm", className]}>
  <h3 class="text-lg font-semibold text-neutral-900">{title}</h3>
  <p class="text-3xl font-bold text-primary-600">{price}</p>
  <ul>
    {features.map(f => <li class="text-neutral-600">{f}</li>)}
  </ul>
</div>
\`\`\`

### Step 2: Test locally

\`\`\`bash
npm run dev --workspace=sites/acme-corp
\`\`\`

### Step 3: Move to packages/ui (if reusable)

1. Move file to \`packages/ui/src/components/PriceCard.astro\`
2. Update imports in the site that used it
3. Test across at least two sites

## Rules for shared components

- Accept a \`class\` prop for additional Tailwind classes
- Use only Tailwind tokens — no hardcoded colours
- Text content from props, never hardcoded
- If the component needs visual flexibility, add a \`variant\` prop
- Never add site-specific logic
`,
  },
  {
    id: 'git-conventions',
    title: 'Git Conventions',
    description: 'Branching strategy, commit messages, and PR guidelines.',
    category: 'developer-workflows',
    tags: ['git', 'branching', 'commits', 'pull requests', 'conventions'],
    relatedArticles: ['ci-cd-pipelines'],
    body: `
## Branching

| Branch | Purpose |
|--------|---------|
| \`main\` | Stable, production-ready code |
| \`onboard/<slug>\` | New client site setup |
| \`feature/<description>\` | New features or changes |
| \`fix/<description>\` | Bug fixes |

## Commit messages

Keep them clear and descriptive:
- \`Add pricing page for acme-corp\`
- \`Fix: contact form validation error\`
- \`Update Hero component with video variant\`

## Shared package changes

Changes to \`packages/*\` affect **all sites**. Before merging:

1. Test the change across at least two sites
2. Run the full CI pipeline (lint, typecheck, tests)
3. Check that no site-specific behaviour is being added to shared code

## Deployment triggers

CI/CD workflows trigger based on file paths:

| Change | Trigger |
|--------|---------|
| \`sites/template/**\` or \`packages/**\` | deploy-site.yml |
| \`infra/**\` | deploy-directus.yml |
| Any push/PR to main | test.yml |
`,
  },
  {
    id: 'ci-cd-pipelines',
    title: 'CI/CD Pipelines',
    description: 'GitHub Actions workflows for testing, building, and deploying.',
    category: 'developer-workflows',
    tags: ['ci', 'cd', 'github actions', 'pipeline', 'automation'],
    relatedArticles: ['git-conventions', 'vitest-integration-tests', 'playwright-e2e-tests'],
    body: `
## test.yml

Runs on every push to main and PRs. 5 jobs:

1. **Lint & Typecheck** — ESLint + TypeScript strict
2. **Security Audit** — \`npm audit --audit-level=critical\`
3. **Integration Tests** — Vitest
4. **E2E Tests** — Playwright (builds template site first)
5. **Lighthouse CI** — Performance, accessibility, SEO (depends on e2e)

## deploy-site.yml

Triggers on push to main when \`sites/template/**\` or \`packages/**\` change.

1. \`npm ci\`
2. \`npm run build --workspace=sites/template\`
3. \`npx wrangler pages deploy sites/template/dist --project-name=template\`

## deploy-directus.yml

Triggers on push to main when \`infra/**\` changes.

1. Install kamal gem
2. \`kamal deploy\`

## Required secrets (GitHub)

| Secret | Used by |
|--------|---------|
| \`CLOUDFLARE_API_TOKEN\` | deploy-site.yml |
| \`CLOUDFLARE_ACCOUNT_ID\` | deploy-site.yml |
| \`KAMAL_REGISTRY_PASSWORD\` | deploy-directus.yml |
| \`DIRECTUS_URL\` | deploy-site.yml |
| \`DIRECTUS_TOKEN\` | deploy-site.yml |
| \`RESEND_API_KEY\` | deploy-site.yml |
`,
  },

  // =========================================================================
  // SECURITY & ACCESSIBILITY
  // =========================================================================
  {
    id: 'api-validation',
    title: 'API Validation & Rate Limiting',
    description: 'How API routes validate inputs and protect against abuse.',
    category: 'security-accessibility',
    tags: ['api', 'validation', 'zod', 'rate limiting', 'security'],
    relatedArticles: ['security-headers', 'directus-hardening'],
    body: `
## Input validation

Every API route validates inputs server-side using Zod schemas. No user input is trusted.

### Contact form validation

\`\`\`typescript
const ContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10).max(5000),
  honeypot: z.string().max(0),  // Must be empty
});
\`\`\`

### Site creation validation

The \`/api/sites/create\` endpoint validates ~50 fields with strict schemas: slug format, domain format, colour hex values, font names, and more.

## Spam protection

- **Honeypot field** on all contact forms — hidden field that bots fill
- Server rejects any submission where the honeypot is non-empty

## Security practices

- **execFile** instead of **exec** for shell commands — prevents command injection
- **Slug validation** — only allows \`[a-z][a-z0-9-]{1,62}\`, preventing path traversal
- **Domain validation** — strict regex prevents injection
- **Font name sanitization** — strips \`"\`, \`\\\\\`, \`;\`, \`{\`, \`}\`
- **Colour validation** — only allows hex, rgb, hsl, oklch formats
- **CORS** — restricted to site origin
`,
  },
  {
    id: 'directus-hardening',
    title: 'Directus Hardening',
    description: 'Security measures applied to Directus CMS instances.',
    category: 'security-accessibility',
    tags: ['directus', 'security', 'hardening', 'cors', 'uploads'],
    relatedArticles: ['api-validation', 'directus-docker'],
    body: `
## Security measures

| Setting | Value | Purpose |
|---------|-------|---------|
| Public registration | Disabled | Only admin creates accounts |
| CORS | Restricted to site origin | Prevents unauthorized API access |
| File upload types | Limited whitelist | Prevents malicious uploads |
| Admin password | Strong, unique | Set via env var |
| JWT secret | 32-byte random | Set via env var |
| Encryption key | 32-byte random | Set via env var |

## Generating secure credentials

\`\`\`bash
# 32-byte encryption key
openssl rand -hex 32

# 32-byte JWT secret
openssl rand -hex 32

# Strong admin password
openssl rand -base64 24
\`\`\`

## Network isolation

Directus containers are not directly accessible from the internet. They communicate:
- Internally with PostgreSQL via Docker network
- Externally through a reverse proxy with SSL
`,
  },
  {
    id: 'wcag-requirements',
    title: 'WCAG Accessibility Requirements',
    description: 'Mandatory WCAG 2.1 Level AA requirements for all client sites.',
    category: 'security-accessibility',
    tags: ['wcag', 'accessibility', 'a11y', 'semantic html', 'focus', 'aria'],
    relatedArticles: ['lighthouse-ci', 'playwright-e2e-tests'],
    body: `
## Requirements

WCAG 2.1 Level AA is mandatory on all sites. This is enforced by:
- Playwright e2e tests using Axe Core
- Lighthouse CI accessibility score ≥ 95

## Key rules

### Semantic HTML
- Use \`<nav>\`, \`<main>\`, \`<article>\`, \`<section>\`, \`<aside>\`, \`<header>\`, \`<footer>\`
- No div soup — every wrapper should have semantic meaning
- Skip-to-content link in BaseLayout

### Headings
- One \`<h1>\` per page
- Logical heading hierarchy (h1 → h2 → h3, no skips)
- Headings describe the content that follows

### Images
- All images require \`alt\` text
- Decorative images use \`alt=""\`
- Functional images (links, buttons) describe the action

### Focus management
- Visible focus indicators on all interactive elements (\`focus-visible:outline\`)
- Mobile nav has focus trap when open
- Modals trap focus and return it on close
- Tab order follows visual order

### Forms
- Every input has a \`<label>\`
- Error messages linked via \`aria-describedby\`
- Form status announced via \`aria-live\` regions
- Required fields marked with \`required\` attribute

### Colour
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 for large text and UI components
- Information not conveyed by colour alone

### Motion
- \`prefers-reduced-motion\` respected where animations exist
`,
  },

  // =========================================================================
  // TROUBLESHOOTING
  // =========================================================================
  {
    id: 'troubleshooting-build-failures',
    title: 'Build Failures',
    description: 'Common build errors and how to resolve them.',
    category: 'troubleshooting',
    tags: ['build', 'error', 'failure', 'npm', 'astro', 'typescript'],
    relatedArticles: ['troubleshooting-deploy-failures', 'redeployment'],
    body: `
## Common causes

### TypeScript errors

\`\`\`
error TS2345: Argument of type 'string' is not assignable to parameter of type ...
\`\`\`

**Fix:** Run \`npm run typecheck\` locally to see all errors. Fix them before deploying.

### Missing dependencies

\`\`\`
Error: Cannot find module '@agency/ui/components/Hero.astro'
\`\`\`

**Fix:** Run \`npm install\` at the monorepo root. Check that the workspace is registered in the root \`package.json\`.

### Tailwind classes not generating

Components render without styles — classes like \`bg-primary-600\` aren't in the output CSS.

**Fix:** Check \`src/styles/global.css\` has the correct \`@source\` directives:
\`\`\`css
@source "../../packages/ui/src/components";
@source "../../packages/ui/src/layouts";
@source "../../packages/ui/src/islands";
@source "./components";
\`\`\`

### Build timeout

Build exceeds the 120-second timeout.

**Fix:** Check for circular dependencies, very large image files being processed, or excessive page count. The build runs \`npm install\` (60s limit) + \`npm run build\` (120s limit).

## Debugging locally

\`\`\`bash
# Run the same build that the deploy pipeline runs
npm run build --workspace=sites/<slug>

# Check for type errors
npm run typecheck

# Check for lint issues
npm run lint
\`\`\`
`,
  },
  {
    id: 'troubleshooting-deploy-failures',
    title: 'Deploy Failures',
    description: 'Common deployment errors with Cloudflare Pages and DNS.',
    category: 'troubleshooting',
    tags: ['deploy', 'cloudflare', 'wrangler', 'dns', 'failure', 'error'],
    relatedArticles: ['troubleshooting-build-failures', 'auto-deploy-pipeline'],
    body: `
## Common errors

### Cloudflare error 1014 ("CNAME Cross-User Banned")

**Cause:** CNAME record is proxied through Cloudflare (orange cloud).

**Fix:** DNS records for site subdomains must use \`proxied: false\` (grey cloud). The system does this automatically, but if you manually added a DNS record, ensure it's not proxied.

### Wrangler authentication error

\`\`\`
Error: Authentication error
\`\`\`

**Fix:** Check that \`CLOUDFLARE_API_TOKEN\` is set and valid. The token needs Pages and DNS permissions.

### Project already exists

\`\`\`
Error: A project with this name already exists
\`\`\`

**Fix:** The Cloudflare Pages project already exists from a previous (possibly failed) deploy. The system handles this gracefully for redeployments. If it's a genuinely new site, choose a different slug.

### Deploy status stuck on "building"

**Cause:** Build process crashed or timed out without updating metadata.

**Fix:** Check the error field in \`.deploy.json\`. Try redeploying — the redeploy will overwrite the stuck status.

## Checking deploy status

\`\`\`bash
# Read deploy metadata
cat sites/<slug>/.deploy.json | jq .

# Check Cloudflare Pages project
npx wrangler pages project list
\`\`\`
`,
  },
  {
    id: 'troubleshooting-directus',
    title: 'Directus Connection Issues',
    description: 'Troubleshooting Directus CMS connectivity, authentication, and data fetching.',
    category: 'troubleshooting',
    tags: ['directus', 'cms', 'connection', 'authentication', 'fetch', 'api'],
    relatedArticles: ['directus-docker', 'agency-utils-package'],
    body: `
## Common issues

### Connection refused

\`\`\`
Error: connect ECONNREFUSED
\`\`\`

**Causes and fixes:**
1. **Docker not running:** \`cd infra/docker/<slug> && docker compose up -d\`
2. **Wrong URL:** Check \`cms.url\` in \`site.config.ts\` matches the Directus PUBLIC_URL
3. **Port mismatch:** Default is 8055; check Docker port mapping

### Authentication failed (403)

**Causes:**
1. **Invalid token:** Regenerate the API token in Directus admin panel
2. **Token permissions:** Ensure the token has read access to the collections
3. **CORS:** Directus CORS must allow the site's origin

### Empty data returned

**Causes:**
1. **Published status:** \`getPublishedItems()\` filters by \`status: 'published'\`. Check that items are published in Directus
2. **Collection name:** Directus uses snake_case (\`team_members\`, not \`teamMembers\`)
3. **Fields parameter:** If you specify fields, make sure they match the actual field names

### Image URLs broken

**Causes:**
1. **CORS on assets:** Directus must allow the site domain for file access
2. **Missing base URL:** \`getDirectusImageUrl()\` needs the full Directus URL
3. **File not found:** Check the file ID is correct in Directus

## Debug steps

\`\`\`bash
# Check if Directus is running
docker ps | grep directus

# Check Directus logs
docker logs <container-name>

# Test API directly
curl -H "Authorization: Bearer <token>" https://cms.example.com/items/blog_posts
\`\`\`
`,
  },
  {
    id: 'troubleshooting-faq',
    title: 'General FAQ',
    description: 'Frequently asked questions about the platform.',
    category: 'troubleshooting',
    tags: ['faq', 'questions', 'general', 'help'],
    relatedArticles: ['platform-overview', 'quick-start-guide'],
    body: `
## Can I use a different CSS framework?

No. The shared component library depends on Tailwind CSS tokens. Switching would require rewriting all shared components.

## Can I use a different CMS besides Directus?

The utility functions (\`createDirectusClient\`, etc.) are Directus-specific, but you could use any CMS by writing your own data fetching in the site. The shared components don't depend on Directus — they accept data via props.

## How do I add a blog to a site?

Use Astro Content Collections for static markdown posts, or Directus for CMS-managed posts. The \`BlogPost\` layout is designed for article pages.

## How do I update shared components?

Edit the component in \`packages/ui/src/components/\`. Changes affect all sites that use it. Test across at least two sites before merging.

## How do I roll back a deployment?

Cloudflare Pages keeps previous deployments. You can roll back via the Cloudflare dashboard, or redeploy a previous version of the code.

## Why is my site showing the old version?

1. **Cloudflare cache:** Wait a few minutes or purge the cache in the Cloudflare dashboard
2. **Build not triggered:** Check if a redeploy was actually started
3. **Build failed:** Check the deploy status on the site management page

## How many sites can the platform handle?

The monorepo structure scales well. Each site is independent — adding a new site doesn't slow down existing ones. The main constraint is the VPS resources for Directus instances.

## How do I add Google Analytics?

Set in \`site.config.ts\`:
\`\`\`typescript
analytics: {
  provider: 'google',
  siteId: 'G-XXXXXXX',
}
\`\`\`

The CookieConsent island will automatically show a consent banner.
`,
  },
];
