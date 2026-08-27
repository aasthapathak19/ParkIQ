# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install all dependencies (including devDeps for TypeScript build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and tsconfig files
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

# Build TypeScript → dist/
# Use tsconfig.json (relaxed: noUnusedLocals/noUnusedParameters = false)
# tsconfig.build.json has those set to true which fails on the existing codebase
RUN npx tsc -p tsconfig.json

# ─── Stage 2: Production Runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner

LABEL maintainer="ParkIQ AI"
LABEL description="ParkIQ API Server — Node.js + Express + TypeScript"

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy swagger source so swagger-jsdoc can scan JSDoc routes at runtime
# (swagger-jsdoc reads ./src/routes/*.ts at startup via the glob in swagger.ts)
COPY src ./src

# Create uploads directory (used by local storage provider)
RUN mkdir -p uploads && chown node:node uploads

# Run as non-root user
USER node

EXPOSE 5000

# Health check — /health is available without authentication
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "dist/server.js"]
