# Nikolas Petrou (videoshoot) — Claude Code Reference

Videographer & content creator portfolio site. Custom design with CMS-powered content via Directus.

## Live URLs

| Service | URL |
|---------|-----|
| Website | https://nikolaspetrou.com |
| CMS Admin | https://cms.nikolaspetrou.com/admin |
| Staging Preview | https://nikolaspetrou.com/staging/?token=PREVIEW_TOKEN |
| Workers Dev | https://nikolaspetrou.stepet.workers.dev |

## Key files

- `site.config.ts` — site identity, nav, footer, SEO, theme settings
- `src/styles/global.css` — brand tokens (dark/cinematic palette)
- `src/lib/directus.ts` — Directus client with typed collections, published + staging fetch functions
- `src/pages/preview/[collection]/[id].astro` — SSR per-item preview route
- `src/pages/staging/` — SSR full-site staging preview (5 routes mirroring all live pages)
- `.env` — build-time secrets (DIRECTUS_URL, DIRECTUS_TOKEN, PREVIEW_TOKEN)
- `wrangler.toml` — Cloudflare Workers config with custom domains
- `public/_headers` — security headers including CSP allowing CMS iframe embedding

## Tier: CMS

CMS powered by Directus 11.17 on Hetzner VPS (Docker).

- **Docker config:** `infra/docker/nikolaspetrou/`
- **VPS port:** 8057
- **CMS domain:** `cms.nikolaspetrou.com` (via Cloudflare Tunnel)
- **Schema snapshot:** `infra/docker/nikolaspetrou/snapshot.yaml`
- **Database backup:** `infra/docker/nikolaspetrou/backup-pre-upgrade.sql` (taken before 11.5→11.17 upgrade)

## CMS Collections

| Collection | Type | Description |
|------------|------|-------------|
| `projects` | List | Portfolio projects (title, slug, subtitle, description, video_url, client, year, category, featured_in_hero, hero_sort_order, gallery) |
| `services` | List | Service offerings (title, description, tags, icon, video_url) |
| `testimonials` | List | Client testimonials (name, role, quote, video_url, image) |
| `reels` | List | Instagram reels (url, image, date_label) |
| `hero` | Singleton | Hero section content (eyebrow, heading, subheading, CTAs, background video/poster) |
| `about` | Singleton | About page content (heading, subheading, description, cta_text, values_heading, values_description) |
| `site_settings` | Singleton | Site-wide settings (name, tagline, email, SEO, social URLs) |

All collections have `status` (published/draft, default: `draft`) and `sort_order` fields.

**Note:** The code in `directus.ts` references `site_settings` (not `settings`) — this matches the Directus collection name.

## CMS Users

| Email | Role | Access |
|-------|------|--------|
| hello@infront.cy | Administrator | Full admin/superuser |
| nikolaspetrouu@hotmail.com | Editor | CRUD on all content collections + files. No access to schema, roles, or system settings. |

Admin password was set via `directus users passwd` CLI. Editor can reset via email (Resend SMTP on port 587).

## CMS → Site Data Flow

### Live site (static, build-time)

All public pages fetch from Directus at **build time** using `getPublishedItems()` — only items with `status: published` are included. The live site is fully static with no runtime CMS calls.

| Page | CMS Functions Used |
|------|-------------------|
| `index.astro` | `getHero()`, `getProjects()`, `getServices({limit:3})`, `getTestimonials()`, `getReels()` |
| `about.astro` | `getAbout()`, `getProjects()` |
| `services.astro` | `getServices()` |
| `works/index.astro` | `getProjects()` |
| `works/[slug].astro` | `getProjects()` via `getStaticPaths()` |
| `contact.astro` | No CMS (uses site.config.ts) |

### Staging site (SSR, real-time)

Staging routes at `/staging/*` fetch ALL items (published + draft) using `stagingGet*()` functions that call `getAllItems()` (no status filter). These are SSR routes — they fetch fresh data from the CMS on every request.

| Staging Route | Mirrors | CMS Functions |
|---------------|---------|---------------|
| `/staging/` | Homepage | `stagingGetHero()`, `stagingGetProjects()`, `stagingGetServices()`, `stagingGetTestimonials()`, `stagingGetReels()` |
| `/staging/about` | About page | `stagingGetAbout()`, `stagingGetProjects()` |
| `/staging/services` | Services page | `stagingGetServices()` |
| `/staging/works` | Works listing | `stagingGetProjects()` |
| `/staging/works/[slug]` | Project detail | `stagingGetProjects()` then find by slug |

### Data fetch hierarchy

```
@agency/utils/directus.ts
├── getPublishedItems()  — filter: status = 'published'  → used by live static pages
├── getAllItems()         — no status filter              → used by staging SSR routes
└── getItemBySlug()      — filter by slug                → general utility

sites/videoshoot/src/lib/directus.ts
├── getProjects(), getServices(), etc.         → call getPublishedItems() → live pages
├── stagingGetProjects(), stagingGetServices()  → call getAllItems()      → staging pages
└── client                                     → createDirectusClient(url, token)
```

## Publishing Workflow

The site uses a **draft-first workflow**. All saves default to draft status. The live site is unaffected until Nikolas explicitly publishes.

### Nikolas's workflow

```
1. Edit content in cms.nikolaspetrou.com/admin
2. Save → item saved as draft (default status)
3. Per-item preview panel updates immediately (SSR fetch on save)
4. Open staging preview in new tab to see the full site with all drafts
5. When satisfied → click "Publish to live" Flow in sidebar
6. All drafts bulk-updated to published → site rebuilds → live in ~30s
```

### What happens at each step

**Saving:** New items default to `status: draft`. The `status` field default was changed from `published` to `draft` on all 7 collections via the Directus API.

**Per-item preview:** Directus reloads the preview iframe after each save. The SSR preview route (`/preview/[collection]/[id]`) fetches the item directly by ID from the Directus API (no status filter — shows draft content). The preview renders using the same Astro components as the live pages.

**Staging preview:** The full staging site at `/staging/*` mirrors every page of the live site but fetches ALL items regardless of status. Nikolas can navigate the entire site and see how all draft changes look together.

**Publishing:** The "Publish to live" Directus Flow (manual trigger with confirmation) chains 8 operations:
1. `publish_projects` → PATCH all draft projects to published
2. `publish_services` → PATCH all draft services to published
3. `publish_testimonials` → PATCH all draft testimonials to published
4. `publish_reels` → PATCH all draft reels to published
5. `publish_hero` → PATCH hero to published
6. `publish_about` → PATCH about to published
7. `publish_site_settings` → PATCH site_settings to published
8. `trigger_rebuild` → POST to `https://web.infront.cy/api/sites/videoshoot/redeploy`

Each publish operation calls `PATCH /items/{collection}?filter[status][_eq]=draft` with `{"status": "published"}` using a static API token.

### Important notes
- The live site only shows published items — draft items are invisible on the live site
- Staging shows everything (draft + published) — this is the "preview before going live" environment
- The "Publish to live" Flow is the only way to push changes live — there is no auto-rebuild on save
- Rebuilds take ~30 seconds (Astro build + wrangler deploy)

## Preview System

### Per-item preview (Directus side panel)

When editing any item in Directus, the right-side preview panel shows an SSR-rendered preview of that item.

**How it works:**
1. Directus embeds the preview URL in an iframe
2. On save, Directus reloads the iframe
3. The SSR route fetches the item by ID from the API (shows latest saved data, including drafts)
4. The route renders using the same components as the live pages

**Preview URL templates** (configured in Directus collection settings):

| Collection | Preview URL |
|------------|-------------|
| projects | `/preview/projects/{{id}}?token=...` (project detail page) |
| services | `/preview/services/{{id}}?token=...` (service card) |
| testimonials | `/preview/testimonials/{{id}}?token=...` (testimonial card) |
| reels | `/preview/reels/{{id}}?token=...` (reel link) |
| hero | `/staging/?token=...` (full homepage) |
| about | `/staging/about?token=...` (full about page) |
| site_settings | `/staging/?token=...` (full homepage) |

**Note:** Singletons (hero, about, site_settings) use the staging routes for preview so Nikolas sees the content in context of the full page.

### Full staging preview (new tab)

URL: `https://nikolaspetrou.com/staging/?token=PREVIEW_TOKEN`

Opens the full website rendered with all draft + published content. Nikolas can navigate freely across all pages to review everything before publishing.

All staging routes are:
- `export const prerender = false` (SSR)
- Token-protected (`?token=` query param)
- Use the same Astro components as live pages
- Fetch data via `stagingGet*()` functions (no status filter)
- Show a blue "Staging Preview — Draft content, not live" banner at the top

### Security (CSP configuration)

Three CSP configurations work together to enable preview iframes:

**On the website** (`public/_headers`):
```
frame-ancestors 'self' https://cms.nikolaspetrou.com
```
Allows the CMS to embed site pages in iframes. `X-Frame-Options: DENY` was removed (conflicts with `frame-ancestors`).

**On SSR routes** (response headers set in Astro):
```
Content-Security-Policy: frame-ancestors https://cms.nikolaspetrou.com
X-Frame-Options: ALLOWALL
```

**On Directus** (docker-compose.yml env var):
```
CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC: "'self' https://nikolaspetrou.com"
```
Allows Directus admin to load nikolaspetrou.com in its preview iframe.

### Preview token

All preview/staging routes are protected by `PREVIEW_TOKEN` (set in `.env`, default: `np-preview-2026-secret`). Without the correct `?token=` parameter, routes return 401 Unauthorized.

### Visual editing

The preview page includes the `@directus/visual-editing` library (v2, loaded via CDN). Elements marked with `data-directus` attributes can be clicked for in-place editing via popover. On save, the preview reloads.

## MCP Server

Directus MCP is enabled (`mcp_enabled: true`). Connect Claude Code or other AI tools:

```
URL: https://cms.nikolaspetrou.com/mcp?access_token=<DIRECTUS_TOKEN>
```

This lets AI assistants read/write CMS content, manage schema, and create flows — all respecting the connected user's permissions. Requires Directus 11.12+ (we run 11.17).

## Deployment

- **Platform:** Cloudflare Workers (hybrid SSR via `@astrojs/cloudflare`)
- **Output:** Static pages prerendered at build time + SSR for `/preview/*` and `/staging/*` routes
- **Compatibility flags:** `nodejs_compat` (required for Directus SDK in Workers runtime)
- **Custom domains:** `nikolaspetrou.com`, `www.nikolaspetrou.com`
- **Environment:** `.env` file with `DIRECTUS_URL`, `DIRECTUS_TOKEN`, `PREVIEW_TOKEN`

### Deploy commands

```bash
# Local build + deploy
cd sites/videoshoot && npm run build && npx wrangler deploy

# Via admin API (what the "Publish to live" Flow triggers)
POST https://web.infront.cy/api/sites/videoshoot/redeploy
```

### VPS deploy metadata

The redeploy endpoint requires `.deploy.json` in `sites/videoshoot/` on the VPS. This was created manually with:
```json
{
  "projectName": "nikolaspetrou",
  "stagingUrl": "https://nikolaspetrou.stepet.workers.dev",
  "productionUrl": "https://nikolaspetrou.com",
  "status": "live"
}
```

The VPS also has `.env` at `/opt/infront-cms/sites/videoshoot/.env` with `DIRECTUS_URL`, `DIRECTUS_TOKEN`, and `PREVIEW_TOKEN` for build-time access.

## Directus Infrastructure

### Docker (VPS)

- **docker-compose.yml:** `infra/docker/nikolaspetrou/docker-compose.yml`
- **.env:** `infra/docker/nikolaspetrou/.env` (PORT, KEY, SECRET, DB creds, email config, S3 storage)
- **Port:** 8057 (mapped from container 8055)
- **Image:** `directus/directus:11.17` (upgraded from 11.5 on 2026-03-25)
- **Database:** PostgreSQL 16 Alpine (separate container, named volume `db_data`)
- **Storage:** Cloudflare R2 (`infront-uploads` bucket, `nikolaspetrou/` prefix)
- **Extensions volume:** `directus_extensions` (currently empty — the broken live-preview-sync extension was removed)

### Email

Transactional emails (password resets, invites) via Resend SMTP:
- **Port:** 587 (STARTTLS) — **port 465 is blocked on Hetzner VPS**
- **From:** noreply@infront.cy
- **Config:** `EMAIL_SMTP_HOST=smtp.resend.com`, `EMAIL_SMTP_PORT=587`, `EMAIL_SMTP_SECURE=false`
- **Important:** EMAIL_* env vars must be explicitly listed in docker-compose.yml `environment:` section — they are NOT auto-passed from `.env`

### Tunnel

CMS exposed via Cloudflare Tunnel (`infront-admin` tunnel):
- **Config:** `/etc/cloudflared/config.yml` on VPS
- **Ingress rule:** `hostname: cms.nikolaspetrou.com` → `http://localhost:8057`
- **DNS:** CNAME record in `nikolaspetrou.com` Cloudflare zone → `171f0ba5-9933-4b3a-b537-8681db4ad0a8.cfargotunnel.com`

### Directus Flows

| Flow | Trigger | What it does |
|------|---------|-------------|
| Publish to live | Manual (with confirmation) | Bulk-publishes all draft items across all 7 collections, then triggers site rebuild via admin API |

The "Auto-draft on edit" flow was created and later removed — it used the wrong operation type (`transform` instead of `exec`) and didn't actually modify data.

## Design

- Dark, cinematic aesthetic with fullscreen video hero
- Custom interactive hero component (`HeroInteractive.tsx` — React island)
- Video-forward: service cards, project cards, testimonials all feature video
- Mobile: touch-friendly video interactions (tap to play/pause)
- Fonts and colours defined in `src/styles/global.css`

## History of changes (2026-03-25)

This site was fully deployed and configured in a single session:

1. **Site deployment** — deployed to nikolaspetrou.com via Cloudflare Workers
2. **CMS domain** — exposed cms.nikolaspetrou.com via Cloudflare Tunnel
3. **CMS collections** — restored from schema snapshot, seeded with hardcoded content
4. **CMS users** — admin (hello@infront.cy) + editor (nikolaspetrouu@hotmail.com)
5. **Email** — configured Resend SMTP (port 587, after discovering 465 blocked on Hetzner)
6. **Page wiring** — all 5 page templates switched from hardcoded data to CMS fetch
7. **Hybrid SSR** — added @astrojs/cloudflare adapter for preview/staging routes
8. **Per-item preview** — SSR route rendering each collection with real page components
9. **CSP fixes** — multiple iterations to allow CMS↔site iframe embedding
10. **Manual publish** — Directus Flow replacing auto-rebuild webhook
11. **Directus upgrade** — 11.5 → 11.17 for visual editing and MCP support
12. **Visual editing** — @directus/visual-editing library added to preview
13. **MCP server** — enabled for AI-assisted content management
14. **Draft-first workflow** — default status changed to draft, staging preview routes created
15. **Staging site** — 5 SSR routes mirroring all live pages with draft content
