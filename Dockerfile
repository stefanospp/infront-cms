FROM node:22.14-slim

# Install pnpm with pinned version for reproducible builds
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install git (needed for versioning features)
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/utils/package.json packages/utils/
COPY packages/ui/package.json packages/ui/
COPY sites/admin/package.json sites/admin/
COPY sites/template/package.json sites/template/

RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/ packages/
COPY sites/ sites/
COPY infra/ infra/
COPY tsconfig.base.json ./

# Build the admin site
RUN pnpm --filter @agency/admin run build

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

# Stage baked-in sites and infra so the entrypoint can sync them into the
# volume at startup. This ensures sites added via git are not masked by
# the persistent Docker volume mounted at /app/sites.
RUN cp -r /app/sites /app/_baked-sites && cp -r /app/infra /app/_baked-infra

# Create non-root user for security
RUN groupadd -r agency && useradd -r -g agency -d /app agency
RUN chown -R agency:agency /app

# Entrypoint script writes runtime env vars to JSON then starts the server
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4321/health || exit 1

USER agency

ENTRYPOINT ["/app/docker-entrypoint.sh"]
