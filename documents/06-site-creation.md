# Site Creation

## Overview

New sites are created through the admin dashboard's 5-step wizard or via the CLI provisioning script. The wizard generates a complete Astro site from a template with customized branding.

## Wizard Flow

### Step 1: Client Details
- Client/Site Name
- Site Slug (auto-generated from name, editable)
- Tagline
- Domain
- Site Tier (static / cms / interactive)

### Step 2: Choose Template
5 templates available:

| Template | Description | Pages |
|----------|-------------|-------|
| **Business Starter** | Clean, professional for service businesses | Home, About, Contact, Privacy, Terms |
| **Restaurant** | Warm, inviting with menu highlights | Home, Menu, About, Contact, Privacy, Terms |
| **Portfolio** | Minimal, image-forward for creatives | Home, Gallery, About, Contact, Privacy, Terms |
| **SaaS** | Modern with features grid and pricing | Home, Features, Pricing, About, Contact, FAQ, Privacy, Terms |
| **Professional** | Authoritative with stats and case studies | Home, Services, Case Studies, About, Contact, Privacy, Terms |

### Step 3: Theme
- **Brand Colours**: Primary, Secondary, Accent (full 50-950 scale with color picker)
- **Typography**: Heading font, Body font
- **Layout Options**: Nav style (sticky/fixed/static), Footer style (simple/multi-column/minimal), Hero default (centered/split/fullscreen/minimal), Border style (sharp/rounded/pill)

### Step 4: Configuration
- **Contact Information**: Email, phone, address
- **Navigation Items**: Label + path pairs, add/remove, CTA button
- **SEO Defaults**: Title, template, description
- **Analytics**: Provider (Plausible/Fathom/Google) + site ID

### Step 5: Review & Create
- Summary of all settings
- Click "Create Site" → generates files + starts background deploy

## What the Generator Creates

The generator (`sites/admin/src/lib/generator.ts`) performs these steps:

1. Validate slug and domain
2. Check site doesn't already exist
3. Look up template definition
4. Copy `sites/template/` → `sites/{slug}/`
5. Write `package.json` with `@agency/{slug}` name
6. Write `site.config.ts` with all contact, nav, footer, SEO, theme settings
7. Write `src/styles/global.css` with brand tokens via `@theme` blocks
8. Generate pages from template definition using the schema compiler
9. Set up CMS infrastructure (if tier is cms/interactive)
10. Write `astro.config.mjs` with Vite plugins
11. Write `wrangler.toml` for Workers deployment
12. Write CLAUDE.md with site-specific documentation
13. Return checklist of post-generation tasks

## Generated File Structure

```
sites/{slug}/
├── package.json
├── site.config.ts
├── astro.config.mjs
├── wrangler.toml
├── tsconfig.json
├── CLAUDE.md
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   ├── _headers
│   └── _redirects
└── src/
    ├── styles/
    │   └── global.css        # Brand tokens
    └── pages/
        ├── index.astro
        ├── about.astro
        ├── contact.astro
        ├── privacy.astro
        ├── terms.astro
        ├── 404.astro
        └── ... (template-specific pages)
```

## CLI Provisioning

Alternative to the wizard:

```bash
./infra/provisioning/new-site.sh <slug> <tier> <domain>
```

## Post-Creation

After generation, the wizard automatically:
1. Writes `.deploy.json` with initial metadata
2. Kicks off background deployment (build → wrangler deploy → DNS → live)
3. UI polls deploy status every 3 seconds showing progress

The site is live at `{slug}.infront.cy` within ~30 seconds.
