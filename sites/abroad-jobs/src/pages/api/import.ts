import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { importJobs } from '../../lib/import-jobs';

export const prerender = false;

/**
 * Triggers job import from external APIs (Arbeitnow + Remotive).
 * Protected by a secret key passed as Bearer token.
 * Can be called by a Cloudflare cron trigger or manually.
 *
 * Usage: POST /api/import with Authorization: Bearer <IMPORT_SECRET>
 */
export const POST: APIRoute = async ({ request }) => {
  // Verify secret to prevent unauthorized triggers
  const authHeader = request.headers.get('Authorization');
  const expected = (env as Record<string, unknown>).IMPORT_SECRET as string | undefined;

  // If IMPORT_SECRET is set, require it. If not set, allow (for initial testing).
  if (expected && authHeader !== `Bearer ${expected}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await importJobs(env.DB);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
