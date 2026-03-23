import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import type { Job } from './schema';

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof getDb>;

/** Maps a raw D1 snake_case row to the Drizzle camelCase Job type */
export function mapRawJob(row: Record<string, unknown>): Job {
  return {
    id: row.id as number,
    slug: row.slug as string,
    companyName: row.company_name as string,
    companyWebsite: (row.company_website as string | null) ?? null,
    companyLogo: (row.company_logo as string | null) ?? null,
    contactEmail: row.contact_email as string,
    title: row.title as string,
    description: row.description as string,
    country: row.country as string,
    industry: row.industry as string,
    salaryRange: (row.salary_range as string | null) ?? null,
    visaSupport: row.visa_support as string,
    relocationPkg: row.relocation_pkg as string,
    workingLanguage: (row.working_language as string | null) ?? null,
    applyUrl: row.apply_url as string,
    isLive: row.is_live as number,
    stripeSessionId: (row.stripe_session_id as string | null) ?? null,
    createdAt: row.created_at as number,
    activatedAt: (row.activated_at as number | null) ?? null,
    expiresAt: (row.expires_at as number | null) ?? null,
    source: (row.source as string | null) ?? 'paid',
    sourceId: (row.source_id as string | null) ?? null,
  };
}
