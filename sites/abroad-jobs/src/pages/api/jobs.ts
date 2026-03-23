import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { jobs } from '../../lib/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { searchParamsSchema } from '../../lib/validation';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const parsed = searchParamsSchema.safeParse({
    q: url.searchParams.get('q') || undefined,
    country: url.searchParams.get('country') || undefined,
    industry: url.searchParams.get('industry') || undefined,
    page: url.searchParams.get('page') || undefined,
    limit: url.searchParams.get('limit') || undefined,
  });

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { q, country, industry, page, limit } = parsed.data;
  const db = getDb(env.DB);
  const now = Math.floor(Date.now() / 1000);
  const offset = (page - 1) * limit;

  let results: (typeof jobs.$inferSelect)[];

  if (q) {
    const ftsQuery = q.replace(/['"]/g, '').trim();
    if (!ftsQuery) {
      return new Response(JSON.stringify({ jobs: [], hasMore: false }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const queryParts = [
      'SELECT j.* FROM jobs j',
      'JOIN jobs_fts f ON j.id = f.rowid',
      'WHERE jobs_fts MATCH ?',
      'AND j.is_live = 1',
      'AND (j.expires_at IS NULL OR j.expires_at > ?)',
    ];
    const params: unknown[] = [ftsQuery, now];

    if (country) {
      queryParts.push('AND j.country = ?');
      params.push(country);
    }
    if (industry) {
      queryParts.push('AND j.industry = ?');
      params.push(industry);
    }

    queryParts.push('ORDER BY rank');
    queryParts.push('LIMIT ? OFFSET ?');
    params.push(limit + 1, offset);

    const raw = await env.DB
      .prepare(queryParts.join(' '))
      .bind(...params)
      .all();
    results = (raw.results ?? []) as typeof results;
  } else {
    const conditions = [
      eq(jobs.isLive, 1),
      sql`(${jobs.expiresAt} IS NULL OR ${jobs.expiresAt} > ${now})`,
    ];
    if (country) conditions.push(eq(jobs.country, country));
    if (industry) conditions.push(eq(jobs.industry, industry));

    results = await db
      .select()
      .from(jobs)
      .where(and(...conditions))
      .orderBy(desc(jobs.createdAt))
      .limit(limit + 1)
      .offset(offset);
  }

  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;

  return new Response(JSON.stringify({ jobs: data, hasMore }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
    },
  });
};
