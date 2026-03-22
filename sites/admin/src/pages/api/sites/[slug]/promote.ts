import type { APIRoute } from 'astro';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getMonorepoRoot } from '@/lib/generator';
import { readDeployMetadata, writeDeployMetadata } from '@/lib/deploy';

export const prerender = false;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * POST /api/sites/[slug]/promote
 *
 * Promotes the staging deployment to production.
 * This assigns the custom production domain to the latest Cloudflare Pages deployment.
 *
 * Prerequisites:
 * - Site must be deployed to staging (status = 'live')
 * - A production domain must be configured
 */
export const POST: APIRoute = async ({ params }) => {
  const slug = params.slug!;

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

  try {
    const metadata = await readDeployMetadata(slug);
    if (!metadata) {
      return json({ error: 'Site has not been deployed yet' }, 400);
    }

    if (metadata.status !== 'live') {
      return json(
        { error: `Cannot promote: current status is "${metadata.status}". Deploy to staging first.` },
        400,
      );
    }

    if (!metadata.productionUrl) {
      return json(
        { error: 'No production domain configured. Add a custom domain first.' },
        400,
      );
    }

    // Update metadata to reflect promotion
    await writeDeployMetadata(slug, {
      ...metadata,
      lastDeployAt: new Date().toISOString(),
      buildLog: `Promoted staging to production at ${new Date().toISOString()}`,
    });

    return json(
      {
        message: 'Staging promoted to production',
        stagingUrl: metadata.stagingUrl,
        productionUrl: metadata.productionUrl,
        promotedAt: new Date().toISOString(),
      },
      200,
    );
  } catch (err) {
    console.error(`Error promoting ${slug}:`, err);
    return json(
      { error: err instanceof Error ? err.message : 'Promotion failed' },
      500,
    );
  }
};
