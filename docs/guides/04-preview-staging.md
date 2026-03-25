# Phase 4: Preview & Staging System

Add hybrid SSR for per-item preview and full-site staging preview.

## Step 4.1: Add Cloudflare adapter for hybrid SSR

### Install the adapter

Add `@astrojs/cloudflare` to `sites/<slug>/package.json`:

```json
{
  "dependencies": {
    "@astrojs/cloudflare": "^13.1.3",
    // ... other deps
  }
}
```

If pnpm install fails due to workspace resolution issues, check that the package is already available in the monorepo's node_modules (other sites like theorium may already have it installed).

### Update astro.config.mjs

```javascript
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://nikolaspetrou.com',
  output: 'static',          // Pages are static by default
  adapter: cloudflare(),     // Enables SSR for opt-in routes
  // ... rest of config
});
```

**How hybrid mode works:**
- All pages are static (prerendered at build time) by default
- Any page with `export const prerender = false` becomes SSR (rendered on every request)
- The build outputs to `dist/client/` (static) and `dist/server/` (worker)
- Wrangler deploys both automatically

### Update wrangler.toml

Add `nodejs_compat` if not already present:

```toml
compatibility_flags = ["nodejs_compat"]
```

The `[assets] directory` can stay as `./dist` — the Astro Cloudflare adapter generates a `wrangler.json` in the output that handles the correct paths.

**Do NOT add `main = "./dist/server/entry.mjs"` to wrangler.toml** — this path doesn't exist at build start and causes the Cloudflare vite plugin to error. The adapter handles this automatically.

## Step 4.2: Create per-item preview route

Create `sites/<slug>/src/pages/preview/[collection]/[id].astro`:

```astro
---
import "../../styles/global.css";
import VideoLayout from '../../components/VideoLayout.astro';
import Hero from '../../components/Hero.astro';
import config from '../../../site.config';

export const prerender = false;  // SSR — renders on every request

const PREVIEW_TOKEN = import.meta.env.PREVIEW_TOKEN || 'preview-secret';
const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = import.meta.env.DIRECTUS_TOKEN;

const { collection, id } = Astro.params;
const token = Astro.url.searchParams.get('token');

// Auth check
if (token !== PREVIEW_TOKEN) {
  return new Response('Unauthorized', { status: 401 });
}

// Fetch item by ID via REST (no status filter — shows drafts)
const headers: Record<string, string> = { 'Content-Type': 'application/json' };
if (DIRECTUS_TOKEN) headers['Authorization'] = `Bearer ${DIRECTUS_TOKEN}`;
const res = await fetch(`${DIRECTUS_URL}/items/${collection}/${id}`, { headers });
if (!res.ok) return new Response('Item not found', { status: 404 });
const item = (await res.json()).data;

// Allow Directus to embed in iframe
Astro.response.headers.set('X-Frame-Options', 'ALLOWALL');
Astro.response.headers.set('Content-Security-Policy',
  'frame-ancestors https://cms.<client-domain>');
---
```

### Collection-specific rendering

Use conditional blocks to render each collection differently, using the same components as the live pages:

```astro
{collection === 'projects' && (
  <>
    <Hero variant="minimal" heading={item.title} subheading={item.subtitle} />
    <!-- Full project detail layout matching works/[slug].astro -->
  </>
)}

{collection === 'testimonials' && (
  <>
    <Hero variant="minimal" heading={item.name} />
    <!-- Testimonial card layout -->
  </>
)}
```

**Why use the same components:** The preview should look as close to the live site as possible. Import and use the exact same Astro components (Hero, ServiceCard, etc.) with the draft item's data.

**Note on import paths:** The preview route is at `src/pages/preview/[collection]/[id].astro` — three levels deep. Import paths need extra `../`:
- CSS: `../../../styles/global.css`
- Components: `../../../components/Hero.astro`
- Config: `../../../../site.config`

## Step 4.3: Create staging routes

Create SSR versions of every page that fetch ALL items (draft + published).

### Pattern for each staging page

Each staging page mirrors its live counterpart:

```astro
---
import "../../styles/global.css";
import VideoLayout from '../../components/VideoLayout.astro';
// ... same component imports as the live page
import config from '../../../site.config';
import { stagingGetProjects, stagingGetServices } from '../../lib/directus';

export const prerender = false;

const PREVIEW_TOKEN = import.meta.env.PREVIEW_TOKEN || 'preview-secret';
const token = Astro.url.searchParams.get('token');
if (token !== PREVIEW_TOKEN) {
  return new Response('Unauthorized', { status: 401 });
}

Astro.response.headers.set('X-Frame-Options', 'ALLOWALL');
Astro.response.headers.set('Content-Security-Policy',
  'frame-ancestors https://cms.<client-domain>');

// Fetch data using staging functions (no status filter)
const cmsProjects = await stagingGetProjects();
const cmsServices = await stagingGetServices({ limit: 3 });
// ... same data mapping as the live page
---

{/* Staging banner */}
<div class="fixed top-0 left-0 right-0 z-[9999] bg-blue-500 px-4 py-1.5 text-center shadow-md">
  <p class="text-xs font-semibold text-white">Staging Preview — Draft content, not live</p>
</div>
<div class="h-8"></div>

{/* ... exact same template as the live page ... */}
```

### Staging routes to create

| File | Mirrors |
|------|---------|
| `src/pages/staging/index.astro` | `src/pages/index.astro` |
| `src/pages/staging/about.astro` | `src/pages/about.astro` |
| `src/pages/staging/services.astro` | `src/pages/services.astro` |
| `src/pages/staging/works/index.astro` | `src/pages/works/index.astro` |
| `src/pages/staging/works/[slug].astro` | `src/pages/works/[slug].astro` |

**For `[slug].astro` in staging:** Don't use `getStaticPaths` (that's for static rendering). Instead, fetch all projects and find by slug:

```astro
---
const { slug } = Astro.params;
const projects = await stagingGetProjects();
const project = projects.find(p => p.slug === slug);
if (!project) return new Response('Not found', { status: 404 });
---
```

## Step 4.4: Configure Directus preview URLs

Set the preview URL on each collection so the Directus admin shows the preview panel:

```bash
TOKEN="<admin-token>"
PREVIEW_TOKEN="<preview-secret>"

# List items → per-item preview route
for coll in projects services testimonials reels; do
  curl -X PATCH "https://cms.<domain>/collections/$coll" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"meta\":{\"preview_url\":\"https://<domain>/preview/$coll/{{id}}?token=$PREVIEW_TOKEN\"}}"
done

# Singletons → staging routes (show full page context)
curl -X PATCH "https://cms.<domain>/collections/hero" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"meta\":{\"preview_url\":\"https://<domain>/staging/?token=$PREVIEW_TOKEN\"}}"

curl -X PATCH "https://cms.<domain>/collections/about" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"meta\":{\"preview_url\":\"https://<domain>/staging/about?token=$PREVIEW_TOKEN\"}}"

curl -X PATCH "https://cms.<domain>/collections/site_settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"meta\":{\"preview_url\":\"https://<domain>/staging/?token=$PREVIEW_TOKEN\"}}"
```

**Why singletons use staging routes:** The hero, about, and site_settings are page-level content. Showing them in isolation doesn't make sense — the staging route shows the full page so the user sees the content in context.

## Step 4.5: Build, deploy, and verify

```bash
npm run build && npx wrangler deploy
```

Test:
```bash
# Per-item preview (should return 200)
curl -sI "https://<domain>/preview/projects/<id>?token=<preview-token>" | head -3

# Staging homepage (should return 200)
curl -sI "https://<domain>/staging/?token=<preview-token>" | head -3

# Unauthorized (should return 401)
curl -sI "https://<domain>/staging/?token=wrong" | head -3
```

### Preview panel behavior

When editing an item in Directus:
1. The preview panel loads the configured URL in an iframe
2. **On save**, Directus reloads the iframe automatically
3. The SSR route fetches fresh data from the CMS API
4. The preview shows the updated content

**Important:** The preview updates on **save**, not on keystroke. Directus core does not support real-time unsaved data sync (no postMessage). This is a fundamental limitation of Directus's preview architecture.
