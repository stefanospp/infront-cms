import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  contact: z.string().min(1).max(200),
  schoolSubject: z.string().max(500).optional().default(''),
  message: z.string().max(5000).optional().default(''),
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
    contact: formData.get('contact'),
    schoolSubject: formData.get('schoolSubject') ?? '',
    message: formData.get('message') ?? '',
    website: formData.get('website') ?? '',
  });

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Honeypot check — bots fill hidden field
  if (parsed.data.website) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { name, contact, schoolSubject, message } = parsed.data;

  const resendApiKey = typeof process !== 'undefined' ? process.env.RESEND_API_KEY : undefined;

  if (resendApiKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);

      const siteEmail = typeof process !== 'undefined' ? process.env.CONTACT_EMAIL : undefined;

      const body = [
        `Name: ${name}`,
        `Contact: ${contact}`,
        schoolSubject ? `School & Subject: ${schoolSubject}` : null,
        message ? `\nMessage:\n${message}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      await resend.emails.send({
        from: 'Theorium <noreply@infront.cy>',
        to: siteEmail || 'theodora@theorium.cy',
        replyTo: contact.includes('@') ? contact : undefined,
        subject: `Theorium enquiry: ${name}${schoolSubject ? ` — ${schoolSubject}` : ''}`,
        text: body,
      });
    } catch (err) {
      console.error('Failed to send contact email:', err instanceof Error ? err.message : err);
      return new Response(JSON.stringify({ error: 'Failed to send message. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    console.log(`Theorium contact: ${name} <${contact}> | ${schoolSubject} | ${message.slice(0, 100)}`);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
