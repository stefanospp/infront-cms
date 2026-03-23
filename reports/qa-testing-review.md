# QA & Testing Review Report

**Project:** infront-cms (Agency Platform Monorepo)
**Date:** 2026-03-23
**Reviewer:** Claude Code (Automated QA Audit)

---

## Executive Summary

The project has a testing foundation covering integration tests (Vitest), E2E tests (Playwright), accessibility audits (axe-core), and Lighthouse CI for performance budgets. A CI pipeline runs all test layers on every push and pull request to main.

However, **the test suite has significant structural weaknesses that undermine its value as a quality gate.** The most critical issue is that roughly 60% of the integration tests are "source scanning" tests -- they read source files as strings and assert on the presence of substrings (e.g., `expect(source).toContain('export const GET')`) rather than testing actual behavior. These tests verify that code *exists* but not that it *works*. They would pass even if the functions contained fatal logic errors.

Additionally, the entire `abroad-jobs` site (a production job board with Stripe payments, D1 database, and webhook processing) has **zero dedicated tests**. No API route tests, no validation schema tests, no webhook tests. The admin site's 20+ API routes are tested only via source-string scanning. There are no tests for the authentication middleware, deployment pipeline, Cloudflare API integration, or error recovery paths.

**Overall test maturity: Early Stage (2/5)**

---

## Test Inventory

### What Exists

| Layer | Location | Count | Quality |
|-------|----------|-------|---------|
| E2E (Playwright) | `tests/e2e/` | 4 files, ~12 tests | Moderate |
| Integration (Vitest) | `tests/integration/` | 10 files, ~180 tests | Low-Moderate |
| Lighthouse CI | `tests/lighthouse/lighthouserc.json` | 3 URLs | Good config |
| CI Pipeline | `.github/workflows/test.yml` | 5 jobs | Good structure |

### Integration Test Breakdown by Type

| Type | Files | Description |
|------|-------|-------------|
| Behavioral tests | 4 files | `contact-api.test.ts`, `directus-fetch.test.ts`, `schema-parser.test.ts`, `schema-compiler.test.ts`, `page-schemas.test.ts` -- these test real functions with real inputs/outputs |
| Source-scanning tests | 6 files | `dev-server.test.ts`, `editor-bridge.test.ts`, `editor-config.test.ts`, `media-checklist.test.ts`, `phase5-infra.test.ts`, `editor-types.test.ts` -- these read `.ts` files and do `expect(source).toContain(...)` |

---

## Issues Found

### CRITICAL-01: Source-Scanning Tests Provide False Confidence

**Severity:** Critical
**Affected files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/tests/integration/dev-server.test.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/tests/integration/editor-bridge.test.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/tests/integration/editor-config.test.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/tests/integration/media-checklist.test.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/tests/integration/phase5-infra.test.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/tests/integration/editor-types.test.ts`

**Description:** Six of the ten integration test files use a pattern of reading source files as strings and asserting on substring presence. For example:

```typescript
// dev-server.test.ts
it('exports DevServerManager class', () => {
  const content = fs.readFileSync(DEV_SERVER_PATH, 'utf-8');
  expect(content).toContain('export class DevServerManager');
});
```

This test would pass if `DevServerManager` had a constructor that throws unconditionally, or if every method returned `undefined`. It tests *structure* (that certain strings appear in source), not *behavior* (that the code does what it claims).

The pattern is used extensively in `editor-bridge.test.ts` (testing a Vite plugin by scanning its source for string literals like `'editor-bridge:section-select'`), `editor-config.test.ts` (verifying a React component has certain props by looking for string occurrences), and `phase5-infra.test.ts` (checking auth module by scanning for string patterns).

**Impact:** These ~100+ tests create a false sense of security. They will pass even with broken logic, type errors at runtime, or incorrect implementations. They also add CI time without meaningful regression protection.

**Recommendation:** Replace source-scanning tests with proper behavioral tests. For modules that depend on admin-specific imports (the stated reason for this approach), use one of:
1. Extract pure logic into testable functions and import them directly
2. Use `vi.mock()` to mock admin-specific dependencies
3. Use integration tests that spin up the admin server
4. If source scanning is truly the only option for structural checks, label them explicitly as "structural contract tests" and keep them minimal (verify exports exist), not as substitutes for behavioral tests

---

### CRITICAL-02: abroad-jobs Site Has Zero Tests

**Severity:** Critical
**Affected area:** `sites/abroad-jobs/`

**Description:** The `abroad-jobs` site is a production job board that processes real money through Stripe. It has:
- 4 API routes (`/api/jobs`, `/api/checkout`, `/api/webhook`, `/api/import`)
- Zod validation schemas (`checkoutSchema`, `searchParamsSchema`, `jobInputSchema`)
- D1 database queries with FTS5 full-text search
- Stripe Checkout session creation
- Stripe webhook signature verification and job activation
- Email sending via Resend
- An import pipeline from external job APIs

None of these have any tests whatsoever.

**Impact:** Any change to the checkout flow, webhook processing, search API, or validation schemas could break production without detection. The Stripe webhook handler is especially critical -- if it breaks, employers pay but jobs never go live.

**Recommendation:** At minimum, add:
1. Unit tests for `checkoutSchema`, `searchParamsSchema`, `jobInputSchema` validation (edge cases, boundary values)
2. Unit tests for `mapRawJob` and the `uniqueSlug` helper
3. Integration tests for the `/api/jobs` search endpoint with mocked D1
4. Integration tests for `/api/checkout` with mocked Stripe
5. Integration tests for `/api/webhook` covering: valid signature, invalid signature, checkout.session.completed event, other event types, missing session ID, email send failure
6. Integration tests for `/api/import` covering: auth header verification, success path, error handling

---

### CRITICAL-03: No Tests for Admin Authentication or Authorization

**Severity:** Critical
**Affected files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/middleware.ts`
- The deleted `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/lib/auth.ts`

**Description:** The admin middleware forwards cookies to an external auth service (`auth.infront.cy`) and redirects to login on failure. There are no tests for:
- Whether authenticated requests pass through correctly
- Whether unauthenticated requests redirect to login
- Whether the redirect URL encoding is correct
- Whether public routes are properly excluded
- Whether auth service errors are handled gracefully
- Whether the user/session data is correctly attached to `context.locals`

The `phase5-infra.test.ts` file scans the old `auth.ts` source for string patterns but: (a) tests were written for the old JWT-based auth which has since been replaced with BetterAuth SSO, and (b) they never tested actual authentication behavior.

**Impact:** Auth bypass vulnerabilities would not be caught by tests. An incorrect redirect URL could create an infinite redirect loop. A change to the auth service API could silently break admin access.

**Recommendation:**
1. Unit test `isPublicRoute()` with all edge cases (exact matches, prefix matches, paths that almost match)
2. Integration test the middleware with mocked `fetch` for the auth service: successful auth, failed auth, auth service down, malformed response
3. Test that all 20+ admin API routes are behind auth (structural test that verifies `prerender = false` and that no route is accidentally public)

---

### HIGH-01: No Tests for Admin API Routes (Site Creation, Deletion, Deployment)

**Severity:** High
**Affected files:**
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/pages/api/sites/create.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/pages/api/sites/[slug]/delete.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/pages/api/sites/[slug]/custom-domain.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/pages/api/sites/[slug]/redeploy.ts`
- `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/admin/src/pages/api/sites/[slug]/deploy-status.ts`
- And 15+ more admin API routes

**Description:** The admin site has 20+ API routes handling site creation, deletion, deployment, media uploads, version control, export, domain management, and configuration. None have behavioral tests. The source-scanning tests verify that certain strings exist in these files but never test:
- Input validation edge cases
- Error responses for invalid data
- Authorization checks
- File system operations (directory creation, deletion)
- Cloudflare API interaction (even mocked)
- Race conditions (e.g., deleting a site during deployment)

The `create.ts` route has a comprehensive Zod schema (136 lines) that is never tested for boundary values, missing fields, or malformed data.

**Recommendation:** Prioritize behavioral tests for the most destructive operations first:
1. `delete.ts` -- test that template/admin sites cannot be deleted, test file cleanup, test Cloudflare resource cleanup with mocked API
2. `create.ts` -- test validation schema with invalid slugs, missing required fields, XSS in string fields
3. `custom-domain.ts` -- test domain validation, test missing deploy metadata

---

### HIGH-02: E2E Tests Only Cover Template Site, Single Browser

**Severity:** High
**Affected file:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/playwright.config.ts`

**Description:** The Playwright config targets only `sites/template` via `webServer` and only runs in Chromium. The `abroad-jobs` site (a production job board) and the admin UI have no E2E test coverage. Per the CLAUDE.md performance and accessibility requirements:
- WCAG 2.1 Level AA is mandatory on all sites
- Lighthouse Performance >= 90 on all sites
- The admin UI has interactive features (wizard, editor, media library) that are untested

The config also lacks:
- Firefox and Safari/WebKit projects (despite Playwright supporting them natively)
- Mobile viewport testing beyond the single mobile nav test in `navigation.spec.ts`
- Screenshot comparison / visual regression

**Recommendation:**
1. Add Firefox and WebKit projects to `playwright.config.ts`
2. Add a separate Playwright project for the admin UI E2E tests
3. Add mobile viewport tests for at least iPhone and iPad sizes
4. Consider adding `abroad-jobs` site E2E tests for the job posting flow

---

### HIGH-03: No Stripe Webhook Verification Tests

**Severity:** High
**Affected file:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/api/webhook.ts`

**Description:** The Stripe webhook handler processes payment completion events and activates jobs. It handles:
- Signature verification (`stripe.webhooks.constructEventAsync`)
- Job activation (updating `isLive`, `activatedAt`, `expiresAt`)
- Confirmation email sending
- Graceful email failure handling

None of these paths are tested. A bug in the webhook handler means employers pay but jobs never appear, or jobs never expire (the 30-day calculation), or duplicate activations occur.

**Recommendation:** Create integration tests with mocked Stripe and mocked D1:
1. Test that missing `stripe-signature` header returns 400
2. Test that invalid signature returns 400
3. Test that `checkout.session.completed` activates jobs and sets correct expiry
4. Test that email failure does not break the webhook (returns 200 regardless)
5. Test that non-`checkout.session.completed` events return 200 without side effects
6. Test that `activatedAt` and `expiresAt` are set correctly (30-day window)

---

### HIGH-04: Contact API Test Tests Schema Only, Not the Route

**Severity:** High
**Affected file:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/tests/integration/contact-api.test.ts`

**Description:** Despite its name, `contact-api.test.ts` only tests the `ContactSchema` Zod object validation. It does not test the actual API route handler, which would need to:
- Receive an HTTP request
- Parse and validate the body
- Check the honeypot
- Send an email via Resend
- Return appropriate responses for success, validation failure, and email errors

**Recommendation:** Rename to `contact-schema.test.ts` for clarity and add actual API route integration tests that mock the Resend client.

---

### MEDIUM-01: Lighthouse CI Does Not Test INP Metric

**Severity:** Medium
**Affected file:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/tests/lighthouse/lighthouserc.json`

**Description:** The CLAUDE.md specifies an INP budget of < 200ms, but the Lighthouse CI config only asserts on LCP (`largest-contentful-paint`), CLS (`cumulative-layout-shift`), and TTI (`interactive`). INP (Interaction to Next Paint) replaced FID as a Core Web Vital and is not covered.

Additionally, there is no assertion for total page weight (< 500KB) or JavaScript bundle size (< 100KB gzipped) which are documented performance budgets.

**Recommendation:** Add INP assertion and resource size budgets:
```json
{
  "experimental-interaction-to-next-paint": ["warn", { "maxNumericValue": 200 }],
  "resource-summary:script:size": ["error", { "maxNumericValue": 102400 }],
  "total-byte-weight": ["error", { "maxNumericValue": 512000 }]
}
```

---

### MEDIUM-02: No Test for Vite Component Override Plugin

**Severity:** Medium
**Affected file:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/packages/utils/src/vite-component-override.ts`

**Description:** The component override system (`componentOverridePlugin`) is a core architectural feature that intercepts `@agency/ui/components/*` imports and resolves local overrides. It has no tests. A bug here could silently serve the wrong component on any site with overrides, with no error message.

**Recommendation:** Add integration tests that:
1. Create a mock Vite resolve context
2. Verify that imports resolve to the override when the override file exists
3. Verify that imports fall through to the shared component when no override exists
4. Test path edge cases (nested paths, case sensitivity, non-component imports)

---

### MEDIUM-03: No Test for Import Pipeline Security

**Severity:** Medium
**Affected file:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/sites/abroad-jobs/src/pages/api/import.ts`

**Description:** The import endpoint has a notable security concern: if `IMPORT_SECRET` is not set, the endpoint allows unauthenticated access ("for initial testing"). This should be tested to ensure:
1. When `IMPORT_SECRET` is set, requests without the correct Bearer token are rejected
2. The behavior when `IMPORT_SECRET` is unset is intentional and documented
3. The imported job data is properly sanitized before database insertion

**Recommendation:** Add integration tests for auth enforcement and consider making the secret mandatory (fail closed rather than open).

---

### MEDIUM-04: E2E Contact Form Test May Be Flaky

**Severity:** Medium
**Affected file:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/tests/e2e/contact-form.spec.ts`

**Description:** The contact form submission test (`contact form submits successfully with valid data`) clicks submit and expects a success message to appear, but:
1. There is no wait/timeout for the network request to complete
2. The test relies on `data-testid="success-message"` becoming visible, but does not account for loading states
3. If the API is slow or the Resend mock is not configured for E2E, this test will fail intermittently

The honeypot test checks that `success-message` is `not.toBeVisible()` but does not check for an error message, so it would pass even if the form just silently fails.

**Recommendation:**
1. Add explicit `waitFor` or use Playwright's auto-waiting with a reasonable timeout
2. Add assertions for loading/error states
3. Mock the API response at the network level using `page.route()` for deterministic tests
4. In the honeypot test, assert on the actual expected behavior (error message or silent rejection)

---

### MEDIUM-05: Accessibility Tests Only Cover 3 Pages

**Severity:** Medium
**Affected file:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/tests/e2e/accessibility.spec.ts`

**Description:** Accessibility tests run axe-core on only 3 pages (`/`, `/about`, `/contact`). The CLAUDE.md states "WCAG 2.1 Level AA mandatory on all sites." Missing coverage for:
- Dynamic pages (e.g., blog posts, job detail pages)
- Pages with interactive islands (forms, mobile nav open state)
- The admin UI pages
- The abroad-jobs site pages

Additionally, only `critical` and `serious` violations are checked. `moderate` violations are silently ignored, which means color contrast issues and other AA-relevant violations pass.

**Recommendation:**
1. Parameterize accessibility tests to run against all pages dynamically
2. Add tests for interactive states (mobile nav open, form with validation errors visible)
3. Consider reporting `moderate` violations as warnings
4. Add accessibility tests for the admin UI

---

### MEDIUM-06: CI Pipeline Uses npm but Project Uses pnpm

**Severity:** Medium
**Affected file:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/.github/workflows/test.yml`

**Description:** The `package.json` has `pnpm.overrides` configured and the abroad-jobs CLAUDE.md uses `pnpm` commands, but the CI pipeline uses `npm ci` and `npm run`. While npm workspaces may work, the lockfile could differ from pnpm's, leading to different dependency resolutions in CI vs local development.

**Recommendation:** Align CI with the actual package manager. Use `pnpm install --frozen-lockfile` instead of `npm ci`, and `pnpm run` instead of `npm run`.

---

### LOW-01: No Test Coverage Reporting

**Severity:** Low
**Affected file:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/vitest.config.ts`

**Description:** Vitest is configured without coverage reporting. There is no `coverage` section in the config, no `@vitest/coverage-v8` or `@vitest/coverage-istanbul` dependency, and no coverage thresholds enforced.

**Recommendation:** Add coverage configuration:
```typescript
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts', 'packages/*/src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['packages/*/src/**', 'sites/*/src/lib/**', 'sites/*/src/pages/api/**'],
      thresholds: {
        statements: 50,
        branches: 40,
        functions: 50,
        lines: 50,
      },
    },
  },
});
```

---

### LOW-02: No Visual Regression Testing

**Severity:** Low
**Affected area:** Entire project

**Description:** Given that this is a web agency platform generating visual sites with theme tokens, there is no visual regression testing. A CSS change in shared components or a Tailwind token modification could visually break all client sites without detection.

**Recommendation:** Consider adding Playwright visual comparison tests (`expect(page).toHaveScreenshot()`) for key page layouts across at least 2 sites. This is especially important given the component override system and shared component model.

---

### LOW-03: Deploy-Site Workflow Does Not Run Tests

**Severity:** Low
**Affected file:** `/Users/stefanospetrou/Desktop/Apps/infront-cms/.github/workflows/deploy-site.yml`

**Description:** The `deploy-site.yml` workflow deploys to Cloudflare Pages on push to main when `sites/template/**` or `packages/**` change, but it does not depend on the test workflow passing. A push to main that breaks tests could still deploy.

**Recommendation:** Add a `needs: [test]` dependency or use GitHub's branch protection rules to require the CI workflow to pass before merging to main.

---

## Test Coverage Gap Analysis

### Covered (with behavioral tests)

| Area | Coverage Level |
|------|---------------|
| `ContactSchema` validation | Good -- tests valid/invalid inputs, honeypot |
| `getDirectusImageUrl` helper | Good -- tests default params, custom params, edge cases |
| Component registry structure | Good -- comprehensive structural validation |
| Schema parser (Astro to PageSchema) | Good -- multiple scenarios, round-trip tests |
| Schema compiler (PageSchema to Astro) | Good -- layouts, sections, islands, CMS |
| Page schema operations (add/remove/reorder) | Good -- CRUD with temp directory |
| SEO meta tags (E2E) | Good -- title, description, OG, canonical, structured data |
| Navigation links (E2E) | Moderate -- link resolution, mobile nav |
| Accessibility (E2E) | Moderate -- axe-core on 3 pages |
| Performance (Lighthouse CI) | Moderate -- scores + LCP/CLS/TTI |

### NOT Covered (critical gaps)

| Area | Risk Level | Description |
|------|-----------|-------------|
| Stripe checkout flow | **Critical** | Payment processing with real money |
| Stripe webhook handler | **Critical** | Job activation after payment |
| Admin authentication | **Critical** | Auth bypass could expose all operations |
| Admin API routes (behavioral) | **High** | 20+ routes with only string-scanning tests |
| Site deletion + Cloudflare cleanup | **High** | Destructive operation with external API calls |
| Site creation + deployment | **High** | Core business workflow |
| abroad-jobs validation schemas | **High** | Job form and search parameter validation |
| abroad-jobs search API | **High** | FTS5 query construction, SQL injection surface |
| Import pipeline (external API) | **Medium** | Data ingestion from third-party APIs |
| Vite component override plugin | **Medium** | Core architectural feature |
| Email sending (Resend) | **Medium** | Confirmation emails to paying customers |
| Versioning/git operations | **Medium** | Auto-commit, revert, version history |
| Export (static/source) | **Medium** | ZIP generation, standalone package.json |
| Dev server management | **Medium** | Port allocation, process lifecycle |
| Cloudflare DNS/domain operations | **Medium** | External API integration |
| Admin UI wizard (E2E) | **Medium** | 5-step interactive form |
| Cross-browser compatibility | **Low** | Only Chromium tested |
| Mobile responsive layouts | **Low** | Single mobile viewport test |
| Visual regression | **Low** | No screenshot comparison |

---

## Risk Assessment

### What Could Break Without Tests

1. **Stripe webhook fails silently** -- Employers pay EUR 89 but jobs never go live. No tests verify the activation logic or expiry calculation. Revenue impact: direct financial loss and customer complaints.

2. **Auth bypass in admin** -- The middleware forwards cookies to an external auth service. If the auth service URL changes, returns unexpected data, or the middleware logic has a bug, all admin operations become publicly accessible. This includes site deletion, deployment, and file system access.

3. **Site deletion deletes wrong files** -- The `delete.ts` route uses `params.slug` directly in `path.join()`. While it checks for `template` and `admin`, a malformed slug could potentially escape the sites directory. No tests verify path traversal protection.

4. **Search API SQL injection** -- The jobs search API constructs raw SQL for FTS5 queries. While it strips quotes from the search term (`q.replace(/['"]/g, '')`), there is no test that verifies this sanitization is sufficient against all injection vectors. The `MATCH` clause in SQLite FTS5 has its own syntax that could be exploited.

5. **Shared component change breaks all sites** -- A change to a shared component in `packages/ui` affects every deployed site. Without visual regression tests and with E2E tests covering only the template site, a breaking change would not be caught until a client reports it.

6. **Deployment pipeline breaks silently** -- The `deployNewSite` function is fire-and-forget (`.catch()` only logs). If it fails, the site creation API still returns 201 with `deployStatus: 'pending'`. There are no tests for this failure path, and no monitoring/alerting is tested.

---

## Recommendations (Prioritized)

### Priority 1: Immediate (Week 1-2)

1. **Add abroad-jobs validation schema tests** -- Test `checkoutSchema`, `searchParamsSchema`, and `jobInputSchema` with valid inputs, boundary values, and malicious inputs. Low effort, high value.

2. **Add Stripe webhook integration tests** -- Mock Stripe and D1, test all paths through the webhook handler. This is the most critical untested revenue path.

3. **Add admin middleware unit tests** -- Test `isPublicRoute()` and mock the auth service fetch to verify redirect behavior.

4. **Fix CI to use pnpm** -- Align the CI pipeline with the actual package manager to avoid dependency resolution differences.

### Priority 2: Short-term (Week 3-4)

5. **Replace source-scanning tests with behavioral tests** -- Start with `phase5-infra.test.ts` (auth module) and `dev-server.test.ts`. Extract pure functions for unit testing, mock dependencies for integration testing.

6. **Add admin API route tests for destructive operations** -- Test `delete.ts`, `create.ts`, and `custom-domain.ts` with mocked file system and Cloudflare API.

7. **Add search API tests** -- Test the FTS5 query construction with various inputs including potential injection attempts.

8. **Add cross-browser Playwright projects** -- Add Firefox and WebKit to the Playwright config. Minimal effort.

### Priority 3: Medium-term (Month 2)

9. **Add coverage reporting** -- Configure Vitest coverage with thresholds. Start with low thresholds and increase over time.

10. **Add admin UI E2E tests** -- Test the site creation wizard, site editor, and media library flows.

11. **Add Vite plugin tests** -- Test `componentOverridePlugin` and `editorBridgePlugin` with mock Vite contexts.

12. **Add accessibility tests for all pages and sites** -- Parameterize axe-core tests across all routes.

### Priority 4: Long-term (Quarter)

13. **Add visual regression tests** -- Playwright screenshot comparison for key layouts across multiple sites.

14. **Add contract tests for Cloudflare API** -- Verify that the Cloudflare API wrapper functions handle API changes gracefully.

15. **Add load/stress tests** -- Test the search API and job listing under load, especially the FTS5 queries.

16. **Add monitoring/alerting tests** -- Verify that error reporting to Sentry and uptime monitoring via Betterstack are configured correctly.

---

## Appendix: File Reference

### Test Files
- `tests/e2e/navigation.spec.ts` -- Nav link validation, mobile nav toggle
- `tests/e2e/contact-form.spec.ts` -- Form validation, submission, honeypot
- `tests/e2e/seo.spec.ts` -- Meta tags, structured data, sitemap, robots.txt
- `tests/e2e/accessibility.spec.ts` -- axe-core WCAG 2.1 AA audit
- `tests/integration/contact-api.test.ts` -- ContactSchema zod validation (misnamed)
- `tests/integration/directus-fetch.test.ts` -- getDirectusImageUrl helper
- `tests/integration/component-registry.test.ts` -- Component registry structure
- `tests/integration/schema-parser.test.ts` -- Astro-to-schema parsing + round-trip
- `tests/integration/schema-compiler.test.ts` -- Schema-to-Astro compilation
- `tests/integration/page-schemas.test.ts` -- Page schema CRUD operations
- `tests/integration/dev-server.test.ts` -- Source scanning (not behavioral)
- `tests/integration/editor-bridge.test.ts` -- Source scanning (not behavioral)
- `tests/integration/editor-config.test.ts` -- Source scanning (not behavioral)
- `tests/integration/media-checklist.test.ts` -- Source scanning (not behavioral)
- `tests/integration/phase5-infra.test.ts` -- Source scanning (not behavioral)
- `tests/integration/editor-types.test.ts` -- Source scanning + registry consistency

### Configuration Files
- `vitest.config.ts` -- Vitest config (no coverage)
- `playwright.config.ts` -- Playwright config (Chromium only, template site only)
- `tests/lighthouse/lighthouserc.json` -- Lighthouse CI assertions
- `.github/workflows/test.yml` -- CI pipeline (lint, typecheck, audit, vitest, playwright, lighthouse)
- `.github/workflows/deploy-site.yml` -- Site deployment (no test dependency)
- `.github/workflows/deploy-directus.yml` -- Directus deployment (no tests)

### Untested Critical Files
- `sites/abroad-jobs/src/pages/api/checkout.ts` -- Stripe checkout
- `sites/abroad-jobs/src/pages/api/webhook.ts` -- Stripe webhook
- `sites/abroad-jobs/src/pages/api/jobs.ts` -- Job search API
- `sites/abroad-jobs/src/pages/api/import.ts` -- Job import pipeline
- `sites/abroad-jobs/src/lib/validation.ts` -- Job board zod schemas
- `sites/admin/src/middleware.ts` -- Authentication middleware
- `sites/admin/src/pages/api/sites/create.ts` -- Site creation
- `sites/admin/src/pages/api/sites/[slug]/delete.ts` -- Site deletion
- `packages/utils/src/vite-component-override.ts` -- Component override plugin
