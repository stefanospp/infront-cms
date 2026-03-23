import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';
import { getMonorepoRoot } from './generator';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VersionEntry {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  filesChanged: number;
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function getRepoRoot(): string {
  return getMonorepoRoot();
}

function getSitePath(slug: string): string {
  return path.join('sites', slug);
}

/**
 * Run a git command in the monorepo root.
 */
async function git(
  args: string[],
  cwd?: string,
): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync('git', args, {
    cwd: cwd ?? getRepoRoot(),
    maxBuffer: 10 * 1024 * 1024, // 10MB for large diffs
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Auto-commit changes for a site after an editor save.
 * Only commits files within the site's directory.
 * Returns the commit hash, or null if there were no changes.
 */
export async function autoCommitSite(
  slug: string,
  message?: string,
): Promise<string | null> {
  const sitePath = getSitePath(slug);
  const commitMessage =
    message ?? `Auto-save: ${slug} — ${new Date().toISOString()}`;

  try {
    // Stage only files within the site directory
    await git(['add', sitePath]);

    // Check if there are staged changes
    const { stdout: status } = await git([
      'diff',
      '--cached',
      '--name-only',
      '--',
      sitePath,
    ]);

    if (!status.trim()) {
      return null; // No changes to commit
    }

    // Commit
    await git(['commit', '-m', commitMessage, '--', sitePath]);

    // Get the commit hash
    const { stdout: hash } = await git(['rev-parse', 'HEAD']);
    return hash.trim();
  } catch (err) {
    // If git is not available or repo is not initialized, silently skip
    console.warn(`Auto-commit failed for ${slug}:`, err);
    return null;
  }
}

/**
 * Get the version history for a site (git log filtered to site directory).
 */
export async function getVersionHistory(
  slug: string,
  limit = 20,
): Promise<VersionEntry[]> {
  const sitePath = getSitePath(slug);

  try {
    // Custom format: hash|shortHash|message|author|date
    const { stdout } = await git([
      'log',
      `--max-count=${limit}`,
      '--format=%H|%h|%s|%an|%aI',
      '--',
      sitePath,
    ]);

    if (!stdout.trim()) return [];

    const entries: VersionEntry[] = [];

    for (const line of stdout.trim().split('\n')) {
      const parts = line.split('|');
      if (parts.length < 5) continue;

      const [hash, shortHash, message, author, date] = parts;

      // Get number of files changed in this commit for the site
      let filesChanged = 0;
      try {
        const { stdout: diffStat } = await git([
          'diff-tree',
          '--no-commit-id',
          '--name-only',
          '-r',
          hash!,
          '--',
          sitePath,
        ]);
        filesChanged = diffStat.trim().split('\n').filter(Boolean).length;
      } catch (err) {
        console.error(`[versioning] Failed to get diff stats for ${slug}:`, err instanceof Error ? err.message : err);
      }

      entries.push({
        hash: hash!,
        shortHash: shortHash!,
        message: message!,
        author: author!,
        date: date!,
        filesChanged,
      });
    }

    return entries;
  } catch (err) {
    console.error(`[versioning] Failed to get version history for ${slug}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Revert a site to a specific commit version.
 * Checks out the site directory from the target commit and creates a new commit.
 */
export async function revertToVersion(
  slug: string,
  commitHash: string,
): Promise<string | null> {
  const sitePath = getSitePath(slug);

  // Validate commit hash format (prevent injection)
  if (!/^[a-f0-9]{7,40}$/.test(commitHash)) {
    throw new Error('Invalid commit hash format');
  }

  try {
    // Verify the commit exists and touches the site
    const { stdout: verify } = await git([
      'log',
      '--max-count=1',
      '--format=%H',
      commitHash,
      '--',
      sitePath,
    ]);

    if (!verify.trim()) {
      throw new Error(`Commit ${commitHash} not found or does not affect site "${slug}"`);
    }

    // Checkout the site directory from that commit
    await git(['checkout', commitHash, '--', sitePath]);

    // Auto-commit the revert
    const revertMessage = `Revert ${slug} to version ${commitHash.slice(0, 7)}`;
    return autoCommitSite(slug, revertMessage);
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      throw err;
    }
    console.error(`Revert failed for ${slug}:`, err);
    throw new Error('Failed to revert to specified version');
  }
}
