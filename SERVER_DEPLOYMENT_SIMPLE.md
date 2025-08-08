# راهنمای ساده استقرار پروژه روی سرور

این راهنما مراحل ساده استقرار پروژه CEM-CRM روی سرور را توضیح می‌دهد.

## پیش‌نیازها

- سرور لینوکس (Ubuntu 20.04 یا بالاتر توصیه می‌شود)
- Docker و Docker Compose نصب شده باشد
- Git نصب شده باشد
- دامنه به سرور شما اشاره کند (برای محیط تولید)

## مراحل استقرار

### 1. نصب Docker و Docker Compose (اگر نصب نیست)

```bash
# به‌روزرسانی پکیج‌ها
sudo apt update

# نصب پکیج‌های مورد نیاز
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# اضافه کردن کلید GPG داکر
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# اضافه کردن مخزن داکر
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# نصب داکر
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# نصب Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.15.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# اضافه کردن کاربر به گروه داکر
sudo usermod -aG docker $USER
```

خروج و ورود مجدد به سیستم برای اعمال تغییرات گروه.

### 2. دریافت کد پروژه

```bash
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat
```

### 3. تنظیم فایل‌های داکر

Dockerfile و docker-compose.yml در مخزن گیت موجود هستند و نیازی به تغییر ندارند.

### 4. اطمینان از وجود فایل دیتابیس

اطمینان حاصل کنید که فایل `crm_system.sql` در دایرکتوری اصلی پروژه وجود دارد.

### 5. تنظیم Nginx

اطمینان حاصل کنید که فایل `nginx/default.conf` به درستی تنظیم شده است و به دامنه شما اشاره می‌کند.

### 6. تنظیم SSL (اختیاری)

اگر می‌خواهید از SSL استفاده کنید، گواهی‌های SSL را در مسیر `/etc/letsencrypt` قرار دهید.

### 7. اجرای پروژه

```bash
# توقف کانتینرهای قبلی (اگر وجود دارند)
docker-compose down

# حذف حجم‌های قبلی (اختیاری)
docker volume rm $(docker volume ls -q)

# شروع کانتینرها
docker-compose up -d
```

### 8. بررسی وضعیت

```bash
# بررسی وضعیت کانتینرها
docker-compose ps

# مشاهده لاگ‌ها
docker-compose logs -f nextjs
```

### 9. دسترسی به برنامه

- برنامه اصلی: http://your-domain.com
- phpMyAdmin: http://your-domain.com/phpmyadmin

## رفع مشکلات احتمالی

### مشکل کمبود حافظه

اگر با مشکل کمبود حافظه مواجه شدید:

```bash
# ایجاد فایل swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### مشکل اتصال به دیتابیس

اگر برنامه نمی‌تواند به دیتابیس متصل شود:

```bash
# بررسی وضعیت کانتینر MySQL
docker-compose ps mysql

# بررسی لاگ‌های MySQL
docker-compose logs mysql

# بررسی دیتابیس‌ها
docker exec -it mysql mysql -uroot -p1234 -e "SHOW DATABASES;"
```

### به‌روزرسانی برنامه

برای به‌روزرسانی برنامه با تغییرات جدید:

```bash
git pull
docker-compose down
docker-compose up -d --build