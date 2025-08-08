# راهنمای استقرار بهینه‌شده برای سرور

این راهنما نحوه استفاده از نسخه بهینه‌شده داکر برای استقرار پروژه CEM-CRM روی سرور را توضیح می‌دهد. این نسخه برای سرورهایی با منابع محدود بهینه شده است.

## مشکل بیلد طولانی

اگر با مشکل زمان طولانی بیلد در سرور مواجه هستید (مانند پیام زیر):
```
[builder 4/5] COPY . .                                                                                                                              2.6s
=> [builder 5/5] RUN npm run build                                                                                                                   259.9s
=> => #    ▲ Next.js 15.4.2                                                                                                                                
=> => #    - Environments: .env.local, .env.production                                                                                                     
=> => #    - Experiments (use with caution):                                                                                                               
=> => #      · optimizePackageImports                                                                                                                      
=> => #    Creating an optimized production build ...
```

از فایل‌های بهینه‌شده داکر استفاده کنید که برای سرورهای با منابع محدود طراحی شده‌اند.

## مراحل استقرار بهینه‌شده

### 1. دریافت کد پروژه

```bash
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat
```

### 2. استفاده از فایل‌های بهینه‌شده

در این مخزن، دو فایل بهینه‌شده وجود دارد:
- `Dockerfile.optimized`: یک Dockerfile چند مرحله‌ای با بهینه‌سازی‌های حافظه
- `docker-compose.optimized.yml`: فایل docker-compose که از Dockerfile بهینه‌شده استفاده می‌کند

### 3. تنظیم متغیرهای محیطی

```bash
cp .env.example .env.production
nano .env.production
```

متغیرهای محیطی مورد نیاز را تنظیم کنید.

### 4. اجرای پروژه با فایل‌های بهینه‌شده

```bash
# توقف کانتینرهای قبلی (اگر وجود دارند)
docker-compose down

# حذف حجم‌های قبلی (اختیاری)
docker volume rm $(docker volume ls -q)

# شروع کانتینرها با فایل بهینه‌شده
docker-compose -f docker-compose.optimized.yml up -d
```

## بهینه‌سازی‌های انجام شده

فایل Dockerfile.optimized شامل بهینه‌سازی‌های زیر است:

1. **ساخت چند مرحله‌ای (Multi-stage build)**: برای کاهش اندازه نهایی ایمیج
2. **افزودن فضای swap**: برای مدیریت افزایش ناگهانی مصرف حافظه در زمان بیلد
3. **تنظیم NODE_OPTIONS**: برای افزایش محدودیت حافظه Node.js
4. **کش بهینه‌شده**: برای سرعت بخشیدن به بیلدهای بعدی
5. **استفاده از Alpine Linux**: برای کاهش اندازه ایمیج

## رفع مشکلات احتمالی

### مشکل کمبود حافظه در سرور

اگر همچنان با مشکل کمبود حافظه مواجه هستید:

```bash
# ایجاد فایل swap بزرگتر در سرور
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### خطای بیلد

اگر با خطای بیلد مواجه شدید:

```bash
# مشاهده لاگ‌های کانتینر
docker-compose -f docker-compose.optimized.yml logs nextjs
```

### بیلد محلی و آپلود به سرور

اگر سرور شما بسیار محدود است، می‌توانید پروژه را به صورت محلی بیلد کرده و فقط فایل‌های بیلد شده را به سرور آپلود کنید:

1. بیلد محلی:
   ```bash
   npm run build
   ```

2. فشرده‌سازی فایل‌های بیلد شده:
   ```bash
   tar -czvf build.tar.gz .next node_modules package.json next.config.js public
   ```

3. آپلود به سرور و استخراج:
   ```bash
   scp build.tar.gz user@server:/path/to/project
   ssh user@server "cd /path/to/project && tar -xzvf build.tar.gz"
   ```

4. اجرای داکر بدون مرحله بیلد:
   ```bash
   docker-compose -f docker-compose.optimized.yml up -d