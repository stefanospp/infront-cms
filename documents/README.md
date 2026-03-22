# Infront CMS — Documentation

Comprehensive documentation for the Infront CMS agency platform.

## Table of Contents

| # | Document | Description |
|---|----------|-------------|
| 01 | [Platform Overview](01-platform-overview.md) | Architecture, monorepo structure, tech stack, key concepts |
| 02 | [Visual Editor](02-visual-editor.md) | Three-panel editor, page schemas, compiler/parser, save flow |
| 03 | [API Reference](03-api-reference.md) | All API endpoints with request/response formats |
| 04 | [Deployment](04-deployment.md) | Cloudflare Workers pipeline, wrangler.toml, custom domains, rollback |
| 05 | [Component Registry](05-component-registry.md) | 22 components with variants, props, categories, override system |
| 06 | [Site Creation](06-site-creation.md) | 5-step wizard, templates, generator flow, post-creation |
| 07 | [Auth & Security](07-auth-and-security.md) | JWT auth, roles, input validation, file upload security |
| 08 | [Development Guide](08-development-guide.md) | Setup, commands, testing, troubleshooting |
| 09 | [Changelog](09-changelog.md) | Chronological record of all changes |
| 10 | [CMS Infrastructure](10-cms-infrastructure.md) | Directus provisioning, collections, backups, Docker setup |

## Quick Start

```bash
# Clone and install
git clone https://github.com/stefanospp/infront-cms.git
cd infront-cms
pnpm install

# Start admin dashboard
MONOREPO_ROOT=$(pwd) npm run dev --workspace=sites/admin
# Open http://localhost:4321 (password: admin)

# Run tests
npx vitest run
```

## Key URLs

| URL | Purpose |
|-----|---------|
| `http://localhost:4321` | Admin dashboard (local dev) |
| `http://localhost:4321/sites/new` | Create new site wizard |
| `http://localhost:4321/sites/{slug}/editor` | Visual editor for a site |
| `https://{slug}.workers.dev` | Deployed site (Workers) |
| `https://{slug}.infront.cy` | Staging URL |
