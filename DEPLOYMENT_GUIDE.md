# 🚀 راهنمای دیپلوی سیستم CRM

## 📋 پیش‌نیازها

### سیستم عامل
- Ubuntu 20.04+ یا CentOS 8+
- حداقل 2GB RAM
- حداقل 20GB فضای دیسک

### نرم‌افزارهای مورد نیاز
```bash
# نصب Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# نصب Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# نصب ابزارهای کمکی
sudo apt update
sudo apt install -y curl wget jq
```

## 🔧 تنظیمات اولیه

### 1. کلون پروژه
```bash
git clone <repository-url>
cd CEM-CRM-main
```

### 2. تنظیم متغیرهای محیطی
```bash
# کپی فایل تنظیمات
cp .env.production .env

# ویرایش تنظیمات
nano .env
```

### متغیرهای مهم که باید تغییر دهید:
- `NEXTAUTH_SECRET`: یک کلید امنیتی قوی
- `JWT_SECRET`: کلید JWT
- `EMAIL_USER` و `EMAIL_PASS`: تنظیمات ایمیل
- `KAVENEGAR_API_KEY`: کلید API پیامک

### 3. تنظیم DNS
دامنه `ahmadreza-avandi.ir` باید به IP سرور شما اشاره کند:
```
A    ahmadreza-avandi.ir    YOUR_SERVER_IP
A    www.ahmadreza-avandi.ir    YOUR_SERVER_IP
```

## 🚀 دیپلوی

### روش خودکار (توصیه می‌شود)
```bash
./deploy.sh
```

### روش دستی
```bash
# ساخت پوشه‌های مورد نیاز
mkdir -p database nginx/ssl backups logs

# کپی فایل SQL به پوشه database
cp crm_system.sql database/

# بالا آوردن سرویس‌ها
docker-compose up -d --build

# بررسی وضعیت
docker-compose ps
```

## 🛠️ مدیریت سیستم

### استفاده از اسکریپت مدیریت
```bash
# نمایش راهنما
./manage.sh help

# شروع سرویس‌ها
./manage.sh start

# توقف سرویس‌ها
./manage.sh stop

# ری‌استارت
./manage.sh restart

# نمایش وضعیت
./manage.sh status

# نمایش لاگ‌ها
./manage.sh logs

# نمایش لاگ‌ها به صورت زنده
./manage.sh logs -f

# پشتیبان‌گیری از دیتابیس
./manage.sh backup

# بازیابی دیتابیس
./manage.sh restore

# بروزرسانی سیستم
./manage.sh update

# تمدید گواهی SSL
./manage.sh ssl-renew

# پاکسازی Docker
./manage.sh cleanup

# مانیتورینگ سیستم
./manage.sh monitor
```

## 🌐 دسترسی به سرویس‌ها

### آدرس‌های مهم
- **سایت اصلی**: https://ahmadreza-avandi.ir
- **phpMyAdmin**: https://ahmadreza-avandi.ir/phpmyadmin
- **Health Check**: https://ahmadreza-avandi.ir/api/health

### اطلاعات ورود phpMyAdmin
- **سرور**: mysql
- **کاربر**: root
- **رمز عبور**: 1234

## 🔒 امنیت

### تنظیمات امنیتی مهم
1. **تغییر رمزهای پیش‌فرض**:
   ```bash
   # در فایل .env
   DATABASE_PASSWORD="رمز_قوی_جدید"
   NEXTAUTH_SECRET="کلید_امنیتی_قوی"
   JWT_SECRET="کلید_JWT_قوی"
   ```

2. **فایروال**:
   ```bash
   sudo ufw enable
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   ```

3. **بروزرسانی منظم**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ./manage.sh update
   ```

## 📊 مانیتورینگ

### بررسی سلامت سیستم
```bash
# وضعیت کانتینرها
docker-compose ps

# مصرف منابع
docker stats

# لاگ‌های سیستم
./manage.sh logs

# بررسی سلامت اپلیکیشن
curl https://ahmadreza-avandi.ir/api/health
```

### لاگ‌های مهم
- **Next.js**: `docker-compose logs nextjs`
- **MySQL**: `docker-compose logs mysql`
- **Nginx**: `docker-compose logs nginx`
- **phpMyAdmin**: `docker-compose logs phpmyadmin`

## 🔄 پشتیبان‌گیری

### پشتیبان‌گیری خودکار
```bash
# اجرای پشتیبان‌گیری
./manage.sh backup

# تنظیم cron job برای پشتیبان‌گیری روزانه
crontab -e
# اضافه کردن خط زیر:
0 2 * * * cd /path/to/project && ./manage.sh backup
```

### بازیابی
```bash
./manage.sh restore
```

## 🚨 عیب‌یابی

### مشکلات رایج

#### 1. سرویس‌ها بالا نمی‌آیند
```bash
# بررسی لاگ‌ها
docker-compose logs

# ری‌استارت
docker-compose down
docker-compose up -d
```

#### 2. مشکل اتصال به دیتابیس
```bash
# بررسی وضعیت MySQL
docker-compose exec mysql mysqladmin ping -h localhost -u root -p1234

# ری‌استارت MySQL
docker-compose restart mysql
```

#### 3. مشکل SSL
```bash
# بررسی گواهی‌ها
sudo certbot certificates

# تمدید دستی
./manage.sh ssl-renew
```

#### 4. مشکل حافظه
```bash
# بررسی مصرف حافظه
free -h
docker stats

# پاکسازی
./manage.sh cleanup
```

## 📞 پشتیبانی

در صورت بروز مشکل:
1. لاگ‌های سیستم را بررسی کنید
2. از دستورات عیب‌یابی استفاده کنید
3. در صورت نیاز، سیستم را ری‌استارت کنید

## 📝 یادداشت‌های مهم

- همیشه قبل از بروزرسانی، پشتیبان بگیرید
- رمزهای پیش‌فرض را تغییر دهید
- گواهی‌های SSL را منظم تمدید کنید
- لاگ‌ها را منظم بررسی کنید
- از فایروال استفاده کنید