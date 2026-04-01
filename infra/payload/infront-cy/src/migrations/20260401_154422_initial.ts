import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`role\` text DEFAULT 'editor' NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric
  );
  `)
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE TABLE \`faq\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`question\` text NOT NULL,
  	\`answer\` text NOT NULL,
  	\`active\` integer DEFAULT true,
  	\`display_order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`faq_updated_at_idx\` ON \`faq\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`faq_created_at_idx\` ON \`faq\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`testimonials\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`quote\` text NOT NULL,
  	\`role\` text NOT NULL,
  	\`industry\` text,
  	\`city\` text,
  	\`rating\` numeric,
  	\`active\` integer DEFAULT true,
  	\`display_order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`testimonials_updated_at_idx\` ON \`testimonials\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`testimonials_created_at_idx\` ON \`testimonials\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`services\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text,
  	\`description\` text,
  	\`icon\` text,
  	\`active\` integer DEFAULT true,
  	\`display_order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`services_slug_idx\` ON \`services\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`services_updated_at_idx\` ON \`services\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`services_created_at_idx\` ON \`services\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`service_pages_pain_points\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`icon\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`service_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`service_pages_pain_points_order_idx\` ON \`service_pages_pain_points\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`service_pages_pain_points_parent_id_idx\` ON \`service_pages_pain_points\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`service_pages_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`icon\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`service_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`service_pages_features_order_idx\` ON \`service_pages_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`service_pages_features_parent_id_idx\` ON \`service_pages_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`service_pages_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text NOT NULL,
  	\`answer\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`service_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`service_pages_faq_order_idx\` ON \`service_pages_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`service_pages_faq_parent_id_idx\` ON \`service_pages_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`service_pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`hero_heading\` text,
  	\`hero_description\` text,
  	\`cta_heading\` text,
  	\`cta_description\` text,
  	\`status\` text DEFAULT 'draft',
  	\`display_order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`service_pages_slug_idx\` ON \`service_pages\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`service_pages_updated_at_idx\` ON \`service_pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`service_pages_created_at_idx\` ON \`service_pages\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`articles_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`articles_tags_order_idx\` ON \`articles_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`articles_tags_parent_id_idx\` ON \`articles_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`articles\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`excerpt\` text,
  	\`content\` text,
  	\`cover_image_id\` integer,
  	\`category\` text,
  	\`published_at\` text,
  	\`status\` text DEFAULT 'draft',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`cover_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`articles_slug_idx\` ON \`articles\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`articles_cover_image_idx\` ON \`articles\` (\`cover_image_id\`);`)
  await db.run(sql`CREATE INDEX \`articles_updated_at_idx\` ON \`articles\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`articles_created_at_idx\` ON \`articles\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`portfolio_results\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`metric\` text NOT NULL,
  	\`label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`portfolio\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`portfolio_results_order_idx\` ON \`portfolio_results\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`portfolio_results_parent_id_idx\` ON \`portfolio_results\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`portfolio_tech_stack\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`portfolio\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`portfolio_tech_stack_order_idx\` ON \`portfolio_tech_stack\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`portfolio_tech_stack_parent_id_idx\` ON \`portfolio_tech_stack\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`portfolio\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`url\` text,
  	\`description\` text,
  	\`screenshot_id\` integer,
  	\`challenge\` text,
  	\`approach\` text,
  	\`active\` integer DEFAULT true,
  	\`display_order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`screenshot_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`portfolio_slug_idx\` ON \`portfolio\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`portfolio_screenshot_idx\` ON \`portfolio\` (\`screenshot_id\`);`)
  await db.run(sql`CREATE INDEX \`portfolio_updated_at_idx\` ON \`portfolio\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`portfolio_created_at_idx\` ON \`portfolio\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`industry_pages_problems\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text NOT NULL,
  	\`description\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`industry_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`industry_pages_problems_order_idx\` ON \`industry_pages_problems\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`industry_pages_problems_parent_id_idx\` ON \`industry_pages_problems\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`industry_pages_services\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`slug\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`industry_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`industry_pages_services_order_idx\` ON \`industry_pages_services\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`industry_pages_services_parent_id_idx\` ON \`industry_pages_services\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`industry_pages_faq\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text NOT NULL,
  	\`answer\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`industry_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`industry_pages_faq_order_idx\` ON \`industry_pages_faq\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`industry_pages_faq_parent_id_idx\` ON \`industry_pages_faq\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`industry_pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`hero_heading\` text,
  	\`hero_description\` text,
  	\`card_description\` text,
  	\`cta_heading\` text,
  	\`cta_description\` text,
  	\`status\` text DEFAULT 'draft',
  	\`display_order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`industry_pages_slug_idx\` ON \`industry_pages\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`industry_pages_updated_at_idx\` ON \`industry_pages\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`industry_pages_created_at_idx\` ON \`industry_pages\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`submissions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`business\` text,
  	\`email\` text NOT NULL,
  	\`phone\` text,
  	\`service\` text,
  	\`message\` text,
  	\`gdpr_consent\` integer DEFAULT false NOT NULL,
  	\`ip_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`submissions_updated_at_idx\` ON \`submissions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`submissions_created_at_idx\` ON \`submissions\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`faq_id\` integer,
  	\`testimonials_id\` integer,
  	\`services_id\` integer,
  	\`service_pages_id\` integer,
  	\`articles_id\` integer,
  	\`portfolio_id\` integer,
  	\`industry_pages_id\` integer,
  	\`submissions_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_id\`) REFERENCES \`faq\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`testimonials_id\`) REFERENCES \`testimonials\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`services_id\`) REFERENCES \`services\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`service_pages_id\`) REFERENCES \`service_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`portfolio_id\`) REFERENCES \`portfolio\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`industry_pages_id\`) REFERENCES \`industry_pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`submissions_id\`) REFERENCES \`submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_faq_id_idx\` ON \`payload_locked_documents_rels\` (\`faq_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_testimonials_id_idx\` ON \`payload_locked_documents_rels\` (\`testimonials_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_services_id_idx\` ON \`payload_locked_documents_rels\` (\`services_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_service_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`service_pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`articles_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_portfolio_id_idx\` ON \`payload_locked_documents_rels\` (\`portfolio_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_industry_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`industry_pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`submissions_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`site_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_name\` text DEFAULT 'infront.cy',
  	\`tagline\` text,
  	\`contact_email\` text DEFAULT 'hello@infront.cy',
  	\`contact_phone\` text,
  	\`contact_address\` text DEFAULT 'Larnaca, Cyprus',
  	\`social_linkedin\` text,
  	\`social_facebook\` text,
  	\`social_instagram\` text,
  	\`social_twitter\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`faq\`;`)
  await db.run(sql`DROP TABLE \`testimonials\`;`)
  await db.run(sql`DROP TABLE \`services\`;`)
  await db.run(sql`DROP TABLE \`service_pages_pain_points\`;`)
  await db.run(sql`DROP TABLE \`service_pages_features\`;`)
  await db.run(sql`DROP TABLE \`service_pages_faq\`;`)
  await db.run(sql`DROP TABLE \`service_pages\`;`)
  await db.run(sql`DROP TABLE \`articles_tags\`;`)
  await db.run(sql`DROP TABLE \`articles\`;`)
  await db.run(sql`DROP TABLE \`portfolio_results\`;`)
  await db.run(sql`DROP TABLE \`portfolio_tech_stack\`;`)
  await db.run(sql`DROP TABLE \`portfolio\`;`)
  await db.run(sql`DROP TABLE \`industry_pages_problems\`;`)
  await db.run(sql`DROP TABLE \`industry_pages_services\`;`)
  await db.run(sql`DROP TABLE \`industry_pages_faq\`;`)
  await db.run(sql`DROP TABLE \`industry_pages\`;`)
  await db.run(sql`DROP TABLE \`submissions\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`site_settings\`;`)
}
