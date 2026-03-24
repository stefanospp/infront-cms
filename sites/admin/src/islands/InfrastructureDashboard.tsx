import { useState, useEffect } from 'react';

interface Container {
  id: string; name: string; image: string; status: string;
  state: 'running' | 'exited' | 'paused' | 'restarting' | 'dead';
  health: 'healthy' | 'unhealthy' | 'starting' | 'none';
  uptime: string; ports: string[];
  category: 'directus' | 'database' | 'auth' | 'admin' | 'proxy' | 'other';
  cpu: string; memory: string; memoryLimit: string;
  networkIn: string; networkOut: string;
}

interface InfraData {
  containers: Container[];
  disk: { total: string; used: string; available: string; percentUsed: number };
  costs: Array<{ name: string; monthlyCost: number; currency: string; notes: string }>;
  totalMonthlyCost: number;
  vps: { cpus: number; totalMemory: string; usedMemory: string; availableMemory: string };
}

interface WorkerAnalytics {
  scriptName: string; requests: number; errors: number;
  subrequests: number; cpuTimeP50: number; cpuTimeP99: number;
}

interface AnalyticsData {
  period: string; totalRequests: number; totalErrors: number;
  workers: WorkerAnalytics[];
}

type Period = '24h' | '7d' | '30d';
type LoadState = 'loading' | 'loaded' | 'error';

const periods: { value: Period; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
];

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

function cpuMs(microseconds: number): string {
  return (microseconds / 1000).toFixed(1);
}

function errorRate(errors: number, requests: number): string {
  if (requests === 0) return '0%';
  return `${((errors / requests) * 100).toFixed(2)}%`;
}

const stateColors: Record<string, string> = {
  running: 'bg-green-500',
  exited: 'bg-red-500',
  paused: 'bg-yellow-500',
  restarting: 'bg-yellow-500',
  dead: 'bg-red-500',
};

const healthBadge: Record<string, { bg: string; text: string }> = {
  healthy: { bg: 'bg-green-100', text: 'text-green-700' },
  unhealthy: { bg: 'bg-red-100', text: 'text-red-700' },
  starting: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  none: { bg: 'bg-neutral-100', text: 'text-neutral-500' },
};

function Spinner({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600" />
      <p className="mt-3 text-sm text-neutral-500">{label}</p>
    </div>
  );
}

function StatCard({ title, value, subtitle, accent }: {
  title: string; value: string; subtitle: string; accent?: 'green' | 'red' | 'neutral';
}) {
  const subtitleColor = accent === 'green' ? 'text-green-600' : accent === 'red' ? 'text-red-600' : 'text-neutral-500';
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
      <p className="text-sm font-medium text-neutral-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
      <p className={`mt-1 text-sm ${subtitleColor}`}>{subtitle}</p>
    </div>
  );
}

export default function InfrastructureDashboard() {
  const [infra, setInfra] = useState<InfraData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [period, setPeriod] = useState<Period>('24h');
  const [analyticsState, setAnalyticsState] = useState<LoadState>('loading');

  useEffect(() => {
    Promise.all([
      fetch('/api/infrastructure').then((r) => {
        if (!r.ok) throw new Error('infra');
        return r.json();
      }),
      fetch(`/api/analytics?period=${period}`).then((r) => {
        if (!r.ok) throw new Error('analytics');
        return r.json();
      }),
    ])
      .then(([infraData, analyticsData]: [InfraData, AnalyticsData]) => {
        setInfra(infraData);
        setAnalytics(analyticsData);
        setState('loaded');
        setAnalyticsState('loaded');
      })
      .catch(() => setState('error'));
  }, []);

  useEffect(() => {
    if (state !== 'loaded') return;
    setAnalyticsState('loading');
    fetch(`/api/analytics?period=${period}`)
      .then((r) => {
        if (!r.ok) throw new Error('analytics');
        return r.json();
      })
      .then((data: AnalyticsData) => {
        setAnalytics(data);
        setAnalyticsState('loaded');
      })
      .catch(() => setAnalyticsState('error'));
  }, [period]);

  if (state === 'loading') return <Spinner label="Loading infrastructure data..." />;

  if (state === 'error') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
        <p className="text-sm text-red-500">Failed to load infrastructure data.</p>
        <button onClick={() => window.location.reload()} className="mt-3 text-sm text-primary-600 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (!infra) return null;

  const runningCount = infra.containers.filter((c) => c.state === 'running').length;
  const totalCount = infra.containers.length;
  const allHealthy = infra.containers.every((c) => c.state === 'running' && (c.health === 'healthy' || c.health === 'none'));

  return (
    <div className="space-y-6">
      {/* Overview stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Cost"
          value={`\u20AC${infra.totalMonthlyCost.toFixed(2)}`}
          subtitle={allHealthy ? 'All services healthy' : 'Issues detected'}
          accent={allHealthy ? 'green' : 'red'}
        />
        <StatCard
          title="VPS"
          value={`${infra.vps.cpus} vCPU / ${infra.vps.totalMemory}`}
          subtitle={`Disk ${infra.disk.percentUsed}% used`}
          accent={infra.disk.percentUsed > 85 ? 'red' : 'neutral'}
        />
        <StatCard
          title="Containers"
          value={`${runningCount} / ${totalCount}`}
          subtitle={runningCount === totalCount ? 'All running' : `${totalCount - runningCount} stopped`}
          accent={runningCount === totalCount ? 'green' : 'red'}
        />
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-500">Workers Requests</p>
            <div className="flex gap-1">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                    period === p.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {analytics ? fmt(analytics.totalRequests) : '--'}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {analytics ? `${fmt(analytics.totalErrors)} errors` : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Docker Containers */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-900">Docker Containers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-neutral-500">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Health</th>
                <th className="px-6 py-3 font-medium">CPU</th>
                <th className="px-6 py-3 font-medium">Memory</th>
                <th className="px-6 py-3 font-medium">Network I/O</th>
                <th className="px-6 py-3 font-medium">Uptime</th>
              </tr>
            </thead>
            <tbody>
              {infra.containers.map((c) => {
                const hb = healthBadge[c.health] ?? healthBadge.none;
                return (
                  <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="px-6 py-3">
                      <div className="font-medium text-neutral-900">{c.name}</div>
                      <div className="text-xs text-neutral-400">{c.image}</div>
                      <div className="text-xs text-neutral-400 capitalize">{c.category}</div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`inline-block h-2 w-2 rounded-full ${stateColors[c.state] ?? 'bg-neutral-400'}`} />
                        <span className="capitalize text-neutral-700">{c.state}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${hb.bg} ${hb.text}`}>
                        {c.health}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-neutral-700">{c.cpu}</td>
                    <td className="px-6 py-3 text-neutral-700">
                      {c.memory} / {c.memoryLimit}
                    </td>
                    <td className="px-6 py-3 text-neutral-700">
                      {c.networkIn} / {c.networkOut}
                    </td>
                    <td className="px-6 py-3 text-neutral-700">{c.uptime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloudflare Workers */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Cloudflare Workers</h2>
          <div className="flex gap-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  period === p.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {analyticsState === 'loading' ? (
          <div className="p-8 text-center">
            <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600" />
          </div>
        ) : analyticsState === 'error' ? (
          <div className="p-8 text-center text-sm text-red-500">Failed to load worker analytics.</div>
        ) : analytics && analytics.workers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left text-neutral-500">
                  <th className="px-6 py-3 font-medium">Script Name</th>
                  <th className="px-6 py-3 font-medium text-right">Requests</th>
                  <th className="px-6 py-3 font-medium text-right">Errors</th>
                  <th className="px-6 py-3 font-medium text-right">Error Rate</th>
                  <th className="px-6 py-3 font-medium text-right">CPU P50 (ms)</th>
                  <th className="px-6 py-3 font-medium text-right">CPU P99 (ms)</th>
                </tr>
              </thead>
              <tbody>
                {analytics.workers.map((w) => (
                  <tr key={w.scriptName} className="border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="px-6 py-3 font-medium text-neutral-900">{w.scriptName}</td>
                    <td className="px-6 py-3 text-right text-neutral-700">{fmt(w.requests)}</td>
                    <td className="px-6 py-3 text-right text-neutral-700">{fmt(w.errors)}</td>
                    <td className="px-6 py-3 text-right text-neutral-700">{errorRate(w.errors, w.requests)}</td>
                    <td className="px-6 py-3 text-right text-neutral-700">{cpuMs(w.cpuTimeP50)}</td>
                    <td className="px-6 py-3 text-right text-neutral-700">{cpuMs(w.cpuTimeP99)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-neutral-500">No worker data available.</div>
        )}
      </div>

      {/* Monthly Costs */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-900">Monthly Costs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-neutral-500">
                <th className="px-6 py-3 font-medium">Item</th>
                <th className="px-6 py-3 font-medium text-right">Monthly Cost</th>
                <th className="px-6 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {infra.costs.map((c) => (
                <tr key={c.name} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="px-6 py-3 text-neutral-900">{c.name}</td>
                  <td className={`px-6 py-3 text-right ${c.monthlyCost === 0 ? 'text-neutral-400' : 'text-neutral-700'}`}>
                    {c.currency}{c.monthlyCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-neutral-500">{c.notes}</td>
                </tr>
              ))}
              <tr className="bg-neutral-50">
                <td className="px-6 py-3 font-semibold text-neutral-900">Total</td>
                <td className="px-6 py-3 text-right font-semibold text-neutral-900">
                  {'\u20AC'}{infra.totalMonthlyCost.toFixed(2)}
                </td>
                <td className="px-6 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
