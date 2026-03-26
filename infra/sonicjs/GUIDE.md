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
9. [Storage & Media (R2)](#9-storage--media-r2)
10. [Deployment](#10-deployment)
11. [CI/CD & Auto-Deploy](#11-cicd--auto-deploy)
12. [Backups & Monitoring](#12-backups--monitoring)
13. [Cost Management](#13-cost-management)
14. [Migration Guide: Importing from Other CMS](#14-migration-guide-importing-from-other-cms)
15. [Export Guide: Moving to Another CMS](#15-export-guide-moving-to-another-cms)
16. [Production Readiness](#16-production-readiness)
17. [Known Limitations](#17-known-limitations)
18. [Reference](#18-reference)

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
MAX_FILE_SIZE = "104857600"
ALLOWED_FILE_TYPES = "image/jpeg,image/png,image/webp,image/svg+xml,image/gif,video/mp4,video/webm,video/quicktime,application/pdf"
BUCKET_NAME = "<client-slug>-cms-media"
```

**Note:** `MAX_FILE_SIZE` is in bytes (104857600 = 100MB). Adjust per client — 10MB for basic sites, 100MB for video-heavy sites.

Install dependencies:

```bash
npm install
```

### 2.2 Create the entry point

Create `src/index.ts` — this is the most critical file. It handles collections, middleware, security, white-labeling, and role filtering. Use the nikolaspetrou implementation as the reference:

**Reference:** `infra/sonicjs/nikolaspetrou/src/index.ts`

```typescript
import { createSonicJSApp, registerCollections } from '@sonicjs-cms/core';
import type { CollectionConfig } from '@sonicjs-cms/core';
import { THEME_SCRIPT, CUSTOM_CSS, whiteLabel } from './plugins/admin-theme';

// Import all collection definitions
import siteSettings from './collections/site-settings.collection';
import submissions from './collections/submissions.collection';
import formSettings from './collections/form-settings.collection';
// ... more collections per client

const collections: CollectionConfig[] = [siteSettings, submissions, formSettings /* ... */];
registerCollections(collections);

const app = createSonicJSApp({
  collections: { autoSync: true },
  plugins: { autoLoad: true },
  middleware: {
    // Block public registration (allow seed script with JWT_SECRET header)
    beforeAuth: [
      async (c, next) => {
        const url = new URL(c.req.url);
        if (url.pathname === '/auth/register' && c.req.method === 'POST') {
          const seedSecret = c.req.header('x-seed-secret');
          const jwtSecret = c.env?.JWT_SECRET || '';
          if (seedSecret !== jwtSecret) {
            return c.json({ error: 'Registration is disabled.' }, 403);
          }
        }
        await next();
      },
    ],
    afterAuth: [
      async (c, next) => {
        await next();
        const url = new URL(c.req.url);
        if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/auth')) return;
        const contentType = c.res.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) return;

        let html = await c.res.text();

        // CRITICAL: Skip HTMX partial responses (no <!DOCTYPE)
        // Without this, modals (Version History) and dynamic content break
        if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
          c.res = new Response(html, { status: c.res.status, headers: c.res.headers });
          return;
        }

        // Light theme: strip dark class server-side (prevents flash)
        html = html.replace(/class="([^"]*)\bdark\b([^"]*)"/g, (_, b, a) => {
          const cleaned = `${b}${a}`.replace(/\s+/g, ' ').trim();
          return cleaned ? `class="${cleaned}"` : '';
        });

        // White-label branding
        html = whiteLabel(html);

        // Hide Forms sidebar (we use custom contact form, not SonicJs Forms plugin)
        html = html.replace(/<a[^>]*href="\/admin\/forms"[^>]*>[\s\S]*?<\/a>/g, '');

        // Role-based menu: hide admin-only items for editors
        const user = c.get('user') as { role?: string } | undefined;
        if (user && user.role !== 'admin') {
          html = html.replace(/<a[^>]*href="\/admin\/collections"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/users"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/plugins"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/cache"[^>]*>[\s\S]*?<\/a>/g, '');
          html = html.replace(/<a[^>]*href="\/admin\/settings[^"]*"[^>]*>[\s\S]*?<\/a>/g, '');
        }

        // Clean login page — remove branding, show only login card
        if (url.pathname.startsWith('/auth')) {
          // Remove logo text and page title branding
          html = html.replace(/<span style="font-size:20px[^"]*">[^<]*<\/span>\s*<span[^>]*>CMS<\/span>/g, '');
          html = html.replace(/<title>[^<]*<\/title>/, '<title>Login - CMS</title>');
        }

        // Override "Preview Content" button → link to staging preview
        const siteUrl = 'https://<domain>'; // Change per client
        const previewToken = '<PREVIEW_TOKEN>';
        html = html.replace(
          /<button[^>]*onclick="previewContent\(\)"[^>]*>[\s\S]*?<\/button>/g,
          `<a href="${siteUrl}/staging/?token=${previewToken}" target="_blank" class="w-full inline-flex items-center gap-x-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-zinc-100 rounded-lg transition-colors"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>Preview on Site</a>`
        );

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

**Key lessons from the nikolaspetrou migration:**

1. **Always skip HTMX partials** — without the `<!DOCTYPE` check, the middleware breaks modals (Version History), dynamic content, and any HTMX-loaded HTML fragments.
2. **Block registration in `beforeAuth`** — use `x-seed-secret` header matching `JWT_SECRET` to allow the seed script through while blocking public registration.
3. **Replace the Preview button element, not just text** — the SonicJs preview button has an `onclick="previewContent()"` handler. Replacing just the text nests a link inside the button, and the button's handler fires first. Replace the entire `<button>` element with an `<a>` link.
4. **Hide Forms sidebar for all users** — we use a custom contact form, not SonicJs's built-in Forms plugin.
5. **Clean the login page** — remove logo, registration link, version badge. Only show the login card.

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

### 4.3 Essential helpers

**`resolveMediaUrl()`** — handles R2 media IDs, external URLs, and CDN URLs transparently:

```typescript
export function resolveMediaUrl(value: string | undefined | null): string {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')) return value;
  const cmsUrl = import.meta.env.SONICJS_URL || '';
  return cmsUrl ? `${cmsUrl}/media/serve/${value}` : value;
}
```

**`buildConfig()`** — constructs a `SiteConfig`-compatible object from CMS settings for Nav/Footer/Layout components:

```typescript
export function buildConfig(settings: CmsItem<SiteSettingsData> | null) {
  const s = settings?.data;
  return {
    name: settings?.title ?? '<Client>',
    tagline: s?.tagline ?? '',
    url: 'https://<domain>',
    locale: 'en-GB',
    contact: { email: s?.email ?? '', phone: '', address: { street: '', city: '', postcode: '', country: '' } },
    seo: { defaultTitle: s?.seo_title ?? '', titleTemplate: '%s | <Client>', defaultDescription: s?.seo_description ?? '', defaultOgImage: '/og-default.svg', structuredData: { type: 'Organization' as const } },
    nav: { items: (s?.nav_items ?? []).map(i => ({ label: i.label, href: i.href })), cta: s?.nav_cta_label ? { label: s.nav_cta_label, href: s.nav_cta_href ?? '/contact' } : undefined },
    footer: { columns: [], legalLinks: [], text: s?.footer_text ?? '', socialLinks: { instagram: s?.instagram_url ?? '', facebook: s?.facebook_url ?? '' } },
    theme: { navStyle: 'fixed' as const, footerStyle: 'multi-column' as const, heroDefault: 'fullscreen' as const, borderStyle: 'pill' as const },
  };
}
```

This is essential when the site uses shared `@agency/ui` components that expect the full `SiteConfig` type.

### 4.4 Key principles

1. **Every fetch function has fallback data** — the site must build without a CMS connection
2. **JSON fields need parsing** — `array` and `object` fields may arrive as JSON strings from D1
3. **Sort client-side** — SonicJs cannot sort by fields inside the `data` JSON blob
4. **Filter client-side** — SonicJs cannot filter by `data.*` fields (only top-level `status`, `collection_id`)
5. **No mapping layer** — components consume the native `CmsItem<T>` shape directly
6. **Use `resolveMediaUrl()`** for all media fields — supports external URLs, R2 CDN, and SonicJs media IDs
7. **Use `buildConfig()`** in pages — constructs the config object Nav/Footer/Layout expect from CMS settings

**Reference:** `sites/nikolaspetrou/src/lib/cms.ts`

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

**Reference implementation:** `infra/sonicjs/nikolaspetrou/src/plugins/admin-theme.ts`

### 6.1 Create the theme plugin

Create `src/plugins/admin-theme.ts` with four exports:

1. **`WHITE_LABEL`** — string replacements for branding (page titles, headings, descriptions)
2. **`whiteLabel(html)`** — function that applies replacements + replaces the SVG logo with text
3. **`CUSTOM_CSS`** — light theme CSS overrides injected into `<head>`
4. **`THEME_SCRIPT`** — theme toggle + Version History fix injected before `</body>`

Key replacements:

```typescript
export const WHITE_LABEL: [string, string][] = [
  ['SonicJS AI Admin', '<Client> CMS'],
  ['SonicJS AI', '<Client> CMS'],
  ['SonicJS', '<Client>'],
  ['Sonic JS', '<Client>'],
  ['Welcome to your <Client> CMS admin dashboard', 'Welcome to the <Client> content management system'],
  // Login page — clean card, no client branding
  ['Welcome Back', 'Content Management'],
  ['Sign in to your account to continue', 'Sign in to continue'],
  ["Don't have an account?", ''],
  ['Create one here', ''],
  ['v2.8.0', ''],
];
```

The SVG logo (viewBox `380 1300 2250 400`) is replaced via regex in the `whiteLabel()` function. On auth pages, the logo is removed entirely in the middleware (see Section 2.2).

### 6.2 Light theme

The dark class is stripped **server-side** in the middleware (not via JavaScript) to prevent any flash of dark theme:

```typescript
html = html.replace(/class="([^"]*)\bdark\b([^"]*)"/g, (_, b, a) => {
  const cleaned = `${b}${a}`.replace(/\s+/g, ' ').trim();
  return cleaned ? `class="${cleaned}"` : '';
});
```

### 6.3 Light mode CSS — critical fixes

The SonicJs admin was designed for dark mode. Stripping the `dark` class makes many elements invisible (light text on light background). The `CUSTOM_CSS` must include fixes for:

| Element | Issue | Fix |
|---|---|---|
| All buttons (Cancel, Update, etc.) | Invisible borders/text | Add `border-color` + `color` overrides |
| Header buttons (Docs, OpenAPI) | Faint border | Add border + background |
| Action icons (edit, delete) | Invisible SVG | Set `color` on SVG parents |
| Modals (Version History) | Invisible backdrop + text | Dark overlay background, dark text |
| Dropdowns | Invisible | White background + border |
| Tooltips | Invisible text | Dark background, white text |
| Checkboxes | Invisible | `accent-color` |
| Dashed borders (Add item) | Invisible | `border-color` override |
| `bg-white/10` transparent elements | Invisible | Convert to light hover style |

**Reference:** See the full CSS in `infra/sonicjs/nikolaspetrou/src/plugins/admin-theme.ts` — copy and adapt for each new client.

### 6.4 Theme script — Version History fix

SonicJs's Version History modal loads via HTMX, which injects a `<script>` tag containing `closeVersionHistory()`. Browsers don't execute `<script>` tags injected via `innerHTML`. The fix: define `closeVersionHistory` globally in the theme script:

```javascript
window.closeVersionHistory = function() {
  var modal = document.querySelector('.version-history-modal');
  if (modal) {
    var overlay = modal.closest('.fixed') || modal.parentElement;
    if (overlay) overlay.remove();
  }
};
```

Without this, the Version History modal cannot be closed.

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

## 9. Storage & Media (R2)

### 9.1 Create an R2 bucket per client (EU jurisdiction)

Every client gets their own R2 bucket in the **EU** jurisdiction for GDPR compliance:

```bash
# Create EU-jurisdiction bucket for the client
wrangler r2 bucket create <client-slug>-cms-media --jurisdiction eu

# Verify jurisdiction
wrangler r2 bucket list
```

**Important:** Use `--jurisdiction eu` for all client data. EU jurisdiction ensures data residency in European data centers. The EU endpoint differs from the default — use `*.eu.r2.cloudflarestorage.com`.

Update `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "<client-slug>-cms-media"
jurisdiction = "eu"
```

### 9.2 Storage limits and file restrictions

Configure in `wrangler.toml` `[vars]`:

```toml
[vars]
MAX_FILE_SIZE = "10485760"          # 10MB per file (in bytes)
ALLOWED_FILE_TYPES = "image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
BUCKET_NAME = "<client-slug>-cms-media"
```

Adjust per client:
- **Basic sites:** 10MB limit, images + PDFs only
- **Portfolio/media sites:** 50MB limit, add `video/mp4,video/webm`
- **Document-heavy sites:** 25MB limit, add `application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### 9.3 R2 bucket per client vs shared bucket

**Recommended: One bucket per client** (`<client-slug>-cms-media`)

- Clean isolation — no risk of cross-client data access
- Independent lifecycle rules and quotas
- Simple cleanup on client offboarding: delete the bucket
- Easy transfer: hand over the entire bucket

**Alternative: Shared bucket with prefixes** (`infront-uploads` with `<slug>/` prefix)

- Fewer buckets to manage
- But: no per-prefix storage limits, harder to isolate access

### 9.4 Cloudflare Images (optional)

For automatic image resizing/optimization, bind Cloudflare Images:

```toml
[vars]
IMAGES_ACCOUNT_ID = "<cloudflare-account-id>"
IMAGES_API_TOKEN = "<cloudflare-images-api-token>"
```

This enables SonicJs to generate thumbnails and serve optimized images via Cloudflare's CDN.

### 9.5 Media URLs in templates

```typescript
// Helper to get media URL from SonicJs
function getMediaUrl(cmsUrl: string, mediaId: string): string {
  return `${cmsUrl}/media/serve/${mediaId}`;
}

// In Astro components
<img src={getMediaUrl(import.meta.env.SONICJS_URL, item.data.image)} alt={item.title} />
```

### 9.6 R2 storage pricing

| Metric | Free tier | Paid |
|---|---|---|
| Storage | 10 GB/month | $0.015/GB/month |
| Class A ops (writes) | 1M/month | $4.50/M |
| Class B ops (reads) | 10M/month | $0.36/M |
| Egress | Free (always) | Free (always) |

Most client sites stay within the free tier.

---

## 10. Deployment

### 10.1 Create Cloudflare resources

```bash
cd infra/sonicjs/<client-slug>

# Create D1 database
wrangler d1 create <client-slug>-cms
# Copy the database_id to wrangler.toml

# Create KV namespace
wrangler kv namespace create CACHE_KV
# Copy the id to wrangler.toml

# Create R2 bucket in EU jurisdiction (see Section 9.1)
wrangler r2 bucket create <client-slug>-cms-media --jurisdiction eu
```

### 10.2 Deploy the CMS

```bash
cd infra/sonicjs/<client-slug>
wrangler deploy
```

The CMS will be live at `https://<client-slug>-cms.<account>.workers.dev`.

### 10.3 Seed production data

```bash
SONICJS_URL=https://<client-slug>-cms.<account>.workers.dev npm run seed
```

### 10.4 Deploy the site

```bash
cd sites/<client-slug>
SONICJS_URL=https://<client-slug>-cms.<account>.workers.dev npx astro build
wrangler deploy
```

### 10.5 Custom domains

Add custom domains via Cloudflare dashboard:
- CMS: `cms.<domain>` → Workers route
- Site: `<domain>` → Workers route

### 10.6 Auto-deploy on content publish

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

## 11. CI/CD & Auto-Deploy

### 11.1 GitHub Actions workflow

Create `.github/workflows/deploy-<slug>.yml`:

```yaml
name: Deploy <Client> Site
on:
  repository_dispatch:
    types: [cms-publish]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx astro build
        working-directory: sites/<slug>
        env:
          SONICJS_URL: ${{ secrets.SONICJS_URL }}
      - run: npx wrangler deploy
        working-directory: sites/<slug>
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 11.2 Auto-deploy on content publish

Add the `content:publish` hook in `src/index.ts` (see Section 10.6). When an editor publishes content, the CMS fires a GitHub Actions dispatch event that rebuilds and deploys the site automatically.

### 11.3 Preview deploys

For staging, use Cloudflare Workers preview environments:

```bash
wrangler deploy --env preview
```

---

## 12. Backups & Monitoring

### 12.1 D1 database backups

```bash
# Export full database
wrangler d1 export <db-name> --output=backup-$(date +%Y%m%d).sql

# Schedule via cron (add to CI/CD or local crontab)
# Daily backup to a git-tracked backups directory
```

D1 also has automatic point-in-time recovery (Cloudflare manages this).

### 12.2 R2 media backups

```bash
# List all objects
wrangler r2 object list <bucket-name>

# Sync to local directory (script each file)
for key in $(wrangler r2 object list <bucket-name> --json | jq -r '.[].key'); do
  wrangler r2 object get <bucket-name> "$key" --file="./backups/media/$key"
done
```

### 12.3 Health monitoring

SonicJs exposes a health endpoint:

```bash
curl https://<cms-url>/api/health
```

Set up uptime monitoring (e.g., Betterstack) to ping this endpoint.

### 12.4 Built-in analytics

The admin dashboard shows real-time analytics:
- Requests per second
- Content item counts
- Active users
- System status

Access at `/admin/dashboard` (admin role only).

---

## 13. Cost Management

### 13.1 Cloudflare pricing per client

| Resource | Free tier | Paid ($5/mo Workers plan) |
|---|---|---|
| **Workers requests** | 100K/day | 10M/month |
| **D1 storage** | 5 GB | 5 GB (then $0.75/GB) |
| **D1 reads** | 5M/day | 25B/month |
| **D1 writes** | 100K/day | 50M/month |
| **R2 storage** | 10 GB | $0.015/GB/month |
| **R2 reads** | 10M/month | $0.36/M |
| **R2 writes** | 1M/month | $4.50/M |
| **KV reads** | 100K/day | Unlimited |
| **KV storage** | 1 GB | 1 GB (then $0.50/GB) |

### 13.2 Typical cost per client

| Tier | Monthly cost | Suitable for |
|---|---|---|
| Free | $0 | Development, staging, low-traffic sites |
| Starter | $5 | Most client sites (< 10M requests/month) |
| Growth | $5-15 | Media-heavy sites with large R2 storage |

### 13.3 Monitoring usage

```bash
# Check D1 usage
wrangler d1 info <db-name>

# Check R2 usage
wrangler r2 bucket info <bucket-name>
```

Dashboard: https://dash.cloudflare.com → Workers & Pages → Usage

---

## 14. Migration Guide: Importing from Other CMS

**Reference implementation:** The nikolaspetrou migration from Directus is a complete worked example — see `infra/sonicjs/nikolaspetrou/` and `sites/nikolaspetrou/`.

### 14.1 From Directus

**Step 1: Export content from Directus**

Get the Directus token from the site's `.env` file, then export all collections:

```bash
TOKEN="<from sites/<slug>/.env DIRECTUS_TOKEN>"
CMS="https://cms.<domain>"

for col in projects services testimonials reels hero about site_settings; do
  curl -s -H "Authorization: Bearer $TOKEN" "$CMS/items/$col?limit=-1" > /tmp/directus-$col.json
  echo "$col: $(python3 -c "import json; d=json.load(open('/tmp/directus-$col.json')); print(len(d.get('data',[])))")"
done
```

This gives you real video URLs, descriptions, image references, Instagram reel links — everything.

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

## 15. Export Guide: Moving to Another CMS

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

## 16. Production Readiness

Before deploying a SonicJs-powered site for a real client, address these items in priority order.

### 16.1 CRITICAL: Close open registration

By default, anyone can create an account at `/auth/register`. This must be disabled before production.

**Option A: Block the route in middleware** (recommended)

Add to the `afterAuth` middleware in `src/index.ts`:

```typescript
// Block public registration in production
async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname === '/auth/register' && c.req.method === 'POST') {
    return c.json({ error: 'Registration is disabled. Contact the administrator.' }, 403);
  }
  await next();
},
```

**Option B: Hide the registration link** in the admin theme (cosmetic, not secure alone):

Add to `WHITE_LABEL` replacements:
```typescript
["Don't have an account?", ''],
['Create one here', ''],
```

Use both options together for defense in depth.

### 16.2 Build the dynamic pages route

The Pages collection has a block-based page builder, but the site needs a `[...slug].astro` route to render them:

```astro
---
// src/pages/[...slug].astro
import { getPages, getPageBySlug, getSiteSettings } from '../lib/cms';
import BaseLayout from '@agency/ui/layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const pages = await getPages();
  return pages.map(p => ({ params: { slug: p.slug }, props: { page: p } }));
}

const { page } = Astro.props;
const settings = await getSiteSettings();
const blocks = page.data.body ?? [];
---

<BaseLayout title={page.data.meta_title || page.title} config={/* ... */}>
  {blocks.map(block => {
    if (block.blockType === 'hero') return (
      <section class="px-6 py-20 text-center">
        <h1 class="text-4xl font-bold">{block.heading}</h1>
        {block.subheading && <p class="mt-4 text-lg text-neutral-500">{block.subheading}</p>}
      </section>
    );
    if (block.blockType === 'text') return (
      <section class="prose mx-auto max-w-3xl px-6 py-12" set:html={block.content} />
    );
    if (block.blockType === 'features') return (
      <section class="px-6 py-16">
        {block.heading && <h2 class="mb-8 text-center text-2xl font-bold">{block.heading}</h2>}
        <div class="grid gap-6 sm:grid-cols-3">
          {block.items?.map(f => (
            <div class="text-center">
              <span class="text-3xl">{f.icon}</span>
              <h3 class="mt-2 font-bold">{f.title}</h3>
              <p class="mt-1 text-sm text-neutral-500">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    );
    if (block.blockType === 'cta') return (
      <section class="bg-neutral-100 px-6 py-16 text-center">
        <h2 class="text-2xl font-bold">{block.heading}</h2>
        {block.text && <p class="mt-3 text-neutral-500">{block.text}</p>}
        {block.button_text && <a href={block.button_href} class="mt-6 inline-block rounded bg-blue-600 px-6 py-3 text-white">{block.button_text}</a>}
      </section>
    );
    if (block.blockType === 'faq') return (
      <section class="mx-auto max-w-3xl px-6 py-16">
        {block.heading && <h2 class="mb-8 text-2xl font-bold">{block.heading}</h2>}
        {block.items?.map(q => (
          <details class="border-b py-4">
            <summary class="cursor-pointer font-semibold">{q.question}</summary>
            <p class="mt-2 text-neutral-500">{q.answer}</p>
          </details>
        ))}
      </section>
    );
    if (block.blockType === 'image') return (
      <figure class="mx-auto max-w-4xl px-6 py-8">
        <img src={block.src} alt={block.alt || ''} class="w-full rounded-lg" loading="lazy" />
        {block.caption && <figcaption class="mt-2 text-center text-sm text-neutral-500">{block.caption}</figcaption>}
      </figure>
    );
  })}
</BaseLayout>
```

### 16.3 Set up staging/production environments

Add environment blocks to the CMS `wrangler.toml`:

```toml
# Default = development (local)

[env.staging]
name = "<slug>-cms-staging"
vars = { ADMIN_EMAIL = "admin@<domain>", JWT_SECRET = "<staging-secret>" }

[[env.staging.d1_databases]]
binding = "DB"
database_name = "<slug>-cms-staging"
database_id = "<staging-db-id>"

[env.production]
name = "<slug>-cms"
vars = { ADMIN_EMAIL = "admin@<domain>", JWT_SECRET = "<production-secret>" }

[[env.production.d1_databases]]
binding = "DB"
database_name = "<slug>-cms-prod"
database_id = "<prod-db-id>"
```

Deploy per environment:
```bash
wrangler deploy --env staging
wrangler deploy --env production
```

### 16.4 Restrict CORS and enable rate limiting

Add `beforeAuth` middleware to restrict API access:

```typescript
middleware: {
  beforeAuth: [
    // CORS: only allow the site origin
    async (c, next) => {
      const origin = c.req.header('origin');
      const allowed = ['https://<domain>', 'http://localhost:4322'];
      if (origin && !allowed.includes(origin)) {
        c.res.headers.set('Access-Control-Allow-Origin', '');
      }
      await next();
    },
  ],
  afterAuth: [ /* existing middleware */ ],
},
```

SonicJs has built-in security logging that detects XSS attempts, SQL injection patterns, and auth failures. Enable the logging middleware in the config.

### 16.5 Enable content workflow

Activate the Workflow plugin from the admin Plugins page, or via seed script:

```bash
wrangler d1 execute <db> --local \
  --command "UPDATE plugins SET status = 'active' WHERE name = 'Workflow Management';"
```

This adds approval chains: Draft → Under Review → Published. Editors submit for review, admins approve.

### 16.6 Wire analytics from CMS settings

Add fields to `site-settings.collection.ts`:

```typescript
analytics_provider: {
  type: 'select', title: 'Analytics Provider',
  enum: ['none', 'plausible', 'fathom', 'google-analytics'],
  default: 'none',
},
analytics_id: { type: 'string', title: 'Analytics ID', helpText: 'Site ID or measurement ID' },
```

Render in `BaseLayout` or `<head>`:
```astro
{settings.data.analytics_provider === 'plausible' && (
  <script defer data-domain={new URL(settings.data.url).hostname} src="https://plausible.io/js/script.js" />
)}
```

### 16.7 Implement automated backups

GitHub Actions cron workflow:

```yaml
name: Weekly D1 Backup
on:
  schedule:
    - cron: '0 3 * * 0'  # Every Sunday 3am
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - run: npx wrangler d1 export <db-name> --output=backup.sql
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      - uses: actions/upload-artifact@v4
        with:
          name: d1-backup-${{ github.run_id }}
          path: backup.sql
          retention-days: 90
```

### 16.8 Add automated tests

Minimum test coverage:

```typescript
// tests/cms.test.ts (Vitest)
import { describe, it, expect, vi } from 'vitest';

describe('cms.ts', () => {
  it('returns fallback data when CMS is unavailable', async () => {
    // Mock fetch to fail
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network'));
    const { getResources } = await import('../src/lib/cms');
    const resources = await getResources();
    expect(resources.length).toBeGreaterThan(0);
    expect(resources[0].title).toBeTruthy();
  });

  it('parses JSON string fields correctly', async () => {
    // Mock CMS response with JSON strings
    // Verify parseJson handles both string and parsed array
  });
});
```

Integration test: seed → build → check HTML output for expected content.

### 16.9 Create an editor handbook

Document for non-technical users:

1. **Logging in** — URL, credentials, what the editor dashboard looks like
2. **Editing content** — navigate to Content, filter by collection, click Edit
3. **Using the page builder** — add blocks, reorder, delete, choose block types
4. **Rich text editing** — Quill toolbar basics (bold, links, images)
5. **Publishing** — change status from Draft to Published, save
6. **Preview** — how to use the preview URL to see draft changes
7. **Media** — uploading images, using them in content

Store as a PDF or as a "Help" page accessible from the admin sidebar.

### 16.10 Test admin mobile responsiveness

Verify the admin works on:
- iPad (1024px width) — most common editor device after desktop
- Large phones (390px) — less critical but should be usable

Test with browser DevTools responsive mode. Fix any layout issues in the custom CSS (`admin-theme.ts`).

---

## 17. Known Limitations

Issues that exist in SonicJs v2.8.0 and cannot be fixed via configuration:

| Limitation | Impact | Workaround |
|---|---|---|
| Appearance settings don't save | Low | Use middleware CSS injection (what we do) |
| Config-managed badge always shows | Cosmetic | Collections still work; badge is informational |
| No visual/inline editing | Medium | Use live preview routes instead |
| Cannot sort/filter by data.* fields via API | Low | Sort and filter client-side after fetching |
| Cloudflare-only deployment | Medium | Accept the lock-in; site code is portable |
| TinyMCE requires paid API key | Low | Use Quill instead (free, no API key) |
| No built-in theme toggle that persists | Low | Implemented via middleware server-side |
| Registration defaults to viewer role | Low | Update role via D1 after registration |
| Migration 013 has a SQL syntax error | None | Non-critical (code examples plugin); other migrations work fine |

---

## 18. Reference

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

**CMS Setup:**
- [ ] Create CMS project in `infra/sonicjs/<slug>/`
- [ ] Copy `admin-theme.ts` from nikolaspetrou and update branding
- [ ] Define all collections in `src/collections/`
- [ ] Include `site_settings` collection (nav, footer, SEO, contact, social links)
- [ ] Include `submissions` collection (contact form storage)
- [ ] Include `form_settings` collection (notification recipients, field config)
- [ ] Write `seed.ts` — if migrating, export real content from live Directus first
- [ ] Set `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES`, `BUCKET_NAME` in wrangler.toml

**CMS Middleware (src/index.ts):**
- [ ] Block open registration with `x-seed-secret` header check in `beforeAuth`
- [ ] Skip HTMX partials — check for `<!DOCTYPE` before modifying HTML
- [ ] Strip `dark` class server-side
- [ ] Apply white-label branding via `whiteLabel()`
- [ ] Hide Forms sidebar for all users
- [ ] Role-based menu filtering for non-admin users
- [ ] Clean login page (remove logo, registration link, version badge)
- [ ] Replace Preview Content button with staging preview `<a>` link
- [ ] Inject `CUSTOM_CSS` and `THEME_SCRIPT`

**Admin Theme (src/plugins/admin-theme.ts):**
- [ ] Light theme CSS — all buttons have proper contrast
- [ ] Modal/dropdown/tooltip visibility fixes
- [ ] `closeVersionHistory()` global function fix
- [ ] Theme toggle button (sun/moon)
- [ ] Login page: no client branding, no registration link

**Site Build:**
- [ ] Create site in `sites/<slug>/`
- [ ] Build `src/lib/types.ts` with `CmsItem<T>` interfaces
- [ ] Build `src/lib/cms.ts` with:
  - [ ] `fetchCollection()` with preview mode toggle
  - [ ] `resolveMediaUrl()` helper (R2 + CDN + external URLs)
  - [ ] `buildConfig()` helper (SiteConfig for Nav/Footer/Layout)
  - [ ] Individual fetch functions per collection
  - [ ] Fallback data for all functions
- [ ] Create all page files — use `buildConfig(settings)` for Nav/Footer
- [ ] Flatten `CmsItem<T>` in page frontmatter before passing to components
- [ ] Add staging preview routes in `src/pages/staging/`
- [ ] Update `public/_headers` — remove Directus CSP, set appropriate security headers
- [ ] Add `SONICJS_URL` and `PREVIEW_TOKEN` to `sites/<slug>/wrangler.toml`

**Security (before production):**
- [ ] Set strong `JWT_SECRET` (not the dev default)
- [ ] Set unique `PREVIEW_TOKEN` (not `preview-secret`)
- [ ] Verify registration is blocked (test with curl)
- [ ] Update preview link URL in middleware from localhost to production domain

**User Management:**
- [ ] Create admin user (admin role) — via seed script with `x-seed-secret`
- [ ] Create editor user (editor role) for client
- [ ] Update roles via `wrangler d1 execute` after seeding

**Infrastructure:**
- [ ] Create D1 database
- [ ] Create KV namespace
- [ ] Create R2 bucket with `--jurisdiction eu`
- [ ] Set up staging and production environments in `wrangler.toml`
- [ ] Deploy CMS and seed production data
- [ ] Deploy site with `SONICJS_URL` pointing to production CMS
- [ ] Set up custom domains

**Monorepo:**
- [ ] Ensure `.npmrc` has `link-workspace-packages=true`
- [ ] Run `pnpm install` to link new site's `node_modules`

**Verification:**
- [ ] All pages build with CMS data
- [ ] Dynamic routes (e.g., works/[slug]) generate correctly
- [ ] Videos play from external URLs and R2
- [ ] Staging preview shows draft content with blue banner
- [ ] CMS admin: light theme, no SonicJs branding
- [ ] Editor role: only sees Dashboard/Content/Media
- [ ] Version History modal opens and closes
- [ ] Preview on Site link opens staging in new tab
- [ ] Contact form stores submissions in CMS
- [ ] Registration blocked for non-seed requests

**Operations:**
- [ ] Set up CI/CD workflow (GitHub Actions)
- [ ] Set up automated D1 backups (weekly cron)
- [ ] Set up uptime monitoring (Betterstack or similar)

**Client Handoff:**
- [ ] Share editor credentials and preview URL with client
- [ ] Verify all content is editable from the admin
- [ ] Test admin on tablet/mobile
