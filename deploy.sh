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

# نمایش وضعیت
echo "📊 وضعیت کانتینرها:"
docker-compose -f docker-compose.simple.yml ps

echo "✅ Deploy کامل شد!"
echo "🌐 سایت در دسترس است: http://your-domain.com"
echo "📊 MySQL در دسترس است: localhost:3306"