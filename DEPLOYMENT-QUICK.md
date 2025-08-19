# 🚀 راهنمای Deployment سریع

## مراحل Deployment

### 1. آماده‌سازی سرور
```bash
# کلون پروژه
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat

# تنظیم متغیرهای محیطی
cp .env.example .env
nano .env  # ویرایش تنظیمات
```

### 2. Deployment سریع
```bash
# اجرای اسکریپت سریع
./quick-deploy.sh
```

### 3. Deployment بهینه‌شده برای حافظه کم
```bash
# برای سرورهای با RAM کم (کمتر از 2GB)
./deploy-memory-optimized.sh
```

## تنظیمات مهم در .env

```env
# Database
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_DATABASE=crm_system
MYSQL_USER=crm_user
MYSQL_PASSWORD=your_db_password

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://your-server-ip

# Database URL
DATABASE_URL=mysql://crm_user:your_db_password@mysql:3306/crm_system
```

## بررسی وضعیت

```bash
# مشاهده وضعیت کانتینرها
docker-compose ps

# مشاهده لاگ‌ها
docker-compose logs -f

# ری‌استارت سرویس‌ها
docker-compose restart
```

## حل مشکلات رایج

### خطای حافظه در Build
```bash
# استفاده از کانفیگ بهینه‌شده
docker-compose -f docker-compose.memory-optimized.yml up --build -d
```

### خطای اتصال به دیتابیس
```bash
# بررسی وضعیت MySQL
docker-compose logs mysql

# ری‌استارت MySQL
docker-compose restart mysql
```

### خطای پورت اشغال
```bash
# بررسی پورت‌های اشغال
netstat -tulpn | grep :80
netstat -tulpn | grep :3306

# متوقف کردن سرویس‌های اشغال‌کننده
sudo systemctl stop apache2  # یا nginx
```

## دسترسی به سیستم

- **وب اپلیکیشن**: `http://your-server-ip`
- **دیتابیس**: `your-server-ip:3306`

## کامندهای مفید

```bash
# مشاهده استفاده از منابع
docker stats

# پاک کردن کامل
docker-compose down -v
docker system prune -a

# بک‌آپ دیتابیس
docker-compose exec mysql mysqldump -u root -p crm_system > backup.sql
```