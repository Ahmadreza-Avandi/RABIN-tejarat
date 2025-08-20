#!/bin/bash

# 🚨 Quick Fix Script
set -e

echo "🚨 Quick fixing the system..."

# بررسی حافظه
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
if [ "$TOTAL_MEM" -lt 2048 ]; then
    COMPOSE_FILE="docker-compose.memory-optimized.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

# متوقف کردن همه چیز
echo "🛑 Stopping everything..."
docker-compose -f $COMPOSE_FILE down -v 2>/dev/null || true
docker-compose down -v 2>/dev/null || true

# پاک کردن containers
echo "🧹 Cleaning up..."
docker container prune -f
docker volume prune -f

# ایجاد .env ساده
echo "📝 Creating simple .env..."
cat > .env << 'EOF'
MYSQL_ROOT_PASSWORD=1234
MYSQL_DATABASE=crm_system
MYSQL_USER=crm_user
MYSQL_PASSWORD=1234

NEXTAUTH_SECRET=your_very_long_secret_key_here_at_least_32_characters_long
NEXTAUTH_URL=http://ahmadreza-avandi.ir

DATABASE_URL=mysql://crm_user:1234@mysql:3306/crm_system

NODE_ENV=production
DATABASE_HOST=mysql
DATABASE_USER=crm_user
DATABASE_PASSWORD=1234
DATABASE_NAME=crm_system
EOF

# شروع سرویس‌ها
echo "🚀 Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# انتظار
echo "⏳ Waiting for services..."
sleep 45

# بررسی وضعیت
echo "📊 Checking status..."
docker-compose -f $COMPOSE_FILE ps

# تست سایت
echo "🌐 Testing website..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302\|307"; then
    echo "✅ Website is working!"
else
    echo "⚠️  Website might need more time"
fi

echo ""
echo "🎉 Quick Fix Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Website: http://ahmadreza-avandi.ir"
echo "🔐 phpMyAdmin: http://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/"
echo ""
echo "🗄️  Database Login:"
echo "   • Username: crm_user"
echo "   • Password: 1234"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"