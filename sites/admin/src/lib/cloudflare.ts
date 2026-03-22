import { env } from '@/lib/env';
// ---------------------------------------------------------------------------
// Cloudflare API wrapper for Workers, DNS, and custom domains
// ---------------------------------------------------------------------------

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

// ---------------------------------------------------------------------------
// Shared fetch helper
// ---------------------------------------------------------------------------

async function cfFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = env('CLOUDFLARE_API_TOKEN');
  if (!token) {
    throw new Error('CLOUDFLARE_API_TOKEN is not set');
  }

  const url = `${CF_API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const body = (await res.json()) as {
    success: boolean;
    result: T;
    errors?: { message: string; code: number }[];
  };

  if (!res.ok || !body.success) {
    const msg =
      body.errors?.map((e) => e.message).join('; ') ??
      `Cloudflare API error: ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return body.result;
}

// ---------------------------------------------------------------------------
// Workers
// ---------------------------------------------------------------------------

/**
 * Delete a Cloudflare Worker.
 */
export async function deleteWorker(workerName: string): Promise<void> {
  const accountId = env('CLOUDFLARE_ACCOUNT_ID');
  if (!accountId) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID is not set');
  }

  await cfFetch<unknown>(
    `/accounts/${accountId}/workers/scripts/${workerName}`,
    { method: 'DELETE' },
  );
}

// ---------------------------------------------------------------------------
// Workers Custom Domains (for SSL on custom domains)
// ---------------------------------------------------------------------------

/**
 * Add a custom domain to a Worker for automatic SSL provisioning.
 * Uses the Workers Custom Domains API.
 */
export async function addWorkerCustomDomain(
  workerName: string,
  domain: string,
): Promise<void> {
  const accountId = env('CLOUDFLARE_ACCOUNT_ID');
  const zoneId = env('CLOUDFLARE_ZONE_ID');
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID is not set');
  if (!zoneId) throw new Error('CLOUDFLARE_ZONE_ID is not set');

  await cfFetch<unknown>(
    `/accounts/${accountId}/workers/domains`,
    {
      method: 'PUT',
      body: JSON.stringify({
        hostname: domain,
        service: workerName,
        zone_id: zoneId,
        environment: 'production',
      }),
    },
  );
}

/**
 * Remove a custom domain from a Worker.
 */
export async function removeWorkerCustomDomain(
  _workerName: string,
  domain: string,
): Promise<void> {
  const accountId = env('CLOUDFLARE_ACCOUNT_ID');
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID is not set');

  // List all Worker custom domains to find the ID for the given hostname
  const domains = await cfFetch<{ id: string; hostname: string }[]>(
    `/accounts/${accountId}/workers/domains`,
  );

  const match = Array.isArray(domains)
    ? domains.find((d) => d.hostname === domain)
    : undefined;

  if (match) {
    await cfFetch<unknown>(
      `/accounts/${accountId}/workers/domains/${match.id}`,
      { method: 'DELETE' },
    );
  }
}

// ---------------------------------------------------------------------------
// DNS records
// ---------------------------------------------------------------------------

/**
 * Create a CNAME DNS record on the infront.cy zone.
 * Returns the DNS record ID.
 */
export async function createDnsRecord(
  name: string,
  target: string,
): Promise<string> {
  const zoneId = env('CLOUDFLARE_ZONE_ID');
  if (!zoneId) {
    throw new Error('CLOUDFLARE_ZONE_ID is not set');
  }

  const result = await cfFetch<{ id: string }>(
    `/zones/${zoneId}/dns_records`,
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'CNAME',
        name,
        content: target,
        proxied: false,
        ttl: 300,
      }),
    },
  );

  return result.id;
}

/**
 * Delete a DNS record.
 */
export async function deleteDnsRecord(recordId: string): Promise<void> {
  const zoneId = env('CLOUDFLARE_ZONE_ID');
  if (!zoneId) {
    throw new Error('CLOUDFLARE_ZONE_ID is not set');
  }

  await cfFetch<unknown>(`/zones/${zoneId}/dns_records/${recordId}`, {
    method: 'DELETE',
  });
}
