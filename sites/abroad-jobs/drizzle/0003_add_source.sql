ALTER TABLE jobs ADD COLUMN source TEXT DEFAULT 'paid';
ALTER TABLE jobs ADD COLUMN source_id TEXT;
CREATE INDEX IF NOT EXISTS idx_jobs_source_id ON jobs(source_id);
