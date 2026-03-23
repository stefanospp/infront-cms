import type { APIRoute } from 'astro';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { readDeployMetadata } from '@/lib/deploy';
import { getMonorepoRoot } from '@/lib/generator';
import {
  removeWorkerCustomDomain,
  deleteDnsRecord,
  deleteWorker,
} from '@/lib/cloudflare';
import { auditLog } from '@agency/utils/logger';

export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  const slug = params.slug!;
  const json = (body: Record<string, unknown>, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  auditLog('site.delete', { slug });

  // ---- Validation ----

  if (slug === 'template' || slug === 'admin') {
    return json({ error: `Cannot delete the ${slug} site` }, 403);
  }

  const root = getMonorepoRoot();
  const siteDir = path.join(root, 'sites', slug);

  try {
    const stat = await fs.stat(siteDir);
    if (!stat.isDirectory()) {
      return json({ error: 'Site not found' }, 404);
    }
  } catch {
    return json({ error: 'Site not found' }, 404);
  }

  const meta = await readDeployMetadata(slug);

  if (meta && (meta.status === 'building' || meta.status === 'deploying')) {
    return json(
      { error: 'Cannot delete while a deploy is in progress', status: meta.status },
      409,
    );
  }

  // ---- Cleanup Cloudflare resources (best-effort) ----

  const warnings: string[] = [];

  // 1. Remove production custom domain
  if (meta?.productionUrl && meta.projectName) {
    try {
      await removeWorkerCustomDomain(meta.projectName, meta.productionUrl);
    } catch (err) {
      warnings.push(
        `Failed to remove production domain: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // 2. Delete staging DNS record
  if (meta?.dnsRecordId) {
    try {
      await deleteDnsRecord(meta.dnsRecordId);
    } catch (err) {
      warnings.push(
        `Failed to delete DNS record: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // 3. Remove staging custom domain from Worker
  if (meta?.stagingUrl && meta.projectName) {
    try {
      await removeWorkerCustomDomain(meta.projectName, meta.stagingUrl);
    } catch (err) {
      warnings.push(
        `Failed to remove staging domain: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // 4. Delete the Worker
  if (meta?.projectName) {
    try {
      await deleteWorker(meta.projectName);
    } catch (err) {
      warnings.push(
        `Failed to delete Worker: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // ---- Delete local files ----

  // 5. Delete CMS Docker infra (if exists)
  const dockerDir = path.join(root, 'infra', 'docker', slug);
  try {
    await fs.rm(dockerDir, { recursive: true, force: true });
  } catch {
    // Silently ignore — directory may not exist
  }

  // 6. Delete site directory (always last)
  try {
    await fs.rm(siteDir, { recursive: true, force: true });
  } catch (err) {
    warnings.push(
      `Failed to delete site directory: ${err instanceof Error ? err.message : String(err)}`,
    );
    return json({ success: false, error: 'Failed to delete site files', warnings }, 500);
  }

  return json(
    warnings.length > 0 ? { success: true, warnings } : { success: true },
    200,
  );
};
