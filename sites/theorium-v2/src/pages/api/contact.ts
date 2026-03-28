import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const ALLOWED_ORIGINS = [
  'https://theorium.eu',
  'http://localhost:4321',
  'http://localhost:4327',
  'http://localhost:4328',
  'http://localhost:4350',
];

const PAYLOAD_URL = import.meta.env.PAYLOAD_URL || 'https://admin.theorium.eu';
const RESEND_API_KEY = (globalThis as any).process?.env?.RESEND_API_KEY
  || (typeof import.meta.env !== 'undefined' ? import.meta.env.RESEND_API_KEY : '');

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  contact: z.string().min(1).max(200),
  school: z.string().max(100).optional(),
  message: z.string().min(1).max(2000),
  website: z.string().max(0).optional(),
});

export const POST: APIRoute = async ({ request }) => {
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

    if (data.website) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store in Payload CMS
    try {
      await fetch(`${PAYLOAD_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          contact: data.contact,
          school: data.school || '',
          message: data.message,
          status: 'new',
          metadata: {
            ip: request.headers.get('cf-connecting-ip') || '',
            userAgent: request.headers.get('user-agent') || '',
            spam: false,
          },
        }),
      });
    } catch {
      // CMS storage failed — continue to email
    }

    // Send notification email to Theodora
    if (RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Theorium <noreply@infront.cy>',
            to: 'theodora@theorium.cy',
            subject: `New enquiry from ${data.name}`,
            html: `
              <div style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #171717; padding: 24px 32px;">
                  <div style="display: inline-block; width: 32px; height: 32px; background: #fff33b; text-align: center; line-height: 32px; font-weight: 900; color: #171717; font-size: 14px; margin-right: 12px; vertical-align: middle;">Th</div>
                  <span style="color: #fff; font-weight: 900; font-size: 18px; vertical-align: middle;">THEORIUM</span>
                </div>
                <div style="padding: 32px; background: #fafafa; border: 1px solid #e5e7eb;">
                  <h2 style="font-weight: 900; font-size: 20px; text-transform: uppercase; letter-spacing: 0.02em; margin: 0 0 24px;">New Enquiry</h2>
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600; width: 100px;">Name</td><td style="padding: 8px 0; font-weight: 700;">${data.name}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Contact</td><td style="padding: 8px 0; font-weight: 700;">${data.contact}</td></tr>
                    ${data.school ? `<tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">School</td><td style="padding: 8px 0; font-weight: 700;">${data.school}</td></tr>` : ''}
                  </table>
                  <div style="margin-top: 20px; padding: 16px; background: #fff; border: 1px solid #e5e7eb;">
                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 8px;">Message</div>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #374151;">${data.message.replace(/\n/g, '<br>')}</p>
                  </div>
                </div>
                <div style="padding: 16px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
                  Sent from theorium.eu contact form
                </div>
              </div>
            `,
            reply_to: data.contact.includes('@') ? data.contact : undefined,
          }),
        });
      } catch {
        // Email failed — submission still stored in CMS
      }
    }

    // Send branded confirmation to the submitter (if email provided)
    if (RESEND_API_KEY && data.contact.includes('@')) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Theorium <noreply@infront.cy>',
            to: data.contact,
            subject: 'Thanks for reaching out — Theorium',
            html: `
              <div style="font-family: Inter, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #171717; padding: 24px 32px;">
                  <div style="display: inline-block; width: 32px; height: 32px; background: #fff33b; text-align: center; line-height: 32px; font-weight: 900; color: #171717; font-size: 14px; margin-right: 12px; vertical-align: middle;">Th</div>
                  <span style="color: #fff; font-weight: 900; font-size: 18px; vertical-align: middle;">THEORIUM</span>
                </div>
                <div style="padding: 32px; background: #fafafa; border: 1px solid #e5e7eb;">
                  <h2 style="font-weight: 900; font-size: 20px; margin: 0 0 16px;">Hi ${data.name},</h2>
                  <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 16px;">
                    Thank you for getting in touch. I've received your message and will get back to you within 2 hours.
                  </p>
                  <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 16px;">
                    In the meantime, you can also reach me directly on <a href="https://wa.me/35799000000" style="color: #171717; font-weight: 700;">WhatsApp</a> for a faster response.
                  </p>
                  <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0;">
                    Best regards,<br>
                    <strong>Theodora</strong><br>
                    <span style="color: #6b7280;">Theorium — Private Science Tutoring</span>
                  </p>
                </div>
                <div style="padding: 16px 32px; text-align: center;">
                  <a href="https://theorium.eu" style="font-size: 11px; color: #9ca3af; text-decoration: none;">theorium.eu</a>
                  <span style="color: #d1d5db; margin: 0 8px;">·</span>
                  <a href="https://theorium.eu/courses" style="font-size: 11px; color: #9ca3af; text-decoration: none;">View Courses</a>
                  <span style="color: #d1d5db; margin: 0 8px;">·</span>
                  <a href="https://theorium.eu/resources" style="font-size: 11px; color: #9ca3af; text-decoration: none;">Free Resources</a>
                </div>
              </div>
            `,
          }),
        });
      } catch {
        // Confirmation email failed — not critical
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
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
