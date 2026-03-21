FROM node:22-slim

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json .npmrc ./
COPY packages/config/package.json packages/config/
COPY packages/utils/package.json packages/utils/
COPY packages/ui/package.json packages/ui/
COPY sites/admin/package.json sites/admin/
COPY sites/template/package.json sites/template/

RUN npm ci

# Copy source files
COPY packages/ packages/
COPY sites/admin/ sites/admin/
COPY sites/template/ sites/template/
COPY tsconfig.base.json ./

# Build the admin site
RUN npm run build --workspace=sites/admin

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

# Volume for generated client sites (persists across deploys)
VOLUME /app/sites

CMD ["node", "sites/admin/dist/server/entry.mjs"]
