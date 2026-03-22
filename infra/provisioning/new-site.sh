#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# New site provisioning script
#
# Usage:
#   ./new-site.sh <client-slug> <tier> <domain>
#
# Arguments:
#   client-slug   Lowercase alphanumeric + hyphens (e.g. "acme-corp")
#   tier          One of: static, cms, interactive
#   domain        The client's domain (e.g. "acme-corp.com")
#
# Example:
#   ./new-site.sh acme-corp cms acme-corp.com
# -------------------------------------------------------------------

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEMPLATES_DIR="${REPO_ROOT}/infra/provisioning/templates"
SITES_DIR="${REPO_ROOT}/sites"
TEMPLATE_SITE="${SITES_DIR}/template"
DOCKER_TEMPLATE="${REPO_ROOT}/infra/docker/template"

# --- Argument validation ---

if [ $# -ne 3 ]; then
  echo "Usage: $0 <client-slug> <tier> <domain>"
  exit 1
fi

CLIENT_SLUG="$1"
TIER="$2"
DOMAIN="$3"

# Validate client-slug format
if ! echo "${CLIENT_SLUG}" | grep -qE '^[a-z0-9][a-z0-9-]*[a-z0-9]$'; then
  echo "Error: client-slug must be lowercase alphanumeric with hyphens (min 2 chars)."
  echo "  Got: '${CLIENT_SLUG}'"
  exit 1
fi

# Validate tier
if [[ "${TIER}" != "static" && "${TIER}" != "cms" && "${TIER}" != "interactive" ]]; then
  echo "Error: tier must be one of: static, cms, interactive"
  echo "  Got: '${TIER}'"
  exit 1
fi

# Validate domain format (basic check)
if ! echo "${DOMAIN}" | grep -qE '^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$'; then
  echo "Error: domain must be a valid domain name."
  echo "  Got: '${DOMAIN}'"
  exit 1
fi

# Derive a display name from the slug (capitalize words)
CLIENT_NAME="$(echo "${CLIENT_SLUG}" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')"

SITE_DIR="${SITES_DIR}/${CLIENT_SLUG}"

# Check site doesn't already exist
if [ -d "${SITE_DIR}" ]; then
  echo "Error: Site directory already exists: ${SITE_DIR}"
  exit 1
fi

# Check that the template site exists
if [ ! -d "${TEMPLATE_SITE}" ]; then
  echo "Error: Template site not found at: ${TEMPLATE_SITE}"
  exit 1
fi

# --- Provision the site ---

echo "Provisioning new site: ${CLIENT_SLUG}"
echo "  Tier:   ${TIER}"
echo "  Domain: ${DOMAIN}"
echo "  Name:   ${CLIENT_NAME}"
echo ""

# 1. Copy template site
echo "[1/7] Copying site template..."
cp -r "${TEMPLATE_SITE}" "${SITE_DIR}"

# 2. Update package.json name
echo "[2/7] Updating package.json..."
if [ -f "${SITE_DIR}/package.json" ]; then
  sed -i.bak "s/\"name\": \"@agency\/template\"/\"name\": \"@agency\/${CLIENT_SLUG}\"/" "${SITE_DIR}/package.json"
  rm -f "${SITE_DIR}/package.json.bak"
fi

# 3. Generate site.config.ts from template
echo "[3/7] Generating site.config.ts..."
if [ -f "${TEMPLATES_DIR}/site.config.ts.tmpl" ]; then
  sed \
    -e "s/__CLIENT_NAME__/${CLIENT_NAME}/g" \
    -e "s/__CLIENT_SLUG__/${CLIENT_SLUG}/g" \
    -e "s/__CLIENT_DOMAIN__/${DOMAIN}/g" \
    -e "s/__CLIENT_TIER__/${TIER}/g" \
    "${TEMPLATES_DIR}/site.config.ts.tmpl" > "${SITE_DIR}/site.config.ts"
else
  cat > "${SITE_DIR}/site.config.ts" <<SITECONF
import { defineConfig } from "@agency/config";

export default defineConfig({
  client: {
    name: "${CLIENT_NAME}",
    slug: "${CLIENT_SLUG}",
  },
  domain: "${DOMAIN}",
  tier: "${TIER}",
  cms: {
    url: "https://cms.${DOMAIN}",
    token: "REPLACE_WITH_DIRECTUS_STATIC_TOKEN",
  },
  build: {
    outDir: "dist",
  },
});
SITECONF
fi

# 4. Generate tailwind.config.mjs from template
echo "[4/7] Generating tailwind.config.mjs..."
if [ -f "${TEMPLATES_DIR}/tailwind.config.mjs.tmpl" ]; then
  sed \
    -e "s/__PRIMARY_COLOR__/#1a1a2e/g" \
    -e "s/__SECONDARY_COLOR__/#16213e/g" \
    -e "s/__ACCENT_COLOR__/#e94560/g" \
    -e "s/__HEADING_FONT__/Inter/g" \
    -e "s/__BODY_FONT__/Inter/g" \
    "${TEMPLATES_DIR}/tailwind.config.mjs.tmpl" > "${SITE_DIR}/tailwind.config.mjs"
else
  cat > "${SITE_DIR}/tailwind.config.mjs" <<TWCONF
import baseConfig from "@agency/config/tailwind";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [baseConfig],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {},
  },
};
TWCONF
fi

# 5. Write CLAUDE.md for the site
echo "[5/7] Writing CLAUDE.md..."
cat > "${SITE_DIR}/CLAUDE.md" <<CLAUDEMD
# ${CLIENT_NAME} Site

## Overview
Client site for **${CLIENT_NAME}** (${DOMAIN}).
Tier: **${TIER}**

## Quick reference
- Slug: \`${CLIENT_SLUG}\`
- Config: \`site.config.ts\`
- Tailwind: \`tailwind.config.mjs\`

## Development
\`\`\`bash
pnpm --filter @agency/${CLIENT_SLUG} dev
\`\`\`

## Build
\`\`\`bash
pnpm --filter @agency/${CLIENT_SLUG} build
\`\`\`

## Notes
- This site was scaffolded from \`sites/template\` on $(date +%Y-%m-%d).
- Brand colors and fonts in \`tailwind.config.mjs\` are placeholders -- update them with the client's actual brand guidelines.
$(if [ "${TIER}" = "cms" ] || [ "${TIER}" = "interactive" ]; then
  echo "- CMS instance config is in \`infra/docker/${CLIENT_SLUG}/\`."
fi)
CLAUDEMD

# 6. Write .deploy.json for admin dashboard registration
echo "[6/7] Writing .deploy.json..."
cat > "${SITE_DIR}/.deploy.json" <<DEPLOYJSON
{
  "projectName": "${CLIENT_SLUG}",
  "stagingUrl": "",
  "productionUrl": null,
  "workersDevUrl": "",
  "lastDeployId": null,
  "lastDeployAt": null,
  "status": "pending",
  "error": null,
  "dnsRecordId": null,
  "buildLog": null
}
DEPLOYJSON

# 7. If CMS or interactive tier, copy Docker template
if [ "${TIER}" = "cms" ] || [ "${TIER}" = "interactive" ]; then
  echo "[7/7] Setting up CMS Docker config..."
  DOCKER_CLIENT_DIR="${REPO_ROOT}/infra/docker/${CLIENT_SLUG}"

  if [ -d "${DOCKER_TEMPLATE}" ]; then
    cp -r "${DOCKER_TEMPLATE}" "${DOCKER_CLIENT_DIR}"
    echo "  Docker config copied to: infra/docker/${CLIENT_SLUG}/"
  else
    echo "  Warning: Docker template not found at ${DOCKER_TEMPLATE}, skipping."
  fi
else
  echo "[7/7] Static tier -- skipping CMS Docker setup."
fi

# --- Create git branch ---

echo ""
echo "Creating git branch: onboard/${CLIENT_SLUG}..."
if command -v git &>/dev/null && [ -d "${REPO_ROOT}/.git" ]; then
  git -C "${REPO_ROOT}" checkout -b "onboard/${CLIENT_SLUG}" 2>/dev/null || \
    echo "  Note: Could not create branch (may already exist or not a git repo)."
else
  echo "  Skipped: not a git repository or git not available."
fi

# --- Completion checklist ---

echo ""
echo "============================================"
echo "  Site provisioned: ${CLIENT_SLUG}"
echo "============================================"
echo ""
echo "Remaining manual steps:"
echo ""
echo "  [ ] Update brand colors in sites/${CLIENT_SLUG}/tailwind.config.mjs"
echo "  [ ] Update fonts in sites/${CLIENT_SLUG}/tailwind.config.mjs"
echo "  [ ] Replace CMS token in sites/${CLIENT_SLUG}/site.config.ts"
if [ "${TIER}" = "cms" ] || [ "${TIER}" = "interactive" ]; then
  echo "  [ ] Fill in infra/docker/${CLIENT_SLUG}/.env from .env.example"
  echo "  [ ] Generate KEY and SECRET: openssl rand -hex 32"
  echo "  [ ] Set ADMIN_EMAIL and ADMIN_PASSWORD for the CMS"
  echo "  [ ] Set PUBLIC_URL to https://cms.${DOMAIN}"
  echo "  [ ] Start the CMS: cd infra/docker/${CLIENT_SLUG} && docker compose up -d"
fi
echo "  [ ] Add DNS records for ${DOMAIN}"
echo "  [ ] Configure deployment target in CI/CD"
echo "  [ ] Add client-specific content and pages"
echo "  [ ] Review and commit: git add sites/${CLIENT_SLUG} && git commit"
echo ""
