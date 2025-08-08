# راهنمای استقرار پروژه RABIN-tejarat CRM در سرور با حافظه محدود

این راهنما برای سرورهایی با حافظه محدود که با خطای کمبود حافظه در هنگام ساخت پروژه با داکر مواجه می‌شوند، طراحی شده است. در این روش، همچنان از داکر برای اجرای پروژه استفاده می‌کنیم، اما با تغییراتی که مصرف حافظه را کاهش می‌دهد.

## روش 1: افزودن حافظه مجازی (Swap) به سرور

افزودن حافظه مجازی (Swap) به سرور می‌تواند مشکل کمبود حافظه را حل کند. این روش ساده‌ترین راه‌حل است و نیاز به تغییر در پیکربندی داکر ندارد.

```bash
# ایجاد فایل swap با اندازه 8 گیگابایت
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# اضافه کردن به fstab برای اعمال در هنگام راه‌اندازی مجدد
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# بررسی وضعیت swap
free -h
```

پس از افزودن حافظه مجازی، می‌توانید پروژه را با دستور زیر اجرا کنید:

```bash
docker-compose -f docker-compose.production.yml up -d
```

## روش 2: استفاده از Dockerfile.production با تنظیمات بهینه‌شده

فایل `Dockerfile.production` که قبلاً ایجاد کردیم، برای سرورهای با حافظه محدود بهینه‌سازی شده است. اطمینان حاصل کنید که از این فایل استفاده می‌کنید:

```bash
# اطمینان از استفاده از Dockerfile.production
sed -i 's/Dockerfile/Dockerfile.production/g' docker-compose.production.yml

# اجرای پروژه
docker-compose -f docker-compose.production.yml up -d
```

## روش 3: تنظیم محدودیت حافظه برای مراحل ساخت

می‌توانید محدودیت حافظه را برای مراحل مختلف ساخت تنظیم کنید:

```bash
# ویرایش فایل docker-compose.production.yml برای تنظیم محدودیت حافظه
cat > docker-compose.build.yml << 'EOF'
version: '3.8'

services:
  nextjs-build:
    build:
      context: .
      dockerfile: Dockerfile.production
    environment:
      - NODE_ENV=production
      - NODE_OPTIONS="--max-old-space-size=2048"
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G
EOF

# ساخت تصویر با محدودیت حافظه
docker-compose -f docker-compose.build.yml build

# اجرای پروژه با فایل اصلی
docker-compose -f docker-compose.production.yml up -d
```

## روش 4: ساخت پروژه به صورت مرحله‌ای

اگر روش‌های قبلی کارساز نبود، می‌توانید پروژه را به صورت مرحله‌ای بسازید:

```bash
# ایجاد Dockerfile برای ساخت مرحله‌ای
cat > Dockerfile.staged << 'EOF'
# مرحله 1: نصب وابستگی‌ها
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# مرحله 2: ساخت برنامه
FROM node:18 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# مرحله 3: اجرای برنامه
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# ایجاد کاربر غیر-روت
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
CMD ["npm", "start"]
EOF

# ویرایش docker-compose برای استفاده از Dockerfile.staged
sed -i 's/Dockerfile.production/Dockerfile.staged/g' docker-compose.production.yml

# اجرای پروژه
docker-compose -f docker-compose.production.yml up -d
```

## نکات مهم برای سرورهای با حافظه محدود

1. **بستن برنامه‌های غیرضروری**: قبل از اجرای داکر، تمام برنامه‌های غیرضروری را ببندید تا حافظه بیشتری آزاد شود.

2. **تنظیم پارامترهای هسته لینوکس**: تنظیم پارامترهای هسته لینوکس می‌تواند به بهبود عملکرد حافظه کمک کند:

```bash
# تنظیم پارامترهای هسته برای بهبود عملکرد حافظه
sudo sysctl -w vm.swappiness=10
sudo sysctl -w vm.vfs_cache_pressure=50
```

3. **استفاده از نسخه Alpine**: استفاده از تصاویر Alpine در داکر می‌تواند مصرف منابع را کاهش دهد.

4. **محدود کردن تعداد سرویس‌ها**: اگر همچنان با مشکل کمبود حافظه مواجه هستید، می‌توانید برخی از سرویس‌ها مانند phpMyAdmin را موقتاً غیرفعال کنید.

## عیب‌یابی

اگر با مشکلی مواجه شدید، لاگ‌های سرویس‌ها را بررسی کنید:

```bash
docker-compose -f docker-compose.production.yml logs -f nextjs
```

برای بررسی مصرف حافظه:

```bash
docker stats
```

این راهنما به شما کمک می‌کند تا پروژه را با داکر در سرورهایی با حافظه محدود اجرا کنید.