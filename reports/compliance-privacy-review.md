# GDPR Compliance & Privacy Review

**Platform:** infront-cms (web agency monorepo)
**Reviewed by:** Compliance & Privacy Engineering Review
**Date:** 2026-03-23
**Scope:** All sites (template, abroad-jobs, atelier-kosta, athena-institute, meridian-properties), admin UI, shared packages

---

## Executive Summary

**Overall Compliance Risk Rating: HIGH**

The platform demonstrates some privacy-conscious decisions (privacy-friendly analytics defaults, security headers, honeypot spam protection), but has significant GDPR compliance gaps that create legal risk for both the agency and its clients. The most critical issues are:

1. **Google Analytics loads without consent** in the BaseLayout for all sites using the `google` analytics provider, violating GDPR and the ePrivacy Directive.
2. **No data deletion mechanism exists** for the abroad-jobs database, making it impossible to fulfill Right to Erasure (Article 17) requests.
3. **Privacy policies are incomplete boilerplate** that omit required GDPR disclosures (legal basis, data subject rights, DPO contact, cross-border transfer information).
4. **No consent collection** on contact forms or job posting forms for data processing.
5. **No data retention automation** -- the privacy policy promises 90-day deletion but no code implements it.

---

## Data Flow Map

### abroad-jobs (Job Board)

```
Employer (browser)
  |
  |--> POST /api/checkout
  |      Data: contactEmail, companyName, companyWebsite, companyLogo,
  |            jobTitle, description, country, industry, salaryRange,
  |            visaSupport, relocationPkg, workingLanguage, applyUrl
  |      |
  |      |--> Cloudflare D1 (stored: all fields including contactEmail)
  |      |--> Stripe API (contactEmail as customer_email, payment card via Stripe Checkout)
  |
  |--> Stripe Checkout (hosted by Stripe)
  |      Data: card details (never touches our servers)
  |
  |--> POST /api/webhook (Stripe callback)
  |      |--> Cloudflare D1 (updates job status)
  |      |--> Resend API (sends confirmation email to contactEmail)
  |
  |--> POST /api/import (cron job)
         |--> Fetches from Arbeitnow API + Remotive API
         |--> Stores in D1 (company names, job details, hardcoded placeholder email)

Job Seeker (browser)
  |
  |--> GET / or GET /api/jobs (reads public job data)
  |--> Clicks "Apply" --> leaves site to employer's applyUrl
  |
  |--> No personal data collected from job seekers
```

### Client Sites (template, atelier-kosta, etc.)

```
Visitor (browser)
  |
  |--> Contact Form (name, email, message)
  |      |--> POST /api/contact --> Resend API (email forwarded to client)
  |      |--> No database storage (fire-and-forget email)
  |
  |--> Analytics
  |      |--> Plausible (default) -- cookieless, GDPR-friendly, EU-hosted
  |      |--> Fathom -- cookieless, GDPR-friendly
  |      |--> Google Analytics -- sets cookies, requires consent
  |
  |--> Google Fonts (fonts.googleapis.com / fonts.gstatic.com)
         |--> IP address sent to Google on every page load
```

### Admin UI

```
Admin User (browser)
  |
  |--> auth.infront.cy (BetterAuth SSO)
  |      |--> Session cookie on .infront.cy domain
  |      |--> User data stored in auth service database
  |
  |--> web.infront.cy (admin dashboard)
         |--> Middleware forwards cookie to auth service for verification
         |--> Cloudflare API (site deployments)
```

### Third-Party Data Recipients

| Provider | Data Received | Location | Purpose |
|----------|--------------|----------|---------|
| Cloudflare (Pages, D1) | All site data, job database, visitor IP addresses | Global CDN | Hosting, database |
| Stripe | Customer email, payment details | US (with EU entity) | Payment processing |
| Resend | Recipient email, email content | US | Transactional email |
| Plausible | Page URLs, referrer, screen size (no PII) | EU | Analytics |
| Fathom | Page URLs, referrer (no PII) | Canada | Analytics |
| Google Analytics | IP address, cookies, browsing behavior | US | Analytics |
| Google Fonts | Visitor IP address | US | Font delivery |
| Arbeitnow API | N/A (data fetched from them) | EU | Job import |
| Remotive API | N/A (data fetched from them) | US | Job import |

---

## Issues Found

### CRITICAL

#### C1. Google Analytics Loads Without Consent in BaseLayout

**File:** `/packages/ui/src/layouts/BaseLayout.astro` (lines 75-91)
**Regulation:** GDPR Art. 6(1)(a), ePrivacy Directive Art. 5(3), CJEU Planet49 ruling

**Description:** When a site configures `analytics.provider: 'google'`, Google Analytics scripts load unconditionally in `BaseLayout.astro` on every page view. The GA script tag is rendered directly in the HTML without checking for user consent. This happens independently of the `CookieConsent` island.

The `CookieConsent.tsx` component does implement consent gating, but it is a separate React island that must be explicitly added to each site. The BaseLayout does NOT use the CookieConsent component -- it loads GA directly. This means:

- GA fires immediately on page load for ANY site with `analytics.provider: 'google'`
- The CookieConsent island, even if added, would load GA a second time after consent
- There is a race condition: BaseLayout loads GA immediately, CookieConsent loads it again after accept

**Risk:** Direct GDPR violation. EU Data Protection Authorities have issued fines of EUR 50,000 to EUR 150,000 for loading Google Analytics without prior consent. The CNIL (France) and Datatilsynet (Austria) have ruled Google Analytics transfers to the US are illegal under Schrems II without adequate safeguards.

**Recommended Fix:**
- Remove the GA `<script>` tags from BaseLayout.astro entirely
- Rely exclusively on the CookieConsent island to load GA after explicit consent
- Ensure CookieConsent is automatically included in BaseLayout when `analytics.provider === 'google'`
- Consider adding `gtag('consent', 'default', { analytics_storage: 'denied' })` as a consent-mode fallback

---

#### C2. No Data Deletion Mechanism (Right to Erasure)

**Files:** Entire `sites/abroad-jobs/` codebase
**Regulation:** GDPR Art. 17 (Right to Erasure), Art. 12 (Transparent Communication)

**Description:** The abroad-jobs database stores personal data (contactEmail, companyName) in Cloudflare D1, but there is:
- No API endpoint to delete a user's data
- No admin interface to look up and delete records by email
- No automated data purging/cleanup script
- No documentation of how to fulfill a data deletion request

The privacy policy at `/privacy` states "Job listings and associated data are retained for 90 days after expiry, then permanently deleted" -- but no code implements this promise. The `wrangler.toml` has a cron trigger (`0 6 * * *`) but the scheduled handler only runs job imports, not cleanup.

**Risk:** Inability to fulfill Article 17 requests within the required 30-day window. The privacy policy's 90-day retention claim is a false statement, which is itself a violation of Article 5(1)(a) (lawfulness, fairness, transparency).

**Recommended Fix:**
- Create a `DELETE /api/jobs/by-email` endpoint (admin-protected) that deletes all records for a given contactEmail
- Create a scheduled cleanup function that runs daily, deleting expired jobs older than 90 days (matching the privacy policy promise)
- Document the data deletion process for manual Subject Access Requests
- Add the cleanup function to the existing cron trigger

---

#### C3. No Legal Basis Established for Data Processing

**Files:** `sites/abroad-jobs/src/islands/JobPostForm.tsx`, `packages/ui/src/islands/ContactForm.tsx`
**Regulation:** GDPR Art. 6(1), Art. 7 (Conditions for Consent)

**Description:** Neither the job posting form nor the contact form collects explicit consent for data processing. There is:
- No checkbox for "I agree to the Privacy Policy and Terms of Service"
- No link to the privacy policy near the form submit button
- No clear indication of what will happen to the submitted data
- No consent record stored for audit purposes

For the job posting form, the legal basis should be either:
- Art. 6(1)(b) -- contract performance (user is purchasing a service), or
- Art. 6(1)(a) -- explicit consent

Even with contract performance as the basis, the user must be informed of processing before submitting data (Art. 13).

**Risk:** Processing personal data without a valid legal basis. Fines up to 4% of annual turnover under GDPR Art. 83(5).

**Recommended Fix:**
- Add a mandatory consent checkbox to JobPostForm.tsx: "I agree to the Privacy Policy and Terms of Service"
- Add a privacy notice link below the ContactForm submit button: "By submitting, you agree to our Privacy Policy"
- Store the timestamp of consent alongside the job record
- Validate that the consent checkbox is checked server-side in the checkout API

---

### HIGH

#### H1. Privacy Policies Missing Required GDPR Disclosures

**Files:** All `privacy.astro` pages across all sites
**Regulation:** GDPR Art. 13, Art. 14

**Description:** All privacy policies (both the abroad-jobs custom one and the template boilerplate) are missing mandatory GDPR disclosures:

**Missing from ALL privacy policies:**
- Identity and contact details of the data controller (Art. 13(1)(a))
- Contact details of the Data Protection Officer (if applicable) (Art. 13(1)(b))
- Legal basis for each processing activity (Art. 13(1)(c))
- Recipients or categories of recipients of personal data (Art. 13(1)(e))
- Information about cross-border transfers and safeguards (Art. 13(1)(f))
- Data retention periods for each category of data (Art. 13(2)(a))
- Right to access, rectification, erasure, restriction, portability, and objection (Art. 13(2)(b-f))
- Right to withdraw consent at any time (Art. 13(2)(c))
- Right to lodge a complaint with a supervisory authority (Art. 13(2)(d))
- Whether provision of personal data is a statutory/contractual requirement (Art. 13(2)(e))

**Additional issues specific to abroad-jobs:**
- Does not mention Stripe as a payment processor
- Does not mention Resend as an email processor
- Does not mention Cloudflare as a hosting/database provider
- Does not mention data imports from Arbeitnow/Remotive APIs
- Does not mention cross-border data transfers to the US (Stripe, Resend, Cloudflare)

**Template boilerplate issues:**
- Contains placeholder text `[Date]` for last updated date
- Is too generic to be legally compliant for any specific site
- Does not mention specific third-party services used

**Risk:** Non-compliance with transparency obligations. This affects every deployed site.

**Recommended Fix:**
- Create a comprehensive privacy policy template that includes all Art. 13 disclosures
- Make the template configurable via `site.config.ts` to pull in site-specific details
- For abroad-jobs, write a complete privacy policy that lists all data processors
- Include a separate Cookie Policy section or page

---

#### H2. Google Fonts Loaded from Google CDN (IP Address Leak)

**Files:** `sites/abroad-jobs/src/layouts/SiteLayout.astro` (lines 24-26)
**Regulation:** GDPR Art. 6(1)(f), CJEU case law, German DPA rulings

**Description:** SiteLayout.astro loads Google Fonts directly from `fonts.googleapis.com` and `fonts.gstatic.com`. This causes every visitor's IP address to be transmitted to Google without consent.

In January 2022, the Munich Regional Court (LG Munchen I, Case No. 3 O 17493/20) ruled that dynamically loading Google Fonts from Google's CDN without consent violates GDPR, as IP addresses constitute personal data transmitted to a US company. The fine was EUR 100 per visitor.

**Risk:** Direct GDPR violation under German/EU case law. Multiple DPAs have confirmed this position.

**Recommended Fix:**
- Self-host Google Fonts by downloading them and serving from the site's own domain
- Update CSP headers to remove `fonts.googleapis.com` and `fonts.gstatic.com` from allowed sources
- Update the `<link>` preconnect hints accordingly
- Apply this change to the template so all new sites are compliant by default

---

#### H3. Import API Endpoint Weakly Protected

**File:** `sites/abroad-jobs/src/pages/api/import.ts` (lines 19-20)
**Regulation:** GDPR Art. 32 (Security of Processing)

**Description:** The import API endpoint has a fallback that allows unauthenticated access:
```typescript
if (expected && authHeader !== `Bearer ${expected}`) {
```
If `IMPORT_SECRET` is not set in the environment, the endpoint is completely open. Anyone can trigger arbitrary job imports, filling the database with unvetted data. The comment explicitly notes this: "If not set, allow (for initial testing)."

**Risk:** Unauthorized data manipulation. In production, if the secret is not set, anyone can trigger imports. This is also a denial-of-service vector.

**Recommended Fix:**
- Always require the secret: `if (!expected || authHeader !== \`Bearer ${expected}\`)`
- Remove the "for initial testing" fallback
- Add rate limiting to the endpoint

---

#### H4. No Rate Limiting on API Endpoints

**Files:** All API routes in `sites/abroad-jobs/src/pages/api/`
**Regulation:** GDPR Art. 32 (Security of Processing)

**Description:** Despite the CLAUDE.md stating "API routes: rate limiting, input validation (zod), CORS restricted to site origin", there is no rate limiting implementation on any API endpoint. The checkout endpoint can be called repeatedly, the jobs search endpoint has no throttling, and the import endpoint (as noted above) is weakly protected.

**Risk:** Abuse of the checkout flow to create spam job entries (pre-payment). Denial-of-service against the D1 database. Potential for automated data extraction from the jobs API.

**Recommended Fix:**
- Implement rate limiting using Cloudflare's built-in rate limiting rules or a middleware approach
- At minimum, rate limit POST endpoints (checkout, import)
- Consider using Cloudflare's Turnstile for the job posting form as additional bot protection

---

#### H5. Contact Email Stored Permanently in Database

**File:** `sites/abroad-jobs/src/lib/schema.ts` (line 11)
**Regulation:** GDPR Art. 5(1)(e) (Storage Limitation)

**Description:** The `contactEmail` field is stored in the jobs table with no mechanism for automatic deletion. Even after a job expires (30 days), the record including the email persists indefinitely. The privacy policy claims 90-day retention post-expiry, but this is not implemented.

**Risk:** Violation of the storage limitation principle. Personal data must not be kept longer than necessary for the purpose for which it was collected.

**Recommended Fix:**
- Implement an automated cleanup job that anonymizes or deletes expired job records after 90 days
- Alternatively, replace the contactEmail with a hash after the job expires (retaining the record for analytics without PII)
- Add this to the existing cron trigger in wrangler.toml

---

### MEDIUM

#### M1. CookieConsent Component Only Covers Google Analytics

**File:** `packages/ui/src/islands/CookieConsent.tsx` (lines 67-70)
**Regulation:** ePrivacy Directive Art. 5(3)

**Description:** The CookieConsent component returns `null` (renders nothing) for Plausible and Fathom analytics providers. While Plausible and Fathom are cookieless and do not require consent under the ePrivacy Directive, the component provides no mechanism for:
- Informing users about analytics at all (even privacy-friendly analytics should be disclosed)
- Managing consent for any other cookies or tracking (e.g., if a client adds a chat widget, marketing pixel, etc.)
- Granular consent categories (essential, analytics, marketing) as required by some DPA guidance

**Risk:** If a client site adds any non-essential tracking beyond the three supported analytics providers, there is no consent mechanism for it.

**Recommended Fix:**
- Extend the CookieConsent component to support granular consent categories
- Always show a minimal privacy notice for analytics, even for Plausible/Fathom (informational, not blocking)
- Add a cookie preferences page/panel for detailed management

---

#### M2. No Cookie Policy Page

**Files:** All sites
**Regulation:** ePrivacy Directive Art. 5(3), GDPR Art. 13

**Description:** None of the sites have a dedicated cookie policy. The abroad-jobs privacy policy mentions cookies briefly ("We use only essential cookies") but does not enumerate:
- What cookies are set (session cookies, localStorage keys, Cloudflare cookies)
- Their purpose, duration, and whether they are first-party or third-party
- How to manage or delete cookies

Note: The CookieConsent component stores consent state in `localStorage` (key: `cookie-consent`), which is technically web storage, not a cookie, but should still be disclosed.

**Recommended Fix:**
- Add a cookie policy section to the privacy policy (or a separate page)
- Enumerate all cookies and web storage used
- Include Cloudflare's automatic cookies (__cf_bm, __cflb, etc.) that may be set

---

#### M3. Template Privacy Policy Contains Unfilled Placeholders

**Files:** `sites/template/src/pages/privacy.astro`, `sites/athena-institute/src/pages/privacy.astro`, `sites/atelier-kosta/src/pages/privacy.astro`, `sites/meridian-properties/src/pages/privacy.astro`
**Regulation:** GDPR Art. 13 (Transparency)

**Description:** The template privacy policy and all sites generated from it contain `[Date]` as a placeholder for the last-updated date. The athena-institute, atelier-kosta, and meridian-properties sites all still have this placeholder in their live privacy pages. This indicates the privacy policies were never reviewed or customized for these clients.

**Risk:** Appears unprofessional and may indicate to regulators that privacy compliance was not seriously considered. Technically violates the transparency requirement as the information is incomplete.

**Recommended Fix:**
- Replace `[Date]` with actual dates in all deployed sites
- Add a build-time check or linting rule that flags `[Date]` placeholders in privacy/terms pages
- Auto-populate the date during site generation

---

#### M4. No CORS Headers on API Endpoints

**Files:** `sites/abroad-jobs/src/pages/api/checkout.ts`, `sites/abroad-jobs/src/pages/api/jobs.ts`
**Regulation:** GDPR Art. 32 (Security of Processing)

**Description:** Despite the CLAUDE.md stating "CORS restricted to site origin", none of the API routes set CORS headers. The checkout endpoint can be called from any origin. While Cloudflare Pages may add some default CORS behavior, there is no explicit `Access-Control-Allow-Origin` restriction in the code.

**Risk:** Cross-site request forgery potential. Third-party websites could submit job postings or extract job data.

**Recommended Fix:**
- Add explicit CORS headers restricting `Access-Control-Allow-Origin` to the site's own domain
- Implement a middleware that validates the `Origin` header on POST requests
- Consider CSRF tokens for state-changing operations

---

#### M5. No Data Processing Agreement (DPA) Documentation

**Regulation:** GDPR Art. 28 (Processor)

**Description:** The codebase and documentation contain no evidence of Data Processing Agreements with:
- Cloudflare (hosting, CDN, D1 database)
- Stripe (payment processing)
- Resend (email delivery)
- Hetzner (VPS hosting for Directus)
- Google (if Google Analytics is used)

DPAs are a legal requirement under GDPR when a data controller engages a data processor.

**Risk:** Processing personal data through processors without DPAs is a direct GDPR violation (Art. 28). Most of these providers offer standard DPAs that need to be signed.

**Recommended Fix:**
- Sign DPAs with all data processors (Cloudflare, Stripe, Resend, Hetzner)
- Document the DPA status in a legal compliance document
- Ensure each client site's privacy policy references the relevant processors
- For Google Analytics: the Google Ads DPA must be accepted in the Google Analytics admin

---

#### M6. Job Posting Form Collects Data Before Payment Confirmation

**File:** `sites/abroad-jobs/src/pages/api/checkout.ts` (lines 53-75)
**Regulation:** GDPR Art. 5(1)(c) (Data Minimisation)

**Description:** The checkout API inserts job records (including contactEmail) into the database BEFORE the Stripe payment is completed. If the user abandons the Stripe Checkout page, the personal data remains in D1 indefinitely as a pending (isLive=0) record with no cleanup mechanism.

**Risk:** Accumulation of personal data from abandoned checkouts. Over time, this creates a growing store of email addresses and company information for transactions that were never completed.

**Recommended Fix:**
- Implement a cleanup job that deletes pending (isLive=0) records older than 24-48 hours
- Alternatively, store job data in a temporary session/cache and only persist to D1 after webhook confirmation
- Add this cleanup to the daily cron trigger

---

#### M7. Stripe Session ID Stored Without Encryption

**File:** `sites/abroad-jobs/src/lib/schema.ts` (line 30)
**Regulation:** GDPR Art. 32 (Security of Processing)

**Description:** The Stripe checkout session ID is stored as plaintext in the D1 database. While session IDs are not as sensitive as card numbers, they can be used to look up session details via the Stripe API if the API key is compromised.

**Risk:** Low-to-medium. If the D1 database is breached alongside the Stripe API key, session IDs could be used to retrieve additional customer information from Stripe.

**Recommended Fix:**
- Consider hashing or omitting the session ID after the webhook has been processed
- The session ID is primarily needed for the webhook matching; after activation, it could be cleared

---

### LOW

#### L1. No Age Verification on Job Board

**File:** `sites/abroad-jobs/src/islands/JobPostForm.tsx`
**Regulation:** GDPR Art. 8 (Children's Consent), COPPA (if US users)

**Description:** The abroad-jobs site has no age verification mechanism. While a job board is unlikely to attract children, GDPR requires additional safeguards for processing data of users under 16 (or 13-16 depending on member state). Since the site targets international job seekers, it may process data from users in jurisdictions with different age thresholds.

**Risk:** Low for a job board. Employment-related services are inherently adult-oriented.

**Recommended Fix:**
- Add a Terms of Service clause stating the service is for users 18+
- Consider adding an age confirmation checkbox if regulatory requirements change

---

#### L2. Error Logging May Contain Personal Data

**Files:** `sites/abroad-jobs/src/pages/api/webhook.ts` (line 67), `sites/abroad-jobs/src/lib/import-jobs.ts` (line 246), `sites/admin/src/middleware.ts` (line 47)
**Regulation:** GDPR Art. 5(1)(f) (Integrity and Confidentiality)

**Description:** Several `console.error` calls may log personal data to Cloudflare's logging infrastructure. The webhook error handler logs "Failed to send confirmation email" (could include email context), and the import failure logs job titles.

**Risk:** Low. Console logs in Cloudflare Workers are ephemeral by default, but if Sentry error tracking is enabled (mentioned in CLAUDE.md), error context could include PII.

**Recommended Fix:**
- Ensure Sentry (if used) has PII scrubbing enabled
- Avoid logging personal data in error messages
- Configure Cloudflare Workers log retention to the minimum necessary

---

#### L3. Terms of Service Missing Governing Law for EU Operations

**File:** `sites/abroad-jobs/src/pages/terms.astro`
**Regulation:** Regulation (EU) No 1215/2012 (Brussels I Recast)

**Description:** The abroad-jobs Terms of Service do not specify governing law or jurisdiction. For a site targeting EU job seekers and employers, this is a gap. The template site's Terms hardcode "England and Wales" which may be inappropriate for a Cyprus-based agency (.cy domain) operating a .eu domain.

**Risk:** Low legal risk but creates ambiguity in dispute resolution.

**Recommended Fix:**
- Add governing law clause appropriate to the business entity (likely Cyprus)
- For the template, make the governing law configurable via site.config.ts

---

#### L4. Resend Email From Address Uses noreply@ Prefix

**File:** `sites/abroad-jobs/src/lib/email.ts` (line 19)
**Regulation:** GDPR Art. 12 (Transparent Communication)

**Description:** Confirmation emails are sent from `noreply@abroadjobs.eu`, but the email body says "reply to this email" if users have questions. This is contradictory and prevents users from exercising their right to communication about their data.

**Risk:** Low. Users can still reach the contact email from the privacy policy, but the UX is poor.

**Recommended Fix:**
- Change the from address to `hello@abroadjobs.eu` or another monitored address
- Or remove the "reply to this email" text and direct users to the contact email

---

## GDPR Compliance Checklist

| Requirement | Status | Notes |
|------------|--------|-------|
| **Lawfulness of Processing (Art. 5/6)** | | |
| Legal basis identified for each processing activity | MISSING | No legal basis documentation |
| Consent collected where required | MISSING | No consent checkboxes on forms |
| Consent recorded with timestamp | MISSING | No consent audit trail |
| **Transparency (Art. 12-14)** | | |
| Privacy policy exists | PARTIAL | Exists but incomplete |
| Privacy policy contains all Art. 13 disclosures | MISSING | Missing most required disclosures |
| Data controller identity disclosed | MISSING | No controller details in any policy |
| Legal basis disclosed per activity | MISSING | Not mentioned |
| Data subject rights listed | MISSING | Not listed in any privacy policy |
| Cross-border transfer information | MISSING | US transfers not disclosed |
| Cookie policy | MISSING | No dedicated cookie policy |
| **Data Subject Rights (Art. 15-22)** | | |
| Right of access mechanism | MISSING | No mechanism exists |
| Right to rectification mechanism | MISSING | No mechanism exists |
| Right to erasure mechanism | MISSING | No deletion API or process |
| Right to data portability | MISSING | No export functionality |
| Right to object | MISSING | No mechanism exists |
| **Data Protection by Design (Art. 25)** | | |
| Data minimization | PARTIAL | Forms collect appropriate fields but store abandoned checkout data |
| Storage limitation | MISSING | No automated data deletion |
| Purpose limitation | PARTIAL | Data used for stated purposes |
| **Security (Art. 32)** | | |
| HTTPS enforced | PASS | HSTS headers configured |
| Security headers | PASS | CSP, X-Frame-Options, X-Content-Type-Options set |
| Input validation | PASS | Zod schemas validate all inputs |
| Spam protection | PASS | Honeypot fields on all forms |
| Access control | PARTIAL | Admin protected, but import API has weak auth |
| Rate limiting | MISSING | Not implemented despite documentation claiming it |
| CORS restrictions | MISSING | Not implemented despite documentation claiming it |
| **Data Processing Agreements (Art. 28)** | | |
| DPA with Cloudflare | UNKNOWN | No evidence in codebase |
| DPA with Stripe | UNKNOWN | No evidence in codebase |
| DPA with Resend | UNKNOWN | No evidence in codebase |
| DPA with Hetzner | UNKNOWN | No evidence in codebase |
| **Cookie Compliance (ePrivacy Directive)** | | |
| Cookie consent banner | PARTIAL | Only for Google Analytics, not in BaseLayout |
| Consent before tracking | FAIL | GA loads without consent in BaseLayout |
| Consent withdrawal mechanism | MISSING | No way to withdraw consent after accepting |
| **Records of Processing (Art. 30)** | | |
| Records of processing activities maintained | MISSING | No ROPA documentation |
| **Data Protection Impact Assessment (Art. 35)** | | |
| DPIA for high-risk processing | NOT ASSESSED | May be required for abroad-jobs (large scale personal data) |

---

## Prioritized Recommendations

### Immediate (Legal Risk -- address within 1 week)

1. **Fix Google Analytics consent flow.** Remove GA script tags from `BaseLayout.astro`. Ensure GA only loads via CookieConsent island after explicit consent. This is the single highest-risk issue as DPAs are actively fining for this.

2. **Self-host Google Fonts.** Download and serve fonts from the site's own domain on all sites, especially abroad-jobs and any sites using SiteLayout with Google Fonts links.

3. **Add consent checkbox to JobPostForm.tsx.** Include a mandatory "I agree to the Privacy Policy and Terms" checkbox with links. Validate server-side.

4. **Implement data deletion for abroad-jobs.** Create an admin-protected endpoint to delete all records by contactEmail. Document the process.

### Short-term (within 1 month)

5. **Rewrite privacy policies.** Create a comprehensive GDPR-compliant privacy policy template covering all Art. 13 requirements. Customize for abroad-jobs with specific processor disclosures.

6. **Implement automated data retention.** Add a daily cron job that deletes expired jobs older than 90 days and abandoned checkout records older than 48 hours.

7. **Fix import API security.** Make IMPORT_SECRET mandatory (remove the fallback). Add rate limiting.

8. **Sign DPAs with all processors.** Cloudflare, Stripe, Resend, and Hetzner all offer standard DPAs. Sign and file them.

9. **Add CORS restrictions.** Implement explicit CORS headers on all API endpoints.

10. **Fix placeholder dates.** Replace `[Date]` in all deployed privacy and terms pages.

### Medium-term (within 3 months)

11. **Implement consent withdrawal.** Add a mechanism for users to withdraw cookie consent (e.g., a "Cookie Preferences" link in the footer).

12. **Create a cookie policy.** Enumerate all cookies and web storage used, including Cloudflare's automatic cookies.

13. **Implement data subject request workflow.** Create documentation and tooling for handling access, rectification, portability, and erasure requests.

14. **Add rate limiting.** Implement Cloudflare rate limiting rules for all API endpoints.

15. **Create Records of Processing Activities (ROPA).** Document all processing activities across the platform per Art. 30.

16. **Extend CookieConsent for granular categories.** Support essential, analytics, and marketing consent categories for future-proofing.

### Ongoing

17. **Audit new client sites at deployment.** Ensure privacy policies are customized, security headers are correct, and consent mechanisms are in place before any site goes live.

18. **Review DPA compliance annually.** Verify that all processor agreements are current and that sub-processor lists are up to date.

19. **Train on GDPR requirements.** Ensure anyone deploying client sites understands the minimum privacy requirements.

---

## Appendix: Files Reviewed

| File | Relevance |
|------|-----------|
| `packages/ui/src/islands/CookieConsent.tsx` | Cookie consent implementation |
| `packages/ui/src/islands/ContactForm.tsx` | Contact form (shared) |
| `packages/ui/src/layouts/BaseLayout.astro` | Analytics loading (all sites) |
| `packages/config/src/types.ts` | SiteConfig type (analytics config) |
| `sites/template/src/pages/privacy.astro` | Template privacy policy |
| `sites/template/src/pages/terms.astro` | Template terms of service |
| `sites/template/public/_headers` | Template security headers |
| `sites/template/site.config.ts` | Template site configuration |
| `sites/abroad-jobs/src/pages/privacy.astro` | Abroad-jobs privacy policy |
| `sites/abroad-jobs/src/pages/terms.astro` | Abroad-jobs terms of service |
| `sites/abroad-jobs/public/_headers` | Abroad-jobs security headers |
| `sites/abroad-jobs/site.config.ts` | Abroad-jobs site configuration |
| `sites/abroad-jobs/src/lib/schema.ts` | Database schema (personal data) |
| `sites/abroad-jobs/src/lib/validation.ts` | Input validation schemas |
| `sites/abroad-jobs/src/lib/stripe.ts` | Stripe integration |
| `sites/abroad-jobs/src/lib/email.ts` | Email sending via Resend |
| `sites/abroad-jobs/src/lib/db.ts` | Database helper |
| `sites/abroad-jobs/src/lib/import-jobs.ts` | External job import |
| `sites/abroad-jobs/src/pages/api/checkout.ts` | Checkout API (creates jobs + Stripe session) |
| `sites/abroad-jobs/src/pages/api/webhook.ts` | Stripe webhook handler |
| `sites/abroad-jobs/src/pages/api/jobs.ts` | Job search API |
| `sites/abroad-jobs/src/pages/api/import.ts` | Job import trigger API |
| `sites/abroad-jobs/src/pages/index.astro` | Homepage (SSR) |
| `sites/abroad-jobs/src/islands/JobPostForm.tsx` | Job posting form |
| `sites/abroad-jobs/src/layouts/SiteLayout.astro` | Abroad-jobs layout (Google Fonts) |
| `sites/abroad-jobs/wrangler.toml` | Cloudflare Workers config |
| `sites/admin/src/middleware.ts` | Admin auth middleware |
| `sites/admin/src/pages/login.astro` | Admin login redirect |
| `sites/athena-institute/src/pages/privacy.astro` | Client privacy policy |
| `sites/athena-institute/public/_headers` | Client security headers |
| `sites/atelier-kosta/src/pages/privacy.astro` | Client privacy policy |
| `sites/atelier-kosta/public/_headers` | Client security headers |
| `sites/meridian-properties/src/pages/privacy.astro` | Client privacy policy |
| `docs/auth.md` | Auth architecture documentation |
