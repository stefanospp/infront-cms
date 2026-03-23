# Email DNS Records (SPF / DKIM / DMARC)

DNS records required for email deliverability when sending via Resend (which uses Amazon SES under the hood). Add all records in the Cloudflare DNS dashboard for each domain that sends email.

## SPF

SPF tells receiving mail servers which services are authorised to send email on behalf of your domain.

| Type | Name | Content | TTL |
|------|------|---------|-----|
| TXT | `@` | `v=spf1 include:amazonses.com include:resend.com ~all` | Auto |

Notes:
- `include:amazonses.com` covers the underlying SES infrastructure
- `include:resend.com` covers Resend's own sending IPs
- `~all` soft-fails anything not covered (use `-all` for strict enforcement once verified)

## DKIM

DKIM cryptographically signs outgoing emails so recipients can verify they were not tampered with.

Get the DKIM records from the Resend dashboard:

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click on your verified domain
3. Go to **Settings** then **Domains**
4. Copy the three CNAME records provided

They will look like:

| Type | Name | Content | TTL |
|------|------|---------|-----|
| CNAME | `resend._domainkey` | `resend._domainkey.<your-id>.resend.dev` | Auto |
| CNAME | `s1._domainkey` | `s1._domainkey.<your-id>.resend.dev` | Auto |
| CNAME | `s2._domainkey` | `s2._domainkey.<your-id>.resend.dev` | Auto |

The exact values depend on your Resend account. Always copy them directly from the dashboard.

## DMARC

DMARC builds on SPF and DKIM to define a policy for handling authentication failures and to receive aggregate reports.

| Type | Name | Content | TTL |
|------|------|---------|-----|
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@infront.cy` | Auto |

Policy options:
- `p=none` -- monitor only, no action taken (good for initial setup)
- `p=quarantine` -- mark failures as spam (recommended default)
- `p=reject` -- reject failures outright (strictest, enable after monitoring)

The `rua` address receives aggregate reports. Set up a mailbox or use a DMARC reporting service (e.g., Postmark DMARC, DMARCian) to process these.

## Adding Records in Cloudflare

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select the domain
3. Go to **DNS** then **Records**
4. Click **Add record** for each entry above
5. For TXT records: set Type to TXT, Name to the value shown, and Content to the full string (including `v=spf1...` or `v=DMARC1...`)
6. For CNAME records: set Type to CNAME, Name to the subdomain, and Target to the value from Resend
7. Leave **Proxy status** as **DNS only** (grey cloud) for all email-related records -- proxying breaks email authentication
8. Save each record

## Verification

After adding the records, verify they propagate:

```bash
# Check SPF
dig TXT example.com +short

# Check DKIM
dig CNAME resend._domainkey.example.com +short

# Check DMARC
dig TXT _dmarc.example.com +short
```

Also verify in the Resend dashboard -- the domain status should show all three checks as green.

## Per-Client Domains

For each client site that sends email (contact forms, etc.), add these same records to that client's domain in Cloudflare. The SPF and DMARC records are the same across all domains. DKIM records are unique per domain and must be fetched from Resend after adding the domain there.

Workflow for a new client domain:
1. Add the domain in Resend dashboard
2. Copy the DKIM CNAME records Resend provides
3. Add SPF TXT, DKIM CNAMEs, and DMARC TXT to Cloudflare DNS for that domain
4. Wait for DNS propagation (usually under 5 minutes with Cloudflare)
5. Click "Verify" in Resend dashboard
