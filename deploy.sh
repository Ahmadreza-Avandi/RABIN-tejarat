#!/bin/bash

echo "🚀 شروع دیپلوی پروژه..."

# بهینه‌سازی swap
echo "🔧 بهینه‌سازی swap..."
./optimize-swap.sh

# بررسی memory و swap
echo "📊 بررسی وضعیت memory:"
free -h

# توقف کانتینرهای قبلی
echo "⏹️ توقف کانتینرهای قبلی..."
docker-compose down
docker-compose -f docker-compose.build.yml down

# پاک کردن تصاویر قدیمی و آزاد کردن memory
echo "🧹 پاک کردن کش و آزاد کردن memory..."
docker system prune -a -f
sync && echo 3 > /proc/sys/vm/drop_caches

# ساخت و اجرای کانتینرها
echo "🔨 ساخت و اجرای کانتینرها..."
docker-compose -f docker-compose.build.yml up -d --build

# نمایش وضعیت
echo "📊 وضعیت کانتینرها:"
docker-compose -f docker-compose.build.yml ps

# نمایش استفاده از memory
echo "💾 استفاده از memory:"
docker stats --no-stream

echo "✅ دیپلوی با موفقیت انجام شد!"
echo "🌐 سایت: https://ahmadreza-avandi.ir"
echo "🗄️ phpMyAdmin: https://ahmadreza-avandi.ir/phpmyadmin/"