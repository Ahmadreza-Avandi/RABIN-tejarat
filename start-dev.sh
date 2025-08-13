#!/bin/bash

echo "🚀 راه‌اندازی محیط توسعه CRM..."

# بررسی وجود Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker نصب نیست. لطفا ابتدا Docker را نصب کنید."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose نصب نیست. لطفا ابتدا Docker Compose را نصب کنید."
    exit 1
fi

# راه‌اندازی دیتابیس و phpMyAdmin
echo "📦 راه‌اندازی MySQL و phpMyAdmin..."
docker-compose -f docker-compose.db-only.yml up -d

# انتظار برای آماده شدن دیتابیس
echo "⏳ انتظار برای آماده شدن دیتابیس..."
sleep 10

# بررسی وضعیت دیتابیس
echo "🔍 بررسی وضعیت دیتابیس..."
docker-compose -f docker-compose.db-only.yml ps

# نصب dependencies اگر نیاز باشد
if [ ! -d "node_modules" ]; then
    echo "📦 نصب dependencies..."
    npm install
fi

echo "✅ محیط آماده است!"
echo ""
echo "🌐 لینک‌های مفید:"
echo "   - phpMyAdmin: http://localhost:8080"
echo "   - MySQL Port: 3307"
echo ""
echo "🚀 برای اجرای Next.js دستور زیر را اجرا کنید:"
echo "   npm run dev"
echo ""
echo "📊 اطلاعات دیتابیس:"
echo "   - Host: localhost"
echo "   - Port: 3307"
echo "   - Database: crm_system"
echo "   - Username: root"
echo "   - Password: 1234"