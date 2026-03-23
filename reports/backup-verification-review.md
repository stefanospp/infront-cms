# Backup & Disaster Recovery Verification Review: Infront CMS Platform

**Date:** 2026-03-23
**Reviewer:** Infrastructure Reliability Engineer
**Scope:** All backup scripts, Docker volumes, D1 databases, restore procedures, scheduling, and verification
**Severity Scale:** CRITICAL | HIGH | MEDIUM | LOW

---

## Executive Summary

**Overall Backup Status: NON-FUNCTIONAL**

The backup infrastructure is fundamentally broken. Three backup/restore scripts exist but **none can actually execute successfully** against the real infrastructure. PostgreSQL databases run inside Docker containers with no published ports, but the backup script tries to connect via host-level `psql`. Uploads are stored in Docker named volumes, but the backup script looks for them at a non-existent host path. The D1 database (abroad-jobs, containing paid job listings at EUR 89 each) has **zero backup coverage**. No backup scheduling exists -- no cron jobs, no systemd timers, no CI/CD workflows. There is no verification, no checksums, no restore testing, and no alerting on failure.

**Finding Counts:** 8 Critical, 7 High, 4 Medium, 1 Low

---

## Critical Issues

### C-1: pg_backup.sh Cannot Reach Containerized Databases

**File:** `infra/backups/pg_backup.sh`

The script runs `psql -U postgres` directly on the host to discover and dump databases. However, all PostgreSQL instances run **inside Docker containers** with named volumes. There is no host-level PostgreSQL installation, no published database port, and no `docker exec` command in the script.

Each client has their own Docker Compose stack with its own database container. All client databases are named "directus" (same name), making the discovery query useless -- it would find ONE "directus" database if it could connect at all.

**Impact:** Script has never successfully backed up any database. Zero database backups exist.

**Recommended Fix:** Rewrite to use `docker exec` per client container:
```bash
docker exec ${CLIENT}-postgres-1 pg_dump -U directus directus | gzip > backup.sql.gz
```

---

### C-2: uploads_backup.sh Points to Non-Existent Path

**File:** `infra/backups/uploads_backup.sh`

`UPLOADS_ROOT` defaults to `/var/data/directus-uploads` but uploads are stored in Docker named volumes (`directus_uploads`). The actual data resides at `/var/lib/docker/volumes/<project>_directus_uploads/_data/`, not at the configured path.

Additionally, the `--delete` flag on S3 sync is dangerous -- if the source path is empty or wrong, it will **delete all existing S3 backups**.

**Impact:** Script either fails immediately or backs up an empty directory, then potentially deletes any existing S3 backups.

**Recommended Fix:** Mount Docker volumes to a known host path, or use `docker cp` to extract uploads before syncing.

---

### C-3: restore.sh Cannot Connect to Containerized Databases

**File:** `infra/backups/restore.sh`

The restore script uses `psql -h localhost -U directus -d directus` -- same host access problem as the backup script. There is no `DROP DATABASE`/`CREATE DATABASE` step before restore, and no `--clean` flag was used during backup, so restore cannot idempotently apply.

Container name assumption `${CLIENT_SLUG}-directus-1` depends on Docker Compose project naming, which may vary.

**Impact:** Even if backups existed, the restore procedure would not work.

**Recommended Fix:** Rewrite to use `docker exec` for database operations. Add pre-restore cleanup steps.

---

### C-4: D1 Database (abroad-jobs) Has Zero Backup Coverage

**Files:** `sites/abroad-jobs/wrangler.toml`, `sites/abroad-jobs/src/lib/schema.ts`

The abroad-jobs site uses Cloudflare D1 (database ID: `96e53292-7337-4e19-98ba-9b2e01e77eb8`). This database contains paid job listings (EUR 89 each), Stripe payment references, and the FTS5 search index.

No backup script exists for D1. While Cloudflare D1 has automatic point-in-time recovery (30 days on paid plans), there is:
- No export/dump script
- No S3 archival
- No tested restore procedure
- No independent backup outside Cloudflare

The `wrangler d1 export` command exists but is not used anywhere in the codebase.

**Impact:** If the Cloudflare account is compromised or the D1 database is accidentally deleted, there may be no recovery path beyond Cloudflare's built-in retention (which depends on plan tier).

**Recommended Fix:** Create a scheduled `wrangler d1 export` script that dumps the database to S3 daily.

---

### C-5: No Backup Scheduling Exists

No cron jobs, systemd timers, CI/CD workflows, or scheduled GitHub Actions exist for backups. The `setup-vps.sh` script does not install any cron entries. The `wrangler.toml` cron trigger is for the abroad-jobs Worker (job imports), not backups.

**Impact:** Backups are manual-only and have almost certainly never been run.

**Recommended Fix:** Add a scheduled GitHub Action or cron job that runs backup scripts daily. Start with D1 export as the highest priority.

---

### C-6: No Backup Verification Exists

No checksums are computed on backup files. No file size validation (zero-byte check). No periodic restore test. No alerting on backup failure. No monitoring dashboard for backup health. No `aws s3 ls` verification after upload.

**Impact:** Even if backups worked, there would be no way to know if they are valid or complete.

**Recommended Fix:** Add post-backup verification: checksum computation, minimum size check, S3 listing confirmation, and failure alerting.

---

### C-7: Docker Volumes Not Backed Up

**Files:** `infra/admin/deploy.yml`, all `docker-compose.yml` files

The following Docker volumes contain critical data but have no backup coverage:
- `infront-admin-sites:/app/sites` -- Admin-managed site data
- `infront-admin-infra:/app/infra` -- Infrastructure configuration
- `db_data` (per client) -- PostgreSQL database files
- `directus_uploads` (per client) -- Client uploaded media
- `directus_extensions` (per client) -- Directus extensions

A `docker volume rm` or container recreation destroys this data permanently.

**Recommended Fix:** Add Docker volume backup via `docker run --volumes-from` pattern or mount volumes to host paths.

---

### C-8: Production Credentials Committed to Git (Security)

**Files:**
- `infra/docker/meridian-properties/.env` -- Contains plaintext DB passwords, admin passwords, Directus KEY/SECRET
- `infra/docker/atelier-kosta/.env` -- Same

While tangential to backups, this was discovered during the review. These credentials are in Git history and need immediate rotation.

**Recommended Fix:** Rotate all credentials. Remove from Git history. Move to Doppler.

---

## High Severity Issues

### H-1: S3 Bucket May Not Exist

Bucket name `agency-cms-backups` is hardcoded as default. There is no evidence the bucket exists or has been created. No IAM policy, no credentials configured anywhere visible, no lifecycle policy, no versioning, no Object Lock.

**Recommended Fix:** Create the S3 bucket with versioning enabled. Configure IAM credentials. Add lifecycle policies for cost management.

---

### H-2: No Directus Schema Snapshot Automation

Directus schema snapshots (`directus schema snapshot`) exist as a concept in the documentation but are not automated. The only snapshots found are manual one-offs. Schema drift between environments is undetectable.

**Recommended Fix:** Add schema snapshot to the backup pipeline. Store snapshots in Git.

---

### H-3: No Backup Encryption

Backup files are plain gzip with no encryption. If S3 credentials are compromised, all backup data is readable.

**Recommended Fix:** Encrypt backup files before upload (e.g., `gpg --symmetric`). Enable S3 server-side encryption.

---

### H-4: No Cloudflare DNS Configuration Backup

DNS records for all sites are managed via the Cloudflare API. There is no export or backup of DNS zone data. If records are accidentally deleted or the Cloudflare account is compromised, DNS reconstruction would be manual.

**Recommended Fix:** Add a periodic `cloudflare-api dns-records list` export to the backup pipeline.

---

### H-5: No Stripe Webhook Configuration Backup

Stripe webhook endpoints and event subscriptions are configured in the Stripe dashboard. There is no infrastructure-as-code or backup for this configuration.

**Recommended Fix:** Document Stripe configuration as code or export via Stripe API.

---

### H-6: uploads_backup.sh --delete Flag Is Dangerous

The S3 sync command uses `--delete` which mirrors deletions from source to destination. If the source directory is empty (which it will be, since the path is wrong), this flag will delete all existing S3 backups.

**Recommended Fix:** Remove `--delete` flag. Use dated prefixes instead of overwriting.

---

### H-7: No Per-Client Backup Separation

The backup scripts do not separate backups by client. All uploads would be mixed together in one S3 prefix. Restoring one client's data could be difficult.

**Recommended Fix:** Use per-client S3 prefixes: `s3://agency-cms-backups/{client-slug}/`.

---

## Medium Severity Issues

### M-1: No Recovery Time/Point Documentation

There is no documented RPO (Recovery Point Objective) or RTO (Recovery Time Objective) for any data asset. Expected recovery scenarios are not documented.

---

### M-2: No Backup Retention Policy

No lifecycle rules define how long backups are retained. Without a policy, backups either grow indefinitely (cost) or are never available when needed.

---

### M-3: Git as Backup Has Limitations

Source code is well-protected by Git, but Docker volumes, runtime database state, uploaded files, and D1 data are NOT in Git. `.deploy.json` files and `site.config.ts` are in Git (good).

---

### M-4: restore.sh Has No Post-Restore Verification

The restore script does not verify the restore was successful -- no row counts, no schema check, no application health check after restore.

---

## Low Severity Issues

### L-1: No Backup Documentation or Runbook

There is no runbook documenting how to perform a backup, how to restore, or how to verify. The scripts have minimal comments.

---

## Backup Coverage Matrix

| Data Asset | Backed Up? | Script Exists? | Script Works? | Automated? | Tested? |
|---|---|---|---|---|---|
| Directus PostgreSQL (per client) | NO | Yes (pg_backup.sh) | NO -- cannot reach containerized DB | NO | NO |
| Directus uploads (per client) | NO | Yes (uploads_backup.sh) | NO -- wrong volume path | NO | NO |
| D1 database (abroad-jobs) | NO | NO | N/A | NO | NO |
| Directus schema snapshots | PARTIAL | NO (manual only) | N/A | NO | NO |
| Site source code | YES | N/A (Git) | YES | YES (git push) | YES |
| Admin Docker volume | NO | NO | N/A | NO | NO |
| .deploy.json metadata | YES (in Git) | N/A | YES | YES | N/A |
| Docker .env secrets | IN GIT (BAD) | N/A | N/A | N/A | N/A |
| Cloudflare DNS config | NO | NO | N/A | NO | NO |
| Stripe webhook config | NO | NO | N/A | NO | NO |

---

## Recovery Time/Point Estimates

| Scenario | RPO (data loss) | RTO (downtime) | Notes |
|---|---|---|---|
| VPS disk failure | TOTAL LOSS | Hours to days | No working backups. Must rebuild from scratch. |
| Directus DB corruption (single client) | TOTAL LOSS | Hours | No restorable backup exists. |
| D1 database loss | Up to 30 days recoverable (Cloudflare PITR) | Minutes to hours | Depends on Cloudflare plan tier. No independent backup. |
| Admin Docker volume loss | TOTAL LOSS of runtime state | Hours | Volume not backed up. Must redeploy all sites. |
| Accidental `docker volume rm` | TOTAL LOSS | Hours to days | Named volumes are the only copy. |
| Uploads deletion | TOTAL LOSS | Permanent | No backup of upload files. |
| Git repo deletion | Recoverable from local clones | Minutes | Standard Git redundancy. |

---

## Prioritized Recommendations

### Immediate (This Week)

1. **Create D1 export script** using `wrangler d1 export` -- highest-value data has zero backup
2. **Rotate committed credentials** in `.env` files and remove from Git history
3. **Remove `--delete` flag** from uploads_backup.sh to prevent accidental S3 wipe
4. **Create S3 bucket** with versioning and lifecycle policies

### Short-Term (This Month)

5. **Rewrite pg_backup.sh** to use `docker exec` per client container
6. **Rewrite uploads_backup.sh** to use Docker volume paths or `docker cp`
7. **Rewrite restore.sh** to use `docker exec` with proper cleanup steps
8. **Add backup scheduling** via cron or GitHub Actions (daily for databases, weekly for uploads)
9. **Add post-backup verification** (checksums, size checks, S3 listing)

### Medium-Term (This Quarter)

10. **Add backup alerting** -- notify on failure via Slack, email, or Betterstack
11. **Add backup encryption** before S3 upload
12. **Add DNS zone export** to backup pipeline
13. **Add periodic restore testing** (monthly automated restore to a test environment)
14. **Document RPO/RTO** targets and create a disaster recovery runbook
15. **Add Directus schema snapshot** automation

---

## Files Reviewed

- `infra/backups/pg_backup.sh` -- PostgreSQL backup script
- `infra/backups/uploads_backup.sh` -- Directus uploads backup script
- `infra/backups/restore.sh` -- Database and uploads restore script
- `infra/docker/template/docker-compose.yml` -- Docker template
- `infra/docker/meridian-properties/docker-compose.yml` -- Client Docker config
- `infra/docker/atelier-kosta/docker-compose.yml` -- Client Docker config
- `infra/docker/meridian-properties/.env` -- Live credentials (committed to Git)
- `infra/docker/atelier-kosta/.env` -- Live credentials (committed to Git)
- `infra/admin/deploy.yml` -- Kamal deployment config
- `infra/admin/setup-vps.sh` -- VPS provisioning script
- `infra/admin/update-vps.sh` -- VPS update script
- `.github/workflows/test.yml`, `deploy-site.yml`, `deploy-directus.yml` -- CI workflows
- `sites/abroad-jobs/wrangler.toml` -- D1 database binding
- `sites/abroad-jobs/src/lib/schema.ts` -- D1 schema
- `.gitignore`
