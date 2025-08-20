#!/bin/bash

# 🔧 Fix and Deploy Script
set -e

echo "🔧 Fixing and deploying CRM system..."

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
    echo "⚠️  Please edit .env file with your database passwords!"
    echo "⚠️  Set NEXTAUTH_URL=http://ahmadreza-avandi.ir"
    read -p "Press Enter after editing .env file..."
fi

# متوقف کردن همه سرویس‌ها
echo "🛑 Stopping all services..."
docker-compose -f $COMPOSE_FILE down 2>/dev/null || true
docker-compose down 2>/dev/null || true

# پاک کردن containers و networks قدیمی
echo "🧹 Cleaning up..."
docker container prune -f
docker network prune -f

# شروع سرویس‌ها
echo "🚀 Starting services..."
docker-compose -f $COMPOSE_FILE up -d --build

# انتظار برای آماده شدن
echo "⏳ Waiting for services to start..."
sleep 30

# بررسی وضعیت
echo "📊 Service Status:"
docker-compose -f $COMPOSE_FILE ps

# تست سرویس‌ها
echo "🧪 Testing services..."

# تست nginx
if docker-compose -f $COMPOSE_FILE ps | grep -q "crm_nginx.*Up"; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    docker-compose -f $COMPOSE_FILE logs nginx
fi

# تست NextJS
if docker-compose -f $COMPOSE_FILE ps | grep -q "crm_nextjs.*Up"; then
    echo "✅ NextJS is running"
else
    echo "❌ NextJS is not running"
    docker-compose -f $COMPOSE_FILE logs nextjs
fi

# تست MySQL
if docker-compose -f $COMPOSE_FILE ps | grep -q "crm_mysql.*Up"; then
    echo "✅ MySQL is running"
else
    echo "❌ MySQL is not running"
    docker-compose -f $COMPOSE_FILE logs mysql
fi

# تست دامنه
echo "🌐 Testing domain access..."
sleep 5

if curl -s -o /dev/null -w "%{http_code}" http://ahmadreza-avandi.ir | grep -q "200\|301\|302"; then
    echo "✅ Domain is accessible"
else
    echo "⚠️  Domain test failed, but services are running"
    echo "🔍 Check DNS and firewall settings"
fi

echo ""
echo "🎉 Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 CRM System: http://ahmadreza-avandi.ir"
echo "🔐 phpMyAdmin: http://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Useful Commands:"
echo "   • View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   • Restart: docker-compose -f $COMPOSE_FILE restart"
echo "   • Stop: docker-compose -f $COMPOSE_FILE down"
echo "   • Status: docker-compose -f $COMPOSE_FILE ps"