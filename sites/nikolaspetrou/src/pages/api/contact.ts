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

  // Get env vars
  const sonicjsUrl = getEnv('SONICJS_URL');
  const resendApiKey = getEnv('RESEND_API_KEY');

  // Extract metadata
  const ipAddress = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  const userAgent = request.headers.get('user-agent') || '';

  // Store submission in SonicJs CMS
  if (sonicjsUrl) {
    try {
      // Get auth token for API write access
      const loginRes = await fetch(`${sonicjsUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: getEnv('SONICJS_ADMIN_EMAIL') || 'hello@infront.cy',
          password: getEnv('SONICJS_ADMIN_PASSWORD') || 'np-admin-2026!',
        }),
      });

      if (loginRes.ok) {
        const { token } = (await loginRes.json()) as { token: string };

        // Get submissions collection ID (or create if needed)
        const colRes = await fetch(`${sonicjsUrl}/api/collections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cols = (await colRes.json()) as { data: Array<{ id: string; name: string }> };
        const submissionsCol = cols.data.find(c => c.name === 'submissions');

        if (submissionsCol) {
          // Store submission
          await fetch(`${sonicjsUrl}/api/content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              title: `${name} — ${new Date().toISOString().slice(0, 10)}`,
              slug: `submission-${Date.now()}`,
              collectionId: submissionsCol.id,
              status: 'published',
              data: {
                name, email,
                phone: phone || null,
                message,
                is_spam: isSpam,
                read: false,
                ip_address: ipAddress,
                user_agent: userAgent,
              },
            }),
          });
        }
      }
    } catch (err) {
      console.error('Failed to store submission in SonicJs:', err);
    }
  }

  // If spam, don't send email but return success
  if (isSpam) {
    return json({ ok: true }, 200);
  }

  // Send notification email via Resend
  if (resendApiKey) {
    try {
      // Fetch notification emails from CMS site_settings
      let recipients = ['hello@nikolaspetrou.com'];

      if (sonicjsUrl) {
        const settingsRes = await fetch(`${sonicjsUrl}/api/collections/site_settings/content?limit=1`);
        if (settingsRes.ok) {
          const settingsData = (await settingsRes.json()) as { data: Array<{ data: { notification_emails?: string | string[] } }> };
          const item = settingsData.data[0];
          if (item) {
            let emails = item.data.notification_emails;
            if (typeof emails === 'string') {
              try { emails = JSON.parse(emails); } catch { /* keep as-is */ }
            }
            if (Array.isArray(emails) && emails.length > 0) {
              recipients = emails;
            }
          }
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
