import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { importJobs } from '../../lib/import-jobs';
import { runScheduledMaintenance } from '../../scheduled';

export const prerender = false;

/**
 * Triggers job import from external APIs (Arbeitnow + Remotive)
 * and runs scheduled maintenance (expire jobs, clean orphans).
 *
 * Protected by a secret key passed as Bearer token.
 * Called by Cloudflare cron trigger or manually.
 *
 * Usage: POST /api/import with Authorization: Bearer <IMPORT_SECRET>
 */
export const POST: APIRoute = async ({ request }) => {
  // Verify secret to prevent unauthorized triggers
  const authHeader = request.headers.get('Authorization');
  const expected = (env as Record<string, unknown>).IMPORT_SECRET as string | undefined;

  // Always require IMPORT_SECRET — reject if not configured
  if (!expected) {
    return new Response('Server misconfiguration: IMPORT_SECRET not set', { status: 500 });
  }
  if (authHeader !== `Bearer ${expected}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Run maintenance tasks first (expire jobs, clean orphans)
    const maintenance = await runScheduledMaintenance(env.DB);

    // Then import new jobs
    const importResult = await importJobs(env.DB);

    return new Response(JSON.stringify({ ...importResult, maintenance }), {
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
