#!/bin/bash

echo "🚀 شروع deploy سریع (بدون build)..."

# متوقف کردن کانتینرهای قبلی
echo "⏹️ متوقف کردن کانتینرهای قبلی..."
docker-compose -f docker-compose.dev.yml down

# پاک کردن images قدیمی
echo "🧹 پاک کردن images قدیمی..."
docker system prune -f

# اجرای کانتینرها (بدون build)
echo "🔨 اجرای کانتینرها..."
docker-compose -f docker-compose.dev.yml up -d

# نمایش وضعیت
echo "📊 وضعیت کانتینرها:"
docker-compose -f docker-compose.dev.yml ps

echo "✅ Deploy کامل شد!"
echo "🌐 سایت در دسترس است: http://your-domain.com"
echo "📊 MySQL در دسترس است: localhost:3306"
echo "📊 phpMyAdmin در دسترس است: http://your-domain.com/phpmyadmin"