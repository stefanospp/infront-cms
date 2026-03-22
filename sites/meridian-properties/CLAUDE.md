# Meridian Properties — Claude Code Reference

Client site generated from template "Professional" on 2026-03-22.

## Key files
- `site.config.ts` — site identity, nav, footer, SEO, analytics, theme
- `src/styles/global.css` — brand tokens (colours, fonts) via Tailwind @theme
- `astro.config.mjs` — Astro configuration, site URL
- `public/` — static assets, robots.txt, security headers

## Tier: cms
- CMS powered by Directus (see infra/docker/meridian-properties/)

## Customisation checklist
1. Replace favicon and OG image in public/
2. Update `_headers` CSP if adding third-party scripts
3. Customise component variants and layouts for each page
4. Add/remove pages as needed
5. Run `pnpm install` from monorepo root
6. Run `pnpm dev --filter @agency/meridian-properties` to start dev server
