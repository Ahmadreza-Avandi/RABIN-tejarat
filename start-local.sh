#!/bin/bash

echo "🚀 راه‌اندازی CRM محلی با Docker..."

# بررسی وجود فایل .env.local
if [ ! -f ".env.local" ]; then
    echo "❌ فایل .env.local یافت نشد!"
    exit 1
fi

# کپی .env.local به .env برای استفاده
cp .env.local .env

# متوقف کردن کانتینرهای قدیمی
echo "🛑 متوقف کردن کانتینرهای قدیمی..."
docker-compose -f docker-compose.local.yml down 2>/dev/null || true

# پاکسازی
echo "🧹 پاکسازی..."
docker system prune -f

# راه‌اندازی MySQL و phpMyAdmin
echo "🗄️ راه‌اندازی MySQL و phpMyAdmin..."
docker-compose -f docker-compose.local.yml up -d

# انتظار برای آماده شدن MySQL
echo "⏳ انتظار برای آماده شدن MySQL..."
sleep 20

# بررسی وضعیت MySQL
echo "🔍 بررسی وضعیت MySQL..."
docker-compose -f docker-compose.local.yml exec mysql mysqladmin ping -h localhost -u root -p1234

if [ $? -eq 0 ]; then
    echo "✅ MySQL آماده است!"
else
    echo "⚠️ MySQL ممکن است هنوز آماده نباشد، ادامه می‌دهیم..."
fi

# نمایش وضعیت کانتینرها
echo "📊 وضعیت کانتینرها:"
docker-compose -f docker-compose.local.yml ps

echo ""
echo "🎉 راه‌اندازی کامل شد!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️ MySQL: localhost:3306"
echo "   • Username: crm_user"
echo "   • Password: 1234"
echo "   • Database: crm_system"
echo ""
echo "🔐 phpMyAdmin: http://localhost:8081"
echo "   • Username: crm_user"
echo "   • Password: 1234"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 دستورات مفید:"
echo "   • مشاهده لاگ‌ها: docker-compose -f docker-compose.local.yml logs -f"
echo "   • توقف: docker-compose -f docker-compose.local.yml down"
echo "   • راه‌اندازی مجدد: docker-compose -f docker-compose.local.yml restart"
echo ""
echo "🚀 حالا می‌توانید Next.js را با دستور زیر اجرا کنید:"
echo "   npm run dev"