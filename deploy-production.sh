#!/bin/bash

# ===========================================
# 🚀 CRM System Production Deployment Script
# ===========================================

set -e  # Exit on any error

echo "🚀 Starting CRM System Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Make script executable
chmod +x "$0"

print_status "🚀 شروع فرآیند استقرار Production CRM..."

# Step 1: Check system requirements
print_status "بررسی پیش‌نیازهای سیستم..."

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker نصب نیست. لطفاً ابتدا Docker را نصب کنید."
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    print_error "Docker در حال اجرا نیست. لطفاً Docker را راه‌اندازی کنید."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose نصب نیست. لطفاً Docker Compose را نصب کنید."
    exit 1
fi

print_success "تمام پیش‌نیازها موجود است."

# Step 2: Setup production environment
print_status "تنظیم محیط Production..."

# Copy production environment file
if [ -f ".env.server" ]; then
    cp .env.server .env
    print_success "فایل محیط Production از .env.server کپی شد"
elif [ -f ".env.production" ]; then
    cp .env.production .env
    print_success "فایل محیط Production از .env.production کپی شد"
else
    print_error "فایل .env.server یا .env.production یافت نشد!"
    print_warning "لطفاً یکی از این فایل‌ها را ایجاد کنید."
    exit 1
fi

# Step 3: Create necessary directories
print_status "ایجاد دایرکتری‌های ضروری..."
mkdir -p database
mkdir -p nginx/ssl
mkdir -p backups
mkdir -p logs
mkdir -p /var/log/crm

# Step 4: Fix audio issues for VPS deployment
print_status "تنظیم سیستم صوتی برای VPS..."

# Create a VPS-optimized docker-compose file
cp docker-compose.yml docker-compose.yml.backup

# Create audio debug and fallback scripts for VPS
print_status "ایجاد اسکریپت‌های دیباگ صوتی برای VPS..."

# Make debug scripts executable
chmod +x debug-*.sh 2>/dev/null || true
chmod +x test-*.sh 2>/dev/null || true
chmod +x setup-*.sh 2>/dev/null || true

# Create VPS-specific audio test script
cat > test-audio-vps.sh << 'EOFVPS'
#!/bin/bash
echo "🔧 تست سیستم صوتی VPS..."

# Test network connectivity to Sahab
echo "📡 تست اتصال به Sahab API..."
if curl -s --connect-timeout 5 --max-time 10 https://partai.gw.isahab.ir/speechRecognition/v1/base64 > /dev/null; then
    echo "✅ اتصال به Sahab برقرار است"
else
    echo "❌ اتصال به Sahab برقرار نیست - استفاده از fallback"
fi

# Test local API
echo "🔍 تست API محلی..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ سرور محلی در حال اجرا است"
    
    # Test speech recognition endpoint
    echo "🎤 تست endpoint تشخیص گفتار..."
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        http://localhost:3000/api/voice-analysis/sahab-speech-recognition \
        -d '{"data":"dGVzdA==","language":"fa","format":"pcm"}' 2>/dev/null)
    
    if echo "$response" | grep -q "success"; then
        echo "✅ API تشخیص گفتار پاسخ می‌دهد"
    else
        echo "⚠️ API تشخیص گفتار نیاز به احراز هویت دارد"
    fi
else
    echo "❌ سرور محلی در حال اجرا نیست"
fi

echo "🎯 برای تست کامل: docker-compose -f docker-compose.production.yml logs nextjs"
EOFVPS

chmod +x test-audio-vps.sh

# Create VPS-specific docker-compose configuration
cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  # Next.js Application - VPS Optimized
  nextjs:
    build: .
    container_name: crm-nextjs
    env_file:
      - .env
    ports:
      - "3000:3000"
    # Remove audio devices for VPS (they don't exist)
    # devices:
    #   - "/dev/snd:/dev/snd"
    volumes:
      # Remove X11 and pulse audio for VPS
      # - "/tmp/.X11-unix:/tmp/.X11-unix"
      # - "$HOME/.config/pulse:/home/nextjs/.config/pulse"
      - ./logs:/app/logs
    # Remove audio group for VPS
    # group_add:
    #   - audio
    environment:
      # All environment variables are loaded from .env file
      - NODE_ENV=${NODE_ENV:-production}
      - DATABASE_HOST=${DATABASE_HOST:-mysql}
      - DATABASE_USER=${DATABASE_USER:-crm_app_user}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
      - DATABASE_NAME=${DATABASE_NAME:-crm_system}
      - DATABASE_URL=${DATABASE_URL}
      # Add VPS-specific audio settings
      - AUDIO_ENABLED=false
      - VPS_MODE=true
      - SAHAB_API_KEY=${SAHAB_API_KEY}
      - FALLBACK_MODE=true
      - AUDIO_FALLBACK_TEXT=گزارش احمد
      # Network settings for VPS
      - NETWORK_TIMEOUT=30000
      - API_RETRY_COUNT=3
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    depends_on:
      mysql:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
    networks:
      - crm-network

  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: crm-mysql
    env_file:
      - .env
    environment:
      MYSQL_ROOT_PASSWORD: "${DATABASE_PASSWORD}_ROOT"
      MYSQL_DATABASE: "${DATABASE_NAME:-crm_system}"
      MYSQL_USER: "${DATABASE_USER:-crm_app_user}"
      MYSQL_PASSWORD: "${DATABASE_PASSWORD}"
    expose:
      - "3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database:/docker-entrypoint-initdb.d
      - ./backups:/var/backups
    restart: unless-stopped
    command: --default-authentication-plugin=mysql_native_password --innodb-buffer-pool-size=256M --max-connections=100
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DATABASE_PASSWORD}_ROOT"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - crm-network

  # phpMyAdmin - Hidden and Secured
  phpmyadmin:
    image: phpmyadmin/phpmyadmin:5.2.1
    container_name: crm-phpmyadmin
    env_file:
      - .env
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_USER: "${DATABASE_USER:-crm_app_user}"
      PMA_PASSWORD: "${DATABASE_PASSWORD}"
      MYSQL_ROOT_PASSWORD: "${DATABASE_PASSWORD}_ROOT"
      PMA_ABSOLUTE_URI: "${NEXTAUTH_URL}/secure-db-admin-panel-x7k9m2/"
      PMA_CONTROLUSER: "${DATABASE_USER:-crm_app_user}"
      PMA_CONTROLPASS: "${DATABASE_PASSWORD}"
      HIDE_PHP_VERSION: 1
    restart: unless-stopped
    expose:
      - "80"
    depends_on:
      mysql:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M
    networks:
      - crm-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: crm-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./logs:/var/log/nginx
    restart: unless-stopped
    depends_on:
      - nextjs
      - phpmyadmin
    deploy:
      resources:
        limits:
          memory: 128M
        reservations:
          memory: 64M
    networks:
      - crm-network

  # Certbot for SSL certificates
  certbot:
    image: certbot/certbot
    container_name: crm-certbot
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt
      - /var/www/certbot:/var/www/certbot
    command: certonly --webroot --webroot-path=/var/www/certbot --email admin@ahmadreza-avandi.ir --agree-tos --no-eff-email -d ahmadreza-avandi.ir -d www.ahmadreza-avandi.ir
    networks:
      - crm-network

volumes:
  mysql_data:
    driver: local

networks:
  crm-network:
    driver: bridge
EOF

print_success "فایل docker-compose برای VPS تنظیم شد"

# Step 5: Stop existing services
print_status "توقف سرویس‌های موجود..."
docker-compose -f docker-compose.production.yml down --remove-orphans || true

# Check what's using port 80 and 443
print_status "بررسی پورت‌های 80 و 443..."
if sudo lsof -i :80 > /dev/null 2>&1; then
    print_warning "پورت 80 در حال استفاده است"
    read -p "آیا می‌خواهید سرویس‌های استفاده‌کننده از پورت 80 را متوقف کنید؟ (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo systemctl stop nginx || print_warning "توقف nginx ناموفق"
        sudo systemctl stop apache2 || print_warning "توقف apache2 ناموفق"
        sudo pkill -f nginx || print_warning "kill nginx processes ناموفق"
    fi
fi

# Step 6: Clean up old Docker resources
print_status "پاک‌سازی منابع قدیمی Docker..."
docker system prune -f
docker volume prune -f

# Step 7: Build and start services
print_status "Build و راه‌اندازی سرویس‌ها..."
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Step 8: Wait for services to be ready
print_status "⏳ انتظار برای آماده‌سازی سرویس‌ها..."
sleep 30

# Step 9: Setup database
print_status "تنظیم دیتابیس..."

# Wait for MySQL to be fully ready
print_status "انتظار برای آماده‌سازی MySQL..."
for i in {1..30}; do
    if docker-compose -f docker-compose.production.yml exec -T mysql mysqladmin ping -h localhost -u root -p1234_ROOT --silent 2>/dev/null; then
        print_success "MySQL آماده است"
        break
    fi
    echo -n "."
    sleep 2
done

# Create database and user if needed
print_status "تنظیم کاربر و دیتابیس..."
docker-compose -f docker-compose.production.yml exec -T mysql mysql -uroot -p1234_ROOT << 'EOF' || print_warning "تنظیم دیتابیس ممکن است قبلاً انجام شده باشد"
CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'crm_app_user'@'%' IDENTIFIED BY '1234';
GRANT ALL PRIVILEGES ON crm_system.* TO 'crm_app_user'@'%';
FLUSH PRIVILEGES;
EOF

# Step 10: Check service health
print_status "بررسی سلامت سرویس‌ها..."

# Check MySQL
if docker-compose -f docker-compose.production.yml exec -T mysql mysqladmin ping -h localhost -u root -p1234_ROOT --silent; then
    print_success "✅ MySQL در حال اجرا است"
else
    print_error "❌ MySQL پاسخ نمی‌دهد"
fi

# Check Next.js app
sleep 10
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "✅ Next.js application در حال اجرا است"
else
    print_warning "⚠️ Next.js application ممکن است هنوز آماده نباشد"
fi

# Check Nginx
if curl -f http://localhost > /dev/null 2>&1; then
    print_success "✅ Nginx در حال اجرا است"
else
    print_warning "⚠️ Nginx ممکن است هنوز آماده نباشد"
fi

# Step 11: Setup SSL certificates
print_status "تنظیم گواهی‌های SSL..."
if [ ! -f /etc/letsencrypt/live/ahmadreza-avandi.ir/fullchain.pem ]; then
    print_status "دریافت گواهی SSL از Let's Encrypt..."
    docker-compose -f docker-compose.production.yml run --rm certbot || print_warning "دریافت SSL ناموفق - ممکن است دامنه به IP سرور point نکرده باشد"
    
    # Restart nginx to load SSL
    docker-compose -f docker-compose.production.yml restart nginx
else
    print_success "گواهی‌های SSL موجود است"
fi

# Step 12: Show running services
print_status "نمایش سرویس‌های در حال اجرا..."
docker-compose -f docker-compose.production.yml ps

# Step 13: Show logs for debugging
print_status "نمایش لاگ‌های اخیر..."
docker-compose -f docker-compose.production.yml logs --tail=20

# Step 14: Test audio system on VPS
print_status "تست سیستم صوتی VPS..."
./test-audio-vps.sh

# Step 15: Create audio debug script for production
cat > debug-audio-production.sh << 'EOFDEBUG'
#!/bin/bash
echo "� دیبارگ سیستم صوتی Production..."

echo "📊 وضعیت کانتینرها:"
docker-compose -f docker-compose.production.yml ps

echo ""
echo "🔍 بررسی متغیرهای محیطی:"
docker-compose -f docker-compose.production.yml exec nextjs env | grep -E "(SAHAB|AUDIO|VPS|FALLBACK)"

echo ""
echo "📡 تست اتصال شبکه از داخل کانتینر:"
docker-compose -f docker-compose.production.yml exec nextjs curl -s --connect-timeout 5 --max-time 10 https://partai.gw.isahab.ir/speechRecognition/v1/base64 || echo "❌ اتصال از داخل کانتینر ناموفق"

echo ""
echo "🎤 تست API تشخیص گفتار:"
docker-compose -f docker-compose.production.yml exec nextjs curl -s -X POST \
    -H "Content-Type: application/json" \
    http://localhost:3000/api/voice-analysis/sahab-speech-recognition \
    -d '{"data":"dGVzdA==","language":"fa","format":"pcm"}' | head -c 200

echo ""
echo "📋 لاگ‌های اخیر Next.js:"
docker-compose -f docker-compose.production.yml logs --tail=50 nextjs | grep -E "(audio|speech|sahab|pcm|error)" || echo "هیچ لاگ صوتی یافت نشد"

echo ""
echo "🔧 دستورات مفید:"
echo "  • مشاهده لاگ کامل: docker-compose -f docker-compose.production.yml logs -f nextjs"
echo "  • ورود به کانتینر: docker-compose -f docker-compose.production.yml exec nextjs bash"
echo "  • ری‌استارت سرویس: docker-compose -f docker-compose.production.yml restart nextjs"
EOFDEBUG

chmod +x debug-audio-production.sh

# Step 16: Final checks and information
print_success "🎉 استقرار Production با موفقیت انجام شد!"
echo
echo "📋 آدرس‌های سرویس:"
echo "   🌐 سایت اصلی: https://ahmadreza-avandi.ir"
echo "   🗄️  phpMyAdmin: https://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/"
echo "   🧪 تست PCM: https://ahmadreza-avandi.ir/test-pcm-browser.html"
echo
echo "📊 دستورات مفید:"
echo "   📋 مشاهده لاگ‌ها: docker-compose -f docker-compose.production.yml logs -f"
echo "   📈 وضعیت سرویس‌ها: docker-compose -f docker-compose.production.yml ps"
echo "   🔄 ری‌استارت: docker-compose -f docker-compose.production.yml restart"
echo "   🛑 توقف: docker-compose -f docker-compose.production.yml down"
echo "   🎤 دیباگ صوتی: ./debug-audio-production.sh"
echo "   🔧 تست VPS: ./test-audio-vps.sh"
echo
echo "⚠️  نکات مهم:"
echo "   1. سیستم صوتی برای VPS بهینه‌سازی شده (fallback به manual input)"
echo "   2. Sahab API ممکن است از VPS بلاک باشد - fallback فعال است"
echo "   3. فایل .env.server را با اطلاعات واقعی تنظیم کنید"
echo "   4. برای تست سیستم صوتی از HTTPS استفاده کنید"
echo "   5. PCM conversion در مرورگر کار می‌کند"
echo
print_warning "🔐 فراموش نکنید: رمزهای عبور را تغییر دهید و سرور را امن کنید!"

# Step 15: Create management script
cat > manage-production.sh << 'EOF'
#!/bin/bash
# Production Management Script

case "$1" in
    start)
        docker-compose -f docker-compose.production.yml up -d
        ;;
    stop)
        docker-compose -f docker-compose.production.yml down
        ;;
    restart)
        docker-compose -f docker-compose.production.yml restart
        ;;
    logs)
        docker-compose -f docker-compose.production.yml logs -f
        ;;
    status)
        docker-compose -f docker-compose.production.yml ps
        ;;
    update)
        git pull
        docker-compose -f docker-compose.production.yml build --no-cache
        docker-compose -f docker-compose.production.yml up -d
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|update}"
        exit 1
        ;;
esac
EOF

chmod +x manage-production.sh
print_success "اسکریپت مدیریت Production ایجاد شد: ./manage-production.sh"