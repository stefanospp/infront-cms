# Solo Web Agency Platform — Technical PRD

## Purpose

This document is the technical specification for the solo web agency platform. It defines the architecture, conventions, and implementation details required to build the monorepo, base template, deployment pipeline, and supporting infrastructure. It is written to be consumed by Claude Code as the primary reference for all development work.

---

## Architecture overview

```
monorepo root (npm workspaces)
│
├── packages/
│   ├── ui/              shared Astro components
│   ├── config/          shared TypeScript, ESLint, Tailwind, Prettier config
│   └── utils/           shared utility functions (SEO helpers, schema generators, image helpers)
│
├── sites/
│   ├── template/        base site — copy for every new client
│   ├── client-a/        client A (extends template)
│   └── client-b/        client B (extends template)
│
├── infra/
│   ├── kamal.yml        Directus deployment config for all clients
│   ├── docker/          Directus Docker Compose files (one per CMS client)
│   ├── backups/         backup scripts (pg_dump cron, rsync uploads)
│   └── provisioning/    new-site provisioning script and tooling
│
├── .github/
│   └── workflows/       CI/CD for Cloudflare Pages and Kamal deploys
│
├── CLAUDE.md            monorepo-level conventions and decisions
├── package.json         workspace root
└── tsconfig.base.json   shared TypeScript base config
```

---

## Design and layout system

### The problem

Every client needs to look different. A law firm and a yoga studio cannot share the same visual identity. But every client needs the same underlying structure — navigation, footer, contact form, SEO, analytics. The platform handles this through three layers: theme tokens, layout templates, and component variants.

### Layer 1: Theme tokens (per-site Tailwind config)

Each site has a `tailwind.config.mjs` that extends the shared base config and defines its own design tokens.

```
sites/client-a/tailwind.config.mjs
```

```javascript
import baseConfig from '@agency/config/tailwind';

export default {
  ...baseConfig,
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5ff',
          100: '#e0ebff',
          // ... full scale
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a5f',
        },
        secondary: {
          // ... full scale
        },
        accent: {
          // ... full scale
        },
        neutral: {
          // ... full scale (greys used for text, borders, backgrounds)
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        full: '9999px',
      },
      // Site-specific spacing, shadows, etc.
    },
  },
};
```

Shared components use only semantic token names (`primary-600`, `neutral-100`, `font-heading`), never hardcoded colours or fonts. When a component renders in client A's site, it picks up client A's tokens. Same component in client B's site, different look.

### Layer 2: Layout templates

Layouts are Astro layout components that define page structure. The base template ships with a set of layouts. Each site chooses which layouts to use and can add its own.

```
packages/ui/src/layouts/
├── BaseLayout.astro        HTML shell: <html>, <head>, meta, scripts, analytics
├── SingleColumn.astro      centered content column, max-width constrained
├── WithSidebar.astro       main content + sidebar (left or right, configurable)
├── FullWidth.astro         edge-to-edge sections (for landing pages, hero blocks)
└── BlogPost.astro          article layout with reading-optimised typography
```

```
sites/client-a/src/layouts/
└── CustomLanding.astro     client-specific layout (imports BaseLayout, adds custom structure)
```

All layouts wrap `BaseLayout.astro`, which handles the `<head>`, SEO meta, Open Graph, structured data injection, analytics script, and the skip-to-content link.

**BaseLayout.astro props:**

```typescript
interface Props {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonicalUrl?: string;
  structuredData?: Record<string, unknown>;  // JSON-LD object
  noIndex?: boolean;
}
```

### Layer 3: Component variants

Shared components that need visual flexibility expose a `variant` prop. The component handles the structural markup. The variant controls the visual treatment.

```typescript
// packages/ui/src/components/Hero.astro
interface Props {
  variant: 'centered' | 'split' | 'fullscreen' | 'minimal';
  heading: string;
  subheading?: string;
  ctaText?: string;
  ctaHref?: string;
  backgroundImage?: string;
}
```

```typescript
// packages/ui/src/components/CardGrid.astro
interface Props {
  variant: 'two-column' | 'three-column' | 'masonry';
  cards: Array<{
    title: string;
    description: string;
    image?: string;
    href?: string;
  }>;
}
```

Components that do not need variants (footer, contact form, nav) accept their content and styling through tokens and props, not variant switches.

### Site configuration file

Each site has a `site.config.ts` at its root that centralises all site-specific settings. Components and layouts read from this file. It is the single source of truth for "what makes this site different."

```
sites/client-a/site.config.ts
```

```typescript
import type { SiteConfig } from '@agency/config';

const config: SiteConfig = {
  // Identity
  name: 'Harrison & Cole Solicitors',
  tagline: 'Trusted legal counsel since 1987',
  url: 'https://harrisonandcole.com',
  locale: 'en-GB',

  // Contact
  contact: {
    email: 'info@harrisonandcole.com',
    phone: '+44 20 7946 0958',
    address: {
      street: '42 King Street',
      city: 'London',
      postcode: 'WC2E 8JT',
      country: 'GB',
    },
  },

  // SEO and structured data
  seo: {
    defaultTitle: 'Harrison & Cole Solicitors — London Legal Services',
    titleTemplate: '%s | Harrison & Cole',
    defaultDescription: 'Full-service solicitors in central London...',
    defaultOgImage: '/og-default.jpg',
    structuredData: {
      type: 'LegalService',   // maps to JSON-LD @type
      // additional schema.org properties merged at build
    },
  },

  // Navigation
  nav: {
    items: [
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Team', href: '/team' },
      { label: 'News', href: '/news' },
      { label: 'Contact', href: '/contact' },
    ],
    cta: { label: 'Book a Consultation', href: '/contact' },
  },

  // Footer
  footer: {
    columns: [
      {
        title: 'Services',
        links: [
          { label: 'Corporate Law', href: '/services/corporate' },
          { label: 'Employment Law', href: '/services/employment' },
        ],
      },
    ],
    socials: {
      linkedin: 'https://linkedin.com/company/harrisonandcole',
    },
    legalLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },

  // Analytics
  analytics: {
    provider: 'plausible',       // 'plausible' | 'fathom' | 'google'
    siteId: 'harrisonandcole.com',
  },

  // CMS (omit for static-only sites)
  cms: {
    url: 'https://cms.harrisonandcole.com',
    // No API tokens here — those live in Doppler
  },

  // Theme overrides that cannot be expressed in Tailwind config
  theme: {
    navStyle: 'sticky',          // 'sticky' | 'fixed' | 'static'
    footerStyle: 'multi-column', // 'simple' | 'multi-column' | 'minimal'
    heroDefault: 'split',        // default hero variant for this site
    borderStyle: 'sharp',        // 'sharp' | 'rounded' | 'pill'
  },
};

export default config;
```

### How it all connects

```
site.config.ts          → what content appears, what features are enabled
tailwind.config.mjs     → what it looks like (colours, fonts, spacing)
layouts/                 → how the page is structured
component variants       → how individual sections are arranged
```

A new client site means: copy the template, write a `site.config.ts`, write a `tailwind.config.mjs`, choose layouts for each page, pick component variants, and add any custom components unique to that client. The shared UI library and base layout handle everything else.

---

## Package specifications

### packages/config

Shared configuration consumed by all sites.

```
packages/config/
├── eslint.config.mjs        shared ESLint flat config
├── tsconfig.json             shared TypeScript config (strict mode, paths)
├── tailwind.base.mjs         base Tailwind config (resets, plugins, base utilities)
├── prettier.config.mjs       shared Prettier config
└── src/
    └── types.ts              SiteConfig type definition, shared interfaces
```

**TypeScript config rules:**

- `strict: true` everywhere, no exceptions
- `noUncheckedIndexedAccess: true`
- Path aliases: `@agency/ui`, `@agency/config`, `@agency/utils`
- All sites extend `tsconfig.base.json` from the monorepo root

### packages/ui

Shared Astro components. Every component is an `.astro` file unless it requires client-side interactivity, in which case it is a React `.tsx` file loaded as an Astro island.

```
packages/ui/src/
├── layouts/
│   ├── BaseLayout.astro
│   ├── SingleColumn.astro
│   ├── WithSidebar.astro
│   ├── FullWidth.astro
│   └── BlogPost.astro
│
├── components/
│   ├── Nav.astro
│   ├── Footer.astro
│   ├── Hero.astro
│   ├── CardGrid.astro
│   ├── Section.astro           generic section wrapper with heading, optional background
│   ├── CTA.astro               call-to-action banner
│   ├── Testimonials.astro
│   ├── TeamGrid.astro
│   ├── FAQ.astro
│   ├── Map.astro               embedded Google Map from config address
│   └── SEOHead.astro           generates <head> meta, OG, JSON-LD from config + page props
│
├── islands/
│   ├── ContactForm.tsx         client-side validated contact form (React island)
│   ├── MobileNav.tsx           mobile hamburger menu (React island)
│   └── CookieConsent.tsx       cookie consent banner if using Google Analytics (React island)
│
└── index.ts                    barrel export
```

**Component conventions:**

- Every component accepts a `class` prop for additional Tailwind classes from the consuming page
- No hardcoded colours, fonts, or spacing values — use Tailwind tokens only
- All text content comes from props or site.config.ts, never hardcoded
- Images use Astro's `<Image />` component for automatic optimisation
- Interactive components (forms, mobile nav) are React islands with `client:visible` or `client:load` directives

### packages/utils

```
packages/utils/src/
├── seo.ts                 generateStructuredData(), generateMeta(), generateSitemap helpers
├── image.ts               getOptimizedImageUrl() for Directus asset transformations
├── directus.ts            typed Directus SDK client factory, shared fetchers
├── date.ts                date formatting helpers (locale-aware)
└── validation.ts          form validation schemas (zod)
```

---

## Site template specification

```
sites/template/
├── astro.config.mjs
├── tailwind.config.mjs
├── site.config.ts
├── tsconfig.json              extends monorepo base, adds site-specific paths
├── package.json
├── public/
│   ├── favicon.svg
│   ├── og-default.jpg         default Open Graph image (1200x630)
│   └── robots.txt
├── src/
│   ├── pages/
│   │   ├── index.astro        home page
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── privacy.astro
│   │   ├── terms.astro
│   │   ├── 404.astro
│   │   └── api/
│   │       └── contact.ts     contact form API route
│   ├── content/               Astro Content Collections (for static sites without CMS)
│   │   └── config.ts
│   ├── lib/
│   │   └── directus.ts        site-specific Directus client (imports from @agency/utils)
│   ├── styles/
│   │   └── global.css         @tailwind directives, any site-specific base styles
│   └── layouts/               site-specific layout overrides (optional, empty in template)
└── CLAUDE.md                  site-specific conventions and notes
```

### Astro configuration

```
sites/template/astro.config.mjs
```

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://example.com',   // overridden per site
  output: 'hybrid',              // static by default, opt-in server routes
  adapter: cloudflare(),
  integrations: [
    react(),
    tailwind(),
    sitemap(),
  ],
  image: {
    domains: ['cms.example.com'],   // allow Directus image optimisation
  },
});
```

`output: 'hybrid'` means pages are static by default (prerendered at build time) but individual pages or API routes can opt into server-side rendering by exporting `const prerender = false`. This is how contact form API routes work without making the whole site dynamic.

### Contact form API route

```
sites/template/src/pages/api/contact.ts
```

```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
  honeypot: z.string().max(0),   // spam trap — must be empty
});

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const data = ContactSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
      honeypot: formData.get('website') ?? '',
    });

    // Send via Resend
    // API key from Doppler via environment variable
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@yourdomain.com',
        to: import.meta.env.CONTACT_EMAIL,
        subject: `Contact form: ${data.name}`,
        text: `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`,
      }),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Failed to send' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ errors: error.flatten() }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
```

---

## Directus specification

### When Directus is used

Only for Tier 2 (CMS) and Tier 3 (Interactive) clients. Tier 1 (Static) sites use Astro Content Collections for any structured content.

### Container setup

Each CMS client gets its own Docker Compose stack:

```
infra/docker/client-a/
├── docker-compose.yml
└── .env                  (not committed — managed by Doppler)
```

```yaml
# infra/docker/client-a/docker-compose.yml
services:
  directus:
    image: directus/directus:11
    ports:
      - "${PORT}:8055"
    environment:
      KEY: "${DIRECTUS_KEY}"
      SECRET: "${DIRECTUS_SECRET}"
      DB_CLIENT: "pg"
      DB_HOST: "database"
      DB_PORT: "5432"
      DB_DATABASE: "directus"
      DB_USER: "${DB_USER}"
      DB_PASSWORD: "${DB_PASSWORD}"
      ADMIN_EMAIL: "${ADMIN_EMAIL}"
      ADMIN_PASSWORD: "${ADMIN_PASSWORD}"
      PUBLIC_URL: "${PUBLIC_URL}"
      STORAGE_LOCATIONS: "local"
      STORAGE_LOCAL_ROOT: "/directus/uploads"
    volumes:
      - directus_uploads:/directus/uploads
      - directus_extensions:/directus/extensions
    depends_on:
      - database

  database:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_USER: "${DB_USER}"
      POSTGRES_PASSWORD: "${DB_PASSWORD}"
      POSTGRES_DB: "directus"
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  directus_uploads:
  directus_extensions:
  db_data:
```

### Standard collections

Every CMS client starts with these Directus collections, configured through the Directus admin UI after initial deployment:

**pages** — title, slug, status (draft/published), content (WYSIWYG), seo_title, seo_description, og_image, sort_order

**posts** (if blog needed) — title, slug, status, content, excerpt, featured_image, author, published_date, categories (M2M)

**categories** — name, slug

**team** (if team section needed) — name, role, bio, photo, email, sort_order, status

**settings** (singleton) — site_name, tagline, contact_email, contact_phone, address, social_links (JSON), footer_text

**navigation** (if client needs to edit nav) — label, href, sort_order, parent (self-referencing for dropdowns)

### Directus roles and permissions

**Administrator** — you. Full access.

**Editor** — the client. Configured with:
- Create and update on all content collections
- No delete permission on any collection (prevents accidental data loss)
- No access to system collections, settings schema, or user management
- File upload allowed with size limit (10MB per file)

**Public** — API read access to published items only. Status field filtered to `published`. This is what the Astro frontend reads.

### Schema versioning

Directus schema snapshots are JSON exports of the entire data model. After any schema change:

```bash
# Export current schema
npx directus schema snapshot --format json > schema-snapshot.json
```

The snapshot is committed to Git in the client's infra folder. On a new deployment or migration:

```bash
# Apply schema to a fresh Directus instance
npx directus schema apply schema-snapshot.json
```

### Directus image handling

Directus has built-in asset transformations. The Astro frontend requests images at specific dimensions:

```
https://cms.client.com/assets/{image-id}?width=800&height=600&fit=cover&format=webp&quality=80
```

Cloudflare caches these transformed images at the edge. Set `Cache-Control: public, max-age=31536000, immutable` on asset responses via Directus or a Cloudflare Page Rule.

For the Astro side, `packages/utils/src/image.ts` provides a helper:

```typescript
export function getDirectusImageUrl(
  cmsUrl: string,
  imageId: string,
  options: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'inside' | 'outside';
    format?: 'webp' | 'avif' | 'jpg' | 'png';
    quality?: number;
  } = {}
): string {
  const params = new URLSearchParams();
  if (options.width) params.set('width', String(options.width));
  if (options.height) params.set('height', String(options.height));
  if (options.fit) params.set('fit', options.fit);
  params.set('format', options.format ?? 'webp');
  params.set('quality', String(options.quality ?? 80));
  return `${cmsUrl}/assets/${imageId}?${params.toString()}`;
}
```

---

## Deployment pipeline

### Astro sites (Cloudflare Pages)

```
.github/workflows/deploy-site.yml
```

Triggered on push to `main` when files change in the relevant site's folder.

```yaml
name: Deploy Site
on:
  push:
    branches: [main]
    paths:
      - 'sites/client-a/**'
      - 'packages/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - run: npm run build --workspace=sites/client-a
        env:
          PUBLIC_SITE_URL: ${{ vars.CLIENT_A_SITE_URL }}
          DIRECTUS_URL: ${{ secrets.CLIENT_A_DIRECTUS_URL }}
          DIRECTUS_TOKEN: ${{ secrets.CLIENT_A_DIRECTUS_TOKEN }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          CONTACT_EMAIL: ${{ secrets.CLIENT_A_CONTACT_EMAIL }}

      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy sites/client-a/dist --project-name=client-a
```

Each client has its own Cloudflare Pages project. The workflow is duplicated per client with different paths and secrets. A matrix strategy can consolidate this once there are more than three or four clients.

### Directus (Kamal to Hetzner)

```
infra/kamal.yml
```

Kamal configuration defines each Directus instance as a separate service on the same VPS.

```yaml
service: agency-directus
image: directus/directus:11

servers:
  - xxx.xxx.xxx.xxx    # Hetzner VPS IP

registry:
  server: ghcr.io
  username:
    - GITHUB_USERNAME
  password:
    - GITHUB_TOKEN

accessories:
  client-a-db:
    image: postgis/postgis:16-3.4
    host: xxx.xxx.xxx.xxx
    port: "127.0.0.1:5432:5432"
    env:
      POSTGRES_USER: client_a
      POSTGRES_PASSWORD:
        - CLIENT_A_DB_PASSWORD
      POSTGRES_DB: directus_client_a
    directories:
      - client_a_db_data:/var/lib/postgresql/data

# Additional accessories for client-b, client-c, etc.
```

Deploy command:

```bash
kamal deploy
```

GitHub Action triggers on changes to `infra/` directory.

### DNS and SSL

All client domains use Cloudflare DNS. Setup per client:

- A record pointing to Hetzner VPS (for Directus subdomain, e.g., `cms.client.com`)
- CNAME pointing to Cloudflare Pages URL (for the main site)
- Cloudflare handles SSL termination (full strict mode)
- Cloudflare proxy enabled on all records (orange cloud)

---

## Backup system

### Automated Postgres backups

```
infra/backups/pg_backup.sh
```

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backups/postgres"
S3_BUCKET="s3://agency-backups/postgres"
DATE=$(date +%Y-%m-%d_%H%M)
RETENTION_DAYS=30

# Dump each client database
for db in directus_client_a directus_client_b; do
  FILENAME="${db}_${DATE}.sql.gz"
  docker exec postgres pg_dump -U postgres "$db" | gzip > "${BACKUP_DIR}/${FILENAME}"
  # Upload to offsite storage
  aws s3 cp "${BACKUP_DIR}/${FILENAME}" "${S3_BUCKET}/${FILENAME}" --endpoint-url="${S3_ENDPOINT}"
done

# Clean up local backups older than retention period
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
```

Cron: daily at 03:00 UTC.

### Directus uploads backup

```bash
# Nightly rsync to offsite storage
rsync -avz /var/lib/docker/volumes/*_uploads/_data/ /backups/uploads/
aws s3 sync /backups/uploads/ s3://agency-backups/uploads/ --endpoint-url="${S3_ENDPOINT}"
```

### Restore procedure

Document this and test it quarterly:

```bash
# Restore a database
gunzip < backup.sql.gz | docker exec -i postgres psql -U postgres directus_client_a

# Restore uploads
aws s3 sync s3://agency-backups/uploads/client-a/ /restore/uploads/ --endpoint-url="${S3_ENDPOINT}"
docker cp /restore/uploads/ directus_client_a:/directus/uploads/
```

---

## Monitoring and error tracking

### Betterstack

- One monitor per client site (HTTP check, 1-minute interval)
- One monitor per Directus instance (HTTP check on `/server/health` endpoint)
- Status page per client (optional, share URL with client)
- Alert to email and Slack/Telegram on downtime

### Sentry

- One Sentry project per client site
- Astro integration for frontend errors
- Source maps uploaded during build
- Alert on new error types, not every occurrence

---

## Secrets management (Doppler)

Project structure in Doppler:

```
agency/
├── shared/              secrets used across all sites (Cloudflare API, Resend, Sentry DSN)
├── client-a/
│   ├── dev              development secrets
│   ├── staging          preview/staging secrets
│   └── production       production secrets
├── client-b/
│   └── ...
```

Secrets per client environment:

- `DIRECTUS_URL` — CMS endpoint
- `DIRECTUS_TOKEN` — static API token for build-time data fetching (read-only, public role)
- `DIRECTUS_ADMIN_EMAIL` — admin login
- `DIRECTUS_ADMIN_PASSWORD` — admin password
- `DB_USER` — Postgres user
- `DB_PASSWORD` — Postgres password
- `RESEND_API_KEY` — email API key
- `CONTACT_EMAIL` — where contact form submissions go
- `SENTRY_DSN` — error tracking endpoint
- `ANALYTICS_ID` — Plausible/Fathom/GA ID

GitHub Actions pull secrets from Doppler at build time using the Doppler CLI or GitHub integration.

---

## Provisioning script specification

```
infra/provisioning/new-site.sh
```

The script takes a client name and tier as arguments and automates the setup of a new client site.

**Inputs:**
- Client slug (lowercase, hyphenated, e.g., `harrison-cole`)
- Tier: `static`, `cms`, or `interactive`
- Client domain (e.g., `harrisonandcole.com`)

**What it does:**

1. Copies `sites/template/` to `sites/{client-slug}/`
2. Updates `package.json` name and workspace references
3. Generates a skeleton `site.config.ts` with placeholder values
4. Generates a `tailwind.config.mjs` extending the base config
5. Writes a `CLAUDE.md` for the new site
6. If CMS tier: creates `infra/docker/{client-slug}/docker-compose.yml` from a template
7. If CMS tier: adds the Directus service and Postgres accessory to `kamal.yml`
8. Creates a Doppler project for the client with environment stubs
9. Creates the Cloudflare Pages project via Cloudflare API
10. Configures DNS records on Cloudflare for the client domain
11. Adds Betterstack monitors for the site (and Directus if CMS tier)
12. Commits everything to a new Git branch `onboard/{client-slug}`

**What it does not do (manual steps documented in output):**

- Writing actual page content and choosing component variants
- Configuring Directus collections (done through the admin UI after first deploy)
- Setting up the client's editor account in Directus
- Final DNS verification (requires client to update nameservers)

The script outputs a checklist of the remaining manual steps after completion.

---

## New site build workflow

This is the sequence for building a new client site after the provisioning script runs.

1. **Configure the theme.** Edit `tailwind.config.mjs` with the client's brand colours, fonts, and spacing. If the client has brand guidelines, translate them into tokens. If not, propose a palette.

2. **Write `site.config.ts`.** Fill in all fields: name, contact details, navigation, footer, analytics, SEO defaults, theme preferences (nav style, hero variant, etc.).

3. **Choose layouts for each page.** Home page might use `FullWidth` for hero sections. About page might use `SingleColumn`. Blog uses `BlogPost`. Wire up each page file to the appropriate layout.

4. **Compose pages from shared components.** Each page is a sequence of shared components with variant and content props. Example home page:

```astro
---
import FullWidth from '@agency/ui/layouts/FullWidth.astro';
import Hero from '@agency/ui/components/Hero.astro';
import CardGrid from '@agency/ui/components/CardGrid.astro';
import Testimonials from '@agency/ui/components/Testimonials.astro';
import CTA from '@agency/ui/components/CTA.astro';
import config from '../site.config';
---

<FullWidth title={config.seo.defaultTitle} description={config.seo.defaultDescription}>
  <Hero
    variant="split"
    heading={config.name}
    subheading={config.tagline}
    ctaText="Get in Touch"
    ctaHref="/contact"
    backgroundImage="/images/hero.jpg"
  />

  <CardGrid
    variant="three-column"
    cards={[
      { title: 'Corporate Law', description: '...', href: '/services/corporate' },
      { title: 'Employment Law', description: '...', href: '/services/employment' },
      { title: 'Dispute Resolution', description: '...', href: '/services/disputes' },
    ]}
  />

  <Testimonials variant="carousel" />

  <CTA heading="Ready to talk?" buttonText="Book a consultation" buttonHref="/contact" />
</FullWidth>
```

5. **Add custom components if needed.** If the client needs something not in the shared library, build it in `sites/{client}/src/components/`. If it turns out to be reusable, move it to `packages/ui` after the project ships.

6. **Connect Directus data (CMS clients only).** Write fetch functions in `sites/{client}/src/lib/directus.ts` that pull content at build time. Pages that display CMS content call these functions in their frontmatter.

7. **Test locally.** `npm run dev --workspace=sites/{client-slug}`. Verify every page, form submission, image loading, SEO meta, structured data (use Google's Rich Results Test), mobile responsiveness.

8. **Deploy to preview.** Push the branch. Cloudflare Pages creates a preview URL. Share with the client for review.

9. **Iterate on feedback.** Make changes, push, preview updates automatically.

10. **Launch.** Merge to `main`. Production deployment runs automatically. Verify DNS, SSL, uptime monitor, error tracking, analytics.

---

## CLAUDE.md conventions

The root `CLAUDE.md` must contain:

```markdown
# Agency Platform — Claude Code Reference

## Monorepo structure
- packages/ui: shared Astro components and layouts
- packages/config: shared configs and types
- packages/utils: shared utilities
- sites/: one folder per client site, plus the template
- infra/: Kamal config, Docker Compose files, backup scripts, provisioning

## Conventions
- TypeScript strict mode everywhere
- All shared components use Tailwind tokens only — no hardcoded colours or fonts
- All text content comes from props or site.config.ts
- Images use Astro <Image /> component or getDirectusImageUrl() helper
- Interactive components are React islands in packages/ui/src/islands/
- Form validation uses zod schemas from packages/utils
- API routes export `const prerender = false`
- Site-specific overrides go in the site folder, not in packages/

## Naming
- Components: PascalCase (Hero.astro, CardGrid.astro)
- Utilities: camelCase (getDirectusImageUrl, generateStructuredData)
- Config files: kebab-case (site.config.ts, tailwind.config.mjs)
- Client folders: kebab-case (client-name)
- CSS classes: Tailwind utilities only, no custom CSS classes

## When building a new site
1. Check if a similar component or pattern exists in packages/ui or another site
2. If it does, use it or extend it with a new variant
3. If it does not, build it in the site folder first, move to packages/ui later if reusable

## When modifying shared packages
- Changes affect all sites — test across at least two sites before merging
- Never add site-specific logic to a shared component
```

Each site also gets its own `CLAUDE.md` with site-specific notes (which Directus collections exist, any custom components, special deployment considerations).

---

## File naming and structure rules

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

---

## Dependencies

### Root (workspace level)

- `typescript` (strict)
- `eslint` + `@eslint/js` + `typescript-eslint`
- `prettier` + `prettier-plugin-astro` + `prettier-plugin-tailwindcss`

### packages/ui

- `astro` (peer dependency)
- `@astrojs/react`
- `react`, `react-dom`
- `tailwindcss`

### packages/utils

- `zod` (form validation)
- `@directus/sdk` (Directus API client)

### Site template

- `astro`
- `@astrojs/react`
- `@astrojs/tailwind`
- `@astrojs/sitemap`
- `@astrojs/cloudflare`
- `@agency/ui` (workspace dependency)
- `@agency/config` (workspace dependency)
- `@agency/utils` (workspace dependency)

### Infrastructure

- `kamal` (installed on deployment machine, not in repo)
- `docker`, `docker compose` (on VPS)
- `doppler` CLI (in GitHub Actions and local dev)
- `aws` CLI (for S3-compatible backup uploads)

---

## Security

### HTTP headers

Every Astro site deployed to Cloudflare Pages must set security headers. Add a `_headers` file to the `public/` directory of the site template:

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self' https://plausible.io https://cdn.usefathom.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://plausible.io https://api.resend.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

The CSP must be updated per site if additional third-party scripts are needed (Google Analytics, embedded maps, etc.). Keep the default strict and loosen only what is required.

### API route hardening

Every server-side API route (contact forms, calculators, etc.) must include:

**Rate limiting.** Cloudflare Workers do not have built-in rate limiting on the free tier. Implement a simple in-memory counter per IP with a sliding window. For the contact form, 5 submissions per IP per hour is reasonable. If abuse becomes a problem, upgrade to Cloudflare Rate Limiting rules (paid, but cheap).

```typescript
// Simple rate limiting pattern for Cloudflare Workers
// Store in a module-level Map (resets on cold start, which is acceptable for this scale)
const submissions = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = submissions.get(ip);
  if (!record || now > record.resetAt) {
    submissions.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  record.count++;
  return record.count > limit;
}
```

**Input validation.** Already handled by zod schemas. Every API route must validate all inputs before processing. Never trust client-side validation alone.

**CORS.** API routes should only accept requests from the site's own origin. Set `Access-Control-Allow-Origin` to the specific site domain, not `*`.

```typescript
const ALLOWED_ORIGIN = import.meta.env.PUBLIC_SITE_URL;

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin');
  if (origin !== ALLOWED_ORIGIN) {
    return new Response('Forbidden', { status: 403 });
  }
  // ... handle request
};
```

### Directus hardening

After initial deployment of each Directus instance, apply these configurations:

- **Disable public registration.** Set `AUTH_DISABLE_DEFAULT` to `true` in environment variables. Only you create accounts.
- **Restrict CORS.** Set `CORS_ORIGIN` to the specific client site domain and the Directus admin URL. Never use `*`.
- **API token rotation.** The static read-only API token used by Astro at build time should be rotated every 90 days. Add a calendar reminder. Store the token in Doppler and update it there; the next deploy picks it up automatically.
- **File upload restrictions.** In Directus settings, limit upload file types to images only (jpg, png, gif, webp, svg, pdf). Set maximum file size to 10MB. This prevents clients from accidentally uploading executables or other dangerous files.
- **Disable unused Directus features.** Turn off WebSockets if not using real-time features. Turn off GraphQL if only using REST. Fewer endpoints means fewer attack surfaces.
- **Keep Directus updated.** Pin to a specific major version (e.g., `directus/directus:11`) but update the minor/patch version monthly. Check the Directus changelog for security patches.

### Dependency vulnerability scanning

Add `npm audit` to the CI pipeline. Run it on every push, fail the build on critical vulnerabilities.

```yaml
# Add to GitHub Actions workflow
- name: Security audit
  run: npm audit --audit-level=critical
```

Run `npm audit` manually on a weekly schedule as well. Dependabot (built into GitHub) should be enabled on the monorepo to automatically open PRs for vulnerable dependencies.

### Secrets hygiene

- No secrets in Git, ever. Not in `.env` files, not in comments, not in config files. Everything goes through Doppler.
- `.env` is in `.gitignore` at the monorepo root.
- Doppler service tokens used in GitHub Actions have the minimum required scope (read-only on the specific project and environment).
- Admin passwords for Directus instances are unique per client, generated randomly (minimum 20 characters), and stored only in Doppler.

---

## SEO (expanded)

The base template includes structured data, meta tags, Open Graph, sitemaps, and canonical URLs. This section covers the additional SEO requirements not yet specified.

### Dynamic routes

For CMS-driven pages (blog posts, team members, service pages), Astro generates routes dynamically using `getStaticPaths()`. Each dynamic route must:

- Generate a unique, descriptive slug from the content title (handled by Directus slug field)
- Include the full SEO meta (title, description, OG image) pulled from Directus fields on the content item
- Return a 404 for slugs that do not match any published content

```typescript
// sites/client-a/src/pages/blog/[slug].astro
export async function getStaticPaths() {
  const posts = await getPublishedPosts();  // from lib/directus.ts
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}
```

### Pagination

Blog listing pages with more than 10 posts must be paginated. Each paginated page must:

- Have a unique canonical URL (`/blog/`, `/blog/2/`, `/blog/3/`)
- Include `rel="next"` and `rel="prev"` link elements in the head
- Not duplicate content across pages

Use Astro's built-in `paginate()` function in `getStaticPaths()`.

### Redirects

When a page URL changes (client renames a service, slug changes, etc.), add a redirect rule. Cloudflare Pages supports a `_redirects` file in the `public/` directory:

```
/old-page  /new-page  301
/services/old-name  /services/new-name  301
```

Keep a running `_redirects` file in each site. Never delete a URL without adding a redirect.

### Robots and crawl control

The base template includes `robots.txt`. For CMS-backed sites, Directus admin URLs must be excluded:

```
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://example.com/sitemap-index.xml
```

The Directus instance itself should return `X-Robots-Tag: noindex` on all responses. Set this via a Cloudflare Transform Rule on the `cms.*` subdomain.

### Performance as SEO

Google uses Core Web Vitals as a ranking signal. Every site must meet these thresholds:

- LCP (Largest Contentful Paint): under 2.5 seconds
- INP (Interaction to Next Paint): under 200 milliseconds
- CLS (Cumulative Layout Shift): under 0.1

These are measured and enforced through the testing pipeline described below.

---

## Resource management

### VPS capacity planning

Each Directus instance with its Postgres database consumes roughly:

- Idle: approximately 200-300MB RAM
- Under light load (a few editors, build-time API requests): approximately 400-500MB RAM
- CPU: negligible for this workload unless running complex Directus Flows

**Capacity table:**

| VPS tier | RAM | Estimated Directus instances | Monthly cost |
|----------|-----|------------------------------|-------------|
| CX31 | 8GB | 4-6 comfortably | €7.49 |
| CX41 | 16GB | 8-12 comfortably | €14.49 |
| CX51 | 32GB | 15-20 comfortably | €28.49 |

These are conservative estimates. Actual usage depends on how many Directus Flows are configured and how frequently builds trigger API calls.

### Monitoring resource consumption

Install `node-exporter` and `cadvisor` on the VPS to expose system and container metrics. Use Betterstack or Grafana Cloud (free tier: 10,000 series, 14-day retention) to visualise and alert.

**Alerts to configure:**

- Memory usage above 80% of VPS total — warning
- Memory usage above 90% — critical, upgrade VPS immediately
- Disk usage above 75% — warning, clean up or expand
- Any Directus container restarting repeatedly — critical
- CPU sustained above 80% for 10+ minutes — investigate

### Scaling strategy

When the CX31 is no longer sufficient:

1. **Vertical first.** Hetzner lets you resize a VPS with a few minutes of downtime. Move from CX31 to CX41 to CX51 as needed. This is the simplest path and is sufficient up to roughly 15-20 CMS clients.

2. **Horizontal when necessary.** If you exceed 20 CMS clients or a single client has unusually high traffic, split Directus instances across two VPS machines. Kamal supports multiple servers in its config. Move half the clients to a second VPS, update the GitHub Action targets, redeploy. An afternoon of work, not a re-architecture.

3. **Database separation.** If Postgres becomes the bottleneck (unlikely at this scale), move databases to a managed Postgres service (Hetzner does not offer one natively, but Supabase or Neon have free/cheap tiers, or use a dedicated VPS running only Postgres). This is a Phase 3 concern at earliest.

### Cloudflare Workers resource limits

Astro API routes running on Cloudflare Workers (free tier) have these constraints:

- 10ms CPU time per request (not wall clock — network I/O does not count)
- 100,000 requests per day
- 128MB memory

For contact forms and simple calculators, these limits are more than sufficient. If a client needs a heavier interactive feature (e.g., a PDF generator, a complex search), consider whether it should run on the VPS as a separate service instead of on Workers.

---

## Testing

### Testing philosophy

This is a solo operation. The testing strategy must be high-value and low-maintenance. That means: automated checks that catch real problems, run in CI, and do not require manual upkeep. No unit tests for trivial components. No snapshot tests that break on every styling change. Focus on what actually breaks in production.

### Test structure

```
monorepo root
├── tests/
│   ├── e2e/                 Playwright end-to-end tests
│   │   ├── contact-form.spec.ts
│   │   ├── navigation.spec.ts
│   │   ├── cms-content.spec.ts
│   │   └── seo.spec.ts
│   ├── integration/         API route and data fetching tests
│   │   ├── contact-api.test.ts
│   │   └── directus-fetch.test.ts
│   └── lighthouse/          Lighthouse CI configuration
│       └── lighthouserc.json
```

### End-to-end tests (Playwright)

Playwright runs against the built site (either the dev server or the preview build). These tests verify that the site works as a user experiences it.

**Tests that every site must pass:**

```typescript
// tests/e2e/navigation.spec.ts
test('all nav links resolve to real pages', async ({ page }) => {
  await page.goto('/');
  const navLinks = await page.locator('nav a').all();
  for (const link of navLinks) {
    const href = await link.getAttribute('href');
    if (href && href.startsWith('/')) {
      const response = await page.goto(href);
      expect(response?.status()).toBe(200);
    }
  }
});

test('mobile nav opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.click('[data-testid="mobile-menu-toggle"]');
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
});
```

```typescript
// tests/e2e/contact-form.spec.ts
test('contact form validates required fields', async ({ page }) => {
  await page.goto('/contact');
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-testid="error-name"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-email"]')).toBeVisible();
});

test('contact form submits successfully with valid data', async ({ page }) => {
  await page.goto('/contact');
  await page.fill('[name="name"]', 'Test User');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="message"]', 'This is a test message for the contact form.');
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});

test('honeypot field blocks spam submissions', async ({ page }) => {
  await page.goto('/contact');
  await page.fill('[name="name"]', 'Spammer');
  await page.fill('[name="email"]', 'spam@example.com');
  await page.fill('[name="message"]', 'Buy my products now.');
  await page.fill('[name="website"]', 'http://spam.com');  // honeypot field
  await page.click('button[type="submit"]');
  // Should fail validation silently or show generic error
  await expect(page.locator('[data-testid="success-message"]')).not.toBeVisible();
});
```

```typescript
// tests/e2e/seo.spec.ts
test('every page has required meta tags', async ({ page }) => {
  const pages = ['/', '/about', '/contact', '/services'];
  for (const path of pages) {
    await page.goto(path);
    // Title exists and is not empty
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    // Meta description exists
    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(50);
    // Open Graph tags
    expect(await page.getAttribute('meta[property="og:title"]', 'content')).toBeTruthy();
    expect(await page.getAttribute('meta[property="og:description"]', 'content')).toBeTruthy();
    expect(await page.getAttribute('meta[property="og:image"]', 'content')).toBeTruthy();
    // Canonical URL
    expect(await page.getAttribute('link[rel="canonical"]', 'href')).toBeTruthy();
  }
});

test('structured data is valid JSON-LD', async ({ page }) => {
  await page.goto('/');
  const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLd).toBeTruthy();
  const parsed = JSON.parse(jsonLd!);
  expect(parsed['@context']).toBe('https://schema.org');
  expect(parsed['@type']).toBeTruthy();
});

test('sitemap.xml exists and contains pages', async ({ page }) => {
  const response = await page.goto('/sitemap-index.xml');
  expect(response?.status()).toBe(200);
});

test('robots.txt exists and allows crawling', async ({ page }) => {
  const response = await page.goto('/robots.txt');
  expect(response?.status()).toBe(200);
  const text = await response?.text();
  expect(text).toContain('Sitemap:');
});
```

### Integration tests (Vitest)

API routes and data fetching logic are tested with Vitest. These tests run without a browser.

```typescript
// tests/integration/contact-api.test.ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ContactSchema } from '../../packages/utils/src/validation';

describe('ContactSchema', () => {
  it('rejects empty name', () => {
    const result = ContactSchema.safeParse({
      name: '',
      email: 'test@example.com',
      message: 'Hello there, this is a valid message.',
      honeypot: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = ContactSchema.safeParse({
      name: 'Test',
      email: 'not-an-email',
      message: 'Hello there, this is a valid message.',
      honeypot: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-empty honeypot', () => {
    const result = ContactSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      message: 'Hello there, this is a valid message.',
      honeypot: 'spam content',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid submission', () => {
    const result = ContactSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      message: 'Hello there, this is a valid test message.',
      honeypot: '',
    });
    expect(result.success).toBe(true);
  });
});
```

### Lighthouse CI

Run Lighthouse in CI on every deployment to catch performance, accessibility, and SEO regressions.

```json
// tests/lighthouse/lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": [
        "http://localhost:4321/",
        "http://localhost:4321/about",
        "http://localhost:4321/contact"
      ],
      "startServerCommand": "npm run preview --workspace=sites/template"
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
```

Add to GitHub Actions:

```yaml
- name: Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun --config=tests/lighthouse/lighthouserc.json
```

### Accessibility testing

Lighthouse catches many accessibility issues, but not all. Add `axe-core` to Playwright tests for more thorough coverage:

```typescript
// tests/e2e/accessibility.spec.ts
import AxeBuilder from '@axe-core/playwright';

test('home page has no critical accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  expect(results.violations.filter(v => v.impact === 'serious')).toEqual([]);
});
```

Run this test against every page in the site. The base template should ship with zero critical or serious violations. Minor and moderate violations are reviewed manually and fixed where practical.

### CI pipeline

The full test suite runs in GitHub Actions on every push:

```yaml
name: Test
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm audit --audit-level=critical

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx vitest run

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build --workspace=sites/template
      - run: npx playwright test

  lighthouse:
    runs-on: ubuntu-latest
    needs: [e2e-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build --workspace=sites/template
      - run: npm install -g @lhci/cli
      - run: lhci autorun --config=tests/lighthouse/lighthouserc.json
```

### What does not get automated tests

- Visual design correctness (colours, spacing, fonts matching brand guidelines) — this is reviewed manually during the client preview stage
- CMS content quality (spelling, grammar, broken images uploaded by clients) — this is the client's responsibility within the Directus editor
- Third-party service availability (Resend, Plausible, Cloudflare) — covered by uptime monitoring, not tests

---

## Performance

### Build-time optimisation

Astro generates static HTML by default. The primary performance concerns are asset size and loading strategy.

**Images.** Every image on the site must go through Astro's `<Image />` component (for local images) or the Directus asset transformation pipeline (for CMS images). No raw `<img>` tags with unoptimised sources. The `<Image />` component automatically generates WebP/AVIF formats, resizes to the requested dimensions, and adds `width` and `height` attributes to prevent layout shift.

**Fonts.** Use `font-display: swap` on all custom fonts. Preload the primary body font in `BaseLayout.astro`:

```html
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
```

Limit to two font families per site (one heading, one body). Every additional font adds load time. Self-host fonts rather than loading from Google Fonts to avoid the extra DNS lookup and potential privacy issues.

**JavaScript.** Astro's island architecture means JavaScript only ships for interactive components. The base template (nav, footer, content sections) ships zero JavaScript. React islands load only when needed:

- `client:load` — for components that must be interactive immediately (mobile nav toggle)
- `client:visible` — for components below the fold (contact form, cookie consent)
- `client:idle` — for components that can wait until the browser is idle

Never use `client:load` when `client:visible` or `client:idle` would work.

**CSS.** Tailwind's purge removes unused styles at build time. The shipped CSS should be under 15KB gzipped for a typical site. If it is significantly larger, audit for unnecessary utility classes or bloated component styles.

### Runtime performance

**Cloudflare CDN.** Static assets are served from Cloudflare's edge network. Cache headers are set by Cloudflare Pages automatically. For Directus-served images, set cache headers explicitly (see the Directus image handling section).

**Preconnect.** If the site loads resources from external domains (analytics, CMS images), add `<link rel="preconnect">` hints in `BaseLayout.astro`:

```html
<link rel="preconnect" href="https://cms.client.com" crossorigin>
<link rel="preconnect" href="https://plausible.io" crossorigin>
```

### Performance budget

Every site must stay within these budgets, enforced by Lighthouse CI:

| Metric | Budget |
|--------|--------|
| Total page weight (home page) | Under 500KB transferred |
| JavaScript (total, all islands) | Under 100KB gzipped |
| CSS | Under 15KB gzipped |
| LCP | Under 2.5 seconds |
| INP | Under 200 milliseconds |
| CLS | Under 0.1 |
| Lighthouse Performance score | 90 or above |
| Lighthouse Accessibility score | 95 or above |
| Lighthouse SEO score | 95 or above |

If a site exceeds any of these, investigate and fix before shipping.

---

## Accessibility

### Baseline requirements

Every site must meet WCAG 2.1 Level AA. This is not optional and not negotiable with clients. It is a legal requirement in many jurisdictions and the right thing to do.

### Implementation in the template

The base template and shared components handle most accessibility requirements by default:

**Semantic HTML.** Use `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<header>`, `<footer>` correctly. No `<div>` soup. The layout components enforce this structure.

**Skip to content link.** `BaseLayout.astro` includes a visually hidden "Skip to main content" link as the first focusable element:

```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-primary-700">
  Skip to main content
</a>
```

**Heading hierarchy.** Every page has exactly one `<h1>`. Headings follow a logical order (`h1` then `h2` then `h3`, never skipping levels). The SEO Playwright tests should verify this.

**Colour contrast.** When defining the colour palette in `tailwind.config.mjs`, verify that text colours against background colours meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text). Use a contrast checker during theme setup.

**Focus indicators.** Tailwind's default focus ring (`ring`) must be visible on all interactive elements. Never remove focus outlines without providing a visible alternative. The base config should include:

```javascript
// In tailwind.base.mjs
theme: {
  extend: {
    ringColor: {
      DEFAULT: 'currentColor',
    },
    ringWidth: {
      DEFAULT: '2px',
    },
  },
},
```

**Alt text.** Every `<Image />` component requires an `alt` prop. Decorative images use `alt=""`. In Directus, the image field includes a required `alt_text` field that editors must fill in before publishing.

**Form accessibility.** The `ContactForm.tsx` island must:

- Associate every input with a `<label>` using `htmlFor`/`id`
- Use `aria-describedby` to link error messages to their inputs
- Announce form errors to screen readers using `aria-live="polite"` on the error container
- Not rely on colour alone to indicate errors (add text and/or icons)

**Keyboard navigation.** All interactive elements (links, buttons, form fields, mobile menu) must be operable with keyboard only. The mobile nav must trap focus when open and return focus to the toggle button when closed.

### Testing

Accessibility is tested through three mechanisms:

1. **axe-core in Playwright** (automated, runs in CI) — catches structural issues, missing alt text, contrast failures, ARIA misuse
2. **Lighthouse accessibility audit** (automated, runs in CI) — broader check including document structure, heading order, link text
3. **Manual keyboard testing** (during client preview) — verify tab order, focus visibility, and screen reader experience on key pages

---

## What this document does not cover

- Visual design mockups or brand guidelines for specific clients
- Directus collection schemas beyond the standard set (these are configured per client through the admin UI)
- Specific Cloudflare Workers logic beyond the contact form pattern
- Pricing negotiation or client communication processes
- Legal contract language

These are handled outside the codebase through separate processes.
