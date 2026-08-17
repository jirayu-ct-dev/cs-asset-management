FROM node:22.18.0-bookworm-slim AS dependencies

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN corepack enable && corepack prepare pnpm@11.18.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS build

COPY . .
RUN pnpm build

FROM node:22.18.0-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV CHROMIUM_PATH=/usr/bin/chromium
WORKDIR /app

RUN apt-get update \
  && apt-get install --no-install-recommends -y chromium fonts-noto-core fonts-thai-tlwg \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nuxt \
  && mkdir -p /app/storage/uploads \
  && chown -R nuxt:nodejs /app

COPY --from=build --chown=nuxt:nodejs /app/.output ./.output

USER nuxt
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
