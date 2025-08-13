# راهنمای کامل نصب و راه‌اندازی سیستم CRM

## پیش‌نیازها

### 1. نصب Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# یا با nvm (توصیه می‌شود)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 2. نصب Docker
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# بعد از اضافه کردن به گروه، logout و login کنید
```

### 3. نصب Git
```bash
sudo apt install -y git
```

## راه‌اندازی پروژه

### مرحله 1: کلون کردن پروژه
```bash
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat
```

### مرحله 2: نصب Dependencies
```bash
npm install
```

### مرحله 3: راه‌اندازی دیتابیس با Docker
```bash
# اجازه اجرا به اسکریپت‌ها
chmod +x start-mysql.sh
chmod +x stop-dev.sh

# راه‌اندازی MySQL و phpMyAdmin
./start-mysql.sh
```

### مرحله 4: تست اتصال دیتابیس
```bash
node test-db-connection.js
```

باید پیام زیر رو ببینید:
```
✅ اتصال به دیتابیس موفق بود!
📊 تعداد کاربران: 2
✅ تست کامل شد - Next.js می‌تونه به دیتابیس Docker وصل بشه
```

### مرحله 5: اجرای Next.js
```bash
npm run dev
```

## دسترسی‌ها

- **وب‌سایت**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080
  - Username: root
  - Password: 1234
  - Database: crm_system

## روش‌های مختلف Deploy

### روش 1: Development Mode (توصیه شده)
فقط دیتابیس با Docker، Next.js با npm:

```bash
./start-mysql.sh    # MySQL + phpMyAdmin
npm run dev         # Next.js
```

**مزایا:**
- سرعت بالا
- Hot reload
- دیباگ آسان

### روش 2: Production Mode
همه چیز با Docker:

```bash
chmod +x deploy-complete.sh
./deploy-complete.sh
```

## مشکل‌گشایی

### مشکل پورت اشغال
اگر پورت 3307 اشغال است:
```bash
# بررسی پورت‌های اشغال
sudo netstat -tlnp | grep :3307

# تغییر پورت در docker-compose.mysql.yml
# از 3307:3306 به 3308:3306
```

### مشکل اجازه دسترسی Docker
```bash
sudo usermod -aG docker $USER
# logout و login کنید
```

### مشکل نصب Dependencies
```bash
# پاک کردن node_modules و نصب مجدد
rm -rf node_modules package-lock.json
npm install
```

### بررسی وضعیت کانتینرها
```bash
docker ps                                    # کانتینرهای فعال
docker logs crm-mysql                        # لاگ MySQL
docker logs crm-phpmyadmin                   # لاگ phpMyAdmin
```

## دستورات مفید

### مدیریت Docker
```bash
# توقف همه کانتینرها
docker-compose -f docker-compose.mysql.yml down

# مشاهده لاگ‌ها
docker logs crm-mysql -f

# دسترسی به MySQL shell
docker exec -it crm-mysql mysql -u root -p1234 crm_system

# بکاپ دیتابیس
docker exec crm-mysql mysqldump -u root -p1234 crm_system > backup.sql

# ریستور دیتابیس
docker exec -i crm-mysql mysql -u root -p1234 crm_system < backup.sql
```

### مدیریت Next.js
```bash
npm run dev         # Development mode
npm run build       # Build برای production
npm run start       # اجرای production build
npm run lint        # بررسی کد
```

## تنظیمات Environment

فایل `.env.local` (برای development):
```env
DATABASE_URL=mysql://root:1234@localhost:3307/crm_system
DATABASE_HOST=localhost
DATABASE_PORT=3307
DATABASE_USER=root
DATABASE_PASSWORD=1234
DATABASE_NAME=crm_system

JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## نکات امنیتی

1. **تغییر پسوردها**: پسورد پیش‌فرض MySQL (1234) رو تغییر بدید
2. **JWT Secret**: یک کلید قوی و تصادفی استفاده کنید
3. **Email Credentials**: از App Password استفاده کنید، نه پسورد اصلی
4. **HTTPS**: برای production حتماً HTTPS فعال کنید

## پورت‌های استفاده شده

- **3000**: Next.js Development Server
- **3307**: MySQL Database
- **8080**: phpMyAdmin
- **80/443**: Production (Nginx)

## ساختار پروژه

```
RABIN-tejarat/
├── app/                    # Next.js App Router
├── components/             # React Components
├── lib/                    # Utilities
├── public/                 # Static Files
├── docker-compose.mysql.yml # Docker MySQL Setup
├── start-mysql.sh          # راه‌اندازی MySQL
├── test-db-connection.js   # تست اتصال DB
└── DEPLOYMENT_GUIDE.md     # این فایل
```

## خلاصه دستورات سریع

```bash
# نصب کامل از صفر
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat
npm install
chmod +x start-mysql.sh
./start-mysql.sh
node test-db-connection.js
npm run dev

# دسترسی
# http://localhost:3000 - وب‌سایت
# http://localhost:8080 - phpMyAdmin
```

🚀 **حالا سیستم CRM آماده استفاده است!**