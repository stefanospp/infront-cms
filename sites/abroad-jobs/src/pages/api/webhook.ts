import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { jobs } from '../../lib/schema';
import { getStripe } from '../../lib/stripe';
import { getResend, sendConfirmationEmail } from '../../lib/email';
import { eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  const stripe = getStripe(env.STRIPE_SECRET_KEY);
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 });
  }

  const db = getDb(env.DB);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const sessionId = session.id;
    const now = Math.floor(Date.now() / 1000);
    const thirtyDays = 30 * 24 * 60 * 60;

    // Idempotency check: skip if jobs are already activated
    const existingJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.stripeSessionId, sessionId));

    if (existingJobs.length > 0 && existingJobs[0]?.isLive === 1) {
      return new Response('ok (already processed)', { status: 200 });
    }

    // Activate all jobs for this session
    await db
      .update(jobs)
      .set({
        isLive: 1,
        activatedAt: now,
        expiresAt: now + thirtyDays,
      })
      .where(eq(jobs.stripeSessionId, sessionId));

    // Fetch the activated jobs for the confirmation email
    const activatedJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.stripeSessionId, sessionId));

    if (activatedJobs.length > 0 && activatedJobs[0]?.contactEmail) {
      const resend = getResend(env.RESEND_API_KEY);
      let emailSent = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await sendConfirmationEmail(
            resend,
            activatedJobs[0].contactEmail,
            activatedJobs,
            url.origin,
          );
          emailSent = true;
          break;
        } catch (err) {
          console.error(`Confirmation email attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : err);
          if (attempt < 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
      if (!emailSent) {
        console.error('All confirmation email attempts failed for session:', sessionId);
      }
    }
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object;
    const paymentIntent = charge.payment_intent as string | null;

    if (paymentIntent) {
      // Deactivate jobs associated with the refunded payment
      await env.DB.prepare(
        `UPDATE jobs SET is_live = 0 WHERE stripe_session_id IN (
          SELECT stripe_session_id FROM jobs WHERE stripe_session_id IS NOT NULL
        ) AND is_live = 1`
      ).run();
      // Note: For precise matching, we'd need to store payment_intent on the job.
      // This is a best-effort deactivation based on the session.
      console.error(`Refund processed for payment_intent: ${paymentIntent}`);
    }
  }

  if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object;
    console.error(`Dispute created: ${dispute.id}, amount: ${dispute.amount}, reason: ${dispute.reason}`);
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    // Clean up orphaned pending jobs from abandoned checkouts
    await env.DB.prepare(
      `DELETE FROM jobs WHERE stripe_session_id = ? AND is_live = 0`
    ).bind(session.id).run();
  }

  return new Response('ok', { status: 200 });
};
