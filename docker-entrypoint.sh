#!/bin/sh
# Write runtime env vars to a JSON file that the app reads at startup.
# This avoids Vite's build-time replacement of process.env references.

cat > /app/runtime-env.json << ENVJSON
{
  "CLOUDFLARE_API_TOKEN": "${CLOUDFLARE_API_TOKEN}",
  "CLOUDFLARE_ACCOUNT_ID": "${CLOUDFLARE_ACCOUNT_ID}",
  "CLOUDFLARE_ZONE_ID": "${CLOUDFLARE_ZONE_ID}"
}
ENVJSON

chmod 600 /app/runtime-env.json

# Always sync admin + template from image so new builds take effect.
# The volume mount overrides /app/sites/ with old data, so we must
# copy the freshly-built admin back from the baked snapshot.
if [ -d /app/_baked-sites/admin ]; then
  echo "[entrypoint] Syncing admin site from image"
  rm -rf /app/sites/admin
  cp -r /app/_baked-sites/admin /app/sites/admin
fi
if [ -d /app/_baked-sites/template ]; then
  echo "[entrypoint] Syncing template site from image"
  rm -rf /app/sites/template
  cp -r /app/_baked-sites/template /app/sites/template
fi

# Sync baked-in client sites into the volume so that sites added via git
# (not the wizard) are visible to the admin dashboard.
if [ -d /app/_baked-sites ]; then
  for dir in /app/_baked-sites/*/; do
    slug=$(basename "$dir")
    if [ "$slug" = "admin" ] || [ "$slug" = "template" ]; then
      continue  # Already synced above
    fi
    if [ ! -d "/app/sites/$slug" ]; then
      echo "[entrypoint] Syncing baked-in site: $slug"
      cp -r "$dir" "/app/sites/$slug"
    fi
  done
fi

# Sync baked-in infra (docker configs for CMS tier detection)
if [ -d /app/_baked-infra ]; then
  for dir in /app/_baked-infra/docker/*/; do
    slug=$(basename "$dir")
    if [ "$slug" = "template" ]; then
      continue
    fi
    if [ ! -d "/app/infra/docker/$slug" ]; then
      echo "[entrypoint] Syncing baked-in infra: $slug"
      mkdir -p /app/infra/docker
      cp -r "$dir" "/app/infra/docker/$slug"
    fi
  done
fi

exec node sites/admin/dist/server/entry.mjs
