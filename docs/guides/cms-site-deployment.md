# CMS Site Deployment Guide

Complete guide for deploying a client site with Directus CMS integration — from static design to fully managed CMS-powered site with preview, staging, and automated publishing.

This guide documents the exact process used to deploy nikolaspetrou.com and serves as the reference for all future CMS site deployments.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Site Deployment to Cloudflare Workers](./01-site-deployment.md)
4. [Phase 2: CMS Setup (Directus on VPS)](./02-cms-setup.md)
5. [Phase 3: Wiring Pages to CMS](./03-wiring-pages.md)
6. [Phase 4: Preview & Staging System](./04-preview-staging.md)
7. [Phase 5: Publishing Workflow & CI/CD](./05-publishing-workflow.md)
8. [Phase 6: Security & CSP Configuration](./06-security-csp.md)
9. [Troubleshooting](./07-troubleshooting.md)

## Overview

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Nikolas (CMS User)                    │
│              cms.nikolaspetrou.com/admin                 │
└──────────────────────┬──────────────────────────────────┘
                       │ Edit → Save (draft) → Preview → Publish
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Directus CMS (Hetzner VPS)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Directus    │  │  PostgreSQL  │  │  Directus     │  │
│  │  11.17       │  │  16 Alpine   │  │  Flows        │  │
│  │  Port 8057   │  │  (db_data)   │  │  (Publish)    │  │
│  └──────┬──────┘  └──────────────┘  └───────┬───────┘  │
│         │ Cloudflare Tunnel                   │          │
│         ▼                                     ▼          │
│  cms.nikolaspetrou.com              GitHub Actions API   │
└─────────────────────────────────────────────┬───────────┘
                                              │
                       ┌──────────────────────▼───────────┐
                       │         GitHub Actions            │
                       │  deploy-cms-site.yml              │
                       │  1. pnpm install                  │
                       │  2. astro build (fetch CMS data)  │
                       │  3. wrangler deploy               │
                       └──────────────────────┬───────────┘
                                              │
                       ┌──────────────────────▼───────────┐
                       │      Cloudflare Workers           │
                       │  ┌────────────┐ ┌──────────────┐ │
                       │  │ Static     │ │ SSR Routes   │ │
                       │  │ Pages      │ │ /preview/*   │ │
                       │  │ (prebuilt) │ │ /staging/*   │ │
                       │  └────────────┘ └──────────────┘ │
                       │  nikolaspetrou.com                │
                       └──────────────────────────────────┘
```

### Key decisions made during this deployment

| Decision | Choice | Why |
|----------|--------|-----|
| Hosting | Cloudflare Workers | Platform standard, free tier, global edge |
| CMS | Directus 11.17 on Docker | Self-hosted, full control, MCP support |
| Build trigger | GitHub Actions | Clean CI, reliable, visible logs |
| Preview | SSR routes (hybrid Astro) | Real-time draft preview without rebuild |
| Publishing | Manual Directus Flow | Prevents accidental deploys, batch all changes |
| Default status | Draft | Safe editing — live site unaffected until explicit publish |
| Email | Resend SMTP port 587 | Port 465 blocked on Hetzner VPS |

### Timeline estimate

| Phase | Time |
|-------|------|
| Site deployment (Workers + custom domain) | 15 min |
| CMS setup (Docker, tunnel, schema, users) | 30 min |
| Wiring pages to CMS | 30 min |
| Preview & staging system | 45 min |
| Publishing workflow & CI/CD | 30 min |
| Security & CSP | 15 min |
| **Total** | **~3 hours** |

## Prerequisites

Before starting, ensure you have:

- [ ] The static site already built and working locally in `sites/<slug>/`
- [ ] SSH access to the Hetzner VPS (`ssh root@49.12.4.77`)
- [ ] Cloudflare account with the client's domain added
- [ ] GitHub repo access (`stefanospp/infront-cms`)
- [ ] `wrangler` CLI authenticated (`wrangler login`)
- [ ] `gh` CLI authenticated (`gh auth login`)
- [ ] Resend API key (for transactional emails)
- [ ] The SSH key for the VPS (`~/.ssh/id_hetzner_new`)
