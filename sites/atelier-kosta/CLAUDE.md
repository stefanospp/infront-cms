# Atelier Kosta — Claude Code Reference

Boutique architecture studio site. Custom design with CMS-powered content via Directus.

## Key files
- `site.config.ts` — site identity, nav, footer, SEO, theme
- `src/styles/global.css` — brand tokens: charcoal, warm sand, off-white; Cormorant Garamond + Work Sans
- `src/components/Hero.astro` — custom Hero override (full-bleed architecture portfolio hero)
- `src/lib/directus.ts` — Directus client with custom `projects` collection
- `src/pages/projects/` — masonry grid + editorial detail pages

## Tier: CMS
- CMS powered by Directus (see infra/docker/atelier-kosta/)
- Custom collection: `projects` (architecture portfolio)
- Standard collections: team, testimonials, gallery, etc.

## Design
- Minimal, whitespace-heavy architectural aesthetic
- Sharp borders (no rounded corners)
- Charcoal (#2d2d2d), warm sand (#d4c5a9), off-white (#f5f2ed)
- Cormorant Garamond headings, Work Sans body
