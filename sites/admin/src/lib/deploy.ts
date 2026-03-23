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
// File-based deploy lock — prevents concurrent deploys for the same site
// ---------------------------------------------------------------------------

function deployLockPath(slug: string): string {
  const root = getMonorepoRoot();
  return path.join(root, 'sites', slug, '.deploy.lock');
}

async function acquireDeployLock(slug: string): Promise<boolean> {
  const lockFile = deployLockPath(slug);
  try {
    // O_EXCL ensures atomic creation — fails if the file already exists
    const handle = await fs.open(lockFile, 'wx');
    await handle.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    await handle.close();
    return true;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      // Lock file exists — check if it is stale (older than 10 minutes)
      try {
        const stat = await fs.stat(lockFile);
        const ageMs = Date.now() - stat.mtimeMs;
        if (ageMs > 10 * 60 * 1000) {
          // Stale lock — remove and retry
          await fs.unlink(lockFile);
          return acquireDeployLock(slug);
        }
      } catch {
        // stat/unlink failed — treat as locked
      }
      return false;
    }
    throw err;
  }
}

async function releaseDeployLock(slug: string): Promise<void> {
  try {
    await fs.unlink(deployLockPath(slug));
  } catch {
    // Ignore — lock file may already be removed
  }
}

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
  const target = deployMetaPath(slug);
  const tmp = `${target}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(meta, null, 2), 'utf-8');
  await fs.rename(tmp, target);
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
        // Only pass required env vars — don't leak other secrets.
        PATH: globalThis.process?.env?.PATH ?? '/usr/local/bin:/usr/bin:/bin',
        HOME: globalThis.process?.env?.HOME ?? '/app',
        NODE_ENV: globalThis.process?.env?.NODE_ENV ?? 'production',
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
  const lockAcquired = await acquireDeployLock(slug);
  if (!lockAcquired) {
    console.error(`[deploy] Deploy already in progress for ${slug}, skipping.`);
    return;
  }

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
    try {
      await writeDeployMetadata(slug, meta);
    } catch (err) {
      console.error(`[deploy] Failed to write initial metadata for ${slug}:`, err instanceof Error ? err.message : err);
      return;
    }

    try {
      const buildResult = await buildSite(slug);

      if (!buildResult.success) {
        meta = { ...meta, status: 'failed', error: buildResult.error ?? 'Build failed', buildLog: buildResult.buildLog ?? buildResult.error ?? null };
        await writeDeployMetadata(slug, meta);
        return;
      }

      // Store build log
      meta = { ...meta, buildLog: buildResult.buildLog ?? 'Build completed successfully' };

      // ------ Step 2: Deploy to Workers ------
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
      } catch (writeErr) {
        console.error(`[deploy] Failed to write deploy-failure metadata for ${slug}:`, writeErr instanceof Error ? writeErr.message : writeErr);
      }
    }
  } finally {
    await releaseDeployLock(slug);
  }
}

/**
 * Redeploy an existing site (rebuild + push new assets).
 * Reads the existing .deploy.json for project details.
 */
export async function redeploySite(slug: string): Promise<void> {
  const lockAcquired = await acquireDeployLock(slug);
  if (!lockAcquired) {
    throw new Error(`Deploy already in progress for "${slug}".`);
  }

  const root = getMonorepoRoot();
  const siteDir = path.join(root, 'sites', slug);

  let meta = await readDeployMetadata(slug);
  if (!meta) {
    await releaseDeployLock(slug);
    throw new Error(
      `No deploy metadata found for "${slug}". Has this site been deployed before?`,
    );
  }

  try {
    // ------ Step 1: Build ------
    try {
      meta = { ...meta, status: 'building', error: null };
      await writeDeployMetadata(slug, meta);
    } catch (err) {
      console.error(`[redeploy] Failed to write building metadata for ${slug}:`, err instanceof Error ? err.message : err);
    }

    try {
      const buildResult = await buildSite(slug);

      if (!buildResult.success) {
        meta = { ...meta, status: 'failed', error: buildResult.error ?? 'Build failed', buildLog: buildResult.buildLog ?? buildResult.error ?? null };
        await writeDeployMetadata(slug, meta);
        return;
      }

      // ------ Step 2: Deploy to Workers ------
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
      } catch (writeErr) {
        console.error(`[redeploy] Failed to write deploy-failure metadata for ${slug}:`, writeErr instanceof Error ? writeErr.message : writeErr);
      }
    }
  } finally {
    await releaseDeployLock(slug);
  }
}
