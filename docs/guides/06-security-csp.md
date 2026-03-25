# Phase 6: Security & CSP Configuration

Configure Content Security Policy headers to allow CMS preview iframes while maintaining security.

## The problem

The CMS preview embeds the website in an iframe inside the Directus admin panel. Three security layers need to cooperate:

1. **The website** must allow being framed by the CMS domain
2. **The CMS (Directus)** must allow loading the website domain in its iframes
3. **SSR routes** must set iframe-friendly headers on their responses

If any layer blocks the iframe, the preview shows "This content is blocked."

## Step 6.1: Website security headers

Edit `sites/<slug>/public/_headers`:

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://plausible.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://plausible.io; media-src 'self' https://videos.pexels.com; frame-src https://www.youtube.com https://player.vimeo.com; frame-ancestors 'self' https://cms.<client-domain>; base-uri 'self'; form-action 'self'
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Key changes from default:**
- `frame-ancestors 'self' https://cms.<client-domain>` — allows the CMS to embed pages (was `'none'`)
- `X-Frame-Options: DENY` was **removed** — it conflicts with `frame-ancestors` CSP (browsers use CSP when both are present, but some older browsers only check X-Frame-Options)

**Preview routes section** (optional, for extra connect-src):
```
/preview/*
  Content-Security-Policy: default-src 'self'; ... connect-src 'self' https://cms.<client-domain>; ... frame-ancestors https://cms.<client-domain>; ...
```

## Step 6.2: Directus CSP (frame-src)

The Directus admin panel has its own CSP that blocks iframes to external domains by default. Add the client's domain to `frame-src`.

In `infra/docker/<slug>/docker-compose.yml`, add to the `environment:` section:

```yaml
CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC: "'self' https://<client-domain>"
```

**Format notes:**
- Use double underscores (`__`) to denote nested env vars in Directus
- The value must include `'self'` (with quotes) AND the full URL with https://
- Invalid values cause Directus to crash on startup with "Content-Security-Policy received an invalid directive value"

**Values that DON'T work:**
```yaml
# Wrong — "array:" prefix not supported
CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC: "array:self,https://example.com"

# Wrong — missing quotes around self
CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC: "self https://example.com"
```

**Correct:**
```yaml
CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC: "'self' https://example.com"
```

After changing, restart Directus:
```bash
docker compose --env-file .env up -d --force-recreate directus
```

Verify:
```bash
curl -sI https://cms.<domain>/admin/ | grep content-security-policy
# Should include: frame-src 'self' https://<client-domain>
```

## Step 6.3: SSR route response headers

In the preview and staging Astro routes, set headers to allow iframe embedding:

```astro
---
// Allow Directus to embed this page in an iframe
Astro.response.headers.set('X-Frame-Options', 'ALLOWALL');
Astro.response.headers.set('Content-Security-Policy',
  'frame-ancestors https://cms.<client-domain>');
---
```

These override the global `_headers` file for SSR responses (since `_headers` only applies to static files served by Cloudflare's asset handler).

## Step 6.4: Token-based route protection

All preview and staging routes must be protected by a token to prevent unauthorized access:

```astro
---
const PREVIEW_TOKEN = import.meta.env.PREVIEW_TOKEN || 'preview-secret';
const token = Astro.url.searchParams.get('token');

if (token !== PREVIEW_TOKEN) {
  return new Response('Unauthorized', { status: 401 });
}
---
```

The token is passed via query parameter: `?token=<PREVIEW_TOKEN>`.

**Where the token is set:**
- Local: `sites/<slug>/.env` → `PREVIEW_TOKEN=np-preview-2026-secret`
- CI/CD: GitHub secret → `PREVIEW_TOKEN`
- VPS: `/opt/infront-cms/sites/<slug>/.env` → `PREVIEW_TOKEN`
- Directus: embedded in preview URL templates

## Summary: three-point CSP checklist

| Location | What to set | Purpose |
|----------|-------------|---------|
| `public/_headers` | `frame-ancestors 'self' https://cms.<domain>` | Allow CMS to iframe the static site |
| docker-compose.yml | `CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC: "'self' https://<domain>"` | Allow Directus admin to load site in iframe |
| SSR route headers | `Astro.response.headers.set('Content-Security-Policy', 'frame-ancestors https://cms.<domain>')` | Allow CMS to iframe SSR responses |

All three must be configured. Missing any one causes "content is blocked" in the preview panel.
