#!/bin/bash

# 🚀 Start All Services - Simple Deployment
set -e

echo "🚀 Starting All CRM Services..."

# بررسی حافظه
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "💾 Memory: ${TOTAL_MEM}MB"

# انتخاب compose file
if [ "$TOTAL_MEM" -lt 2048 ]; then
    COMPOSE_FILE="docker-compose.memory-optimized.yml"
    echo "🔧 Using memory-optimized config"
else
    COMPOSE_FILE="docker-compose.yml"
    echo "🔧 Using standard config"
fi

# بررسی .env
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Edit .env file before continuing!"
    exit 1
fi

# متوقف کردن سرویس‌های قدیمی
echo "🛑 Stopping old services..."
docker-compose -f $COMPOSE_FILE down 2>/dev/null || true

# شروع همه سرویس‌ها
echo "🔨 Starting all services..."
docker-compose -f $COMPOSE_FILE up -d --build

# انتظار
echo "⏳ Waiting for services..."
sleep 20

# نمایش وضعیت
echo "📊 Services Status:"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "✅ All services started!"
echo "🌐 CRM: http://ahmadreza-avandi.ir"
echo "🔐 phpMyAdmin: http://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/"
echo "📋 Logs: docker-compose -f $COMPOSE_FILE logs -f"