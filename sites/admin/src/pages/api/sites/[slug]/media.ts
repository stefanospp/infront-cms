import type { APIRoute } from 'astro';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getMonorepoRoot } from '@/lib/generator';

export const prerender = false;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.ico',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function getMediaDir(slug: string): string {
  return path.join(getMonorepoRoot(), 'sites', slug, 'public', 'images');
}

// ---------------------------------------------------------------------------
// GET — List all images for a site
// ---------------------------------------------------------------------------

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug!;

  if (!SLUG_PATTERN.test(slug)) {
    return json({ error: 'Invalid slug format' }, 400);
  }

  const mediaDir = getMediaDir(slug);

  try {
    await fs.mkdir(mediaDir, { recursive: true });
    const entries = await fs.readdir(mediaDir);

    const images: { name: string; path: string; size: number; modified: string }[] = [];

    for (const entry of entries) {
      const ext = path.extname(entry).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) continue;

      const fullPath = path.join(mediaDir, entry);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isFile()) {
          images.push({
            name: entry,
            path: `/images/${entry}`,
            size: stat.size,
            modified: stat.mtime.toISOString(),
          });
        }
      } catch {
        continue;
      }
    }

    // Sort by most recently modified
    images.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    return json({ images }, 200);
  } catch (err) {
    console.error(`Error listing media for ${slug}:`, err);
    return json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      500,
    );
  }
};

// ---------------------------------------------------------------------------
// POST — Upload an image
// ---------------------------------------------------------------------------

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

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return json({ error: 'Expected multipart/form-data' }, 400);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'Invalid form data' }, 400);
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return json({ error: 'No file provided' }, 400);
  }

  // Validate extension
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return json(
      { error: `Invalid file type: ${ext}. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}` },
      400,
    );
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return json({ error: `File too large. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB` }, 400);
  }

  // Sanitize filename: lowercase, replace spaces with hyphens, strip non-alphanumeric
  const baseName = path.basename(file.name, ext)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const safeName = `${baseName || 'image'}${ext}`;

  const mediaDir = getMediaDir(slug);
  await fs.mkdir(mediaDir, { recursive: true });

  // Avoid overwriting: append timestamp if file exists
  let finalName = safeName;
  const targetPath = path.join(mediaDir, safeName);
  try {
    await fs.access(targetPath);
    // File exists — append timestamp
    finalName = `${baseName}-${Date.now()}${ext}`;
  } catch {
    // File doesn't exist — use original name
  }

  const finalPath = path.join(mediaDir, finalName);

  // Prevent path traversal
  if (!finalPath.startsWith(mediaDir + path.sep) && finalPath !== mediaDir) {
    return json({ error: 'Invalid filename' }, 400);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(finalPath, buffer);

    return json(
      {
        image: {
          name: finalName,
          path: `/images/${finalName}`,
          size: file.size,
        },
      },
      201,
    );
  } catch (err) {
    console.error(`Error uploading media for ${slug}:`, err);
    return json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      500,
    );
  }
};

// ---------------------------------------------------------------------------
// DELETE — Remove an image
// ---------------------------------------------------------------------------

export const DELETE: APIRoute = async ({ params, request }) => {
  const slug = params.slug!;

  if (!SLUG_PATTERN.test(slug)) {
    return json({ error: 'Invalid slug format' }, 400);
  }

  let body: { filename?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.filename || typeof body.filename !== 'string') {
    return json({ error: 'Missing filename' }, 400);
  }

  // Prevent path traversal
  const safeName = path.basename(body.filename);
  const mediaDir = getMediaDir(slug);
  const filePath = path.join(mediaDir, safeName);

  if (!filePath.startsWith(mediaDir + path.sep) && filePath !== mediaDir) {
    return json({ error: 'Invalid filename' }, 400);
  }

  try {
    await fs.unlink(filePath);
    return json({ deleted: safeName }, 200);
  } catch {
    return json({ error: 'File not found' }, 404);
  }
};
