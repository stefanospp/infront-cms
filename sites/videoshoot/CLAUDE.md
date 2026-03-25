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

CMS powered by Directus 11.17 on Hetzner VPS (Docker).

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

The site is static — CMS changes only go live after a rebuild. The workflow:

1. **Edit:** Nikolas edits content in `cms.nikolaspetrou.com/admin`
2. **Preview:** The preview panel shows a live SSR render of the draft content (updates immediately on save, no rebuild needed)
3. **Publish:** When satisfied, Nikolas triggers the **"Publish to live"** Directus Flow (manual trigger in the admin sidebar, with confirmation dialog)
4. **Rebuild:** The Flow POSTs to `https://web.infront.cy/api/sites/videoshoot/redeploy`
5. **Live:** The admin server rebuilds the static site and deploys via `wrangler deploy` (~30 seconds)

**Design decisions:**
- Auto-rebuild on every save was intentionally removed to prevent excessive rebuilds during editing sessions
- The manual "Publish to live" flow gives Nikolas control over when changes go live
- Preview is real-time (SSR) so Nikolas can review changes before triggering a rebuild
- The Directus Flow has `requireConfirmation: true` so it can't be triggered accidentally

## Live Preview (CMS)

The Directus admin shows a **live draft preview** panel when editing any item. The preview is server-side rendered (SSR) — it fetches the current CMS data on every request, including unsaved draft changes.

### How it works

1. Directus embeds `https://nikolaspetrou.com/preview/[collection]/[id]?token=PREVIEW_TOKEN` in an iframe
2. The SSR route fetches the item directly from the Directus API (no status filter — shows drafts)
3. The route renders using the **same Astro components** as the live pages (Hero, ServiceCard, ValuesSection, etc.)
4. Nikolas sees changes reflected immediately in the preview panel without needing a rebuild

### Real-time updates (postMessage)

The `directus-extension-post-message-preview` extension is installed in the Directus container. It sends unsaved form values to the preview iframe via `postMessage` as the user types:

```json
{ "type": "directus-preview", "values": { "title": "...", "video_url": "...", ... } }
```

The preview page listens for these messages and updates DOM elements matched by `data-field` attributes (300ms debounce). This means:
- **Text fields** (title, subtitle, client, year, etc.) update as you type
- **Video URLs** update when pasted (via `data-video-field` on `<video>` elements)
- No save required — changes appear in ~300ms

**Extension location:** `/var/lib/docker/volumes/nikolaspetrou_directus_extensions/_data/directus-extension-live-preview-sync/`

### Visual editing (in-place)

The preview page includes the `@directus/visual-editing` library (v2, loaded via CDN). Elements marked with `data-directus` attributes become clickable for in-place editing:

```html
<div data-directus="collection:projects;item:{id};fields:client;mode:popover">
  <p>Personal Project</p>
</div>
```

When clicked, a Directus popover editor opens. On save, the preview reloads via `onSaved` callback. This requires Directus 11.16+ (we run 11.17).

### MCP server

Directus MCP is enabled (`mcp_enabled: true`). Connect Claude Code or other AI tools:

```
URL: https://cms.nikolaspetrou.com/mcp?access_token=<DIRECTUS_TOKEN>
```

This lets AI assistants read/write CMS content, manage schema, and create flows — all respecting the connected user's permissions.

### Preview URLs (configured in Directus collection settings)

| Collection | Directus Preview URL Template |
|------------|-------------------------------|
| projects | `https://nikolaspetrou.com/preview/projects/{{id}}?token=...` |
| services | `https://nikolaspetrou.com/preview/services/{{id}}?token=...` |
| testimonials | `https://nikolaspetrou.com/preview/testimonials/{{id}}?token=...` |
| reels | `https://nikolaspetrou.com/preview/reels/{{id}}?token=...` |
| hero | `https://nikolaspetrou.com/preview/hero/{{id}}?token=...` |
| about | `https://nikolaspetrou.com/preview/about/{{id}}?token=...` |
| site_settings | `https://nikolaspetrou.com/preview/site_settings/{{id}}?token=...` |

### What each collection preview renders

| Collection | Renders as |
|------------|------------|
| projects | Full project detail page — Hero with category/year, 16:9 video player, sidebar (client, year, category), HTML description. Mirrors `works/[slug].astro` exactly. |
| hero | Interactive hero section (`HeroInteractive` React island) with eyebrow, heading, subheading, CTAs, background video. |
| about | About page — Hero, featured image, ValuesSection with heading/description. Mirrors `about.astro`. |
| services | Services page — Hero, service card with title, description, tags. Mirrors `services.astro`. |
| testimonials | Dark-background testimonial card with quote, name, role, and video player. |
| reels | Reel link card with Instagram URL and date label. |
| site_settings | Settings overview showing name, tagline, email, SEO fields, and social URLs. |

### Security (CSP configuration)

Two CSP configurations work together to enable the preview iframe:

**On the website** (`public/_headers`):
- `frame-ancestors 'self' https://cms.nikolaspetrou.com` — allows the CMS to embed site pages in iframes
- `X-Frame-Options: DENY` was removed (conflicts with `frame-ancestors` CSP)

**On the SSR preview route** (response headers set in Astro):
- `Content-Security-Policy: frame-ancestors https://cms.nikolaspetrou.com`
- `X-Frame-Options: ALLOWALL`

**On Directus** (docker-compose.yml env var):
- `CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC: "'self' https://nikolaspetrou.com"` — allows Directus admin to load nikolaspetrou.com in its preview iframe

### Preview token

The preview route is protected by `PREVIEW_TOKEN` (set in `.env`). Without the correct `?token=` query parameter, the route returns 401 Unauthorized.

### Key file

`src/pages/preview/[collection]/[id].astro` — SSR route (`export const prerender = false`) that handles all collection previews in a single file with collection-specific rendering logic.

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
