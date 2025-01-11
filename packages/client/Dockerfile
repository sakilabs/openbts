FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@8

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/.output /app/.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
