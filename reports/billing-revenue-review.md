# Billing & Revenue Review: Infront CMS Platform

**Date:** 2026-03-23
**Reviewer:** Payment Systems & Revenue Operations Analyst
**Scope:** abroad-jobs Stripe integration, payment flow, revenue tracking, and billing infrastructure
**Severity Scale:** CRITICAL | HIGH | MEDIUM | LOW

---

## Executive Summary

**Overall Billing Status: FUNCTIONAL BUT FRAGILE**

The abroad-jobs site has a working Stripe Checkout integration that processes EUR 89 per job listing payments. The core payment flow (form submission -> Stripe Checkout -> webhook activation) is functional, and Stripe webhook signature verification is correctly implemented. However, the billing infrastructure has **4 critical issues** that directly impact revenue: no refund/dispute handling (jobs stay live after chargebacks), a race condition between checkout and webhook that could result in customers paying without jobs going live, no revenue tracking or analytics, and zero backup of payment-related data. There are also significant gaps in billing operations tooling -- no admin dashboard for payments, no ability to issue refunds, and no revenue reporting.

**Finding Counts:** 4 Critical, 5 High, 6 Medium, 3 Low

---

## Critical Issues

### C-1: No Refund or Dispute Webhook Handling -- Direct Revenue Loss

**File:** `sites/abroad-jobs/src/pages/api/webhook.ts`

The webhook handler only processes `checkout.session.completed`. There are no handlers for:
- `charge.refunded` -- a refunded job stays live for the full 30 days
- `charge.dispute.created` -- disputed charges still show active jobs
- `checkout.session.expired` -- abandoned sessions leave orphan database rows

**Impact:** A customer can:
1. Pay EUR 89, get their job listing activated
2. File a chargeback with their bank
3. Get the EUR 89 refunded by Stripe
4. The job listing remains live for 30 days -- service delivered for free
5. Stripe charges a EUR 15 dispute fee on top of the refund

**Revenue impact per incident:** EUR 89 (refund) + EUR 15 (dispute fee) = EUR 104 loss per chargeback.

**Recommended Fix:** Add handlers for `charge.refunded` and `charge.dispute.created` that immediately set `is_live = 0` on associated jobs. Add `checkout.session.expired` handler to clean up pending job rows.

---

### C-2: Race Condition Between Checkout and Webhook -- Payments Without Activation

**File:** `sites/abroad-jobs/src/pages/api/checkout.ts` (lines 43-75)
**File:** `sites/abroad-jobs/src/pages/api/webhook.ts` (lines 33-48)

The checkout flow creates the Stripe session first, then inserts pending jobs. If Stripe processes the payment and fires the webhook before the D1 inserts complete, the webhook finds zero jobs to activate.

Additionally, `createCheckoutParams` passes an empty string as `sessionId` to metadata (`session_id: ''`), making Stripe-side correlation useless.

**Impact:** Customer is charged but jobs never go live. There is no retry mechanism, no monitoring, and no admin notification.

**Estimated occurrence rate:** Low but non-zero. More likely with slow D1 responses or large batches (up to 50 jobs per checkout).

**Recommended Fix:** Insert pending jobs first, capture their IDs, then create the Stripe session with job IDs in metadata. If Stripe session creation fails, delete the pending jobs.

---

### C-3: No Revenue Tracking or Analytics

**Files:** None (entirely absent)

There is no revenue dashboard, no payment history view, no monthly recurring revenue (MRR) tracking, and no revenue reports. The only way to see revenue data is through the Stripe Dashboard directly. The admin UI has no billing section at all.

The platform cannot answer basic business questions:
- How much revenue was generated this month?
- How many jobs were posted this week?
- What is the conversion rate (visitors to paid posts)?
- Which countries/industries generate the most revenue?
- Are there any failed payments or disputes?

**Recommended Fix:** Add a billing section to the admin UI that queries Stripe API for payment history, revenue metrics, and dispute status. Alternatively, use Stripe's built-in reporting and ensure admin users have Stripe Dashboard access.

---

### C-4: Zero Backup of Payment-Related Data

**Files:** `sites/abroad-jobs/wrangler.toml` (D1 binding)

The D1 database contains all job listings linked to Stripe payments (session IDs, activation timestamps, expiry dates). This data has zero independent backup. If the D1 database is lost:
- All active job listings disappear
- There is no way to reconstruct which jobs were paid for
- Refund disputes become unresolvable (no proof of service delivery)

Cloudflare's built-in point-in-time recovery may help (30 days on paid plans), but there is no tested restore procedure.

**Recommended Fix:** Implement daily D1 exports via `wrangler d1 export` and archive to S3.

---

## High Severity Issues

### H-1: No Webhook Idempotency Protection -- Duplicate Emails

**File:** `sites/abroad-jobs/src/pages/api/webhook.ts`

Stripe can deliver the same webhook event multiple times (retries on 5xx, network timeouts). Each delivery triggers:
1. `UPDATE jobs SET is_live = 1, activated_at = NOW()` -- this is idempotent for activation but overwrites the original `activated_at` timestamp
2. Confirmation email send -- not idempotent, sends duplicate emails

**Impact:** Customers may receive multiple "Your job is live!" emails, appearing unprofessional.

**Recommended Fix:** Check if `activatedAt` is already set before sending the confirmation email. Store the Stripe event ID and skip already-processed events.

---

### H-2: No Admin Interface for Payment Operations

There is no way for an admin to:
- View payment history for a specific job listing
- Issue refunds (must go to Stripe Dashboard)
- Extend a job listing's expiry date
- Manually activate a job (in case of webhook failure)
- View/resolve payment disputes

**Impact:** All payment operations require direct Stripe Dashboard access, which may not be available to all team members.

**Recommended Fix:** Add a `/billing` section to the admin UI with at minimum: recent payments list, per-job payment status, and a manual activation button.

---

### H-3: Price Hardcoded in Two Separate Files

**File:** `sites/abroad-jobs/src/lib/stripe.ts` (line 9): `PRICE_PER_JOB_CENTS = 8900`
**File:** `sites/abroad-jobs/src/islands/JobPostForm.tsx` (line 7): `PRICE_PER_JOB = 89`

If the price changes, both files must be updated. If only the backend is updated, the frontend shows the wrong price. If only the frontend is updated, Stripe charges a different amount than displayed.

**Impact:** Price inconsistency between what the user sees and what they are charged.

**Recommended Fix:** Move the price to a shared config file or environment variable. Have the frontend read it from the same source.

---

### H-4: No Checkout Rate Limiting -- Abuse Vector

**File:** `sites/abroad-jobs/src/pages/api/checkout.ts`

There is no rate limiting on the checkout endpoint. An attacker can:
1. Submit hundreds of checkout forms, creating thousands of pending job rows in D1
2. Create hundreds of Stripe checkout sessions (consuming Stripe API quota)
3. Cause database bloat that degrades search performance

**Recommended Fix:** Implement per-IP rate limiting. Cloudflare Workers can use D1 or an in-memory counter.

---

### H-5: Orphan Pending Jobs Accumulate Forever

**File:** `sites/abroad-jobs/src/pages/api/checkout.ts` (lines 53-74)

Jobs are inserted with `isLive: 0` before Stripe checkout. If the user abandons checkout:
- These rows remain in the database forever
- They consume D1 storage
- They bloat the FTS5 search index (triggers fire on INSERT regardless of `isLive`)
- They could appear in admin queries or future reports

**Estimated accumulation rate:** If 50% of checkout sessions are abandoned (industry average), approximately 1 orphan job per 2 checkout attempts.

**Recommended Fix:** Add a scheduled cleanup that deletes jobs where `isLive = 0 AND created_at < (now - 24 hours)`.

---

## Medium Severity Issues

### M-1: No Stripe Webhook Monitoring or Alerting

The webhook endpoint has minimal error logging (`console.error` which vanishes after Worker execution). There is no alerting for:
- Webhook signature verification failures (possible attack or misconfiguration)
- Failed job activations
- Failed email deliveries
- Stripe webhook delivery failures (visible in Stripe Dashboard but not monitored)

**Recommended Fix:** Add structured logging and alerting for all webhook events.

---

### M-2: Stripe Webhook Does Not Verify Payment Amount

**File:** `sites/abroad-jobs/src/pages/api/webhook.ts`

The webhook activates all jobs for a session without verifying that the amount paid matches `PRICE_PER_JOB_CENTS * jobCount`. While Stripe enforces the checkout session amount, this is a defense-in-depth gap.

---

### M-3: No Bulk Pricing or Volume Discounts

The system charges EUR 89 * N for N jobs with no volume discount. The validation allows up to 50 jobs per checkout (EUR 4,450 maximum). There is no pricing tier structure.

**Impact:** Large employers may be deterred by high costs for bulk postings.

---

### M-4: No Free Trial or Promotional Pricing Mechanism

There is no way to offer:
- Free trial postings
- Promotional discount codes
- Partner pricing
- Coupon codes

**Recommended Fix:** Use Stripe Coupons/Promotion Codes API.

---

### M-5: Job Expiration Is Passive -- No Renewal Revenue

**File:** `sites/abroad-jobs/src/pages/api/jobs.ts`

Jobs expire after 30 days. There is:
- No renewal reminder email before expiry
- No self-service renewal payment flow
- No auto-renewal option
- No reduced renewal pricing

**Impact:** Missed recurring revenue. Employers must go through the full posting flow again.

**Recommended Fix:** Send a renewal reminder email 7 days before expiry with a one-click renewal link.

---

### M-6: Success Page Exposes Job Data via Session ID

**File:** `sites/abroad-jobs/src/pages/success.astro`

The success page fetches all jobs for a given `session_id` URL parameter. Anyone who knows or guesses a Stripe session ID can see job details and payment status.

**Impact:** Low risk (Stripe session IDs are long random strings) but an information disclosure pattern.

---

## Low Severity Issues

### L-1: No Receipt or Invoice Generation

Stripe generates receipts, but the platform does not generate or link to them. The confirmation email does not include a receipt URL.

### L-2: No Currency Flexibility

The price is hardcoded in EUR. There is no multi-currency support. International employers may prefer to pay in their local currency.

### L-3: No Tax/VAT Handling

There is no VAT collection, no tax calculation, and no invoice with VAT details. For a Cyprus-based business selling to EU customers, VAT compliance is a legal requirement.

**Recommended Fix:** Implement Stripe Tax or Stripe Checkout's automatic tax calculation. Add VAT ID collection for B2B transactions.

---

## Revenue Flow Diagram

```
User submits job form
  -> POST /api/checkout
    -> Insert pending jobs (isLive=0) into D1
    -> Create Stripe Checkout session (EUR 89 * N)
    -> Redirect user to Stripe Checkout

User completes payment on Stripe
  -> Stripe sends checkout.session.completed webhook
    -> POST /api/webhook
      -> Verify Stripe signature
      -> UPDATE jobs SET isLive=1, activatedAt=NOW(), expiresAt=NOW()+30d
      -> Send confirmation email
      -> Return 200

After 30 days:
  -> Job filtered from search results (passive expiry)
  -> No cleanup, no notification, no renewal option
```

---

## Billing Metrics (Estimated, Not Tracked)

| Metric | Status | Notes |
|--------|--------|-------|
| Total revenue | Unknown | No tracking in platform |
| Monthly revenue | Unknown | Only visible in Stripe Dashboard |
| Conversion rate | Unknown | No analytics integration |
| Average order value | EUR 89 (single job) | No bulk discount incentive |
| Chargeback rate | Unknown | No dispute handling |
| Customer lifetime value | EUR 89 (one-time) | No renewal mechanism |
| Revenue per country | Unknown | Data exists in D1 but no reporting |

---

## Prioritized Recommendations

### Immediate (This Week) -- Revenue Protection

1. **Add refund/dispute webhook handlers** (C-1) -- prevents giving away free service
2. **Fix checkout/webhook race condition** (C-2) -- prevents payment without activation
3. **Add webhook idempotency** (H-1) -- prevents duplicate emails

### Short-Term (This Month) -- Revenue Operations

4. **Add D1 backup for payment data** (C-4)
5. **Add checkout rate limiting** (H-4)
6. **Add orphan job cleanup** (H-5)
7. **Consolidate price to single source** (H-3)
8. **Add webhook monitoring and alerting** (M-1)

### Medium-Term (This Quarter) -- Revenue Growth

9. **Add admin billing dashboard** (H-2) -- payment history, manual activation
10. **Add revenue tracking/reporting** (C-3) -- basic metrics dashboard
11. **Implement renewal reminder emails** (M-5) -- recurring revenue
12. **Add promotional pricing** (M-4) -- Stripe Coupons
13. **Implement VAT handling** (L-3) -- legal compliance

### Long-Term -- Revenue Optimization

14. **Add bulk pricing tiers** (M-3)
15. **Add multi-currency support** (L-2)
16. **Add receipt/invoice generation** (L-1)
17. **Implement subscription model** for high-volume employers

---

## Files Reviewed

- `sites/abroad-jobs/src/pages/api/checkout.ts` -- Checkout flow
- `sites/abroad-jobs/src/pages/api/webhook.ts` -- Stripe webhook handler
- `sites/abroad-jobs/src/lib/stripe.ts` -- Stripe configuration and helpers
- `sites/abroad-jobs/src/lib/validation.ts` -- Input validation schemas
- `sites/abroad-jobs/src/lib/schema.ts` -- D1 database schema
- `sites/abroad-jobs/src/islands/JobPostForm.tsx` -- Job posting form
- `sites/abroad-jobs/src/pages/success.astro` -- Post-payment success page
- `sites/abroad-jobs/src/pages/api/jobs.ts` -- Job listing API
- `sites/abroad-jobs/src/pages/api/import.ts` -- Job import endpoint
- `sites/abroad-jobs/wrangler.toml` -- Cloudflare Workers config
- `sites/admin/src/pages/` -- Admin UI pages (checked for billing section)
- All admin API routes (checked for payment-related endpoints)
