# adminservice/Dockerfile

# ─── builder ─────────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# 1) install deps
COPY adminservice/package*.json ./
RUN npm ci

# 2) bring in Nest config & source
COPY adminservice/nest-cli.json ./
COPY adminservice/tsconfig*.json ./
COPY adminservice/src ./src

# 3) Copy prisma schema for generation
COPY adminservice/prisma ./prisma

# 4) compile
RUN npm run build

# ─── runner ─────────────────────────────────────────────────────────────────
FROM node:18-alpine AS runner
WORKDIR /usr/src/app

# Install dos2unix for line ending conversion and curl for health checks
RUN apk add --no-cache dos2unix curl

# bring in only what's needed at runtime
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist         ./dist
COPY --from=builder /usr/src/app/prisma       ./prisma
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/tsconfig.json ./
COPY adminservice/docker-entrypoint.sh ./

# Copy proto files
COPY proto ./proto

# Convert line endings and make executable
RUN dos2unix docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 3002 50052
ENTRYPOINT ["./docker-entrypoint.sh"]
