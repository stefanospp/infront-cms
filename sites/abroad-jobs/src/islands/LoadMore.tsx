import { useState, useCallback } from 'react';

interface Job {
  id: number;
  slug: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  companyLogo: string | null;
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

const COUNTRY_CODES: Record<string, string> = {
  'germany': 'de', 'netherlands': 'nl', 'portugal': 'pt', 'spain': 'es',
  'switzerland': 'ch', 'sweden': 'se', 'denmark': 'dk', 'norway': 'no',
  'estonia': 'ee', 'united arab emirates': 'ae', 'qatar': 'qa', 'japan': 'jp',
  'singapore': 'sg', 'australia': 'au', 'maldives': 'mv', 'united kingdom': 'gb',
  'france': 'fr', 'italy': 'it', 'ireland': 'ie', 'canada': 'ca',
  'united states': 'us', 'finland': 'fi', 'belgium': 'be', 'austria': 'at',
  'poland': 'pl', 'czech republic': 'cz', 'greece': 'gr', 'cyprus': 'cy',
  'india': 'in', 'china': 'cn', 'south korea': 'kr', 'brazil': 'br',
};

function getFlagUrl(country: string): string | null {
  const code = COUNTRY_CODES[country.toLowerCase().trim()];
  return code ? `https://flagcdn.com/w40/${code}.png` : null;
}

function getLogoUrl(job: Job): string | null {
  if (job.companyLogo) return job.companyLogo;
  if (!job.companyWebsite) return null;
  try {
    const domain = new URL(job.companyWebsite).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
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
      {jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => {
            const flag = getFlagUrl(job.country);
            const logo = getLogoUrl(job);
            return (
              <a
                key={job.id}
                href={`/jobs/${job.slug}`}
                className="group block rounded-2xl border border-neutral-200/80 bg-white px-6 py-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md sm:px-7 sm:py-6"
              >
                <div className="flex gap-4 sm:gap-5">
                  {/* Logo */}
                  <div className="hidden shrink-0 sm:block">
                    {logo ? (
                      <img src={logo} alt="" width={48} height={48} className="h-12 w-12 rounded-xl border border-neutral-100 bg-white object-contain p-1" loading="lazy" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50 text-lg font-bold text-neutral-300">
                        {job.companyName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-neutral-900 group-hover:text-primary-600 transition-colors sm:text-xl">
                          {job.title}
                        </h2>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500 sm:text-base">
                          <span className="font-medium text-neutral-700">{job.companyName}</span>
                          <span className="text-neutral-300">&middot;</span>
                          {flag && <img src={flag} alt="" width={20} height={15} className="inline-block h-3.5 w-auto rounded-sm" loading="lazy" />}
                          {job.country}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                        {job.salaryRange && (
                          <span className="text-sm font-semibold text-neutral-800">{job.salaryRange}</span>
                        )}
                        <span className="text-xs text-neutral-400">{getTimeAgo(job.createdAt)}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                        {job.industry}
                      </span>
                      {visaLabel(job.visaSupport) && (
                        <span className="inline-flex items-center rounded-full bg-secondary-50 px-3 py-1 text-xs font-medium text-secondary-700">
                          {visaLabel(job.visaSupport)}
                        </span>
                      )}
                      {relocationLabel(job.relocationPkg) && (
                        <span className="inline-flex items-center rounded-full bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700">
                          {relocationLabel(job.relocationPkg)}
                        </span>
                      )}
                      {job.workingLanguage && (
                        <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600">
                          {job.workingLanguage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

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
