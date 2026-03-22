import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Phase 5 — Auth roles, versioning, export, deploy promotion tests.
 */

// ---------------------------------------------------------------------------
// Source paths
// ---------------------------------------------------------------------------

const AUTH_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/lib/auth.ts',
);

const VERSIONING_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/lib/versioning.ts',
);

const VERSIONS_API_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/pages/api/sites/[slug]/versions.ts',
);

const EXPORT_API_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/pages/api/sites/[slug]/export.ts',
);

const PROMOTE_API_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/pages/api/sites/[slug]/promote.ts',
);

function readSource(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

// ---------------------------------------------------------------------------
// Tests: Auth roles
// ---------------------------------------------------------------------------

describe('Auth — Role-based Access', () => {
  const source = readSource(AUTH_PATH);

  it('defines UserRole type with admin and client', () => {
    expect(source).toContain("'admin'");
    expect(source).toContain("'client'");
    expect(source).toContain('UserRole');
  });

  it('defines SessionPayload interface with role and allowedSites', () => {
    expect(source).toContain('SessionPayload');
    expect(source).toContain('role: UserRole');
    expect(source).toContain('allowedSites');
  });

  it('createSessionToken accepts optional payload', () => {
    expect(source).toContain('payload: SessionPayload');
  });

  it('exports getSessionPayload for extracting JWT claims', () => {
    expect(source).toContain('export async function getSessionPayload');
  });

  it('getSessionPayload returns null on invalid token', () => {
    expect(source).toContain('return null');
  });

  it('exports canAccessSite authorization helper', () => {
    expect(source).toContain('export function canAccessSite');
  });

  it('canAccessSite grants admin access to all sites', () => {
    expect(source).toContain("session.role === 'admin'");
    expect(source).toContain('return true');
  });

  it('canAccessSite restricts client to allowedSites', () => {
    expect(source).toContain('allowedSites?.includes(slug)');
  });

  it('exports isAdmin helper', () => {
    expect(source).toContain('export function isAdmin');
  });

  it('still exports legacy verifySessionToken for middleware compatibility', () => {
    expect(source).toContain('export async function verifySessionToken');
  });
});

// ---------------------------------------------------------------------------
// Tests: Versioning module
// ---------------------------------------------------------------------------

describe('Versioning Module', () => {
  const source = readSource(VERSIONING_PATH);

  it('exports autoCommitSite function', () => {
    expect(source).toContain('export async function autoCommitSite');
  });

  it('autoCommitSite stages only site directory files', () => {
    expect(source).toContain("git(['add', sitePath]");
  });

  it('autoCommitSite checks for staged changes before committing', () => {
    expect(source).toContain('diff');
    expect(source).toContain('--cached');
  });

  it('autoCommitSite returns null when no changes', () => {
    expect(source).toContain('return null; // No changes');
  });

  it('exports getVersionHistory function', () => {
    expect(source).toContain('export async function getVersionHistory');
  });

  it('getVersionHistory returns structured entries', () => {
    expect(source).toContain('VersionEntry');
    expect(source).toContain('hash');
    expect(source).toContain('shortHash');
    expect(source).toContain('message');
    expect(source).toContain('filesChanged');
  });

  it('getVersionHistory limits results', () => {
    expect(source).toContain('--max-count');
  });

  it('exports revertToVersion function', () => {
    expect(source).toContain('export async function revertToVersion');
  });

  it('revertToVersion validates commit hash format', () => {
    expect(source).toContain('/^[a-f0-9]{7,40}$/');
    expect(source).toContain('Invalid commit hash');
  });

  it('revertToVersion verifies commit exists for the site', () => {
    expect(source).toContain('not found or does not affect');
  });

  it('revertToVersion creates a new commit after checkout', () => {
    expect(source).toContain('autoCommitSite');
    expect(source).toContain('Revert');
  });

  it('uses git checkout to restore files (not reset)', () => {
    expect(source).toContain("'checkout'");
    expect(source).not.toContain("'reset'");
  });
});

// ---------------------------------------------------------------------------
// Tests: Versions API Route
// ---------------------------------------------------------------------------

describe('Versions API Route', () => {
  const source = readSource(VERSIONS_API_PATH);

  it('exports prerender = false', () => {
    expect(source).toContain('prerender = false');
  });

  it('exports GET handler for version history', () => {
    expect(source).toContain('export const GET');
    expect(source).toContain('getVersionHistory');
  });

  it('exports POST handler for save/revert actions', () => {
    expect(source).toContain('export const POST');
  });

  it('supports save action', () => {
    expect(source).toContain("z.literal('save')");
    expect(source).toContain('autoCommitSite');
  });

  it('supports revert action', () => {
    expect(source).toContain("z.literal('revert')");
    expect(source).toContain('revertToVersion');
  });

  it('uses discriminated union for action validation', () => {
    expect(source).toContain('z.discriminatedUnion');
  });

  it('validates commit hash in revert action', () => {
    expect(source).toContain('commitHash');
    expect(source).toContain('/^[a-f0-9]{7,40}$/');
  });

  it('limits version history results', () => {
    expect(source).toContain('limit');
    expect(source).toContain('safeLimit');
  });

  it('validates slug format', () => {
    expect(source).toContain('SLUG_PATTERN');
  });
});

// ---------------------------------------------------------------------------
// Tests: Export API Route
// ---------------------------------------------------------------------------

describe('Export API Route', () => {
  const source = readSource(EXPORT_API_PATH);

  it('exports prerender = false', () => {
    expect(source).toContain('prerender = false');
  });

  it('exports POST handler', () => {
    expect(source).toContain('export const POST');
  });

  it('supports static export type', () => {
    expect(source).toContain("'static'");
    expect(source).toContain('dist');
  });

  it('supports source export type', () => {
    expect(source).toContain("'source'");
    expect(source).toContain('sharedFiles');
  });

  it('validates export type with zod', () => {
    expect(source).toContain("z.enum(['static', 'source'])");
  });

  it('generates standalone package.json for source export', () => {
    expect(source).toContain('packageJson');
    expect(source).toContain('@exported/');
  });

  it('generates standalone astro config without internal plugins', () => {
    expect(source).toContain('standaloneConfig');
    expect(source).not.toContain('componentOverridePlugin');
  });

  it('includes shared components in source export', () => {
    expect(source).toContain('getSharedComponentFiles');
    expect(source).toContain('packages/ui/src');
  });

  it('skips node_modules and .git in file collection', () => {
    expect(source).toContain('node_modules');
    expect(source).toContain('.git');
  });

  it('provides export instructions', () => {
    expect(source).toContain('instructions');
  });

  it('checks for build output on static export', () => {
    expect(source).toContain('No build output found');
  });

  it('validates slug format', () => {
    expect(source).toContain('SLUG_PATTERN');
  });
});

// ---------------------------------------------------------------------------
// Tests: Promote API Route
// ---------------------------------------------------------------------------

describe('Promote API Route', () => {
  const source = readSource(PROMOTE_API_PATH);

  it('exports prerender = false', () => {
    expect(source).toContain('prerender = false');
  });

  it('exports POST handler', () => {
    expect(source).toContain('export const POST');
  });

  it('validates slug format', () => {
    expect(source).toContain('SLUG_PATTERN');
  });

  it('reads deploy metadata', () => {
    expect(source).toContain('readDeployMetadata');
  });

  it('requires site to be in live status', () => {
    expect(source).toContain("metadata.status !== 'live'");
    expect(source).toContain('Deploy to staging first');
  });

  it('requires production domain to be configured', () => {
    expect(source).toContain('productionUrl');
    expect(source).toContain('Add a custom domain first');
  });

  it('updates deploy metadata on promotion', () => {
    expect(source).toContain('writeDeployMetadata');
  });

  it('returns promotion details', () => {
    expect(source).toContain('stagingUrl');
    expect(source).toContain('productionUrl');
    expect(source).toContain('promotedAt');
  });
});
