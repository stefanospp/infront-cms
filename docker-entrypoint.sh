#!/bin/sh
# Write runtime env vars to a JSON file that the app reads at startup.
# This avoids Vite's build-time replacement of process.env references.

cat > /app/runtime-env.json << ENVJSON
{
  "CLOUDFLARE_API_TOKEN": "${CLOUDFLARE_API_TOKEN}",
  "CLOUDFLARE_ACCOUNT_ID": "${CLOUDFLARE_ACCOUNT_ID}",
  "CLOUDFLARE_ZONE_ID": "${CLOUDFLARE_ZONE_ID}",
  "PLATFORM_API_URL": "${PLATFORM_API_URL}",
  "INTERNAL_API_KEY": "${INTERNAL_API_KEY}"
}
ENVJSON

chmod 600 /app/runtime-env.json

# Site discovery and management now uses bind mounts at /data/sites
# and /data/infra (set via MONOREPO_ROOT=/data). No sync needed —
# the bind mounts reflect the git repo on the host directly.

exec node sites/admin/dist/server/entry.mjs
