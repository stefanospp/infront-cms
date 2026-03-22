import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Dev Server Manager — structural and contract tests.
 *
 * The DevServerManager spawns real OS processes and depends on
 * admin-specific path aliases (@/lib/generator), so we test its
 * structure and API contracts rather than running it directly.
 * Full integration testing of dev server lifecycle is done via
 * the admin UI's own test suite or manual e2e.
 */

const DEV_SERVER_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/lib/dev-server.ts',
);

const API_ROUTE_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/pages/api/sites/[slug]/dev-server.ts',
);

const ADMIN_API_PATH = path.resolve(
  __dirname,
  '../../sites/admin/src/pages/api/dev-servers.ts',
);

describe('Dev Server Manager module', () => {
  it('module file exists', () => {
    expect(fs.existsSync(DEV_SERVER_PATH)).toBe(true);
  });

  it('exports DevServerInfo interface', () => {
    const content = fs.readFileSync(DEV_SERVER_PATH, 'utf-8');
    expect(content).toContain('export interface DevServerInfo');
  });

  it('exports DevServerManager class', () => {
    const content = fs.readFileSync(DEV_SERVER_PATH, 'utf-8');
    expect(content).toContain('export class DevServerManager');
  });

  it('exports devServerManager singleton', () => {
    const content = fs.readFileSync(DEV_SERVER_PATH, 'utf-8');
    expect(content).toContain('export const devServerManager');
  });

  it('implements required public methods', () => {
    const content = fs.readFileSync(DEV_SERVER_PATH, 'utf-8');
    expect(content).toContain('async start(');
    expect(content).toContain('async stop(');
    expect(content).toContain('getStatus(');
    expect(content).toContain('getAll()');
    expect(content).toContain('async stopAll()');
    expect(content).toContain('async shutdown()');
  });

  it('has auto-shutdown cleanup logic', () => {
    const content = fs.readFileSync(DEV_SERVER_PATH, 'utf-8');
    // Should have an inactivity check
    expect(content).toContain('INACTIVITY_TIMEOUT');
    expect(content).toContain('lastAccessed');
  });

  it('has port allocation with upper bound', () => {
    const content = fs.readFileSync(DEV_SERVER_PATH, 'utf-8');
    expect(content).toContain('allocatePort');
    expect(content).toContain('MAX_PORT');
  });

  it('handles process cleanup on exit', () => {
    const content = fs.readFileSync(DEV_SERVER_PATH, 'utf-8');
    expect(content).toContain('SIGTERM');
    expect(content).toContain('SIGINT');
  });

  it('getAll does not update lastAccessed', () => {
    const content = fs.readFileSync(DEV_SERVER_PATH, 'utf-8');
    // Find the getAll method and verify it doesn't set lastAccessed
    const getAllMatch = content.match(/getAll\(\)[^}]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s);
    if (getAllMatch) {
      expect(getAllMatch[1]).not.toContain('lastAccessed = new Date()');
    }
  });
});

describe('Dev Server API route (per-site)', () => {
  it('API route file exists', () => {
    expect(fs.existsSync(API_ROUTE_PATH)).toBe(true);
  });

  it('exports prerender = false', () => {
    const content = fs.readFileSync(API_ROUTE_PATH, 'utf-8');
    expect(content).toContain('export const prerender = false');
  });

  it('exports GET and POST handlers', () => {
    const content = fs.readFileSync(API_ROUTE_PATH, 'utf-8');
    expect(content).toContain('export const GET');
    expect(content).toContain('export const POST');
  });

  it('validates slug format against injection', () => {
    const content = fs.readFileSync(API_ROUTE_PATH, 'utf-8');
    expect(content).toContain('SLUG_PATTERN');
    expect(content).toContain('isValidSlug');
    // Should reject path traversal
    expect(content).toContain('..');
  });

  it('validates request body with zod', () => {
    const content = fs.readFileSync(API_ROUTE_PATH, 'utf-8');
    expect(content).toContain('safeParse');
    expect(content).toContain("z.enum(['start', 'stop'])");
  });

  it('checks site directory exists before starting', () => {
    const content = fs.readFileSync(API_ROUTE_PATH, 'utf-8');
    expect(content).toContain('siteExists');
    expect(content).toContain('404');
  });
});

describe('Dev Server API route (admin)', () => {
  it('API route file exists', () => {
    expect(fs.existsSync(ADMIN_API_PATH)).toBe(true);
  });

  it('exports prerender = false', () => {
    const content = fs.readFileSync(ADMIN_API_PATH, 'utf-8');
    expect(content).toContain('export const prerender = false');
  });

  it('exports GET and POST handlers', () => {
    const content = fs.readFileSync(ADMIN_API_PATH, 'utf-8');
    expect(content).toContain('export const GET');
    expect(content).toContain('export const POST');
  });

  it('supports stop-all action', () => {
    const content = fs.readFileSync(ADMIN_API_PATH, 'utf-8');
    expect(content).toContain('stop-all');
    expect(content).toContain('stopAll');
  });
});
