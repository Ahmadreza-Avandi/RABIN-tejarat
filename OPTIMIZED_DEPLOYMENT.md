# راهنمای استقرار بهینه‌شده RABIN-tejarat CRM

این راهنما برای استقرار پروژه RABIN-tejarat CRM در سرورهایی با حافظه محدود با استفاده از داکر طراحی شده است. فایل‌های `Dockerfile.optimized` و `docker-compose.optimized.yml` به گونه‌ای بهینه‌سازی شده‌اند که مصرف حافظه را به حداقل برسانند و امکان ساخت و اجرای پروژه را حتی در سرورهایی با حافظه محدود فراهم کنند.

## ویژگی‌های بهینه‌سازی شده

1. **ساخت چند مرحله‌ای**: فرآیند ساخت به چندین مرحله تقسیم شده تا از افزایش ناگهانی مصرف حافظه جلوگیری شود.
2. **نصب وابستگی‌های تولید**: در مرحله نهایی فقط وابستگی‌های تولید نصب می‌شوند.
3. **حافظه مجازی داخلی**: فایل Dockerfile به صورت خودکار یک فایل swap ایجاد می‌کند.
4. **محدودیت حافظه Node.js**: محدودیت حافظه برای Node.js تنظیم شده است.
5. **تصویر Alpine**: از تصاویر Alpine استفاده شده که حجم کمتری دارند.

## مراحل استقرار

### 1. آماده‌سازی سرور

```bash
# اتصال به سرور
ssh user@your-server-ip

# نصب داکر (اگر نصب نیست)
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose

# افزودن حافظه مجازی (توصیه می‌شود)
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. دریافت کد پروژه

```bash
# دریافت کد از GitHub
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat
```

### 3. تنظیم متغیرهای محیطی

```bash
# ایجاد فایل .env.production
cp .env.example .env.production

# ویرایش فایل .env.production
nano .env.production
```

متغیرهای مهم برای تنظیم:

- `DATABASE_PASSWORD`: رمز عبور پایگاه داده
- `DATABASE_NAME`: نام پایگاه داده
- `JWT_SECRET`: کلید رمزنگاری JWT
- `NEXTAUTH_SECRET`: کلید رمزنگاری NextAuth
- `NEXTAUTH_URL`: آدرس دامنه (مثلاً https://your-domain.com)
- `EMAIL_USER`: آدرس ایمیل برای ارسال ایمیل
- `EMAIL_PASS`: رمز عبور ایمیل
- `DOMAIN_NAME`: نام دامنه (مثلاً your-domain.com)

### 4. ایجاد پوشه‌های مورد نیاز

```bash
# ایجاد پوشه‌های مورد نیاز برای certbot
mkdir -p certbot/conf certbot/www
```

### 5. استقرار با داکر

```bash
# اجرای سرویس‌ها با داکر
docker-compose -f docker-compose.optimized.yml up -d
```

### 6. تنظیم SSL

```bash
# ایجاد فایل پیکربندی موقت Nginx
cat > nginx/init-letsencrypt.conf << 'EOF'
server {
    listen 80;
    server_name ${DOMAIN_NAME};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 "Ready for SSL setup!";
    }
}
EOF

# ایجاد فایل docker-compose موقت
cat > docker-compose.init.yml << 'EOF'
version: '3.8'

services:
  nginx:
    image: nginx:latest
    container_name: nginx-init
    ports:
      - "80:80"
    environment:
      - DOMAIN_NAME=${DOMAIN_NAME}
    volumes:
      - ./nginx/init-letsencrypt.conf:/etc/nginx/conf.d/default.conf.template
      - ./nginx/nginx.sh:/docker-entrypoint.d/40-nginx-config.sh
      - ./certbot/www:/var/www/certbot
    command: /bin/bash -c "envsubst '$$DOMAIN_NAME' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"

  certbot:
    image: certbot/certbot
    container_name: certbot-init
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - nginx
EOF

# راه‌اندازی موقت و دریافت گواهی SSL
export DOMAIN_NAME=your-domain.com
docker-compose -f docker-compose.init.yml up -d
docker-compose -f docker-compose.init.yml run --rm certbot certonly --webroot -w /var/www/certbot -d your-domain.com --email your-email@example.com --agree-tos --no-eff-email
docker-compose -f docker-compose.init.yml down

# راه‌اندازی مجدد سرویس‌ها با SSL
docker-compose -f docker-compose.optimized.yml up -d
```

## عیب‌یابی

### مشکلات ساخت داکر

اگر همچنان با مشکل کمبود حافظه مواجه هستید:

1. **افزایش حافظه مجازی**:
   ```bash
   sudo swapoff /swapfile
   sudo fallocate -l 16G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. **تنظیم پارامترهای هسته لینوکس**:
   ```bash
   sudo sysctl -w vm.swappiness=10
   sudo sysctl -w vm.vfs_cache_pressure=50
   ```

3. **بستن برنامه‌های غیرضروری**:
   ```bash
   # مشاهده برنامه‌های در حال اجرا
   ps aux | sort -nrk 3,3 | head -n 10
   
   # بستن برنامه‌های غیرضروری
   kill -9 [PID]
   ```

### مشاهده لاگ‌ها

```bash
# مشاهده وضعیت کانتینرها
docker-compose -f docker-compose.optimized.yml ps

# مشاهده لاگ‌ها
docker-compose -f docker-compose.optimized.yml logs -f nextjs

# بررسی مصرف منابع
docker stats
```

## بروزرسانی برنامه

برای بروزرسانی برنامه:

```bash
# دریافت تغییرات جدید
git pull

# راه‌اندازی مجدد سرویس‌ها
docker-compose -f docker-compose.optimized.yml up -d --build
```

## نکات امنیتی

1. **تغییر رمزهای عبور پیش‌فرض**: رمزهای عبور پیش‌فرض را تغییر دهید.
2. **استفاده از SSL**: برای امنیت بیشتر، حتماً از SSL استفاده کنید.
3. **محدود کردن دسترسی‌ها**: دسترسی‌های کانتینرها را محدود کنید.
4. **به‌روزرسانی منظم**: داکر و تمام کانتینرها را به‌روز نگه دارید.
5. **پشتیبان‌گیری منظم**: از پایگاه داده و تنظیمات به صورت منظم پشتیبان‌گیری کنید.

## پشتیبان‌گیری و بازیابی

### پشتیبان‌گیری از پایگاه داده

```bash
docker exec mysql mysqldump -u root -p<your-password> crm_system > backup_$(date +%Y%m%d).sql
```

### بازیابی پایگاه داده

```bash
docker exec -i mysql mysql -u root -p<your-password> crm_system < backup_file.sql
```

این راهنما به شما کمک می‌کند تا پروژه RABIN-tejarat CRM را با استفاده از داکر در سرورهایی با حافظه محدود مستقر کنید.