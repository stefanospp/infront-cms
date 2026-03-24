import { useState, useEffect } from 'react';

interface WorkerAnalytics {
  scriptName: string;
  requests: number;
  errors: number;
  subrequests: number;
  cpuTimeP50: number;
  cpuTimeP99: number;
}

interface AnalyticsSummary {
  period: string;
  totalRequests: number;
  totalErrors: number;
  workers: WorkerAnalytics[];
}

type Period = '24h' | '7d' | '30d';
type LoadState = 'loading' | 'loaded' | 'error';

const periods: { value: Period; label: string }[] = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function formatCpuTime(microseconds: number): string {
  const ms = microseconds / 1000;
  if (ms < 1) return `${microseconds.toFixed(0)}us`;
  return `${ms.toFixed(1)}ms`;
}

function formatErrorRate(errors: number, requests: number): string {
  if (requests === 0) return '0%';
  return `${((errors / requests) * 100).toFixed(2)}%`;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [period, setPeriod] = useState<Period>('24h');

  useEffect(() => {
    setState('loading');
    fetch(`/api/analytics?period=${period}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((json: AnalyticsSummary) => {
        setData(json);
        setState('loaded');
      })
      .catch(() => {
        setState('error');
      });
  }, [period]);

  if (state === 'loading') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600" />
        <p className="mt-3 text-sm text-neutral-500">Loading analytics...</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
        <p className="text-sm text-red-500">
          Failed to load analytics. Check that Cloudflare credentials are configured.
        </p>
        <button
          onClick={() => setPeriod(period)}
          className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const errorRate = formatErrorRate(data.totalErrors, data.totalRequests);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Workers Analytics</h2>
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <p className="text-sm font-medium text-neutral-500">Total Requests</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {formatNumber(data.totalRequests)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <p className="text-sm font-medium text-neutral-500">Total Errors</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {formatNumber(data.totalErrors)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <p className="text-sm font-medium text-neutral-500">Error Rate</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{errorRate}</p>
        </div>
      </div>

      {/* Workers table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {data.workers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-neutral-500">No worker data available for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Script Name</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Requests</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Errors</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Error Rate</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">CPU P50</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">CPU P99</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.workers.map((worker) => (
                  <tr key={worker.scriptName} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {worker.scriptName}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700 tabular-nums">
                      {formatNumber(worker.requests)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={worker.errors > 0 ? 'text-red-600' : 'text-neutral-700'}>
                        {formatNumber(worker.errors)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={worker.errors > 0 ? 'text-red-600' : 'text-neutral-700'}>
                        {formatErrorRate(worker.errors, worker.requests)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700 tabular-nums">
                      {formatCpuTime(worker.cpuTimeP50)}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700 tabular-nums">
                      {formatCpuTime(worker.cpuTimeP99)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
