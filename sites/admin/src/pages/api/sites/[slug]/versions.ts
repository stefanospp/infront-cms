import type { APIRoute } from 'astro';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { getMonorepoRoot } from '@/lib/generator';
import {
  getVersionHistory,
  revertToVersion,
  autoCommitSite,
} from '@/lib/versioning';

export const prerender = false;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function validateSite(slug: string): Promise<Response | null> {
  if (!SLUG_PATTERN.test(slug)) {
    return json({ error: 'Invalid slug format' }, 400);
  }

  const siteDir = path.join(getMonorepoRoot(), 'sites', slug);
  try {
    const stat = await fs.stat(siteDir);
    if (!stat.isDirectory()) return json({ error: 'Site not found' }, 404);
  } catch {
    return json({ error: 'Site not found' }, 404);
  }

  return null;
}

// ---------------------------------------------------------------------------
// GET — Version history
// ---------------------------------------------------------------------------

export const GET: APIRoute = async ({ params, url }) => {
  const slug = params.slug!;
  const validationError = await validateSite(slug);
  if (validationError) return validationError;

  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  try {
    const versions = await getVersionHistory(slug, safeLimit);
    return json({ versions, count: versions.length }, 200);
  } catch (err) {
    console.error(`Error getting version history for ${slug}:`, err);
    return json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      500,
    );
  }
};

// ---------------------------------------------------------------------------
// POST — Create a version (manual save point) or revert
// ---------------------------------------------------------------------------

const postSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('save'),
    message: z.string().optional(),
  }),
  z.object({
    action: z.literal('revert'),
    commitHash: z.string().regex(/^[a-f0-9]{7,40}$/, 'Invalid commit hash'),
  }),
]);

export const POST: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;
  const validationError = await validateSite(slug);
  if (validationError) return validationError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const data = parsed.data;

  try {
    if (data.action === 'save') {
      const hash = await autoCommitSite(slug, data.message);
      if (!hash) {
        return json({ message: 'No changes to save' }, 200);
      }
      return json({ hash, message: 'Version saved' }, 201);
    }

    if (data.action === 'revert') {
      const hash = await revertToVersion(slug, data.commitHash);
      if (!hash) {
        return json({ message: 'Revert completed (no changes detected)' }, 200);
      }
      return json({ hash, message: 'Reverted successfully' }, 200);
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : 500;
    console.error(`Version operation failed for ${slug}:`, err);
    return json({ error: message }, status);
  }
};
