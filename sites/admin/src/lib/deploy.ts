// ---------------------------------------------------------------------------
// Deploy orchestrator — manages the full build-and-deploy pipeline
// ---------------------------------------------------------------------------

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getMonorepoRoot } from './generator';
import { buildSite } from './build';
import { createPagesProject, addCustomDomain, createDnsRecord } from './cloudflare';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeployMetadata {
  projectName: string;
  stagingUrl: string;
  productionUrl: string | null;
  pagesDevUrl: string;
  lastDeployId: string | null;
  lastDeployAt: string | null;
  status: 'pending' | 'building' | 'deploying' | 'live' | 'failed';
  error: string | null;
  dnsRecordId: string | null;
}

// ---------------------------------------------------------------------------
// Metadata helpers
// ---------------------------------------------------------------------------

function deployMetaPath(slug: string): string {
  const root = getMonorepoRoot();
  return path.join(root, 'sites', slug, '.deploy.json');
}

/**
 * Read the deploy metadata for a site. Returns null if the file doesn't exist.
 */
export async function readDeployMetadata(
  slug: string,
): Promise<DeployMetadata | null> {
  try {
    const raw = await fs.readFile(deployMetaPath(slug), 'utf-8');
    return JSON.parse(raw) as DeployMetadata;
  } catch {
    return null;
  }
}

/**
 * Write (overwrite) the deploy metadata for a site.
 */
export async function writeDeployMetadata(
  slug: string,
  meta: DeployMetadata,
): Promise<void> {
  await fs.writeFile(deployMetaPath(slug), JSON.stringify(meta, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Wrangler deploy helper
// ---------------------------------------------------------------------------

/**
 * Resolve the correct dist directory for Cloudflare Pages.
 * Astro with the cloudflare adapter puts client assets in dist/client.
 */
async function resolveDistDir(baseDist: string): Promise<string> {
  const clientDir = path.join(baseDist, 'client');
  try {
    const stat = await fs.stat(clientDir);
    if (stat.isDirectory()) {
      return clientDir;
    }
  } catch {
    // dist/client doesn't exist — fall back to dist
  }
  return baseDist;
}

/**
 * Deploy built assets to Cloudflare Pages via wrangler.
 */
async function wranglerDeploy(
  distDir: string,
  projectName: string,
): Promise<void> {
  const root = getMonorepoRoot();
  const deployDir = await resolveDistDir(distDir);

  await execFileAsync(
    'npx',
    ['wrangler', 'pages', 'deploy', deployDir, '--project-name', projectName],
    {
      cwd: root,
      timeout: 120_000,
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      },
    },
  );
}

// ---------------------------------------------------------------------------
// Deploy pipelines
// ---------------------------------------------------------------------------

/**
 * Full deploy pipeline for a brand-new site.
 * This is designed to be fire-and-forget — it updates .deploy.json at each
 * step so the admin UI can poll for status.
 */
export async function deployNewSite(slug: string): Promise<void> {
  // Initial metadata skeleton
  let meta: DeployMetadata = {
    projectName: slug,
    stagingUrl: '',
    productionUrl: null,
    pagesDevUrl: '',
    lastDeployId: null,
    lastDeployAt: null,
    status: 'building',
    error: null,
    dnsRecordId: null,
  };

  // ------ Step 1: Build ------
  try {
    await writeDeployMetadata(slug, meta);
  } catch {
    // If we can't even write metadata, there's nothing useful we can do
    return;
  }

  const buildResult = await buildSite(slug);

  if (!buildResult.success) {
    meta = { ...meta, status: 'failed', error: buildResult.error ?? 'Build failed' };
    try {
      await writeDeployMetadata(slug, meta);
    } catch {
      // best-effort
    }
    return;
  }

  // ------ Step 2: Deploy ------
  try {
    meta = { ...meta, status: 'deploying' };
    await writeDeployMetadata(slug, meta);

    // Create Pages project (returns actual subdomain from CF, e.g. "slug-abc.pages.dev")
    const { projectName, pagesDevUrl } = await createPagesProject(slug);
    meta = { ...meta, projectName, pagesDevUrl };

    // Upload assets via wrangler
    await wranglerDeploy(buildResult.distDir, projectName);

    // Create a non-proxied CNAME record pointing to the Pages subdomain.
    // Must NOT be proxied (orange cloud) to avoid "CNAME Cross-User Banned".
    const stagingDomain = `${slug}.infront.cy`;
    const dnsRecordId = await createDnsRecord(slug, pagesDevUrl);
    meta = { ...meta, dnsRecordId };

    // Register the subdomain as a custom domain on the Pages project for SSL.
    await addCustomDomain(projectName, stagingDomain);

    // All done
    meta = {
      ...meta,
      stagingUrl: stagingDomain,
      lastDeployAt: new Date().toISOString(),
      status: 'live',
      error: null,
    };
    await writeDeployMetadata(slug, meta);
  } catch (err) {
    meta = {
      ...meta,
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    };
    try {
      await writeDeployMetadata(slug, meta);
    } catch {
      // best-effort
    }
  }
}

/**
 * Redeploy an existing site (rebuild + push new assets).
 * Reads the existing .deploy.json for project details.
 */
export async function redeploySite(slug: string): Promise<void> {
  let meta = await readDeployMetadata(slug);
  if (!meta) {
    throw new Error(
      `No deploy metadata found for "${slug}". Has this site been deployed before?`,
    );
  }

  // ------ Step 1: Build ------
  try {
    meta = { ...meta, status: 'building', error: null };
    await writeDeployMetadata(slug, meta);
  } catch {
    // best-effort
  }

  const buildResult = await buildSite(slug);

  if (!buildResult.success) {
    meta = { ...meta, status: 'failed', error: buildResult.error ?? 'Build failed' };
    try {
      await writeDeployMetadata(slug, meta);
    } catch {
      // best-effort
    }
    return;
  }

  // ------ Step 2: Deploy ------
  try {
    meta = { ...meta, status: 'deploying' };
    await writeDeployMetadata(slug, meta);

    // Upload new assets — project already exists
    await wranglerDeploy(buildResult.distDir, meta.projectName);

    // Update metadata
    meta = {
      ...meta,
      lastDeployAt: new Date().toISOString(),
      status: 'live',
      error: null,
    };
    await writeDeployMetadata(slug, meta);
  } catch (err) {
    meta = {
      ...meta,
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    };
    try {
      await writeDeployMetadata(slug, meta);
    } catch {
      // best-effort
    }
  }
}
