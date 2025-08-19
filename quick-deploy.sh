#!/bin/bash

# 🚀 Quick Deploy Script - برای deployment سریع
set -e

echo "🚀 Quick CRM Deployment Starting..."

# بررسی فایل‌های ضروری
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your settings before running again!"
    exit 1
fi

# بررسی حافظه
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "💾 System Memory: ${TOTAL_MEM}MB"

# انتخاب compose file
if [ "$TOTAL_MEM" -lt 2048 ]; then
    COMPOSE_FILE="docker-compose.memory-optimized.yml"
    echo "🔧 Using memory-optimized configuration"
else
    COMPOSE_FILE="docker-compose.yml"
    echo "🔧 Using standard configuration"
fi

# متوقف کردن کانتینرهای قدیمی
echo "🛑 Stopping old containers..."
docker-compose -f $COMPOSE_FILE down 2>/dev/null || true

# پاک کردن cache
echo "🧹 Cleaning up..."
docker system prune -f

# Build و اجرا
echo "🔨 Building and starting services..."
docker-compose -f $COMPOSE_FILE up --build -d

# انتظار برای آماده شدن
echo "⏳ Waiting for services..."
sleep 20

# بررسی وضعیت
echo "📊 Service Status:"
docker-compose -f $COMPOSE_FILE ps

echo "✅ Deployment Complete!"
echo "🌐 Access your CRM at: http://$(hostname -I | awk '{print $1}')"
echo "📋 View logs: docker-compose -f $COMPOSE_FILE logs -f"