import type { APIRoute } from 'astro';
import { ContactSchema } from '@agency/utils';

export const prerender = false;

const submissions = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = submissions.get(ip);
  if (!record || now > record.resetAt) {
    submissions.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  record.count++;
  return record.count > limit;
}

export const POST: APIRoute = async ({ request }) => {
  const ALLOWED_ORIGIN = import.meta.env.PUBLIC_SITE_URL;
  const origin = request.headers.get('origin');
  if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  if (isRateLimited(ip, 5, 60 * 60 * 1000)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 });
  }

  try {
    const formData = await request.formData();
    const data = ContactSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
      honeypot: formData.get('website') ?? '',
    });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `noreply@${new URL(import.meta.env.PUBLIC_SITE_URL || 'https://example.com').hostname}`,
        to: import.meta.env.CONTACT_EMAIL,
        subject: `Contact form: ${data.name}`,
        text: `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`,
      }),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Failed to send' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return new Response(JSON.stringify({ errors: (error as { flatten: () => unknown }).flatten() }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
