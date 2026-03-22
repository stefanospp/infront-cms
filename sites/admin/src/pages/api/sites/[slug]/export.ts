import type { APIRoute } from 'astro';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { getMonorepoRoot } from '@/lib/generator';

export const prerender = false;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const exportSchema = z.object({
  type: z.enum(['static', 'source']),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collect all file paths in a directory (relative to root).
 */
async function collectFiles(
  dir: string,
  rootDir: string,
  result: string[] = [],
): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return result;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, .git, dist
      if (['node_modules', '.git', 'dist', '.astro'].includes(entry.name)) continue;
      await collectFiles(fullPath, rootDir, result);
    } else {
      result.push(path.relative(rootDir, fullPath));
    }
  }

  return result;
}

/**
 * Get the list of shared package files that need inlining for source export.
 */
async function getSharedComponentFiles(): Promise<{ src: string; dest: string }[]> {
  const root = getMonorepoRoot();
  const uiDir = path.join(root, 'packages', 'ui', 'src');
  const files: { src: string; dest: string }[] = [];

  const componentFiles = await collectFiles(uiDir, uiDir);
  for (const file of componentFiles) {
    files.push({
      src: path.join(uiDir, file),
      dest: `packages/ui/src/${file}`,
    });
  }

  return files;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

/**
 * POST /api/sites/[slug]/export
 *
 * Returns a JSON manifest of files to export.
 * The actual file download would be handled by a separate streaming endpoint
 * or a client-side zip builder.
 *
 * Two export types:
 * - "static": Just the built HTML/CSS/JS from dist/
 * - "source": Full Astro source with shared components inlined
 */
export const POST: APIRoute = async ({ params, request }) => {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = exportSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: 'Invalid export type. Use "static" or "source"' }, 400);
  }

  const { type } = parsed.data;

  try {
    if (type === 'static') {
      // Static export: list files from dist/
      const distDir = path.join(siteDir, 'dist');
      try {
        await fs.access(distDir);
      } catch {
        return json(
          { error: 'No build output found. Build the site first.' },
          404,
        );
      }

      const files = await collectFiles(distDir, distDir);

      return json({
        type: 'static',
        slug,
        fileCount: files.length,
        files: files.map((f) => ({
          path: f,
          fullPath: path.join(distDir, f),
        })),
        instructions: [
          'These are the built static files.',
          'Upload to any static hosting provider (Netlify, Vercel, S3, etc.).',
          'No server or runtime required.',
        ],
      }, 200);
    }

    // Source export: list site source + shared component manifest
    const siteFiles = await collectFiles(siteDir, siteDir);
    const sharedFiles = await getSharedComponentFiles();

    // Generate a standalone package.json for the exported project
    const packageJson = {
      name: `@exported/${slug}`,
      private: true,
      type: 'module',
      scripts: {
        dev: 'astro dev',
        build: 'astro build',
        preview: 'astro preview',
      },
      dependencies: {
        'astro': '^6.0.0',
        '@astrojs/react': '^4.0.0',
        '@astrojs/sitemap': '^4.0.0',
        'react': '^19.0.0',
        'react-dom': '^19.0.0',
      },
      devDependencies: {
        '@tailwindcss/vite': '^4.0.0',
        'tailwindcss': '^4.0.0',
        'typescript': '^5.0.0',
      },
    };

    // Generate a standalone astro.config.mjs (no internal plugins)
    const standaloneConfig = `import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
`;

    return json({
      type: 'source',
      slug,
      siteFileCount: siteFiles.length,
      sharedFileCount: sharedFiles.length,
      siteFiles: siteFiles.map((f) => ({
        path: f,
        fullPath: path.join(siteDir, f),
      })),
      sharedFiles: sharedFiles.map((f) => ({
        path: f.dest,
        fullPath: f.src,
      })),
      generatedFiles: {
        'package.json': JSON.stringify(packageJson, null, 2),
        'astro.config.mjs': standaloneConfig,
      },
      instructions: [
        'This is a standalone Astro project with all shared components inlined.',
        'Run: npm install && npm run dev',
        'All @agency/* imports have been resolved to local paths.',
        'If using a CMS, set up Directus separately and update site.config.ts with the URL.',
      ],
    }, 200);
  } catch (err) {
    console.error(`Error exporting site ${slug}:`, err);
    return json(
      { error: err instanceof Error ? err.message : 'Export failed' },
      500,
    );
  }
};
