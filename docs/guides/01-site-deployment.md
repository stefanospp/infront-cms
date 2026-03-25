# Phase 1: Site Deployment to Cloudflare Workers

Deploy the static site to Cloudflare Workers with a custom domain.

## Step 1.1: Update site URL

Change the site URL from the staging subdomain to the production domain.

**Files to update:**

`sites/<slug>/site.config.ts`:
```typescript
url: 'https://nikolaspetrou.com',  // was: https://videoshoot.infront.cy
```

`sites/<slug>/astro.config.mjs`:
```javascript
site: 'https://nikolaspetrou.com',  // was: https://videoshoot.infront.cy
```

## Step 1.2: Configure wrangler.toml

Create or update `sites/<slug>/wrangler.toml`:

```toml
name = "nikolaspetrou"
compatibility_date = "2026-03-22"
compatibility_flags = ["nodejs_compat"]
workers_dev = true

routes = [
  { pattern = "nikolaspetrou.com", custom_domain = true },
  { pattern = "www.nikolaspetrou.com", custom_domain = true },
]

[assets]
directory = "./dist"
```

**Key settings:**
- `name` — the Workers project name (used in the workers.dev subdomain)
- `compatibility_flags = ["nodejs_compat"]` — required later when adding the Cloudflare adapter for SSR. Can be added now to avoid a separate deploy later.
- `routes` — custom domains. Cloudflare auto-creates DNS records for these.
- `[assets] directory` — where the built site output lives. Changes to `./dist/client` when hybrid SSR is enabled later, but the Astro Cloudflare adapter auto-handles this via a generated `wrangler.json`.

## Step 1.3: Build the site

```bash
cd sites/<slug>
npm run build
```

Verify the build output:
```bash
ls dist/  # Should contain HTML files, _astro/ directory, images/, etc.
```

## Step 1.4: Deploy to Cloudflare Workers

```bash
npx wrangler deploy
```

Expected output:
```
Uploaded nikolaspetrou (25.78 sec)
Deployed nikolaspetrou triggers (5.71 sec)
  https://nikolaspetrou.stepet.workers.dev
  nikolaspetrou.com (custom domain)
  www.nikolaspetrou.com (custom domain)
```

Wrangler automatically:
- Uploads static assets to Cloudflare's edge
- Creates Worker DNS records (CNAME) for custom domains
- Provisions SSL certificates

## Step 1.5: Verify

```bash
curl -sI https://nikolaspetrou.com | head -5
# Should return HTTP/2 200
```

Visit the site in a browser to confirm all pages render correctly.

## Step 1.6: Add www redirect (automatic)

When both `nikolaspetrou.com` and `www.nikolaspetrou.com` are listed in `routes`, Cloudflare Workers serves the same content on both. No separate redirect rule is needed.

## Common issues

### Domain not in Cloudflare account
The domain must be added to the same Cloudflare account as the Worker. If the domain is registered elsewhere, update nameservers to Cloudflare first.

### "Error 1014" with proxied CNAME
If using `proxied: true` on CNAME records, Cloudflare may return Error 1014. Use `custom_domain = true` in wrangler.toml routes instead — this creates the DNS records with the correct configuration.

### Build fails
Ensure you're in the correct directory (`sites/<slug>/`) and that `npm run build` is defined in `package.json`.
