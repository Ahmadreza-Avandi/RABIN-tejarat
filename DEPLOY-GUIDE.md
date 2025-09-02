# 🚀 راهنمای Deploy سیستم CRM

## 📋 فهرست

1. [Deploy محلی](#deploy-محلی)
2. [Deploy روی سرور](#deploy-روی-سرور)
3. [مشکلات رایج](#مشکلات-رایج)
4. [نکات امنیتی](#نکات-امنیتی)

## 🏠 Deploy محلی

### پیش‌نیازها
- Docker و Docker Compose نصب باشد
- پورت‌های 3000، 3306، 8081 آزاد باشند

### دستورات
```bash
# راه‌اندازی کامل (MySQL + NextJS + phpMyAdmin)
./start-full-local.sh

# فقط MySQL و phpMyAdmin
./start-local.sh

# توقف سرویس‌ها
./stop-local.sh
```

### دسترسی‌ها
- **CRM Application**: http://localhost:3000
- **MySQL Database**: localhost:3306
- **phpMyAdmin**: http://localhost:8081

### اطلاعات دیتابیس محلی
- **Username**: crm_app_user
- **Password**: 1234
- **Database**: crm_system

## 🌐 Deploy روی سرور

### پیش‌نیازها
- سرور Ubuntu/Debian
- Docker و Docker Compose نصب باشد
- دامنه به IP سرور متصل باشد
- پورت‌های 80 و 443 آزاد باشند

### مراحل Deploy

#### 1. اتصال به سرور
```bash
ssh root@181.41.194.136
```

#### 2. رفتن به پوشه پروژه
```bash
cd RABIN-tejarat
```

#### 3. دریافت آخرین تغییرات
```bash
git pull origin main
```

#### 4. ویرایش فایل .env
```bash
nano .env
```

**تنظیمات مهم:**
```env
# دامنه
NEXTAUTH_URL="https://ahmadreza-avandi.ir"

# دیتابیس (رمز قوی استفاده کنید)
DATABASE_PASSWORD="your_strong_password_here"

# امنیت
NEXTAUTH_SECRET="your_super_secret_key_32_chars_min"
JWT_SECRET="your_jwt_secret_key_32_chars_min"

# ایمیل
EMAIL_USER="your_email@gmail.com"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# SMS
KAVENEGAR_API_KEY="your_kavenegar_api_key"
```

#### 5. اجرای Deploy
```bash
./deploy-server.sh
```

### بررسی وضعیت
```bash
# مشاهده وضعیت کانتینرها
docker-compose -f docker-compose.deploy.yml ps

# مشاهده لاگ‌ها
docker-compose -f docker-compose.deploy.yml logs -f

# تست اتصال
curl -I https://ahmadreza-avandi.ir
```

## 🔧 مشکلات رایج

### مشکل Build Docker
```bash
# پاکسازی کامل
docker system prune -a
docker volume prune

# Build مجدد
docker-compose build --no-cache
```

### مشکل SSL
```bash
# بررسی وضعیت certbot
sudo certbot certificates

# تجدید دستی
sudo certbot renew
```

### مشکل دیتابیس
```bash
# ورود به MySQL
docker-compose exec mysql mysql -u root -p

# بررسی جداول
USE crm_system;
SHOW TABLES;
```

### مشکل حافظه
```bash
# بررسی حافظه
free -h

# استفاده از تنظیمات memory-optimized
# اسکریپت خودکار تشخیص می‌دهد
```

## 🔐 نکات امنیتی

### 1. رمزهای قوی
- حداقل 32 کاراکتر برای NEXTAUTH_SECRET
- رمز پیچیده برای دیتابیس
- تغییر رمزهای پیش‌فرض

### 2. فایروال
```bash
# تنظیم فایروال
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp  
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. بک‌آپ منظم
```bash
# بک‌آپ دیتابیس
docker-compose exec mysql mysqldump -u root -p crm_system > backup_$(date +%Y%m%d).sql

# بک‌آپ فایل‌ها
tar -czf backup_files_$(date +%Y%m%d).tar.gz .env nginx/
```

### 4. مانیتورینگ
```bash
# بررسی لاگ‌ها
docker-compose logs --tail=100

# بررسی منابع
docker stats

# بررسی دیسک
df -h
```

## 📞 پشتیبانی

در صورت بروز مشکل:

1. لاگ‌ها را بررسی کنید
2. وضعیت کانتینرها را چک کنید  
3. فایل .env را بررسی کنید
4. اتصال اینترنت و DNS را تست کنید

## 🔄 به‌روزرسانی

```bash
# دریافت تغییرات
git pull origin main

# راه‌اندازی مجدد
docker-compose -f docker-compose.deploy.yml up --build -d

# یا استفاده از اسکریپت
./deploy-server.sh
```