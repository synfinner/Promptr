# syntax=docker/dockerfile:1.5

FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Remove development dependencies after the build completes
RUN npm prune --omit=dev


FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    DATABASE_DIRECTORY=/app/data \
    HOST=0.0.0.0 \
    PORT=3000

RUN groupadd --system promptr && useradd --system --gid promptr --create-home promptr

COPY --from=builder --chown=promptr:promptr /app/package.json ./
COPY --from=builder --chown=promptr:promptr /app/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=promptr:promptr /app/public ./public
COPY --from=builder --chown=promptr:promptr /app/.next ./.next
COPY --from=builder --chown=promptr:promptr /app/node_modules ./node_modules
COPY --from=builder --chown=promptr:promptr /app/drizzle ./drizzle

RUN mkdir -p /app/data && chown promptr:promptr /app/data

VOLUME ["/app/data"]

USER promptr

EXPOSE 3000

CMD ["npm", "run", "start"]
