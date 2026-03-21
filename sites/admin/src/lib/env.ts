// Access environment variables at runtime, not build time.
// Vite/Astro replaces direct process.env.X references with undefined during build.
// This indirection prevents that static replacement.

const _env = globalThis.process?.env ?? {};

export function env(key: string): string | undefined {
  return _env[key];
}
