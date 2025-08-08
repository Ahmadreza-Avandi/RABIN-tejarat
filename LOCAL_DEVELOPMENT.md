# راهنمای اجرای پروژه RABIN-tejarat CRM بدون داکر

این راهنما به شما کمک می‌کند تا پروژه RABIN-tejarat CRM را بدون استفاده از داکر و به صورت محلی اجرا کنید.

## پیش‌نیازها

- Node.js نسخه 18 یا بالاتر
- MySQL نسخه 5.7 یا بالاتر (یا MariaDB 10.5+)
- Git
- npm یا yarn

## مراحل نصب و راه‌اندازی

### 1. دریافت کد پروژه

ابتدا کد پروژه را از مخزن گیت‌هاب دریافت کنید:

```bash
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat
```

### 2. نصب وابستگی‌ها

وابستگی‌های پروژه را با استفاده از npm نصب کنید:

```bash
npm install
```

یا اگر از yarn استفاده می‌کنید:

```bash
yarn install
```

### 3. راه‌اندازی پایگاه داده

#### نصب MySQL یا MariaDB

اگر MySQL یا MariaDB را نصب ندارید، آن را نصب کنید:

**برای Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**برای Windows:**
- نسخه مناسب MySQL را از [سایت رسمی](https://dev.mysql.com/downloads/installer/) دانلود و نصب کنید.

#### ایجاد پایگاه داده

وارد MySQL شوید:

```bash
mysql -u root -p
```

سپس پایگاه داده و کاربر مورد نیاز را ایجاد کنید:

```sql
CREATE DATABASE crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'crm_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON crm_system.* TO 'crm_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### وارد کردن اسکیما و داده‌های اولیه

فایل SQL موجود در پروژه را به پایگاه داده وارد کنید:

```bash
mysql -u root -p crm_system < crm_system.sql
```

### 4. تنظیم متغیرهای محیطی

فایل `.env.local` را ایجاد کنید:

```bash
cp .env.example .env.local
```

سپس فایل `.env.local` را با اطلاعات پایگاه داده خود ویرایش کنید:

```
DATABASE_URL=mysql://crm_user:your_password@localhost:3306/crm_system
DATABASE_HOST=localhost
DATABASE_USER=crm_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=crm_system

JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REFRESH_TOKEN=your-google-refresh-token

NODE_ENV=development
```

### 5. اجرای پروژه در حالت توسعه

برای اجرای پروژه در حالت توسعه:

```bash
npm run dev
```

یا با yarn:

```bash
yarn dev
```

حالا می‌توانید به آدرس `http://localhost:3000` در مرورگر خود دسترسی داشته باشید.

### 6. ساخت نسخه تولید (اختیاری)

اگر می‌خواهید نسخه تولید را بسازید و اجرا کنید:

```bash
# ساخت پروژه
npm run build

# اجرای نسخه تولید
npm start
```

## نکات مهم

### افزایش حافظه Node.js

اگر هنگام ساخت پروژه با خطای کمبود حافظه مواجه شدید، می‌توانید حافظه Node.js را افزایش دهید:

```bash
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build
```

### دسترسی به phpMyAdmin (اختیاری)

برای مدیریت راحت‌تر پایگاه داده، می‌توانید phpMyAdmin را نصب کنید:

**برای Ubuntu/Debian:**
```bash
sudo apt install phpmyadmin
```

سپس به آدرس `http://localhost/phpmyadmin` دسترسی پیدا کنید.

**برای Windows:**
- از طریق XAMPP یا WAMP می‌توانید به phpMyAdmin دسترسی داشته باشید.

### اطلاعات ورود به سیستم

برای ورود به سیستم از اطلاعات زیر استفاده کنید:

- ایمیل: `admin@example.com`
- رمز عبور: `admin123`

## عیب‌یابی

### مشکلات پایگاه داده

اگر با خطای اتصال به پایگاه داده مواجه شدید:

1. مطمئن شوید که سرویس MySQL در حال اجراست:
   ```bash
   sudo systemctl status mysql
   ```

2. اطلاعات اتصال به پایگاه داده در فایل `.env.local` را بررسی کنید.

3. دسترسی‌های کاربر پایگاه داده را بررسی کنید:
   ```bash
   mysql -u root -p
   SHOW GRANTS FOR 'crm_user'@'localhost';
   ```

### مشکلات Node.js

اگر با خطاهای Node.js مواجه شدید:

1. مطمئن شوید که نسخه Node.js شما سازگار است:
   ```bash
   node -v
   ```

2. پاک کردن کش npm و نصب مجدد وابستگی‌ها:
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

### مشکلات سرویس ایمیل

اگر سرویس ایمیل کار نمی‌کند:

1. مطمئن شوید که اطلاعات SMTP در فایل `.env.local` درست است.

2. اگر از Gmail استفاده می‌کنید، مطمئن شوید که "دسترسی برنامه‌های کم‌امن" را فعال کرده‌اید یا از رمز عبور برنامه استفاده می‌کنید.

3. اطلاعات OAuth2 گوگل را بررسی کنید.