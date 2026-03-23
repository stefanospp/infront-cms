import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { jobs } from '../../lib/schema';
import { getStripe, createCheckoutParams } from '../../lib/stripe';
import { checkoutSchema } from '../../lib/validation';
import { uniqueSlug } from '../../lib/slugify';
import { env } from 'cloudflare:workers';

export const prerender = false;

// Simple in-memory rate limiter: IP -> timestamp of requests within the window
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

const ALLOWED_ORIGIN = 'https://abroadjobs.eu';

export const POST: APIRoute = async ({ request, url }) => {
  const origin = request.headers.get('origin');
  const corsHeaders: Record<string, string> = {};
  if (origin === ALLOWED_ORIGIN || origin === url.origin) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }

  const clientIp = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Reject oversized payloads (>1MB)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1_048_576) {
    return new Response(JSON.stringify({ error: 'Request body too large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Honeypot check
  if (parsed.data.honeypot) {
    return new Response(JSON.stringify({ error: 'Spam detected' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { contactEmail, jobs: jobInputs } = parsed.data;
  const db = getDb(env.DB);
  const stripe = getStripe(env.STRIPE_SECRET_KEY);
  const now = Math.floor(Date.now() / 1000);
  const siteUrl = url.origin;

  // Generate a temporary session placeholder for batch insert
  const pendingId = `pending_${crypto.randomUUID()}`;

  // Insert all pending jobs first using D1 batch for atomicity
  const insertStatements = jobInputs.map((input) => {
    const slug = uniqueSlug(input.title, input.country);
    return env.DB.prepare(
      `INSERT INTO jobs (slug, company_name, company_website, company_logo, contact_email, title, description, country, industry, salary_range, visa_support, relocation_pkg, working_language, apply_url, is_live, stripe_session_id, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'paid', ?)`
    ).bind(
      slug,
      input.companyName,
      input.companyWebsite || null,
      input.companyLogo || null,
      contactEmail,
      input.title,
      input.description,
      input.country,
      input.industry,
      input.salaryRange || null,
      input.visaSupport,
      input.relocationPkg,
      input.workingLanguage || null,
      input.applyUrl,
      pendingId,
      now,
    );
  });

  await env.DB.batch(insertStatements);

  // Create Stripe session after jobs are safely in the database
  const sessionParams = createCheckoutParams(jobInputs.length, pendingId, siteUrl);
  sessionParams.customer_email = contactEmail;
  const session = await stripe.checkout.sessions.create(sessionParams);

  // Update jobs with the real Stripe session ID
  await env.DB.prepare(
    `UPDATE jobs SET stripe_session_id = ? WHERE stripe_session_id = ?`
  ).bind(session.id, pendingId).run();

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
};
