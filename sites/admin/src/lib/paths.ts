/**
 * Resolve the monorepo root directory.
 * Uses MONOREPO_ROOT env var if set, otherwise falls back to /app (Docker).
 */
export function getMonorepoRoot(): string {
  return process.env.MONOREPO_ROOT || '/app';
}
