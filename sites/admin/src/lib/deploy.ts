import { env } from '@/lib/env';
// ---------------------------------------------------------------------------
// Deploy orchestrator — manages the full build-and-deploy pipeline
// ---------------------------------------------------------------------------

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getMonorepoRoot } from './generator';
import { buildSite } from './build';
import { createDnsRecord, addWorkerCustomDomain } from './cloudflare';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeployMetadata {
  projectName: string;
  stagingUrl: string;
  productionUrl: string | null;
  workersDevUrl: string;
  lastDeployId: string | null;
  lastDeployAt: string | null;
  status: 'pending' | 'building' | 'deploying' | 'live' | 'failed';
  error: string | null;
  dnsRecordId: string | null;
  buildLog: string | null;
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
 * Deploy a site to Cloudflare Workers via wrangler.
 * Reads wrangler.toml from the site directory.
 */
async function wranglerDeploy(siteDir: string): Promise<void> {
  await execFileAsync(
    'npx',
    ['wrangler', 'deploy'],
    {
      cwd: siteDir,
      timeout: 120_000,
      env: {
        ...globalThis.process?.env,
        CLOUDFLARE_API_TOKEN: env('CLOUDFLARE_API_TOKEN') ?? '',
        CLOUDFLARE_ACCOUNT_ID: env('CLOUDFLARE_ACCOUNT_ID') ?? '',
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
  const root = getMonorepoRoot();
  const siteDir = path.join(root, 'sites', slug);

  // Initial metadata skeleton
  let meta: DeployMetadata = {
    projectName: slug,
    stagingUrl: '',
    productionUrl: null,
    workersDevUrl: '',
    lastDeployId: null,
    lastDeployAt: null,
    status: 'building',
    error: null,
    dnsRecordId: null,
    buildLog: null,
  };

  // ------ Step 1: Build ------
  try {
    await writeDeployMetadata(slug, meta);
  } catch {
    return;
  }

  const buildResult = await buildSite(slug);

  if (!buildResult.success) {
    meta = { ...meta, status: 'failed', error: buildResult.error ?? 'Build failed', buildLog: buildResult.buildLog ?? buildResult.error ?? null };
    try {
      await writeDeployMetadata(slug, meta);
    } catch {
      // best-effort
    }
    return;
  }

  // Store build log
  meta = { ...meta, buildLog: buildResult.buildLog ?? 'Build completed successfully' };

  // ------ Step 2: Deploy to Workers ------
  try {
    meta = { ...meta, status: 'deploying' };
    await writeDeployMetadata(slug, meta);

    // Deploy to Workers (creates worker automatically from wrangler.toml)
    await wranglerDeploy(siteDir);

    const workersDevUrl = `${slug}.workers.dev`;
    meta = { ...meta, workersDevUrl };

    // Create a CNAME DNS record pointing to the Workers subdomain
    const stagingDomain = `${slug}.infront.cy`;
    const dnsRecordId = await createDnsRecord(slug, workersDevUrl);
    meta = { ...meta, dnsRecordId };

    // Add Workers Custom Domain for SSL on the staging domain
    await addWorkerCustomDomain(slug, stagingDomain);

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
  const root = getMonorepoRoot();
  const siteDir = path.join(root, 'sites', slug);

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
    meta = { ...meta, status: 'failed', error: buildResult.error ?? 'Build failed', buildLog: buildResult.buildLog ?? buildResult.error ?? null };
    try {
      await writeDeployMetadata(slug, meta);
    } catch {
      // best-effort
    }
    return;
  }

  // ------ Step 2: Deploy to Workers ------
  try {
    meta = { ...meta, status: 'deploying', buildLog: buildResult.buildLog ?? 'Build completed successfully' };
    await writeDeployMetadata(slug, meta);

    // Upload new assets — wrangler deploy updates the existing Worker
    await wranglerDeploy(siteDir);

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
