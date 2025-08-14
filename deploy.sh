#!/bin/bash

echo "🚀 شروع دیپلوی پروژه..."

# توقف کانتینرهای قبلی
echo "⏹️ توقف کانتینرهای قبلی..."
docker-compose down

# پاک کردن تصاویر قدیمی
echo "🧹 پاک کردن تصاویر قدیمی..."
docker system prune -f

# ساخت و اجرای کانتینرها
echo "🔨 ساخت و اجرای کانتینرها..."
docker-compose up -d --build

# نمایش وضعیت
echo "📊 وضعیت کانتینرها:"
docker-compose ps

echo "✅ دیپلوی با موفقیت انجام شد!"
echo "🌐 سایت: https://ahmadreza-avandi.ir"
echo "🗄️ phpMyAdmin: https://ahmadreza-avandi.ir/phpmyadmin/"