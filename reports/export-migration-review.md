# Site Export, Migration & Dependency Management Review

**Date:** 2026-03-23
**Reviewer:** Claude Opus 4.6 (Export & Migration)
**Scope:** Export capabilities, backup infrastructure, dependency management, and migration paths at `/Users/stefanospetrou/Desktop/Apps/infront-cms`

---

## Executive Summary

**Overall Export Readiness: MODERATE RISK**

The platform has surprisingly good export infrastructure -- a full export API with static and source modes exists at `/api/sites/[slug]/export`. Source exports produce fully standalone Astro projects with all `@agency/*` imports resolved to local paths, a standalone `package.json`, and a standalone `astro.config.mjs`. Exported sites require only Node.js and npm to run, with zero monorepo dependencies.

However, this capability is invisible to users because there is no UI button to trigger it. Additionally, Cloudflare D1 data (used by abroad-jobs) has no backup or export mechanism, and the version history API has no corresponding UI.

The review uncovered **2 Critical**, **4 High**, and **4 Medium** severity issues.

---

## Critical Issues

### EXP-C1: Export API Has No UI Button

**File:** `sites/admin/src/pages/api/sites/[slug]/export.ts`
**File:** `sites/admin/src/islands/SiteDetail.tsx`

**Description:** The export endpoint at `sites/admin/src/pages/api/sites/[slug]/export.ts` supports POST with `type: "static"` (built output files as ZIP) or `type: "source"` (standalone Astro project with all `@agency/*` imports inlined, standalone `package.json`, and standalone `astro.config.mjs`). This is well-designed and functional. However, `sites/admin/src/islands/SiteDetail.tsx` has no export button anywhere in its UI. The only way to trigger an export is via direct API call.

**Impact:** Clients cannot self-service their site export or migration. The agency cannot efficiently hand off sites when a client relationship ends. A fully built feature provides zero value because it is inaccessible.

**Recommended Fix:** Add an "Export Site" button to the site management page with a dropdown offering "Download Static Build (ZIP)" and "Download Source Code (ZIP)" options. Trigger the existing API endpoint and initiate a browser download.

---

### EXP-C2: No D1 Data Export or Backup

**File:** `infra/backups/pg_backup.sh`
**File:** `infra/backups/uploads_backup.sh`
**File:** `sites/abroad-jobs/src/lib/db.ts`

**Description:** The abroad-jobs site stores all job data in Cloudflare D1 (SQLite). The backup infrastructure in `infra/backups/` includes `pg_backup.sh` (auto-discovers and backs up all Directus PostgreSQL databases) and `uploads_backup.sh` (syncs Directus upload directories). Neither script handles D1 databases. There is no D1 backup script, no scheduled export, and no way to extract job data.

**Impact:** Job data in D1 is at risk of permanent loss. If the D1 database is corrupted or accidentally deleted, there is no recovery path. Cloudflare D1 does not provide automatic backups with configurable retention.

**Recommended Fix:** Create a D1 backup script using `wrangler d1 export` to dump the database to SQL. Schedule it alongside existing backup scripts. Upload compressed dumps to S3 with the same 30-day retention policy used for PostgreSQL backups.

---

## High Issues

### EXP-H1: No Offboarding Documentation

**Description:** There is no client offboarding guide, no handoff checklist, and no instructions for running an exported site independently. When a client relationship ends, there is no documented process for transferring ownership of their site, data, domain, and hosting.

**Impact:** Offboarding is ad hoc, error-prone, and time-consuming. Risk of missing critical handoff steps (DNS transfer, domain unlock, data export, credential handover).

**Recommended Fix:** Create an offboarding checklist covering: site source export, CMS data export (if applicable), D1 data export (if applicable), domain transfer instructions, DNS migration steps, hosting setup guide for the exported site, and credential handover.

---

### EXP-H2: No CMS Data Export UI

**File:** `infra/backups/pg_backup.sh`

**Description:** Database backups work via `pg_backup.sh` -- it auto-discovers all Directus PostgreSQL databases, compresses them to `.sql.gz`, and uploads to S3 with 30-day retention. However, this is a server-side script only. There is no client-facing export capability in the admin UI. A CMS client cannot download their own content data.

**Impact:** Clients depend entirely on the agency to provide their data. This creates friction during offboarding and raises data portability concerns under GDPR Article 20 (right to data portability).

**Recommended Fix:** Add a "Export Content" button to the site management page for CMS-tier sites. Offer JSON and CSV export formats. Use the Directus API to fetch all collections and export them as structured data.

---

### EXP-H3: Version Rollback API Exists but Has No UI

**File:** `sites/admin/src/pages/api/sites/[slug]/versions.ts`

**Description:** The versions endpoint supports GET (list commits for a site), POST with action "save" (create a named snapshot), and POST with action "revert" (roll back to a previous commit). This provides a complete version history and rollback system. However, there is no UI in the admin to view version history, create snapshots, or trigger rollbacks.

**Impact:** Another fully built feature that provides zero value due to missing UI. Users cannot recover from bad deployments without developer intervention or direct API knowledge.

**Recommended Fix:** Add a "Version History" section to the site management page showing a timeline of commits with dates, messages, and a "Revert to this version" button. Add a "Save Snapshot" button for creating named checkpoints before major changes.

---

### EXP-H4: CI Only Tests Template Site When Shared Packages Change

**Description:** The CI pipeline tests `sites/template` when changes are made to shared packages (`packages/ui`, `packages/config`, `packages/utils`). It does not test any of the generated client sites. Breaking changes to shared components could silently break multiple production sites.

**Impact:** A seemingly safe change to a shared component (e.g., renaming a prop on `Hero.astro`) could break every site that uses it. The breakage would only be discovered when a client reports it or when a redeploy fails.

**Recommended Fix:** Create a matrix CI workflow that builds all client sites when shared packages change. At minimum, test 2-3 representative sites that use different templates and features.

---

## Medium Issues

### EXP-M1: High Coupling to @agency/* Packages (58 Imports per Site)

**Description:** Each generated site imports approximately 58 modules from `@agency/ui`, `@agency/config`, and `@agency/utils`. This tight coupling means sites cannot be built or developed outside the monorepo without the source export process.

**Impact:** Development requires the full monorepo checkout. The source export feature fully mitigates this for final handoff, but day-to-day development is locked to the monorepo.

**Recommended Fix:** No immediate action needed -- the source export resolves all imports for handoff. Document the monorepo requirement clearly for any external contributors.

---

### EXP-M2: No Automated Export Testing

**Description:** The source export function in the export API resolves imports, generates standalone configs, and produces a ZIP file. However, there are no tests verifying that the exported site actually builds and runs correctly as a standalone project.

**Impact:** Export could silently produce broken output if the import resolution logic has edge cases, if a new shared component is added without updating the resolver, or if dependency versions drift.

**Recommended Fix:** Add an integration test that exercises the export flow: generate a site, export it as source, install dependencies in an isolated directory, run the build, and verify it succeeds.

---

### EXP-M3: Dependabot Configured but Limited

**File:** `.github/dependabot.yml`

**Description:** Dependabot is configured to run weekly for npm dependencies and monthly for GitHub Actions, with a 10 open PR limit. However, there are no grouped updates (each dependency gets its own PR), no auto-merge for patch versions, and no monorepo-aware grouping.

**Impact:** Dependency updates create PR noise. Patch updates that are safe to merge automatically require manual review. Related updates (e.g., all `@astrojs/*` packages) arrive as separate PRs.

**Recommended Fix:** Switch from Dependabot to Renovate for better monorepo support. Renovate offers grouped updates (e.g., all Astro packages in one PR), auto-merge for patches with passing CI, and monorepo-aware scheduling.

---

### EXP-M4: No Major Version Upgrade Strategy

**Description:** There is no documented strategy or tooling for handling major version upgrades across the monorepo (e.g., Astro 6 to 7, Tailwind v4 to v5, React 19 to 20). With shared packages used by all sites, a major upgrade must be coordinated across the entire platform.

**Impact:** Major upgrades become high-risk, high-effort events. Without a strategy, they tend to be deferred until they become urgent, compounding the migration effort.

**Recommended Fix:** Document an upgrade playbook: (1) create an upgrade branch, (2) update shared packages first, (3) build all sites in CI matrix, (4) fix breakages site by site, (5) deploy to staging domains, (6) roll out to production. Include version pinning strategy and compatibility testing requirements.

---

## Positive Findings

1. **Source export is well-designed** -- resolves all `@agency/*` imports to local paths, generates standalone `package.json` with core dependencies, generates standalone `astro.config.mjs` without monorepo plugins
2. **CMS backups work reliably** -- `pg_backup.sh` auto-discovers all Directus databases; `uploads_backup.sh` syncs upload directories; both compress and upload to S3 with 30-day retention
3. **Schema snapshots supported** -- Directus schema can be exported and imported via `npx directus schema snapshot/apply` in YAML format for reproducible CMS setup
4. **Git-based versioning infrastructure** -- per-site commit history filtering, manual and auto-save, revert to any previous commit via API
5. **Zero monorepo dependency after export** -- exported source sites need only Node.js and npm to build and run
6. **Exported sites are hosting-agnostic** -- static exports work on Netlify, Vercel, S3, or any CDN; source exports are standard Astro projects deployable anywhere

---

## Recommendations (Prioritized)

| Priority | Action | Issue |
|----------|--------|-------|
| Immediate | Add "Export Site" button to site management page with static/source ZIP download | EXP-C1 |
| Immediate | Create D1 backup/export script in `infra/backups/` | EXP-C2 |
| Short-term | Add version history UI to site management page with one-click revert | EXP-H3 |
| Short-term | Write client offboarding guide documenting the export and handoff process | EXP-H1 |
| Short-term | Add CMS content export UI (JSON/CSV format) to admin for CMS-tier sites | EXP-H2 |
| Medium-term | Test exported sites in CI to verify they build independently | EXP-M2 |
| Medium-term | Switch from Dependabot to Renovate for better monorepo dependency management | EXP-M3 |
| Long-term | Create matrix CI workflow that tests all client sites when shared packages change | EXP-H4 |
| Long-term | Document major version upgrade playbook | EXP-M4 |
