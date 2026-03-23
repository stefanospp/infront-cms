# Monorepo Architecture Review

**Reviewer:** Senior Software Architect
**Date:** 2026-03-23
**Scope:** Full monorepo structure, dependency management, shared packages, build system, site generation, and scalability

---

## Executive Summary

This monorepo is a well-conceived agency platform that uses pnpm workspaces to manage shared packages (`config`, `ui`, `utils`), an admin UI, a base template site, and multiple client sites. The overall architecture is sound: package boundaries are mostly clean, the Vite component override plugin is a clever solution for per-site customisation, and the template-based site generation flow is practical.

However, the review uncovered **2 critical issues** (secrets committed to git, conflicting lock files), **5 high-severity issues** (duplicated code, inconsistent monorepo root resolution, missing build isolation, schema parser concurrency bug, and a zod schema duplication pattern), and **11 medium/low issues** related to scalability, developer experience, and technical debt. The most impactful improvements would be removing committed secrets, consolidating duplicated utilities, and adding build isolation to prevent cross-site contamination at scale.

---

## Architecture Diagram

```
infront-cms/
|
+-- packages/
|   +-- config/          TypeScript types, template registry, component registry
|   |   (exports: types, templates, component-registry, page-schema)
|   |   (deps: none)
|   |
|   +-- ui/              Shared Astro components, layouts, React islands
|   |   (exports: layouts/*, components/*, islands/*)
|   |   (deps: @agency/config, @agency/utils, react, react-dom)
|   |   (peers: astro, @astrojs/react)
|   |
|   +-- utils/           SEO, image, Directus client, validation, Vite plugins
|       (exports: seo, image, directus, date, validation, vite-component-override,
|                 vite-editor-bridge, schema-compiler, schema-parser)
|       (deps: @directus/sdk, zod)
|       (peers: @agency/config)
|
+-- sites/
|   +-- template/        Base site scaffold (copied for new sites)
|   +-- admin/           SSR admin UI (Node adapter, BetterAuth SSO)
|   +-- abroad-jobs/     Standalone job board (Cloudflare D1 + Stripe)
|   +-- atelier-kosta/   CMS-powered architecture studio
|   +-- athena-institute/ Template-generated professional site
|   +-- meridian-properties/ Template-generated CMS site
|
+-- infra/
|   +-- admin/           VPS deploy scripts (PM2 + Caddy)
|   +-- docker/          Per-client Directus Docker Compose
|   +-- backups/         DB and upload backup scripts
|   +-- provisioning/    CLI site creation (new-site.sh)
|   +-- kamal.yml        Kamal deployment config
|
+-- tests/               Playwright e2e, Vitest, Lighthouse CI

Dependency flow:
  config <-- utils <-- ui <-- sites/*
                   \        /
                    +------+
```

---

## Issues Found

### CRITICAL

#### C1: Secrets Committed to Git

**Affected files:**
- `infra/docker/atelier-kosta/.env`
- `infra/docker/meridian-properties/.env`

**Description:** Production database credentials, Directus admin passwords, and secret keys are committed in plaintext to the repository. The `.gitignore` has rules for `.env` and `.env.*`, but the `infra/docker/*/` path appears to not be effectively excluded.

The `atelier-kosta/.env` contains:
```
KEY=1bc926c717c1771c72cdc3919a4b4ec66379e89cab9b31d0ec5008d3f59fdf87
SECRET=d34787c7c17ac5034df65ab958f2c24ef8b15bff5fcb1853f229971d7d611695
DB_PASSWORD=g1UEODGqwrVoWRMBoZzeVRdG
ADMIN_PASSWORD=8Yocj7PMuUFUBfSF!1
```

**Risk:** Complete compromise of CMS instances. Even if removed now, secrets remain in git history.

**Recommended fix:**
1. Rotate all affected credentials immediately.
2. Add `infra/docker/*/.env` explicitly to `.gitignore` (the generic `.env` rule does not match nested `.env` files by default in all git versions).
3. Use `git filter-branch` or BFG Repo-Cleaner to purge secrets from history.
4. Move all infrastructure secrets to Doppler (as documented in CLAUDE.md but not followed).

---

#### C2: Conflicting Package Manager Lock Files

**Affected files:**
- `package-lock.json` (npm, 382KB, last modified 2026-03-21)
- `pnpm-lock.yaml` (pnpm, 271KB, last modified 2026-03-23)

**Description:** Both `package-lock.json` (npm) and `pnpm-lock.yaml` (pnpm) exist at the root. The `pnpm-workspace.yaml` indicates this is a pnpm monorepo, but `package.json` also has a `"workspaces"` field (npm-style). The admin build service (`build.ts`) calls `pnpm install` and `pnpm run build`, confirming pnpm is the intended package manager.

**Risk:** Developers or CI accidentally using `npm install` will produce a different dependency tree. The `package-lock.json` is stale (2 days older) and will cause drift.

**Recommended fix:**
1. Delete `package-lock.json` and add it to `.gitignore`.
2. Remove the `"workspaces"` field from root `package.json` (pnpm uses `pnpm-workspace.yaml`, not `"workspaces"`).
3. Add a `"packageManager"` field to `package.json`: `"packageManager": "pnpm@10.x.x"`.
4. Add an `.npmrc` with `engine-strict=true` or use corepack to enforce pnpm.

---

### HIGH

#### H1: Duplicated `serializePropValue` Function

**Affected files:**
- `packages/utils/src/schema-compiler.ts` (lines 28-43)
- `sites/admin/src/lib/generator.ts` (lines 275-291)

**Description:** The `serializePropValue` function is identically implemented in two places. Both handle config expression detection, string quoting, number/boolean wrapping, and JSON serialization. The generator also duplicates `renderSection` logic with slightly different signatures.

**Risk:** Bug fixes applied to one copy will be missed in the other. The two codepaths will diverge over time.

**Recommended fix:** Extract the shared serialization logic into `packages/utils` and import it in both the schema-compiler and the admin generator. The generator's `renderSection` should also be refactored to share code with the compiler's version, or the generator should use the compiler directly.

---

#### H2: Duplicate `getMonorepoRoot()` With Inconsistent Behaviour

**Affected files:**
- `sites/admin/src/lib/generator.ts` (line 54): `return process.env.MONOREPO_ROOT || '/app';`
- `sites/admin/src/lib/sites.ts` (line 18): `return '/app';` (hardcoded, no env override)

**Description:** Two separate implementations of `getMonorepoRoot()` exist in the admin codebase. `generator.ts` respects `MONOREPO_ROOT` for local dev; `sites.ts` always returns `/app`. When running the admin locally (not in Docker), `sites.ts` will look for sites in `/app/sites/` which does not exist.

**Risk:** Local admin development cannot list sites correctly. The inconsistency is a source of subtle bugs.

**Recommended fix:** Consolidate into a single `getMonorepoRoot()` in a shared admin utility module (e.g., `sites/admin/src/lib/paths.ts`). Both `generator.ts` and `sites.ts` should import from there. Always respect `MONOREPO_ROOT` for local development.

---

#### H3: No Build Isolation Between Sites

**Affected files:**
- All `astro.config.mjs` files
- `sites/admin/src/lib/build.ts`

**Description:** All sites share the same `node_modules` tree via pnpm workspaces. A build of site A can be affected by:
1. A new dependency installed by site B (e.g., `abroad-jobs` adding `drizzle-orm` which may conflict with global TypeScript or Vite versions).
2. The pnpm `overrides` in root `package.json` forcing `vite: ^7.3.1` across all workspaces.
3. The `pnpm install` step in `buildSite()` runs at the monorepo root, affecting all workspaces simultaneously.

The `atelier-kosta/node_modules/@agency/` directory contains `.ignored_*` directories, suggesting past resolution conflicts.

**Risk:** At 20+ sites, a dependency conflict in one site can break builds for all sites. The shared `pnpm install` in the build pipeline is a serialization bottleneck and a blast radius multiplier.

**Recommended fix:**
1. For production builds, use `pnpm deploy` to create isolated deployable directories per site.
2. Run `pnpm install --frozen-lockfile` instead of `pnpm install` in the build pipeline.
3. Consider adding `pnpm.peerDependencyRules.ignoreMissing` for optional peer deps rather than overrides.
4. Long-term: evaluate Turborepo or Nx for cached, parallelized, dependency-aware builds.

---

#### H4: Schema Parser Module-Level Mutable State

**Affected file:**
- `packages/utils/src/schema-parser.ts` (line 251)

**Description:** The parser uses a module-level `let nextId` variable that is reassigned at the start of each `parseAstroToSchema` call. While the `createIdGenerator` factory is scoped, the module-level reference itself is shared. If two concurrent calls to `parseAstroToSchema` occur (e.g., in the admin API when parsing multiple pages simultaneously), the second call overwrites `nextId` for the first.

```typescript
let nextId: (component: string) => string = createIdGenerator();
// ...
export function parseAstroToSchema(...) {
  nextId = createIdGenerator(); // Overwrites for all callers
```

**Risk:** Concurrent parsing produces incorrect or duplicate section IDs. This is a race condition that will manifest under load in the admin editor.

**Recommended fix:** Thread the ID generator through function parameters instead of module-level state. Change `parseTopLevelComponents` and `parseComponentToSection` to accept `nextId` as a parameter, and create the generator inside `parseAstroToSchema` as a local variable.

---

#### H5: Zod Schema Duplication Between `packages/utils` and `sites/admin`

**Affected files:**
- `packages/utils/src/validation.ts` (ContactSchema)
- `sites/admin/src/pages/api/sites/create.ts` (full createSiteSchema with ThemeConfig, ColorScale, etc.)
- `sites/abroad-jobs/src/lib/validation.ts` (jobInputSchema, checkoutSchema, searchParamsSchema)
- `packages/config/src/types.ts` (TypeScript interfaces for SiteConfig, ThemeConfig, etc.)

**Description:** The TypeScript interfaces in `packages/config/src/types.ts` and the Zod schemas in the admin API have no programmatic relationship. When a new field is added to `SiteConfig` (e.g., a new analytics provider), the TypeScript type must be updated AND the Zod schema in `create.ts` must be independently updated. There is no compile-time or runtime check that they stay in sync.

Additionally, `abroad-jobs` has its own `zod` dependency (`^3.24.0`) separate from the one in `packages/utils` (`^3.23.0`), risking version mismatch.

**Risk:** Schema drift between types and validation. A field can be valid per TypeScript but rejected by Zod, or accepted by Zod but not present in the TypeScript type.

**Recommended fix:**
1. Define Zod schemas alongside TypeScript types in `packages/config`. Use `z.infer<>` to derive TypeScript types from Zod schemas (single source of truth).
2. Deduplicate the `zod` dependency: add it to `packages/config` and re-export schemas from there. Remove the direct `zod` dependency from `sites/admin` and `sites/abroad-jobs` where possible.
3. For `abroad-jobs`-specific schemas (job board domain logic), keep them local but import the shared `zod` version.

---

### MEDIUM

#### M1: Template Site Still References Tailwind JS Config

**Affected files:**
- `infra/provisioning/new-site.sh` (lines 126-147: generates `tailwind.config.mjs`)
- `infra/provisioning/templates/tailwind.config.mjs.tmpl`

**Description:** The CLI provisioning script generates a `tailwind.config.mjs` file, but the project uses Tailwind CSS v4 with CSS-based configuration (`@theme` blocks in `global.css`). The admin wizard's `generateGlobalCssContent()` correctly produces CSS-based config. The CLI script produces a JS config file that is likely ignored or causes confusion.

The CLI-generated fallback config references `@agency/config/tailwind` which does not exist in the `packages/config` exports.

**Risk:** CLI-provisioned sites may have conflicting or non-functional Tailwind configuration.

**Recommended fix:** Update the CLI script to generate `global.css` with `@theme` blocks (mirroring the admin wizard), and remove the `tailwind.config.mjs` generation step. Alternatively, deprecate the CLI script in favour of the admin wizard (which is marked as "recommended" in CLAUDE.md).

---

#### M2: Admin Site Missing `@agency/ui` Path Mapping

**Affected file:**
- `sites/admin/tsconfig.json`

**Description:** The admin `tsconfig.json` includes paths for `@agency/config` and `@agency/utils` but NOT `@agency/ui`. The admin's `package.json` also does not list `@agency/ui` as a dependency. While the admin uses its own island components (not shared ones), this means the admin cannot use any shared UI component. If an admin page ever needs a shared component (e.g., displaying a component preview), the import would fail at both the TypeScript and module resolution levels.

**Risk:** Low immediate risk, but limits future admin UI capabilities.

**Recommended fix:** Add `@agency/ui` as a dependency in `sites/admin/package.json` and add the path mapping to `tsconfig.json`. Even if not used now, this maintains consistency and enables future use.

---

#### M3: `editorBridgePlugin` Uses `transformIndexHtml` Which Only Runs in Dev/Preview

**Affected file:**
- `packages/utils/src/vite-editor-bridge.ts`

**Description:** The plugin's comment says "Only inject in dev mode -- Vite only calls this hook during dev/preview." However, the plugin is registered in ALL site `astro.config.mjs` files, including production build configurations. While `transformIndexHtml` is indeed only called by Vite's dev server, the plugin is still instantiated and registered during production builds, adding unnecessary overhead to the plugin resolution chain.

Additionally, the bridge script uses `postMessage` with wildcard origin (`'*'`), which is a security concern flagged in the existing `frontend-dev-review.md` report.

**Risk:** Minor build performance impact. The wildcard `postMessage` origin is a medium security risk if the admin is accessed on a shared domain.

**Recommended fix:**
1. Only register `editorBridgePlugin()` when `import.meta.env.DEV` is true, or wrap it in a conditional in the astro config.
2. Replace `'*'` with the specific admin origin URL.

---

#### M4: `componentOverridePlugin` Uses Synchronous `fs.existsSync` in `resolveId`

**Affected file:**
- `packages/utils/src/vite-component-override.ts` (line 43)

**Description:** The `resolveId` hook calls `fs.existsSync()` synchronously for every `@agency/ui/components/*` or `@agency/ui/islands/*` import during module resolution. With 20 components and 5 extensions to check, this is up to 100 synchronous filesystem calls per build.

**Risk:** Build performance degrades linearly with the number of shared components and sites. Not critical now with 5 sites, but will become noticeable at 50+.

**Recommended fix:**
1. Cache the directory listing of `<siteRoot>/src/components/` at plugin init time (in `buildStart` or on first `resolveId` call).
2. Use the cached set for lookups instead of per-call `existsSync`.
3. Add a file watcher in dev mode to invalidate the cache when override files are added/removed.

---

#### M5: Inconsistent Site Tier Type

**Affected files:**
- `sites/admin/src/lib/sites.ts` (line 8): `tier: 'static' | 'cms'`
- `sites/admin/src/lib/generator.ts` (line 28): `tier: 'static' | 'cms' | 'interactive'`
- `packages/config/src/types.ts`: No `tier` type defined

**Description:** The `SiteInfo` type in `sites.ts` only allows `'static' | 'cms'`, but the generator and provisioning script support `'static' | 'cms' | 'interactive'`. The `SiteConfig` type in `packages/config` does not include a `tier` field at all.

**Risk:** Sites created with `interactive` tier will be listed as `cms` in the admin dashboard (since `listSites` infers tier from docker config existence).

**Recommended fix:** Add a `tier` field to `SiteConfig` in `packages/config/src/types.ts`. Update `listSites` to read the tier from site config instead of inferring it from infrastructure.

---

#### M6: CLI Provisioning Script Generates Inconsistent Site Config

**Affected file:**
- `infra/provisioning/new-site.sh` (lines 103-121)

**Description:** The fallback `site.config.ts` generated by `new-site.sh` (when the template file is missing) uses a different schema than the wizard-generated config:
```typescript
// CLI fallback
export default defineConfig({
  client: { name, slug },
  domain,
  tier,
  cms: { url, token },
  build: { outDir },
});
```

This does not match the `SiteConfig` interface at all (no `nav`, `footer`, `seo`, `theme`, `contact` fields). Additionally, `defineConfig` is not exported from `@agency/config`.

**Risk:** CLI-provisioned sites will fail TypeScript type checking and may not render correctly with shared components that expect `SiteConfig` props.

**Recommended fix:** Update the CLI fallback to generate a valid `SiteConfig` object, or require the template file to always exist.

---

#### M7: Package `@agency/ui` Has React as Direct Dependency

**Affected file:**
- `packages/ui/package.json` (lines 14-15)

**Description:** `@agency/ui` lists `react` and `react-dom` as both direct dependencies AND expects them via `@astrojs/react` peer dependency. Having React as a direct dependency in the UI package means pnpm may hoist a different version than what the consuming site has, causing the "multiple React instances" bug.

**Risk:** Hard-to-debug runtime errors where React hooks fail because islands use a different React instance than the one provided by `@astrojs/react`.

**Recommended fix:** Move `react` and `react-dom` from `dependencies` to `peerDependencies` in `packages/ui/package.json`. Sites already have their own React dependencies.

---

### LOW

#### L1: `abroad-jobs` Site Does Not Use Shared Component Override Plugin Consistently

**Affected file:**
- `sites/abroad-jobs/astro.config.mjs`

**Description:** The abroad-jobs site registers `componentOverridePlugin` but not `editorBridgePlugin`. It also has its own custom Nav, Footer, and layout components that shadow the shared ones via the override plugin. However, some of its components (e.g., `SearchHero.astro`, `JobCard.astro`) are entirely site-specific and do not override anything from `@agency/ui`.

This is consistent with the documented convention (custom components in site's `src/components/`), but the site also has a standalone layout (`SiteLayout.astro`) that duplicates the `BaseLayout` pattern.

**Risk:** Minimal. The abroad-jobs site is architecturally a standalone application that happens to live in the monorepo.

**Recommended fix:** No immediate action. Consider documenting the distinction between "agency client sites" (use shared UI) and "standalone products" (use monorepo for config/infra only).

---

#### L2: No `prerender = false` Export on SSR Pages in Template

**Affected file:**
- `sites/template/src/pages/contact.astro` (would need checking)

**Description:** CLAUDE.md states "API routes export `const prerender = false`" but the template site uses `output: 'static'` and it is unclear whether template pages that need SSR (like contact form submission) properly export the prerender directive. Generated sites also use `output: 'static'`.

**Risk:** Contact form API routes may fail on static builds if not marked for server rendering.

**Recommended fix:** Verify all API routes in the template export `export const prerender = false;`. Consider adding this check to the generator's page output.

---

#### L3: Unused `send` and `server-destroy` Dependencies in Admin

**Affected file:**
- `sites/admin/package.json` (lines 22-23)

**Description:** The admin `package.json` includes `"send": "^1.1.0"` and `"server-destroy": "^1.0.1"` as dependencies. Neither is imported anywhere in the admin source code.

**Risk:** Bloated dependency tree.

**Recommended fix:** Remove unused dependencies: `pnpm remove send server-destroy --filter @agency/admin`.

---

#### L4: Empty `devDependencies` Object in Admin Package

**Affected file:**
- `sites/admin/package.json` (lines 29-30)

```json
"devDependencies": {
}
```

**Risk:** None. Minor style issue.

**Recommended fix:** Remove the empty `devDependencies` key.

---

---

## Scalability Assessment

### Current state: 5 active sites (including template)

The architecture works well at this scale. Build times are manageable, dependency conflicts are rare, and the admin dashboard can display all sites on a single page.

### At 20 sites

**What works:**
- Template-based generation still viable
- Component override system scales (each site only adds filesystem checks for its own overrides)
- Per-site `wrangler.toml` deployment is independent

**What strains:**
- `pnpm install` time grows with workspace count (each workspace adds resolution work)
- The admin `listSites()` function reads every site directory sequentially (N filesystem reads + N config parses + N deploy.json reads)
- No build caching: rebuilding one shared component requires rebuilding all sites that use it
- The monorepo git history will grow with auto-commits from the visual editor

### At 50+ sites

**What breaks:**
- `pnpm install` becomes a bottleneck (minutes instead of seconds)
- The admin dashboard needs pagination; the current `listSites()` loads everything into memory
- Git repository size will be problematic if each site has frequent auto-commits
- CI/CD: cannot build all sites on every shared package change (need affected-site detection)
- The `buildSite()` function in the admin runs `pnpm install` at the monorepo root for EVERY site build, meaning builds are serialized and each build re-resolves all workspaces

### Recommendations for scale

1. **Adopt Turborepo or Nx** for build orchestration, caching, and affected-site detection.
2. **Move to per-site `pnpm deploy`** for isolated production builds.
3. **Add pagination and lazy loading** to the admin site listing.
4. **Consider extracting `packages/*` into a versioned npm registry** (private GitHub Packages). Sites would depend on `@agency/ui@^1.0.0` rather than `workspace:*`. This decouples site builds from the monorepo.
5. **Archive inactive sites** out of the main monorepo into separate repositories or a separate workspace group.

---

## Technical Debt Inventory

| ID | Item | Severity | Effort | Location |
|----|------|----------|--------|----------|
| TD1 | Committed secrets in Docker .env files | Critical | Low | `infra/docker/*/` |
| TD2 | Dual lock files (npm + pnpm) | Critical | Low | Root |
| TD3 | Duplicated `serializePropValue` | High | Low | `utils/schema-compiler.ts`, `admin/lib/generator.ts` |
| TD4 | Duplicated `getMonorepoRoot()` | High | Low | `admin/lib/generator.ts`, `admin/lib/sites.ts` |
| TD5 | Module-level mutable state in schema parser | High | Medium | `utils/src/schema-parser.ts` |
| TD6 | Zod schemas disconnected from TypeScript types | High | Medium | `config/types.ts`, `admin/api/sites/create.ts` |
| TD7 | CLI script generates Tailwind v3 config | Medium | Low | `infra/provisioning/new-site.sh` |
| TD8 | Missing tier type in shared config | Medium | Low | `config/types.ts` |
| TD9 | React as direct dep in @agency/ui | Medium | Low | `packages/ui/package.json` |
| TD10 | Sync fs calls in component override plugin | Medium | Medium | `utils/vite-component-override.ts` |
| TD11 | No build caching or affected-site detection | Medium | High | Build system |
| TD12 | Unused deps in admin package.json | Low | Low | `sites/admin/package.json` |
| TD13 | Editor bridge postMessage wildcard origin | Medium | Low | `utils/vite-editor-bridge.ts` |
| TD14 | `abroad-jobs` duplicates `zod` at different version | Low | Low | `sites/abroad-jobs/package.json` |

---

## Positive Aspects

1. **Clean package boundaries.** The `config -> utils -> ui -> sites` dependency chain is acyclic and well-structured. No circular dependencies.

2. **Component override plugin is elegant.** The `componentOverridePlugin` is a clean Vite plugin that enables per-site customisation without changing import paths. The path traversal guard on line 39 is a good security practice.

3. **Comprehensive type system.** `SiteConfig`, `TemplateDefinition`, `ComponentDefinition`, and `PageSchema` types are thorough and well-documented.

4. **Component registry is a strong pattern.** The `component-registry.ts` file provides a machine-readable catalog of all shared components with their props, variants, and categories. This enables the admin wizard and visual editor.

5. **The template system is practical.** Templates define pages as section arrays with component references and prop values. The schema compiler generates valid Astro files, and the parser can round-trip them. This is an effective low-code approach.

6. **Good input validation patterns.** API routes use Zod for server-side validation. The admin's site creation endpoint validates the full payload before generation. The provisioning script validates slug and domain format.

7. **Security headers infrastructure.** Sites have `public/_headers` files for CSP, HSTS, and other security headers.

8. **Visual editor bridge is well-thought-out.** The iframe-based editor bridge with section highlighting, inline text editing, and postMessage communication is a sophisticated feature with good UX considerations (scroll-into-view, overlay positioning).

9. **Auto-deploy pipeline is complete.** The generate -> build -> wrangler deploy -> DNS CNAME -> SSL flow is fully automated with status polling.

10. **Good documentation.** CLAUDE.md is comprehensive, per-site CLAUDE.md files provide context, and the code has JSDoc comments on key functions.

---

## Prioritised Recommendations

### Immediate (this week)

1. **Rotate all committed secrets** and update `.gitignore` to prevent recurrence. (C1)
2. **Delete `package-lock.json`** and add it to `.gitignore`. Add `"packageManager"` field. (C2)
3. **Remove unused dependencies** from admin package.json. (L3, L4)

### Short-term (next 2 weeks)

4. **Consolidate `getMonorepoRoot()`** into a single admin utility module. (H2)
5. **Fix schema parser concurrency** by passing ID generator as a parameter. (H4)
6. **Move React to peerDependencies** in `@agency/ui`. (M7)
7. **Deduplicate `serializePropValue`** by extracting to packages/utils. (H1)
8. **Add `tier` to `SiteConfig` type** and fix `SiteInfo` tier to include `interactive`. (M5)

### Medium-term (next month)

9. **Define Zod schemas alongside TypeScript types** in packages/config. Derive TypeScript types via `z.infer<>`. (H5)
10. **Update CLI provisioning script** to generate Tailwind v4 CSS config and valid SiteConfig. (M1, M6)
11. **Cache filesystem lookups** in componentOverridePlugin. (M4)
12. **Restrict postMessage origin** in editor bridge. (M3)
13. **Use `--frozen-lockfile`** in the build pipeline instead of `pnpm install`. (H3)

### Long-term (next quarter)

14. **Adopt Turborepo** for build caching, task orchestration, and affected-site detection. (H3, TD11)
15. **Add per-site build isolation** via `pnpm deploy` for production builds.
16. **Evaluate publishing shared packages** to a private registry for decoupled versioning at 30+ sites.
17. **Add admin dashboard pagination** and lazy loading for site listing.

---

## Files Referenced

- `/Users/stefanospetrou/Desktop/Apps/infront-cms/package.json`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/pnpm-workspace.yaml`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/.gitignore`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/tsconfig.base.json`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/config/src/types.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/config/src/component-registry.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/config/src/templates.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/utils/src/vite-component-override.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/utils/src/vite-editor-bridge.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/utils/src/schema-compiler.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/utils/src/schema-parser.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/utils/src/validation.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/ui/package.json`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/package.json`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/lib/generator.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/lib/sites.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/lib/build.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/lib/deploy.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/pages/api/sites/create.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/tsconfig.json`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/package.json`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/astro.config.mjs`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/provisioning/new-site.sh`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/docker/atelier-kosta/.env`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/infra/docker/meridian-properties/.env`
