# Payload CMS on Cloudflare Workers — Development Guide

Complete step-by-step guide for setting up Payload CMS on Cloudflare Workers with D1 + R2, connecting to an Astro site, and deploying to production.

**Reference implementation:** `infra/payload/nikolaspetrou/` + `sites/nikolaspetrou-v2/`

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Setup](#2-project-setup)
3. [Define Collections](#3-define-collections)
4. [Define Globals](#4-define-globals)
5. [Payload Configuration](#5-payload-configuration)
6. [Next.js App Routes](#6-nextjs-app-routes)
7. [Cloudflare Configuration](#7-cloudflare-configuration)
8. [Local Development](#8-local-development)
9. [Database Migrations](#9-database-migrations)
10. [Deployment](#10-deployment)
11. [Seeding Data](#11-seeding-data)
12. [Astro Site Integration](#12-astro-site-integration)
13. [Preview System](#13-preview-system)
14. [Live Preview from Payload Admin](#14-live-preview-from-payload-admin)
15. [Rebuild on Publish](#15-rebuild-on-publish)
16. [White-Label Admin](#16-white-label-admin)
17. [Storage & Media (R2)](#17-storage--media-r2)
18. [User Accounts & Roles](#18-user-accounts--roles)
19. [Migration Guide: From SonicJs](#19-migration-guide-from-sonicjs)
20. [Migration Guide: From Directus](#20-migration-guide-from-directus)
21. [Migration Away: Exit Strategy](#21-migration-away-exit-strategy)
22. [Known Issues & Workarounds](#22-known-issues--workarounds)
23. [Cost & Resource Management](#23-cost--resource-management)
24. [Reference](#24-reference)

---

## 1. Prerequisites

- Node.js >= 20.9.0
- pnpm >= 9
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account with **paid Workers plan** (required — Payload exceeds 3MB free tier)
- Authenticated: `wrangler login`

---

## 2. Project Setup

### 2.1 Directory structure

Each client gets their own Payload project:

```
infra/payload/<client-slug>/
├── src/
│   ├── app/
│   │   ├── (payload)/
│   │   │   ├── admin/
│   │   │   │   ├── [[...segments]]/page.tsx
│   │   │   │   └── importMap.js
│   │   │   ├── api/
│   │   │   │   └── [...slug]/route.ts
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── collections/
│   │   ├── Users.ts
│   │   ├── Media.ts
│   │   ├── Projects.ts
│   │   └── ...
│   ├── globals/
│   │   ├── SiteSettings.ts
│   │   ├── HomeSections.ts
│   │   └── Pages.ts
│   ├── migrations/
│   └── payload.config.ts
├── cloudflare-env.d.ts
├── eslint.config.mjs
├── next.config.mjs
├── open-next.config.ts
├── package.json
├── tsconfig.json
└── wrangler.jsonc
```

### 2.2 package.json

Use exact versions matching the official Payload CF Workers template:

```json
{
  "name": "<client-slug>-cms",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "cross-env NODE_OPTIONS=\"--no-deprecation --max-old-space-size=8000\" next build",
    "deploy": "pnpm run deploy:database && pnpm run deploy:app",
    "deploy:app": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "deploy:database": "cross-env NODE_ENV=production PAYLOAD_SECRET=ignore payload migrate && wrangler d1 execute D1 --command 'PRAGMA optimize' --remote",
    "dev": "cross-env NODE_OPTIONS=--no-deprecation next dev --no-server-fast-refresh",
    "generate:importmap": "cross-env NODE_OPTIONS=--no-deprecation payload generate:importmap",
    "generate:types": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts && cross-env NODE_OPTIONS=--no-deprecation payload generate:types",
    "payload": "cross-env NODE_OPTIONS=--no-deprecation payload",
    "seed": "node --import tsx src/seed.ts"
  },
  "dependencies": {
    "@opennextjs/cloudflare": "^1.11.0",
    "@payloadcms/db-d1-sqlite": "3.80.0",
    "@payloadcms/next": "3.80.0",
    "@payloadcms/richtext-lexical": "3.80.0",
    "@payloadcms/storage-r2": "3.80.0",
    "@payloadcms/ui": "3.80.0",
    "cross-env": "^7.0.3",
    "next": "15.4.11",
    "payload": "3.80.0",
    "react": "19.2.1",
    "react-dom": "19.2.1"
  },
  "devDependencies": {
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "tsx": "^4.19.0",
    "typescript": "5.7.3",
    "wrangler": "~4.61.1"
  },
  "pnpm": {
    "onlyBuiltDependencies": ["sharp", "esbuild", "unrs-resolver"]
  }
}
```

**Critical:** Pin Payload packages to the same version (e.g., all `3.80.0`). Mixing versions causes build failures.

**Critical:** Pin `next` to `15.4.11`. Other versions may have peer dependency conflicts with `@payloadcms/next`.

### 2.3 tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "strictNullChecks": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@payload-config": ["./src/payload.config.ts"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Critical:** The `@payload-config` path alias is required. Without it, `@payload-config` imports in layout/route files fail with `Module not found`.

### 2.4 next.config.mjs

```javascript
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig = {
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
  },
  serverExternalPackages: ['jose', 'pg-cloudflare'],
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
```

### 2.5 open-next.config.ts

```typescript
import { defineCloudflareConfig } from '@opennextjs/cloudflare/config'

export default defineCloudflareConfig({})
```

**Note:** The import is from `@opennextjs/cloudflare/config`, NOT `@opennextjs/cloudflare`. The latter exports `defineCloudflareConfig` from a different path depending on version.

### 2.6 cloudflare-env.d.ts

```typescript
interface CloudflareEnv {
  ASSETS: Fetcher;
  D1: D1Database;
  R2: R2Bucket;
  PAYLOAD_SECRET: string;
}
```

### 2.7 eslint.config.mjs

Create a minimal ESLint config to prevent the monorepo root config from interfering:

```javascript
export default []
```

### 2.8 .gitignore

```
node_modules/
.next/
.open-next/
.wrangler/
package-lock.json
src/payload-types.ts
```

---

## 3. Define Collections

Collections are defined in `src/collections/`. Each file exports a `CollectionConfig`.

### 3.1 Users (required)

```typescript
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email' },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      defaultValue: 'editor',
      required: true,
    },
  ],
}
```

### 3.2 Media (required for uploads)

```typescript
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    crop: false,       // sharp not available on Workers
    focalPoint: false,  // sharp not available on Workers
    mimeTypes: ['image/*', 'video/*'],
  },
  access: { read: () => true },
  fields: [
    { name: 'alt', type: 'text' },
  ],
}
```

**Critical:** `crop: false` and `focalPoint: false` are required on Cloudflare Workers because `sharp` is not available.

### 3.3 Custom collections

Follow this pattern for any content collection:

```typescript
import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'year', 'order'],
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    { name: 'category', type: 'text', required: true },
    { name: 'year', type: 'number', required: true },
    { name: 'video_url', type: 'text', required: true },
    { name: 'thumbnail', type: 'upload', relationTo: 'media' },
    { name: 'description', type: 'richText' },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
```

### Available field types

| Type | Usage | Notes |
|------|-------|-------|
| `text` | Short text, URLs, slugs | |
| `textarea` | Long text, descriptions | |
| `number` | Years, order, counts | |
| `email` | Email addresses | Built-in validation |
| `date` | Dates, timestamps | |
| `select` | Dropdowns, enums | `options` array |
| `richText` | Block content | Uses Lexical editor |
| `upload` | Media files | `relationTo: 'media'` |
| `relationship` | Links between collections | |
| `array` | Repeatable groups of fields | |
| `group` | Nested field groups | |
| `checkbox` | Boolean toggle | |
| `json` | Raw JSON data | |

---

## 4. Define Globals

Globals are singleton data — site settings, page content, navigation. Defined in `src/globals/`.

### 4.1 Site Settings

```typescript
import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: { read: () => true },
  fields: [
    { name: 'siteName', type: 'text', required: true, defaultValue: 'Site Name' },
    { name: 'tagline', type: 'text' },
    {
      name: 'navLinks',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      type: 'group',
      name: 'contact',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      type: 'group',
      name: 'social',
      fields: [
        { name: 'instagram', type: 'text' },
        { name: 'vimeo', type: 'text' },
        { name: 'youtube', type: 'text' },
      ],
    },
  ],
}
```

### 4.2 Home Sections (homepage content)

Use a global to make every homepage section editable — hero, labels, footer CTA, etc.

### 4.3 Pages (inner page content)

Use a global with groups for each page — about, contact, legal. This keeps all page-specific content in one place without creating separate collections for each page.

**Reference:** `infra/payload/nikolaspetrou/src/globals/HomeSections.ts`, `Pages.ts`

---

## 5. Payload Configuration

### 5.1 payload.config.ts

This is the main Payload config. It follows the official Cloudflare Workers template pattern:

```typescript
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { r2Storage } from '@payloadcms/storage-r2'
import type { CloudflareContext } from '@opennextjs/cloudflare'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { GetPlatformProxyOptions } from 'wrangler'

// Import all collections and globals
import { Users } from './collections/Users'
import { Media } from './collections/Media'
// ... more collections
import { SiteSettings } from './globals/SiteSettings'
// ... more globals

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const realpath = (value: string) => {
  try { return fs.existsSync(value) ? fs.realpathSync(value) : undefined }
  catch { return undefined }
}

const isCLI = process.argv.some(
  (value) => realpath(value)?.endsWith(path.join('payload', 'bin.js')),
)
const isProduction = process.env.NODE_ENV === 'production'

// Custom logger for Workers (pino-pretty uses Node fs.write)
const createLog = (level: string, fn: typeof console.log) =>
  (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') fn(JSON.stringify({ level, msg: objOrMsg }))
    else fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as any).msg }))
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as any

// Get Cloudflare bindings (D1, R2)
const cloudflare = isCLI || !isProduction
  ? await getCloudflareContextFromWrangler()
  : await getCloudflareContext({ async: true })

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'DEVELOPMENT-SECRET-CHANGE-ME',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' — Client CMS' },
    livePreview: {
      url: ({ data, collectionConfig, globalConfig }) => {
        const base = process.env.SITE_URL || 'http://localhost:4330/preview'
        const token = process.env.PREVIEW_SECRET || 'preview-secret'
        // Route to the correct preview page based on collection/global
        if (collectionConfig?.slug === 'projects' && data?.slug)
          return `${base}/works/${data.slug}?token=${token}`
        return `${base}?token=${token}`
      },
      collections: ['projects', 'services', 'clients'],
      globals: ['site-settings', 'home-sections', 'pages'],
    },
  },
  collections: [Users, Media, /* ... */],
  globals: [SiteSettings, /* ... */],
  editor: lexicalEditor(),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1 }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
  ],
})

// Wrangler binding helper for local dev + CLI
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(`${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction,
      } satisfies GetPlatformProxyOptions),
  )
}
```

**Critical patterns:**
- `sqliteD1Adapter({ binding: cloudflare.env.D1 })` — pass the binding directly, not a string
- `r2Storage({ bucket: cloudflare.env.R2 })` — same, pass the binding
- The `getCloudflareContextFromWrangler()` function uses dynamic import with a string trick to avoid webpack bundling it
- Custom logger is only used in production (dev uses Payload's default pino logger)

---

## 6. Next.js App Routes

These files are required for Payload's admin UI and API to work.

### 6.1 Root layout — `src/app/layout.tsx`

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
```

### 6.2 Root page — `src/app/page.tsx`

```tsx
import { redirect } from 'next/navigation'
export default function Home() { redirect('/admin') }
```

### 6.3 Payload layout — `src/app/(payload)/layout.tsx`

```tsx
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import { importMap } from './admin/importMap.js'

type Args = { children: React.ReactNode }

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
```

**Critical:** Must use `handleServerFunctions` — without it, the admin panel gets React hydration errors (#418).

### 6.4 Admin page — `src/app/(payload)/admin/[[...segments]]/page.tsx`

```tsx
import type { Metadata } from 'next'
import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap })

export default Page
```

### 6.5 API route — `src/app/(payload)/api/[...slug]/route.ts`

```typescript
import config from '@payload-config'
import '@payloadcms/next/css'
import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
```

### 6.6 Import map — `src/app/(payload)/admin/importMap.js`

```javascript
import { R2ClientUploadHandler as R2ClientUploadHandler_hash } from '@payloadcms/storage-r2/client'

export const importMap = {
  '@payloadcms/storage-r2/client#R2ClientUploadHandler': R2ClientUploadHandler_hash,
}
```

**Note:** Run `pnpm generate:importmap` after adding new plugins to auto-generate this file.

---

## 7. Cloudflare Configuration

### 7.1 wrangler.jsonc

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "cms-<client-slug>",
  "compatibility_date": "2025-08-15",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],

  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },

  "d1_databases": [
    {
      "binding": "D1",
      "database_id": "<D1_DATABASE_ID>",
      "database_name": "<client-slug>-payload",
      "remote": true
    }
  ],

  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "infront-uploads"
    }
  ],

  "vars": {
    "SITE_URL": "https://<client-domain>/preview",
    "PREVIEW_SECRET": "<generated-secret>"
  }
}
```

### 7.2 Create D1 database

```bash
wrangler d1 create <client-slug>-payload
```

Copy the `database_id` from the output into `wrangler.jsonc`.

### 7.3 Set PAYLOAD_SECRET

```bash
openssl rand -hex 32
# Copy the output
echo "<secret>" | npx wrangler secret put PAYLOAD_SECRET
```

---

## 8. Local Development

```bash
cd infra/payload/<client-slug>

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

The admin panel will be at `http://localhost:3000/admin`. On first visit, you'll be prompted to create the first admin user.

**Note:** Local dev uses wrangler's platform proxy to simulate D1/R2 bindings. Data is stored locally in `.wrangler/`.

---

## 9. Database Migrations

### 9.1 Create migration (after changing collections/globals)

```bash
npx cross-env NODE_OPTIONS=--no-deprecation npx payload migrate:create
```

### 9.2 Run migration locally

```bash
npx cross-env NODE_ENV=production PAYLOAD_SECRET=ignore npx payload migrate
```

### 9.3 Run migration on production D1

```bash
npx cross-env NODE_ENV=production PAYLOAD_SECRET=ignore npx payload migrate
# Or via deploy script:
pnpm run deploy:database
```

**Note:** Migrations are stored in `src/migrations/`. Always commit them to git.

---

## 10. Deployment

### 10.1 Full deploy (database + app)

```bash
pnpm run deploy
```

This runs:
1. `payload migrate` — applies any pending migrations to remote D1
2. `opennextjs-cloudflare build` — builds Next.js app for Workers
3. `opennextjs-cloudflare deploy` — uploads to Cloudflare

### 10.2 App-only deploy (no schema changes)

```bash
pnpm run build && npx opennextjs-cloudflare build && npx wrangler deploy
```

### 10.3 Common build errors

| Error | Cause | Fix |
|-------|-------|-----|
| `d1SQLiteAdapter is not exported` | Wrong import name | Use `sqliteD1Adapter` |
| `Module not found: @payload-config` | Missing path alias | Add to `tsconfig.json` paths |
| `esbuild panic: Unexpected expression` | esbuild bug with large bundles | Update esbuild, pin versions |
| `Failed to collect page data for /api/[...slug]` | Dynamic route can't be pre-rendered | Normal warning, safe to ignore |
| React hydration error #418 | Missing `handleServerFunctions` | Fix layout.tsx (see section 6.3) |

---

## 11. Seeding Data

Create a seed script at `src/seed.ts`:

```typescript
const PAYLOAD_URL = process.env.PAYLOAD_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password';

let token = '';

async function api(method, endpoint, body?) {
  const res = await fetch(`${PAYLOAD_URL}/api${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${endpoint} failed: ${res.status}`);
  return res.json();
}

async function login() {
  const res = await fetch(`${PAYLOAD_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const data = await res.json();
  token = data.token;
}

async function seed() {
  await login();

  // Check if data exists before creating
  const existing = await api('GET', '/projects?limit=1');
  if (existing.totalDocs === 0) {
    await api('POST', '/projects', { title: '...', slug: '...', /* ... */ });
  }

  // Globals use POST (not PUT)
  await api('POST', '/globals/site-settings', { siteName: '...', /* ... */ });
}

seed();
```

Run against deployed CMS:

```bash
PAYLOAD_URL=https://cms-<slug>.stepet.workers.dev node --import tsx src/seed.ts
```

**Note:** The first admin user must be created via the admin UI. The seed script authenticates against an existing user.

---

## 12. Astro Site Integration

### 12.1 Fetch client

Create `src/lib/payload.ts` in the Astro site:

```typescript
const PAYLOAD_URL = typeof import.meta.env !== 'undefined' && import.meta.env.PAYLOAD_URL
  ? import.meta.env.PAYLOAD_URL
  : 'https://cms-<slug>.stepet.workers.dev';

interface FetchOptions {
  draft?: boolean;
}

async function fetchPayload<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = options?.draft
    ? `${PAYLOAD_URL}/api${endpoint}${separator}draft=true`
    : `${PAYLOAD_URL}/api${endpoint}`;
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`Payload API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getProjects(options?: FetchOptions) {
  const data = await fetchPayload<PayloadResponse<Project>>('/projects?sort=order&limit=50', options);
  return data.docs;
}
// ... more functions
```

**Critical:** The `PAYLOAD_URL` resolution must handle both build-time (`import.meta.env`) and runtime (Cloudflare Workers where `import.meta.env` may not have wrangler vars). Use a hardcoded fallback for the deployed CMS URL.

### 12.2 Page data fetching pattern

```astro
---
import { getProjects, getSiteSettings } from '../lib/payload';

let projects, settings;
try {
  [projects, settings] = await Promise.all([
    getProjects(),
    getSiteSettings(),
  ]);
} catch {
  // Fallback data for development without CMS
  projects = [/* hardcoded data */];
  settings = {/* hardcoded data */};
}
---
```

Always provide fallback data in catch blocks so the site works without the CMS running.

### 12.3 Tailwind v4 CSS integration

In `src/styles/global.css`:

```css
@import "tailwindcss";

@source "../components/**/*.{astro,tsx}";
@source "../layouts/**/*.{astro,tsx}";
@source "../pages/**/*.{astro,tsx}";

@layer base {
  /* Your base styles */
}

@layer components {
  /* Your component styles */
}
```

**Critical:** Custom CSS must be inside `@layer base` or `@layer components`. Unlayered CSS overrides Tailwind's `@layer utilities`, causing utility classes like `px-8`, `py-32` to have no effect.

**Critical:** `@source` directives are required for Tailwind to scan Astro component files. Without them, utility classes in components won't be generated.

---

## 13. Preview System

### 13.1 Architecture

```
/                   ← Static (pre-rendered at build)
/preview/           ← SSR (fetches draft data on every request)
/preview/about      ← Same components, live CMS data
/api/contact        ← SSR API route
```

### 13.2 Preview pages

Each preview page mirrors a static page but with `prerender = false` and `draft: true`:

```astro
---
export const prerender = false;

import '../../styles/global.css';
import V2Layout from '../../layouts/V2Layout.astro';
import PreviewBanner from '../../components/PreviewBanner.astro';
import { getProjects } from '../../lib/payload';

const projects = await getProjects({ draft: true });
---

<V2Layout title="Preview" noindex>
  <PreviewBanner />
  <!-- Same components as static page -->
</V2Layout>
```

### 13.3 Auth middleware

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async ({ request, url, cookies }, next) => {
  if (!url.pathname.startsWith('/preview')) return next();

  const PREVIEW_SECRET = 'your-secret-here';
  const token = url.searchParams.get('token') || cookies.get('preview_token')?.value;

  if (token !== PREVIEW_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (url.searchParams.get('token')) {
    cookies.set('preview_token', token, {
      httpOnly: true, secure: true, sameSite: 'lax',
      path: '/preview', maxAge: 3600,
    });
  }

  return next();
});
```

### 13.4 SEO protection

- `public/robots.txt`: `Disallow: /preview/`
- `public/_headers`: `X-Robots-Tag: noindex` for `/preview/*`
- All preview pages: `<meta name="robots" content="noindex, nofollow">`
- Auth middleware blocks unauthenticated access

---

## 14. Live Preview from Payload Admin

Payload's admin panel has a "Live Preview" tab that shows an iframe of the site.

Configure in `payload.config.ts`:

```typescript
admin: {
  livePreview: {
    url: ({ data, collectionConfig }) => {
      const base = process.env.SITE_URL || 'http://localhost:4330/preview';
      const token = process.env.PREVIEW_SECRET || 'secret';
      if (collectionConfig?.slug === 'projects' && data?.slug)
        return `${base}/works/${data.slug}?token=${token}`;
      return `${base}?token=${token}`;
    },
    collections: ['projects', 'services', 'clients'],
    globals: ['site-settings', 'home-sections', 'pages'],
  },
}
```

The site must allow iframing from the CMS domain. In `public/_headers`:

```
/*
  Content-Security-Policy: frame-ancestors 'self' https://cms-<slug>.stepet.workers.dev
```

---

## 15. Rebuild on Publish

When content is published, the static Astro site needs to rebuild. Options:

### Option A: Cloudflare Deploy Hook

1. Create a deploy hook in Cloudflare dashboard
2. Store URL as `REBUILD_HOOK_URL` in Payload's wrangler.jsonc
3. Add `afterChange` hook to collections:

```typescript
{
  hooks: {
    afterChange: [
      async ({ req }) => {
        const url = process.env.REBUILD_HOOK_URL;
        if (url) await fetch(url, { method: 'POST' });
      },
    ],
  },
}
```

### Option B: GitHub Actions webhook

Trigger a GitHub Actions workflow that runs `astro build && wrangler deploy`.

---

## 16. White-Label Admin

```typescript
admin: {
  meta: {
    titleSuffix: ' — Client Name CMS',
  },
}
```

For custom branding (logo, colors), see [Payload Admin Customisation docs](https://payloadcms.com/docs/admin/overview).

---

## 17. Storage & Media (R2)

All client CMS instances share the `infront-uploads` R2 bucket. Media is stored with auto-generated paths.

```jsonc
"r2_buckets": [
  { "binding": "R2", "bucket_name": "infront-uploads" }
]
```

Plugin config:

```typescript
r2Storage({
  bucket: cloudflare.env.R2,
  collections: { media: true },
})
```

---

## 18. User Accounts & Roles

### First user

Created via the admin UI on first visit to `/admin`. This user becomes the admin.

### Additional users

Created in the admin panel under Users collection. Roles: `admin` (full access) or `editor` (limited).

### Access control

```typescript
access: {
  read: () => true,                    // Public read
  create: ({ req }) => req.user?.role === 'admin',
  update: ({ req }) => !!req.user,     // Any authenticated user
  delete: ({ req }) => req.user?.role === 'admin',
}
```

---

## 19. Migration Guide: From SonicJs

### 19.1 Data migration steps

1. **Export from SonicJs** — Query the SonicJs API to get all content:
   ```bash
   curl https://admin.<domain>/api/content?limit=100 > sonicjs-export.json
   ```

2. **Map fields** — SonicJs uses generic `content` table with `data` JSON. Map to Payload collections:
   | SonicJs | Payload |
   |---------|---------|
   | `content.data.title` | `projects.title` |
   | `content.data.video_url` | `projects.video_url` |
   | `content.contentType` | Collection slug |

3. **Create seed script** — Transform and import via Payload REST API

4. **Update Astro site** — Replace SonicJs fetch functions with Payload fetch functions. The component layer stays the same.

### 19.2 Key differences

| SonicJs | Payload |
|---------|---------|
| Single `content` table, JSON data | Typed collections with defined fields |
| Manual API routes | Auto-generated REST API |
| No admin auth | Full auth + roles |
| No draft/publish | Built-in versions/drafts |
| KV cache | D1 only (no KV needed) |

---

## 20. Migration Guide: From Directus

### 20.1 Data migration steps

1. **Export from Directus** — Use Directus API or `directus schema snapshot`:
   ```bash
   npx directus schema snapshot --format json > directus-schema.json
   curl https://cms.<domain>/items/<collection>?limit=-1 > directus-data.json
   ```

2. **Map collections** — Directus collections map 1:1 to Payload collections. Field type mapping:
   | Directus | Payload |
   |----------|---------|
   | `string` | `text` |
   | `text` | `textarea` |
   | `integer` | `number` |
   | `boolean` | `checkbox` |
   | `json` | `json` |
   | `file` (M2O) | `upload` |
   | `m2o` | `relationship` |
   | `o2m` | `relationship` (hasMany) |
   | `wysiwyg` | `richText` |

3. **Migrate media** — Download files from Directus storage, upload to R2 via Payload media API

4. **Update Astro site** — Replace `getDirectusImageUrl()` and Directus client with Payload fetch functions

### 20.2 What's gained

- No Docker/VPS needed (fully edge)
- Admin UI runs on same Workers infrastructure
- Lower latency (no Hetzner round-trip)
- Simpler infrastructure (no PostgreSQL, no Caddy)

### 20.3 What's lost

- PostgreSQL features (full-text search, JSON operators)
- Image cropping/focal point in admin
- GraphQL API
- Directus Flows (automation) — replace with Payload hooks

---

## 21. Migration Away: Exit Strategy

### 21.1 Export all data

```bash
# Export each collection via REST API
curl https://cms-<slug>.stepet.workers.dev/api/projects?limit=1000 > projects.json
curl https://cms-<slug>.stepet.workers.dev/api/services?limit=1000 > services.json
curl https://cms-<slug>.stepet.workers.dev/api/clients?limit=1000 > clients.json
curl https://cms-<slug>.stepet.workers.dev/api/globals/site-settings > site-settings.json
curl https://cms-<slug>.stepet.workers.dev/api/globals/home-sections > home-sections.json
curl https://cms-<slug>.stepet.workers.dev/api/globals/pages > pages.json
```

### 21.2 Export media

Download all files from R2:

```bash
# List all media
curl https://cms-<slug>.stepet.workers.dev/api/media?limit=1000 > media.json
# Download each file
for url in $(jq -r '.docs[].url' media.json); do
  wget "$url" -P ./media-export/
done
```

### 21.3 Export database directly

```bash
wrangler d1 export <database-name> --remote --output=d1-export.sql
```

### 21.4 Migration targets

| Target | Strategy |
|--------|----------|
| **Another Payload** | Import JSON via REST API + upload media |
| **Directus** | Map collections → Directus schema, import via API |
| **Strapi** | Map collections → Strapi content types, import via API |
| **WordPress** | Map to custom post types, use WP REST API |
| **Static files** | JSON export + media files = fully portable |

### 21.5 Client handoff

If handing off the entire project to a client:

1. Export all data (JSON + media)
2. The Payload project (`infra/payload/<slug>/`) is a standard Next.js app — runs anywhere Node.js works
3. Client can deploy to Vercel, Railway, or any Node.js host
4. Database can be migrated from D1 to PostgreSQL (change adapter to `@payloadcms/db-postgres`)
5. Media can be moved from R2 to S3, local disk, or any storage

---

## 22. Known Issues & Workarounds

### esbuild panic during OpenNext build

**Symptom:** `panic: Unexpected expression of type <nil>`
**Fix:** Ensure `pnpm.onlyBuiltDependencies` includes `esbuild`. Pin to versions in the official template.

### React hydration error #418 on admin panel

**Symptom:** `Minified React error #418` on `/admin`
**Fix:** Use `handleServerFunctions` in the Payload layout (see section 6.3). Ensure `importMap` includes R2 client upload handler.

### D1 database already has tables from another CMS

**Symptom:** Migration fails with `table already exists`
**Fix:** Create a fresh D1 database with `wrangler d1 create <new-name>`.

### `import.meta.env` not available at runtime on Workers

**Symptom:** SSR routes can't read wrangler `[vars]`
**Fix:** Use hardcoded fallback values for runtime URLs. `import.meta.env` only works at build time.

### Tailwind utilities not generating

**Symptom:** Classes like `px-8`, `py-32` have no effect
**Fix:** Add `@source` directives in CSS. Put custom CSS inside `@layer base/components`.

---

## 23. Cost & Resource Management

### Cloudflare Workers (Paid Plan)

| Resource | Limit | Estimated Usage |
|----------|-------|-----------------|
| Worker requests | 10M/month included | CMS: ~1K/day (admin usage). Site: varies |
| D1 reads | 25B/month included | Low — CMS queries only |
| D1 writes | 50M/month included | Very low — content edits |
| D1 storage | 10GB max | Typically <100MB |
| R2 storage | 10GB free | Media files — varies |
| R2 operations | 1M class A, 10M class B free | Media uploads/reads |

**Estimated cost per client:** $5/month (Workers paid plan) + negligible D1/R2 usage.

### Compared to Directus on Hetzner

| | Directus (Hetzner) | Payload (CF Workers) |
|---|---|---|
| Hosting | €4.50/month VPS | $5/month Workers plan |
| Database | PostgreSQL on VPS | D1 (included) |
| Storage | R2 | R2 (same) |
| Maintenance | Docker, updates, backups | Zero (managed) |
| Scaling | Manual | Automatic |

---

## 24. Reference

### Official Payload Resources
- [Payload Docs](https://payloadcms.com/docs)
- [Payload + Cloudflare D1 Template](https://github.com/payloadcms/payload/tree/main/templates/with-cloudflare-d1)
- [Payload Blog: Deploy to Cloudflare](https://payloadcms.com/posts/blog/deploy-payload-onto-cloudflare-in-a-single-click)
- [Cloudflare Blog: Payload on Workers](https://blog.cloudflare.com/payload-cms-workers/)

### Platform Reference Implementation
- **CMS project:** `infra/payload/nikolaspetrou/`
- **Astro site:** `sites/nikolaspetrou-v2/`
- **Seed script:** `infra/payload/nikolaspetrou/src/seed.ts`
- **Fetch client:** `sites/nikolaspetrou-v2/src/lib/payload.ts`
- **Preview system:** `sites/nikolaspetrou-v2/src/pages/preview/`
- **Middleware:** `sites/nikolaspetrou-v2/src/middleware.ts`

### Quick Commands

```bash
# New project setup
cd infra/payload/<slug>
pnpm install
pnpm dev                              # Local dev at localhost:3000

# Migrations
npx payload migrate:create            # Create migration
npx payload migrate                   # Run migration

# Deploy
pnpm run deploy                       # Full deploy (DB + app)
pnpm run build && npx wrangler deploy # App-only deploy

# Seed
PAYLOAD_URL=https://cms-<slug>.stepet.workers.dev node --import tsx src/seed.ts

# Types
pnpm generate:types                   # Generate TypeScript types from schema
pnpm generate:importmap               # Regenerate import map after adding plugins

# Secrets
echo "key" | npx wrangler secret put RESEND_API_KEY --name <worker-name>
```

---

## 25. Contact Form Integration

### 25.1 Submissions collection

Add a `Submissions` collection to store form submissions in the CMS:

```typescript
import type { CollectionConfig } from 'payload'

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'project', 'status', 'createdAt'],
  },
  access: {
    create: () => true,           // Public can submit
    read: ({ req }) => !!req.user, // Only admins can view
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'project', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
    { name: 'budget', type: 'text' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Read', value: 'read' },
        { label: 'Replied', value: 'replied' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      type: 'group',
      name: 'metadata',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'ip', type: 'text' },
        { name: 'userAgent', type: 'text' },
        { name: 'spam', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
}
```

Register in `payload.config.ts` and run `payload migrate:create` + `payload migrate`.

### 25.2 Astro API route

The contact form API route handles: validation, honeypot spam check, Payload storage, and Resend email notification.

```typescript
export const prerender = false;

const PAYLOAD_URL = 'https://cms-<slug>.stepet.workers.dev';
const NOTIFICATION_EMAIL = 'client@email.com';
const FROM_EMAIL = 'Client Name <noreply@infront.cy>';

export async function POST({ request }) {
  const body = await request.json();
  const { name, email, message, project, budget, website } = body;

  // Honeypot
  if (website) return new Response(JSON.stringify({ success: true }), { status: 200 });

  // Validate
  if (!name || !email || !message) return new Response(JSON.stringify({ error: 'Required' }), { status: 400 });

  // Store in Payload
  await fetch(`${PAYLOAD_URL}/api/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, project, message, budget, status: 'new',
      metadata: { ip: request.headers.get('cf-connecting-ip'), userAgent: request.headers.get('user-agent') } }),
  });

  // Send email via Resend
  const resendApiKey = process.env.RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
  if (resendApiKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: NOTIFICATION_EMAIL,
        subject: `New enquiry from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nProject: ${project}\nBudget: ${budget}\n\nMessage:\n${message}`,
        reply_to: email,
      }),
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
```

### 25.3 Resend API key

Set as a Cloudflare Worker secret (not in wrangler.toml):

```bash
echo "re_xxxxx" | npx wrangler secret put RESEND_API_KEY --name <worker-name>
```

All sites share the same Resend API key (`re_DXiqCxfF_...`) with `noreply@infront.cy` as the sender domain.

**Note:** On Cloudflare Workers, `import.meta.env` only works at build time. For SSR routes (like the contact API), access the secret via `(globalThis as any).process?.env?.RESEND_API_KEY` or use the Cloudflare runtime env binding.

---

## 26. Agency Footer Credit

All client sites include an agency credit in the footer:

```
© 2026 Client Name · Built by infront.cy
```

The "infront.cy" links to `https://infront.cy` with `target="_blank"` and `rel="noopener"`. Add to:
- Homepage footer component
- Inner page layout footer
- About page footer (if custom layout)

---

## 27. Tailwind v4 Gotchas on Astro

### CSS layer ordering

Custom CSS must be inside `@layer base` or `@layer components`. **Unlayered CSS overrides Tailwind's `@layer utilities`**, causing utility classes like `px-8`, `py-32` to have zero effect.

```css
/* WRONG — unlayered CSS beats Tailwind utilities */
.hero-content { position: absolute; bottom: 4rem; }

/* RIGHT — inside @layer, Tailwind utilities can override */
@layer components {
  .hero-content { position: absolute; bottom: 4rem; }
}
```

### @source directives required

Tailwind v4 with the Vite plugin doesn't auto-detect `.astro` files. Add explicit source paths:

```css
@import "tailwindcss";

@source "../components/**/*.{astro,tsx}";
@source "../layouts/**/*.{astro,tsx}";
@source "../pages/**/*.{astro,tsx}";
```

Without these, utility classes used in components won't be generated.

### CSS import location

Import `global.css` from the **page file** frontmatter, not from a layout:

```astro
---
import '../styles/global.css';  // In each page file
---
```

The existing nikolaspetrou site uses this pattern. Importing from a layout may cause Tailwind to not detect component classes in dev mode.

---

## 28. iOS Safari Specific Issues

### Viewport height

Use `100dvh` (dynamic viewport height) instead of `100vh` or `100svh`. It updates in real-time as Safari's toolbar appears/disappears:

```css
.hero { height: 100vh; height: 100dvh; }
```

### ScrollTrigger pinning

ScrollTrigger's pinning uses `position: fixed` which can cause white gaps on iOS when the toolbar changes size. Fix:
- Add `invalidateOnRefresh: true` to ScrollTrigger config
- Listen to `window.visualViewport.resize` and call `ScrollTrigger.refresh()`
- Use `100dvh` on pinned elements

### Video autoplay

iOS allows autoplay only with `muted` + `playsinline`. Only one video can play at a time — pause all others before playing the active one.

### GPU compositing

Use `translate3d()` instead of `translateY()` and add `-webkit-transform: translateZ(0)` to force GPU compositing on iOS Safari. Avoid `will-change` on too many elements.

### Ken Burns on video

`transform: scale()` on `<video>` elements causes rendering glitches on iOS. Wrap in `@media (pointer: fine)` to only apply on desktop.
