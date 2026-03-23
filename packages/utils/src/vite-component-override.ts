import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Plugin } from 'vite';

const OVERRIDE_PREFIXES = [
  '@agency/ui/components/',
  '@agency/ui/islands/',
] as const;

const EXTENSIONS = ['.astro', '.tsx', '.ts', '.jsx', ''];

/**
 * Vite plugin that enables per-site component overrides.
 *
 * When a site imports `@agency/ui/components/Hero.astro`, this plugin checks
 * if a local override exists at `<siteRoot>/src/components/Hero.astro`.
 * If found, the local version is used instead of the shared one.
 *
 * This allows bespoke sites to replace any shared component while keeping
 * the same import paths — no page file changes needed.
 */
export function componentOverridePlugin(siteRoot: string): Plugin {
  const componentsDir = path.join(siteRoot, 'src', 'components');

  // Cache existing override files at plugin initialization to avoid
  // repeated fs.existsSync calls on every module resolve.
  let overrideFiles: Set<string>;

  function scanOverrides(): Set<string> {
    const files = new Set<string>();
    try {
      const entries = fs.readdirSync(componentsDir, { recursive: true });
      for (const entry of entries) {
        const entryStr = typeof entry === 'string' ? entry : entry.toString();
        files.add(path.resolve(componentsDir, entryStr));
      }
    } catch {
      // Directory may not exist yet
    }
    return files;
  }

  return {
    name: 'agency-component-override',
    enforce: 'pre',

    buildStart() {
      overrideFiles = scanOverrides();
    },

    configureServer(server) {
      // Re-scan when files change in the components directory during dev
      overrideFiles = scanOverrides();
      server.watcher.on('all', (event, filePath) => {
        if (filePath.startsWith(componentsDir + path.sep) && (event === 'add' || event === 'unlink')) {
          overrideFiles = scanOverrides();
        }
      });
    },

    resolveId(source: string) {
      for (const prefix of OVERRIDE_PREFIXES) {
        if (!source.startsWith(prefix)) continue;

        const fileName = source.slice(prefix.length);

        for (const ext of EXTENSIONS) {
          const localPath = path.resolve(componentsDir, fileName + ext);

          // Prevent path traversal outside the components directory
          if (!localPath.startsWith(componentsDir + path.sep) && localPath !== componentsDir) {
            return null;
          }

          if (overrideFiles.has(localPath)) {
            return localPath;
          }
        }
      }

      return null;
    },
  };
}
