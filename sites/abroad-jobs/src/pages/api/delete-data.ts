import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { z } from 'zod';

export const prerender = false;

const deleteSchema = z.object({
  email: z.string().email(),
});

/**
 * GDPR Article 17 — Right to Erasure.
 * Deletes all job data associated with the given email address.
 *
 * POST /api/delete-data { email: "user@example.com" }
 */
export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Valid email required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { email } = parsed.data;

  // Delete all jobs associated with this email
  const result = await env.DB.prepare(
    `DELETE FROM jobs WHERE contact_email = ?`
  ).bind(email).run();

  return new Response(JSON.stringify({
    ok: true,
    deleted: result.meta.changes ?? 0,
    message: result.meta.changes
      ? `Deleted ${result.meta.changes} record(s) associated with ${email}`
      : `No records found for ${email}`,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
