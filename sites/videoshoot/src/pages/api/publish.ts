import type { APIRoute } from 'astro';

export const prerender = false;

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * Publish endpoint — called by the Directus "Publish to live" Flow.
 * 1. Sets all items across all collections to status: published
 * 2. Triggers GitHub Actions deploy workflow
 *
 * Protected by PREVIEW_TOKEN (same token used for staging/preview routes).
 */
export const POST: APIRoute = async ({ request, url }) => {
  // Runtime env: try multiple access patterns for Cloudflare Workers compatibility
  const env = (key: string): string => {
    // 1. process.env (nodejs_compat)
    if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key]!;
    // 2. import.meta.env (build-time / dev)
    const metaVal = (import.meta.env as Record<string, string>)[key];
    if (metaVal) return metaVal;
    // 3. globalThis (some Workers runtimes)
    const globalVal = (globalThis as Record<string, unknown>)[key];
    if (typeof globalVal === 'string') return globalVal;
    return '';
  };

  const PREVIEW_TOKEN = env('PREVIEW_TOKEN') || 'preview-secret';
  const token = url.searchParams.get('token');

  if (token !== PREVIEW_TOKEN) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const directusUrl = env('DIRECTUS_URL');
  const directusToken = env('DIRECTUS_TOKEN');
  const githubPat = env('GH_DEPLOY_PAT');

  if (!directusUrl || !directusToken) {
    return json({ error: 'CMS not configured' }, 500);
  }

  const results: Record<string, string> = {};

  // Step 1: Publish all items in each collection
  const listCollections = ['projects', 'services', 'testimonials', 'reels'];
  const singletonCollections = ['hero', 'about', 'site_settings'];

  for (const coll of listCollections) {
    try {
      // Get all item IDs
      const idsRes = await fetch(`${directusUrl}/items/${coll}?fields=id&limit=-1`, {
        headers: { Authorization: `Bearer ${directusToken}` },
      });
      if (!idsRes.ok) {
        results[coll] = `failed to get IDs: ${idsRes.status}`;
        continue;
      }
      const idsData = await idsRes.json();
      const ids = (idsData.data || []).map((i: { id: string }) => i.id);

      if (ids.length === 0) {
        results[coll] = 'no items';
        continue;
      }

      // Batch update to published
      const patchRes = await fetch(`${directusUrl}/items/${coll}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${directusToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keys: ids, data: { status: 'published' } }),
      });
      results[coll] = patchRes.ok ? `published ${ids.length}` : `failed: ${patchRes.status}`;
    } catch (err) {
      results[coll] = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  for (const coll of singletonCollections) {
    try {
      const patchRes = await fetch(`${directusUrl}/items/${coll}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${directusToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'published' }),
      });
      results[coll] = patchRes.ok ? 'published' : `failed: ${patchRes.status}`;
    } catch (err) {
      results[coll] = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // Step 2: Trigger GitHub Actions deploy
  let deployStatus = 'skipped';
  if (githubPat) {
    try {
      const dispatchRes = await fetch(
        'https://api.github.com/repos/stefanospp/infront-cms/actions/workflows/deploy-cms-site.yml/dispatches',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${githubPat}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'nikolaspetrou-cms-deploy',
          },
          body: JSON.stringify({ ref: 'main', inputs: { slug: 'videoshoot' } }),
        }
      );
      if (dispatchRes.status === 204) {
        deployStatus = 'triggered';
      } else {
        const body = await dispatchRes.text().catch(() => '');
        deployStatus = `failed: ${dispatchRes.status} - ${body.slice(0, 200)}`;
      }
    } catch (err) {
      deployStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return json({
    ok: true,
    published: results,
    deploy: deployStatus,
  }, 200);
};
