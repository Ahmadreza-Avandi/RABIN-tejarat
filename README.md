# CEM-CRM System

سیستم مدیریت ارتباط با مشتری و تجربه مشتری (CEM-CRM)

## پیش‌نیازها

برای اجرای این پروژه نیاز دارید:

- Docker
- Docker Compose

## راه‌اندازی پروژه

### 1. کلون کردن مخزن

```bash
git clone https://github.com/Ahmadreza-Avandi/Rabin-CEM-CRM_system.git
cd Rabin-CEM-CRM_system
```

### 2. راه‌اندازی با Docker

پروژه به صورت خودکار با استفاده از Docker Compose راه‌اندازی می‌شود:

```bash
docker-compose up --build
```

این دستور:
- یک کانتینر MariaDB راه‌اندازی می‌کند
- دیتابیس `crm_system` را ایجاد می‌کند
- به صورت خودکار فایل `crm_system.sql` را برای ایجاد جداول و ساختار دیتابیس اجرا می‌کند
- اپلیکیشن Next.js را در پورت 3000 راه‌اندازی می‌کند

### 3. دسترسی به اپلیکیشن

پس از راه‌اندازی موفق، می‌توانید به اپلیکیشن از طریق آدرس زیر دسترسی داشته باشید:
```
http://localhost:3000
```

## ساختار دیتابیس

دیتابیس شامل جداول زیر است:
- activities: فعالیت‌های مرتبط با مشتریان
- users: کاربران سیستم
- customers: اطلاعات مشتریان
- interactions: تعاملات با مشتریان
- deals: معاملات
- products: محصولات
- tasks: وظایف
- و سایر جداول مرتبط...

## تنظیمات دیتابیس

اطلاعات اتصال به دیتابیس:
- Host: localhost (یا mysql در شبکه داکر)
- Port: 3306
- Database: crm_system
- Username: root
- Password: 1234

### دسترسی به phpMyAdmin

برای مدیریت دیتابیس می‌توانید از phpMyAdmin استفاده کنید:

- در محیط local: http://localhost/phpmyadmin
- در محیط production: https://ahmadreza-avandi.ir/phpmyadmin

اطلاعات ورود:
- Username: root
- Password: 1234

## بازسازی دیتابیس

اگر نیاز به بازسازی کامل دیتابیس دارید:

```bash
# حذف و ایجاد مجدد دیتابیس
docker exec -i $(docker ps -qf "name=mysql") mysql -uroot -p1234 -e "DROP DATABASE IF EXISTS crm_system; CREATE DATABASE crm_system;"

# وارد کردن اسکیما و داده‌های اولیه
docker exec -i $(docker ps -qf "name=mysql") mysql -uroot -p1234 crm_system < crm_system.sql
```

## پاکسازی کامل و شروع مجدد

برای پاکسازی کامل و شروع مجدد:

```bash
# توقف و حذف کانتینرها
docker-compose down

# پاکسازی کش و ایمیج‌های داکر
docker system prune -af
docker volume prune -f

# راه‌اندازی مجدد
docker-compose up --build
```

## راه‌اندازی روی سرور

### 1. نصب پیش‌نیازها روی سرور

```bash
# نصب Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# نصب Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# نصب Certbot برای SSL
sudo apt-get update
sudo apt-get install certbot
```

### 2. تنظیم SSL برای دامنه

```bash
# دریافت و نصب SSL
sudo certbot certonly --standalone -d ahmadreza-avandi.ir -d www.ahmadreza-avandi.ir
```

### 3. راه‌اندازی پروژه

```bash
# کلون پروژه
git clone https://github.com/Ahmadreza-Avandi/Rabin-CEM-CRM_system.git
cd Rabin-CEM-CRM_system

# راه‌اندازی کانتینرها
docker-compose up -d --build
```

بعد از اجرای این دستورات، سایت باید از طریق دامنه‌های زیر در دسترس باشد:
- http://ahmadreza-avandi.ir
- https://ahmadreza-avandi.ir
- http://www.ahmadreza-avandi.ir
- https://www.ahmadreza-avandi.ir