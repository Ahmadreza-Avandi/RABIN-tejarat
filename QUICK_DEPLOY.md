# 🚀 راهنمای سریع دیپلوی

## خلاصه تغییرات انجام شده

### ✅ فایل‌های ایجاد/بهبود شده:

1. **docker-compose.yml** - کانفیگ کامل با nginx, mysql, phpmyadmin, certbot
2. **nginx/default.conf** - کانفیگ nginx با SSL و reverse proxy
3. **database/init.sql** - اسکریپت اولیه دیتابیس
4. **database/crm_system.sql** - کپی فایل SQL اصلی
5. **.env.production** - تنظیمات production
6. **app/api/health/route.ts** - health check endpoint
7. **deploy.sh** - اسکریپت دیپلوی خودکار
8. **manage.sh** - اسکریپت مدیریت سیستم
9. **dev.sh** - اسکریپت مدیریت development
10. **docker-compose.dev.yml** - کانفیگ development
11. **.env.local** - تنظیمات development
12. **DEPLOYMENT_GUIDE.md** - راهنمای کامل دیپلوی
13. **README.md** - مستندات کامل پروژه

### 🔧 ویژگی‌های اضافه شده:

- **SSL خودکار** با Let's Encrypt
- **phpMyAdmin** در مسیر `/phpmyadmin`
- **Health Check** برای مانیتورینگ
- **پشتیبان‌گیری خودکار** دیتابیس
- **مدیریت کامل** با اسکریپت‌های bash
- **محیط Development** جداگانه
- **مانیتورینگ سیستم** کامل

## 🚀 نحوه اجرا

### 1. آماده‌سازی سرور

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

### 2. کلون پروژه

```bash
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat
```

### 3. تنظیم DNS

دامنه `ahmadreza-avandi.ir` باید به IP سرور اشاره کند:
```
A    ahmadreza-avandi.ir    YOUR_SERVER_IP
A    www.ahmadreza-avandi.ir    YOUR_SERVER_IP
```

### 4. تنظیم متغیرهای محیطی

```bash
cp .env.production .env
nano .env
```

**مهم**: این متغیرها را حتماً تغییر دهید:
- `NEXTAUTH_SECRET`
- `JWT_SECRET`
- `EMAIL_USER` و `EMAIL_PASS`
- `KAVENEGAR_API_KEY`

### 5. دیپلوی

```bash
chmod +x deploy.sh manage.sh dev.sh
./deploy.sh
```

## 📋 آدرس‌های دسترسی

بعد از دیپلوی موفق:

- **سایت اصلی**: https://ahmadreza-avandi.ir
- **phpMyAdmin**: https://ahmadreza-avandi.ir/phpmyadmin
- **Health Check**: https://ahmadreza-avandi.ir/api/health

## 🛠️ دستورات مدیریت

```bash
# مشاهده وضعیت
./manage.sh status

# مشاهده لاگ‌ها
./manage.sh logs

# پشتیبان‌گیری
./manage.sh backup

# ری‌استارت
./manage.sh restart

# مانیتورینگ
./manage.sh monitor

# تمدید SSL
./manage.sh ssl-renew
```

## 🔧 Development

```bash
# شروع محیط توسعه
./dev.sh start

# دسترسی:
# - Next.js: http://localhost:3000
# - phpMyAdmin: http://localhost:8080
# - MySQL: localhost:3307
```

## ⚠️ نکات مهم

1. **امنیت**: رمزهای پیش‌فرض را تغییر دهید
2. **DNS**: دامنه باید به سرور اشاره کند
3. **فایروال**: پورت‌های 80 و 443 را باز کنید
4. **پشتیبان‌گیری**: منظم پشتیبان بگیرید
5. **مانیتورینگ**: لاگ‌ها را بررسی کنید

## 🚨 عیب‌یابی سریع

```bash
# بررسی وضعیت کانتینرها
docker-compose ps

# مشاهده لاگ‌های خطا
docker-compose logs --tail=50

# ری‌استارت سرویس‌ها
./manage.sh restart

# بررسی سلامت
curl https://ahmadreza-avandi.ir/api/health
```

## 📞 پشتیبانی

در صورت مشکل:
1. لاگ‌ها را بررسی کنید
2. از دستورات عیب‌یابی استفاده کنید
3. مستندات کامل را مطالعه کنید

**🎉 سیستم شما آماده است!**