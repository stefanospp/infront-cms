/**
 * Scheduled job maintenance tasks.
 * Called from the /api/import endpoint when triggered by cron,
 * or can be imported and called directly.
 *
 * Tasks:
 * 1. Clean up expired jobs (mark as not live)
 * 2. Delete orphaned pending jobs from abandoned checkouts (>24h old)
 */

export async function runScheduledMaintenance(db: D1Database): Promise<{ expired: number; orphans: number }> {
  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 24 * 60 * 60;

  // 1. Mark expired jobs as not live
  const expired = await db.prepare(
    `UPDATE jobs SET is_live = 0 WHERE is_live = 1 AND expires_at IS NOT NULL AND expires_at < ?`
  ).bind(now).run();

  // 2. Delete orphaned pending jobs (abandoned checkouts older than 24 hours)
  const orphans = await db.prepare(
    `DELETE FROM jobs WHERE is_live = 0 AND stripe_session_id IS NOT NULL AND source = 'paid' AND activated_at IS NULL AND created_at < ?`
  ).bind(oneDayAgo).run();

  return {
    expired: expired.meta.changes ?? 0,
    orphans: orphans.meta.changes ?? 0,
  };
}
