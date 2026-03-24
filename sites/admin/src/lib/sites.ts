import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { getMonorepoRoot } from './paths';
import { listWorkers, getWorkersSubdomain } from './cloudflare';

export interface SiteInfo {
  slug: string;
  name: string;
  domain: string;
  tier: 'static' | 'cms';
  lastModified: string;
  isTemplate: boolean;
  deployStatus: 'live' | 'building' | 'deploying' | null;
  stagingUrl: string | null;
  workersDevUrl: string | null;
  productionUrl: string | null;
  lastDeployAt: string | null;
}

// ---------------------------------------------------------------------------
// In-memory cache (30s TTL) to avoid hitting Cloudflare API on every refresh
// ---------------------------------------------------------------------------

let _cache: { sites: SiteInfo[]; expiry: number } | null = null;
const CACHE_TTL_MS = 30_000;

export function invalidateSiteCache(): void {
  _cache = null;
}

/**
 * List all sites by merging filesystem scan with Cloudflare Workers API.
 * Filesystem = source of truth for which sites exist + config.
 * Cloudflare = source of truth for deployment status.
 */
export async function listSites(): Promise<SiteInfo[]> {
  if (_cache && Date.now() < _cache.expiry) return _cache.sites;

  const sites = await listSitesUncached();
  _cache = { sites, expiry: Date.now() + CACHE_TTL_MS };
  return sites;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

async function listSitesUncached(): Promise<SiteInfo[]> {
  // 1. Filesystem scan — all site directories (including undeployed)
  const fsSites = await scanFilesystem();

  // 2. Cloudflare API — deployed Workers with live status
  let cfWorkers: Map<string, { modified_on: string }>;
  let subdomain = '';
  try {
    const [workers, sub] = await Promise.all([
      listWorkers(),
      getWorkersSubdomain(),
    ]);
    cfWorkers = new Map(workers.map((w) => [w.id, w]));
    subdomain = sub;
  } catch {
    // Cloudflare API unavailable — fall back to filesystem-only
    cfWorkers = new Map();
  }

  // 3. Merge: enrich filesystem sites with CF deploy data
  const deployMetas = await Promise.all(
    fsSites.map((fs) => readDeployMeta(fs.slug)),
  );

  const sites: SiteInfo[] = fsSites.map((fs, i) => {
    const worker = cfWorkers.get(fs.slug);
    const deployMeta = deployMetas[i];
    const inProgress =
      deployMeta?.status === 'building' || deployMeta?.status === 'deploying';

    return {
      ...fs,
      deployStatus: inProgress
        ? (deployMeta!.status as 'building' | 'deploying')
        : worker
          ? 'live'
          : null,
      stagingUrl: worker ? `https://${fs.slug}.infront.cy` : null,
      workersDevUrl:
        worker && subdomain
          ? `https://${fs.slug}.${subdomain}.workers.dev`
          : null,
      productionUrl: deployMeta?.productionUrl ?? null,
      lastDeployAt: worker?.modified_on ?? null,
    };
  });

  // Sort: template last, others alphabetically
  sites.sort((a, b) => {
    if (a.isTemplate && !b.isTemplate) return 1;
    if (!a.isTemplate && b.isTemplate) return -1;
    return a.name.localeCompare(b.name);
  });

  return sites;
}

/**
 * Scan the filesystem for site directories.
 */
async function scanFilesystem(): Promise<
  {
    slug: string;
    name: string;
    domain: string;
    tier: 'static' | 'cms';
    lastModified: string;
    isTemplate: boolean;
  }[]
> {
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

  const results = [];

  for (const slug of entries) {
    const siteDir = join(sitesDir, slug);
    const configPath = join(siteDir, 'site.config.ts');
    const isTemplate = slug === 'template';

    const config = await parseSiteConfig(configPath);

    const hasCmsInfra = await directoryExists(join(infraDockerDir, slug));
    const tier: 'static' | 'cms' = hasCmsInfra ? 'cms' : 'static';

    let lastModified: string;
    try {
      const dirStat = await stat(siteDir);
      lastModified = dirStat.mtime.toISOString();
    } catch {
      lastModified = new Date().toISOString();
    }

    let domain = '';
    if (config?.url) {
      try {
        domain = new URL(config.url).hostname;
      } catch {
        domain = config.url;
      }
    }

    results.push({
      slug,
      name: config?.name ?? slug,
      domain,
      tier,
      lastModified,
      isTemplate,
    });
  }

  return results;
}

/**
 * Read .deploy.json for a site (used for in-progress status and custom domains).
 */
async function readDeployMeta(
  slug: string,
): Promise<{ status?: string; productionUrl?: string } | null> {
  try {
    const root = getMonorepoRoot();
    const deployPath = join(root, 'sites', slug, '.deploy.json');
    const content = await readFile(deployPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Extract site config values by reading site.config.ts as text.
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

async function directoryExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}
