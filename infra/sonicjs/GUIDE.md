# SonicJs Website Development Guide

Step-by-step instructions for designing, developing, and deploying client websites using SonicJs as the headless CMS on Cloudflare Workers.

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Setup](#2-project-setup)
3. [Define Collections](#3-define-collections)
4. [Build the Data Layer](#4-build-the-data-layer)
5. [Build the Astro Site](#5-build-the-astro-site)
6. [White-Label the Admin](#6-white-label-the-admin)
7. [User Accounts & Roles](#7-user-accounts--roles)
8. [Live Preview](#8-live-preview)
9. [Deployment](#9-deployment)
10. [Migration Guide: Importing from Other CMS](#10-migration-guide-importing-from-other-cms)
11. [Export Guide: Moving to Another CMS](#11-export-guide-moving-to-another-cms)
12. [Reference](#12-reference)

---

## 1. Prerequisites

- Node.js 20+
- Cloudflare account (free tier works for development)
- Wrangler CLI: `npm install -g wrangler && wrangler login`
- Astro: `npm create astro@latest`

**Key resources:**
- SonicJs docs: https://sonicjs.com
- SonicJs GitHub: https://github.com/SonicJs-Org/sonicjs
- Astro integration guide: https://sonicjs.com/integrations/astro
- Field types reference: https://sonicjs.com/field-types
- Plugin system: https://sonicjs.com/plugins
- Hooks reference: https://sonicjs.com/hooks

---

## 2. Project Setup

### 2.1 Create the CMS project

```bash
mkdir -p infra/sonicjs/<client-slug>
cd infra/sonicjs/<client-slug>
```

Create `package.json`:

```json
{
  "name": "<client-slug>-cms",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "seed": "tsx seed.ts"
  },
  "dependencies": {
    "@sonicjs-cms/core": "^2.8.0",
    "drizzle-orm": "^0.45.0",
    "hono": "^4.12.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20250217.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.2",
    "wrangler": "^4.0.0"
  }
}
```

Create `wrangler.toml`:

```toml
name = "<client-slug>-cms"
main = "src/index.ts"
compatibility_date = "2026-03-22"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "<client-slug>-cms"
database_id = "TODO"
migrations_dir = "node_modules/@sonicjs-cms/core/migrations"

[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "<client-slug>-cms-media"

[[kv_namespaces]]
binding = "CACHE_KV"
id = "TODO"

[vars]
ADMIN_EMAIL = "admin@<domain>"
ADMIN_PASSWORD = "<strong-password>"
JWT_SECRET = "<random-secret>"
```

Install dependencies:

```bash
npm install
```

### 2.2 Create the entry point

Create `src/index.ts`:

```typescript
import { createSonicJSApp, registerCollections } from '@sonicjs-cms/core';
import type { CollectionConfig } from '@sonicjs-cms/core';
import { THEME_SCRIPT, CUSTOM_CSS, whiteLabel } from './plugins/admin-theme';

// Import all collection definitions
import siteSettings from './collections/site-settings.collection';
// ... more collections

const collections: CollectionConfig[] = [siteSettings /* ... */];
registerCollections(collections);

const app = createSonicJSApp({
  collections: { autoSync: true },
  plugins: { autoLoad: true },
  middleware: {
    afterAuth: [
      async (c, next) => {
        await next();
        const url = new URL(c.req.url);
        if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/auth')) return;
        const contentType = c.res.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) return;

        let html = await c.res.text();

        // Light theme: strip dark class server-side
        html = html.replace(/class="([^"]*)\bdark\b([^"]*)"/g, (_, b, a) => {
          const cleaned = `${b}${a}`.replace(/\s+/g, ' ').trim();
          return cleaned ? `class="${cleaned}"` : '';
        });

        // White-label branding
        html = whiteLabel(html);

        // Role-based menu: hide admin-only items for editors
        const user = c.get('user') as { role?: string } | undefined;
        if (user && user.role !== 'admin') {
          html = html.replace(/<a[^>]*href="\/admin\/collections"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/users"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/plugins"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/cache"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/settings[^"]*"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/forms"[^>]*>[\s\S]*?<\/a>/g, '');
        }

        // Inject theme CSS and script
        html = html
          .replace('</head>', `${CUSTOM_CSS}\n</head>`)
          .replace('</body>', `${THEME_SCRIPT}\n</body>`);

        c.res = new Response(html, { status: c.res.status, headers: c.res.headers });
      },
    ],
  },
});

export default app;
```

### 2.3 First run

```bash
npm run dev              # Starts CMS at http://localhost:8787
# Visit http://localhost:8787/auth/login
```

The first request triggers database migrations and collection sync automatically.

---

## 3. Define Collections

Collections are TypeScript files in `src/collections/`. Each defines a content type with fields, validation, and admin display settings.

### 3.1 Essential collections every site needs

**Site Settings** (singleton — one item, replaces `site.config.ts`):

```typescript
// src/collections/site-settings.collection.ts
import type { CollectionConfig } from '@sonicjs-cms/core';

const siteSettings: CollectionConfig = {
  name: 'site_settings',
  displayName: 'Site Settings',
  description: 'Global site config — identity, contact, nav, footer, SEO.',
  icon: '⚙️',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      tagline: { type: 'string', title: 'Tagline' },
      url: { type: 'url', title: 'Site URL' },
      contact_email: { type: 'email', title: 'Contact Email' },
      contact_phone: { type: 'string', title: 'Phone' },
      contact_city: { type: 'string', title: 'City' },
      contact_country: { type: 'string', title: 'Country' },
      nav_items: {
        type: 'array', title: 'Navigation Links',
        items: { type: 'object', properties: {
          label: { type: 'string', title: 'Label', required: true },
          href: { type: 'string', title: 'URL', required: true },
        }},
      },
      nav_cta_label: { type: 'string', title: 'CTA Button Label' },
      nav_cta_href: { type: 'string', title: 'CTA Button Link' },
      footer_text: { type: 'string', title: 'Footer Text' },
      meta_default_title: { type: 'string', title: 'Default Page Title' },
      meta_default_description: { type: 'textarea', title: 'Default Meta Description' },
    },
  },
  listFields: ['title'],
};

export default siteSettings;
```

**Pages** (page builder with content blocks):

```typescript
// src/collections/pages.collection.ts
import type { CollectionConfig } from '@sonicjs-cms/core';

const pages: CollectionConfig = {
  name: 'pages',
  displayName: 'Pages',
  description: 'Static pages with block-based page builder.',
  icon: '📄',
  isActive: true,
  schema: {
    type: 'object',
    properties: {
      nav_label: { type: 'string', title: 'Navigation Label' },
      layout: {
        type: 'select', title: 'Layout',
        enum: ['full-width', 'single-column'],
        default: 'single-column',
      },
      body: {
        type: 'array', title: 'Page Content',
        items: {
          type: 'object',
          discriminator: 'blockType',
          blocks: {
            hero: {
              label: 'Hero Section',
              properties: {
                heading: { type: 'string', title: 'Heading', required: true },
                subheading: { type: 'textarea', title: 'Subheading' },
                cta_text: { type: 'string', title: 'Button Text' },
                cta_href: { type: 'url', title: 'Button Link' },
              },
            },
            text: {
              label: 'Text Block',
              properties: {
                content: { type: 'quill', title: 'Content', required: true },
              },
            },
            features: {
              label: 'Features Grid',
              properties: {
                heading: { type: 'string', title: 'Section Heading' },
                items: {
                  type: 'array', title: 'Features',
                  items: { type: 'object', properties: {
                    icon: { type: 'string', title: 'Emoji Icon' },
                    title: { type: 'string', title: 'Title', required: true },
                    description: { type: 'textarea', title: 'Description' },
                  }},
                },
              },
            },
            cta: {
              label: 'Call to Action',
              properties: {
                heading: { type: 'string', title: 'Heading', required: true },
                text: { type: 'textarea', title: 'Description' },
                button_text: { type: 'string', title: 'Button Text' },
                button_href: { type: 'url', title: 'Button Link' },
              },
            },
            faq: {
              label: 'FAQ Section',
              properties: {
                heading: { type: 'string', title: 'Section Heading' },
                items: {
                  type: 'array', title: 'Questions',
                  items: { type: 'object', properties: {
                    question: { type: 'string', title: 'Question', required: true },
                    answer: { type: 'textarea', title: 'Answer', required: true },
                  }},
                },
              },
            },
          },
        },
      },
      meta_title: { type: 'string', title: 'Meta Title' },
      meta_description: { type: 'textarea', title: 'Meta Description', maxLength: 160 },
    },
  },
  listFields: ['title', 'nav_label', 'layout'],
};

export default pages;
```

### 3.2 Field types reference

| Type | Renders as | Use for |
|---|---|---|
| `string` | Text input | Short text, titles, labels |
| `textarea` | Multi-line input | Descriptions, subtitles |
| `quill` | WYSIWYG editor | Rich HTML content (requires Quill plugin active) |
| `richtext` | Markdown editor | Markdown content (EasyMDE) |
| `number` | Number input | Prices, sort order, counts |
| `boolean` | Checkbox | Toggles, flags |
| `select` | Dropdown | Enum choices (status, variant, color) |
| `email` | Email input | Email addresses (with validation) |
| `url` | URL input | Links (with validation) |
| `date` | Date picker | Dates without time |
| `datetime` | Date+time picker | Scheduled dates |
| `media` | File upload | Images, documents (stored in R2) |
| `color` | Color picker | Hex color values |
| `array` | Add/remove list | Repeatable items with drag-to-reorder |
| `object` | Grouped fields | Nested field groups |
| `json` | JSON editor | Raw JSON data |
| `reference` | Content picker | Links to other collections |

### 3.3 Key patterns

**Do not set `managed: true`** — it shows "Config-Managed Collection" warnings in the admin and blocks schema editing in the UI.

**Use `quill` instead of `richtext`** for HTML fields — `quill` outputs HTML directly (what Astro templates expect), while `richtext` uses EasyMDE which outputs Markdown.

**Use structured `array` instead of `json`** for lists — arrays get proper add/remove/reorder UI in the admin, while `json` shows a raw code editor.

---

## 4. Build the Data Layer

### 4.1 Type definitions

Create `sites/<slug>/src/lib/types.ts` with a generic `CmsItem<T>` wrapper and collection-specific data interfaces:

```typescript
// Generic SonicJs content item — all collections return this shape
export interface CmsItem<T = Record<string, unknown>> {
  id: string;
  title: string;      // SonicJs native title (top-level)
  slug: string;       // SonicJs native slug
  status: string;     // draft | published | archived
  data: T;            // Custom fields defined in collection schema
  created_at: number;
  updated_at: number;
}

// Example: collection-specific data (what lives in .data)
export interface ResourceData {
  subject: 'Biology' | 'Chemistry' | 'Physics' | 'Mathematics';
  description: string | null;
  drive_url: string;
  sort: number;
}
```

**Important:** SonicJs stores `title` and `slug` as top-level columns. All custom fields go inside `data` as a JSON blob. Components access `item.title` for the display name and `item.data.fieldName` for custom fields.

### 4.2 CMS client

Create `sites/<slug>/src/lib/cms.ts`:

```typescript
import type { CmsItem, ResourceData } from './types';

interface SonicJsResponse<T> {
  data: CmsItem<T>[];
}

// Preview mode toggle — set to true in SSR preview routes
let _previewMode = false;
export function setPreviewMode(enabled: boolean) { _previewMode = enabled; }

async function fetchCollection<T>(collection: string, options?: { limit?: number }): Promise<CmsItem<T>[]> {
  const cmsUrl = import.meta.env.SONICJS_URL;
  if (!cmsUrl) return [];

  const params = new URLSearchParams();
  if (!_previewMode) params.set('status', 'published');
  if (options?.limit) params.set('limit', String(options.limit));

  try {
    const res = await fetch(`${cmsUrl}/api/collections/${collection}/content?${params}`);
    if (!res.ok) return [];
    const json = (await res.json()) as SonicJsResponse<T>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

// JSON fields may arrive as strings — parse them safely
function parseJson<T>(value: unknown): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return value as unknown as T; }
  }
  return value as T;
}

// Sort by data.sort field
function sortByField<T>(items: CmsItem<T>[]): CmsItem<T>[] {
  return [...items].sort((a, b) => ((a.data as any).sort ?? 999) - ((b.data as any).sort ?? 999));
}

// Example fetch function
export async function getResources(options?: { limit?: number }): Promise<CmsItem<ResourceData>[]> {
  const items = sortByField(await fetchCollection<ResourceData>('resources', options));
  return items.length > 0 ? items : FALLBACK_RESOURCES;
}

// Always include fallback data so the site builds without a CMS connection
const FALLBACK_RESOURCES: CmsItem<ResourceData>[] = [ /* ... */ ];
```

### 4.3 Key principles

1. **Every fetch function has fallback data** — the site must build without a CMS connection
2. **JSON fields need parsing** — `array` and `object` fields may arrive as JSON strings from D1
3. **Sort client-side** — SonicJs cannot sort by fields inside the `data` JSON blob
4. **Filter client-side** — SonicJs cannot filter by `data.*` fields (only top-level `status`, `collection_id`)
5. **No mapping layer** — components consume the native `CmsItem<T>` shape directly

---

## 5. Build the Astro Site

### 5.1 Page structure

```
sites/<slug>/src/pages/
├── index.astro           → Static homepage
├── about.astro           → Static about page
├── [...slug].astro       → Dynamic CMS pages (page builder)
├── api/
│   └── contact.ts        → Contact form API route
└── preview/
    └── index.astro       → SSR preview (draft content)
```

### 5.2 Pages fetch from CMS

```astro
---
import { getSiteSettings, getResources } from '../lib/cms';

const settings = await getSiteSettings();
const resources = await getResources();
---

<h1>{settings!.title}</h1>
{resources.map(r => (
  <div>
    <h3>{r.title}</h3>          <!-- SonicJs native title -->
    <p>{r.data.description}</p>  <!-- Custom field in .data -->
  </div>
))}
```

### 5.3 Nav and Footer read from CMS

```astro
---
// Nav.astro
import { getSiteSettings } from '../lib/cms';
const settings = await getSiteSettings();
const navItems = settings!.data.nav_items ?? [];
---

<nav>
  {navItems.map(item => <a href={item.href}>{item.label}</a>)}
  <a href={settings!.data.nav_cta_href}>{settings!.data.nav_cta_label}</a>
</nav>
```

### 5.4 Dynamic pages from page builder

```astro
---
// [...slug].astro
import { getPages, getPageBySlug } from '../lib/cms';

export async function getStaticPaths() {
  const pages = await getPages();
  return pages.map(p => ({ params: { slug: p.slug }, props: { page: p } }));
}

const { page } = Astro.props;
const blocks = page.data.body;
---

{blocks.map(block => {
  if (block.blockType === 'hero') return <section><h1>{block.heading}</h1></section>;
  if (block.blockType === 'text') return <section set:html={block.content} />;
  if (block.blockType === 'features') return <section>/* render features */</section>;
})}
```

### 5.5 Environment variables

Add to `sites/<slug>/wrangler.toml`:

```toml
[vars]
SONICJS_URL = "https://<client-slug>-cms.<account>.workers.dev"
```

For local development, pass it directly:

```bash
SONICJS_URL=http://localhost:8787 npx astro dev
```

---

## 6. White-Label the Admin

SonicJs admin is white-labeled via server-side middleware — no forking required.

### 6.1 Create the theme plugin

Create `src/plugins/admin-theme.ts` with three exports:

1. **`WHITE_LABEL`** — string replacements for branding (page titles, headings, descriptions)
2. **`whiteLabel(html)`** — function that applies replacements + replaces the SVG logo with text
3. **`CUSTOM_CSS`** — light theme CSS overrides injected into `<head>`
4. **`THEME_SCRIPT`** — theme toggle button injected before `</body>`

Key replacements:

```typescript
export const WHITE_LABEL: [string, string][] = [
  ['SonicJS AI Admin', '<Client> CMS'],
  ['SonicJS AI', '<Client> CMS'],
  ['SonicJS', '<Client>'],
  ['Welcome Back', '<Client> CMS'],
  ['Sign in to your account to continue', 'Sign in to manage your content'],
];
```

The SVG logo (viewBox `380 1300 2250 400`) is replaced via regex in the `whiteLabel()` function.

### 6.2 Light theme

The dark class is stripped server-side in the middleware (not via JavaScript) to prevent any flash:

```typescript
html = html.replace(/class="([^"]*)\bdark\b([^"]*)"/g, (_, b, a) => {
  const cleaned = `${b}${a}`.replace(/\s+/g, ' ').trim();
  return cleaned ? `class="${cleaned}"` : '';
});
```

See `infra/sonicjs/theorium/src/plugins/theorium-admin.ts` for the complete reference implementation.

---

## 7. User Accounts & Roles

### 7.1 Built-in roles

| Role | Content | Collections | Users | Plugins | Settings |
|---|---|---|---|---|---|
| **admin** | Full CRUD | Edit schemas | Manage | Configure | All |
| **editor** | Full CRUD | View only | No | No | No |
| **author** | Own content only | View only | No | No | No |
| **viewer** | Read only | No | No | No | No |

### 7.2 Create users

Via the seed script or API:

```bash
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"editor@example.com","username":"editor","firstName":"Content","lastName":"Editor","password":"password123!"}'
```

Then update the role (registration defaults to `viewer`):

```bash
wrangler d1 execute <db-name> --local \
  --command "UPDATE users SET role = 'editor' WHERE email = 'editor@example.com';"
```

### 7.3 Role-based menu filtering

SonicJs does not hide sidebar items per role by default. The `afterAuth` middleware strips admin-only menu items from the HTML for non-admin users:

```typescript
if (user && user.role !== 'admin') {
  html = html.replace(/<a[^>]*href="\/admin\/collections"[^>]*>[\s\S]*?<\/a>/g, '');
  html = html.replace(/<a[^>]*href="\/admin\/users"[^>]*>[\s\S]*?<\/a>/g, '');
  html = html.replace(/<a[^>]*href="\/admin\/plugins"[^>]*>[\s\S]*?<\/a>/g, '');
  html = html.replace(/<a[^>]*href="\/admin\/cache"[^>]*>[\s\S]*?<\/a>/g, '');
  html = html.replace(/<a[^>]*href="\/admin\/settings[^"]*"[^>]*>[\s\S]*?<\/a>/g, '');
  html = html.replace(/<a[^>]*href="\/admin\/forms"[^>]*>[\s\S]*?<\/a>/g, '');
}
```

Editors see only: Dashboard, Content, Media.

### 7.4 Client access

Give clients the **editor** role. They can:
- Create, edit, and publish content
- Upload media files
- Use the page builder
- Cannot modify schemas, users, plugins, or settings

---

## 8. Live Preview

### 8.1 How it works

Static pages fetch published content at build time. Preview routes are **SSR** (`prerender = false`) and fetch all content (including drafts) on every request.

### 8.2 Create preview routes

```astro
---
// src/pages/preview/index.astro
export const prerender = false;

import { setPreviewMode, getSiteSettings, getHero /* ... */ } from '../../lib/cms';

// Verify token
const token = Astro.url.searchParams.get('token');
if (token !== import.meta.env.PREVIEW_TOKEN) {
  return new Response('Unauthorized', { status: 401 });
}

// Enable preview mode — fetches draft + published content
setPreviewMode(true);

const settings = await getSiteSettings();
const hero = await getHero();
// ... fetch all data

setPreviewMode(false);
---

<!-- Blue preview banner -->
<div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#3b82f6;color:#fff;text-align:center;padding:8px;font-size:13px;font-weight:600;">
  PREVIEW MODE — Draft content, not live
</div>

<!-- Same template as the production page -->
```

### 8.3 Preview URL

```
https://<site-url>/preview/?token=<PREVIEW_TOKEN>
```

The token is set in `wrangler.toml` or environment variables. Share the preview URL with the client so they can review changes before publishing.

### 8.4 Preview mode in cms.ts

The `setPreviewMode(true)` call tells `fetchCollection()` to omit the `status=published` filter, so draft content is included:

```typescript
let _previewMode = false;
export function setPreviewMode(enabled: boolean) { _previewMode = enabled; }

async function fetchCollection<T>(collection: string, options?: { limit?: number }) {
  const params = new URLSearchParams();
  if (!_previewMode) params.set('status', 'published'); // Skip filter in preview mode
  // ...
}
```

---

## 9. Deployment

### 9.1 Create Cloudflare resources

```bash
cd infra/sonicjs/<client-slug>

# Create D1 database
wrangler d1 create <client-slug>-cms
# Copy the database_id to wrangler.toml

# Create KV namespace
wrangler kv namespace create CACHE_KV
# Copy the id to wrangler.toml

# Create R2 bucket (for media)
wrangler r2 bucket create <client-slug>-cms-media
```

### 9.2 Deploy the CMS

```bash
cd infra/sonicjs/<client-slug>
wrangler deploy
```

The CMS will be live at `https://<client-slug>-cms.<account>.workers.dev`.

### 9.3 Seed production data

```bash
SONICJS_URL=https://<client-slug>-cms.<account>.workers.dev npm run seed
```

### 9.4 Deploy the site

```bash
cd sites/<client-slug>
SONICJS_URL=https://<client-slug>-cms.<account>.workers.dev npx astro build
wrangler deploy
```

### 9.5 Custom domains

Add custom domains via Cloudflare dashboard:
- CMS: `cms.<domain>` → Workers route
- Site: `<domain>` → Workers route

### 9.6 Auto-deploy on content publish

Register a `content:publish` hook in `src/index.ts` to trigger a GitHub Actions rebuild:

```typescript
// Add to createSonicJSApp config
hooks: [{
  name: 'content:publish',
  handler: async (data) => {
    await fetch('https://api.github.com/repos/<org>/<repo>/dispatches', {
      method: 'POST',
      headers: { Authorization: 'token <PAT>', 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'cms-publish' }),
    });
    return data;
  },
}],
```

---

## 10. Migration Guide: Importing from Other CMS

### 10.1 From Directus

**Step 1: Export content from Directus**

```bash
# Export each collection as JSON via the Directus API
curl -H "Authorization: Bearer <TOKEN>" \
  https://cms.<domain>/items/<collection>?limit=-1 \
  > <collection>.json
```

**Step 2: Map Directus fields to SonicJs collections**

| Directus concept | SonicJs equivalent |
|---|---|
| Collection | Collection (TypeScript file in `src/collections/`) |
| Field (string) | `{ type: 'string' }` in schema properties |
| Field (WYSIWYG) | `{ type: 'quill' }` |
| Field (JSON) | `{ type: 'array' }` or `{ type: 'json' }` |
| Field (select dropdown) | `{ type: 'select', enum: [...] }` |
| Field (file/image) | `{ type: 'media' }` |
| Singleton collection | Regular collection with one content item |
| `status` field | Built-in (every content item has `status`) |
| `sort` field | Custom field in schema: `{ type: 'number', title: 'Sort Order' }` |

**Step 3: Create SonicJs collection definitions**

For each Directus collection, create a `.collection.ts` file mapping all fields.

Key differences:
- Directus stores all fields flat. SonicJs has `title` and `slug` top-level, everything else in `data`.
- Directus `id` is auto-generated UUID. SonicJs also uses UUID.
- Directus singletons have a dedicated concept. SonicJs uses regular collections with one item.

**Step 4: Write a seed script**

Transform the exported Directus JSON into SonicJs API calls:

```typescript
// For each item in the Directus export:
const directusItem = { title: 'My Item', field1: 'value1', field2: 'value2' };

// Transform to SonicJs shape:
await fetch(`${SONICJS_URL}/api/content`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    title: directusItem.title,
    slug: slugify(directusItem.title),
    collectionId: collectionId,
    status: 'published',
    data: {
      field1: directusItem.field1,
      field2: directusItem.field2,
    },
  }),
});
```

**Step 5: Update the Astro data layer**

Replace Directus SDK calls with SonicJs `fetchCollection()` calls. Change component interfaces from flat Directus types to `CmsItem<T>` wrapper types.

### 10.2 From Strapi / WordPress / other CMS

The process is the same:
1. Export content as JSON (via API or database export)
2. Create SonicJs collection schemas matching the content structure
3. Write a seed script that transforms and inserts via the SonicJs API
4. Update the site's data layer to use `fetchCollection()`

### 10.3 Media migration

Directus/Strapi store media with their own asset IDs. For migration:

1. Download all media files from the old CMS
2. Upload to the SonicJs R2 bucket via the media API or directly via wrangler
3. Update content references to point to new media IDs

```bash
# Upload a file to SonicJs
curl -X POST https://<cms-url>/api/media/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@./image.jpg"
```

---

## 11. Export Guide: Moving to Another CMS

### 11.1 Export content data

```bash
# Export D1 database as SQLite
wrangler d1 export <db-name> --output=export.sql

# Or export via API as JSON
curl https://<cms-url>/api/collections/<collection>/content > <collection>.json
```

### 11.2 Export media files

```bash
# List all objects in the R2 bucket
wrangler r2 object list <bucket-name>

# Download individual files
wrangler r2 object get <bucket-name> <key> --file=./media/<filename>
```

### 11.3 What transfers

| Asset | Export method | Format |
|---|---|---|
| Site source code | Git repo | Standard Astro (portable) |
| Content data | D1 export or API JSON | SQLite / JSON |
| Media files | R2 download | Standard files |
| Collection schemas | TypeScript files | Self-documenting |
| CMS configuration | `wrangler.toml` + seed script | Reproducible |

### 11.4 Importing into Directus

1. Create matching Directus collections via the admin UI or schema snapshot
2. Transform the SonicJs JSON export:

```javascript
// SonicJs shape
const sonicItem = { title: 'My Item', slug: 'my-item', data: { field1: 'val', field2: 'val' } };

// Transform to Directus shape (flat)
const directusItem = { title: sonicItem.title, field1: sonicItem.data.field1, field2: sonicItem.data.field2, status: 'published' };
```

3. Import via Directus API: `POST /items/<collection>`

### 11.5 Importing into Strapi / WordPress

Same pattern — transform the `CmsItem<T>` shape to the target CMS format and import via API.

### 11.6 Going fully static (drop CMS entirely)

The Astro site has fallback data hardcoded in `cms.ts`. To freeze:
1. Build the site with `SONICJS_URL` set — captures current CMS content
2. Remove the CMS dependency — the built static files are self-contained
3. For future edits, modify the fallback data in `cms.ts` directly

---

## 12. Reference

### Project structure

```
infra/sonicjs/<client-slug>/
├── src/
│   ├── index.ts                    # App entry — collections, middleware, plugins
│   ├── collections/                # Collection schemas (one file per content type)
│   │   ├── site-settings.collection.ts
│   │   ├── pages.collection.ts
│   │   └── <collection>.collection.ts
│   └── plugins/
│       └── admin-theme.ts          # White-label CSS/JS + branding
├── seed.ts                         # Data seeding script
├── package.json
├── wrangler.toml                   # Cloudflare bindings + env vars
└── tsconfig.json

sites/<client-slug>/
├── src/
│   ├── lib/
│   │   ├── types.ts                # CmsItem<T> + collection data interfaces
│   │   └── cms.ts                  # SonicJs fetch client + fallback data
│   ├── pages/
│   │   ├── index.astro             # Static homepage
│   │   ├── [...slug].astro         # Dynamic CMS pages
│   │   └── preview/
│   │       └── index.astro         # SSR preview (draft content)
│   └── components/                 # Astro/React components
├── site.config.ts                  # Optional build-time fallback (if CMS is down)
└── wrangler.toml                   # SONICJS_URL env var
```

### SonicJs API endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/collections` | GET | No | List all collections |
| `/api/collections/<name>/content` | GET | No | List content (add `?status=published`) |
| `/api/content/<id>` | GET | No | Get single item |
| `/api/content` | POST | Yes | Create content |
| `/api/content/<id>` | PUT | Yes | Update content |
| `/api/content/<id>` | DELETE | Yes | Delete content |
| `/auth/login` | POST | No | Login (returns JWT) |
| `/auth/register` | POST | No | Register user |
| `/admin/*` | GET | Yes | Admin UI |

### Commands

```bash
# CMS development
cd infra/sonicjs/<slug>
npm run dev                          # Local CMS at :8787
npm run seed                         # Seed data
npm run deploy                       # Deploy to Cloudflare

# Site development
cd sites/<slug>
SONICJS_URL=http://localhost:8787 npx astro dev    # Local site
SONICJS_URL=http://localhost:8787 npx astro build  # Build
wrangler deploy                                     # Deploy to Cloudflare

# Database management
wrangler d1 execute <db> --local --command "SELECT * FROM content LIMIT 5;"
wrangler d1 export <db> --output=backup.sql
```

### Checklist for new sites

- [ ] Create CMS project in `infra/sonicjs/<slug>/`
- [ ] Define all collections in `src/collections/`
- [ ] Create `src/plugins/admin-theme.ts` with client branding
- [ ] Write `seed.ts` with initial content data
- [ ] Create site in `sites/<slug>/`
- [ ] Build `src/lib/types.ts` with `CmsItem<T>` interfaces
- [ ] Build `src/lib/cms.ts` with fetch functions + fallback data
- [ ] Create all page files with CMS data fetching
- [ ] Add preview route at `src/pages/preview/index.astro`
- [ ] Add `[...slug].astro` for CMS pages if using page builder
- [ ] Create admin user (admin role)
- [ ] Create editor user (editor role) for client
- [ ] Set up role-based menu filtering in middleware
- [ ] Create Cloudflare resources (D1, KV, R2)
- [ ] Deploy CMS and seed production data
- [ ] Deploy site with `SONICJS_URL` pointing to production CMS
- [ ] Set up custom domains
- [ ] Share editor credentials and preview URL with client
