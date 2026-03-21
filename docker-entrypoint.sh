#!/bin/sh
# Write runtime env vars to a JSON file that the app reads at startup.
# This avoids Vite's build-time replacement of process.env references.

cat > /app/runtime-env.json << ENVJSON
{
  "ADMIN_PASSWORD_HASH": "${ADMIN_PASSWORD_HASH}",
  "SESSION_SECRET": "${SESSION_SECRET}",
  "CLOUDFLARE_API_TOKEN": "${CLOUDFLARE_API_TOKEN}",
  "CLOUDFLARE_ACCOUNT_ID": "${CLOUDFLARE_ACCOUNT_ID}",
  "CLOUDFLARE_ZONE_ID": "${CLOUDFLARE_ZONE_ID}"
}
ENVJSON

exec node sites/admin/dist/server/entry.mjs
