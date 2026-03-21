// Runtime environment variable access.
// Vite/Astro replaces process.env.X at build time with undefined.
// This reads from a runtime config file instead, written by the Docker entrypoint.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let _cached: Record<string, string> | null = null;

function loadEnv(): Record<string, string> {
  if (_cached) return _cached;

  // Try reading from /app/runtime-env.json (written by Docker entrypoint)
  try {
    const data = readFileSync('/app/runtime-env.json', 'utf-8');
    _cached = JSON.parse(data);
    return _cached!;
  } catch {
    // Fallback: not in Docker, env vars might work directly
  }

  // Fallback for local dev: read from .env manually
  _cached = {};
  try {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const envPath = join(currentDir, '..', '..', '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex);
      let value = trimmed.slice(eqIndex + 1);
      // Remove quotes and unescape
      if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1);
      }
      value = value.replace(/\\\$/g, '$');
      _cached![key] = value;
    }
  } catch {
    // No .env file
  }

  return _cached;
}

export function env(key: string): string | undefined {
  return loadEnv()[key];
}
