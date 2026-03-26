export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { name, email, message, project, budget } = body;

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: Send email via Resend or store in Payload CMS
    console.log('Contact form submission:', { name, email, message, project, budget });

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
