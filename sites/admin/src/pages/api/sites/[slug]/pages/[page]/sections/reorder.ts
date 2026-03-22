import type { APIRoute } from 'astro';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { getMonorepoRoot } from '@/lib/generator';
import { reorderSections } from '@/lib/page-schemas';

export const prerender = false;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const PAGE_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const reorderSchema = z.object({
  sectionIds: z.array(z.string().min(1)).min(1),
});

export const PUT: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;
  const page = params.page!;

  if (!SLUG_PATTERN.test(slug)) {
    return json({ error: 'Invalid slug format' }, 400);
  }

  if (!PAGE_PATTERN.test(page)) {
    return json({ error: 'Invalid page name format' }, 400);
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const { sectionIds } = parsed.data;

  try {
    const schema = await reorderSections(slug, page, sectionIds);
    return json({ schema }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    console.error(`Error reordering sections for ${slug}/${page}:`, err);
    return json({ error: message }, status);
  }
};
