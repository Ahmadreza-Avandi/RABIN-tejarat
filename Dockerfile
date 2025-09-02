# Stage 1: Base image
FROM node:18-alpine AS base

# Install system dependencies including audio support
RUN apk add --no-cache \
    libc6-compat \
    curl \
    wget \
    bash \
    pulseaudio \
    pulseaudio-utils \
    alsa-utils \
    alsa-lib \
    alsa-plugins \
    ffmpeg \
    sox

# Configure audio
RUN mkdir -p /etc/pulse && \
    echo "default-server = unix:/tmp/pulse/native" > /etc/pulse/client.conf && \
    echo "autospawn = no" >> /etc/pulse/client.conf && \
    echo "daemon-binary = /bin/true" >> /etc/pulse/client.conf && \
    echo "enable-shm = false" >> /etc/pulse/client.conf

WORKDIR /app

# Create necessary directories
RUN mkdir -p /app/debug /app/scripts /app/audio-temp /app/logs

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

# Create necessary directories
RUN mkdir -p /app/debug /app/audio-temp /app/logs /app/scripts

# Debug scripts will be available if they exist in the build context

# کپی standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app/debug /app/audio-temp /app/logs /app/scripts

# Make debug scripts executable
RUN chmod +x *.sh 2>/dev/null || true

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]