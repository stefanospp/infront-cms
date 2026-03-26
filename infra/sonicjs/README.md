# SonicJs CMS — Pilot Evaluation

## Status

Pilot deployment on the **Theorium** site to evaluate SonicJs as a Directus replacement. The Directus instance remains running — this is a parallel test.

## What SonicJs is

An edge-native headless CMS built for Cloudflare Workers. Runs on D1 (SQLite), R2 (storage), and KV (caching). Admin UI included at `/admin`. REST API auto-generated from collection schemas.

- **Repo:** https://github.com/SonicJs-Org/sonicjs
- **Docs:** https://sonicjs.com
- **Version:** 2.8.0

## Architecture

```
Cloudflare Workers (single deployment)
├── SonicJs CMS API (/api/*)
├── Admin UI (/admin/*)
├── Auth (/auth/*)
├── D1 Database (collections, content, users, plugins)
├── R2 Bucket (media uploads)
└── KV Namespace (three-tier cache)
```

No Docker, no PostgreSQL, no VPS. The CMS runs on the same platform as the sites.

## Current setup (Theorium pilot)

### CMS project

Location: `infra/sonicjs/theorium/`

- 13 collections defined in `src/collections/`
- White-labeled as "Theorium CMS" (no SonicJs branding visible)
- Light theme by default via server-side middleware
- Quill WYSIWYG editor for HTML fields
- Page builder with content blocks (hero, text, features, CTA, FAQ, image)
- Admin at `http://localhost:8787/admin` (dev) or deployed Workers URL

### Site integration

The Theorium Astro site fetches from SonicJs via `sites/theorium/src/lib/cms.ts`. Same function signatures as the Directus data layer — pages import from `../lib/cms` instead of `../lib/directus`.

### Running locally

```bash
# Terminal 1: Start CMS
cd infra/sonicjs/theorium
npm run dev

# Terminal 2 (first time only): Seed data
cd infra/sonicjs/theorium
npm run seed

# Terminal 3: Start site
cd sites/theorium
SONICJS_URL=http://localhost:8787 npx astro dev
```

### Credentials

- **Email:** admin@theorium.cy
- **Password:** admin1234!
- **Login URL:** http://localhost:8787/auth/login

### Rollback to Directus

Change 4 import lines in `sites/theorium/src/pages/*.astro` from `'../lib/cms'` to `'../lib/directus'`.

## Limitations of the current retrofit

The Theorium site was built for Directus and retrofitted onto SonicJs. This creates friction:

| Area | Current State | Root Cause |
|---|---|---|
| Content changes need a rebuild | Edit in CMS, manually rebuild, redeploy | Static site fetches at build time only |
| No live preview | Can't see changes without rebuilding | No SSR preview routes wired to SonicJs |
| Pages collection is disconnected | Page builder exists in CMS but site can't render them | No catch-all route to consume pages API |
| Component variants aren't editable | Hero variant, card layout etc. hardcoded in .astro files | Not exposed as CMS fields |
| Nav/footer not CMS-driven | Defined in site.config.ts | Could come from a CMS settings collection |
| Images can't be managed | No media integration | SonicJs has R2 media but no helper wired |
| Two data layers | cms.ts maps SonicJs shapes back to Directus interfaces | Built for backward compat, adds complexity |

## How to build a site properly with SonicJs

If SonicJs is adopted for future clients, build with it in mind from the start:

### 1. Hybrid rendering (static + SSR preview)

```
src/pages/
├── index.astro              → static, fetches published content at build time
├── about.astro              → static
├── [...slug].astro          → static, renders CMS pages collection
└── preview/
    └── [...slug].astro      → SSR (prerender = false), fetches draft content live
```

Static pages for production speed. SSR preview routes for instant draft viewing without rebuilds.

### 2. Webhook-triggered deploys

Use SonicJs's `content:publish` hook to fire a GitHub Actions rebuild automatically when content is published:

```typescript
hooks.register('content:publish', async (data) => {
  await fetch('https://api.github.com/repos/.../dispatches', {
    method: 'POST',
    headers: { Authorization: 'token ...' },
    body: JSON.stringify({ event_type: 'cms-publish' }),
  });
  return data;
});
```

### 3. Every component prop is a CMS field

Instead of hardcoding `variant="split"` in page files, expose it as a CMS field:

```typescript
// In the pages collection blocks
hero: {
  label: 'Hero Section',
  properties: {
    heading: { type: 'string' },
    subheading: { type: 'quill' },
    variant: { type: 'select', enum: ['centered', 'split', 'fullscreen', 'minimal'] },
    background: { type: 'select', enum: ['light', 'dark', 'primary'] },
    cta_text: { type: 'string' },
    cta_href: { type: 'url' },
    image: { type: 'media' },
  },
}
```

### 4. Dynamic page rendering

A catch-all route that renders pages from the CMS blocks:

```astro
---
// src/pages/[...slug].astro
import { getPageBySlug } from '../lib/cms';
const page = await getPageBySlug(Astro.params.slug);
if (!page) return Astro.redirect('/404');
---
{page.body.map(block => {
  if (block.blockType === 'hero') return <Hero {...block} />;
  if (block.blockType === 'text') return <TextBlock {...block} />;
  if (block.blockType === 'features') return <Features {...block} />;
  // ...
})}
```

### 5. Site settings collection

Replace `site.config.ts` with a CMS collection:

```typescript
// site_settings collection
{
  nav_items: { type: 'array', items: { type: 'object', properties: { label, href } } },
  footer_text: { type: 'string' },
  social_links: { type: 'array', items: { type: 'object', properties: { platform, url } } },
  contact_email: { type: 'email' },
  contact_phone: { type: 'string' },
  analytics_id: { type: 'string' },
}
```

### 6. Native data shapes

Components consume SonicJs response shape directly — no mapping layer:

```astro
---
const items = await fetchCollection('resources');
// items[0].title = SonicJs native title
// items[0].data.subject = custom field
---
{items.map(item => <ResourceCard title={item.title} {...item.data} />)}
```

### 7. Media integration

SonicJs stores uploads in R2. Use the media field type and serve via Workers:

```typescript
// Helper
function getMediaUrl(mediaId: string) {
  return `${SONICJS_URL}/media/serve/${mediaId}`;
}
```

### 8. Built-in forms

SonicJs has a forms system with Turnstile bot protection. Use it instead of custom API routes:

```typescript
// Define form in CMS admin → Forms → New Form
// Submissions handled by SonicJs, viewable in admin
// Turnstile CAPTCHA built-in
```

## Comparison: SonicJs vs Directus

| Factor | Directus (current) | SonicJs (pilot) |
|---|---|---|
| Hosting | Hetzner VPS (Docker + PostgreSQL) | Cloudflare Workers (D1 + R2 + KV) |
| Cost per client | ~€5-10/mo VPS share | ~$0-5/mo Cloudflare free/paid tier |
| Response time | 100-500ms (single region) | 15-50ms (300+ edge locations) |
| Infra management | Docker, Kamal, backups, SSL | Zero — Cloudflare manages everything |
| Admin UI | Polished, mature, feature-rich | Functional, customizable via middleware |
| Rich text | Built-in WYSIWYG | Quill/TinyMCE/EasyMDE plugins |
| Visual editing | @directus/visual-editing SDK | Not available |
| Maturity | Production-grade (v11, large community) | Alpha (v2.8.0, small community) |
| Portability | Runs anywhere (Docker) | Cloudflare-only |
| White-labeling | Enterprise feature (paid) | Free via middleware |

## Transferability & client handoff

### Licensing

SonicJs is MIT licensed — white-labeling, forking, reselling, and redistribution are all permitted. The only requirement is keeping the copyright notice in the source code (not in the UI).

### What's portable

| Asset | Export method | Portable? |
|---|---|---|
| Site source code | Git repo — `sites/<slug>/` folder | Fully portable (standard Astro) |
| CMS content data | `wrangler d1 export <db-name>` → SQLite file | Portable as raw data (JSON/SQL) |
| Media files | `wrangler r2 object get` or S3-compatible tools | Standard files, any host |
| Collection schemas | TypeScript files in `src/collections/` | Readable, self-documenting |
| CMS configuration | `wrangler.toml` + env vars + seed script | Reproducible |

### Transfer scenarios

**Client stays on Cloudflare (easiest)**
New agency deploys the same code to their own Cloudflare account. Transfer the repo, create new D1/R2/KV resources, import the data, deploy. Everything works as-is.

**Client switches CMS (common)**
Export all content as JSON, import into whatever CMS the new agency uses (Directus, Strapi, WordPress, etc.). The Astro site is framework-agnostic — they rewrite the data layer (`cms.ts`) to talk to their new CMS. Templates, components, and styling all carry over unchanged.

**Client goes fully static (simplest)**
The site already has fallback data hardcoded in `cms.ts`. Freeze the current content into static files and drop the CMS entirely. The site builds and deploys with zero CMS dependency.

### Key difference vs Directus

Directus runs in Docker anywhere (AWS, Hetzner, Fly.io, self-hosted). A client leaving the agency could take the Docker setup and run it on any VPS. SonicJs is Cloudflare-only — the CMS cannot be moved to a non-Cloudflare host.

In practice, this rarely matters. The Astro site is the portable asset — it's standard code any developer can work with. The CMS is infrastructure the agency operates. When a client leaves, you export their content as JSON and hand over the site code. The new agency picks whatever CMS they want. This is the same regardless of CMS — migrations are always a data export + re-integration job.

### Forking SonicJs

If deeper customisation is needed beyond what middleware provides:

```bash
# Fork on GitHub, then track upstream
git clone https://github.com/your-org/sonicjs.git
git remote add upstream https://github.com/lane711/sonicjs.git

# Pull updates
git fetch upstream && git merge upstream/main
```

Recommended approach: keep using the npm package (`@sonicjs-cms/core`) and customise via middleware. Only fork if you hit a wall that middleware can't solve.

## Decision

To be made after evaluating the pilot. Key questions:

1. Is the admin editing experience good enough for the Theorium client?
2. Does the lack of visual editing matter for this use case?
3. Is the Cloudflare-only lock-in acceptable given the cost/performance benefits?
4. Is the SonicJs community/support sufficient for production use?
5. Is the transferability story acceptable for the agency model?
