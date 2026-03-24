import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SiteInfo {
  slug: string;
  name: string;
  domain: string;
  tier: 'static' | 'cms';
  lastModified: string;
  isTemplate: boolean;
}

interface DeployMetadata {
  projectName: string;
  stagingUrl: string;
  productionUrl: string | null;
  workersDevUrl: string;
  lastDeployId: string | null;
  lastDeployAt: string | null;
  status: 'pending' | 'building' | 'deploying' | 'live' | 'failed';
  error: string | null;
  dnsRecordId: string | null;
}

interface VersionEntry {
  hash: string;
  shortHash: string;
  message: string;
  date: string;
  filesChanged: number;
}

interface ExportResult {
  type: 'source' | 'static';
  files: string[];
  downloadUrl?: string;
  message?: string;
}

type LoadState = 'loading' | 'loaded' | 'error';

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const statusBadge: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  pending: { bg: 'bg-neutral-100', text: 'text-neutral-700', label: 'Pending' },
  building: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Building' },
  deploying: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Deploying' },
  live: { bg: 'bg-green-100', text: 'text-green-700', label: 'Live' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
};

const tierBadge: Record<string, { bg: string; text: string; label: string }> = {
  static: { bg: 'bg-neutral-100', text: 'text-neutral-700', label: 'Static' },
  cms: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'CMS' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SiteDetail({ slug }: { slug: string }) {
  const [site, setSite] = useState<SiteInfo | null>(null);
  const [deploy, setDeploy] = useState<DeployMetadata | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [redeploying, setRedeploying] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<string[]>([]);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Export state
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState<'source' | 'static' | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Version history state
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [versionsExpanded, setVersionsExpanded] = useState(false);
  const [revertingHash, setRevertingHash] = useState<string | null>(null);

  // ---- Fetch helpers ----

  const fetchDeployStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/sites/${slug}/deploy-status`);
      if (res.ok) {
        const data: DeployMetadata = await res.json();
        setDeploy(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch deploy status:', err instanceof Error ? err.message : err);
    }
    return null;
  }, [slug]);

  const fetchVersions = useCallback(async () => {
    setVersionsLoading(true);
    setVersionsError(null);
    try {
      const res = await fetch(`/api/sites/${slug}/versions`);
      if (!res.ok) {
        const data = await res.json();
        setVersionsError(data.error ?? 'Failed to fetch versions');
        return;
      }
      const data: VersionEntry[] = await res.json();
      setVersions(data);
    } catch (err) {
      console.error('Failed to fetch versions:', err instanceof Error ? err.message : err);
      setVersionsError('Network error');
    } finally {
      setVersionsLoading(false);
    }
  }, [slug]);

  // ---- Initial load ----

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [sitesRes, deployData, overridesRes] = await Promise.all([
          fetch('/api/sites'),
          fetchDeployStatus(),
          fetch(`/api/sites/${slug}/overrides`).catch(() => null),
        ]);

        if (cancelled) return;

        if (!sitesRes.ok) throw new Error('Failed to fetch sites');
        const allSites: SiteInfo[] = await sitesRes.json();
        const match = allSites.find((s) => s.slug === slug) ?? null;
        setSite(match);
        setDeploy(deployData);

        if (overridesRes?.ok) {
          const data = await overridesRes.json();
          setOverrides(data.files ?? []);
        }

        setState('loaded');
      } catch (err) {
        console.error('Failed to load site details:', err instanceof Error ? err.message : err);
        if (!cancelled) setState('error');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, fetchDeployStatus]);

  // ---- Fetch versions on mount ----

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // ---- Polling cleanup ----

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ---- Close export dropdown on outside click ----

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---- Redeploy ----

  async function handleRedeploy() {
    setRedeploying(true);
    try {
      const res = await fetch(`/api/sites/${slug}/redeploy`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? 'Redeploy failed');
        setRedeploying(false);
        return;
      }

      // Start polling
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const data = await fetchDeployStatus();
        if (data && data.status !== 'building' && data.status !== 'deploying') {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setRedeploying(false);
        }
      }, 3000);
    } catch (err) {
      console.error('Failed to trigger redeploy:', err instanceof Error ? err.message : err);
      setRedeploying(false);
    }
  }

  // ---- Export site ----

  async function handleExport(type: 'source' | 'static') {
    setExportDropdownOpen(false);
    setExporting(type);
    setExportResult(null);
    setExportError(null);

    try {
      const res = await fetch(`/api/sites/${slug}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      const data = await res.json();

      if (!res.ok) {
        setExportError(data.error ?? 'Export failed');
      } else {
        setExportResult(data as ExportResult);
      }
    } catch (err) {
      console.error('Failed to export site:', err instanceof Error ? err.message : err);
      setExportError('Network error');
    } finally {
      setExporting(null);
    }
  }

  // ---- Revert version ----

  async function handleRevert(hash: string) {
    const shortHash = hash.substring(0, 7);
    if (
      !confirm(
        `Revert site to version ${shortHash}? This will create a new commit reverting all changes after this version.`
      )
    ) {
      return;
    }

    setRevertingHash(hash);
    try {
      const res = await fetch(`/api/sites/${slug}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revert', hash }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? 'Revert failed');
      } else {
        alert(data.message ?? `Successfully reverted to ${shortHash}`);
        await fetchVersions();
      }
    } catch (err) {
      console.error('Failed to revert:', err instanceof Error ? err.message : err);
      alert('Network error while reverting');
    } finally {
      setRevertingHash(null);
    }
  }

  // ---- Custom domain: Add ----

  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault();
    const domain = domainInput.trim();
    if (!domain) return;

    setDomainLoading(true);
    setDomainError(null);

    try {
      const res = await fetch(`/api/sites/${slug}/custom-domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDomainError(data.error ?? 'Failed to add domain');
      } else {
        setDomainInput('');
        await fetchDeployStatus();
      }
    } catch (err) {
      console.error('Failed to add custom domain:', err instanceof Error ? err.message : err);
      setDomainError('Network error');
    } finally {
      setDomainLoading(false);
    }
  }

  // ---- Custom domain: Remove ----

  async function handleRemoveDomain() {
    if (!deploy?.productionUrl) return;
    if (!confirm(`Remove custom domain "${deploy.productionUrl}"?`)) return;

    setDomainLoading(true);
    setDomainError(null);

    try {
      const res = await fetch(`/api/sites/${slug}/custom-domain`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: deploy.productionUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDomainError(data.error ?? 'Failed to remove domain');
      } else {
        await fetchDeployStatus();
      }
    } catch (err) {
      console.error('Failed to remove custom domain:', err instanceof Error ? err.message : err);
      setDomainError('Network error');
    } finally {
      setDomainLoading(false);
    }
  }

  // ---- Delete site ----

  async function handleDeleteSite() {
    if (deleteConfirmSlug !== slug) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/sites/${slug}/delete`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error ?? 'Failed to delete site');
        setDeleting(false);
        return;
      }

      window.location.href = '/?deleted=' + encodeURIComponent(slug);
    } catch (err) {
      console.error('Failed to delete site:', err instanceof Error ? err.message : err);
      setDeleteError('Network error');
      setDeleting(false);
    }
  }

  // ---- Render: Loading / Error ----

  if (state === 'loading') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600" />
        <p className="mt-3 text-sm text-neutral-500">Loading site details...</p>
      </div>
    );
  }

  if (state === 'error' || !site) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
        <p className="text-sm text-red-600">
          Failed to load site details. Please try again.
        </p>
        <a
          href="/"
          className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  // ---- Render: Loaded ----

  const badge = statusBadge[deploy?.status ?? 'pending'] ?? statusBadge.pending;
  const tier = tierBadge[site.tier] ?? tierBadge.static;
  const isInProgress =
    deploy?.status === 'building' || deploy?.status === 'deploying';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Back to dashboard"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </a>
            <h2 className="text-2xl font-semibold text-neutral-900">
              {site.name}
            </h2>
          </div>
          <p className="mt-1 text-sm text-neutral-500 ml-8">{site.slug}</p>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Site Info */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">
            Site Info
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Name</dt>
              <dd className="font-medium text-neutral-900">{site.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Domain</dt>
              <dd className="font-medium text-neutral-900">
                {site.domain || '---'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Tier</dt>
              <dd>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tier.bg} ${tier.text}`}
                >
                  {tier.label}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Template</dt>
              <dd className="font-medium text-neutral-900">
                {site.isTemplate ? 'Base Template' : site.slug}
              </dd>
            </div>
          </dl>
        </div>

        {/* Right column — Deployment */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">
            Deployment
          </h3>

          {!deploy ? (
            <p className="text-sm text-neutral-500">
              No deploy metadata found. This site has not been deployed yet.
            </p>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-neutral-500">Status</dt>
                <dd>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
                  >
                    {isInProgress && (
                      <span className="inline-block h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
                    )}
                    {badge.label}
                  </span>
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-neutral-500">Staging URL</dt>
                <dd>
                  {deploy.stagingUrl ? (
                    <a
                      href={`https://${deploy.stagingUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      {deploy.stagingUrl}
                    </a>
                  ) : (
                    <span className="text-neutral-400">Not set</span>
                  )}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-neutral-500">Production URL</dt>
                <dd>
                  {deploy.productionUrl ? (
                    <a
                      href={`https://${deploy.productionUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      {deploy.productionUrl}
                    </a>
                  ) : (
                    <span className="text-neutral-400">Not set</span>
                  )}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-neutral-500">Last Deployed</dt>
                <dd className="font-medium text-neutral-900">
                  {deploy.lastDeployAt
                    ? new Date(deploy.lastDeployAt).toLocaleString()
                    : '---'}
                </dd>
              </div>

              {deploy.error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-xs font-medium text-red-800">
                    Error: {deploy.error}
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <a
                  href={`/sites/${slug}/editor`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Pages
                </a>
                <button
                  onClick={handleRedeploy}
                  disabled={redeploying || isInProgress}
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {redeploying || isInProgress ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {deploy.status === 'building'
                        ? 'Building...'
                        : deploy.status === 'deploying'
                          ? 'Deploying...'
                          : 'Starting...'}
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Redeploy
                    </>
                  )}
                </button>

                {/* Export Site dropdown */}
                <div className="relative" ref={exportDropdownRef}>
                  <button
                    onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                    disabled={exporting !== null}
                    className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {exporting !== null ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Export Site
                        <svg
                          className={`h-3 w-3 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </>
                    )}
                  </button>

                  {exportDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg z-10">
                      <button
                        onClick={() => handleExport('source')}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 rounded-t-lg transition-colors"
                      >
                        <svg
                          className="h-4 w-4 text-neutral-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                          />
                        </svg>
                        Export Source
                      </button>
                      <button
                        onClick={() => handleExport('static')}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 rounded-b-lg border-t border-neutral-100 transition-colors"
                      >
                        <svg
                          className="h-4 w-4 text-neutral-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                          />
                        </svg>
                        Export Static
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </dl>
          )}
        </div>
      </div>

      {/* Export Result */}
      {(exportResult || exportError) && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">
              Export Result
            </h3>
            <button
              onClick={() => {
                setExportResult(null);
                setExportError(null);
              }}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {exportError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-medium text-red-800">{exportError}</p>
            </div>
          )}

          {exportResult && (
            <div>
              <p className="text-sm text-neutral-600 mb-3">
                {exportResult.type === 'source' ? 'Source' : 'Static'} export
                completed.
                {exportResult.message && ` ${exportResult.message}`}
              </p>

              {exportResult.downloadUrl && (
                <a
                  href={exportResult.downloadUrl}
                  download
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors mb-3"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Archive
                </a>
              )}

              {exportResult.files.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-neutral-500 mb-2">
                    {exportResult.files.length} file{exportResult.files.length !== 1 ? 's' : ''} included:
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                    <ul className="space-y-1">
                      {exportResult.files.map((file) => (
                        <li
                          key={file}
                          className="text-xs font-mono text-neutral-600"
                        >
                          {file}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Version History */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <button
          onClick={() => setVersionsExpanded(!versionsExpanded)}
          className="flex w-full items-center justify-between"
        >
          <h3 className="text-sm font-semibold text-neutral-900">
            Version History
          </h3>
          <svg
            className={`h-4 w-4 text-neutral-400 transition-transform ${versionsExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {versionsExpanded && (
          <div className="mt-4">
            {versionsLoading && (
              <div className="text-center py-4">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600" />
                <p className="mt-2 text-xs text-neutral-500">Loading versions...</p>
              </div>
            )}

            {versionsError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-xs font-medium text-red-800">{versionsError}</p>
              </div>
            )}

            {!versionsLoading && !versionsError && versions.length === 0 && (
              <p className="text-sm text-neutral-500 py-2">
                No version history available.
              </p>
            )}

            {!versionsLoading && versions.length > 0 && (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.hash}
                    className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono font-medium text-neutral-700">
                          {version.shortHash}
                        </code>
                        <span className="text-xs text-neutral-400">
                          {version.filesChanged} file{version.filesChanged !== 1 ? 's' : ''} changed
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-neutral-700 truncate">
                        {version.message}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {new Date(version.date).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevert(version.hash)}
                      disabled={revertingHash !== null}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {revertingHash === version.hash ? (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                          />
                        </svg>
                      )}
                      Revert
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!versionsLoading && versions.length > 0 && (
              <div className="mt-3 text-center">
                <button
                  onClick={fetchVersions}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Component Overrides */}
      {overrides.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">
            Custom Component Overrides
          </h3>
          <p className="text-xs text-neutral-500 mb-3">
            These components override the shared library versions for this site.
          </p>
          <div className="flex flex-wrap gap-2">
            {overrides.map((file) => (
              <span
                key={file}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-800"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {file}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom Domain section */}
      {deploy && (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">
            Custom Domain
          </h3>

          {domainError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-medium text-red-800">{domainError}</p>
            </div>
          )}

          {deploy.productionUrl ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {deploy.productionUrl}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Custom domain is active
                </p>
              </div>
              <button
                onClick={handleRemoveDomain}
                disabled={domainLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {domainLoading ? (
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                ) : (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
                Remove
              </button>
            </div>
          ) : (
            <div>
              <form onSubmit={handleAddDomain} className="flex gap-3">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="example.com"
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={domainLoading || !domainInput.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {domainLoading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : null}
                  Add Domain
                </button>
              </form>
              <p className="mt-3 text-xs text-neutral-500">
                Point your domain's DNS to your Cloudflare Workers URL
                {deploy.workersDevUrl ? (
                  <>
                    {' '}
                    (<code className="text-neutral-700">{deploy.workersDevUrl}</code>)
                  </>
                ) : null}{' '}
                using a CNAME record before adding it here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Danger Zone */}
      {!site.isTemplate && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <h3 className="text-sm font-semibold text-red-600 mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-neutral-600 mb-4">
            Permanently delete this site and all associated Cloudflare resources.
            This action cannot be undone.
          </p>

          {deleteError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-medium text-red-800">{deleteError}</p>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-sm text-neutral-700">
              Type <code className="font-mono font-semibold text-neutral-900">{slug}</code> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmSlug}
              onChange={(e) => setDeleteConfirmSlug(e.target.value)}
              placeholder={slug}
              disabled={deleting}
              className="w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors"
            />
            <div>
              <button
                onClick={handleDeleteSite}
                disabled={deleting || deleteConfirmSlug !== slug || isInProgress}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Site Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
