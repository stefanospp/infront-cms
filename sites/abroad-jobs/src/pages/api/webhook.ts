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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const sessionId = session.id;
    const db = getDb(env.DB);
    const now = Math.floor(Date.now() / 1000);
    const thirtyDays = 30 * 24 * 60 * 60;

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
      try {
        const resend = getResend(env.RESEND_API_KEY);
        await sendConfirmationEmail(
          resend,
          activatedJobs[0].contactEmail,
          activatedJobs,
          url.origin,
        );
      } catch {
        // Email failure shouldn't break the webhook
        console.error('Failed to send confirmation email');
      }
    }
  }

  return new Response('ok', { status: 200 });
};
