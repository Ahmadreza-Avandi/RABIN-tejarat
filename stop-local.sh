#!/bin/bash

echo "🛑 توقف کامل سرویس‌های محلی..."

# توقف همه کانتینرهای محلی
echo "📦 توقف کانتینرهای Docker..."
docker-compose -f docker-compose.full-local.yml down 2>/dev/null || true
docker-compose -f docker-compose.local.yml down 2>/dev/null || true

# پاکسازی (اختیاری)
read -p "آیا می‌خواهید Docker cache را پاک کنید؟ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 پاکسازی Docker cache..."
    docker system prune -f
fi

# پاک کردن volume‌ها (اختیاری)
read -p "آیا می‌خواهید داده‌های MySQL را پاک کنید؟ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ پاک کردن volume‌های MySQL..."
    docker volume rm cem-crm-main_mysql_local_data 2>/dev/null || true
    echo "⚠️ داده‌های MySQL پاک شد!"
fi

echo "✅ توقف کامل شد!"