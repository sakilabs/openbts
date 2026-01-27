FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@10

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY packages/drizzle/package.json ./packages/drizzle/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile

COPY packages/drizzle ./packages/drizzle
COPY apps/server ./apps/server

RUN pnpm --filter @openbts/drizzle build && \
    pnpm --filter @openbts/server build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/drizzle/package.json ./packages/drizzle/
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/packages/drizzle/dist ./packages/drizzle/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY apps/server/docker/docker-entrypoint.sh ./

RUN npm install -g pnpm@10 && \
    pnpm install --frozen-lockfile --prod && \
    chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
