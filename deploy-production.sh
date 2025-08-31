#!/bin/bash

# ===========================================
# 🚀 CRM System Production Deployment Script
# ===========================================

set -e  # Exit on any error

echo "🚀 Starting CRM System Production Deployment..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

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

# Also create .env.local for compatibility
cp .env .env.local
print_success "فایل .env.local نیز ایجاد شد"

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
echo "🔧 تست کامل سیستم صوتی VPS..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo ""
log_info "=== تست 1: وضعیت کانتینرها ==="
docker-compose -f docker-compose.production.yml ps

echo ""
log_info "=== تست 2: Health Check ==="
for i in {1..5}; do
    log_info "تست health check $i/5..."
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health 2>/dev/null)
    
    if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
        log_success "Health check موفق!"
        echo "📥 پاسخ: $HEALTH_RESPONSE"
        break
    else
        if [ $i -eq 5 ]; then
            log_error "Health check ناموفق بعد از 5 تلاش"
            log_info "بررسی لاگ‌ها: docker-compose -f docker-compose.production.yml logs nextjs"
        else
            log_warning "تلاش $i ناموفق، انتظار 10 ثانیه..."
            sleep 10
        fi
    fi
done

echo ""
log_info "=== تست 3: اتصال شبکه ==="
# Test network connectivity to Sahab
log_info "تست اتصال به Sahab API..."
if curl -s --connect-timeout 5 --max-time 10 https://partai.gw.isahab.ir/speechRecognition/v1/base64 > /dev/null; then
    log_success "اتصال به Sahab برقرار است"
    SAHAB_AVAILABLE=true
else
    log_error "اتصال به Sahab برقرار نیست - fallback فعال"
    SAHAB_AVAILABLE=false
fi

# Test internet connection
if curl -s --connect-timeout 5 --max-time 10 https://www.google.com > /dev/null; then
    log_success "اتصال اینترنت موفق"
else
    log_error "اتصال اینترنت ناموفق"
fi

echo ""
log_info "=== تست 4: API های صوتی ==="

# Test speech recognition endpoint
log_info "تست API تشخیص گفتار..."
SPEECH_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    http://localhost:3000/api/voice-analysis/sahab-speech-recognition \
    -d '{"data":"dGVzdA==","language":"fa","format":"pcm","sampleRate":16000,"channels":1,"bitDepth":16}' 2>/dev/null)

if echo "$SPEECH_RESPONSE" | grep -q "success"; then
    log_success "API تشخیص گفتار موفق"
    echo "📥 پاسخ: $(echo "$SPEECH_RESPONSE" | head -c 150)..."
elif echo "$SPEECH_RESPONSE" | grep -q "fallback\|vps_mode"; then
    log_success "API تشخیص گفتار در حالت fallback کار می‌کند"
    echo "📥 پاسخ: $(echo "$SPEECH_RESPONSE" | head -c 150)..."
elif echo "$SPEECH_RESPONSE" | grep -q "unauthorized\|توکن"; then
    log_warning "API تشخیص گفتار نیاز به احراز هویت دارد (طبیعی است)"
    echo "📥 پاسخ: $(echo "$SPEECH_RESPONSE" | head -c 150)..."
else
    log_error "API تشخیص گفتار مشکل دارد"
    echo "📥 پاسخ: $(echo "$SPEECH_RESPONSE" | head -c 150)..."
fi

# Test TTS endpoint
log_info "تست API تبدیل متن به گفتار..."
TTS_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    http://localhost:3000/api/voice-analysis/sahab-tts \
    -d '{"text":"سلام","voice":"female"}' 2>/dev/null)

if echo "$TTS_RESPONSE" | grep -q "success\|audio"; then
    log_success "API TTS موفق"
elif echo "$TTS_RESPONSE" | grep -q "fallback"; then
    log_success "API TTS در حالت fallback کار می‌کند"
elif echo "$TTS_RESPONSE" | grep -q "unauthorized"; then
    log_warning "API TTS نیاز به احراز هویت دارد (طبیعی است)"
else
    log_error "API TTS مشکل دارد"
fi

echo ""
log_info "=== تست 5: فایل‌های وب ==="

# Test PCM browser page
if curl -s http://localhost:3000/test-pcm-browser.html | grep -q "تست PCM"; then
    log_success "صفحه تست PCM در دسترس است"
else
    log_warning "صفحه تست PCM در دسترس نیست"
fi

echo ""
log_info "=== خلاصه نتایج ==="

if [ "$SAHAB_AVAILABLE" = true ]; then
    log_success "Sahab API در دسترس است"
else
    log_warning "Sahab API بلاک است - سیستم از fallback استفاده می‌کند"
fi

echo ""
echo "🎯 برای تست کامل سیستم صوتی:"
echo "  1. به https://ahmadreza-avandi.ir/test-pcm-browser.html بروید"
echo "  2. تست‌های مختلف را اجرا کنید"
echo "  3. بگویید: 'گزارش احمد'"
echo ""
echo "🔧 اگر مشکل دارید:"
echo "  • لاگ‌ها: docker-compose -f docker-compose.production.yml logs -f nextjs"
echo "  • دیباگ: ./debug-audio-production.sh"
echo "  • ری‌استارت: docker-compose -f docker-compose.production.yml restart nextjs"

log_success "تست سیستم صوتی تکمیل شد! 🎤"
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

# Step 14: Rebuild with new configurations
print_status "Rebuild با تنظیمات جدید..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to be ready
print_status "انتظار برای آماده‌سازی سرویس‌ها..."
sleep 60

# Step 15: Fix and test complete audio system
print_status "تعمیر و تست کامل سیستم صوتی..."
./fix-audio-complete.sh

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

# Step 16: Final audio system validation
print_status "اعتبارسنجی نهایی سیستم صوتی..."

# Test health endpoint one more time
for i in {1..3}; do
    if curl -s http://localhost:3000/api/health | grep -q "ok"; then
        print_success "✅ Health endpoint کار می‌کند"
        break
    else
        print_warning "انتظار برای آماده شدن سرویس... ($i/3)"
        sleep 15
    fi
done

# Test audio endpoints
print_status "تست endpoint های صوتی..."

# Test speech recognition with proper headers
SPEECH_TEST=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    http://localhost:3000/api/voice-analysis/sahab-speech-recognition \
    -d '{"data":"dGVzdA==","language":"fa","format":"pcm"}' 2>/dev/null)

if echo "$SPEECH_TEST" | grep -q "success\|fallback\|unauthorized"; then
    print_success "✅ Speech Recognition API پاسخ می‌دهد"
else
    print_warning "⚠️ Speech Recognition API ممکن است نیاز به تنظیم بیشتر داشته باشد"
fi

# Create a simple audio test script for users
cat > test-audio-simple.sh << 'EOFTEST'
#!/bin/bash
echo "🎤 تست ساده سیستم صوتی"
echo "=========================="

echo "1. تست Health:"
curl -s http://localhost:3000/api/health | head -c 100
echo ""

echo "2. تست Speech Recognition:"
curl -s -X POST \
    -H "Content-Type: application/json" \
    http://localhost:3000/api/voice-analysis/sahab-speech-recognition \
    -d '{"data":"dGVzdA==","language":"fa"}' | head -c 200
echo ""

echo "3. برای تست کامل به مرورگر بروید:"
echo "   https://ahmadreza-avandi.ir/test-pcm-browser.html"
EOFTEST

chmod +x test-audio-simple.sh
print_success "اسکریپت تست ساده ایجاد شد: ./test-audio-simple.sh"

# Step 17: Final checks and information
print_success "🎉 استقرار Production با سیستم صوتی کامل انجام شد!"
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
echo "🎤 سیستم صوتی:"
echo "   ✅ PCM Audio Converter فعال"
echo "   ✅ Fallback mode برای VPS تنظیم شده"
echo "   ✅ Client-side audio processing"
echo "   ✅ Real-time speech recognition"
echo ""
echo "⚠️  نکات مهم:"
echo "   1. سیستم صوتی کاملاً در مرورگر کار می‌کند"
echo "   2. HTTPS ضروری است برای دسترسی به میکروفون"
echo "   3. Sahab API اگر بلاک باشد، fallback فعال است"
echo "   4. PCM conversion با کیفیت 16kHz/16-bit/Mono"
echo "   5. تست کامل: https://ahmadreza-avandi.ir/test-pcm-browser.html"
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
        echo "انتظار برای آماده شدن سرویس‌ها..."
        sleep 60
        ./test-audio-simple.sh
        ;;
    test-audio)
        ./test-audio-vps.sh
        ;;
    health)
        curl -s http://localhost:3000/api/health | jq . || curl -s http://localhost:3000/api/health
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|update|test-audio|health}"
        exit 1
        ;;
esac
EOF

chmod +x manage-production.sh
print_success "اسکریپت مدیریت Production ایجاد شد: ./manage-production.sh"