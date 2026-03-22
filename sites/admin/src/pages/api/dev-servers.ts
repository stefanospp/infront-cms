import type { APIRoute } from 'astro';
import { z } from 'zod';
import { devServerManager } from '@/lib/dev-server';

export const prerender = false;

const actionSchema = z.object({
  action: z.enum(['stop-all']),
});

/**
 * Serialize dates to ISO strings for JSON responses.
 */
function serializeInfo(info: ReturnType<typeof devServerManager.getStatus>) {
  if (!info) return null;
  return {
    ...info,
    startedAt: info.startedAt.toISOString(),
    lastAccessed: info.lastAccessed.toISOString(),
  };
}

// GET /api/dev-servers — list all running dev servers
export const GET: APIRoute = async () => {
  const servers = devServerManager.getAll();

  return new Response(
    JSON.stringify({
      count: servers.length,
      servers: servers.map((s) => serializeInfo(s)),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};

// POST /api/dev-servers — admin actions (stop-all)
export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { action } = parsed.data;

  if (action === 'stop-all') {
    try {
      await devServerManager.stopAll();
      return new Response(
        JSON.stringify({ message: 'All dev servers stopped' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      console.error('[dev-server] Failed to stop all servers:', err);
      return new Response(
        JSON.stringify({
          error: err instanceof Error ? err.message : 'Failed to stop all dev servers',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  // Unreachable due to zod validation, but TypeScript needs this
  return new Response(
    JSON.stringify({ error: 'Unknown action' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } },
  );
};
