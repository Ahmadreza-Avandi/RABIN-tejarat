# 🔧 راهنمای مدیریت Environment Variables

## 📋 فهرست فایل‌های Environment

### فایل‌های اصلی:
- **`.env`** - فایل فعال (استفاده شده توسط Docker و Next.js)
- **`.env.master`** - فایل کامل با تمام تنظیمات (template اصلی)

### فایل‌های Template:
- **`.env.template`** - Template ساده برای شروع
- **`.env.example`** - مثال کامل با توضیحات
- **`.env.complete`** - تنظیمات کامل امن
- **`.env.production`** - تنظیمات production
- **`.env.local`** - تنظیمات development محلی

## 🚀 استفاده از Environment Manager

### نصب و راه‌اندازی:
```bash
# اجازه اجرا به اسکریپت
chmod +x scripts/env-manager.sh

# مشاهده راهنما
./scripts/env-manager.sh help
```

### دستورات اصلی:

#### 1. راه‌اندازی Environment جدید:
```bash
# راه‌اندازی production (امن)
./scripts/env-manager.sh setup production

# راه‌اندازی development
./scripts/env-manager.sh setup development

# راه‌اندازی با template کامل
./scripts/env-manager.sh setup master
```

#### 2. تغییر Environment:
```bash
# تغییر به production
./scripts/env-manager.sh switch production

# تغییر به development
./scripts/env-manager.sh switch development
```

#### 3. اعتبارسنجی تنظیمات:
```bash
# بررسی صحت فایل .env
./scripts/env-manager.sh validate
```

#### 4. پشتیبان‌گیری:
```bash
# پشتیبان‌گیری از .env فعلی
./scripts/env-manager.sh backup
```

#### 5. مشاهده Environment ها:
```bash
# لیست تمام environment های موجود
./scripts/env-manager.sh list
```

#### 6. پاکسازی:
```bash
# پاکسازی فایل‌های اضافی
./scripts/env-manager.sh clean
```

## 🔒 تنظیمات امنیتی

### متغیرهای حیاتی که باید تغییر کنید:

```bash
# پسوردهای قوی
DATABASE_PASSWORD=Cr@M_App_Us3r_2024!@#$%
JWT_SECRET=Cr@M_JWT_S3cr3t_K3y_2024!@#$%^&*()_+
NEXTAUTH_SECRET=Cr@M_N3xtAuth_S3cr3t_2024!@#$%^&*()_+

# API Keys (جایگزین کنید)
KAVENEGAR_API_KEY=YOUR_ACTUAL_API_KEY
GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET
```

### چک‌لیست امنیتی:
- ✅ پسوردهای قوی و یکتا
- ✅ JWT Secret های طولانی
- ✅ API Key های واقعی
- ✅ HTTPS فعال در production
- ✅ Rate limiting فعال
- ✅ Database user محدود

## 🐳 تنظیمات Docker

### فایل .env با Docker Compose:
```yaml
# docker-compose.yml خودکار از .env استفاده می‌کند
services:
  nextjs:
    env_file:
      - .env
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - DATABASE_URL=${DATABASE_URL}
```

### متغیرهای مهم برای Docker:
```bash
# Database (برای Docker network)
DATABASE_HOST=mysql
DATABASE_USER=crm_app_user
DATABASE_PASSWORD=Cr@M_App_Us3r_2024!@#$%

# Application
NODE_ENV=production
NEXTAUTH_URL=https://ahmadreza-avandi.ir
```

## 📊 مثال‌های مختلف Environment

### Production (امن):
```bash
NODE_ENV=production
DATABASE_HOST=mysql
DATABASE_USER=crm_app_user
DATABASE_PASSWORD=STRONG_PASSWORD_HERE
NEXTAUTH_URL=https://your-domain.com
```

### Development:
```bash
NODE_ENV=development
DATABASE_HOST=mysql-dev
DATABASE_USER=root
DATABASE_PASSWORD=dev_password
NEXTAUTH_URL=http://localhost:3000
```

### Local (بدون Docker):
```bash
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=local_password
NEXTAUTH_URL=http://localhost:3000
```

## 🔄 مراحل Migration

### از تنظیمات قدیمی به جدید:

1. **پشتیبان‌گیری:**
```bash
cp .env .env.backup.$(date +%Y%m%d)
```

2. **راه‌اندازی جدید:**
```bash
./scripts/env-manager.sh setup master
```

3. **کپی مقادیر مهم:**
```bash
# مقادیر زیر را از .env.backup کپی کنید:
# - DATABASE_PASSWORD
# - JWT_SECRET
# - NEXTAUTH_SECRET
# - EMAIL_PASS
# - API Keys
```

4. **اعتبارسنجی:**
```bash
./scripts/env-manager.sh validate
```

## 🚨 نکات مهم

### ⚠️ هشدارها:
- **هرگز .env را commit نکنید**
- **پسوردهای پیش‌فرض را تغییر دهید**
- **API Key های واقعی استفاده کنید**
- **در production از HTTPS استفاده کنید**

### ✅ بهترین روش‌ها:
- پشتیبان‌گیری منظم از .env
- استفاده از پسوردهای قوی
- تست تنظیمات در development
- مانیتورینگ لاگ‌های امنیتی
- به‌روزرسانی منظم API Key ها

## 🔧 عیب‌یابی

### مشکلات رایج:

#### 1. Database اتصال برقرار نمی‌کند:
```bash
# بررسی تنظیمات database
grep DATABASE_ .env

# تست اتصال
docker-compose exec mysql mysql -u $DATABASE_USER -p$DATABASE_PASSWORD $DATABASE_NAME
```

#### 2. NextAuth کار نمی‌کند:
```bash
# بررسی NEXTAUTH_SECRET
grep NEXTAUTH_SECRET .env

# بررسی URL
grep NEXTAUTH_URL .env
```

#### 3. Email ارسال نمی‌شود:
```bash
# بررسی تنظیمات email
grep EMAIL_ .env

# تست Gmail API
grep GOOGLE_ .env
```

### لاگ‌های مفید:
```bash
# لاگ‌های Docker
docker-compose logs -f nextjs

# لاگ‌های MySQL
docker-compose logs -f mysql

# لاگ‌های nginx
docker-compose logs -f nginx
```

## 📞 پشتیبانی

اگر مشکلی داشتید:
1. ابتدا `./scripts/env-manager.sh validate` را اجرا کنید
2. لاگ‌های Docker را بررسی کنید
3. تنظیمات را با .env.master مقایسه کنید
4. از backup استفاده کنید اگر لازم بود

---

**نکته:** این سیستم طراحی شده تا مدیریت environment variables را ساده و امن کند. همیشه قبل از تغییرات مهم، پشتیبان‌گیری کنید!