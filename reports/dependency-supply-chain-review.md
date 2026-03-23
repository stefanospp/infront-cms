# Dependency & Supply Chain Security Review

**Date:** 2026-03-23
**Scope:** All dependencies, lockfiles, CI pipelines, and supply chain security across the infront-cms monorepo
**Reviewer:** Claude Code audit

---

## Executive Summary

The infront-cms monorepo contains approximately **870 total dependencies** across 10 package.json files. The review found **2 critical issues**, **6 high-severity issues**, **7 medium issues**, and **3 low-severity items**. The most urgent problems are: (1) dual lockfiles (`package-lock.json` and `pnpm-lock.yaml`) creating dangerous divergence between CI and local development, and (2) CI workflows using `npm ci` despite the project being a pnpm workspace.

---

## Dependency Overview

| Metric | Value |
|--------|-------|
| Total dependencies in tree | ~870 |
| Package.json files | 10 |
| Lockfile version | pnpm-lock.yaml v9.0 |
| Package manager | pnpm (workspace) |
| Node.js version (declared) | >=20 (root), 20 (CI), 22 (Docker) |
| Known vulnerabilities | 2 moderate (esbuild GHSA-67mh-4wv8-2f99) |

---

## Issues Found

### CRITICAL

#### C1: Dual Lockfiles -- package-lock.json and pnpm-lock.yaml Both Exist

**Description:** Both `package-lock.json` and `pnpm-lock.yaml` exist in the repository. `package-lock.json` is NOT listed in `.gitignore`. This means both files are tracked in git and potentially diverge over time. Since CI uses `npm ci` (which reads `package-lock.json`) and local development uses `pnpm` (which reads `pnpm-lock.yaml`), there is a dangerous scenario where:

1. Developer installs a package locally with `pnpm add` -- updates `pnpm-lock.yaml` only
2. CI runs `npm ci` using the stale `package-lock.json`
3. CI installs different dependency versions than local development
4. Bugs that appear locally may not appear in CI, and vice versa

**Impact:** Non-reproducible builds. CI and production may run different dependency versions than development. Security patches applied via pnpm may not be present in the npm lockfile used by CI.

**Recommended Fix:**
1. Delete `package-lock.json` from the repository
2. Add `package-lock.json` to `.gitignore`
3. Update all CI workflows to use pnpm (see C2)

---

#### C2: CI Uses npm, Not pnpm

**Files:** `.github/workflows/test.yml`, `.github/workflows/deploy-site.yml`, `.github/workflows/deploy-directus.yml`

**Description:** All 3 CI workflows use `npm ci` with `cache: npm` despite this being a pnpm workspace monorepo. The `pnpm-workspace.yaml` file defines workspace packages, but CI ignores pnpm entirely. This compounds the C1 issue -- CI is not only using a different lockfile but a different package manager with different resolution algorithms.

**Impact:** CI dependency tree may differ from local development. Workspace protocol (`workspace:*`) references in package.json may not resolve correctly with npm.

**Recommended Fix:** Update all CI workflows to use pnpm:
```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 9
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: pnpm
- run: pnpm install --frozen-lockfile
```

---

### HIGH

#### H1: Dockerfile Uses `corepack prepare pnpm@latest` -- Unpinned Version

**File:** `Dockerfile`

**Description:** The Dockerfile runs `corepack prepare pnpm@latest --activate`, which installs whatever the latest pnpm version is at build time. This means the Docker image is non-reproducible -- two builds on different days may use different pnpm versions, potentially with different dependency resolution behavior.

**Impact:** Non-reproducible Docker builds. A pnpm major version bump could break the build.

**Recommended Fix:** Pin the pnpm version:
```dockerfile
RUN corepack prepare pnpm@9.15.0 --activate
```
Or better, specify the pnpm version in `package.json` via `packageManager` field:
```json
"packageManager": "pnpm@9.15.0"
```

---

#### H2: Node.js Version Inconsistency Across Environments

**Description:**
- Root `package.json`: `"engines": { "node": ">=20" }`
- CI workflows: `node-version: 20`
- Dockerfile: `node:22-slim`
- No `.nvmrc` or `.node-version` file

**Impact:** Code developed on Node 22 (Docker) may use APIs unavailable on Node 20 (CI). Tests pass in CI on Node 20 but production runs Node 22. Local development has no guidance on which version to use.

**Recommended Fix:**
1. Align all environments to Node 22 (or 20 if you prefer the LTS)
2. Update CI to `node-version: 22`
3. Update `package.json` engines to match
4. Add `.nvmrc` file with the target version

---

#### H3: No Dependency Version Pinning -- All Using `^` Ranges

**Description:** Every dependency across all 10 package.json files uses caret (`^`) version ranges. While the lockfile pins exact versions, a fresh `pnpm install` (without `--frozen-lockfile`) could pull newer minor/patch versions that introduce regressions.

**Impact:** Potential for unexpected behavior when lockfile is regenerated. Combined with the dual-lockfile issue (C1), this amplifies risk.

**Recommended Fix:** At minimum, pin critical dependencies (Astro, React, Drizzle, Stripe SDK) to exact versions. Use `--save-exact` for production-critical packages.

---

#### H4: `server-destroy@1.0.1` -- Unmaintained Dead Dependency

**File:** `sites/admin/package.json`

**Description:** `server-destroy` was last published in 2015 (11 years ago). A search of the codebase shows it is **never imported in any source file**. It appears to be a leftover from an earlier development phase.

**Impact:** Unnecessary dependency in the supply chain. Unmaintained packages receive no security patches.

**Recommended Fix:** Remove `server-destroy` from `sites/admin/package.json`.

---

#### H5: `send@1.1.0` -- Never Imported in Code

**File:** `sites/admin/package.json`

**Description:** `send` is declared as a dependency but never imported in any admin source file. It may be an indirect dependency that was mistakenly added to `dependencies` instead of being a transitive dependency.

**Impact:** Unnecessary direct dependency. Increases attack surface.

**Recommended Fix:** Remove `send` from `sites/admin/package.json`. If it is needed as a transitive dependency, it will be installed automatically.

---

#### H6: esbuild CVE (GHSA-67mh-4wv8-2f99) -- Moderate Severity

**Description:** `pnpm audit` reports 2 moderate advisories related to esbuild (GHSA-67mh-4wv8-2f99). This is a transitive dependency via `drizzle-kit`. esbuild is a build tool, so this is only a development-time risk, not a production runtime risk.

**Impact:** Low production risk (dev tool only). However, it indicates that `drizzle-kit` is pulling an outdated esbuild version.

**Recommended Fix:** Update `drizzle-kit` to the latest version. If the vulnerability persists, add a `pnpm.overrides` entry to force a patched esbuild version.

---

### MEDIUM

#### M1: `mermaid` Package is Very Large (~5MB+)

**File:** `sites/admin/package.json`

**Description:** The `mermaid` package (for rendering diagrams) is approximately 5MB+ and is used only for help manual diagrams in the admin UI. This significantly increases the admin bundle size and Docker image size.

**Impact:** Larger admin bundle, slower page loads for help pages, larger Docker image.

**Recommended Fix:** Lazy-load mermaid only on help pages that use diagrams. Consider pre-rendering diagrams as SVG at build time instead of including the full mermaid runtime.

---

#### M2: `wrangler` Version Conflict Between Sites

**Files:** `sites/abroad-jobs/package.json` (`^4.61.0`), `sites/admin/package.json` (`^4.0.0`)

**Description:** abroad-jobs requires wrangler `^4.61.0` while admin requires `^4.0.0`. While pnpm resolves these to the same version due to the caret range, the inconsistency suggests the versions were not intentionally coordinated.

**Impact:** Potential for different wrangler behavior if ranges ever diverge.

**Recommended Fix:** Align wrangler versions across all package.json files. Consider hoisting wrangler to the root package.json.

---

#### M3: `zod` Duplicated Across 3 Packages

**Files:** `packages/utils/package.json`, `sites/admin/package.json`, `sites/abroad-jobs/package.json`

**Description:** Zod is declared as a dependency in 3 separate packages. It should be declared once in `packages/utils` and consumed via the workspace dependency.

**Impact:** Potential for version mismatches if ranges diverge. Increases install time. Could cause issues with `instanceof` checks across package boundaries.

**Recommended Fix:** Remove zod from `sites/admin` and `sites/abroad-jobs`. Import zod schemas from `@agency/utils` which already re-exports them.

---

#### M4: React 18, Not React 19

**Files:** Multiple package.json files

**Description:** React and react-dom are on version 18. React 19 has been stable for over a year and is supported by the Astro React integration. React 19 includes performance improvements and new features (use() hook, server components support).

**Impact:** Missing performance improvements. Eventually React 18 will receive fewer patches.

**Recommended Fix:** Upgrade to React 19 when convenient. Test all React islands for compatibility.

---

#### M5: Dependabot Configured but Limited

**File:** `.github/dependabot.yml`

**Description:** Dependabot is configured but only scans the root `/` directory. It does not have separate entries for each workspace package. This means it may miss updates for dependencies only declared in workspace packages.

**Impact:** Missed dependency update PRs for workspace-specific packages.

**Recommended Fix:** Add Dependabot entries for each workspace directory, or switch to Renovate (see M6).

---

#### M6: No Renovate -- Only Dependabot

**Description:** The project uses only Dependabot for automated dependency updates. Renovate offers better monorepo support with features like: grouped updates, auto-merge for patch updates, better workspace awareness, and lockfile maintenance PRs.

**Impact:** More manual dependency update management.

**Recommended Fix:** Consider switching to Renovate for better monorepo dependency management.

---

#### M7: `npm audit --audit-level=critical` in CI -- Misses Moderate/High

**File:** `.github/workflows/test.yml`

**Description:** The security audit job uses `--audit-level=critical`, which only fails the build on critical vulnerabilities. Moderate and high severity issues (like the current esbuild CVE) pass silently.

**Impact:** Known vulnerabilities with moderate/high severity do not block deployment.

**Recommended Fix:** Change to `--audit-level=high` at minimum. Consider `--audit-level=moderate` for maximum security.

---

### LOW

#### L1: No `.nvmrc` or `.node-version` File

**Description:** No Node.js version file exists for local development tooling (nvm, fnm, volta, etc.).

**Impact:** Developers may use any Node version locally, leading to inconsistent behavior.

**Recommended Fix:** Add `.nvmrc` with the target Node version (e.g., `22`).

---

#### L2: Dependabot for GitHub Actions is Monthly

**File:** `.github/dependabot.yml`

**Description:** The `github-actions` ecosystem in Dependabot is set to `monthly` schedule. Given the prevalence of supply chain attacks on GitHub Actions, weekly updates would be more appropriate.

**Recommended Fix:** Change `interval: monthly` to `interval: weekly` for the `github-actions` ecosystem.

---

#### L3: React 18 Still on Legacy Mode

**Description:** Not blocking but worth tracking. React 18's concurrent features and the migration path to React 19 should be planned.

**Impact:** Minimal -- React 18 is still supported.

---

## Dependency Health Summary

| Package | Version | Last Updated | Health |
|---------|---------|-------------|--------|
| astro | ^6.x | Active | Healthy |
| @astrojs/cloudflare | ^12.x | Active | Healthy |
| @astrojs/react | ^4.x | Active | Healthy |
| react / react-dom | ^18.x | Stable (v19 available) | OK |
| drizzle-orm | ^0.39.x | Active | Healthy |
| drizzle-kit | ^0.30.x | Active (esbuild CVE) | Caution |
| stripe | ^18.x | Active | Healthy |
| resend | ^4.x | Active | Healthy |
| zod | ^3.x | Active | Healthy |
| @directus/sdk | ^18.x | Active | Healthy |
| better-auth | ^1.x | Active | Healthy |
| tailwindcss | ^4.x | Active | Healthy |
| wrangler | ^4.x | Active | Healthy |
| mermaid | ^11.x | Active | Healthy (large) |
| server-destroy | 1.0.1 | 2015 | Dead |
| send | ^1.x | Active | Unused |

---

## Recommendations (Prioritized)

### Immediate (This Week)
1. **Delete `package-lock.json`** and add to `.gitignore`
2. **Update all CI workflows to use pnpm** with `--frozen-lockfile`
3. **Remove unused dependencies** (`server-destroy`, `send`)
4. **Pin pnpm version in Dockerfile** and add `packageManager` to root `package.json`

### Short-Term (1-2 Weeks)
5. **Align Node.js version** across all environments (CI, Docker, local)
6. **Add `.nvmrc`** file
7. **Change audit level** from `critical` to `high` in CI
8. **Update Dependabot** github-actions interval to weekly
9. **Deduplicate zod** across workspace packages

### Medium-Term (1 Month)
10. **Consider switching to Renovate** for better monorepo support
11. **Lazy-load mermaid** or pre-render diagrams as SVG
12. **Align wrangler versions** across packages
13. **Upgrade to React 19** when all islands are tested
14. **Update drizzle-kit** to resolve esbuild CVE

---

## Files Analyzed

### Package Files
- Root `package.json`
- `packages/config/package.json`
- `packages/ui/package.json`
- `packages/utils/package.json`
- `sites/admin/package.json`
- `sites/abroad-jobs/package.json`
- `sites/template/package.json`
- `sites/athena-institute/package.json`
- `sites/meridian-properties/package.json`
- `sites/atelier-kosta/package.json`

### Configuration Files
- `.npmrc`
- `pnpm-workspace.yaml`
- `.github/dependabot.yml`
- `.github/workflows/test.yml`
- `.github/workflows/deploy-site.yml`
- `.github/workflows/deploy-directus.yml`
- `Dockerfile`
- `.gitignore`
- `pnpm-lock.yaml` (header)
