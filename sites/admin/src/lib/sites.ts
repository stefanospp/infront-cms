import { readdir, readFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface SiteInfo {
  slug: string;
  name: string;
  domain: string;
  tier: 'static' | 'cms';
  lastModified: string;
  isTemplate: boolean;
}

/** Resolve the monorepo root from the current file location. */
function getMonorepoRoot(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  // currentDir = <root>/sites/admin/src/lib → go up 4 levels
  return join(currentDir, '..', '..', '..', '..');
}

/**
 * Try to extract site config values by reading site.config.ts as text
 * and parsing with simple regex (avoids dynamic import issues).
 */
async function parseSiteConfig(
  configPath: string,
): Promise<{ name?: string; url?: string; locale?: string } | null> {
  try {
    const content = await readFile(configPath, 'utf-8');

    const nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);
    const urlMatch = content.match(/url:\s*['"]([^'"]+)['"]/);
    const localeMatch = content.match(/locale:\s*['"]([^'"]+)['"]/);

    return {
      name: nameMatch?.[1],
      url: urlMatch?.[1],
      locale: localeMatch?.[1],
    };
  } catch {
    return null;
  }
}

/** Check if a directory exists. */
async function directoryExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

/**
 * List all sites in the monorepo's sites/ directory.
 * Excludes 'admin' but includes 'template' (marked accordingly).
 */
export async function listSites(): Promise<SiteInfo[]> {
  const root = getMonorepoRoot();
  const sitesDir = join(root, 'sites');
  const infraDockerDir = join(root, 'infra', 'docker');

  let entries: string[];
  try {
    const dirEntries = await readdir(sitesDir, { withFileTypes: true });
    entries = dirEntries
      .filter((e) => e.isDirectory() && e.name !== 'admin')
      .map((e) => e.name);
  } catch {
    return [];
  }

  const sites: SiteInfo[] = [];

  for (const slug of entries) {
    const siteDir = join(sitesDir, slug);
    const configPath = join(siteDir, 'site.config.ts');
    const isTemplate = slug === 'template';

    const config = await parseSiteConfig(configPath);

    // Determine tier: check if infra/docker/{slug} exists
    const hasCmsInfra = await directoryExists(join(infraDockerDir, slug));
    const tier: SiteInfo['tier'] = hasCmsInfra ? 'cms' : 'static';

    // Get last modified time from the site directory
    let lastModified: string;
    try {
      const dirStat = await stat(siteDir);
      lastModified = dirStat.mtime.toISOString();
    } catch {
      lastModified = new Date().toISOString();
    }

    // Extract domain from URL
    let domain = '';
    if (config?.url) {
      try {
        domain = new URL(config.url).hostname;
      } catch {
        domain = config.url;
      }
    }

    sites.push({
      slug,
      name: config?.name ?? slug,
      domain,
      tier,
      lastModified,
      isTemplate,
    });
  }

  // Sort: template last, others alphabetically
  sites.sort((a, b) => {
    if (a.isTemplate && !b.isTemplate) return 1;
    if (!a.isTemplate && b.isTemplate) return -1;
    return a.name.localeCompare(b.name);
  });

  return sites;
}
