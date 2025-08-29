# مرحله 1: Base image
FROM node:18-alpine AS base
# Install system dependencies (remove audio packages for VPS)
RUN apk add --no-cache libc6-compat curl wget bash
# Add audio packages only if not in VPS mode
RUN if [ "$VPS_MODE" != "true" ]; then \
        apk add --no-cache pulseaudio pulseaudio-utils alsa-utils alsa-lib; \
    fi
WORKDIR /app

# مرحله 2: Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production --prefer-offline --no-audit --progress=false

# مرحله 3: Builder
FROM base AS builder
COPY package*.json ./

# نصب dependencies با تنظیمات بهینه
RUN npm ci --prefer-offline --no-audit --progress=false --maxsockets 1

# کپی کل پروژه
COPY . .

# Build با memory بسیار محدود و تنظیمات بهینه
ENV NODE_OPTIONS="--max-old-space-size=1024 --max-semi-space-size=64"
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true

# Build با memory محدود
RUN npm run build:memory-safe || npm run build

# مرحله 4: Runner
FROM base AS runner
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# کپی فایل‌های public
COPY --from=builder /app/public ./public

# کپی debug scripts برای production
COPY --from=builder /app/debug-*.sh ./
COPY --from=builder /app/test-*.sh ./
COPY --from=builder /app/test-pcm-browser.html ./public/

# کپی standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Make debug scripts executable
RUN chmod +x *.sh 2>/dev/null || true

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]