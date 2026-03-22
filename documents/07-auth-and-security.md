# Authentication & Security

## Authentication

### Login Flow

1. User submits password to `POST /api/auth/login`
2. Server verifies password against bcrypt hash (`ADMIN_PASSWORD_HASH`)
3. Creates JWT session token (HS256, 24h expiry, issuer: `agency-admin`)
4. Sets `session` cookie (httpOnly, secure, sameSite=strict)
5. Middleware verifies token on every protected request

### JWT Payload

```typescript
interface SessionPayload {
  role: 'admin' | 'client';
  allowedSites?: string[];  // Client users only
}
```

### Roles

| Role | Access |
|------|--------|
| **admin** | Full access to all sites and operations |
| **client** | Scoped to `allowedSites` only, content management |

### Authorization Helpers

```typescript
import { getSessionPayload, canAccessSite, isAdmin } from '@/lib/auth';

// Extract claims from JWT
const session = await getSessionPayload(token, secret);

// Check site access
canAccessSite(session, 'my-site');  // admin: always true, client: checks allowedSites

// Check admin role
isAdmin(session);  // true for admin, false for client
```

### Middleware

`sites/admin/src/middleware.ts` protects all routes except:
- `/login`
- `/api/auth/*`

Uses the `env()` helper which reads from `.env` file (local dev) or `/app/runtime-env.json` (Docker).

## Security

### Input Validation

- All API routes validate `slug` parameter: `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/`
- All `page` parameters validated: `/^[a-z0-9][a-z0-9-]*$/`
- Request bodies validated with zod schemas
- Prevents path traversal in slug and page parameters

### File Upload Security

- Extension whitelist: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`, `.svg`, `.ico`
- 5MB max file size
- Filenames sanitized (lowercase, hyphens, alphanumeric only)
- Path traversal protection (`startsWith(mediaDir)` check)
- `path.basename()` on delete to prevent directory traversal

### Export Security

- Excludes `.env`, `.env.*`, `.deploy.json`, `runtime-env.json`, `.key`, `.pem` files
- Excludes `node_modules`, `.git`, `dist`, `.astro` directories
- No absolute server paths in responses

### Git Operations Security

- Uses `execFileAsync` (not `exec`) to prevent shell injection
- Commit hash validated: `/^[a-f0-9]{7,40}$/`
- Git `checkout` used for reverts (not destructive `reset`)

### Security Headers

Each site has `public/_headers` with:
- Content-Security-Policy
- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### Secrets Management

- All secrets via Doppler (not in git)
- Admin reads from `.env` (local) or `runtime-env.json` (Docker)
- API tokens never exposed to client-side code
