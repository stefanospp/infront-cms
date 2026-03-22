# Development Guide

## Prerequisites

- Node.js >= 20
- pnpm (package manager)
- Cloudflare account with API token (for deployment)

## Setup

```bash
git clone https://github.com/stefanospp/infront-cms.git
cd infront-cms
pnpm install
```

## Local Development

### Admin Dashboard

```bash
# Set the monorepo root for local dev
MONOREPO_ROOT=$(pwd) npm run dev --workspace=sites/admin

# Open http://localhost:4321
# Login password: admin (in dev)
```

The admin reads environment from `sites/admin/.env`:
```
ADMIN_PASSWORD_HASH=$2a$10$...
SESSION_SECRET=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_ZONE_ID=...
```

### Client Site

```bash
# Dev server for a specific site
pnpm dev --filter @agency/{slug}

# Or from the site directory
cd sites/{slug} && npm run dev
```

### Running Tests

```bash
# All tests (269 currently)
npx vitest run

# Specific test file
npx vitest run tests/integration/schema-compiler.test.ts
```

## Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `component-registry.test.ts` | 16 | Component registry integrity |
| `schema-compiler.test.ts` | 14 | Schema → .astro compilation |
| `schema-parser.test.ts` | 11 | .astro → schema parsing + round-trip |
| `dev-server.test.ts` | 15 | Dev server module structure + security |
| `page-schemas.test.ts` | 20 | Page CRUD operations |
| `editor-types.test.ts` | 27 | Editor/config type compatibility |
| `editor-bridge.test.ts` | 33 | Inline editing bridge |
| `editor-config.test.ts` | 25 | Config editor + toolbar |
| `media-checklist.test.ts` | 41 | Media library + checklist |
| `phase5-infra.test.ts` | 51 | Auth, versioning, export, deploy |
| `contact-api.test.ts` | 5 | Contact form API |
| `directus-fetch.test.ts` | 11 | Directus data fetching |

## Key Commands

```bash
# Development
pnpm dev --filter @agency/{slug}     # Client site dev server
MONOREPO_ROOT=$(pwd) npm run dev --workspace=sites/admin  # Admin

# Build
pnpm --filter @agency/{slug} run build  # Build a client site
npm run build --workspace=sites/admin   # Build admin

# Deploy
cd sites/{slug} && npx wrangler deploy  # Deploy to Workers

# Code quality
npm run lint                    # ESLint
npm run typecheck               # TypeScript
npm run format                  # Prettier

# Tests
npx vitest run                  # All integration tests
npx playwright test             # E2E tests
```

## Workspace Configuration

The monorepo uses pnpm workspaces defined in `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
  - 'sites/*'
```

Vite is pinned to `^7.3.1` via pnpm overrides (Astro 6 requires Vite 7):

```json
{
  "pnpm": {
    "overrides": {
      "vite": "^7.3.1"
    }
  }
}
```

Internal workspace dependencies use `workspace:*` protocol:

```json
{
  "dependencies": {
    "@agency/config": "workspace:*",
    "@agency/ui": "workspace:*",
    "@agency/utils": "workspace:*"
  }
}
```

## Creating a New Site (Dev)

```bash
# Via admin wizard (recommended)
# 1. Start admin: MONOREPO_ROOT=$(pwd) npm run dev --workspace=sites/admin
# 2. Open http://localhost:4321/sites/new
# 3. Walk through 5-step wizard

# Via CLI
./infra/provisioning/new-site.sh {slug} {tier} {domain}

# Via API
curl -X POST http://localhost:4321/api/sites/create \
  -H 'Content-Type: application/json' \
  -b 'session=...' \
  -d '{ "slug": "...", "name": "...", ... }'
```

## Editing a Site

### Via Visual Editor
1. Navigate to `http://localhost:4321/sites/{slug}/editor`
2. Select pages from the left sidebar
3. Click sections to edit properties in the right panel
4. Changes auto-save after 1.5 seconds
5. Preview updates via HMR

### Via Files
1. Edit files in `sites/{slug}/`
2. Preview: `pnpm dev --filter @agency/{slug}`
3. Redeploy: `cd sites/{slug} && npx wrangler deploy`

## Troubleshooting

### "MONOREPO_ROOT not set" / "Site not found"
Set `MONOREPO_ROOT=$(pwd)` when starting the admin server locally.

### Vite version conflict / React hydration fails
Ensure `pnpm-workspace.yaml` exists and `vite` is pinned in `package.json` overrides.

### Dev toolbar overlay covers editor
The admin's `astro.config.mjs` has `devToolbar: { enabled: false }`.

### Build fails with "workspace:*" error
Use `pnpm` (not npm) for all install/build operations.
