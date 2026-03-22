# Architecture Blueprint: Shopify-Style Site Management Platform

> **Status:** In Progress — Phase 1 Complete, Phase 2 Starting
> **Created:** 2026-03-22
> **Last Updated:** 2026-03-22
> **Purpose:** Guide the transformation of the current site generator into a Shopify-inspired management platform

---

## Context

Transform the current "site generator + file editing" workflow into a Shopify-inspired platform with two interfaces:

1. **Website Editor** (visual, hybrid) — section panel + inline click-to-edit on a live preview
2. **Admin Area** (dashboard) — theme selection, CMS content management, site settings, deploy

**Target user:** The agency — internal tool for managing client sites.
**No ecommerce** — "products" means any structured CMS collection (team, portfolio, services, etc.).
**Portability required** — clients must be able to export and leave with their site.

---

## The Target Workflow

```
1. Open admin → Create new site
2. Pick a theme/template → Site is generated and deployed
3. Open "Website Editor" for the site
   - Left panel: page list + section tree (add/remove/reorder sections, change variants)
   - Center: live preview iframe (the actual site running on dev server)
   - Click on text/images in the preview → edit inline
   - Right panel: settings for selected section (props, variant, colors, content)
   - Save → writes changes to .astro files → rebuild → deploy
4. Go to Admin Area for the site
   - Pages section: manage static page content (about text, contact info)
   - Collections section: manage CMS content (team members, blog posts, portfolio items)
   - Media library: upload/manage images and assets
   - Settings: site config (nav, footer, SEO, contact, analytics)
   - Deploy: manual redeploy, view status, staging/production URLs
```

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────┐
│                  Admin Area (Dashboard)           │
│                                                   │
│  ┌──────────┐ ┌───────────┐ ┌──────────────────┐ │
│  │  Sites    │ │ Content   │ │  Settings        │ │
│  │  List     │ │ Manager   │ │  (config, SEO,   │ │
│  │          │ │ (CMS      │ │   nav, footer)   │ │
│  │  Create  │ │  collections│ │                  │ │
│  │  Delete  │ │  via       │ │  Media Library   │ │
│  │  Deploy  │ │  Directus) │ │                  │ │
│  └──────────┘ └───────────┘ └──────────────────┘ │
│                      │                            │
│              "Open Editor" button                 │
│                      │                            │
└──────────────────────┼────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Website Editor (Visual)              │
│                                                   │
│  ┌──────────┐ ┌─────────────────┐ ┌────────────┐ │
│  │ Page List │ │                 │ │  Section   │ │
│  │          │ │   Live Preview  │ │  Settings  │ │
│  │ Section  │ │   (iframe)      │ │            │ │
│  │ Tree     │ │                 │ │  Variant   │ │
│  │          │ │  Click-to-edit  │ │  Props     │ │
│  │ Add      │ │  text & images  │ │  Content   │ │
│  │ Remove   │ │                 │ │  Styling   │ │
│  │ Reorder  │ │                 │ │            │ │
│  └──────────┘ └─────────────────┘ └────────────┘ │
│                                                   │
│         [ Save Draft ]  [ Publish ]               │
└─────────────────────────────────────────────────┘
                       │
                       ▼
              ┌──────────────┐
              │  Site Files   │
              │  sites/<slug> │
              │               │
              │  .astro pages │
              │  site.config  │
              │  global.css   │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │  Build &     │
              │  Deploy      │
              │  (Cloudflare)│
              └──────────────┘
```

---

## Key Architectural Decisions

### 1. Page Representation — "Page Schema"

**Problem:** Currently, pages are `.astro` files with components. The editor needs a structured representation it can read and write.

**Solution:** Introduce a `page-schema.json` per page that describes the section composition:

```json
{
  "page": "index",
  "title": "Home",
  "layout": "FullWidth",
  "seo": { "title": "...", "description": "..." },
  "sections": [
    {
      "id": "hero-1",
      "component": "Hero",
      "variant": "split",
      "props": {
        "heading": "Welcome to Our Agency",
        "subheading": "We build beautiful websites",
        "buttonText": "Get Started",
        "buttonHref": "/contact",
        "image": "/images/hero.jpg"
      }
    },
    {
      "id": "features-1",
      "component": "Features",
      "variant": "grid",
      "props": {
        "features": [
          { "title": "Web Design", "description": "..." },
          { "title": "Development", "description": "..." }
        ]
      }
    },
    {
      "id": "cta-1",
      "component": "CTA",
      "variant": "default",
      "props": {
        "heading": "Ready to start?",
        "buttonText": "Contact Us",
        "buttonHref": "/contact"
      }
    }
  ]
}
```

**How it works:**
- The site generator creates both `.astro` files AND `page-schema.json` files
- The editor reads/writes the schema
- On save, a **schema-to-astro compiler** regenerates the `.astro` file from the schema
- The `.astro` file is always the source of truth for the build system
- For existing sites without schemas, a **parser** can extract a schema from `.astro` files (best-effort)

**Why this approach:**
- The editor doesn't need to parse/modify raw Astro template syntax
- The schema is a clean API contract between editor and build
- The `.astro` files remain standard Astro — no runtime dependency on the editor
- Component overrides still work (the schema just references component names)

### 2. Live Preview — Dev Server in an Iframe

**Problem:** Need a live preview that updates as the user edits.

**Solution:**
- When the editor opens, spin up the Astro dev server for that site (`npm run dev --workspace=sites/<slug>`)
- Embed the dev server URL in an iframe
- When the user makes changes (via the editor), write to the schema + regenerate the `.astro` file
- The Astro dev server's HMR picks up the file change and the iframe auto-refreshes
- A WebSocket connection between the editor UI and the server coordinates state

**Considerations:**
- Dev server runs on a dynamic port per site (avoid conflicts)
- Only one editor session per site at a time (mutex)
- Dev server should auto-shutdown after inactivity (15-30 min)
- The iframe needs to communicate with the parent (for click-to-edit)

### 3. Click-to-Edit (Inline Editing)

**Problem:** User clicks on text/images in the preview iframe and edits inline.

**Solution:**
- In dev mode, inject a small script into the preview that:
  - Adds `data-section-id` and `data-prop-path` attributes to editable elements
  - Listens for clicks and sends a `postMessage` to the parent editor frame
  - Highlights the selected element with an overlay
- The parent editor receives the message, shows the appropriate editing UI
- For text: show an inline text editor (contenteditable) or open the prop in the right panel
- For images: open a media picker
- Changes flow: editor UI → API → write schema → regenerate .astro → HMR refresh

**Implementation approach:**
- A Vite plugin (or Astro integration) injects the editor bridge script only in dev mode
- Shared components already have predictable prop structures — we know what's editable
- The script maps DOM elements back to section IDs + prop paths

### 4. Section Management

**Add a section:**
- Left panel shows an "Add Section" button
- Opens a section picker showing all available components with their variants (visual thumbnails)
- Components grouped by type: Hero, Content, Features, Testimonials, CTA, FAQ, Gallery, etc.
- User picks one → it's inserted into the schema at the chosen position → .astro regenerated → preview updates

**Remove a section:**
- Click the trash icon on a section in the tree → removed from schema → regenerated

**Reorder sections:**
- Drag-and-drop in the section tree → schema updated → regenerated

**Change variant:**
- Select section → right panel shows variant picker with visual thumbnails
- Switch variant → schema updated → regenerated

### 5. Content Management (Admin Area)

**For CMS-tier sites**, the admin area needs a content management section.

**Two approaches:**

**Option A — Embed Directus (recommended to start)**
- Directus already has a full admin UI
- Embed it in an iframe within the admin area, or link to it
- Pros: zero development effort, full CMS features
- Cons: separate auth, different UI style, less integrated

**Option B — Build a content UI on top of Directus API (future)**
- Custom content management pages in the admin that talk to Directus REST API
- List/create/edit/delete items in any collection
- Media library that wraps Directus file management
- Pros: unified UI, seamless experience
- Cons: significant development effort, reimplementing what Directus already does

**Recommendation:** Start with Option A for speed. Migrate to Option B for specific high-traffic collections where a tailored UI adds value.

### 6. Site Settings (Admin Area)

A settings page that reads/writes `site.config.ts`:

- **Identity:** site name, tagline, URL
- **Contact:** email, phone, address
- **Navigation:** add/remove/reorder nav items, CTA button
- **Footer:** columns, links, socials
- **SEO:** default title, description, OG image
- **Theme:** colors, fonts (same picker as wizard, but post-launch)
- **Analytics:** provider + site ID
- **CMS:** Directus URL

Save writes to `site.config.ts` and triggers a redeploy.

### 7. Media Library

- Upload images/files to `sites/<slug>/public/images/`
- Browse uploaded assets with thumbnails
- Use in the editor (image picker references assets from the library)
- For CMS sites, also bridge to Directus file storage

### 8. Save & Publish Flow

```
User edits in editor
        │
        ▼
  "Save Draft"                    "Publish"
        │                              │
        ▼                              ▼
  Write schema +              Write schema +
  regenerate .astro            regenerate .astro
  (dev server HMR              + build + deploy
   shows changes)              to Cloudflare
        │                              │
        ▼                              ▼
  Changes visible              Changes live at
  in preview only              staging/production URL
```

---

## New Routes & Pages

### Admin Area (existing `sites/admin/`)

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — site list (exists) |
| `/sites/new` | Site wizard (exists) |
| `/sites/[slug]` | Site management (exists, extend) |
| `/sites/[slug]/settings` | **NEW** — site config editor |
| `/sites/[slug]/content` | **NEW** — CMS content manager (or Directus embed) |
| `/sites/[slug]/media` | **NEW** — media library |
| `/sites/[slug]/editor` | **NEW** — the website editor (hybrid visual editor) |

### API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sites/[slug]/pages` | GET | List page schemas |
| `/api/sites/[slug]/pages/[page]` | GET/PUT | Read/write page schema |
| `/api/sites/[slug]/pages/[page]/sections` | POST/DELETE | Add/remove sections |
| `/api/sites/[slug]/pages/[page]/sections/reorder` | PUT | Reorder sections |
| `/api/sites/[slug]/config` | GET/PUT | Read/write site.config.ts |
| `/api/sites/[slug]/theme` | GET/PUT | Read/write global.css tokens |
| `/api/sites/[slug]/media` | GET/POST/DELETE | Media library CRUD |
| `/api/sites/[slug]/dev-server` | POST | Start/stop dev server |
| `/api/sites/[slug]/preview` | GET | Get dev server URL for iframe |
| `/api/sites/[slug]/export/static` | POST | Build and zip the `dist/` output |
| `/api/sites/[slug]/export/source` | POST | Inline dependencies, clean imports, zip source |
| `/api/sites/[slug]/export/cms` | POST | Export Directus schema + data dump |

---

## Component Registry

The editor needs to know what components exist and what props they accept.

**Location:** `packages/config/src/component-registry.ts` (new file)

```typescript
export const componentRegistry = {
  Hero: {
    name: 'Hero',
    category: 'hero',
    variants: ['centered', 'split', 'fullscreen', 'minimal', 'video'],
    props: {
      heading: { type: 'text', label: 'Heading', required: true },
      subheading: { type: 'text', label: 'Subheading' },
      buttonText: { type: 'text', label: 'Button Text' },
      buttonHref: { type: 'url', label: 'Button Link' },
      image: { type: 'image', label: 'Background Image' },
    },
    thumbnail: '/thumbnails/hero.png',
  },
  CardGrid: {
    name: 'CardGrid',
    category: 'content',
    variants: ['two-column', 'three-column', 'four-column', 'masonry', 'list'],
    props: {
      cards: {
        type: 'array',
        label: 'Cards',
        itemProps: {
          title: { type: 'text' },
          description: { type: 'richtext' },
          image: { type: 'image' },
          href: { type: 'url' },
        },
      },
    },
  },
  // ... all other components
};
```

This registry drives:
- The section picker (what can be added)
- The right panel (what props are editable)
- The inline editing (what's clickable in the preview)

---

## Site Export & Portability

### Principle

The editor and platform tooling are **proprietary**. The site output is **portable**. Clients can leave and take their website with them.

### Two Export Options

**Option 1 — Static Site Export**
- Run `astro build` → output the `dist/` folder (HTML, CSS, JS, images)
- Client gets a fully built static site they can host on any static hosting (Netlify, Vercel, S3, etc.)
- No source code, no Astro knowledge needed
- This is the simplest exit path

**Option 2 — Directus-Compatible Source Export**
- Export the site as a standalone Astro project:
  - Inline all `@agency/ui` components into the site's `src/components/` directory
  - Replace `@agency/ui/*` imports with local `./components/*` imports
  - Replace `@agency/utils` imports with copied utility files
  - Include `site.config.ts`, `global.css`, `astro.config.mjs` (cleaned of proprietary plugins)
  - Export Directus schema snapshot (`directus schema snapshot`) + database dump
  - Export uploaded media files
- Client gets a standard Astro project + Directus backup they can deploy anywhere

**What stays proprietary (NOT exported):**
- The admin area (`sites/admin/`)
- The website editor
- Page schema files and the schema-to-astro compiler
- Component registry
- Deploy pipeline and automation
- Editor bridge Vite plugin

### Design Rule

> **The `.astro` files are always the source of truth, not the page schemas.**

The page schema is a convenience layer for the editor. The `.astro` files must always be valid, buildable Astro code. If you delete the schema, the site still works. This means:

- Schema → .astro compilation is one-way (schema drives .astro generation)
- The .astro files never reference or depend on the schema
- The build system (`astro build`) knows nothing about schemas
- Export simply copies the .astro files and inlines the shared dependencies

---

## Auth & User Management

### Current State
- Single admin user with bcrypt password + JWT session cookie (24h expiry)
- No roles, no multi-user, no client access

### Proposed Model

**Two user types:**

| Role | Access | Purpose |
|------|--------|---------|
| **Agency Admin** | Full access to everything | Build sites, manage all clients, deploy, export |
| **Client User** | Scoped to their site(s) only | Edit content in CMS, view analytics, request changes |

**Agency Admin:**
- Full admin area access
- Website editor for all sites
- Deploy, export, delete capabilities
- Manage client users

**Client User (optional, future):**
- Sees only their site(s) on the dashboard
- CMS content management (Directus) — edit blog posts, team members, etc.
- View deploy status and staging/production URLs
- Cannot access the website editor (layout changes go through you)
- Cannot deploy or export (request-based)
- Cannot see other clients' sites

### Auth Architecture

```
┌──────────────┐     ┌──────────────┐
│  Admin Login  │     │ Client Login  │
│  (existing)   │     │ (new)         │
└──────┬───────┘     └──────┬───────┘
       │                     │
       ▼                     ▼
┌─────────────────────────────────────┐
│         JWT Session + Role          │
│  { userId, role: 'admin'|'client',  │
│    sites: ['slug1', 'slug2'] }      │
└──────────────────┬──────────────────┘
                   │
                   ▼
         Route-level middleware
         checks role + site access
```

**Implementation:**
- Extend the existing JWT to include `role` and `allowedSites` fields
- Add middleware that checks permissions per route
- Client users stored in a simple JSON file or SQLite (no need for a full user DB at agency scale)
- Invite flow: agency creates a client user → sends login link → client sets password

---

## Deployment Strategy

### Current State
- Build → wrangler pages deploy → live
- Single environment (staging URL = production URL initially)
- No rollback mechanism
- No preview deployments

### Proposed Model

**Three environments:**

| Environment | URL | Purpose |
|-------------|-----|---------|
| **Dev** | `localhost:<port>` | Live editor preview (dev server) |
| **Staging** | `<slug>.infront.cy` | Review before going live |
| **Production** | `<custom-domain>` | Client-facing live site |

**Deployment flow:**

```
Editor changes
      │
      ▼
  Save Draft ──→ Dev preview only (dev server)
      │
      ▼
  "Deploy to Staging" ──→ Build + deploy to <slug>.infront.cy
      │
      ▼
  Review on staging URL
      │
      ▼
  "Promote to Production" ──→ Deploy same build to production domain
```

**Rollback:**
- Keep the last 3 builds in Cloudflare Pages (they support deployment rollback natively)
- Add a "Rollback" button in the admin UI that reverts to the previous deployment
- Cloudflare Pages API: `POST /deployments/{id}/rollback`

**Preview deployments:**
- Cloudflare Pages creates a unique preview URL for every deployment
- Use these as the staging mechanism (already built into the platform)
- Production promotion = setting the production deployment alias

**Git-based safety:**
- Every deploy auto-commits to a `deploy/<slug>` branch before building
- This gives you git history of all deployed states
- Can diff any two deployments
- Can restore any previous state from git

---

## Effort Estimates

| Component | Effort | Status |
|-----------|--------|--------|
| Page schema format + schema-to-astro compiler | 1 week | **DONE** |
| Component registry | 2-3 days | **DONE** |
| Dev server management (start/stop/proxy) | 3-4 days | **DONE** |
| Section management panel (left panel) | 1 week | Pending |
| Live preview iframe + HMR | 3-4 days | Pending |
| Inline editing bridge (click-to-edit) | 1-2 weeks | Pending |
| Right panel (section settings) | 1 week | Pending |
| Site config editor (settings page) | 3-4 days | Pending |
| Media library | 3-4 days | Pending |
| CMS content UI (Directus embed) | 2-3 days | Pending |
| Save/publish flow | 3-4 days | Pending |
| Auth & user management | 3-4 days | Pending |
| Deployment strategy (staging/prod/rollback) | 1 week | Pending |
| Site export (static + source + CMS) | 1 week | Pending |
| **Total MVP** | **~8-10 weeks** | |

---

## Build Order

### Phase 1: Foundation — COMPLETE

**Delivered files:**

| File | Purpose |
|------|---------|
| `packages/config/src/component-registry.ts` | Registry of all 22 components (19 Astro + 3 React islands) with variants, props, categories |
| `packages/config/src/page-schema.ts` | `PageSchema` and `SectionSchema` type definitions |
| `packages/utils/src/schema-compiler.ts` | `compilePageSchema()` — generates `.astro` files from JSON schemas |
| `packages/utils/src/schema-parser.ts` | `parseAstroToSchema()` — extracts schemas from existing `.astro` files |
| `sites/admin/src/lib/dev-server.ts` | `DevServerManager` singleton — start/stop/manage Astro dev servers per site |
| `sites/admin/src/pages/api/sites/[slug]/dev-server.ts` | Per-site dev server API (GET status, POST start/stop) |
| `sites/admin/src/pages/api/dev-servers.ts` | Admin-level API (list all, stop all) |

**Updated files:**
| File | Changes |
|------|---------|
| `packages/config/src/index.ts` | Re-exports component registry + page schema types |
| `packages/utils/src/index.ts` | Re-exports `compilePageSchema` + `parseAstroToSchema` |
| `sites/admin/src/data/help-content.ts` | Added dev server API documentation article |

**Tests:** 72 tests passing (45 new + 27 existing)

| Test File | Tests |
|-----------|-------|
| `tests/integration/component-registry.test.ts` | 16 |
| `tests/integration/schema-compiler.test.ts` | 14 |
| `tests/integration/schema-parser.test.ts` | 11 (includes round-trip compile→parse tests) |
| `tests/integration/dev-server.test.ts` | 15 (structural + security contract tests) |

**Security hardening applied:**
- Slug validation (kebab-case regex, path traversal rejection)
- `export const prerender = false` on all API routes
- Port allocation upper bound (4400-4500)
- Concurrent-safe ID generation in schema parser

### Phase 2: Editor MVP (Complete)
- Page schema API routes (CRUD for page schemas)
- Editor page layout (three-panel React island)
- Section management panel (add/remove/reorder)
- Live preview iframe (connects to dev server)
- Right panel with section settings (variant picker, prop editing)
- Save → regenerate → HMR flow
- Type-safety fixes: aligned editor components with config types

### Phase 3: Inline Editing (Complete)
- Editor bridge Vite plugin (`editorBridgePlugin`) — injects bridge script in dev mode
- Schema compiler generates `data-section-id` and `data-component` attributes
- Click-to-select: clicking in iframe selects section in sidebar via postMessage
- Inline text editing: double-click text to edit in-place (contenteditable)
- Bidirectional communication: sidebar selection highlights in preview, preview clicks update sidebar
- Prop updates from inline editing flow back to editor state
- Auto-disables when not in iframe (production safe)

### Phase 4: Admin Enhancements (In Progress)
- Site config editor modal with tabbed UI (general, contact, SEO, nav, theme) — Complete
- Config API route (GET/PUT /api/sites/[slug]/config) with full zod validation — Complete
- Settings button in editor toolbar — Complete
- Media library — Pending
- CMS content management (Directus embed) — Pending
- Post-creation setup checklist — Pending

### Phase 5: Polish & Infrastructure
- Auth & user management (admin + client roles)
- Deployment strategy (staging → production promotion, rollback)
- Site export functionality (static + source + CMS)
- Content versioning (auto-commit on save, version history panel)

---

## Risks & Trade-offs

| Risk | Mitigation |
|------|-----------|
| Schema ↔ .astro sync can drift | Schema is always the source; .astro is generated. Existing manually-edited sites need a migration path |
| Dev server per site uses resources | Auto-shutdown after inactivity; limit concurrent sessions |
| Inline editing is complex (iframe ↔ parent communication) | Start with panel-only editing (right panel); add inline editing as enhancement |
| Component overrides complicate the registry | Registry shows shared components; overrides are flagged but not editable through the visual editor |
| 30s deploy delay on publish | Show progress indicator; consider partial deploys for content-only changes |
| Export must inline shared components | Build a dependency inlining script that resolves and copies imports |
| Client user access needs careful scoping | Start with admin-only; add client roles as a second phase |

---

## Blind Spots — Things to Keep in Mind

### 1. Content Versioning & Undo
- Auto-commit to git before every "Save" in the editor (local branch, not pushed)
- "Version History" panel showing recent saves with timestamps
- One-click revert to any previous save

### 2. Shared Component Updates
- When you update a shared component in `packages/ui`, it affects ALL sites
- Run builds for all sites in CI before deploying shared changes
- Show a "Pending updates" banner when shared packages change
- One-click "rebuild all sites" in the admin

### 3. Form Submissions
- Add a "Submissions" section in the admin per site
- Store form submissions in a simple DB or JSON (in addition to email via Resend)
- Show a badge count on the dashboard for unread submissions

### 4. Backups & Disaster Recovery
- `infra/backups/` already has backup scripts — ensure they run on schedule
- Git is the backup for site files (daily auto-commit + push to remote)
- Directus: automated pg_dump on a cron (daily)
- Uploaded media: rsync to backup storage (daily)

### 5. Monitoring & Uptime
- Already using Betterstack for uptime monitoring
- Add uptime status indicators to the admin dashboard per site
- Show Cloudflare analytics (page views, bandwidth) in the admin

### 6. SEO & Redirects
- When a page is renamed/moved in the editor, automatically generate a 301 redirect
- Store redirects in a `_redirects` file (Cloudflare Pages supports this natively)
- Show a "Redirects" section in site settings for manual additions

### 7. Legal Compliance (GDPR, Cookie Consent)
- Cookie consent island exists in `packages/ui/src/islands/`
- Make cookie consent configurable per site (which cookies, which providers)
- Auto-generate privacy policy from site config

### 8. Image Optimization Pipeline
- Auto-optimize images on upload (resize, compress, convert to WebP/AVIF)
- Store multiple sizes for responsive `srcset`
- Consider Cloudflare Image Resizing at the edge

### 9. Multi-language / i18n
- Not a priority now, but don't block it architecturally
- Astro has built-in i18n routing; Directus supports translations natively
- Design the page schema to be language-aware when the time comes

### 10. Template Updates
- Templates are starting points, not ongoing dependencies
- Shared component improvements DO propagate (shared packages)
- Page structure changes are manual — don't auto-update (too risky)

---

## Not In Scope (Future Considerations)

- Real ecommerce (products, cart, checkout, payments)
- AI content generation (Shopify Magic equivalent)
- Collaborative editing (multiple people editing simultaneously)
- Mobile-specific layout editing in the visual editor
- A/B testing or feature flags per site
- White-label admin (client sees their own branding, not yours)
