import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { getMonorepoRoot } from './paths';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: 'running' | 'exited' | 'paused' | 'restarting' | 'dead';
  health: 'healthy' | 'unhealthy' | 'starting' | 'none';
  uptime: string;
  ports: string[];
  category: 'directus' | 'database' | 'auth' | 'admin' | 'proxy' | 'other';
  cpu: string;
  memory: string;
  memoryLimit: string;
  networkIn: string;
  networkOut: string;
}

export interface DiskUsage {
  total: string;
  used: string;
  available: string;
  percentUsed: number;
}

export interface CostItem {
  name: string;
  monthlyCost: number;
  currency: string;
  notes: string;
}

export interface InfrastructureData {
  containers: ContainerInfo[];
  disk: DiskUsage;
  costs: CostItem[];
  totalMonthlyCost: number;
  vps: {
    cpus: number;
    totalMemory: string;
    usedMemory: string;
    availableMemory: string;
  };
}

// ---------------------------------------------------------------------------
// Cost configuration (stored in /data/costs.json, editable via dashboard)
// ---------------------------------------------------------------------------

const DEFAULT_COSTS: CostItem[] = [
  { name: 'Hetzner CX43 VPS', monthlyCost: 9.49, currency: 'EUR', notes: '8 vCPU, 16GB RAM, 160GB disk' },
  { name: 'Extra storage (40GB)', monthlyCost: 2.50, currency: 'EUR', notes: 'Additional volume' },
  { name: 'Backups (20% of plan)', monthlyCost: 1.90, currency: 'EUR', notes: 'Automated backups' },
  { name: 'Domain: infront.cy', monthlyCost: 1.67, currency: 'EUR', notes: '~€20/year' },
  { name: 'Domain: atelierkosta.cy', monthlyCost: 1.67, currency: 'EUR', notes: '~€20/year' },
  { name: 'Domain: meridianproperties.cy', monthlyCost: 1.67, currency: 'EUR', notes: '~€20/year' },
  { name: 'Domain: abroadjobs.eu', monthlyCost: 0.83, currency: 'EUR', notes: '~€10/year' },
  { name: 'Cloudflare Workers', monthlyCost: 0, currency: 'EUR', notes: 'Free tier' },
  { name: 'Doppler', monthlyCost: 0, currency: 'EUR', notes: 'Free tier' },
  { name: 'Coolify', monthlyCost: 0, currency: 'EUR', notes: 'Self-hosted' },
  { name: 'Directus', monthlyCost: 0, currency: 'EUR', notes: 'Self-hosted' },
];

function getCostsFilePath(): string {
  return path.join(getMonorepoRoot(), 'costs.json');
}

export function readCosts(): CostItem[] {
  try {
    const content = fs.readFileSync(getCostsFilePath(), 'utf-8');
    return JSON.parse(content) as CostItem[];
  } catch {
    // File doesn't exist — return defaults without writing (avoids EACCES in Docker)
    return DEFAULT_COSTS;
  }
}

export function saveCosts(costs: CostItem[]): void {
  fs.writeFileSync(getCostsFilePath(), JSON.stringify(costs, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Docker Engine API client (via Unix socket)
// ---------------------------------------------------------------------------

const DOCKER_SOCKET = '/var/run/docker.sock';

async function dockerGet<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath: DOCKER_SOCKET,
        path,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk: string) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new Error(`Failed to parse Docker API response: ${data.slice(0, 200)}`));
          }
        });
      },
    );
    req.on('error', (err) => {
      reject(new Error(`Docker API error: ${err.message}. Is Docker socket mounted?`));
    });
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Docker API timeout'));
    });
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categorizeContainer(name: string, image: string): ContainerInfo['category'] {
  const lower = name.toLowerCase();
  if (lower.includes('directus') || image.includes('directus')) return 'directus';
  if (lower.includes('postgres') || lower.includes('-db') || image.includes('postgres')) return 'database';
  if (lower.includes('auth')) return 'auth';
  if (lower.includes('admin')) return 'admin';
  if (lower.includes('proxy') || lower.includes('caddy') || lower.includes('traefik')) return 'proxy';
  return 'other';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatUptime(createdTimestamp: number): string {
  const ms = Date.now() - createdTimestamp * 1000;
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return `${Math.floor(ms / 60_000)}m`;
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let _cache: { data: InfrastructureData; expiry: number } | null = null;
const CACHE_TTL_MS = 30_000;

export async function getInfrastructure(): Promise<InfrastructureData> {
  if (_cache && Date.now() < _cache.expiry) return _cache.data;

  const [containers, disk, vps] = await Promise.all([
    getContainers(),
    getDiskUsage(),
    getVpsInfo(),
  ]);

  const costs = readCosts();
  const totalMonthlyCost = costs.reduce((sum, c) => sum + c.monthlyCost, 0);

  const data: InfrastructureData = {
    containers,
    disk,
    costs,
    totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
    vps,
  };

  _cache = { data, expiry: Date.now() + CACHE_TTL_MS };
  return data;
}

// ---------------------------------------------------------------------------
// Docker container listing with stats
// ---------------------------------------------------------------------------

interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  Status: string;
  State: string;
  Ports: { PrivatePort: number; PublicPort?: number; Type: string; IP?: string }[];
  Created: number;
}

interface DockerStats {
  cpu_stats: {
    cpu_usage: { total_usage: number };
    system_cpu_usage: number;
    online_cpus: number;
  };
  precpu_stats: {
    cpu_usage: { total_usage: number };
    system_cpu_usage: number;
  };
  memory_stats: {
    usage: number;
    limit: number;
  };
  networks?: Record<string, { rx_bytes: number; tx_bytes: number }>;
}

async function getContainers(): Promise<ContainerInfo[]> {
  let rawContainers: DockerContainer[];
  try {
    rawContainers = await dockerGet<DockerContainer[]>('/containers/json?all=true');
  } catch {
    return [];
  }

  // Fetch stats for all containers in parallel instead of sequentially
  const containers = await Promise.all(
    rawContainers.map(async (c): Promise<ContainerInfo> => {
      const name = c.Names[0]?.replace(/^\//, '') ?? c.Id.slice(0, 12);
      const health = c.Status.includes('healthy')
        ? 'healthy'
        : c.Status.includes('unhealthy')
          ? 'unhealthy'
          : c.Status.includes('health: starting')
            ? 'starting'
            : 'none';

      let cpu = '—';
      let memory = '—';
      let memoryLimit = '—';
      let networkIn = '—';
      let networkOut = '—';

      if (c.State === 'running') {
        try {
          const stats = await dockerGet<DockerStats>(`/containers/${c.Id}/stats?stream=false`);

          const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
          const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
          const cpus = stats.cpu_stats.online_cpus || 1;
          if (systemDelta > 0) {
            cpu = `${((cpuDelta / systemDelta) * cpus * 100).toFixed(1)}%`;
          }

          memory = formatBytes(stats.memory_stats.usage);
          memoryLimit = formatBytes(stats.memory_stats.limit);

          if (stats.networks) {
            let rxTotal = 0;
            let txTotal = 0;
            for (const net of Object.values(stats.networks)) {
              rxTotal += net.rx_bytes;
              txTotal += net.tx_bytes;
            }
            networkIn = formatBytes(rxTotal);
            networkOut = formatBytes(txTotal);
          }
        } catch {
          // Stats not available
        }
      }

      const ports = c.Ports
        .filter((p) => p.PublicPort)
        .map((p) => `${p.IP || '0.0.0.0'}:${p.PublicPort}->${p.PrivatePort}/${p.Type}`);

      return {
        id: c.Id.slice(0, 12),
        name,
        image: c.Image,
        status: c.Status,
        state: c.State as ContainerInfo['state'],
        health,
        uptime: c.State === 'running' ? formatUptime(c.Created) : '—',
        ports,
        category: categorizeContainer(name, c.Image),
        cpu,
        memory,
        memoryLimit,
        networkIn,
        networkOut,
      };
    }),
  );

  const categoryOrder = { directus: 0, database: 1, auth: 2, admin: 3, proxy: 4, other: 5 };
  containers.sort((a, b) => {
    if (a.state === 'running' && b.state !== 'running') return -1;
    if (a.state !== 'running' && b.state === 'running') return 1;
    return (categoryOrder[a.category] ?? 5) - (categoryOrder[b.category] ?? 5);
  });

  return containers;
}

// ---------------------------------------------------------------------------
// Host system info
// ---------------------------------------------------------------------------

function getDiskUsage(): DiskUsage {
  try {
    const output = execFileSync('df', ['-h', '/'], { encoding: 'utf-8', timeout: 5000 });
    const lines = output.trim().split('\n');
    const parts = lines[1]?.split(/\s+/);
    if (!parts || parts.length < 5) throw new Error('Unexpected df output');
    return {
      total: parts[1] ?? '—',
      used: parts[2] ?? '—',
      available: parts[3] ?? '—',
      percentUsed: parseInt(parts[4] ?? '0', 10),
    };
  } catch {
    return { total: '—', used: '—', available: '—', percentUsed: 0 };
  }
}

function getVpsInfo(): InfrastructureData['vps'] {
  try {
    const cpus = parseInt(
      execFileSync('nproc', { encoding: 'utf-8', timeout: 5000 }).trim(),
      10,
    );
    const memOutput = execFileSync('free', ['-h'], { encoding: 'utf-8', timeout: 5000 });
    const memLine = memOutput.trim().split('\n')[1];
    const parts = memLine?.split(/\s+/);

    return {
      cpus: cpus || 2,
      totalMemory: parts?.[1] ?? '—',
      usedMemory: parts?.[2] ?? '—',
      availableMemory: parts?.[6] ?? '—',
    };
  } catch {
    return { cpus: 2, totalMemory: '—', usedMemory: '—', availableMemory: '—' };
  }
}
