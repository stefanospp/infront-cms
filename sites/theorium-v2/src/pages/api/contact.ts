import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const ALLOWED_ORIGINS = [
  'https://theorium.eu',
  'http://localhost:4321',
  'http://localhost:4327',
  'http://localhost:4328',
];

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  contact: z.string().min(1).max(200),
  school: z.string().max(100).optional(),
  message: z.string().min(1).max(2000),
  website: z.string().max(0).optional(), // honeypot — must be empty
});

export const POST: APIRoute = async ({ request }) => {
  // CSRF: validate Origin header
  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    // Honeypot: if website field has a value, silently succeed (bot)
    if (data.website) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: Wire up to Payload CMS submissions collection
    // TODO: Wire up Resend for email notification
    console.log('Contact form submission:', {
      name: data.name,
      contact: data.contact,
      school: data.school,
      message: data.message.substring(0, 50) + '...',
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Return sanitized field errors only — no internal schema details
      const fields = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return new Response(JSON.stringify({ error: 'Invalid form data', fields }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
