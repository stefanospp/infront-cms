import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const jobs = sqliteTable('jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),

  // Company
  companyName: text('company_name').notNull(),
  companyWebsite: text('company_website'),
  contactEmail: text('contact_email').notNull(),

  // Job
  title: text('title').notNull(),
  description: text('description').notNull(),
  country: text('country').notNull(),
  industry: text('industry').notNull(),
  salaryRange: text('salary_range'),

  // Relocation
  visaSupport: text('visa_support', { enum: ['yes', 'no', 'partial'] }).notNull().default('no'),
  relocationPkg: text('relocation_pkg', { enum: ['yes', 'no', 'allowance_only'] }).notNull().default('no'),
  workingLanguage: text('working_language'),

  // Application
  applyUrl: text('apply_url').notNull(),

  // Status
  isLive: integer('is_live').notNull().default(0),
  stripeSessionId: text('stripe_session_id'),

  // Timestamps (unix seconds)
  createdAt: integer('created_at').notNull(),
  activatedAt: integer('activated_at'),
  expiresAt: integer('expires_at'),
}, (table) => [
  index('idx_jobs_live').on(table.isLive),
  index('idx_jobs_country').on(table.country),
  index('idx_jobs_industry').on(table.industry),
  index('idx_jobs_created').on(table.createdAt),
]);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
