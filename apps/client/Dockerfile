FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/client/package.json ./apps/client/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy client source
COPY apps/client ./apps/client

WORKDIR /app/apps/client

# Build arguments
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build
RUN pnpm run build

# Production Stage
FROM nginx:alpine
COPY --from=builder /app/apps/client/build/client /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
