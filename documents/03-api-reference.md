# API Reference

All API routes are in `sites/admin/src/pages/api/`. All routes export `prerender = false` for SSR.

## Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login with password, returns JWT session cookie |
| `/api/auth/logout` | POST | Clears session cookie |

**Login request:**
```json
{ "password": "string" }
```

**Login response:** Sets `session` httpOnly cookie (24h expiry). Returns `{ "ok": true }`.

## Sites

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sites` | GET | List all sites with metadata |
| `/api/sites/create` | POST | Create a new site from template |
| `/api/sites/[slug]/delete` | DELETE | Delete site + Cloudflare resources |
| `/api/sites/[slug]/deploy-status` | GET | Current deploy status from .deploy.json |
| `/api/sites/[slug]/redeploy` | POST | Rebuild and redeploy to Workers |
| `/api/sites/[slug]/custom-domain` | POST/DELETE | Add/remove production domain |
| `/api/sites/[slug]/overrides` | GET | List component overrides |
| `/api/sites/[slug]/promote` | POST | Promote staging to production |
| `/api/sites/[slug]/export` | POST | Export site (static or source) |

### Create Site

**POST** `/api/sites/create`

Creates a new site from a template with full configuration.

```json
{
  "slug": "my-site",
  "name": "My Site",
  "tagline": "A great website",
  "domain": "mysite.com",
  "tier": "static",
  "templateId": "professional",
  "theme": {
    "navStyle": "sticky",
    "footerStyle": "multi-column",
    "heroDefault": "split",
    "borderStyle": "rounded"
  },
  "tokens": {
    "colors": {
      "primary": { "50": "#...", "100": "#...", ... "950": "#..." },
      "secondary": { ... },
      "accent": { ... },
      "neutral": { ... }
    },
    "fonts": { "heading": "Merriweather", "body": "Source Sans Pro" }
  },
  "contact": {
    "email": "info@example.com",
    "phone": "+1 555 0100",
    "address": { "street": "...", "city": "...", "postcode": "...", "country": "..." }
  },
  "nav": {
    "items": [{ "label": "About", "href": "/about" }],
    "cta": { "label": "Contact", "href": "/contact" }
  },
  "seo": {
    "defaultTitle": "My Site",
    "titleTemplate": "%s | My Site",
    "defaultDescription": "...",
    "defaultOgImage": "/og-default.jpg"
  },
  "footer": {
    "columns": [{ "title": "Links", "links": [{ "label": "About", "href": "/about" }] }],
    "legalLinks": [{ "label": "Privacy", "href": "/privacy" }]
  }
}
```

### Export Site

**POST** `/api/sites/[slug]/export`

```json
{ "type": "static" }   // Built HTML/CSS/JS from dist/
{ "type": "source" }    // Full Astro source with shared components inlined
```

Response includes file manifest, generated standalone package.json, and instructions. Does NOT include `.env`, `.deploy.json`, `.key`, `.pem` files.

## Pages (Visual Editor)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sites/[slug]/pages` | GET | List all page schemas |
| `/api/sites/[slug]/pages/[page]` | GET | Get single page schema |
| `/api/sites/[slug]/pages/[page]` | PUT | Save page schema (writes JSON + compiles .astro) |
| `/api/sites/[slug]/pages/[page]/sections` | POST | Add a section |
| `/api/sites/[slug]/pages/[page]/sections` | DELETE | Remove a section |
| `/api/sites/[slug]/pages/[page]/sections/reorder` | PUT | Reorder sections |

### Save Page Schema

**PUT** `/api/sites/[slug]/pages/[page]`

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
      "variant": "centered",
      "props": { "heading": "Welcome" }
    }
  ]
}
```

Validates with zod. Page name in body must match URL parameter. Writes schema JSON and compiles `.astro` file.

### Add Section

**POST** `/api/sites/[slug]/pages/[page]/sections`

```json
{
  "section": { "id": "cta-1", "component": "CTA", "variant": "default", "props": {} },
  "position": 2
}
```

### Reorder Sections

**PUT** `/api/sites/[slug]/pages/[page]/sections/reorder`

```json
{ "sectionIds": ["cta-1", "hero-1", "features-1"] }
```

## Site Config

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sites/[slug]/config` | GET | Read site.config.ts |
| `/api/sites/[slug]/config` | PUT | Write site.config.ts |

Full `SiteConfig` validation with zod (name, tagline, url, locale, contact, seo, nav, footer, theme, analytics, cms).

## Media

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sites/[slug]/media` | GET | List images in public/images/ |
| `/api/sites/[slug]/media` | POST | Upload image (multipart/form-data) |
| `/api/sites/[slug]/media` | DELETE | Delete image by filename |

**Upload constraints:** Extensions whitelist (.jpg, .jpeg, .png, .gif, .webp, .avif, .svg, .ico), 5MB max, filename sanitized, path traversal protection.

## Checklist

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sites/[slug]/checklist` | GET | Setup checklist by inspecting site state |

Returns 9 items across 3 categories (setup, content, deploy) with completion status detected automatically.

## Versions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sites/[slug]/versions` | GET | Git version history for the site |
| `/api/sites/[slug]/versions` | POST | Save version or revert to commit |

**Save:** `{ "action": "save", "message": "optional" }`
**Revert:** `{ "action": "revert", "commitHash": "abc1234" }`

## Dev Server

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sites/[slug]/dev-server` | GET | Check dev server status |
| `/api/sites/[slug]/dev-server` | POST | Start/stop dev server |
| `/api/dev-servers` | GET | List all running dev servers |
| `/api/dev-servers` | POST | Stop all dev servers |

Dev servers run on ports 4400-4500 with 30-minute auto-shutdown.

## Input Validation

All `[slug]` routes validate with: `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/`
All `[page]` routes validate with: `/^[a-z0-9][a-z0-9-]*$/`
Request bodies validated with zod schemas.
