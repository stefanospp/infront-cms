import type { APIRoute } from 'astro';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getMonorepoRoot } from '@/lib/generator';
import { listPageSchemas } from '@/lib/page-schemas';

export const prerender = false;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!;

  if (!SLUG_PATTERN.test(slug)) {
    return json({ error: 'Invalid slug format' }, 400);
  }

  // Check that the site directory exists
  const siteDir = path.join(getMonorepoRoot(), 'sites', slug);
  try {
    const stat = await fs.stat(siteDir);
    if (!stat.isDirectory()) {
      return json({ error: 'Site not found' }, 404);
    }
  } catch {
    return json({ error: 'Site not found' }, 404);
  }

  try {
    const pages = await listPageSchemas(slug);
    return json({ pages }, 200);
  } catch (err) {
    console.error(`Error listing page schemas for ${slug}:`, err);
    return json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      500,
    );
  }
};
