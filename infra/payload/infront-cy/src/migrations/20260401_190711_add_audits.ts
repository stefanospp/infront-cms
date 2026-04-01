import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`audits\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`url\` text NOT NULL,
  	\`token\` text NOT NULL,
  	\`email\` text,
  	\`business_name\` text,
  	\`overall_score\` numeric,
  	\`grade\` text,
  	\`results\` text,
  	\`ip_hash\` text,
  	\`gdpr_consent\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`audits_token_idx\` ON \`audits\` (\`token\`);`)
  await db.run(sql`CREATE INDEX \`audits_updated_at_idx\` ON \`audits\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`audits_created_at_idx\` ON \`audits\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`audits_id\` integer REFERENCES audits(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_audits_id_idx\` ON \`payload_locked_documents_rels\` (\`audits_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`audits\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
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
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "faq_id", "testimonials_id", "services_id", "service_pages_id", "articles_id", "portfolio_id", "industry_pages_id", "submissions_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "faq_id", "testimonials_id", "services_id", "service_pages_id", "articles_id", "portfolio_id", "industry_pages_id", "submissions_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
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
}
