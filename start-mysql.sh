#!/bin/bash

echo "🚀 راه‌اندازی MySQL و phpMyAdmin..."

# توقف کانتینرهای قبلی
echo "🛑 توقف کانتینرهای قبلی..."
docker-compose -f docker-compose.mysql.yml down

# راه‌اندازی MySQL و phpMyAdmin
echo "📦 راه‌اندازی MySQL و phpMyAdmin..."
docker-compose -f docker-compose.mysql.yml up -d

# انتظار برای آماده شدن دیتابیس
echo "⏳ انتظار برای آماده شدن دیتابیس..."
sleep 15

# بررسی وضعیت
echo "🔍 بررسی وضعیت کانتینرها..."
docker-compose -f docker-compose.mysql.yml ps

echo ""
echo "✅ MySQL آماده است!"
echo ""
echo "🌐 دسترسی‌ها:"
echo "   - phpMyAdmin: http://localhost:8080"
echo "   - MySQL Host: localhost"
echo "   - MySQL Port: 3307"
echo "   - Database: crm_system"
echo "   - Username: root"
echo "   - Password: 1234"
echo ""
echo "🚀 حالا Next.js رو اجرا کن:"
echo "   npm run dev"
echo ""
echo "🔧 دستورات مفید:"
echo "   - مشاهده لاگ MySQL: docker logs crm-mysql"
echo "   - توقف: docker-compose -f docker-compose.mysql.yml down"