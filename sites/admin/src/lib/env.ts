// Runtime environment variable access.
// Reads from /app/runtime-env.json which is written by the Docker entrypoint.
// For local dev, falls back to reading .env file.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let _cached: Record<string, string> | null = null;

function loadEnv(): Record<string, string> {
  if (_cached) return _cached;

  // Docker: read from runtime JSON
  try {
    _cached = JSON.parse(readFileSync('/app/runtime-env.json', 'utf-8'));
    return _cached!;
  } catch {
    // Not in Docker
  }

  // Local dev: read .env
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
      value = value.replace(/^['"]|['"]$/g, '').replace(/\\\$/g, '$');
      _cached![key] = value;
    }
  } catch {
    // No .env file
  }

  return _cached;
}

export function env(key: string): string | undefined {
  // Check runtime-env.json first, then fall back to process.env
  return loadEnv()[key] ?? process.env[key];
}
