# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# افزایش memory برای build
ENV NODE_OPTIONS="--max-old-space-size=1536"

# کپی فایل‌های package
COPY package*.json ./

# نصب dependencies
RUN npm ci

# کپی تنظیمات
COPY tsconfig.json ./
COPY next.config.js ./

# کپی کل پروژه
COPY . .

# Build پروژه
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# تنظیمات production
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# ایجاد کاربر غیر root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# کپی فایل‌های مورد نیاز از build stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# تنظیم مالکیت فایل‌ها
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]