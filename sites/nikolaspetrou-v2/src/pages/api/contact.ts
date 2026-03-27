export const prerender = false;

const PAYLOAD_URL = 'https://cms-nikolaspetrou.stepet.workers.dev';
const NOTIFICATION_EMAIL = 'nikolaspetrouu@hotmail.com';
const FROM_EMAIL = 'Nikolas Petrou <noreply@infront.cy>';

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { name, email, message, project, budget, website } = body;

    // Honeypot check
    if (website) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Name, email, and message are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Store in Payload CMS
    try {
      await fetch(`${PAYLOAD_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          project: project || '',
          message,
          budget: budget || '',
          status: 'new',
          metadata: { ip, userAgent, spam: false },
        }),
      });
    } catch (err) {
      console.error('Failed to store submission in Payload:', err);
      // Don't fail the request — still send the email
    }

    // Send notification email via Resend
    const resendApiKey = (globalThis as any).process?.env?.RESEND_API_KEY
      || (typeof import.meta.env !== 'undefined' ? import.meta.env.RESEND_API_KEY : '');

    if (resendApiKey) {
      try {
        const emailBody = [
          `New contact form submission from nikolaspetrou.com`,
          ``,
          `Name: ${name}`,
          `Email: ${email}`,
          `Project Type: ${project || 'Not specified'}`,
          `Budget: ${budget || 'Not specified'}`,
          ``,
          `Message:`,
          message,
          ``,
          `---`,
          `IP: ${ip}`,
          `User Agent: ${userAgent}`,
          `Submitted: ${new Date().toISOString()}`,
        ].join('\n');

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: NOTIFICATION_EMAIL,
            subject: `New enquiry from ${name}`,
            text: emailBody,
            reply_to: email,
          }),
        });
      } catch (err) {
        console.error('Failed to send email via Resend:', err);
        // Don't fail the request — submission is already stored
      }
    } else {
      console.warn('RESEND_API_KEY not set — email not sent');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
