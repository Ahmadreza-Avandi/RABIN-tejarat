#!/bin/bash

echo "🧪 تست سریع محیط محلی..."

# بررسی وضعیت کانتینرها
echo "📊 وضعیت کانتینرها:"
docker-compose -f docker-compose.full-local.yml ps

echo ""

# تست MySQL
echo "🗄️ تست MySQL..."
if docker-compose -f docker-compose.full-local.yml exec -T mysql mysqladmin ping -h localhost -u root -p1234 >/dev/null 2>&1; then
    echo "✅ MySQL: آماده"
    
    # تست دیتابیس crm_system
    if docker-compose -f docker-compose.full-local.yml exec -T mysql mysql -u crm_app_user -p1234 -e "USE crm_system; SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'crm_system';" 2>/dev/null; then
        echo "✅ دیتابیس crm_system: آماده"
    else
        echo "❌ دیتابیس crm_system: مشکل دارد"
    fi
else
    echo "❌ MySQL: در دسترس نیست"
fi

echo ""

# تست NextJS
echo "🌐 تست NextJS..."
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ NextJS: آماده"
    
    # تست API health
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        echo "✅ API Health: آماده"
    else
        echo "⚠️ API Health: ممکن است مشکل داشته باشد"
    fi
else
    echo "❌ NextJS: در دسترس نیست"
fi

echo ""

# تست phpMyAdmin
echo "🔐 تست phpMyAdmin..."
if curl -f http://localhost:8081 >/dev/null 2>&1; then
    echo "✅ phpMyAdmin: آماده"
else
    echo "❌ phpMyAdmin: در دسترس نیست"
fi

echo ""
echo "🎯 خلاصه تست:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 CRM: http://localhost:3000"
echo "🔐 phpMyAdmin: http://localhost:8081"
echo "🗄️ MySQL: localhost:3306"