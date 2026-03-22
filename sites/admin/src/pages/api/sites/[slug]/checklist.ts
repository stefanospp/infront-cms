import type { APIRoute } from 'astro';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getMonorepoRoot } from '@/lib/generator';

export const prerender = false;

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  category: 'setup' | 'content' | 'deploy';
}

/**
 * Build a checklist by inspecting the actual site state.
 */
async function buildChecklist(slug: string): Promise<ChecklistItem[]> {
  const root = getMonorepoRoot();
  const siteDir = path.join(root, 'sites', slug);
  const items: ChecklistItem[] = [];

  // --- Setup items ---

  // 1. site.config.ts exists and has been customized
  const configPath = path.join(siteDir, 'site.config.ts');
  let configExists = false;
  try {
    await fs.access(configPath);
    configExists = true;
  } catch {
    // no config
  }
  items.push({
    id: 'config',
    label: 'Customize site.config.ts (name, contact, SEO)',
    completed: configExists,
    category: 'setup',
  });

  // 2. Theme tokens customized (global.css)
  const cssPath = path.join(siteDir, 'src', 'styles', 'global.css');
  let cssExists = false;
  try {
    await fs.access(cssPath);
    cssExists = true;
  } catch {
    // no css
  }
  items.push({
    id: 'theme',
    label: 'Customize brand colors and fonts in global.css',
    completed: cssExists,
    category: 'setup',
  });

  // 3. Favicon replaced
  const faviconPath = path.join(siteDir, 'public', 'favicon.svg');
  let faviconCustomized = false;
  try {
    const stat = await fs.stat(faviconPath);
    // If favicon is larger than the default template one (basic SVG), it's been customized
    faviconCustomized = stat.size > 500;
  } catch {
    // no favicon
  }
  items.push({
    id: 'favicon',
    label: 'Replace favicon in public/',
    completed: faviconCustomized,
    category: 'setup',
  });

  // --- Content items ---

  // 4. Has custom pages beyond the template defaults
  const pagesDir = path.join(siteDir, 'src', 'pages');
  let pageCount = 0;
  try {
    const entries = await fs.readdir(pagesDir);
    pageCount = entries.filter((e) => e.endsWith('.astro') && !e.startsWith('_') && !e.startsWith('[...')).length;
  } catch {
    // no pages dir
  }
  items.push({
    id: 'pages',
    label: 'Customize page content and component variants',
    completed: pageCount > 1,
    category: 'content',
  });

  // 5. Has images uploaded
  const imagesDir = path.join(siteDir, 'public', 'images');
  let hasImages = false;
  try {
    const entries = await fs.readdir(imagesDir);
    hasImages = entries.length > 0;
  } catch {
    // no images dir
  }
  items.push({
    id: 'images',
    label: 'Upload brand images (logo, hero, OG image)',
    completed: hasImages,
    category: 'content',
  });

  // 6. OG image set
  let hasOgImage = false;
  try {
    const ogPath = path.join(siteDir, 'public', 'og-default.jpg');
    const stat = await fs.stat(ogPath);
    hasOgImage = stat.size > 1000;
  } catch {
    // Check for other common OG image names
    try {
      const pngPath = path.join(siteDir, 'public', 'og-default.png');
      await fs.access(pngPath);
      hasOgImage = true;
    } catch {
      // no OG image
    }
  }
  items.push({
    id: 'og-image',
    label: 'Add Open Graph image for social sharing',
    completed: hasOgImage,
    category: 'content',
  });

  // --- Deploy items ---

  // 7. Has .deploy.json (has been deployed)
  const deployPath = path.join(siteDir, '.deploy.json');
  let hasDeployed = false;
  try {
    const content = await fs.readFile(deployPath, 'utf-8');
    const deploy = JSON.parse(content);
    hasDeployed = deploy.status === 'deployed' || deploy.status === 'live';
  } catch {
    // not deployed
  }
  items.push({
    id: 'deploy',
    label: 'Deploy site to staging',
    completed: hasDeployed,
    category: 'deploy',
  });

  // 8. Custom domain configured
  let hasCustomDomain = false;
  try {
    const content = await fs.readFile(deployPath, 'utf-8');
    const deploy = JSON.parse(content);
    hasCustomDomain = !!deploy.productionUrl && !deploy.productionUrl.includes('.infront.cy');
  } catch {
    // no deploy data
  }
  items.push({
    id: 'domain',
    label: 'Configure custom production domain',
    completed: hasCustomDomain,
    category: 'deploy',
  });

  // 9. Security headers
  const headersPath = path.join(siteDir, 'public', '_headers');
  let hasHeaders = false;
  try {
    await fs.access(headersPath);
    hasHeaders = true;
  } catch {
    // no headers
  }
  items.push({
    id: 'headers',
    label: 'Review security headers in public/_headers',
    completed: hasHeaders,
    category: 'deploy',
  });

  return items;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const GET: APIRoute = async ({ params }) => {
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
    const items = await buildChecklist(slug);
    const completed = items.filter((i) => i.completed).length;
    return json({ items, completed, total: items.length }, 200);
  } catch (err) {
    console.error(`Error building checklist for ${slug}:`, err);
    return json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      500,
    );
  }
};
