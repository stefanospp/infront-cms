# AbroadJobs.eu — Claude Code Reference

Job board for relocation jobs. Employers pay EUR 89/listing via Stripe. Job seekers browse for free.

## Architecture
- **Astro 6 hybrid** — static prerendering + SSR via `@astrojs/cloudflare` adapter
- **Cloudflare D1** — SQLite database with FTS5 for search
- **Drizzle ORM** — type-safe queries
- **Stripe Checkout** — one-time payment, webhook activates jobs
- **Resend** — confirmation email to employers

## Key files
- `site.config.ts` — site identity, nav, footer, SEO
- `src/styles/global.css` — Tailwind @theme tokens (slate blue, clean grays)
- `src/lib/schema.ts` — Drizzle schema (jobs table)
- `src/lib/db.ts` — D1 client helper
- `src/lib/stripe.ts` — Stripe client + checkout session creation
- `src/lib/email.ts` — Resend confirmation email
- `src/lib/validation.ts` — Zod schemas for job form and search
- `src/layouts/SiteLayout.astro` — custom layout using local Nav/Footer
- `wrangler.toml` — D1 binding, nodejs_compat flag

## Pages
| Page | Type | Route |
|------|------|-------|
| Homepage | SSR | `/` |
| Job detail | SSR | `/jobs/[slug]` |
| Post a job | SSR | `/post` |
| Payment success | SSR | `/success` |
| About | Static | `/about` |
| Pricing | Static | `/pricing` |
| Privacy | Static | `/privacy` |
| Terms | Static | `/terms` |
| Sitemap | SSR | `/sitemap.xml` |

## API routes
- `GET /api/jobs` — search/filter/paginate jobs
- `POST /api/checkout` — create Stripe Checkout session + pending jobs
- `POST /api/webhook` — Stripe webhook (activate jobs, send email)

## Database
Single `jobs` table in D1 with FTS5 virtual table for full-text search.
- Migration: `drizzle/0000_initial.sql`
- Seed data: `drizzle/0001_seed.sql`

## Environment variables (secrets)
- `STRIPE_SECRET_KEY` — Stripe API key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `RESEND_API_KEY` — Resend email API key

## Commands
```bash
# Dev
pnpm astro dev

# Build
pnpm astro build

# Apply migration (local)
wrangler d1 execute abroad-jobs-db --local --file=./drizzle/0000_initial.sql

# Seed data (local)
wrangler d1 execute abroad-jobs-db --local --file=./drizzle/0001_seed.sql

# Deploy
wrangler pages deploy ./dist/client
```
