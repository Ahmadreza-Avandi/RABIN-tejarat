#!/bin/bash

# 🔒 SECURE CRM System Deployment - Memory Optimized
# این اسکریپت برای سرورهای با RAM کم بهینه شده است

set -e

echo "🔒 Starting MEMORY-OPTIMIZED CRM System Deployment..."

# بررسی حافظه سیستم
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "[INFO] Total system memory: ${TOTAL_MEM}MB"

if [ "$TOTAL_MEM" -lt 2048 ]; then
    echo "[WARNING] Low memory detected (${TOTAL_MEM}MB). Using memory-optimized configuration..."
    COMPOSE_FILE="docker-compose.memory-optimized.yml"
    MEMORY_OPTIMIZED=true
else
    COMPOSE_FILE="docker-compose.yml"
    MEMORY_OPTIMIZED=false
fi

# تنظیم swap اگر وجود ندارد
if [ "$MEMORY_OPTIMIZED" = true ]; then
    echo "[INFO] Checking swap space..."
    SWAP_SIZE=$(free -m | awk 'NR==3{printf "%.0f", $2}')
    if [ "$SWAP_SIZE" -lt 1024 ]; then
        echo "[INFO] Creating temporary swap file..."
        fallocate -l 1G /tmp/swapfile 2>/dev/null || dd if=/dev/zero of=/tmp/swapfile bs=1024 count=1048576
        chmod 600 /tmp/swapfile
        mkswap /tmp/swapfile
        swapon /tmp/swapfile
        echo "[INFO] Temporary swap created"
    fi
fi

# متوقف کردن کانتینرهای موجود
echo "[INFO] Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true

# پاک کردن cache های docker
echo "[INFO] Cleaning Docker cache..."
docker system prune -f

# Build با تنظیمات memory-optimized
echo "[INFO] Building with optimizations using $COMPOSE_FILE..."

if [ "$MEMORY_OPTIMIZED" = true ]; then
    # Build تک‌تک سرویس‌ها برای کاهش فشار حافظه
    echo "[INFO] Building services sequentially..."
    
    # Build NextJS با محدودیت حافظه
    DOCKER_BUILDKIT=1 docker-compose -f $COMPOSE_FILE build --no-cache nextjs
    
    # Build سایر سرویس‌ها
    docker-compose -f $COMPOSE_FILE build nginx
else
    # Build عادی
    docker-compose -f $COMPOSE_FILE build --no-cache
fi

# شروع سرویس‌ها
echo "[INFO] Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# بررسی وضعیت
echo "[INFO] Checking service status..."
sleep 15
docker-compose -f $COMPOSE_FILE ps

# بررسی health
echo "[INFO] Waiting for services to be ready..."
for i in {1..30}; do
    if docker-compose -f $COMPOSE_FILE exec -T nextjs curl -f http://localhost:3000/api/health 2>/dev/null; then
        echo "[INFO] NextJS service is ready!"
        break
    fi
    echo "[INFO] Waiting for NextJS... ($i/30)"
    sleep 2
done

# نمایش لاگ‌ها
echo "[INFO] Showing recent logs..."
docker-compose -f $COMPOSE_FILE logs --tail=20

# پاک کردن swap موقت
if [ "$MEMORY_OPTIMIZED" = true ] && [ -f /tmp/swapfile ]; then
    echo "[INFO] Cleaning up temporary swap..."
    swapoff /tmp/swapfile 2>/dev/null || true
    rm -f /tmp/swapfile
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Application is available at: http://$(curl -s ifconfig.me || echo 'your-server-ip')"
echo "📊 Check status: docker-compose -f $COMPOSE_FILE ps"
echo "📋 View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "🔄 Restart: docker-compose -f $COMPOSE_FILE restart"