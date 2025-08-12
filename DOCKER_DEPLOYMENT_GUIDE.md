# 🐳 راهنمای دیپلوی Docker

## مشکلات رایج و راه حل‌ها

### ❌ مشکل: Module not found '@/components/ui/...'

**علت:** Docker از cache قدیمی استفاده می‌کند و فایل‌های جدید را نمی‌بیند.

**راه حل:**
```bash
# پاک کردن کامل Docker cache
docker-compose down
docker system prune -af --volumes
docker builder prune -af

# حذف کامل images پروژه
docker rmi $(docker images | grep rabin-tejarat | awk '{print $3}') 2>/dev/null || true

# Build کردن از صفر
docker-compose build --no-cache --pull nextjs
docker-compose up -d
```

### ✅ مراحل دیپلوی صحیح

#### 1. آماده‌سازی
```bash
# آپدیت کد
git pull origin main

# چک کردن فایل‌های UI
ls -la components/ui/card.tsx
ls -la components/ui/badge.tsx
ls -la components/ui/button.tsx
```

#### 2. پاک کردن Cache
```bash
# متوقف کردن سرویس‌ها
docker-compose down

# پاک کردن کامل cache
docker system prune -af --volumes
docker builder prune -af
```

#### 3. Build و اجرا
```bash
# Build از صفر
docker-compose build --no-cache nextjs

# اجرای سرویس‌ها
docker-compose up -d
```

#### 4. تست و بررسی
```bash
# چک کردن وضعیت
docker-compose ps

# مشاهده لاگ‌ها
docker-compose logs nextjs

# تست health endpoint
curl http://localhost:3000/api/health
```

## نکات مهم

### 🔧 Dockerfile بهبود یافته
- اضافه شدن cache buster برای جلوگیری از مشکلات cache
- بهینه‌سازی layers برای build سریع‌تر

### 📁 فایل‌های UI Components
همه فایل‌های مورد نیاز در `components/ui/` موجود هستند:
- card.tsx
- badge.tsx  
- button.tsx
- input.tsx
- select.tsx
- table.tsx
- dropdown-menu.tsx
- scroll-area.tsx
- avatar.tsx
- checkbox.tsx
- progress.tsx
- label.tsx
- popover.tsx
- textarea.tsx
- tabs.tsx

### 🚨 عیب‌یابی

#### اگر build موفق نبود:
```bash
# چک کردن فایل‌های موجود
find components/ui -name "*.tsx" | head -10

# تست build محلی
npm run build
```

#### اگر سرویس‌ها start نشدند:
```bash
# چک کردن لاگ‌های خطا
docker-compose logs

# چک کردن پورت‌های اشغال شده
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

## دستورات مفید

```bash
# مشاهده وضعیت real-time
docker-compose logs -f

# ری‌استارت یک سرویس خاص
docker-compose restart nextjs

# چک کردن منابع مصرفی
docker stats

# پاک کردن کامل (در صورت نیاز)
docker-compose down --rmi all --volumes --remove-orphans
```