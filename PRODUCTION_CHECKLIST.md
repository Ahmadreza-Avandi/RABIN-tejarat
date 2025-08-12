# 🚀 Production Deployment Checklist

## قبل از دیپلوی

### ✅ پیش‌نیازها
- [ ] Docker و Docker Compose نصب شده باشد
- [ ] دامنه ahmadreza-avandi.ir به IP سرور متصل باشد
- [ ] پورت‌های 80 و 443 باز باشند
- [ ] حداقل 4GB RAM و 20GB فضای خالی دیسک

### ✅ فایل‌های کانفیگ
- [ ] فایل `.env` از روی `.env.example` ساخته شده
- [ ] اطلاعات دیتابیس در `.env` تنظیم شده
- [ ] اطلاعات ایمیل در `.env` تنظیم شده (اختیاری)
- [ ] اطلاعات SMS در `.env` تنظیم شده (اختیاری)

### ✅ SSL Certificate
- [ ] SSL certificate برای دامنه تهیه شده
- [ ] فایل‌های certificate در مسیر `/etc/letsencrypt/live/ahmadreza-avandi.ir/` موجود هستند

## مراحل دیپلوی

### 1. آپلود فایل‌ها
```bash
# آپلود پروژه به سرور
scp -r . user@server:/path/to/project/
```

### 2. تنظیم SSL (اگر هنوز نصب نشده)
```bash
# نصب certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# دریافت certificate
sudo certbot --nginx -d ahmadreza-avandi.ir -d www.ahmadreza-avandi.ir
```

### 3. اجرای دیپلوی
```bash
# اجرای اسکریپت دیپلوی
./deploy-production.sh
```

### 4. تست سیستم
- [ ] سایت در https://ahmadreza-avandi.ir باز می‌شود
- [ ] Health check endpoint کار می‌کند: `/api/health`
- [ ] دیتابیس متصل است
- [ ] لاگین سیستم کار می‌کند

## بعد از دیپلوی

### ✅ مانیتورینگ
```bash
# مشاهده لاگ‌ها
docker-compose logs -f

# چک کردن وضعیت سرویس‌ها
docker-compose ps

# چک کردن منابع سیستم
docker stats
```

### ✅ بک‌آپ
- [ ] تنظیم بک‌آپ خودکار دیتابیس
- [ ] تست بک‌آپ و restore

### ✅ امنیت
- [ ] تغییر پسوردهای پیش‌فرض
- [ ] تنظیم firewall
- [ ] بروزرسانی سیستم عامل

## عیب‌یابی

### مشکلات رایج:
1. **سایت باز نمی‌شود**: چک کنید DNS و SSL certificate
2. **خطای دیتابیس**: چک کنید `.env` و اتصال MySQL
3. **خطای 502**: چک کنید NextJS container در حال اجرا باشد

### دستورات مفید:
```bash
# ری‌استارت سرویس‌ها
docker-compose restart

# مشاهده لاگ‌های خطا
docker-compose logs nextjs
docker-compose logs mysql
docker-compose logs nginx

# پاک کردن و شروع مجدد
docker-compose down
docker-compose up -d --build
```