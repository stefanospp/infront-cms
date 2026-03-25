# Phase 7: Troubleshooting

Common issues encountered during the nikolaspetrou.com deployment and their solutions.

## Build issues

### "You don't have permission to access field X"

**Cause:** The `fields` array in `getPublishedItems()` or `getAllItems()` lists a field that doesn't exist in the Directus collection.

**Solution:** Either add the missing field to the Directus collection via API, or remove it from the `fields` array in `directus.ts`.

```bash
# Add a missing field
curl -X POST "https://cms.<domain>/fields/<collection>" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"field":"<field_name>","type":"string","schema":{"is_nullable":true}}'
```

### "Failed to fetch published items: [object Object]"

**Cause:** The Directus SDK throws error objects (not Error instances). The default `String(error)` produces `[object Object]`.

**Solution:** The shared `getPublishedItems` in `@agency/utils/directus.ts` handles this with `JSON.stringify(error)`. If you see this, the error message is being lost — check that the utils package has the JSON.stringify fallback.

### "No such module node:fs"

**Cause:** Building with the Cloudflare adapter without `nodejs_compat` flag. The Directus SDK imports Node.js built-ins.

**Solution:** Add to `wrangler.toml`:
```toml
compatibility_flags = ["nodejs_compat"]
```

### "The provided Wrangler config main field doesn't point to an existing file"

**Cause:** `main = "./dist/server/entry.mjs"` in wrangler.toml. This file is generated during build — it doesn't exist before build starts.

**Solution:** Remove the `main` field from wrangler.toml. The Astro Cloudflare adapter generates a `wrangler.json` in the output that handles this automatically.

### "ERR_PNPM_OUTDATED_LOCKFILE"

**Cause:** `pnpm-lock.yaml` is out of sync with `package.json` (e.g., new dependency added).

**Solution:** Use `--no-frozen-lockfile` in CI or update the lockfile locally:
```bash
pnpm install --no-frozen-lockfile
```

## CMS issues

### Directus won't start after config change

**Cause:** Invalid environment variable format (especially CSP directives).

**Check logs:**
```bash
docker logs <slug>-directus-1 2>&1 | grep -i error
```

**Common:** `Content-Security-Policy received an invalid directive value for "frame-src"` — the format must be `"'self' https://domain.com"` with quoted `'self'`.

### Email not sending (EPIPE error)

**Cause:** Port 465 is blocked on Hetzner VPS.

**Solution:** Use port 587 with STARTTLS:
```
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
```

### Email env vars not available in container

**Cause:** Env vars in `.env` are NOT auto-passed to the Docker container. They must be explicitly listed in docker-compose.yml's `environment:` section.

**Solution:** Add each `EMAIL_*` var to docker-compose.yml:
```yaml
environment:
  EMAIL_FROM: "${EMAIL_FROM}"
  EMAIL_TRANSPORT: "${EMAIL_TRANSPORT}"
  # ... etc
```

After changing, force-recreate:
```bash
docker compose --env-file .env up -d --force-recreate directus
```

### Singleton collections return 404 on POST

**Cause:** Singleton collections in Directus don't accept POST to `/items/<collection>`. They auto-create a single item.

**Solution:** Use PATCH instead of POST:
```bash
curl -X PATCH "https://cms.<domain>/items/hero" \
  -H "Authorization: Bearer <token>" \
  -d '{"heading":"New heading"}'
```

### Collections lost after container recreation

**Cause:** The Directus container was recreated with `--force-recreate` while the database volume was also removed, or the schema wasn't persisted.

**Prevention:** Always keep a schema snapshot:
```bash
docker exec <slug>-directus-1 npx directus schema snapshot /directus/snapshot.yaml
docker cp <slug>-directus-1:/directus/snapshot.yaml ./snapshot.yaml
```

**Recovery:** Apply the snapshot:
```bash
docker cp snapshot.yaml <slug>-directus-1:/directus/snapshot.yaml
docker exec <slug>-directus-1 npx directus schema apply --yes /directus/snapshot.yaml
```

## Preview issues

### "This content is blocked" in preview panel

**Cause:** CSP misconfiguration. Three places must be configured (see [Phase 6](./06-security-csp.md)):
1. Website `_headers` — `frame-ancestors` must include CMS domain
2. Directus env — `CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC` must include site domain
3. SSR route — response headers must allow framing

**Debug:** Check what headers the preview URL returns:
```bash
curl -sI "https://<domain>/preview/projects/<id>?token=<token>" | grep -i "frame\|csp"
```

### Preview not updating after save

**Cause:** Directus reloads the iframe after save, but the SSR route may be returning cached content.

**Debug:** Open the preview URL directly in a browser tab — does it show the latest content? If yes, the issue is with Directus's iframe reload.

### Preview shows wrong layout for singletons

**Cause:** Singleton preview URLs point to `/preview/hero/<id>` which renders just the hero component. For context, singletons should use staging routes.

**Solution:** Set singleton preview URLs to staging routes:
```
hero → https://<domain>/staging/?token=...
about → https://<domain>/staging/about?token=...
site_settings → https://<domain>/staging/?token=...
```

## Deployment issues

### GitHub Actions: Cloudflare authentication error

**Cause:** The Cloudflare API token doesn't have Workers Scripts Edit permission.

**Solution:** Create a new token at https://dash.cloudflare.com/profile/api-tokens using the "Edit Cloudflare Workers" template. Update the GitHub secret:
```bash
gh secret set CLOUDFLARE_API_TOKEN -R stefanospp/infront-cms -b "<new-token>"
```

### Directus Flow doesn't trigger GitHub Actions

**Cause:** The GitHub PAT in the Flow operation may have expired or lack `actions:write` scope.

**Debug:** Test the PAT manually:
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  "https://api.github.com/repos/stefanospp/infront-cms/actions/workflows/deploy-cms-site.yml/dispatches" \
  -H "Authorization: Bearer <pat>" \
  -d '{"ref":"main","inputs":{"slug":"videoshoot"}}'
# Should return 204
```

### VPS admin API returns 403

**Cause:** The admin middleware's CSRF check blocks requests without matching Origin header, or session auth fails.

**Solution for server-to-server calls:** Include the `x-internal-key` header:
```bash
curl -X POST "https://web.infront.cy/api/sites/<slug>/redeploy" \
  -H "x-internal-key: <INTERNAL_API_KEY>"
```

This bypass was added to `sites/admin/src/middleware.ts` for server-to-server calls.

## Cloudflare Tunnel issues

### CMS domain not resolving

**Cause:** CNAME record not created in the correct zone, or tunnel config not updated.

**Check tunnel config:**
```bash
ssh root@49.12.4.77 'cat /etc/cloudflared/config.yml'
```

**Check DNS:**
```bash
dig cms.<domain> CNAME
```

### `cloudflared tunnel route dns` creates record in wrong zone

**Cause:** cloudflared's cert was issued for a different zone (e.g., infront.cy). It creates CNAMEs in the zone it has access to.

**Solution:** Create the CNAME manually via Cloudflare dashboard or API in the correct zone.
