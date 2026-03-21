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

  try {
    // Step 1: Install dependencies so the new workspace is registered
    await execFileAsync('npm', ['install'], {
      cwd: root,
      timeout: 60_000,
    });

    // Step 2: Build the site workspace
    await execFileAsync(
      'npm',
      ['run', 'build', `--workspace=sites/${slug}`],
      {
        cwd: root,
        timeout: 120_000,
      },
    );

    return { distDir, success: true };
  } catch (err) {
    return {
      distDir,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
