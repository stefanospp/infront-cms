# Nikolas Petrou — Claude Code Reference

Videographer & content creator portfolio site. SonicJs CMS on Cloudflare Workers.

## CMS

- **Type:** SonicJs (Cloudflare Workers + D1 + R2 + KV)
- **Project:** `infra/sonicjs/nikolaspetrou/`
- **Admin:** White-labeled as "Nikolas Petrou CMS" with light theme
- **Collections:** site_settings, hero, about, projects, services, testimonials, reels, submissions
- **Data layer:** `src/lib/cms.ts` — native SonicJs shapes, no mapping layer

## Running locally

```bash
# Terminal 1: CMS
cd infra/sonicjs/nikolaspetrou && npm run dev -- --port 8788

# Terminal 2: Seed (first time only)
cd infra/sonicjs/nikolaspetrou && SONICJS_URL=http://localhost:8788 npm run seed

# Terminal 3: Site
cd sites/nikolaspetrou && SONICJS_URL=http://localhost:8788 npx astro dev
```

## Credentials

- **Admin:** hello@infront.cy / np-admin-2026!
- **Editor:** nikolaspetrouu@hotmail.com / np-editor-2026!

## Key files

- `src/lib/types.ts` — CmsItem<T> interfaces for all collections
- `src/lib/cms.ts` — SonicJs fetch client with preview mode + buildConfig()
- `src/pages/staging/` — SSR preview routes (draft content)
- `src/pages/api/contact.ts` — stores submissions in SonicJs + sends email via Resend
- `public/_headers` — security headers (CSP, HSTS)
