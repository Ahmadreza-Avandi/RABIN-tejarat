#!/bin/bash

# 🔍 System Check Script - بررسی سیستم قبل از deployment

echo "🔍 Checking System Requirements..."

# بررسی Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "📥 Install Docker: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
else
    echo "✅ Docker: $(docker --version)"
fi

# بررسی Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed!"
    echo "📥 Install Docker Compose: sudo apt install docker-compose"
    exit 1
else
    echo "✅ Docker Compose: $(docker-compose --version)"
fi

# بررسی حافظه
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
echo "💾 Total Memory: ${TOTAL_MEM}MB"
echo "💾 Available Memory: ${AVAILABLE_MEM}MB"

if [ "$TOTAL_MEM" -lt 1024 ]; then
    echo "⚠️  Warning: Low memory detected. Consider upgrading your server."
elif [ "$TOTAL_MEM" -lt 2048 ]; then
    echo "⚠️  Memory is limited. Will use optimized configuration."
else
    echo "✅ Memory is sufficient for standard deployment."
fi

# بررسی فضای دیسک
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_AVAILABLE=$(df -h / | awk 'NR==2 {print $4}')
echo "💿 Disk Usage: ${DISK_USAGE}%"
echo "💿 Available Space: ${DISK_AVAILABLE}"

if [ "$DISK_USAGE" -gt 90 ]; then
    echo "❌ Disk space is critically low!"
    exit 1
elif [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠️  Warning: Disk space is running low."
fi

# بررسی پورت‌ها
echo "🔌 Checking ports..."
if netstat -tulpn | grep -q ":80 "; then
    echo "⚠️  Port 80 is already in use"
    netstat -tulpn | grep ":80 "
fi

if netstat -tulpn | grep -q ":3306 "; then
    echo "⚠️  Port 3306 is already in use"
    netstat -tulpn | grep ":3306 "
fi

# بررسی فایل .env
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file before deployment!"
else
    echo "✅ .env file exists"
fi

# بررسی دسترسی Docker
if ! docker ps &> /dev/null; then
    echo "❌ Cannot access Docker. Try: sudo usermod -aG docker $USER"
    echo "   Then logout and login again."
    exit 1
else
    echo "✅ Docker access OK"
fi

echo ""
echo "🎯 System Check Complete!"
echo "📋 Recommendations:"

if [ "$TOTAL_MEM" -lt 2048 ]; then
    echo "   • Use: ./deploy-memory-optimized.sh"
else
    echo "   • Use: ./quick-deploy.sh"
fi

echo "   • Monitor with: docker stats"
echo "   • View logs with: docker-compose logs -f"