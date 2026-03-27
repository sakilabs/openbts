FROM node:22-alpine AS builder

ENV NODE_ENV=production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY packages/typescript-configs/package.json ./packages/typescript-configs/
COPY packages/drizzle/package.json ./packages/drizzle/
COPY packages/uke-importer/package.json ./packages/uke-importer/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile

COPY packages/typescript-configs ./packages/typescript-configs
COPY packages/drizzle ./packages/drizzle
COPY packages/uke-importer ./packages/uke-importer
COPY apps/server ./apps/server

RUN pnpm --filter @openbts/drizzle build && \
    pnpm --filter @openbts/uke-importer build && \
    pnpm --filter @openbts/sora build

FROM oven/bun:alpine

ENV NODE_ENV=production

RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh -
ENV PATH="/root/.local/share/pnpm:$PATH"
RUN pnpm config set manage-package-manager-versions false

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/drizzle/package.json ./packages/drizzle/
COPY --from=builder /app/packages/uke-importer/package.json ./packages/uke-importer/
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/packages/drizzle/dist ./packages/drizzle/dist
COPY --from=builder /app/packages/drizzle/migrations ./packages/drizzle/migrations
COPY --from=builder /app/packages/uke-importer/dist ./packages/uke-importer/dist
COPY --from=builder /app/packages/uke-importer/poland.voivodeships.max.json ./packages/uke-importer/
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY apps/server/static ./static
COPY apps/server/docker/docker-entrypoint.sh ./

RUN pnpm install --frozen-lockfile --prod && \
    chmod +x docker-entrypoint.sh

EXPOSE 3030
CMD ["./docker-entrypoint.sh"]
