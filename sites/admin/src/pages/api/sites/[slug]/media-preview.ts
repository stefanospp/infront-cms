import type { APIRoute } from 'astro';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getMonorepoRoot } from '@/lib/generator';

export const prerender = false;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/**
 * GET /api/sites/[slug]/media-preview?file=filename.jpg
 * Serves image files from a site's public/images/ directory.
 * Used by the MediaLibrary component for image thumbnails.
 */
export const GET: APIRoute = async ({ params, url }) => {
  const slug = params.slug!;
  const fileName = url.searchParams.get('file');

  if (!SLUG_PATTERN.test(slug)) {
    return new Response('Invalid slug', { status: 400 });
  }

  if (!fileName) {
    return new Response('Missing file parameter', { status: 400 });
  }

  // Prevent path traversal
  const safeName = path.basename(fileName);
  if (safeName !== fileName || fileName.includes('..')) {
    return new Response('Invalid file name', { status: 400 });
  }

  const ext = path.extname(safeName).toLowerCase();
  const mimeType = MIME_TYPES[ext];
  if (!mimeType) {
    return new Response('Unsupported file type', { status: 400 });
  }

  const filePath = path.join(getMonorepoRoot(), 'sites', slug, 'public', 'images', safeName);

  try {
    const data = await fs.readFile(filePath);
    return new Response(data, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch {
    return new Response('Image not found', { status: 404 });
  }
};
