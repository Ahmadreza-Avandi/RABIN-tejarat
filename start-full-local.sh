#!/bin/bash

echo "🚀 راه‌اندازی کامل CRM محلی با Docker..."
echo "📦 شامل: MySQL + NextJS + phpMyAdmin"

# بررسی وجود فایل‌های مورد نیاز
if [ ! -f ".env.local" ]; then
    echo "❌ فایل .env.local یافت نشد!"
    exit 1
fi

if [ ! -f "Dockerfile.simple" ]; then
    echo "❌ فایل Dockerfile.simple یافت نشد!"
    exit 1
fi

if [ ! -f "database/crm_system.sql" ]; then
    echo "❌ فایل database/crm_system.sql یافت نشد!"
    exit 1
fi

# کپی .env.local به .env برای استفاده
cp .env.local .env

# متوقف کردن کانتینرهای قدیمی
echo "🛑 متوقف کردن کانتینرهای قدیمی..."
docker-compose -f docker-compose.full-local.yml down 2>/dev/null || true
docker-compose -f docker-compose.local.yml down 2>/dev/null || true

# پاکسازی
echo "🧹 پاکسازی Docker..."
docker system prune -f

# بررسی وجود image‌های قدیمی و پاک کردن
echo "🗑️ پاک کردن image‌های قدیمی..."
docker rmi $(docker images | grep "crm\|cem-crm" | awk '{print $3}') 2>/dev/null || true

# راه‌اندازی همه سرویس‌ها
echo "🏗️ Build و راه‌اندازی همه سرویس‌ها..."
docker-compose -f docker-compose.full-local.yml up --build -d

# انتظار برای آماده شدن MySQL
echo "⏳ انتظار برای آماده شدن MySQL..."
sleep 30

# بررسی وضعیت MySQL
echo "🔍 بررسی وضعیت MySQL..."
for i in {1..10}; do
    if docker-compose -f docker-compose.full-local.yml exec -T mysql mysqladmin ping -h localhost -u root -p1234 >/dev/null 2>&1; then
        echo "✅ MySQL آماده است!"
        break
    else
        echo "⏳ انتظار برای MySQL... ($i/10)"
        sleep 5
    fi
done

# بررسی وضعیت NextJS
echo "🔍 بررسی وضعیت NextJS..."
for i in {1..10}; do
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ NextJS آماده است!"
        break
    else
        echo "⏳ انتظار برای NextJS... ($i/10)"
        sleep 5
    fi
done

# نمایش وضعیت کانتینرها
echo "📊 وضعیت کانتینرها:"
docker-compose -f docker-compose.full-local.yml ps

# نمایش لاگ‌های اخیر
echo "📋 لاگ‌های اخیر NextJS:"
docker-compose -f docker-compose.full-local.yml logs --tail=10 nextjs

# تست اتصال به دیتابیس
echo "🧪 تست اتصال به دیتابیس..."
if docker-compose -f docker-compose.full-local.yml exec -T mysql mysql -u crm_app_user -p1234 -e "USE crm_system; SHOW TABLES;" >/dev/null 2>&1; then
    echo "✅ اتصال به دیتابیس موفق!"
    
    # نمایش تعداد جداول
    TABLE_COUNT=$(docker-compose -f docker-compose.full-local.yml exec -T mysql mysql -u crm_app_user -p1234 -e "USE crm_system; SHOW TABLES;" 2>/dev/null | wc -l)
    echo "📊 تعداد جداول در دیتابیس: $((TABLE_COUNT - 1))"
else
    echo "⚠️ مشکل در اتصال به دیتابیس"
fi

echo ""
echo "🎉 راه‌اندازی کامل شد!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 CRM Application: http://localhost:3000"
echo ""
echo "🗄️ MySQL Database: localhost:3306"
echo "   • Username: crm_app_user"
echo "   • Password: 1234"
echo "   • Database: crm_system"
echo ""
echo "🔐 phpMyAdmin: http://localhost:8081"
echo "   • Username: crm_app_user"
echo "   • Password: 1234"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 دستورات مفید:"
echo "   • مشاهده لاگ‌ها: docker-compose -f docker-compose.full-local.yml logs -f"
echo "   • مشاهده لاگ NextJS: docker-compose -f docker-compose.full-local.yml logs -f nextjs"
echo "   • مشاهده لاگ MySQL: docker-compose -f docker-compose.full-local.yml logs -f mysql"
echo "   • توقف: docker-compose -f docker-compose.full-local.yml down"
echo "   • راه‌اندازی مجدد: docker-compose -f docker-compose.full-local.yml restart"
echo "   • ورود به کانتینر NextJS: docker-compose -f docker-compose.full-local.yml exec nextjs sh"
echo "   • ورود به MySQL: docker-compose -f docker-compose.full-local.yml exec mysql mysql -u crm_app_user -p1234 crm_system"
echo ""
echo "🔧 برای توقف کامل:"
echo "   ./stop-local.sh"