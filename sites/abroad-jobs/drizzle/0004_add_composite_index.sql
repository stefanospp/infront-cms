CREATE INDEX IF NOT EXISTS idx_jobs_live_country_industry ON jobs(is_live, country, industry, created_at);
