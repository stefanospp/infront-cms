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
  await db.run(sql`CREATE TABLE \`courses_topics\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`topic\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`courses_topics_order_idx\` ON \`courses_topics\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`courses_topics_parent_id_idx\` ON \`courses_topics\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`courses_what_you_get\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`item\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`courses_what_you_get_order_idx\` ON \`courses_what_you_get\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`courses_what_you_get_parent_id_idx\` ON \`courses_what_you_get\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`courses\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`full_description\` text,
  	\`dates\` text NOT NULL,
  	\`subject\` text NOT NULL,
  	\`level\` text NOT NULL,
  	\`season\` text NOT NULL,
  	\`exam_board\` text NOT NULL,
  	\`class_size\` text,
  	\`duration\` text,
  	\`schedule\` text,
  	\`color\` text DEFAULT '#fff33b',
  	\`status\` text DEFAULT 'coming-soon' NOT NULL,
  	\`price\` text,
  	\`price_note\` text,
  	\`order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`courses_slug_idx\` ON \`courses\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`courses_updated_at_idx\` ON \`courses\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`courses_created_at_idx\` ON \`courses\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`courses_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`schools_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`schools_id\`) REFERENCES \`schools\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`courses_rels_order_idx\` ON \`courses_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`courses_rels_parent_idx\` ON \`courses_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`courses_rels_path_idx\` ON \`courses_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`courses_rels_schools_id_idx\` ON \`courses_rels\` (\`schools_id\`);`)
  await db.run(sql`CREATE TABLE \`subjects_levels_exam_boards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`board\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`subjects_levels\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`subjects_levels_exam_boards_order_idx\` ON \`subjects_levels_exam_boards\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`subjects_levels_exam_boards_parent_id_idx\` ON \`subjects_levels_exam_boards\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`subjects_levels_topics\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`topic\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`subjects_levels\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`subjects_levels_topics_order_idx\` ON \`subjects_levels_topics\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`subjects_levels_topics_parent_id_idx\` ON \`subjects_levels_topics\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`subjects_levels\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`subjects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`subjects_levels_order_idx\` ON \`subjects_levels\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`subjects_levels_parent_id_idx\` ON \`subjects_levels\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`subjects_why_study\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`reason\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`subjects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`subjects_why_study_order_idx\` ON \`subjects_why_study\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`subjects_why_study_parent_id_idx\` ON \`subjects_why_study\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`subjects\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`code\` text NOT NULL,
  	\`color\` text DEFAULT '#fff33b',
  	\`tagline\` text,
  	\`full_description\` text,
  	\`order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`subjects_slug_idx\` ON \`subjects\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`subjects_updated_at_idx\` ON \`subjects\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`subjects_created_at_idx\` ON \`subjects\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`schools_levels\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`filled\` integer DEFAULT false,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`schools\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`schools_levels_order_idx\` ON \`schools_levels\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`schools_levels_parent_id_idx\` ON \`schools_levels\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`schools\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`location\` text NOT NULL,
  	\`exam_boards\` text NOT NULL,
  	\`order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`schools_updated_at_idx\` ON \`schools\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`schools_created_at_idx\` ON \`schools\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`resources\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`subject\` text NOT NULL,
  	\`level\` text NOT NULL,
  	\`type\` text NOT NULL,
  	\`exam_board\` text NOT NULL,
  	\`file_id\` integer,
  	\`file_size\` text,
  	\`url\` text,
  	\`color\` text DEFAULT '#fff33b',
  	\`status\` text DEFAULT 'coming-soon' NOT NULL,
  	\`order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`resources_slug_idx\` ON \`resources\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`resources_file_idx\` ON \`resources\` (\`file_id\`);`)
  await db.run(sql`CREATE INDEX \`resources_updated_at_idx\` ON \`resources\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`resources_created_at_idx\` ON \`resources\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`university_exams_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`description\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`university_exams\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`university_exams_sections_order_idx\` ON \`university_exams_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`university_exams_sections_parent_id_idx\` ON \`university_exams_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`university_exams_what_we_offer\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`item\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`university_exams\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`university_exams_what_we_offer_order_idx\` ON \`university_exams_what_we_offer\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`university_exams_what_we_offer_parent_id_idx\` ON \`university_exams_what_we_offer\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`university_exams\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`short_name\` text NOT NULL,
  	\`region\` text NOT NULL,
  	\`description\` text NOT NULL,
  	\`full_description\` text,
  	\`color\` text DEFAULT '#a8e8ff',
  	\`for_who\` text,
  	\`timeline\` text,
  	\`order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`university_exams_slug_idx\` ON \`university_exams\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`university_exams_updated_at_idx\` ON \`university_exams\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`university_exams_created_at_idx\` ON \`university_exams\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`faqs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`question\` text NOT NULL,
  	\`answer\` text NOT NULL,
  	\`order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`faqs_updated_at_idx\` ON \`faqs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`faqs_created_at_idx\` ON \`faqs\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`submissions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`contact\` text NOT NULL,
  	\`school\` text,
  	\`message\` text NOT NULL,
  	\`status\` text DEFAULT 'new',
  	\`metadata_ip\` text,
  	\`metadata_user_agent\` text,
  	\`metadata_spam\` integer DEFAULT false,
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
  	\`courses_id\` integer,
  	\`subjects_id\` integer,
  	\`schools_id\` integer,
  	\`resources_id\` integer,
  	\`university_exams_id\` integer,
  	\`faqs_id\` integer,
  	\`submissions_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`courses_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`subjects_id\`) REFERENCES \`subjects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`schools_id\`) REFERENCES \`schools\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`resources_id\`) REFERENCES \`resources\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`university_exams_id\`) REFERENCES \`university_exams\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faqs_id\`) REFERENCES \`faqs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`submissions_id\`) REFERENCES \`submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_courses_id_idx\` ON \`payload_locked_documents_rels\` (\`courses_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_subjects_id_idx\` ON \`payload_locked_documents_rels\` (\`subjects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_schools_id_idx\` ON \`payload_locked_documents_rels\` (\`schools_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_resources_id_idx\` ON \`payload_locked_documents_rels\` (\`resources_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_university_exams_id_idx\` ON \`payload_locked_documents_rels\` (\`university_exams_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_faqs_id_idx\` ON \`payload_locked_documents_rels\` (\`faqs_id\`);`)
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
  await db.run(sql`CREATE TABLE \`site_settings_nav_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`href\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_settings_nav_links_order_idx\` ON \`site_settings_nav_links\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_nav_links_parent_id_idx\` ON \`site_settings_nav_links\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`site_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_name\` text DEFAULT 'Theorium' NOT NULL,
  	\`tagline\` text DEFAULT 'Private Science Tutoring',
  	\`cta_label\` text DEFAULT 'Get in touch',
  	\`cta_href\` text DEFAULT '/contact',
  	\`contact_email\` text DEFAULT 'theodora@theorium.cy',
  	\`contact_phone\` text,
  	\`contact_whatsapp\` text,
  	\`contact_viber\` text,
  	\`contact_location\` text DEFAULT 'Larnaca, Cyprus',
  	\`contact_response_time\` text DEFAULT 'Usually replies within 2 hours',
  	\`footer_builder_name\` text DEFAULT 'infront.cy',
  	\`footer_builder_link\` text DEFAULT 'https://infront.cy',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`home_sections_hero_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_sections_hero_stats_order_idx\` ON \`home_sections_hero_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_sections_hero_stats_parent_id_idx\` ON \`home_sections_hero_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`home_sections_why_features\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`description\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_sections_why_features_order_idx\` ON \`home_sections_why_features\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_sections_why_features_parent_id_idx\` ON \`home_sections_why_features\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`home_sections_how_it_works_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`number\` text NOT NULL,
  	\`title\` text NOT NULL,
  	\`description\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_sections_how_it_works_steps_order_idx\` ON \`home_sections_how_it_works_steps\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_sections_how_it_works_steps_parent_id_idx\` ON \`home_sections_how_it_works_steps\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`home_sections_exam_periods\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`dates\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`home_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`home_sections_exam_periods_order_idx\` ON \`home_sections_exam_periods\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`home_sections_exam_periods_parent_id_idx\` ON \`home_sections_exam_periods\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`home_sections\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`hero_badge\` text DEFAULT 'In-Person in Larnaca · Online Europe-Wide',
  	\`hero_heading\` text DEFAULT 'SCIENCE.',
  	\`hero_heading_highlight\` text DEFAULT 'EVERY LEVEL.',
  	\`hero_subheading\` text,
  	\`hero_cta_text\` text DEFAULT 'View Courses',
  	\`hero_cta_href\` text DEFAULT '/courses',
  	\`why_heading\` text DEFAULT 'Why Theorium.',
  	\`why_description\` text,
  	\`how_it_works_heading\` text DEFAULT 'How It Works.',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE \`pages_about_stats\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text NOT NULL,
  	\`label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_about_stats_order_idx\` ON \`pages_about_stats\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_about_stats_parent_id_idx\` ON \`pages_about_stats\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_about_qualifications\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`institution\` text NOT NULL,
  	\`year\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_about_qualifications_order_idx\` ON \`pages_about_qualifications\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_about_qualifications_parent_id_idx\` ON \`pages_about_qualifications\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_about_philosophy\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`description\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_about_philosophy_order_idx\` ON \`pages_about_philosophy\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_about_philosophy_parent_id_idx\` ON \`pages_about_philosophy\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_privacy_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`body\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_privacy_sections_order_idx\` ON \`pages_privacy_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_privacy_sections_parent_id_idx\` ON \`pages_privacy_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages_terms_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`body\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_terms_sections_order_idx\` ON \`pages_terms_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_terms_sections_parent_id_idx\` ON \`pages_terms_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`about_bio\` text,
  	\`about_photo_id\` integer,
  	\`about_cta_text\` text DEFAULT 'Get In Touch',
  	\`privacy_last_updated\` text,
  	\`terms_last_updated\` text,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`about_photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`pages_about_about_photo_idx\` ON \`pages\` (\`about_photo_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_sessions\`;`)
  await db.run(sql`DROP TABLE \`users\`;`)
  await db.run(sql`DROP TABLE \`media\`;`)
  await db.run(sql`DROP TABLE \`courses_topics\`;`)
  await db.run(sql`DROP TABLE \`courses_what_you_get\`;`)
  await db.run(sql`DROP TABLE \`courses\`;`)
  await db.run(sql`DROP TABLE \`courses_rels\`;`)
  await db.run(sql`DROP TABLE \`subjects_levels_exam_boards\`;`)
  await db.run(sql`DROP TABLE \`subjects_levels_topics\`;`)
  await db.run(sql`DROP TABLE \`subjects_levels\`;`)
  await db.run(sql`DROP TABLE \`subjects_why_study\`;`)
  await db.run(sql`DROP TABLE \`subjects\`;`)
  await db.run(sql`DROP TABLE \`schools_levels\`;`)
  await db.run(sql`DROP TABLE \`schools\`;`)
  await db.run(sql`DROP TABLE \`resources\`;`)
  await db.run(sql`DROP TABLE \`university_exams_sections\`;`)
  await db.run(sql`DROP TABLE \`university_exams_what_we_offer\`;`)
  await db.run(sql`DROP TABLE \`university_exams\`;`)
  await db.run(sql`DROP TABLE \`faqs\`;`)
  await db.run(sql`DROP TABLE \`submissions\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences\`;`)
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_migrations\`;`)
  await db.run(sql`DROP TABLE \`site_settings_nav_links\`;`)
  await db.run(sql`DROP TABLE \`site_settings\`;`)
  await db.run(sql`DROP TABLE \`home_sections_hero_stats\`;`)
  await db.run(sql`DROP TABLE \`home_sections_why_features\`;`)
  await db.run(sql`DROP TABLE \`home_sections_how_it_works_steps\`;`)
  await db.run(sql`DROP TABLE \`home_sections_exam_periods\`;`)
  await db.run(sql`DROP TABLE \`home_sections\`;`)
  await db.run(sql`DROP TABLE \`pages_about_stats\`;`)
  await db.run(sql`DROP TABLE \`pages_about_qualifications\`;`)
  await db.run(sql`DROP TABLE \`pages_about_philosophy\`;`)
  await db.run(sql`DROP TABLE \`pages_privacy_sections\`;`)
  await db.run(sql`DROP TABLE \`pages_terms_sections\`;`)
  await db.run(sql`DROP TABLE \`pages\`;`)
}
