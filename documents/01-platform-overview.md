# Platform Overview

## What This Is

A monorepo platform for running a solo web agency. Each client gets an Astro 6 static site deployed to Cloudflare Workers. CMS clients get a Directus 11 instance on Hetzner via Docker. Shared UI components, config, and utilities live in packages.

The platform includes a **visual editor** (Shopify-style) for managing sites through a browser-based three-panel interface, and an **admin dashboard** for site creation, deployment, and management.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Admin Dashboard (Hetzner)           │
│  Astro 6 SSR + React Islands + @astrojs/node    │
│                                                  │
│  - Site wizard (5-step creation flow)            │
│  - Visual editor (three-panel layout)            │
│  - Deploy management                             │
│  - Media library                                 │
│  - Site config editor                            │
│  - Version history                               │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│           Client Sites (Cloudflare Workers)      │
│  Astro 6 static output + wrangler.toml [assets]  │
│                                                  │
│  - Generated from templates                      │
│  - Shared UI components from @agency/ui          │
│  - Brand tokens via Tailwind v4 @theme           │
│  - Deployed via `wrangler deploy`                │
└─────────────────────────────────────────────────┘
```

## Monorepo Structure

```
infront-cms/
├── packages/
│   ├── config/          # TypeScript types, component registry, templates
│   ├── ui/              # Shared Astro components and React islands
│   └── utils/           # SEO, image, Directus client, Vite plugins, compiler/parser
├── sites/
│   ├── admin/           # Admin dashboard (SSR, Hetzner)
│   ├── template/        # Base site — copied for every new client
│   └── <client>/        # Generated client sites
├── infra/
│   ├── admin/           # PM2 + Caddy config for admin deployment
│   ├── docker/          # Directus Docker Compose (one per CMS client)
│   ├── backups/         # Database and upload backup scripts
│   └── provisioning/    # CLI provisioning script
├── tests/               # Vitest integration tests
├── documents/           # Platform documentation
└── docs/                # Architecture blueprint
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 6 (static output for sites, SSR for admin) |
| Styling | Tailwind CSS v4 (CSS-based config via `@theme`) |
| Islands | React 18 (forms, mobile nav, editor UI, cookie consent) |
| CMS | Directus 11 (PostgreSQL, Docker, Kamal) |
| Hosting — Sites | Cloudflare Workers (static assets) |
| Hosting — Admin | Hetzner VPS (PM2 + Caddy) |
| Hosting — CMS | Hetzner VPS (Docker) |
| Email | Resend (contact forms) |
| Secrets | Doppler |
| Monitoring | Betterstack (uptime), Sentry (errors) |
| CI/CD | GitHub Actions |

## Key Concepts

### Site Tiers

| Tier | Description |
|------|-------------|
| Static | HTML/CSS/JS only, no CMS backend |
| CMS | Directus-powered content management |
| Interactive | CMS + dynamic features |

### Templates

5 templates available: Business Starter, Restaurant, Portfolio, SaaS, Professional. Each defines default pages, theme tokens, nav structure, and component variants.

### Component System

22 shared components in `@agency/ui` (19 Astro + 3 React islands). Components accept `variant` props for visual flexibility and read brand tokens from Tailwind CSS theme variables.

### Page Schema

Pages are represented as JSON schemas that the visual editor reads/writes. A compiler converts schemas to `.astro` files. A parser can reverse-engineer `.astro` files into schemas.

### Deploy Pipeline

```
Generate site → Build (astro build) → Deploy (wrangler deploy) → Live on Workers
```
