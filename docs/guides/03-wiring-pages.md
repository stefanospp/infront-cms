# Phase 3: Wiring Pages to CMS

Replace hardcoded content in page files with CMS data fetching.

## Step 3.1: Create the Directus client

Create `sites/<slug>/src/lib/directus.ts`:

```typescript
import { createDirectusClient, getPublishedItems, getAllItems } from '@agency/utils';

const directusUrl = import.meta.env.DIRECTUS_URL;
const directusToken = import.meta.env.DIRECTUS_TOKEN;

export const client = directusUrl ? createDirectusClient(directusUrl, directusToken) : null;
```

### Define TypeScript interfaces

Add interfaces for each collection. These must match the Directus field names exactly:

```typescript
export interface Project {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  image?: string;
  video_url?: string;
  sort_order: number;
  description?: string;
  client?: string;
  year?: string;
  category?: string;
}
```

### Create fetch functions

Two sets of functions — one for published content (live site), one for all content (staging):

```typescript
// Live site — only published items
export async function getProjects(options?: { limit?: number }): Promise<Project[]> {
  if (!client) return [];
  return getPublishedItems<Project>(client, 'projects', {
    fields: ['id', 'title', 'slug', 'subtitle', 'image', 'video_url', 'sort_order', 'description', 'client', 'year', 'category'],
    sort: ['sort_order'],
    limit: options?.limit,
  });
}

// Staging — all items (draft + published)
export async function stagingGetProjects(options?: { limit?: number }): Promise<Project[]> {
  if (!client) return [];
  return getAllItems<Project>(client, 'projects', {
    fields: ['id', 'title', 'slug', 'subtitle', 'image', 'video_url', 'sort_order', 'description', 'client', 'year', 'category'],
    sort: ['sort_order'],
    limit: options?.limit,
  });
}
```

**Important:** The `fields` array must list every field you want to fetch. If a field doesn't exist in Directus, the SDK will throw a 403 "You don't have permission to access field" error.

### Singleton fetch functions

For singleton collections (hero, about, site_settings), fetch with `limit: 1` and return the first item:

```typescript
export async function getHero(): Promise<HeroContent | null> {
  if (!client) return null;
  try {
    const items = await getPublishedItems<HeroContent>(client, 'hero', { limit: 1 });
    return items[0] ?? null;
  } catch {
    return null;
  }
}
```

**Note:** If the code references a collection name like `settings` but Directus has `site_settings`, the fetch will fail silently (returns null) or throw. Always verify collection names match.

## Step 3.2: Create .env file

Create `sites/<slug>/.env`:

```
DIRECTUS_URL=https://cms.<client-domain>
DIRECTUS_TOKEN=<static-api-token>
PREVIEW_TOKEN=<preview-secret>
```

**Important:** Astro reads `.env` files via `import.meta.env`. Regular shell env vars are NOT available in `import.meta.env` during build — they must be in the `.env` file or passed via Vite's env handling.

## Step 3.3: Replace hardcoded data in pages

For each page, replace the hardcoded arrays with CMS fetches.

### Example: index.astro

**Before (hardcoded):**
```astro
---
const services = [
  { title: 'Video Production', description: '...', tags: [...] },
  { title: 'Creative Direction', description: '...', tags: [...] },
];
---
```

**After (CMS-powered):**
```astro
---
import { getServices } from '../lib/directus';

const cmsServices = await getServices({ limit: 3 });
const services = cmsServices.map(s => ({
  title: s.title,
  description: s.description,
  tags: s.tags || [],
  href: '/services',
  videoSrc: s.video_url || '',
}));
---
```

### Key patterns

**Map CMS fields to component props:**
CMS field names (snake_case) often differ from component prop names (camelCase). Map them explicitly:
```typescript
const works = cmsProjects.map(p => ({
  title: p.title,        // same name
  videoSrc: p.video_url,  // different name
  subtitle: p.subtitle || '',  // with fallback
}));
```

**Static paths from CMS:**
For dynamic routes like `works/[slug].astro`, replace `getStaticPaths` to fetch from CMS:
```astro
---
import { getProjects } from '../../lib/directus';

export async function getStaticPaths() {
  const projects = await getProjects();
  return projects.map((p) => ({
    params: { slug: p.slug },
    props: { project: p },
  }));
}

const { project } = Astro.props;
---
```

**Singleton data with fallbacks:**
For hero/about sections, use optional chaining with fallbacks:
```astro
---
const hero = await getHero();
---
<HeroInteractive
  heading={hero?.heading || "Default heading"}
  subheading={hero?.subheading || "Default subheading"}
/>
```

## Step 3.4: Build and test

```bash
cd sites/<slug>
npm run build
```

### Common build errors

**"You don't have permission to access field X"**
A field in the `fields` array doesn't exist in Directus. Either:
- Add the missing field to the collection via API
- Remove it from the `fields` array in directus.ts

**"Failed to fetch published items: [object Object]"**
The Directus SDK throws error objects, not Error instances. The shared `getPublishedItems` in `@agency/utils` handles this with `JSON.stringify(error)` fallback.

**Empty pages (no data)**
- Check that items have `status: published`
- Verify `DIRECTUS_URL` and `DIRECTUS_TOKEN` in `.env` are correct
- Test the API directly: `curl https://cms.<domain>/items/projects?limit=1 -H "Authorization: Bearer <token>"`

## Step 3.5: Deploy

```bash
npx wrangler deploy
```

Verify the live site shows CMS content instead of hardcoded content.
