# Authentication — infront-cms

## Overview

The admin UI at `web.infront.cy` authenticates users via the central auth service at `auth.infront.cy`. There is no local auth logic — the middleware verifies sessions by calling the auth service.

## Architecture

```
Browser → web.infront.cy (Astro SSR)
           │
           ├── Middleware: reads session cookie, calls auth.infront.cy/api/auth/get-session
           │   If valid → attaches user to context.locals, continues
           │   If invalid → redirects to auth.infront.cy/login?redirect=<current-url>
           │
           └── Logout button: calls auth.infront.cy/api/auth/sign-out, redirects to login
```

## How It Works

1. User visits `web.infront.cy`
2. Astro middleware reads the session cookie (set on `.infront.cy` by auth.infront.cy)
3. Middleware calls `auth.infront.cy/api/auth/get-session` with the cookie
4. If valid: `context.locals.user` and `context.locals.session` are populated
5. If invalid: user is redirected to `auth.infront.cy/login?redirect=<original-url>`
6. After login at auth.infront.cy, user is redirected back to web.infront.cy

## Key Files

| File | Purpose |
|------|---------|
| `sites/admin/src/middleware.ts` | Session verification via auth.infront.cy |
| `sites/admin/src/pages/login.astro` | Redirects to auth.infront.cy/login |
| `sites/admin/src/layouts/AdminLayout.astro` | Logout button calls auth service sign-out |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTH_SERVICE_URL` | No | `https://auth.infront.cy` | Central auth service URL (server-side) |
| `PUBLIC_AUTH_SERVICE_URL` | No | `https://auth.infront.cy` | Central auth service URL (client-side JS) |

These are set in `infra/admin/deploy.yml` for production.

## Public Routes

The following paths skip authentication:
- `/login` — Redirects to auth.infront.cy
- `/health` — Health check endpoint
- `/_astro/*` — Static assets
- `/assets/*` — Static assets

## Previous Auth (Removed)

The admin UI previously had its own password + JWT auth system:
- `src/lib/auth.ts` — JWT creation/verification with `jose`, password checking with `bcryptjs`
- `src/pages/api/auth/login.ts` — Local login endpoint
- `src/pages/api/auth/logout.ts` — Local logout endpoint
- `src/islands/LoginForm.tsx` — React login form

All of these have been removed. Auth is now fully delegated to auth.infront.cy.
