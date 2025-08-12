# 🐳 راهنمای Docker برای سیستم CRM

## 🚀 راه‌اندازی سریع

### پیش‌نیازها
- Docker
- Docker Compose
- Git

### نصب و راه‌اندازی

```bash
# 1. کلون پروژه
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat

# 2. راه‌اندازی با یک دستور
./docker-setup.sh
```

## 📋 سرویس‌ها

پس از راه‌اندازی، سرویس‌های زیر در دسترس خواهند بود:

| سرویس | آدرس | توضیحات |
|--------|-------|---------|
| **CRM Application** | http://localhost:3000 | برنامه اصلی |
| **phpMyAdmin** | http://localhost:8080 | مدیریت دیتابیس |
| **MySQL** | localhost:3306 | دیتابیس |

## 🔐 اطلاعات ورود

### دیتابیس MySQL
- **Host**: localhost (یا mysql از داخل کانتینرها)
- **Port**: 3306
- **Database**: crm_system
- **Username**: root
- **Password**: 1234

### phpMyAdmin
- **آدرس**: http://localhost:8080
- **Username**: root
- **Password**: 1234

## 🛠️ مدیریت سرویس‌ها

### دستورات اصلی

```bash
# شروع سرویس‌ها
./docker-manage.sh start

# توقف سرویس‌ها
./docker-manage.sh stop

# ری‌استارت
./docker-manage.sh restart

# مشاهده وضعیت
./docker-manage.sh status

# مشاهده لاگ‌ها
./docker-manage.sh logs

# مشاهده لاگ سرویس خاص
./docker-manage.sh logs nextjs
./docker-manage.sh logs mysql
```

### دستورات پیشرفته

```bash
# پاک‌سازی کامل (حذف تمام داده‌ها)
./docker-manage.sh clean

# بک‌آپ دیتابیس
./docker-manage.sh backup

# ورود به shell کانتینر
./docker-manage.sh shell nextjs
./docker-manage.sh shell mysql

# ورود به MySQL
./docker-manage.sh mysql
```

## 📁 ساختار فایل‌ها

```
├── docker-compose.dev.yml    # تنظیمات Docker Compose برای development
├── docker-compose.yml        # تنظیمات Docker Compose برای production
├── Dockerfile.dev           # Dockerfile برای development
├── Dockerfile              # Dockerfile برای production
├── docker-setup.sh         # اسکریپت راه‌اندازی
├── docker-manage.sh        # اسکریپت مدیریت
├── crm_system.sql          # فایل SQL اصلی
├── database-backup-tables.sql # جداول بک‌آپ
└── nginx/
    └── default.conf        # تنظیمات Nginx
```

## 🔧 تنظیمات محیط

فایل `.env` به صورت خودکار ایجاد می‌شود:

```env
# Database Configuration
DATABASE_HOST=mysql
DATABASE_USER=root
DATABASE_PASSWORD=1234
DATABASE_NAME=crm_system
DATABASE_URL=mysql://root:1234@mysql:3306/crm_system

# Email Configuration (اختیاری)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# App Configuration
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🐛 عیب‌یابی

### مشکلات رایج

#### 1. پورت‌ها در حال استفاده
```bash
# بررسی پورت‌های در حال استفاده
sudo lsof -i :3000
sudo lsof -i :3306
sudo lsof -i :8080

# توقف سرویس‌های در حال اجرا
./docker-manage.sh stop
```

#### 2. مشکل در اتصال به دیتابیس
```bash
# بررسی وضعیت MySQL
./docker-manage.sh logs mysql

# تست اتصال
./docker-manage.sh mysql
```

#### 3. مشکل در build
```bash
# پاک‌سازی و build مجدد
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

#### 4. مشکل در import فایل SQL
```bash
# بررسی لاگ‌های MySQL
./docker-manage.sh logs mysql

# import دستی
./docker-manage.sh mysql < crm_system.sql
```

### مشاهده لاگ‌ها

```bash
# تمام لاگ‌ها
./docker-manage.sh logs

# لاگ سرویس خاص
./docker-manage.sh logs nextjs
./docker-manage.sh logs mysql
./docker-manage.sh logs phpmyadmin

# لاگ‌های زنده
docker-compose -f docker-compose.dev.yml logs -f --tail=100
```

## 🔄 به‌روزرسانی

```bash
# دریافت آخرین تغییرات
git pull origin main

# ری‌بیلد و ری‌استارت
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

## 📊 مانیتورینگ

### بررسی وضعیت سرویس‌ها
```bash
# وضعیت کلی
./docker-manage.sh status

# استفاده از منابع
docker stats

# فضای استفاده شده
docker system df
```

### Health Checks
- **Next.js**: http://localhost:3000/api/health
- **MySQL**: دستور `mysqladmin ping`
- **phpMyAdmin**: http://localhost:8080

## 🚀 استقرار در Production

برای استقرار در سرور production:

```bash
# استفاده از docker-compose اصلی
docker-compose up -d --build

# یا با nginx
docker-compose -f docker-compose.yml up -d
```

## 📞 پشتیبانی

در صورت بروز مشکل:

1. بررسی لاگ‌ها: `./docker-manage.sh logs`
2. بررسی وضعیت: `./docker-manage.sh status`
3. ری‌استارت: `./docker-manage.sh restart`
4. پاک‌سازی: `./docker-manage.sh clean`

---

**نکته**: این تنظیمات برای محیط development طراحی شده‌اند. برای production از `docker-compose.yml` استفاده کنید.