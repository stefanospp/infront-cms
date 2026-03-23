import { slugify } from './slugify';

const THIRTY_DAYS = 30 * 24 * 60 * 60;

/** Map API tags to our industry enum */
function mapIndustry(tags: string[]): string {
  const text = tags.map((t) => t.toLowerCase()).join(' ');

  if (/software|engineer|devops|frontend|backend|fullstack|data|cloud|cyber|ai|machine learning|dev/.test(text)) return 'Technology';
  if (/marketing|seo|growth|content|social media|copywriting/.test(text)) return 'Digital Marketing';
  if (/finance|fintech|banking|accounting|blockchain|crypto/.test(text)) return 'Finance & Fintech';
  if (/health|medical|nurse|pharma|biotech/.test(text)) return 'Healthcare';
  if (/education|teach|tutor|academic|training/.test(text)) return 'Education';
  if (/construction|architect|civil|structural/.test(text)) return 'Construction';
  if (/hotel|hospitality|tourism|chef|restaurant|travel/.test(text)) return 'Hospitality & Tourism';
  if (/energy|solar|wind|renewable|sustainability/.test(text)) return 'Renewable Energy';
  return 'Other';
}

/** Strip HTML tags to plain text */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Extract country from a location string like "Berlin, Germany" */
function parseCountry(location: string): string | null {
  if (!location) return null;

  const lower = location.toLowerCase();

  // Reject remote-only locations
  if (/^remote$|^worldwide$|^anywhere$|^global$/i.test(location.trim())) return null;
  if (/fully remote|remote only|work from home|work from anywhere/i.test(lower)) return null;

  // "Remote (Europe)" or "Remote - Germany" — not a specific country
  if (/^remote\s*[\(\-\/]/i.test(location.trim())) return null;

  // Try to get the last part after comma: "Berlin, Germany" → "Germany"
  const parts = location.split(',').map((s) => s.trim());
  if (parts.length > 1) {
    const last = parts[parts.length - 1]!;
    const cleaned = last.replace(/\(.*\)/, '').trim();
    return cleaned || null;
  }

  // Single word that looks like a country
  return location.trim();
}

/** Check if a job is clearly remote-only based on title and description */
function isRemoteOnly(title: string, description: string, location: string): boolean {
  const lower = `${title} ${location}`.toLowerCase();
  return /fully remote|remote only|100% remote|work from home|work from anywhere|remote position/i.test(lower);
}

// ─── Arbeitnow ───────────────────────────────────────────────────────────────

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  location: string;
  url: string;
  tags: string[];
  created_at: number;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
  links?: { next?: string };
}

async function fetchArbeitnow(): Promise<ArbeitnowJob[]> {
  const jobs: ArbeitnowJob[] = [];
  let page = 1;
  const maxPages = 5;

  while (page <= maxPages) {
    const url = `https://www.arbeitnow.com/api/job-board-api?visa_sponsorship=true&page=${page}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AbroadJobs.eu/1.0' } });
    if (!res.ok) break;

    const data = (await res.json()) as ArbeitnowResponse;
    if (!data.data || data.data.length === 0) break;

    jobs.push(...data.data);
    page++;
  }

  return jobs;
}

// ─── Landing.jobs ────────────────────────────────────────────────────────────

interface LandingJobsLocation {
  city?: string;
  country_code?: string;
}

interface LandingJobsJob {
  id: number;
  title: string;
  role_description: string;
  remote: boolean;
  relocation_paid: boolean;
  gross_salary_low: number | null;
  gross_salary_high: number | null;
  currency_code: string;
  tags: string[];
  url: string;
  published_at: string;
  locations: LandingJobsLocation[];
}

async function fetchLandingJobs(): Promise<LandingJobsJob[]> {
  const jobs: LandingJobsJob[] = [];
  let offset = 0;
  const maxPages = 5;
  const limit = 50;

  for (let page = 0; page < maxPages; page++) {
    const url = `https://landing.jobs/api/v1/jobs?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AbroadJobs.eu/1.0', 'Accept': 'application/json' } });
    if (!res.ok) break;

    const data = (await res.json()) as LandingJobsJob[];
    if (!data || data.length === 0) break;

    jobs.push(...data);
    offset += limit;
    if (data.length < limit) break;
  }

  return jobs;
}

// ─── Batch insert helper ─────────────────────────────────────────────────────

/** Fetch all existing source_ids and slugs in one query each to avoid N+1 */
async function fetchExistingIds(db: D1Database): Promise<{ sourceIds: Set<string>; slugs: Set<string> }> {
  const [sourceResult, slugResult] = await db.batch([
    db.prepare('SELECT source_id FROM jobs WHERE source_id IS NOT NULL'),
    db.prepare('SELECT slug FROM jobs'),
  ]);

  const sourceIds = new Set<string>();
  for (const row of sourceResult.results ?? []) {
    sourceIds.add(row.source_id as string);
  }

  const slugs = new Set<string>();
  for (const row of slugResult.results ?? []) {
    slugs.add(row.slug as string);
  }

  return { sourceIds, slugs };
}

/** Batch insert jobs using D1 batch API (max ~50 per batch to stay within limits) */
async function batchInsertJobs(
  db: D1Database,
  jobs: Record<string, unknown>[],
  existingSourceIds: Set<string>,
  existingSlugs: Set<string>,
  stats: { imported: number; skipped: number },
): Promise<void> {
  const BATCH_SIZE = 50;
  const toInsert: D1PreparedStatement[] = [];

  for (const job of jobs) {
    // Dedup check (in-memory, no DB query)
    if (existingSourceIds.has(job.source_id as string)) {
      stats.skipped++;
      continue;
    }

    // Slug collision check (in-memory)
    let slug = job.slug as string;
    if (existingSlugs.has(slug)) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
    existingSlugs.add(slug);
    existingSourceIds.add(job.source_id as string);

    toInsert.push(
      db.prepare(`
        INSERT INTO jobs (
          slug, company_name, company_website, company_logo, contact_email,
          title, description, country, industry, salary_range,
          visa_support, relocation_pkg, working_language, apply_url,
          is_live, stripe_session_id, created_at, activated_at, expires_at,
          source, source_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        slug, job.company_name, job.company_website, job.company_logo, job.contact_email,
        job.title, job.description, job.country, job.industry, job.salary_range,
        job.visa_support, job.relocation_pkg, job.working_language, job.apply_url,
        job.is_live, job.stripe_session_id, job.created_at, job.activated_at, job.expires_at,
        job.source, job.source_id,
      )
    );
  }

  // Execute in batches of BATCH_SIZE
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    try {
      await db.batch(batch);
      stats.imported += batch.length;
    } catch (err) {
      console.error(`Batch insert failed (batch ${Math.floor(i / BATCH_SIZE) + 1}):`, err instanceof Error ? err.message : err);
      stats.skipped += batch.length;
    }
  }
}

// ─── Main import ─────────────────────────────────────────────────────────────

export async function importJobs(db: D1Database): Promise<{ imported: number; skipped: number; filtered: number }> {
  const stats = { imported: 0, skipped: 0, filtered: 0 };
  const now = Math.floor(Date.now() / 1000);

  // Fetch existing IDs upfront (2 queries instead of 2-3 per job)
  const { sourceIds: existingSourceIds, slugs: existingSlugs } = await fetchExistingIds(db);

  // Fetch from all sources in parallel
  const [arbeitnowJobs, landingJobs] = await Promise.all([
    fetchArbeitnow().catch(() => [] as ArbeitnowJob[]),
    fetchLandingJobs().catch(() => [] as LandingJobsJob[]),
  ]);

  // ── Prepare Arbeitnow jobs ──
  const arbeitnowPrepared: Record<string, unknown>[] = [];
  for (const job of arbeitnowJobs) {
    if (job.remote) { stats.filtered++; continue; }
    const country = parseCountry(job.location);
    if (!country) { stats.filtered++; continue; }
    if (isRemoteOnly(job.title, job.description, job.location)) { stats.filtered++; continue; }

    arbeitnowPrepared.push({
      slug: slugify(job.title, country),
      company_name: job.company_name,
      company_website: null,
      company_logo: null,
      contact_email: 'imported@abroadjobs.eu',
      title: job.title,
      description: stripHtml(job.description).slice(0, 10000),
      country,
      industry: mapIndustry(job.tags),
      salary_range: null,
      visa_support: 'yes',
      relocation_pkg: 'no',
      working_language: null,
      apply_url: job.url,
      is_live: 1,
      stripe_session_id: null,
      created_at: job.created_at || now,
      activated_at: now,
      expires_at: now + THIRTY_DAYS,
      source: 'arbeitnow',
      source_id: `arbeitnow:${job.slug}`,
    });
  }

  // ── Prepare Landing.jobs ──
  const { getCountryName } = await import('./countries');
  const landingPrepared: Record<string, unknown>[] = [];

  for (const job of landingJobs) {
    if (!job.relocation_paid) { stats.filtered++; continue; }
    if (job.remote) { stats.filtered++; continue; }

    const loc = job.locations?.[0];
    const countryCode = loc?.country_code;
    const country = countryCode ? (getCountryName(countryCode) ?? countryCode) : null;
    if (!country) { stats.filtered++; continue; }

    let salaryRange: string | null = null;
    if (job.gross_salary_low && job.gross_salary_high) {
      const currency = job.currency_code === 'EUR' ? '€' : job.currency_code === 'GBP' ? '£' : job.currency_code === 'USD' ? '$' : job.currency_code;
      salaryRange = `${currency}${job.gross_salary_low.toLocaleString('en')} – ${currency}${job.gross_salary_high.toLocaleString('en')}`;
    }

    const createdAt = Math.floor(new Date(job.published_at).getTime() / 1000) || now;
    const city = loc?.city;
    const fullCountry = city ? `${city}, ${country}` : country;

    landingPrepared.push({
      slug: slugify(job.title, fullCountry),
      company_name: job.title.split(' at ')[1] ?? 'Company',
      company_website: null,
      company_logo: null,
      contact_email: 'imported@abroadjobs.eu',
      title: job.title,
      description: stripHtml(job.role_description || '').slice(0, 10000),
      country: fullCountry,
      industry: mapIndustry(job.tags),
      salary_range: salaryRange,
      visa_support: 'partial',
      relocation_pkg: 'yes',
      working_language: null,
      apply_url: job.url,
      is_live: 1,
      stripe_session_id: null,
      created_at: createdAt,
      activated_at: now,
      expires_at: now + THIRTY_DAYS,
      source: 'landingjobs',
      source_id: `landingjobs:${job.id}`,
    });
  }

  // ── Batch insert all jobs (much fewer D1 queries) ──
  const allJobs = [...arbeitnowPrepared, ...landingPrepared];
  await batchInsertJobs(db, allJobs, existingSourceIds, existingSlugs, stats);

  console.log(`Import complete: ${stats.imported} imported, ${stats.skipped} skipped, ${stats.filtered} filtered (Arbeitnow: ${arbeitnowJobs.length}, Landing.jobs: ${landingJobs.length})`);
  return { imported: stats.imported, skipped: stats.skipped, filtered: stats.filtered };
}
