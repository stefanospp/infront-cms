# Changelog

All changes to the platform, ordered chronologically.

## 2026-03-22

### Cloudflare Workers Migration
- **Migrated** all client site deployments from Cloudflare Pages to Cloudflare Workers
- Sites deploy via `wrangler deploy` reading `wrangler.toml` with `[assets]` config
- Generator creates `wrangler.toml` per site automatically
- Updated cloudflare.ts: removed Pages API calls, added Workers + Workers Custom Domains API
- Updated deploy.ts: new `wranglerDeploy()` runs from site directory
- Build script changed from npm to pnpm for workspace:* compatibility
- **Commit:** `468f999`

### Visual Editor — Full-Page Preview & Auto-Save
- Added full-page preview toggle (hides sidebar/properties, expands iframe)
- Added 1.5-second debounced auto-save on any edit
- Fixed config expression preservation (`{config.theme.heroDefault}` passes through as Astro expression)
- Fixed preview iframe not updating when switching pages
- Fixed dev server status polling (read from nested `server` object)
- **Commits:** `7dce6f8`, `8646841`, `25eb913`

### Visual Editor — Bug Fixes from Browser Testing
- Fixed Vite 8 vs 7 version conflict (pinned via pnpm overrides)
- Added `global.css` import to editor page (Tailwind classes weren't loading)
- Disabled Astro dev toolbar overlay on admin
- Fixed `ArrayInput` crash when parsed props aren't arrays (`Array.isArray` guard)
- Fixed auth middleware/login to use `env()` helper for local dev compatibility
- **Commits:** `9138908`, `5616d63`

### QA — Code Review Fixes
- Fixed zod `PageSchema` validation (top-level `description` → nested `seo` object)
- Fixed zod `SectionSchema` validation (added missing heading/subheading/background/sectionId)
- Added `PAGE_PATTERN` validation to all page API routes (path traversal prevention)
- Fixed config round-trip bug (`writeSiteConfig` output format matches `readSiteConfig`)
- Fixed `getSessionPayload` default role from `'admin'` to `'client'` (least privilege)
- Removed absolute server paths from export API responses
- Excluded `.env`, `.deploy.json`, `.key`, `.pem` from source exports
- Fixed `handlePublish` — await async call instead of fire-and-forget
- Added `video` to `heroDefault` enum in config API
- Parser now strips `data-section-id`/`data-component` bridge attributes on round-trip
- Parser handles `<div>` wrappers from compiler for unwrapped sections
- **Commits:** `00badf5`, `584db23`

### Phase 5 — Auth, Versioning, Export, Deploy Promotion
- Auth with roles: `UserRole` (admin/client), `SessionPayload` with `allowedSites`
- `getSessionPayload`, `canAccessSite`, `isAdmin` helpers
- Content versioning: `autoCommitSite`, `getVersionHistory`, `revertToVersion`
- Versions API: `GET/POST /api/sites/[slug]/versions` (history + save/revert)
- Site export: `POST /api/sites/[slug]/export` (static dist or standalone source)
- Deploy promotion: `POST /api/sites/[slug]/promote` (staging → production)
- **Commit:** `46b393a`

### Phase 4 — Media Library, Checklist, Config Editor
- Media API: `GET/POST/DELETE /api/sites/[slug]/media` with upload/list/delete
- Media library modal with grid view, upload, delete, and picker mode
- Setup checklist API: 9 items across 3 categories inspecting actual site state
- Site config editor modal with tabbed UI (general/contact/SEO/nav/theme)
- Config API: `GET/PUT /api/sites/[slug]/config` with full zod validation
- Settings and Media buttons in editor toolbar
- **Commits:** `f2c97c7`, `91ac227`

### Phase 3 — Inline Editing Bridge
- Editor bridge Vite plugin (`editorBridgePlugin`) injects postMessage script
- Schema compiler adds `data-section-id`/`data-component` attributes
- Click in preview selects section in sidebar via postMessage
- Double-click enables contenteditable inline text editing
- Bidirectional highlight sync between sidebar and preview
- **Commit:** `eadf909`

### Phase 1 & 2 — Visual Editor Foundation
- Component registry: 22 components cataloged with props, variants, categories
- Page schema types (`PageSchema`, `SectionSchema`)
- Schema-to-Astro compiler
- Astro-to-schema parser
- Dev server manager (ports 4400-4500, auto-shutdown)
- Three-panel editor UI (sidebar, preview, properties)
- Page schema CRUD API routes
- Section management APIs (add/remove/reorder)
- Fixed type mismatches between editor components and config types
- 72 initial tests → grew to 269 tests
- **Commit:** `637d0da`

### Pre-Editor Features
- Full CMS collection support: services, testimonials, FAQ, gallery, pricing, stats, clients
- Site deletion API and danger zone UI
- Dynamic CMS pages route
- CMS page templates for Directus-connected sites
- Tailwind CSS scanning path fixes
- **Commits:** `fbc4f24` through `af2fcd4`
