# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# deps: install node_modules once and reuse the layer across builds.
# ---------------------------------------------------------------------------
FROM node:24-slim AS deps
WORKDIR /app

# openssl is required by Prisma's query engine on debian-slim images.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma

# `npm ci` runs the postinstall hook, which generates the Prisma client.
RUN npm ci

# ---------------------------------------------------------------------------
# builder: compile the Next.js standalone bundle.
# ---------------------------------------------------------------------------
FROM node:24-slim AS builder
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=true

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so they
# must be present here and not only at runtime. Coolify passes them through as
# build args when they are declared as build-time variables.
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_MARKETING_URL
ARG NEXT_PUBLIC_APP_BASE_HOST
ARG NEXT_PUBLIC_UPLOAD_TRANSPORT
ARG NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST
ARG NEXT_PUBLIC_WEBHOOK_BASE_URL
ARG NEXT_PUBLIC_HANKO_TENANT_ID
# next.config.mjs builds `has: [{ type: "host", value: <host> }]` header rules
# from these. Next rejects the rule outright when the value is undefined, so
# they must be set at build time even for a single-domain deployment — point
# them all at the app host.
ARG NEXT_PUBLIC_API_BASE_HOST
ARG NEXT_PUBLIC_MCP_BASE_HOST
ARG NEXT_PUBLIC_WEBHOOK_BASE_HOST
# No secrets are needed to build: the OpenAI, Stripe, Hanko and Slack clients
# are all constructed on first use rather than at import, so `next build` can
# collect page data without credentials. Supply them as runtime variables.
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_MARKETING_URL=$NEXT_PUBLIC_MARKETING_URL \
    NEXT_PUBLIC_APP_BASE_HOST=$NEXT_PUBLIC_APP_BASE_HOST \
    NEXT_PUBLIC_UPLOAD_TRANSPORT=$NEXT_PUBLIC_UPLOAD_TRANSPORT \
    NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST=$NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST \
    NEXT_PUBLIC_WEBHOOK_BASE_URL=$NEXT_PUBLIC_WEBHOOK_BASE_URL \
    NEXT_PUBLIC_HANKO_TENANT_ID=$NEXT_PUBLIC_HANKO_TENANT_ID \
    NEXT_PUBLIC_API_BASE_HOST=$NEXT_PUBLIC_API_BASE_HOST \
    NEXT_PUBLIC_MCP_BASE_HOST=$NEXT_PUBLIC_MCP_BASE_HOST \
    NEXT_PUBLIC_WEBHOOK_BASE_HOST=$NEXT_PUBLIC_WEBHOOK_BASE_HOST

RUN npx prisma generate && npm run build

# ---------------------------------------------------------------------------
# runner: minimal runtime image.
# ---------------------------------------------------------------------------
FROM node:24-slim AS runner
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# mupdf page rendering is memory hungry; Vercel runs those routes with 2 GB.
ENV NODE_OPTIONS=--max-old-space-size=2048

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma CLI + schema are kept in the image so migrations can be applied from
# the running container (`npx prisma migrate deploy`).
#
# The CLI is installed rather than copied out of the builder: it pulls runtime
# dependencies of its own (@prisma/config -> effect, ...), and copying only the
# prisma packages leaves those behind. It lives in its own directory so it
# cannot shadow the standalone server's bundled node_modules.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

ENV PRISMA_CLI_DIR=/opt/prisma-cli
RUN mkdir -p "$PRISMA_CLI_DIR" \
    && cd "$PRISMA_CLI_DIR" \
    && npm init -y > /dev/null \
    && npm install --no-audit --no-fund --omit=dev prisma@6.5.0 > /dev/null \
    && npm cache clean --force > /dev/null 2>&1

# Apply migrations with:
#   docker run --rm <image> /app/migrate.sh
# or as Coolify's pre-deployment command.
RUN printf '%s\n' \
      '#!/bin/sh' \
      'set -e' \
      'cd /app' \
      'exec "$PRISMA_CLI_DIR/node_modules/.bin/prisma" migrate deploy --schema /app/prisma/schema' \
      > /app/migrate.sh \
    && chmod +x /app/migrate.sh

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
