# VPS Backup Setup

## Prerequisites

Before setting up backup cron jobs, ensure the following are installed and configured on the VPS:

- **AWS CLI** -- configured with credentials that have write access to the S3 backup bucket
  ```bash
  aws configure
  # Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and region
  ```
- **Wrangler CLI** -- authenticated with Cloudflare for D1 database exports
  ```bash
  npx wrangler login
  ```
- **Docker** -- running, with the Directus containers accessible
  ```bash
  docker ps  # should list directus and postgres containers
  ```

## Crontab Entries

Edit the crontab on the VPS:

```bash
crontab -e
```

Add these entries:

```
# PostgreSQL backup (Directus databases) -- daily at 02:00
0 2 * * * /app/infra/backups/pg_backup.sh >> /var/log/backups/pg.log 2>&1

# Directus uploads backup -- daily at 03:00
0 3 * * * /app/infra/backups/uploads_backup.sh >> /var/log/backups/uploads.log 2>&1

# Cloudflare D1 backup -- daily at 04:00
0 4 * * * /app/infra/backups/d1_backup.sh >> /var/log/backups/d1.log 2>&1
```

Create the log directory:

```bash
sudo mkdir -p /var/log/backups
sudo chown $(whoami):$(whoami) /var/log/backups
```

Make the scripts executable:

```bash
chmod +x /app/infra/backups/pg_backup.sh
chmod +x /app/infra/backups/uploads_backup.sh
chmod +x /app/infra/backups/d1_backup.sh
chmod +x /app/infra/backups/restore.sh
```

## Verifying Backups

### Check logs

```bash
# Most recent PostgreSQL backup
tail -20 /var/log/backups/pg.log

# Most recent uploads backup
tail -20 /var/log/backups/uploads.log

# Most recent D1 backup
tail -20 /var/log/backups/d1.log
```

### Check S3 bucket

```bash
# List recent PostgreSQL backups
aws s3 ls s3://infront-backups/postgres/ --recursive | tail -5

# List recent upload backups
aws s3 ls s3://infront-backups/uploads/ --recursive | tail -5

# List recent D1 backups
aws s3 ls s3://infront-backups/d1/ --recursive | tail -5
```

### Manual test run

Run each script manually to verify they complete without errors:

```bash
/app/infra/backups/pg_backup.sh
/app/infra/backups/uploads_backup.sh
/app/infra/backups/d1_backup.sh
```

## Restoring from Backups

Use the provided restore script:

```bash
/app/infra/backups/restore.sh
```

### Manual restore procedures

#### PostgreSQL (Directus)

```bash
# Download the backup
aws s3 cp s3://infront-backups/postgres/<filename>.sql.gz ./

# Decompress
gunzip <filename>.sql.gz

# Restore into the Docker PostgreSQL container
docker exec -i directus-db psql -U directus -d directus < <filename>.sql
```

#### Directus uploads

```bash
# Download the backup archive
aws s3 cp s3://infront-backups/uploads/<filename>.tar.gz ./

# Extract into the uploads volume
tar -xzf <filename>.tar.gz -C /path/to/directus/uploads/
```

#### Cloudflare D1

```bash
# Download the D1 export
aws s3 cp s3://infront-backups/d1/<filename>.sql ./

# Import into D1
npx wrangler d1 execute <database-name> --file=<filename>.sql
```

## Retention

The backup scripts retain the last 30 days of backups by default. Older backups are automatically pruned from S3 via lifecycle policies. Adjust the S3 lifecycle rule or the scripts if a different retention period is needed.
