import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { jobs } from '../../lib/schema';
import { getStripe, createCheckoutParams } from '../../lib/stripe';
import { checkoutSchema } from '../../lib/validation';
import { uniqueSlug } from '../../lib/slugify';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Honeypot check
  if (parsed.data.honeypot) {
    return new Response(JSON.stringify({ error: 'Spam detected' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { contactEmail, jobs: jobInputs } = parsed.data;
  const db = getDb(env.DB);
  const stripe = getStripe(env.STRIPE_SECRET_KEY);
  const now = Math.floor(Date.now() / 1000);

  // Create Stripe session first to get the ID
  const siteUrl = url.origin;
  const sessionParams = createCheckoutParams(jobInputs.length, '', siteUrl);

  // Add customer email
  sessionParams.customer_email = contactEmail;

  const session = await stripe.checkout.sessions.create(sessionParams);

  // Insert pending jobs with the session ID
  for (const input of jobInputs) {
    const slug = uniqueSlug(input.title, input.country);

    await db.insert(jobs).values({
      slug,
      companyName: input.companyName,
      companyWebsite: input.companyWebsite || null,
      companyLogo: input.companyLogo || null,
      contactEmail,
      title: input.title,
      description: input.description,
      country: input.country,
      industry: input.industry,
      salaryRange: input.salaryRange || null,
      visaSupport: input.visaSupport,
      relocationPkg: input.relocationPkg,
      workingLanguage: input.workingLanguage || null,
      applyUrl: input.applyUrl,
      isLive: 0,
      stripeSessionId: session.id,
      createdAt: now,
    });
  }

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
