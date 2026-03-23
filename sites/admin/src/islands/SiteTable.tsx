import { useState, useEffect } from 'react';

interface SiteInfo {
  slug: string;
  name: string;
  domain: string;
  tier: 'static' | 'cms';
  lastModified: string;
  isTemplate: boolean;
  deployStatus?: 'pending' | 'building' | 'deploying' | 'live' | 'failed' | null;
  stagingUrl?: string;
  productionUrl?: string;
  lastDeployAt?: string;
}

type LoadState = 'loading' | 'loaded' | 'error';

const tierBadge: Record<string, { bg: string; text: string; label: string }> = {
  static: { bg: 'bg-neutral-100', text: 'text-neutral-700', label: 'Static' },
  cms: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'CMS' },
};

const deployStatusBadge: Record<string, { bg: string; text: string; label: string; pulse?: boolean }> = {
  live: { bg: 'bg-green-100', text: 'text-green-700', label: 'Live' },
  building: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Building', pulse: true },
  deploying: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Deploying', pulse: true },
  pending: { bg: 'bg-neutral-100', text: 'text-neutral-500', label: 'Pending' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
};

const defaultDeployBadge: { bg: string; text: string; label: string; pulse?: boolean } = { bg: 'bg-neutral-100', text: 'text-neutral-400', label: 'Not deployed' };

export default function SiteTable() {
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    fetch('/api/sites')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: SiteInfo[]) => {
        setSites(data);
        setState('loaded');
      })
      .catch(() => {
        setState('error');
      });
  }, []);

  if (state === 'loading') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600" />
        <p className="mt-3 text-sm text-neutral-500">Loading sites...</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
        <p className="text-sm text-red-500">
          Failed to load sites. Please try again.
        </p>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-neutral-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
          />
        </svg>
        <h3 className="mt-4 text-sm font-semibold text-neutral-900">
          No sites yet
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          Get started by creating a new site from a template.
        </p>
        <div className="mt-6">
          <a
            href="/sites/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Site
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">All Sites</h2>
        <a
          href="/sites/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Site
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="text-left px-6 py-3 font-medium text-neutral-500">
                Name
              </th>
              <th className="text-left px-6 py-3 font-medium text-neutral-500">
                Domain
              </th>
              <th className="text-left px-6 py-3 font-medium text-neutral-500">
                Tier
              </th>
              <th className="text-left px-6 py-3 font-medium text-neutral-500">
                Status
              </th>
              <th className="text-left px-6 py-3 font-medium text-neutral-500">
                URL
              </th>
              <th className="text-right px-6 py-3 font-medium text-neutral-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {sites.map((site) => {
              const badge = tierBadge[site.tier] ?? tierBadge.static;
              const dBadge = site.deployStatus
                ? deployStatusBadge[site.deployStatus] ?? defaultDeployBadge
                : defaultDeployBadge;
              const siteUrl = site.productionUrl || site.stagingUrl;
              return (
                <tr
                  key={site.slug}
                  className="hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-900">
                        {site.name}
                      </span>
                      {site.isTemplate && (
                        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                          Template
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    {site.domain || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${dBadge.bg} ${dBadge.text} ${dBadge.pulse ? 'animate-pulse' : ''}`}
                    >
                      {dBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {siteUrl ? (
                      <a
                        href={siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-sm underline truncate max-w-[200px] inline-block"
                      >
                        {siteUrl.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/sites/${site.slug}`}
                        className="text-primary-600 hover:text-primary-700 font-medium transition-colors text-sm"
                      >
                        Manage
                      </a>
                      {siteUrl && (
                        <a
                          href={siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-400 hover:text-neutral-600 transition-colors"
                          title="Open site in new tab"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
