# Developer Experience & Documentation Review

**Date:** 2026-03-23
**Scope:** Full codebase at `/Users/stefanospetrou/Desktop/Apps/infront-cms`
**Reviewer:** Claude Code (DX Specialist)

---

## Executive Summary

The infront-cms monorepo has **strong documentation foundations** -- the CLAUDE.md, README.md, and in-app help system are unusually thorough for a project of this size. The architecture blueprint and provisioning scripts are well-commented with clear usage instructions. However, there are several **critical consistency issues** (npm vs pnpm confusion, Tailwind v3 vs v4 drift in the CLI provisioning path, missing `prerender = false` on API routes), **onboarding gaps** (no .env.example for the admin, no CONTRIBUTING guide), and **documentation that has fallen behind code changes** (auth migration partially reflected, README still references removed auth routes). The help-content.ts file is impressively comprehensive but contains stale references to the old local auth system.

**Overall DX Grade: B+**
Strong in breadth and intent, weakened by accumulated drift between documentation and implementation.

---

## 1. Documentation Inventory

### What Exists

| Document | Location | Status |
|----------|----------|--------|
| Root CLAUDE.md | `/CLAUDE.md` | Comprehensive, mostly accurate |
| Root README.md | `/README.md` | Comprehensive, has drift issues |
| Architecture Blueprint | `/docs/architecture-blueprint.md` | Detailed future-state document |
| Auth Documentation | `/docs/auth.md` | Accurate for new SSO architecture |
| Template Site CLAUDE.md | `/sites/template/CLAUDE.md` | Brief but accurate |
| AbroadJobs CLAUDE.md | `/sites/abroad-jobs/CLAUDE.md` | Good, self-contained |
| PRD | `/prd.md` | Original specification, historical |
| In-app Help | `/sites/admin/src/data/help-content.ts` | Extensive (14 categories, 50+ articles) |
| Provisioning script comments | `/infra/provisioning/*.sh` | Well-documented with usage headers |
| Backup script comments | `/infra/backups/*.sh` | Well-documented |
| VPS setup scripts | `/infra/admin/*.sh` | Step-by-step with prerequisites |

### What Is Missing

| Missing Document | Impact | Priority |
|-----------------|--------|----------|
| `CONTRIBUTING.md` | No guidance on PR process, branch naming, code review | High |
| `.env.example` for admin site | Developers cannot set up admin without reading README deeply | High |
| `CHANGELOG.md` | No record of releases or breaking changes | Medium |
| `packages/*/README.md` | No per-package documentation for shared libraries | Medium |
| `.github/PULL_REQUEST_TEMPLATE.md` | No standardized PR format | Medium |
| `.github/CODEOWNERS` | No automated review assignment | Low |
| `.github/ISSUE_TEMPLATE/` | No issue templates for bugs or features | Low |
| Architecture decision records (ADRs) | No record of why decisions were made | Low |

---

## 2. Issues Found

### Critical

#### C1: npm vs pnpm Inconsistency Throughout Documentation and CI

**Affected areas:** README.md, CLAUDE.md, help-content.ts, CI workflows, all script documentation

The project uses pnpm (evidenced by `pnpm-lock.yaml`, `pnpm-workspace.yaml`, Dockerfile using `pnpm install --frozen-lockfile`), but nearly all documentation and CI workflows reference `npm`:

- `README.md` line 9: `npm install`
- `README.md` lines 80, 515-516: `npm run dev --workspace=...`
- `.github/workflows/test.yml`: uses `npm ci`, `cache: npm`
- `.github/workflows/deploy-site.yml`: uses `npm ci`, `npm run build`
- `CLAUDE.md` commands section: all `npm run` commands
- `help-content.ts`: all workspace commands use `npm`
- `package.json` root: has `"workspaces"` field (npm syntax) alongside `pnpm-workspace.yaml`

**Impact:** A developer running `npm install` instead of `pnpm install` will get different dependency resolution, potentially broken builds, and the lockfile will not be respected. CI workflows using `npm ci` will ignore the pnpm lockfile entirely.

**Fix:** Standardize on pnpm everywhere. Update all documentation, CI workflows, and scripts. Remove the `"workspaces"` field from root `package.json` (pnpm uses `pnpm-workspace.yaml` instead). Update CI to use `pnpm/action-setup`.

#### C2: Provisioning Script Generates Tailwind v3 Config, Project Uses Tailwind v4

**Affected files:**
- `/infra/provisioning/new-site.sh` (lines 124-147)
- `/infra/provisioning/templates/tailwind.config.mjs.tmpl`

The CLI provisioning script generates a `tailwind.config.mjs` file using Tailwind v3 syntax (`presets`, `content`, `theme.extend.colors`). However, the project uses Tailwind CSS v4 with CSS-based configuration via `@theme` blocks in `global.css` and the `@tailwindcss/vite` plugin. The template site at `sites/template/` correctly uses the v4 approach (no `tailwind.config.mjs`, styling in `src/styles/global.css`).

**Impact:** Sites created via CLI will have a broken or non-functional Tailwind setup. The generated `tailwind.config.mjs` references `@agency/config/tailwind` which does not appear to exist as an export.

**Fix:** Rewrite `new-site.sh` step 4 to generate/copy a `src/styles/global.css` file with Tailwind v4 `@theme` blocks instead of a `tailwind.config.mjs`. Create a `global.css.tmpl` template file.

#### C3: Site Config Template Schema Mismatch

**Affected files:**
- `/infra/provisioning/templates/site.config.ts.tmpl`
- `/packages/config/src/types.ts` (SiteConfig interface)

The provisioning template generates a config using `defineConfig()` with a schema (`client.name`, `client.slug`, `domain`, `tier`, `cms.url`, `cms.token`, `build.outDir`) that does not match the actual `SiteConfig` interface at all. The real interface expects `name`, `tagline`, `url`, `locale`, `contact`, `seo`, `nav`, `footer`, `theme` -- completely different top-level keys.

Additionally, `defineConfig` is not exported from `@agency/config` (the index.ts only exports types and template/component utilities).

**Impact:** The provisioning template generates an invalid `site.config.ts` that will fail type checking and will not work with any shared components that read from `SiteConfig`.

**Fix:** Rewrite `site.config.ts.tmpl` to match the actual `SiteConfig` interface, or update the fallback heredoc in `new-site.sh` (lines 103-121) to generate a valid config.

#### C4: Multiple Admin API Routes Missing `prerender = false`

**Affected files:**
- `/sites/admin/src/pages/api/sites/create.ts`
- `/sites/admin/src/pages/api/sites/index.ts`
- `/sites/admin/src/pages/api/sites/[slug]/redeploy.ts`
- `/sites/admin/src/pages/api/sites/[slug]/custom-domain.ts`
- `/sites/admin/src/pages/api/sites/[slug]/deploy-status.ts`
- `/sites/admin/src/pages/api/sites/[slug]/overrides.ts`
- `/sites/admin/src/pages/api/templates/index.ts`

The CLAUDE.md convention states: "API routes export `const prerender = false`". The admin site runs in `output: 'server'` mode, so Astro defaults to SSR for all routes. However, 13 API route files DO include this export while 7 do not. This inconsistency is problematic -- if the output mode ever changes to `hybrid`, the routes without the export would break silently.

**Impact:** Currently a latent bug. If someone changes the admin's Astro output mode to `hybrid` (a common optimization), these routes will silently become static and return stale data.

**Fix:** Add `export const prerender = false;` to all 7 missing API route files for consistency and safety.

### High

#### H1: README Documents Removed Auth Routes

**Affected file:** `/README.md` lines 287-288

The README still lists these API routes:
```
POST /api/auth/login  — Verify password, set session cookie
POST /api/auth/logout — Clear session cookie
```

These were removed as part of the SSO migration (documented in `/docs/auth.md`). The admin middleware now delegates to `auth.infront.cy`.

**Fix:** Remove the auth routes from the README API table. Add a note that auth is handled by the central auth service.

#### H2: README Admin Setup References Removed bcrypt/JWT Auth

**Affected file:** `/README.md` lines 244-258

The admin setup section instructs developers to generate a `ADMIN_PASSWORD_HASH` using bcryptjs and set a `SESSION_SECRET`. These env vars are no longer used -- auth is now handled by the central auth service at `auth.infront.cy`. The middleware only needs `AUTH_SERVICE_URL`.

Similarly, the deploy.yml at `/infra/admin/deploy.yml` no longer lists `ADMIN_PASSWORD_HASH` or `SESSION_SECRET` as env vars (correctly updated), but the docker-entrypoint.sh at line 8 still writes them to `runtime-env.json`.

**Fix:** Update README admin setup to reference the new auth architecture. Remove stale env vars from `docker-entrypoint.sh`. Point to `/docs/auth.md` for details.

#### H3: No .env.example for Admin Site

**Affected area:** `/sites/admin/`

There is no `.env.example` file for the admin site. Developers must read the README (which is now partially stale) to discover which environment variables are needed. The Docker template directories have `.env.example` files, but the admin does not.

**Fix:** Create `/sites/admin/.env.example` with:
```bash
# Auth service (central SSO)
AUTH_SERVICE_URL=https://auth.infront.cy
PUBLIC_AUTH_SERVICE_URL=https://auth.infront.cy

# Cloudflare (required for site deployment)
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ZONE_ID=
```

#### H4: Help Content Contains Stale Auth References

**Affected file:** `/sites/admin/src/data/help-content.ts`

The in-app help system likely still references the old password + JWT auth system in some articles (the quick-start guide at line 157 mentions "log in", and the admin UI articles reference login). Since auth was recently migrated to the central auth service, these articles may describe flows that no longer exist.

**Fix:** Audit all help-content.ts articles for references to local password auth, bcrypt, JWT session cookies, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, login form, and update them to reflect the SSO flow.

#### H5: setup-vps.sh Still Prompts for Removed Auth Credentials

**Affected file:** `/infra/admin/setup-vps.sh` lines 73-84

The VPS setup script prompts for `ADMIN_PASSWORD` (and hashes it with bcryptjs) and generates a `SESSION_SECRET`. Both are now unused since auth is delegated to the central auth service.

**Fix:** Remove the password/session prompts. Add prompts for `AUTH_SERVICE_URL` instead, or document that auth is handled externally.

#### H6: CI Workflows Use npm Instead of pnpm

**Affected files:**
- `.github/workflows/test.yml`
- `.github/workflows/deploy-site.yml`

Both workflows use `npm ci` and `cache: npm`. The project uses pnpm.

**Fix:** Update to use `pnpm/action-setup@v4` and `pnpm install --frozen-lockfile`. Update cache strategy to pnpm.

### Medium

#### M1: No Root .env.example

There is no `.env.example` at the repository root to guide developers on what environment variables might be needed across the monorepo.

**Fix:** Create a root `.env.example` or at minimum a `docs/env-vars.md` documenting all env vars across all workspaces and infrastructure.

#### M2: CLAUDE.md Commands Section Uses npm

**Affected file:** `/CLAUDE.md` commands section

All commands reference `npm run` instead of `pnpm`. The CLAUDE.md is the primary reference for Claude Code development, so accuracy here directly impacts AI-assisted development quality.

**Fix:** Update all commands to use `pnpm`.

#### M3: Template Site CLAUDE.md References tailwind.config.mjs

**Affected file:** `/sites/template/CLAUDE.md`

The template CLAUDE.md references `tailwind.config.mjs` in its structure section and customization checklist, but the template site uses Tailwind v4 CSS-based config via `src/styles/global.css`. There is no `tailwind.config.mjs` in the template site directory.

**Fix:** Update the template CLAUDE.md to reference `src/styles/global.css` instead of `tailwind.config.mjs`.

#### M4: deploy-site.yml Only Deploys Template Site

**Affected file:** `.github/workflows/deploy-site.yml`

The deploy workflow only triggers on changes to `sites/template/**` and only deploys the template site. Client sites have no CI/CD deployment workflow. The README says "Each site deploys via GitHub Actions" but that is not true for any site except the template.

**Fix:** Either create a matrix-based workflow that deploys changed client sites, or update the README to accurately describe the deployment approach (admin UI + manual wrangler deploys).

#### M5: Package.json Has Both npm Workspaces and pnpm Workspace Config

**Affected file:** `/package.json`

The root `package.json` has a `"workspaces"` field (npm convention) alongside `pnpm-workspace.yaml` (pnpm convention). pnpm ignores the `package.json` workspaces field and uses `pnpm-workspace.yaml`, but having both is confusing.

**Fix:** Remove the `"workspaces"` field from `package.json`.

#### M6: No Documented Local Development Prerequisites

Neither the README nor CLAUDE.md list the required tools and their minimum versions for local development:
- Node.js >= 20 (documented in `engines`)
- pnpm (version not specified)
- Docker (for CMS tier)
- Wrangler CLI (for manual deploys)
- Git

**Fix:** Add a "Prerequisites" section to README.md.

#### M7: Error Messages in API Routes Are Generic

Many API routes return generic error messages like `"Internal server error"` or `"Failed to list sites"` without actionable context. For example:

- `/sites/admin/src/pages/api/sites/index.ts` returns `"Failed to list sites"` with no details
- `/sites/abroad-jobs/src/pages/api/jobs.ts` returns `"Invalid parameters"` without specifying which parameter failed

**Fix:** Include zod error details in 400 responses. Add request IDs or timestamps to 500 responses for log correlation.

#### M8: No PR Template or Branch Naming Convention

There is no `.github/PULL_REQUEST_TEMPLATE.md`, no CODEOWNERS file, and no documented branch naming convention beyond what the provisioning script creates (`onboard/<slug>`).

**Fix:** Create a PR template, document branch conventions (e.g., `feature/`, `fix/`, `onboard/`), and add a CODEOWNERS file.

#### M9: Architecture Blueprint Auth Section Is Stale

**Affected file:** `/docs/architecture-blueprint.md` lines 413-466

The auth section describes the old JWT-based system and a "proposed model" with roles. The actual implementation has moved to BetterAuth at auth.infront.cy, which is a completely different architecture.

**Fix:** Update the auth section to reflect the current SSO architecture, or mark it clearly as "superseded by docs/auth.md".

#### M10: Playwright Config Port Conflict with Admin

**Affected file:** `/playwright.config.ts`

The Playwright config starts a preview server on port 4321, which is the same port the admin UI uses for development. Running e2e tests while the admin is running will fail.

**Fix:** Use a different port for the template preview server (e.g., 4322), or document the conflict.

### Low

#### L1: No TypeDoc/JSDoc on Shared Package Exports

**Affected files:** `packages/utils/src/*.ts`, `packages/config/src/types.ts`

The TypeScript interfaces in `types.ts` have no JSDoc comments explaining what each field means or what valid values look like. For example, `locale: string` -- what format? BCP-47? The `url` field -- with or without protocol? Trailing slash?

**Fix:** Add JSDoc comments to all exported interfaces and utility functions.

#### L2: .gitignore Contains Hardcoded Site Exclusion

**Affected file:** `/.gitignore` line 34

The .gitignore contains `sites/athena-institute/` which is a specific client site exclusion. This should be handled differently (e.g., a pattern-based approach or documentation about why certain sites are excluded).

**Fix:** Either document why this exclusion exists or use a more systematic approach.

#### L3: scripts/ Directory Exists But Is Empty

**Affected area:** `/scripts/`

An empty directory with no documented purpose.

**Fix:** Either remove it or document its intended use.

#### L4: Dependabot Config Does Not Group Updates

**Affected file:** `.github/dependabot.yml`

Dependabot is configured but does not use grouping, which will create many individual PRs for related dependency updates (e.g., all Astro-related packages).

**Fix:** Add groups for related dependencies (Astro, Tailwind, testing, linting).

#### L5: No Debug/Verbose Mode in CLI Scripts

The provisioning and backup scripts have no `--verbose` or `--dry-run` flags. When something goes wrong, there is no way to get more detailed output without editing the script.

**Fix:** Add `--help`, `--verbose`, and `--dry-run` flags to `new-site.sh` and `provision-cms.sh`.

#### L6: Vitest Config Does Not Include All Test Locations

**Affected file:** `/vitest.config.ts`

The include pattern is `['tests/integration/**/*.test.ts', 'packages/*/src/**/*.test.ts']`. If tests are added to `sites/*/src/**/*.test.ts`, they would not be discovered.

**Fix:** Consider whether site-level tests should be included, or document that tests should go in `tests/integration/`.

---

## 3. Onboarding Checklist Gaps

A new developer attempting to set up this project from scratch would encounter these friction points:

### Step-by-step onboarding audit

| Step | Documented? | Works? | Notes |
|------|-------------|--------|-------|
| Clone the repo | Yes (README) | Yes | |
| Install dependencies | Yes but wrong command | No | README says `npm install`, should be `pnpm install` |
| Set up admin .env | Partially (README) | Stale | References removed auth vars |
| Start admin dev server | Yes | Likely works | `pnpm dev` in admin |
| Start template dev server | Yes | Likely works | |
| Create a site via CLI | Yes | Broken output | Generates Tailwind v3 config and invalid site.config.ts |
| Create a site via admin wizard | Yes | Requires auth service | No docs on running auth.infront.cy locally |
| Run tests | Yes | May fail | CI uses npm, Playwright port conflicts |
| Deploy a site | Partially | Manual steps needed | Only template has CI deploy |
| Set up Directus CMS | Yes | Works | provision-cms.sh is well-documented |

### Missing onboarding items

1. **How to run the auth service locally** -- The admin requires auth.infront.cy for login. No documentation on running a local auth service or bypassing auth for development.
2. **pnpm version** -- No specification of which pnpm version to use. The Dockerfile uses `corepack prepare pnpm@latest` which is non-deterministic.
3. **Required global tools** -- No checklist of tools to install (Node, pnpm, Docker, Wrangler, Playwright browsers).
4. **First-run database setup** -- The abroad-jobs site needs D1 database migrations. No root-level documentation on this.

---

## 4. Positive Aspects

### Documentation Strengths
- **CLAUDE.md is exceptionally detailed** -- the variant tables, file naming conventions, and "quick reference for common requests" table are excellent for AI-assisted development
- **In-app help system is comprehensive** -- 14 categories with 50+ articles covering nearly every aspect of the platform
- **Shell scripts are well-commented** -- every script has a header block with usage, arguments, prerequisites, and examples
- **Architecture blueprint is thorough** -- even though some parts are aspirational, it clearly separates current state from planned features with status markers

### Code Quality Strengths
- **Consistent error handling pattern** in API routes -- try/catch with structured JSON responses
- **Zod validation** on all form/API inputs with proper error flattening
- **TypeScript types are well-structured** -- `SiteConfig`, `TemplateDefinition`, `ComponentDefinition` provide a clean type hierarchy
- **Component registry** is a strong architectural pattern -- centralized prop/variant definitions
- **The provisioning scripts** validate inputs thoroughly (slug format, tier values, domain format, tool availability)

### Infrastructure Strengths
- **Docker setup is production-ready** -- multi-stage build, pnpm caching, volume management for persistent sites
- **Cloudflare Tunnel** approach is secure -- no open ports on the VPS
- **Backup scripts** are simple, correct, and have configurable retention

---

## 5. Recommendations (Prioritized)

### Priority 1: Fix Critical Consistency Issues (1-2 days)

1. **Standardize on pnpm** -- Update all documentation, CI workflows, and scripts. Remove npm workspaces field from package.json.
2. **Fix CLI provisioning** -- Rewrite `new-site.sh` to generate Tailwind v4 CSS config and valid `SiteConfig` objects.
3. **Add `prerender = false`** to all 7 missing API route files.

### Priority 2: Update Stale Documentation (1 day)

4. **Update README** -- Remove old auth routes, fix admin setup section, add prerequisites.
5. **Update help-content.ts** -- Audit for stale auth references, update to reflect SSO.
6. **Update setup-vps.sh** -- Remove bcrypt password prompts, add auth service URL.
7. **Update docker-entrypoint.sh** -- Remove stale `ADMIN_PASSWORD_HASH` and `SESSION_SECRET`.
8. **Update architecture blueprint auth section** -- Mark as superseded or rewrite.

### Priority 3: Improve Onboarding (1 day)

9. **Create `.env.example`** files for admin site and root.
10. **Document local auth development** -- How to bypass auth or run the auth service locally.
11. **Add a Prerequisites section** to README with required tools and versions.
12. **Pin pnpm version** in `package.json` via `packageManager` field and in Dockerfile.

### Priority 4: Improve DX Tooling (2-3 days)

13. **Create CONTRIBUTING.md** with branch naming, commit conventions, PR process.
14. **Create PR template** at `.github/PULL_REQUEST_TEMPLATE.md`.
15. **Add `--help` and `--dry-run`** flags to provisioning scripts.
16. **Fix Playwright port conflict** -- use a different port than admin.
17. **Group Dependabot updates** for related packages.
18. **Add JSDoc** to all exported types and utility functions.

### Priority 5: Long-term Improvements

19. **Create per-package README files** for config, ui, and utils.
20. **Add CODEOWNERS** file.
21. **Create a `docs/env-vars.md`** centralizing all environment variables across the project.
22. **Consider a `Makefile` or `justfile`** for common multi-step operations.
23. **Add structured logging** (with levels and request IDs) instead of raw `console.error`.

---

## 6. Summary Metrics

| Category | Score | Notes |
|----------|-------|-------|
| Documentation Breadth | 9/10 | Excellent coverage across multiple formats |
| Documentation Accuracy | 5/10 | Significant drift from npm to pnpm migration and auth changes |
| Onboarding Experience | 4/10 | Would fail at step 2 (wrong package manager) |
| Error Messages | 6/10 | Structured but often too generic |
| Code Comments | 7/10 | Scripts excellent, library code under-documented |
| Type Documentation | 5/10 | Types are clean but lack JSDoc |
| CLI Tools | 7/10 | Well-commented but missing --help/--dry-run |
| Local Development | 6/10 | Port conflicts, auth dependency not documented |
| Admin UI Help | 8/10 | Comprehensive but has stale content |
| Git Workflow | 4/10 | No PR templates, no CONTRIBUTING, no CODEOWNERS |
| Config Consistency | 7/10 | Good shared configs, but dual workspace definitions |
| **Overall** | **6/10** | Strong foundations with accumulated technical debt in docs |
