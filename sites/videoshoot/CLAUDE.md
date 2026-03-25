# Nikolas Petrou (videoshoot) — Claude Code Reference

Videographer & content creator portfolio site. Custom design with CMS-powered content via Directus.

## Live URLs

| Service | URL |
|---------|-----|
| Website | https://nikolaspetrou.com |
| CMS Admin | https://cms.nikolaspetrou.com/admin |
| Workers Dev | https://nikolaspetrou.stepet.workers.dev |

## Key files

- `site.config.ts` — site identity, nav, footer, SEO, theme settings
- `src/styles/global.css` — brand tokens (dark/cinematic palette)
- `src/lib/directus.ts` — Directus client with typed collections and fetch functions
- `src/pages/preview/[collection]/[id].astro` — SSR preview route for CMS live preview
- `.env` — build-time secrets (DIRECTUS_URL, DIRECTUS_TOKEN, PREVIEW_TOKEN)
- `wrangler.toml` — Cloudflare Workers config with custom domains

## Tier: CMS

CMS powered by Directus 11.5 on Hetzner VPS (Docker).

- **Docker config:** `infra/docker/nikolaspetrou/`
- **VPS port:** 8057
- **CMS domain:** `cms.nikolaspetrou.com` (via Cloudflare Tunnel)
- **Schema snapshot:** `infra/docker/nikolaspetrou/snapshot.yaml`

## CMS Collections

| Collection | Type | Description |
|------------|------|-------------|
| `projects` | List | Portfolio projects (title, slug, subtitle, description, video_url, client, year, category) |
| `services` | List | Service offerings (title, description, tags, icon, video_url) |
| `testimonials` | List | Client testimonials (name, role, quote, video_url, image) |
| `reels` | List | Instagram reels (url, image, date_label) |
| `hero` | Singleton | Hero section content (eyebrow, heading, subheading, CTAs, background video) |
| `about` | Singleton | About page content (heading, subheading, description, values) |
| `site_settings` | Singleton | Site-wide settings (name, tagline, email, SEO, social URLs) |

All list collections have `status` (published/draft) and `sort_order` fields.

**Note:** The code in `directus.ts` references `site_settings` (not `settings`) — this matches the Directus collection name.

## CMS Users

| Email | Role | Access |
|-------|------|--------|
| hello@infront.cy | Administrator | Full admin/superuser |
| nikolaspetrouu@hotmail.com | Editor | CRUD on all content collections + files. No access to schema, roles, or system settings. |

Admin password was set via `directus users passwd` CLI. Editor can reset via email (Resend SMTP on port 587).

## CMS → Site Data Flow

All pages fetch from Directus at **build time** (static site generation). The site is fully static — no runtime CMS calls on public pages.

| Page | CMS Functions Used |
|------|-------------------|
| `index.astro` | `getHero()`, `getProjects()`, `getServices({limit:3})`, `getTestimonials()`, `getReels()` |
| `about.astro` | `getAbout()`, `getProjects()` |
| `services.astro` | `getServices()` |
| `works/index.astro` | `getProjects()` |
| `works/[slug].astro` | `getProjects()` via `getStaticPaths()` |
| `contact.astro` | No CMS (uses site.config.ts) |

## Publishing Workflow

Content changes require a rebuild to go live:

1. Nikolas edits content in `cms.nikolaspetrou.com/admin`
2. Uses the preview panel to see the current live page
3. When ready, triggers the **"Publish to live"** Directus Flow (manual trigger with confirmation)
4. The Flow POSTs to `https://web.infront.cy/api/sites/videoshoot/redeploy`
5. The admin server rebuilds and deploys via `wrangler deploy` (~30 seconds)

**Important:** The auto-rebuild on every save was intentionally removed. Only the manual "Publish to live" flow triggers a rebuild.

## Live Preview (CMS)

The Directus admin shows a preview panel when editing items. Preview URLs point to the **actual live pages** on nikolaspetrou.com (pixel-perfect):

| Collection | Preview URL |
|------------|-------------|
| projects | `https://nikolaspetrou.com/works/{{slug}}` |
| hero | `https://nikolaspetrou.com/` |
| about | `https://nikolaspetrou.com/about` |
| services | `https://nikolaspetrou.com/services` |
| testimonials | `https://nikolaspetrou.com/` |
| reels | `https://nikolaspetrou.com/` |
| site_settings | `https://nikolaspetrou.com/` |

The site's CSP allows `frame-ancestors 'self' https://cms.nikolaspetrou.com` so Directus can embed pages in its preview iframe.

Directus also has `CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC: "'self' https://nikolaspetrou.com"` set to allow loading the site in its admin iframe.

There is also an SSR preview route at `/preview/[collection]/[id]?token=PREVIEW_TOKEN` for draft content preview. This route is protected by a token and renders collection-specific layouts.

## Deployment

- **Platform:** Cloudflare Workers (hybrid SSR via `@astrojs/cloudflare`)
- **Output:** Static pages prerendered at build time + SSR for `/preview/*` routes
- **Compatibility flags:** `nodejs_compat` (required for Directus SDK)
- **Custom domains:** `nikolaspetrou.com`, `www.nikolaspetrou.com`
- **Environment:** `.env` file with `DIRECTUS_URL`, `DIRECTUS_TOKEN`, `PREVIEW_TOKEN`

### Deploy commands

```bash
# Local build + deploy
npm run build --workspace=sites/videoshoot
cd sites/videoshoot && npx wrangler deploy

# Via admin API (what the CMS Flow triggers)
POST https://web.infront.cy/api/sites/videoshoot/redeploy
```

## Directus Infrastructure

### Docker (VPS)

- **docker-compose.yml:** `infra/docker/nikolaspetrou/docker-compose.yml`
- **.env:** `infra/docker/nikolaspetrou/.env` (PORT, KEY, SECRET, DB creds, email config, S3 storage)
- **Port:** 8057 (mapped from container 8055)
- **Database:** PostgreSQL 16 Alpine
- **Storage:** Cloudflare R2 (`infront-uploads` bucket, `nikolaspetrou/` prefix)

### Email

Transactional emails (password resets, invites) via Resend SMTP:
- **Port:** 587 (STARTTLS) — port 465 is blocked on Hetzner
- **From:** noreply@infront.cy
- **Config:** `EMAIL_SMTP_HOST=smtp.resend.com`, `EMAIL_SMTP_PORT=587`, `EMAIL_SMTP_SECURE=false`

### Tunnel

CMS exposed via Cloudflare Tunnel (`infront-admin` tunnel):
- **Config:** `/etc/cloudflared/config.yml` on VPS
- **Ingress rule:** `hostname: cms.nikolaspetrou.com` → `http://localhost:8057`
- **DNS:** CNAME record in `nikolaspetrou.com` zone → tunnel UUID

## Design

- Dark, cinematic aesthetic with fullscreen video hero
- Custom interactive hero component (`HeroInteractive.tsx` — React island)
- Video-forward: service cards, project cards, testimonials all feature video
- Mobile: touch-friendly video interactions (tap to play/pause)
- Fonts and colours defined in `src/styles/global.css`
