import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  contact: z.string().min(1).max(200),
  school: z.string().min(1).max(100),
  message: z.string().min(1).max(2000),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    // TODO: Wire up to Payload CMS submissions collection
    // TODO: Wire up Resend for email notification
    console.log('Contact form submission:', data);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid form data', details: err.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
