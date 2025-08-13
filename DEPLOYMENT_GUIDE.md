# راهنمای Deploy سیستم CRM

## دو روش Deploy

### روش اول: Development Mode (توصیه شده برای توسعه)

این روش فقط MySQL و phpMyAdmin رو با Docker اجرا می‌کنه و Next.js رو با npm اجرا می‌کنیم.

```bash
# راه‌اندازی دیتابیس
./start-dev.sh

# اجرای Next.js
npm run dev
```

**مزایا:**
- سرعت بالا در development
- Hot reload کار می‌کنه
- دیباگ آسان‌تر
- مشکل build نداریم

**دسترسی:**
- Next.js: http://localhost:3000
- phpMyAdmin: http://localhost:8080

### روش دوم: Production Mode (برای سرور)

این روش همه چیز رو با Docker اجرا می‌کنه.

```bash
# Deploy کامل
./deploy-complete.sh
```

**مزایا:**
- محیط production واقعی
- Nginx proxy
- مناسب برای سرور

## مشکل‌گشایی

### اگر Docker build خطا داد:

1. مطمئن شوید همه فایل‌های UI component موجودن:
```bash
ls -la components/ui/
```

2. پاک کردن cache و rebuild:
```bash
docker system prune -a
./deploy-complete.sh
```

3. بررسی لاگ‌ها:
```bash
docker-compose -f docker-compose.fixed.yml logs nextjs
```

### اگر دیتابیس وصل نشد:

1. بررسی وضعیت MySQL:
```bash
docker-compose -f docker-compose.db-only.yml ps
```

2. تست اتصال:
```bash
mysql -h localhost -P 3306 -u root -p1234 crm_system
```

## تنظیمات Environment

### Development (.env.local):
```
DATABASE_URL=mysql://root:1234@localhost:3306/crm_system
DATABASE_HOST=localhost
NEXTAUTH_URL=http://localhost:3000
```

### Production (.env.production):
```
DATABASE_URL=mysql://root:1234@mysql:3306/crm_system
DATABASE_HOST=mysql
NEXTAUTH_URL=https://your-domain.com
```

## دستورات مفید

```bash
# توقف development
./stop-dev.sh

# مشاهده لاگ‌های production
docker-compose -f docker-compose.fixed.yml logs -f

# ری‌استارت سرویس خاص
docker-compose -f docker-compose.fixed.yml restart nextjs

# دسترسی به shell کانتینر
docker exec -it crm-nextjs sh

# بکاپ دیتابیس
docker exec crm-mysql mysqldump -u root -p1234 crm_system > backup.sql

# ریستور دیتابیس
docker exec -i crm-mysql mysql -u root -p1234 crm_system < backup.sql
```

## نکات امنیتی

1. پسوردهای پیش‌فرض رو تغییر بدید
2. JWT_SECRET رو تغییر بدید
3. برای production از HTTPS استفاده کنید
4. فایروال رو تنظیم کنید

## پورت‌های استفاده شده

- 3000: Next.js
- 3306: MySQL
- 8080: phpMyAdmin
- 80: HTTP (Nginx)
- 443: HTTPS (Nginx)