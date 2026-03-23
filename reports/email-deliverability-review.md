# Email Deliverability Review

**Date:** 2026-03-23
**Scope:** All email-related code across the infront-cms monorepo
**Reviewer:** Claude Code audit

---

## Executive Summary

The platform uses Resend as its email provider, with two email-sending paths: (1) confirmation emails after Stripe checkout in the abroad-jobs site, and (2) contact form submissions across client sites. The review found **2 critical issues**, **5 high-severity issues**, **5 medium issues**, and **4 low-severity items**. The most urgent problem is that the contact form's API route (`/api/contact`) does not exist anywhere in the codebase despite the `ContactForm.tsx` island posting to it. Additionally, webhook-triggered confirmation emails have no retry or dead-letter mechanism, meaning a transient Resend failure after a paid checkout permanently loses the confirmation email.

---

## Key Files Reviewed

- `sites/abroad-jobs/src/lib/email.ts` -- Resend SDK usage, confirmation email
- `sites/abroad-jobs/src/pages/api/webhook.ts` -- Stripe webhook, email trigger
- `sites/abroad-jobs/src/pages/api/checkout.ts` -- Checkout flow
- `sites/abroad-jobs/src/env.d.ts` -- Environment declarations
- `packages/ui/src/islands/ContactForm.tsx` -- Contact form island
- `packages/utils/src/validation.ts` -- Shared ContactSchema
- `sites/template/src/pages/contact.astro` -- Contact page
- `sites/template/public/_headers` -- CSP headers
- `sites/abroad-jobs/public/_headers` -- CSP headers
- `sites/admin/src/lib/generator.ts` -- Site generator
- `.github/workflows/deploy-site.yml` -- Deploy workflow
- All client site directories checked for API routes (none found)

---

## Issues Found

### CRITICAL

#### C1. Contact form API route `/api/contact` does not exist

**Description:** The `ContactForm.tsx` island (shared across all sites via `packages/ui`) posts form submissions to `/api/contact`, but no such API route file exists anywhere in the codebase. Contact form submissions from every client site will fail with a 404 error.

**Impact:** Every client site with a contact form is broken. Form submissions are silently lost.

**Recommended fix:** Create `sites/template/src/pages/api/contact.ts` (and replicate to all client sites) that validates the form data with the shared `ContactSchema`, sends the email via Resend, and returns an appropriate response.

---

#### C2. No retry/dead-letter for webhook confirmation emails

**Description:** When a Stripe webhook fires `checkout.session.completed`, the handler in `webhook.ts` sends a confirmation email via Resend. If the Resend API call fails (transient network error, rate limit, service outage), the error is caught and logged to `console.error`, but the email is **permanently lost**. There is no retry queue, no dead-letter mechanism, and no way to manually resend.

**Impact:** Customers who successfully pay for job postings may never receive their confirmation email. On Cloudflare Workers, the `console.error` log is ephemeral and will be lost after the request completes.

**Recommended fix:**
1. Store email send status in D1 (add an `email_sent_at` column to the jobs table or a separate `email_log` table).
2. Add a retry mechanism -- either a cron job that checks for unsent emails, or use Resend's idempotency keys and retry on failure.
3. Add alerting for failed email sends via Sentry or structured logging.

---

### HIGH

#### H1. No SPF/DKIM/DMARC DNS records documented or configured

**Description:** There is no documentation or configuration for email authentication DNS records (SPF, DKIM, DMARC) for the sending domain. Without these records, emails sent via Resend are likely to land in spam folders or be rejected entirely by major email providers (Gmail, Outlook, Yahoo).

**Impact:** Poor email deliverability. Emails may be silently rejected or spam-filtered.

**Recommended fix:** Configure SPF, DKIM, and DMARC records for the sending domain in Cloudflare DNS. Resend provides the required DNS records in its dashboard under Domain Settings.

---

#### H2. No Reply-To header despite body saying "reply to this email"

**Description:** The confirmation email in `email.ts` does not set a `Reply-To` header, but the email body content may imply the recipient can reply. Without a Reply-To header, replies go to the `from` address (likely a no-reply address), which may bounce or be unmonitored.

**Impact:** Customer replies are lost. Poor customer experience.

**Recommended fix:** Add a `reply_to` field to the Resend `emails.send()` call, pointing to the job poster's contact email or a monitored support address.

---

#### H3. No HTML email templates (plain text only)

**Description:** Confirmation emails are sent as plain text with no HTML template. Plain text emails lack branding, have poor formatting on mobile devices, and may appear less trustworthy to recipients.

**Impact:** Professional appearance of the platform is undermined. Lower engagement with email content.

**Recommended fix:** Create HTML email templates using a lightweight email framework (e.g., React Email, MJML) for confirmation emails. Include the company logo, structured layout, and a clear call-to-action.

---

#### H4. No rate limiting on email-triggering endpoints

**Description:** The webhook endpoint (`/api/webhook`) and the (missing) contact form endpoint have no rate limiting. An attacker could potentially trigger many email sends, consuming the Resend free tier quota (100 emails/day, 3,000/month) or incurring costs on a paid plan.

**Impact:** Email quota exhaustion, potential for email abuse (spam sending through the platform).

**Recommended fix:** Add rate limiting via Cloudflare Rate Limiting rules or a simple in-memory/KV-based counter. For webhooks, Stripe's signature verification provides some protection, but the contact form endpoint needs explicit rate limiting.

---

#### H5. Missing RESEND_API_KEY causes crash, not graceful degradation

**Description:** If the `RESEND_API_KEY` environment variable is missing or invalid, the Resend SDK initialization will fail, causing a runtime crash on the first email send attempt. There is no graceful fallback or startup validation.

**Impact:** Entire webhook handler crashes on email send, potentially preventing job activation even though payment succeeded.

**Recommended fix:** Validate `RESEND_API_KEY` exists at startup/initialization. If missing, log a warning and skip email sending rather than crashing. Ensure job activation is decoupled from email sending.

---

### MEDIUM

#### M1. No email delivery monitoring or alerting

**Description:** There is no monitoring of email delivery rates, bounce rates, or complaint rates. Failed sends are logged to `console.error` which is ephemeral on Cloudflare Workers. No Sentry, no structured logging, no Resend webhook for delivery events.

**Impact:** Cannot detect deliverability degradation. Issues may persist for days before being noticed.

**Recommended fix:** Set up Resend webhooks for `email.delivered`, `email.bounced`, `email.complained` events. Log these to a persistent store or alerting service.

---

#### M2. Template CSP includes api.resend.com in connect-src

**Description:** The template site's `_headers` file includes `https://api.resend.com` in the CSP `connect-src` directive, suggesting client-side API calls to Resend were considered. Making Resend API calls from the client side would expose the API key.

**Impact:** Potential security concern if client-side Resend calls are ever implemented. Currently informational as the API key should only be used server-side.

**Recommended fix:** Remove `api.resend.com` from `connect-src` if all email sending is server-side. This reduces the CSP attack surface.

---

#### M3. Sender address not configurable per client site

**Description:** The email sender address is hardcoded in the email utility rather than being configurable per site via `site.config.ts`. All client sites that implement contact forms would send from the same address.

**Impact:** Clients cannot have emails appear to come from their own domain. Reduces professionalism and brand consistency.

**Recommended fix:** Add a `email.from` field to the site configuration schema and read it when sending emails.

---

#### M4. No acknowledgment email to contact form submitters

**Description:** When someone submits a contact form, no acknowledgment email is sent to the submitter. They only see a success message in the browser, with no confirmation that their message was received.

**Impact:** Poor customer experience. Submitters may resubmit thinking their message was lost.

**Recommended fix:** Send a brief auto-reply to the contact form submitter confirming receipt.

---

#### M5. Imported jobs use fake contact email

**Description:** Jobs imported from Arbeitnow via the import script use a placeholder or generic contact email rather than actual employer contact information.

**Impact:** If the platform ever sends emails related to imported jobs, they would go to an incorrect address.

**Recommended fix:** Either omit the contact email for imported jobs or source it from the Arbeitnow API response if available.

---

### LOW

#### L1. No CAN-SPAM footer

**Description:** Confirmation emails do not include a CAN-SPAM compliant footer with physical mailing address and unsubscribe link. While transactional emails are generally exempt from CAN-SPAM, including a footer is best practice.

**Recommended fix:** Add a minimal footer with the business address to all outgoing emails.

---

#### L2. Error logging lacks context

**Description:** Email failure logging (`console.error('Failed to send confirmation email')`) includes no context -- no session ID, customer email, job IDs, or error details.

**Recommended fix:** Include structured context in error logs: `{ event: 'email_send_failed', sessionId, email, jobCount, error: err.message }`.

---

#### L3. No timeout on Resend API calls

**Description:** The `resend.emails.send()` call has no timeout configuration. A hung Resend API connection could block the webhook handler indefinitely (until the Workers execution limit).

**Recommended fix:** Use `AbortController` with a 10-second timeout on the email send call.

---

#### L4. Deploy workflow inconsistency between template and abroad-jobs

**Description:** The CI deploy workflow targets the template site only. The abroad-jobs site has a different email configuration and deployment path. Changes to email functionality in the template may not be reflected in abroad-jobs and vice versa.

**Recommended fix:** Ensure email-related code is shared via `packages/utils` and tested consistently across all sites that use it.

---

## Recommendations (Prioritized)

### Priority 1: Immediate
1. **Create the missing `/api/contact` route** -- Contact forms are completely broken
2. **Add retry mechanism for confirmation emails** -- Prevent permanent email loss after payment
3. **Configure SPF/DKIM/DMARC** -- Essential for deliverability

### Priority 2: Near-Term (1-2 weeks)
4. **Add Reply-To headers** to all outgoing emails
5. **Create HTML email templates** for professional appearance
6. **Add rate limiting** on email-triggering endpoints
7. **Validate RESEND_API_KEY** at startup with graceful fallback

### Priority 3: Medium-Term (1 month)
8. **Set up email delivery monitoring** via Resend webhooks
9. **Make sender address configurable** per site
10. **Add contact form acknowledgment emails**
11. **Add timeouts** to Resend API calls
12. **Improve error logging context** for email failures
