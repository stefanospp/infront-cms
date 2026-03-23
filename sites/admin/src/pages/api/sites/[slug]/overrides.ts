import type { APIRoute } from 'astro';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getMonorepoRoot } from '@/lib/generator';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!;
  const root = getMonorepoRoot();
  const componentsDir = path.join(root, 'sites', slug, 'src', 'components');

  try {
    const entries = await fs.readdir(componentsDir);
    const files = entries.filter(
      (f) => f.endsWith('.astro') || f.endsWith('.tsx') || f.endsWith('.ts'),
    );

    return new Response(JSON.stringify({ files }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(`Failed to read component overrides for ${slug}:`, err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ files: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
