// ---------------------------------------------------------------------------
// Dev Server Manager — manages Astro dev servers for individual sites
// ---------------------------------------------------------------------------

import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getMonorepoRoot } from './generator';

/**
 * Get the app root where node_modules and package.json live.
 * In Docker: /app (the built image). Locally: same as monorepo root.
 */
function getAppRoot(): string {
  return process.env.APP_ROOT || getMonorepoRoot();
}

/**
 * In Docker, site files live at /data/sites/{slug} (bind mount) but the
 * dev server needs them at /app/sites/{slug} (where node_modules are).
 * Create a symlink if needed so the workspace resolver finds the site.
 */
function ensureSiteSymlink(slug: string): void {
  const dataRoot = getMonorepoRoot();
  const appRoot = getAppRoot();
  if (dataRoot === appRoot) return; // Local dev — no symlink needed

  const source = path.join(dataRoot, 'sites', slug);
  const target = path.join(appRoot, 'sites', slug);

  // If target already exists and is the real directory (baked into image), remove it
  // and replace with a symlink to the bind-mounted source
  try {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) {
      // Already a symlink — check it points to the right place
      const existing = fs.readlinkSync(target);
      if (existing === source) return;
      fs.unlinkSync(target);
    } else if (stat.isDirectory()) {
      // Real directory from Docker image — replace with symlink
      fs.rmSync(target, { recursive: true });
    }
  } catch {
    // Target doesn't exist — that's fine
  }

  fs.symlinkSync(source, target, 'dir');
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DevServerInfo {
  slug: string;
  port: number;
  pid: number;
  startedAt: Date;
  lastAccessed: Date;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  error?: string;
}

interface InternalServerEntry {
  info: DevServerInfo;
  process: ChildProcess;
  stdout: string;
  stderr: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_PORT = 4400;
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const READY_TIMEOUT_MS = 60_000; // 60 seconds to wait for server to be ready
const CLEANUP_INTERVAL_MS = 60_000; // check every minute

// ---------------------------------------------------------------------------
// DevServerManager
// ---------------------------------------------------------------------------

export class DevServerManager {
  private servers: Map<string, InternalServerEntry> = new Map();
  private usedPorts: Set<number> = new Set();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanupTimer();
    this.registerProcessHandlers();
  }

  /**
   * Start a dev server for a site. Returns the server info.
   * If a server is already running for the site, returns the existing one.
   */
  async start(slug: string): Promise<DevServerInfo> {
    // Return existing server if already running or starting
    const existing = this.servers.get(slug);
    if (existing && (existing.info.status === 'running' || existing.info.status === 'starting')) {
      existing.info.lastAccessed = new Date();
      return { ...existing.info };
    }

    // Clean up any stopped/errored entry
    if (existing) {
      this.servers.delete(slug);
      this.usedPorts.delete(existing.info.port);
    }

    // Validate site directory exists (check bind-mounted data root)
    const dataRoot = getMonorepoRoot();
    const siteDir = path.join(dataRoot, 'sites', slug);
    if (!fs.existsSync(siteDir)) {
      throw new Error(`Site directory not found: sites/${slug}`);
    }

    // In Docker: symlink /data/sites/{slug} -> /app/sites/{slug}
    // so the workspace resolver finds the site under the app root
    ensureSiteSymlink(slug);

    const appRoot = getAppRoot();

    // Allocate a port
    const port = this.allocatePort();

    const now = new Date();
    const info: DevServerInfo = {
      slug,
      port,
      pid: 0,
      startedAt: now,
      lastAccessed: now,
      status: 'starting',
    };

    // Build a sanitized environment — only pass safe variables, not admin secrets
    const SAFE_ENV_KEYS = ['PATH', 'HOME', 'SHELL', 'LANG', 'TERM', 'USER', 'TMPDIR'];
    const sanitizedEnv: Record<string, string> = {
      NODE_ENV: 'development',
    };
    for (const key of SAFE_ENV_KEYS) {
      if (process.env[key]) {
        sanitizedEnv[key] = process.env[key]!;
      }
    }
    // Pass through site-specific env vars (prefixed with the site slug)
    const envPrefix = slug.toUpperCase().replace(/-/g, '_') + '_';
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(envPrefix) && value !== undefined) {
        sanitizedEnv[key] = value;
      }
    }

    // Spawn the dev server process from app root (where node_modules live)
    const child = spawn(
      'npm',
      ['run', 'dev', `--workspace=sites/${slug}`, '--', '--port', String(port)],
      {
        cwd: appRoot,
        env: sanitizedEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      },
    );

    if (!child.pid) {
      this.usedPorts.delete(port);
      throw new Error(`Failed to spawn dev server process for ${slug}`);
    }

    info.pid = child.pid;

    const entry: InternalServerEntry = {
      info,
      process: child,
      stdout: '',
      stderr: '',
    };

    this.servers.set(slug, entry);

    // Set up output capture
    child.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      entry.stdout += text;
      // Keep log buffer bounded (last 10KB)
      if (entry.stdout.length > 10240) {
        entry.stdout = entry.stdout.slice(-10240);
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      entry.stderr += text;
      if (entry.stderr.length > 10240) {
        entry.stderr = entry.stderr.slice(-10240);
      }
    });

    // Handle process exit
    child.on('exit', (code, signal) => {
      const current = this.servers.get(slug);
      if (current && current.process === child) {
        if (current.info.status !== 'stopping') {
          // Unexpected exit
          current.info.status = 'error';
          current.info.error = `Process exited with code ${code}, signal ${signal}`;
        } else {
          current.info.status = 'stopped';
        }
        this.usedPorts.delete(current.info.port);
      }
    });

    child.on('error', (err) => {
      const current = this.servers.get(slug);
      if (current && current.process === child) {
        current.info.status = 'error';
        current.info.error = err.message;
        this.usedPorts.delete(current.info.port);
      }
    });

    // Wait for the server to become ready
    await this.waitForReady(slug);

    return { ...entry.info };
  }

  /**
   * Stop a dev server for a site.
   */
  async stop(slug: string): Promise<void> {
    const entry = this.servers.get(slug);
    if (!entry) {
      return;
    }

    if (entry.info.status === 'stopped' || entry.info.status === 'stopping') {
      return;
    }

    entry.info.status = 'stopping';

    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        // Force kill if graceful shutdown takes too long
        try {
          entry.process.kill('SIGKILL');
        } catch {
          // Process may already be dead
        }
        entry.info.status = 'stopped';
        this.usedPorts.delete(entry.info.port);
        this.servers.delete(slug);
        resolve();
      }, 10_000);

      entry.process.once('exit', () => {
        clearTimeout(timeout);
        entry.info.status = 'stopped';
        this.usedPorts.delete(entry.info.port);
        this.servers.delete(slug);
        resolve();
      });

      // Send SIGTERM for graceful shutdown
      try {
        entry.process.kill('SIGTERM');
      } catch {
        clearTimeout(timeout);
        entry.info.status = 'stopped';
        this.usedPorts.delete(entry.info.port);
        this.servers.delete(slug);
        resolve();
      }
    });
  }

  /**
   * Get status of a dev server.
   */
  getStatus(slug: string): DevServerInfo | null {
    const entry = this.servers.get(slug);
    if (!entry) {
      return null;
    }
    entry.info.lastAccessed = new Date();
    return { ...entry.info };
  }

  /**
   * Get all dev servers.
   */
  getAll(): DevServerInfo[] {
    return Array.from(this.servers.values()).map((entry) => {
      return { ...entry.info };
    });
  }

  /**
   * Stop all running dev servers.
   */
  async stopAll(): Promise<void> {
    const slugs = Array.from(this.servers.keys());
    await Promise.all(slugs.map((slug) => this.stop(slug)));
  }

  /**
   * Shut down the manager (stop cleanup timer and all servers).
   */
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    await this.stopAll();
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private allocatePort(): number {
    const MAX_PORT = 4500;
    let port = BASE_PORT;
    while (this.usedPorts.has(port)) {
      port++;
      if (port > MAX_PORT) {
        throw new Error(`No available ports in range ${BASE_PORT}-${MAX_PORT}`);
      }
    }
    this.usedPorts.add(port);
    return port;
  }

  /**
   * Wait for the dev server to report it is ready by watching stdout for
   * the Astro "Local" URL output line.
   */
  private waitForReady(slug: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const entry = this.servers.get(slug);
      if (!entry) {
        reject(new Error(`No server entry for ${slug}`));
        return;
      }

      const timeout = setTimeout(() => {
        cleanup();
        // If the server is still starting after timeout, mark as running anyway
        // (the server may be slow but functional)
        if (entry.info.status === 'starting') {
          entry.info.status = 'running';
        }
        resolve();
      }, READY_TIMEOUT_MS);

      const onData = (data: Buffer) => {
        const text = data.toString();
        // Astro dev server prints a line like "Local    http://localhost:4400/"
        if (text.includes('Local') && text.includes('http')) {
          cleanup();
          entry.info.status = 'running';
          resolve();
        }
      };

      const onExit = (code: number | null) => {
        cleanup();
        entry.info.status = 'error';
        entry.info.error = `Process exited during startup with code ${code}. ${entry.stderr}`;
        reject(new Error(entry.info.error));
      };

      const onError = (err: Error) => {
        cleanup();
        entry.info.status = 'error';
        entry.info.error = err.message;
        reject(err);
      };

      const cleanup = () => {
        clearTimeout(timeout);
        entry.process.stdout?.off('data', onData);
        entry.process.off('exit', onExit);
        entry.process.off('error', onError);
      };

      entry.process.stdout?.on('data', onData);
      entry.process.once('exit', onExit);
      entry.process.once('error', onError);
    });
  }

  /**
   * Periodically check for inactive servers and shut them down.
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [slug, entry] of this.servers) {
        if (
          entry.info.status === 'running' &&
          now - entry.info.lastAccessed.getTime() > INACTIVITY_TIMEOUT_MS
        ) {
          console.log(`[dev-server] Auto-stopping inactive server for "${slug}"`);
          this.stop(slug).catch((err) => {
            console.error(`[dev-server] Error stopping inactive server "${slug}":`, err);
          });
        }

        // Clean up stopped/errored entries that are older than 5 minutes
        if (
          (entry.info.status === 'stopped' || entry.info.status === 'error') &&
          now - entry.info.lastAccessed.getTime() > 5 * 60 * 1000
        ) {
          this.servers.delete(slug);
          this.usedPorts.delete(entry.info.port);
        }
      }
    }, CLEANUP_INTERVAL_MS);

    // Don't let the cleanup timer keep the process alive
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Register handlers to clean up on process exit.
   */
  private registerProcessHandlers(): void {
    const cleanup = () => {
      // Synchronous kill — can't await in signal handlers
      for (const [, entry] of this.servers) {
        try {
          entry.process.kill('SIGTERM');
        } catch {
          // Process may already be dead
        }
      }
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('beforeExit', cleanup);
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const devServerManager = new DevServerManager();
