# Template Site — Claude Code Reference

This is the base site template. Copy this folder for every new client site.

## Structure
- `site.config.ts` — all site-specific settings (identity, nav, footer, SEO, analytics, theme)
- `tailwind.config.mjs` — brand tokens (colours, fonts, spacing)
- `src/pages/` — all pages (index, about, contact, privacy, terms, 404)
- `src/pages/api/` — server-side API routes (contact form)
- `src/lib/directus.ts` — Directus client for CMS-backed sites
- `src/content/` — Astro Content Collections for static content
- `public/` — static assets, robots.txt, security headers, redirects

## Customisation checklist
1. Update `site.config.ts` with client details
2. Update `tailwind.config.mjs` with brand colours and fonts
3. Update `astro.config.mjs` site URL and image domains
4. Replace favicon and OG image
5. Update `robots.txt` sitemap URL
6. Update `_headers` CSP if adding third-party scripts
7. Choose component variants and layouts for each page
8. Add/remove pages as needed
