# 🚀 راهنمای نهایی Deployment

## نصب سریع (یک کامند)

### برای سرور با دامنه و SSL
```bash
./deploy-complete.sh
```

### برای شروع سریع بدون SSL
```bash
./start-all.sh
```

## مراحل دستی

### 1. آماده‌سازی
```bash
# کلون پروژه
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat

# تنظیم دسترسی‌ها
chmod +x *.sh

# تنظیم متغیرهای محیطی
cp .env.example .env
nano .env
```

### 2. تنظیمات مهم در .env
```env
# Database
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=crm_system
MYSQL_USER=crm_user
MYSQL_PASSWORD=your_secure_password

# NextAuth
NEXTAUTH_SECRET=your_very_long_secret_key_here
NEXTAUTH_URL=https://ahmadreza-avandi.ir

# Database URL
DATABASE_URL=mysql://crm_user:your_secure_password@mysql:3306/crm_system
```

### 3. انتخاب روش Deployment

#### الف) Deployment کامل با SSL
```bash
./deploy-complete.sh
```
**شامل:**
- تشخیص خودکار نوع سرور (قوی/ضعیف)
- دریافت گواهی SSL
- تنظیم nginx مناسب
- راه‌اندازی همه سرویس‌ها

#### ب) Deployment سریع
```bash
./start-all.sh
```
**شامل:**
- شروع سریع بدون SSL
- تشخیص خودکار حافظه
- مناسب برای تست

#### ج) Deployment بهینه‌شده برای حافظه کم
```bash
./deploy-memory-optimized.sh
```

## دسترسی به سیستم

### پس از Deployment موفق:
- **🌐 سیستم CRM**: `https://ahmadreza-avandi.ir`
- **🔐 phpMyAdmin**: `https://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/`

### اطلاعات ورود phpMyAdmin:
- **نام کاربری**: مقدار `MYSQL_USER` از فایل .env
- **رمز عبور**: مقدار `MYSQL_PASSWORD` از فایل .env

## مدیریت سرویس‌ها

### مشاهده وضعیت
```bash
docker-compose ps
# یا برای سرور ضعیف:
docker-compose -f docker-compose.memory-optimized.yml ps
```

### مشاهده لاگ‌ها
```bash
docker-compose logs -f
# یا برای سرویس خاص:
docker-compose logs -f nextjs
```

### ری‌استارت سرویس‌ها
```bash
docker-compose restart
# یا سرویس خاص:
docker-compose restart nextjs
```

### متوقف کردن همه سرویس‌ها
```bash
docker-compose down
```

### پاک کردن کامل (احتیاط!)
```bash
docker-compose down -v
docker system prune -a
```

## حل مشکلات رایج

### 1. خطای حافظه در Build
```bash
# استفاده از کانفیگ بهینه‌شده
./deploy-memory-optimized.sh
```

### 2. خطای SSL
```bash
# بررسی وضعیت certbot
docker-compose logs certbot

# تجدید دستی گواهی
sudo certbot renew
```

### 3. خطای اتصال به دیتابیس
```bash
# بررسی MySQL
docker-compose logs mysql

# ری‌استارت MySQL
docker-compose restart mysql
```

### 4. خطای nginx
```bash
# بررسی تنظیمات nginx
docker-compose logs nginx

# تست تنظیمات nginx
docker-compose exec nginx nginx -t
```

### 5. پورت اشغال
```bash
# بررسی پورت‌های اشغال
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# متوقف کردن سرویس‌های اشغال‌کننده
sudo systemctl stop apache2
sudo systemctl stop nginx
```

## بک‌آپ و بازیابی

### بک‌آپ دیتابیس
```bash
docker-compose exec mysql mysqldump -u root -p crm_system > backup_$(date +%Y%m%d).sql
```

### بازیابی دیتابیس
```bash
docker-compose exec -T mysql mysql -u root -p crm_system < backup_file.sql
```

## مانیتورینگ

### مشاهده استفاده از منابع
```bash
docker stats
```

### بررسی سلامت سرویس‌ها
```bash
curl http://localhost:3000/api/health
```

### مشاهده فضای دیسک
```bash
df -h
docker system df
```

## بهینه‌سازی عملکرد

### برای سرورهای ضعیف:
- استفاده از `docker-compose.memory-optimized.yml`
- محدودیت حافظه برای هر سرویس
- تنظیمات nginx بهینه‌شده
- کاهش buffer sizes

### برای سرورهای قوی:
- استفاده از `docker-compose.yml` استاندارد
- فعال‌سازی caching
- افزایش buffer sizes
- فعال‌سازی gzip compression

## امنیت

### تنظیمات امنیتی اعمال شده:
- ✅ phpMyAdmin در مسیر مخفی
- ✅ محدودیت نرخ درخواست (Rate Limiting)
- ✅ هدرهای امنیتی HTTP
- ✅ SSL/TLS encryption
- ✅ عدم نمایش اطلاعات سرور
- ✅ محدودیت دسترسی به پورت‌های داخلی

### توصیه‌های امنیتی اضافی:
- تغییر رمزهای پیش‌فرض
- محدودیت IP برای phpMyAdmin
- فعال‌سازی firewall
- بروزرسانی منظم سیستم

## پشتیبانی

در صورت بروز مشکل:
1. بررسی لاگ‌های سرویس‌ها
2. بررسی فضای دیسک و حافظه
3. بررسی تنظیمات .env
4. مراجعه به بخش حل مشکلات این راهنما