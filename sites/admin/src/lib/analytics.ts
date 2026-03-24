import { env } from '@/lib/env';

export interface WorkerAnalytics {
  scriptName: string;
  requests: number;
  errors: number;
  subrequests: number;
  cpuTimeP50: number;
  cpuTimeP99: number;
}

export interface AnalyticsSummary {
  period: string;
  totalRequests: number;
  totalErrors: number;
  workers: WorkerAnalytics[];
}

interface CacheEntry {
  data: AnalyticsSummary;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 seconds

function getPeriodDates(period: '24h' | '7d' | '30d'): { since: string; until: string } {
  const now = new Date();
  const until = now.toISOString().slice(0, 10);

  const since = new Date(now);
  if (period === '24h') {
    since.setDate(since.getDate() - 1);
  } else if (period === '7d') {
    since.setDate(since.getDate() - 7);
  } else {
    since.setDate(since.getDate() - 30);
  }

  return { since: since.toISOString().slice(0, 10), until };
}

export async function getWorkersAnalytics(period: '24h' | '7d' | '30d'): Promise<AnalyticsSummary> {
  const cached = cache.get(period);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const token = env('CLOUDFLARE_API_TOKEN');
  const accountId = env('CLOUDFLARE_ACCOUNT_ID');

  if (!token || !accountId) {
    throw new Error('Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID');
  }

  const { since, until } = getPeriodDates(period);

  const query = `
    query WorkersAnalytics($accountTag: String!, $since: Date!, $until: Date!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          workersInvocationsAdaptive(
            filter: {
              date_geq: $since
              date_leq: $until
            }
            limit: 1000
            orderBy: [sum_requests_DESC]
          ) {
            dimensions {
              scriptName
              date
            }
            sum {
              requests
              errors
              subrequests
              wallTime
            }
            quantiles {
              cpuTimeP50
              cpuTimeP99
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        accountTag: accountId,
        since,
        until,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Cloudflare API returned ${response.status}: ${response.statusText}`);
  }

  const json = await response.json() as {
    errors?: { message: string }[];
    data?: {
      viewer: {
        accounts: {
          workersInvocationsAdaptive: {
            dimensions: { scriptName: string; date: string };
            sum: { requests: number; errors: number; subrequests: number; wallTime: number };
            quantiles: { cpuTimeP50: number; cpuTimeP99: number };
          }[];
        }[];
      };
    };
  };

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Cloudflare GraphQL error: ${json.errors[0]!.message}`);
  }

  const accounts = json.data?.viewer?.accounts;
  if (!accounts || accounts.length === 0) {
    return { period, totalRequests: 0, totalErrors: 0, workers: [] };
  }

  const rows = accounts[0]!.workersInvocationsAdaptive;

  // Aggregate by scriptName (rows may be split by date)
  const byScript = new Map<string, WorkerAnalytics>();

  for (const row of rows) {
    const name = row.dimensions.scriptName;
    const existing = byScript.get(name);

    if (existing) {
      existing.requests += row.sum.requests;
      existing.errors += row.sum.errors;
      existing.subrequests += row.sum.subrequests;
      // For quantiles, keep the max across dates as an approximation
      existing.cpuTimeP50 = Math.max(existing.cpuTimeP50, row.quantiles.cpuTimeP50);
      existing.cpuTimeP99 = Math.max(existing.cpuTimeP99, row.quantiles.cpuTimeP99);
    } else {
      byScript.set(name, {
        scriptName: name,
        requests: row.sum.requests,
        errors: row.sum.errors,
        subrequests: row.sum.subrequests,
        cpuTimeP50: row.quantiles.cpuTimeP50,
        cpuTimeP99: row.quantiles.cpuTimeP99,
      });
    }
  }

  const workers = Array.from(byScript.values()).sort((a, b) => b.requests - a.requests);
  const totalRequests = workers.reduce((sum, w) => sum + w.requests, 0);
  const totalErrors = workers.reduce((sum, w) => sum + w.errors, 0);

  const result: AnalyticsSummary = {
    period,
    totalRequests,
    totalErrors,
    workers,
  };

  cache.set(period, { data: result, timestamp: Date.now() });

  return result;
}
