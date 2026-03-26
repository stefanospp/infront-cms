import type { APIRoute } from 'astro';

export const prerender = false;

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function validate(data: Record<string, string>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const { name, email, message } = data;

  if (!name || name.trim().length < 1) errors.name = 'Name is required';
  if (name && name.length > 200) errors.name = 'Name is too long';

  if (!email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email address';

  if (!message || message.trim().length < 10) errors.message = 'Message must be at least 10 characters';
  if (message && message.length > 5000) errors.message = 'Message is too long';

  return { valid: Object.keys(errors).length === 0, errors };
}

export const POST: APIRoute = async ({ request }) => {
  // Runtime env: process.env for Cloudflare Workers (nodejs_compat), import.meta.env for dev
  const getEnv = (key: string) =>
    (typeof process !== 'undefined' ? process.env[key] : undefined) ||
    (import.meta.env as Record<string, string>)[key] || '';

  // Parse form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'Invalid form data' }, 400);
  }

  const name = (formData.get('name') as string ?? '').trim();
  const email = (formData.get('email') as string ?? '').trim();
  const phone = (formData.get('phone') as string ?? '').trim();
  const message = (formData.get('message') as string ?? '').trim();
  const website = (formData.get('website') as string ?? '').trim();

  // Validate
  const { valid, errors } = validate({ name, email, message });
  if (!valid) {
    return json({ error: 'Validation failed', fields: errors }, 422);
  }

  // Honeypot — if filled, it's spam. Store but don't notify.
  const isSpam = website.length > 0;

  // Get env vars (runtime secrets on Cloudflare Workers)
  const directusUrl = getEnv('DIRECTUS_URL');
  const directusToken = getEnv('DIRECTUS_TOKEN');
  const resendApiKey = getEnv('RESEND_API_KEY');

  // Extract metadata
  const ipAddress = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  const userAgent = request.headers.get('user-agent') || '';

  // Store in Directus
  if (directusUrl && directusToken) {
    try {
      // Rate limit check — same email in last 5 minutes
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const checkRes = await fetch(
        `${directusUrl}/items/submissions?filter[email][_eq]=${encodeURIComponent(email)}&filter[date_created][_gte]=${encodeURIComponent(fiveMinAgo)}&limit=1`,
        { headers: { Authorization: `Bearer ${directusToken}` } }
      );
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.data?.length > 0) {
          return json({ ok: true }, 200);
        }
      }

      // Store submission
      await fetch(`${directusUrl}/items/submissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${directusToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          message,
          is_spam: isSpam,
          read: false,
          ip_address: ipAddress,
          user_agent: userAgent,
        }),
      });
    } catch (err) {
      console.error('Failed to store submission in Directus:', err);
    }
  }

  // If spam, don't send email but return success
  if (isSpam) {
    return json({ ok: true }, 200);
  }

  // Send notification email via Resend
  if (resendApiKey && directusUrl && directusToken) {
    try {
      // Fetch notification emails from site_settings
      const settingsRes = await fetch(`${directusUrl}/items/site_settings?fields=notification_emails`, {
        headers: { Authorization: `Bearer ${directusToken}` },
      });
      let recipients = ['hello@nikolaspetrou.com'];

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const configuredEmails = settingsData.data?.notification_emails;
        if (Array.isArray(configuredEmails) && configuredEmails.length > 0) {
          recipients = configuredEmails;
        }
      }

      // Send via Resend API
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Contact Form <noreply@infront.cy>',
          to: recipients,
          reply_to: email,
          subject: `New enquiry from ${name}`,
          text: [
            'New contact form submission from nikolaspetrou.com',
            '',
            `Name: ${name}`,
            `Email: ${email}`,
            phone ? `Phone: ${phone}` : null,
            '',
            'Message:',
            message,
            '',
            '---',
            'This email was sent automatically from the contact form.',
          ].filter(Boolean).join('\n'),
        }),
      });
    } catch (err) {
      console.error('Failed to send notification email:', err);
    }
  }

  return json({ ok: true }, 200);
};
