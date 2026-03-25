# Phase 5: Publishing Workflow & CI/CD

Set up the "Publish to live" Directus Flow and GitHub Actions deployment pipeline.

## Step 5.1: Create GitHub Actions workflow

Create `.github/workflows/deploy-cms-site.yml`:

```yaml
name: Deploy CMS Site

on:
  workflow_dispatch:
    inputs:
      slug:
        description: 'Site slug (e.g. videoshoot, theorium)'
        required: true
        type: string

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      SITE_SLUG: ${{ inputs.slug }}
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --no-frozen-lockfile

      - name: Build site
        run: pnpm --filter "@agency/${SITE_SLUG}" run build
        env:
          DIRECTUS_URL: ${{ secrets.DIRECTUS_URL }}
          DIRECTUS_TOKEN: ${{ secrets.DIRECTUS_TOKEN }}
          PREVIEW_TOKEN: ${{ secrets.PREVIEW_TOKEN }}

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: sites/${{ inputs.slug }}
          command: deploy
```

**Why `--no-frozen-lockfile`:** The monorepo lockfile may be out of sync when new dependencies are added to site packages (e.g., `@astrojs/cloudflare`). Using `--no-frozen-lockfile` allows pnpm to resolve dependencies fresh.

**Reusable:** This single workflow works for ALL CMS sites — just pass a different `slug` input.

### Push and set secrets

```bash
git add .github/workflows/deploy-cms-site.yml
git commit -m "Add GitHub Actions workflow for CMS-triggered site deployments"
git push origin main
```

Set GitHub secrets:
```bash
gh secret set DIRECTUS_URL -R stefanospp/infront-cms -b "https://cms.<domain>"
gh secret set DIRECTUS_TOKEN -R stefanospp/infront-cms -b "<static-api-token>"
gh secret set PREVIEW_TOKEN -R stefanospp/infront-cms -b "<preview-secret>"
gh secret set CLOUDFLARE_API_TOKEN -R stefanospp/infront-cms -b "<cf-api-token>"
gh secret set CLOUDFLARE_ACCOUNT_ID -R stefanospp/infront-cms -b "<cf-account-id>"
```

**Cloudflare API token requirements:** The token must have these permissions:
- Account: Workers KV Storage — Edit
- Account: Workers Scripts — Edit
- Zone: Workers Routes — Edit
- Account: Account Settings — Read
- User: User Details — Read
- Account: Workers R2 Storage — Edit (if using R2)

Create one at https://dash.cloudflare.com/profile/api-tokens using the "Edit Cloudflare Workers" template.

### Test the workflow

```bash
gh workflow run deploy-cms-site.yml -R stefanospp/infront-cms -f slug=videoshoot

# Wait ~60s, then check:
gh run list -R stefanospp/infront-cms --workflow=deploy-cms-site.yml -L 1
```

## Step 5.2: Create a GitHub Personal Access Token

The Directus Flow needs a GitHub PAT to trigger the workflow.

1. Go to https://github.com/settings/tokens/new
2. Name: `Directus Deploy Trigger`
3. Scope: `repo` (or fine-grained: `actions:write`, `contents:read`)
4. No expiration (or set a long one)
5. Copy the token

## Step 5.3: Create Directus "Publish to live" Flow

### Create the Flow

```bash
TOKEN="<admin-directus-token>"
API="https://cms.<domain>"

# Create the manual-trigger flow
FLOW_ID=$(curl -s -X POST "$API/flows" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Publish to live",
    "icon": "rocket_launch",
    "description": "Publish all draft content and deploy the live website",
    "status": "active",
    "trigger": "manual",
    "options": {
      "collections": ["projects","services","testimonials","reels","hero","about","site_settings"],
      "requireConfirmation": true,
      "confirmationDescription": "This will publish all draft content and rebuild the live website. Changes will be live in about 60 seconds."
    }
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
echo "Flow ID: $FLOW_ID"
```

### Create publish operations (one per collection)

```bash
COLLECTIONS="projects services testimonials reels hero about site_settings"
STATIC_TOKEN="<directus-static-api-token>"
PREV_OP_ID=""

for coll in $COLLECTIONS; do
  OP_ID=$(curl -s -X POST "$API/operations" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"flow\": \"$FLOW_ID\",
      \"name\": \"Publish $coll\",
      \"key\": \"publish_$coll\",
      \"type\": \"request\",
      \"options\": {
        \"method\": \"PATCH\",
        \"url\": \"$API/items/$coll?filter[status][_eq]=draft\",
        \"headers\": [
          {\"header\": \"Authorization\", \"value\": \"Bearer $STATIC_TOKEN\"},
          {\"header\": \"Content-Type\", \"value\": \"application/json\"}
        ],
        \"body\": \"{\\\"status\\\": \\\"published\\\"}\"
      }
    }" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

  # Chain to previous operation
  if [ -n "$PREV_OP_ID" ]; then
    curl -s -X PATCH "$API/operations/$PREV_OP_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"resolve\": \"$OP_ID\"}"
  else
    # First operation — set as flow entry point
    curl -s -X PATCH "$API/flows/$FLOW_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"operation\": \"$OP_ID\"}"
  fi

  PREV_OP_ID="$OP_ID"
  echo "Created publish_$coll: $OP_ID"
done
```

### Create the GitHub Actions trigger operation

```bash
GITHUB_PAT="<github-personal-access-token>"
GITHUB_REPO="stefanospp/infront-cms"
SITE_SLUG="videoshoot"

REBUILD_OP_ID=$(curl -s -X POST "$API/operations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"flow\": \"$FLOW_ID\",
    \"name\": \"Trigger rebuild\",
    \"key\": \"trigger_rebuild\",
    \"type\": \"request\",
    \"options\": {
      \"method\": \"POST\",
      \"url\": \"https://api.github.com/repos/$GITHUB_REPO/actions/workflows/deploy-cms-site.yml/dispatches\",
      \"headers\": [
        {\"header\": \"Authorization\", \"value\": \"Bearer $GITHUB_PAT\"},
        {\"header\": \"Accept\", \"value\": \"application/vnd.github.v3+json\"},
        {\"header\": \"Content-Type\", \"value\": \"application/json\"}
      ],
      \"body\": \"{\\\"ref\\\": \\\"main\\\", \\\"inputs\\\": {\\\"slug\\\": \\\"$SITE_SLUG\\\"}}\"
    }
  }" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

# Chain last publish operation to the rebuild
curl -s -X PATCH "$API/operations/$PREV_OP_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"resolve\": \"$REBUILD_OP_ID\"}"

echo "Created trigger_rebuild: $REBUILD_OP_ID"
```

### Operation chain

```
publish_projects → publish_services → publish_testimonials →
publish_reels → publish_hero → publish_about →
publish_site_settings → trigger_rebuild (GitHub Actions)
```

## Step 5.4: End-to-end test

1. **Change content** in the CMS (e.g., change a project title)
2. **Trigger the Flow** from the Directus sidebar (Flows section → "Publish to live" → Confirm)
3. **Check GitHub Actions**: `gh run list -R stefanospp/infront-cms --workflow=deploy-cms-site.yml -L 1`
4. **Verify live site** shows updated content (~60s after trigger)

### Manual test via API

```bash
# Change a title
curl -X PATCH "https://cms.<domain>/items/projects/<id>" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Title"}'

# Trigger GitHub Actions directly
curl -X POST "https://api.github.com/repos/stefanospp/infront-cms/actions/workflows/deploy-cms-site.yml/dispatches" \
  -H "Authorization: Bearer <github-pat>" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{"ref":"main","inputs":{"slug":"videoshoot"}}'

# Wait 60-90s, then verify
curl -s "https://<domain>/" | grep "Test Title"
```

## Previous approaches tried and why they were abandoned

### Auto-rebuild webhook (removed)
Directus Flow triggered on every `items.create/update/delete`. Problem: rebuilds on every save during editing sessions — too aggressive and wasteful.

### Admin Docker container build (removed)
The admin container's redeploy endpoint tried to run `pnpm install && astro build && wrangler deploy` inside the Docker container. Problems:
- Permission denied: container runs as uid 999, host files owned by root
- Missing dependencies: only `sites/` and `infra/` mounted, not `packages/` or `node_modules/`
- Corepack/pnpm version conflicts
- The CSRF middleware blocked the Directus Flow's POST request (different origin, no session cookie)

### Why GitHub Actions is better
- Clean environment on every run — no stale dependencies or permission issues
- Full monorepo available — pnpm resolves all workspace dependencies
- Visible logs — easy to debug failures
- Reusable — same workflow for all sites, just pass a different slug
- No VPS dependency for building — VPS only runs CMS and tunnel
