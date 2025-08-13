#!/bin/bash

echo "🚀 شروع deploy با fix مشکل path..."

# متوقف کردن کانتینرهای قبلی
echo "⏹️ متوقف کردن کانتینرهای قبلی..."
docker-compose -f docker-compose.simple-fix.yml down

# پاک کردن node_modules local
echo "🧹 پاک کردن node_modules..."
rm -rf node_modules

# پاک کردن images قدیمی
echo "🧹 پاک کردن images قدیمی..."
docker system prune -f

# اجرای کانتینرها
echo "🔨 اجرای کانتینرها..."
docker-compose -f docker-compose.simple-fix.yml up -d

# نمایش وضعیت
echo "📊 وضعیت کانتینرها:"
docker-compose -f docker-compose.simple-fix.yml ps

echo "✅ Deploy کامل شد!"
echo "🌐 Next.js در دسترس است: http://localhost:3000"
echo "📊 MySQL در دسترس است: localhost:3306"
echo "📊 phpMyAdmin در دسترس است: http://localhost:8080"

echo ""
echo "📋 برای مشاهده لاگ Next.js:"
echo "docker logs nextjs -f"