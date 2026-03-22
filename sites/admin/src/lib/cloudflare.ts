import { env } from '@/lib/env';
// ---------------------------------------------------------------------------
// Cloudflare API wrapper for Pages, DNS, and custom domains
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
// Pages projects
// ---------------------------------------------------------------------------

/**
 * Create a new Cloudflare Pages project (Direct Upload, no git connection).
 */
export async function createPagesProject(
  slug: string,
): Promise<{ projectName: string; pagesDevUrl: string }> {
  const accountId = env('CLOUDFLARE_ACCOUNT_ID');
  if (!accountId) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID is not set');
  }

  const result = await cfFetch<{ name: string; subdomain: string }>(
    `/accounts/${accountId}/pages/projects`,
    {
      method: 'POST',
      body: JSON.stringify({
        name: slug,
        production_branch: 'main',
      }),
    },
  );

  return {
    projectName: result.name,
    pagesDevUrl: result.subdomain,
  };
}

/**
 * Delete a Cloudflare Pages project.
 */
export async function deletePagesProject(projectName: string): Promise<void> {
  const accountId = env('CLOUDFLARE_ACCOUNT_ID');
  if (!accountId) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID is not set');
  }

  await cfFetch<unknown>(
    `/accounts/${accountId}/pages/projects/${projectName}`,
    { method: 'DELETE' },
  );
}

// ---------------------------------------------------------------------------
// Custom domains
// ---------------------------------------------------------------------------

/**
 * Add a custom domain to a Pages project (for SSL provisioning).
 */
export async function addCustomDomain(
  projectName: string,
  domain: string,
): Promise<void> {
  const accountId = env('CLOUDFLARE_ACCOUNT_ID');
  if (!accountId) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID is not set');
  }

  await cfFetch<unknown>(
    `/accounts/${accountId}/pages/projects/${projectName}/domains`,
    {
      method: 'POST',
      body: JSON.stringify({ name: domain }),
    },
  );
}

/**
 * Remove a custom domain from a Pages project.
 */
export async function removeCustomDomain(
  projectName: string,
  domain: string,
): Promise<void> {
  const accountId = env('CLOUDFLARE_ACCOUNT_ID');
  if (!accountId) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID is not set');
  }

  await cfFetch<unknown>(
    `/accounts/${accountId}/pages/projects/${projectName}/domains/${domain}`,
    {
      method: 'DELETE',
    },
  );
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
