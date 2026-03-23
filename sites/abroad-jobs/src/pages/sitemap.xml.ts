import type { APIRoute } from 'astro';
import { getDb } from '../lib/db';
import { jobs } from '../lib/schema';
import { eq, sql } from 'drizzle-orm';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const db = getDb(env.DB);
  const now = Math.floor(Date.now() / 1000);
  const siteUrl = site?.toString().replace(/\/$/, '') || 'https://abroadjobs.eu';

  const liveJobs = await db
    .select({ slug: jobs.slug, activatedAt: jobs.activatedAt })
    .from(jobs)
    .where(
      sql`${jobs.isLive} = 1 AND (${jobs.expiresAt} IS NULL OR ${jobs.expiresAt} > ${now})`
    );

  const staticPages = ['', '/about', '/pricing', '/post', '/privacy', '/terms'];

  const urls = [
    ...staticPages.map((path) => `
  <url>
    <loc>${siteUrl}${path}</loc>
    <changefreq>${path === '' ? 'daily' : 'monthly'}</changefreq>
    <priority>${path === '' ? '1.0' : '0.5'}</priority>
  </url>`),
    ...liveJobs.map((job) => `
  <url>
    <loc>${siteUrl}/jobs/${job.slug}</loc>
    <lastmod>${job.activatedAt ? new Date(job.activatedAt * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
