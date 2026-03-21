// Runtime environment variable access for Astro SSR.
//
// Vite replaces process.env.SPECIFIC_VAR with undefined at build time.
// But it does NOT replace dynamic property access: process.env[varName].
// This module uses bracket notation to bypass Vite's static analysis.

const ENV_KEYS = [
  'ADMIN_PASSWORD_HASH',
  'SESSION_SECRET',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_ZONE_ID',
] as const;

type EnvKey = (typeof ENV_KEYS)[number];

export function env(key: EnvKey): string | undefined {
  // Bracket notation prevents Vite from statically replacing this
  const k: string = key;
  return process.env[k];
}
