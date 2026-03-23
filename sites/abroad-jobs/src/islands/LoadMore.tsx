import { useState, useCallback } from 'react';

interface Job {
  id: number;
  slug: string;
  title: string;
  companyName: string;
  country: string;
  industry: string;
  salaryRange: string | null;
  visaSupport: string;
  relocationPkg: string;
  workingLanguage: string | null;
  createdAt: number;
}

interface Props {
  query?: string;
  country?: string;
  industry?: string;
  initialPage: number;
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp * 1000;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function visaLabel(v: string): string | null {
  if (v === 'yes') return 'Visa sponsored';
  if (v === 'partial') return 'Visa (partial)';
  return null;
}

function relocationLabel(v: string): string | null {
  if (v === 'yes') return 'Relocation';
  if (v === 'allowance_only') return 'Relo allowance';
  return null;
}

export default function LoadMore({ query = '', country = '', industry = '', initialPage }: Props) {
  const [page, setPage] = useState(initialPage + 1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (country) params.set('country', country);
    if (industry) params.set('industry', industry);
    params.set('page', String(page));

    try {
      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      setJobs((prev) => [...prev, ...data.jobs]);
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [page, query, country, industry]);

  return (
    <div>
      {/* Newly loaded jobs */}
      {jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <a
              key={job.id}
              href={`/jobs/${job.slug}`}
              className="group block rounded-lg border border-neutral-200 bg-white px-4 py-4 transition-all hover:border-neutral-300 hover:shadow-sm sm:px-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                    {job.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {job.companyName}
                    <span className="mx-1.5 text-neutral-300">&middot;</span>
                    {job.country}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs sm:flex-col sm:items-end sm:gap-1.5">
                  <span className="text-neutral-400">{getTimeAgo(job.createdAt)}</span>
                  {job.salaryRange && (
                    <span className="font-medium text-neutral-600">{job.salaryRange}</span>
                  )}
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                  {job.industry}
                </span>
                {visaLabel(job.visaSupport) && (
                  <span className="inline-flex items-center rounded-md bg-secondary-50 px-2 py-0.5 text-xs text-secondary-700">
                    {visaLabel(job.visaSupport)}
                  </span>
                )}
                {relocationLabel(job.relocationPkg) && (
                  <span className="inline-flex items-center rounded-md bg-accent-50 px-2 py-0.5 text-xs text-accent-700">
                    {relocationLabel(job.relocationPkg)}
                  </span>
                )}
                {job.workingLanguage && (
                  <span className="inline-flex items-center rounded-md bg-neutral-50 px-2 py-0.5 text-xs text-neutral-500">
                    {job.workingLanguage}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Load more button */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Load more jobs'}
          </button>
        </div>
      )}
    </div>
  );
}
