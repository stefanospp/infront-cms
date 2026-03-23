-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT NOT NULL UNIQUE,
  company_name    TEXT NOT NULL,
  company_website TEXT,
  contact_email   TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  country         TEXT NOT NULL,
  industry        TEXT NOT NULL,
  salary_range    TEXT,
  visa_support    TEXT NOT NULL DEFAULT 'no',
  relocation_pkg  TEXT NOT NULL DEFAULT 'no',
  working_language TEXT,
  apply_url       TEXT NOT NULL,
  is_live         INTEGER NOT NULL DEFAULT 0,
  stripe_session_id TEXT,
  created_at      INTEGER NOT NULL,
  activated_at    INTEGER,
  expires_at      INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_live ON jobs(is_live);
CREATE INDEX IF NOT EXISTS idx_jobs_country ON jobs(country);
CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs(industry);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS jobs_fts USING fts5(
  title,
  company_name,
  description,
  country,
  industry,
  content='jobs',
  content_rowid='id'
);

-- Triggers to keep FTS in sync with jobs table
CREATE TRIGGER IF NOT EXISTS jobs_fts_insert AFTER INSERT ON jobs BEGIN
  INSERT INTO jobs_fts(rowid, title, company_name, description, country, industry)
  VALUES (new.id, new.title, new.company_name, new.description, new.country, new.industry);
END;

CREATE TRIGGER IF NOT EXISTS jobs_fts_delete AFTER DELETE ON jobs BEGIN
  INSERT INTO jobs_fts(jobs_fts, rowid, title, company_name, description, country, industry)
  VALUES ('delete', old.id, old.title, old.company_name, old.description, old.country, old.industry);
END;

CREATE TRIGGER IF NOT EXISTS jobs_fts_update AFTER UPDATE ON jobs BEGIN
  INSERT INTO jobs_fts(jobs_fts, rowid, title, company_name, description, country, industry)
  VALUES ('delete', old.id, old.title, old.company_name, old.description, old.country, old.industry);
  INSERT INTO jobs_fts(rowid, title, company_name, description, country, industry)
  VALUES (new.id, new.title, new.company_name, new.description, new.country, new.industry);
END;
