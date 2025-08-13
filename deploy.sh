#!/bin/bash

echo "🚀 شروع deploy پروژه CRM..."

# متوقف کردن کانتینرهای قبلی
echo "⏹️ متوقف کردن کانتینرهای قبلی..."
docker-compose -f docker-compose.simple.yml down

# پاک کردن images قدیمی
echo "🧹 پاک کردن images قدیمی..."
docker system prune -f

# Build و اجرای کانتینرها
echo "🔨 Build و اجرای کانتینرها..."
docker-compose -f docker-compose.simple.yml up -d --build

# انتظار برای آماده شدن سرویس‌ها
echo "⏳ انتظار برای آماده شدن سرویس‌ها..."
sleep 30

# نمایش وضعیت
echo "📊 وضعیت کانتینرها:"
docker-compose -f docker-compose.simple.yml ps

echo ""
echo "✅ Deploy کامل شد!"
echo "🌐 Next.js سایت: http://localhost:3000"
echo "📊 MySQL: localhost:3306"
echo "📊 phpMyAdmin: http://localhost:8080"
echo ""
echo "📋 برای مشاهده لاگ‌ها:"
echo "docker-compose -f docker-compose.simple.yml logs -f app"