import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
  website: z.string().max(0).optional(), // honeypot
});

export const POST: APIRoute = async ({ request }) => {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid form data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
    website: formData.get('website') ?? '',
  });

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Honeypot check
  if (parsed.data.website) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { name, email, message } = parsed.data;

  // Send email via Resend if API key is configured
  const resendApiKey = typeof process !== 'undefined' ? process.env.RESEND_API_KEY : undefined;

  if (resendApiKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);

      const siteEmail = typeof process !== 'undefined' ? process.env.CONTACT_EMAIL : undefined;

      await resend.emails.send({
        from: 'Contact Form <noreply@infront.cy>',
        to: siteEmail || 'hello@infront.cy',
        replyTo: email,
        subject: `Contact form: ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      });
    } catch (err) {
      console.error('Failed to send contact email:', err instanceof Error ? err.message : err);
      return new Response(JSON.stringify({ error: 'Failed to send message. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    // Log to console if no email service configured (dev/fallback)
    console.log(`Contact form submission: ${name} <${email}>: ${message.slice(0, 100)}...`);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
