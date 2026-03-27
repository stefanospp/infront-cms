# Payload CMS — Platform CMS

## What is Payload CMS?

[Payload](https://payloadcms.com) is a headless CMS built on Next.js. It runs on Cloudflare Workers with D1 (SQLite) for database and R2 for media storage. It replaces SonicJs as the primary CMS for all new client sites.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Cloudflare Workers                     │
│                                                          │
│  ┌─────────────┐        ┌──────────────────────┐        │
│  │ Astro Site   │──API──▶│ Payload CMS Worker   │        │
│  │ (Static +    │        │ (Next.js + OpenNext)  │        │
│  │  SSR Preview)│        │                       │        │
│  │              │        │  /admin  ← Admin UI   │        │
│  │  /           │        │  /api/*  ← REST API   │        │
│  │  /preview/*  │        │                       │        │
│  └─────────────┘        └───────┬──────┬────────┘        │
│                                  │      │                 │
│                           ┌──────┘      └──────┐         │
│                           ▼                    ▼         │
│                     ┌──────────┐        ┌──────────┐     │
│                     │ D1       │        │ R2       │     │
│                     │ (SQLite) │        │ (Media)  │     │
│                     └──────────┘        └──────────┘     │
└─────────────────────────────────────────────────────────┘
```

## Current Deployments

| Client | CMS URL | Site URL | D1 Database | Status |
|--------|---------|----------|-------------|--------|
| nikolaspetrou | cms-nikolaspetrou.stepet.workers.dev | nikolaspetrou.com | nikolaspetrou-payload | Production |

## Why Payload over SonicJs?

| Feature | SonicJs | Payload |
|---------|---------|---------|
| Admin UI | Basic, limited customisation | Full React admin, highly customisable |
| Collections/Fields | Code-defined, limited types | Rich field types, groups, arrays, relations |
| Media | Basic R2 upload | R2 with crop (non-Workers), focal point |
| Live Preview | Not supported | Built-in iframe preview with postMessage |
| Auth/Roles | Basic | Full auth, roles, access control |
| Rich Text | None | Lexical editor (block-based) |
| Globals | Manual | First-class support |
| Versions/Drafts | None | Built-in draft/publish workflow |
| API | Custom REST | Auto-generated REST + GraphQL |
| Ecosystem | Small | Large, active community, plugins |

## Limitations on Cloudflare Workers

- **No image crop/focal point** — `sharp` not available on Workers
- **No GraphQL** — workerd limitation (REST API works fine)
- **Paid Workers plan required** — bundle exceeds 3MB free tier
- **D1 is SQLite** — no advanced PostgreSQL features, 10GB max
- **Custom logger required** — pino-pretty uses Node fs.write
- **Bundle size** — large, may hit edge cases with esbuild

## Reference Implementation

**nikolaspetrou** — fully deployed Payload CMS + Astro site:
- CMS: `infra/payload/nikolaspetrou/`
- Site: `sites/nikolaspetrou-v2/`
- Guide: `infra/payload/GUIDE.md`
