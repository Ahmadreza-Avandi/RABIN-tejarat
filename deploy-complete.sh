#!/bin/bash

echo "🚀 شروع deploy کامل CRM System..."

# بررسی وجود Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker نصب نیست. لطفا ابتدا Docker را نصب کنید."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose نصب نیست. لطفا ابتدا Docker Compose را نصب کنید."
    exit 1
fi

# توقف کانتینرهای قبلی
echo "🛑 توقف کانتینرهای قبلی..."
docker-compose -f docker-compose.fixed.yml down

# پاک کردن images قدیمی
echo "🧹 پاک کردن images قدیمی..."
docker system prune -f

# Build و اجرای کانتینرها
echo "🔨 Build و اجرای کانتینرها..."
docker-compose -f docker-compose.fixed.yml up --build -d

# انتظار برای آماده شدن سرویس‌ها
echo "⏳ انتظار برای آماده شدن سرویس‌ها..."
sleep 30

# بررسی وضعیت کانتینرها
echo "🔍 بررسی وضعیت کانتینرها..."
docker-compose -f docker-compose.fixed.yml ps

# نمایش لاگ‌ها
echo "📋 نمایش لاگ‌های اخیر..."
docker-compose -f docker-compose.fixed.yml logs --tail=20

echo ""
echo "✅ Deploy کامل شد!"
echo ""
echo "🌐 لینک‌های دسترسی:"
echo "   - وب‌سایت: http://localhost:3000"
echo "   - phpMyAdmin: http://localhost:8080"
echo ""
echo "📊 اطلاعات دیتابیس:"
echo "   - Host: mysql (در Docker) / localhost (خارج از Docker)"
echo "   - Port: 3306"
echo "   - Database: crm_system"
echo "   - Username: root"
echo "   - Password: 1234"
echo ""
echo "🔧 دستورات مفید:"
echo "   - مشاهده لاگ‌ها: docker-compose -f docker-compose.fixed.yml logs -f"
echo "   - توقف سرویس‌ها: docker-compose -f docker-compose.fixed.yml down"
echo "   - ری‌استارت: docker-compose -f docker-compose.fixed.yml restart"