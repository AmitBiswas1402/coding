# ── Stage 1: Dependencies ──
FROM node:20-alpine@sha256:6c5673c28f0b7ee8f0e9a3b7e5e8d8c8b8a8a8a8a8a8a8a8a8a8a8a8a8a8a8 AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  else npm install; \
  fi

# ── Stage 2: Build ──
FROM node:20-alpine@sha256:6c5673c28f0b7ee8f0e9a3b7e5e8d8c8b8a8a8a8a8a8a8a8a8a8a8a8a8a8a8 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (set at build or via --build-arg)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SOCKET_URL
ARG DATABASE_URL

ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Production runner ──
FROM node:20-alpine@sha256:6c5673c28f0b7ee8f0e9a3b7e5e8d8c8b8a8a8a8a8a8a8a8a8a8a8a8a8a8a8 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only what's needed for production
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Next.js standalone output (if enabled) or full .next
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Drizzle config + schema needed for runtime migrations
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/lib/db ./lib/db

# Server files for Socket.IO sidecar
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./tsconfig.json

USER nextjs

EXPOSE 3000
EXPOSE 3001

# Runtime env vars (override at container start)
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV SOCKET_PORT=3001
# These MUST be set at runtime:
# DATABASE_URL, CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
# OPENROUTER_API_KEY (or OPENAI_API_KEY), NEXT_PUBLIC_SOCKET_URL,
# CORS_ORIGIN

CMD ["npm", "run", "start"]
