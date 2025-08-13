#!/bin/bash

echo "🚀 شروع deploy با pre-build..."

# Build local (روی سرور قوی‌تر یا local machine)
echo "🔨 Building application locally..."
npm run build

# متوقف کردن کانتینرهای قبلی
echo "⏹️ متوقف کردن کانتینرهای قبلی..."
docker-compose -f docker-compose.prebuilt.yml down

# پاک کردن images قدیمی
echo "🧹 پاک کردن images قدیمی..."
docker system prune -f

# Build و اجرای کانتینرها با Dockerfile جدید
echo "🔨 Build و اجرای کانتینرها..."
docker-compose -f docker-compose.prebuilt.yml up -d --build

# نمایش وضعیت
echo "📊 وضعیت کانتینرها:"
docker-compose -f docker-compose.prebuilt.yml ps

echo "✅ Deploy کامل شد!"
echo "🌐 سایت در دسترس است: http://your-domain.com"
echo "📊 MySQL در دسترس است: localhost:3306"