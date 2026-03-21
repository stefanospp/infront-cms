// ---------------------------------------------------------------------------
// Build service — compiles a site workspace using npm
// ---------------------------------------------------------------------------

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { getMonorepoRoot } from './generator';

const execFileAsync = promisify(execFile);

export interface BuildResult {
  distDir: string;
  success: boolean;
  error?: string;
  buildLog?: string;
}

/**
 * Build a site workspace by slug.
 *
 * 1. Runs `npm install` at the monorepo root to register the new workspace.
 * 2. Runs `npm run build --workspace=sites/<slug>` to produce the build output.
 *
 * Uses execFile (not exec) so the slug is passed as an argument, not
 * interpolated into a shell string. The slug is already validated by the
 * create endpoint's zod schema (lowercase letters, numbers, hyphens only).
 */
export async function buildSite(slug: string): Promise<BuildResult> {
  const root = getMonorepoRoot();
  const distDir = path.join(root, 'sites', slug, 'dist');
  const logs: string[] = [];

  try {
    // Step 1: Install dependencies so the new workspace is registered
    logs.push('[install] Starting npm install...');
    const installResult = await execFileAsync('npm', ['install'], {
      cwd: root,
      timeout: 120_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    if (installResult.stderr) {
      logs.push(`[install] ${installResult.stderr.trim()}`);
    }
    logs.push('[install] Done');

    // Step 2: Build the site workspace
    logs.push('[build] Starting astro build...');
    const buildResult = await execFileAsync(
      'npm',
      ['run', 'build', `--workspace=sites/${slug}`],
      {
        cwd: root,
        timeout: 180_000,
        maxBuffer: 10 * 1024 * 1024,
      },
    );
    if (buildResult.stdout) {
      logs.push(`[build] ${buildResult.stdout.trim()}`);
    }
    if (buildResult.stderr) {
      logs.push(`[build:warn] ${buildResult.stderr.trim()}`);
    }
    logs.push('[build] Done');

    return { distDir, success: true, buildLog: logs.join('\n') };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    // execFile errors include stdout/stderr on the error object
    const execErr = err as { stdout?: string; stderr?: string };
    if (execErr.stdout) logs.push(`[stdout] ${execErr.stdout.trim()}`);
    if (execErr.stderr) logs.push(`[stderr] ${execErr.stderr.trim()}`);
    logs.push(`[error] ${errMsg}`);

    return {
      distDir,
      success: false,
      error: errMsg,
      buildLog: logs.join('\n'),
    };
  }
}
