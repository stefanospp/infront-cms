import type { APIRoute } from 'astro';
import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { devServerManager } from '@/lib/dev-server';
import { getMonorepoRoot } from '@/lib/generator';

export const prerender = false;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

const actionSchema = z.object({
  action: z.enum(['start', 'stop']),
});

/**
 * Validate slug format (kebab-case, no path traversal).
 */
function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !slug.includes('..');
}

/**
 * Check that the site directory exists on disk.
 */
function siteExists(slug: string): boolean {
  const siteDir = path.join(getMonorepoRoot(), 'sites', slug);
  return fs.existsSync(siteDir);
}

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

// GET /api/sites/[slug]/dev-server — get current dev server status
export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!;

  if (!isValidSlug(slug)) {
    return new Response(
      JSON.stringify({ error: 'Invalid site slug' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!siteExists(slug)) {
    return new Response(
      JSON.stringify({ error: `Site "${slug}" not found` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const info = devServerManager.getStatus(slug);

  return new Response(
    JSON.stringify({
      running: info !== null && (info.status === 'running' || info.status === 'starting'),
      server: serializeInfo(info),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};

// POST /api/sites/[slug]/dev-server — start or stop the dev server
export const POST: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;

  if (!isValidSlug(slug)) {
    return new Response(
      JSON.stringify({ error: 'Invalid site slug' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!siteExists(slug)) {
    return new Response(
      JSON.stringify({ error: `Site "${slug}" not found` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

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

  if (action === 'start') {
    try {
      const info = await devServerManager.start(slug);
      return new Response(
        JSON.stringify({
          message: `Dev server for "${slug}" is ${info.status}`,
          server: serializeInfo(info),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      console.error(`[dev-server] Failed to start server for "${slug}":`, err);
      return new Response(
        JSON.stringify({
          error: err instanceof Error ? err.message : 'Failed to start dev server',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  // action === 'stop'
  try {
    await devServerManager.stop(slug);
    return new Response(
      JSON.stringify({ message: `Dev server for "${slug}" stopped` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error(`[dev-server] Failed to stop server for "${slug}":`, err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Failed to stop dev server',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
