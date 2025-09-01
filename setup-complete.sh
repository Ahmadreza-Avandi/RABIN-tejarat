#!/bin/bash

# رنگ‌ها برای خروجی
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 شروع نصب و راه‌اندازی سیستم...${NC}"

# تنظیم متغیرهای محیطی
DOMAIN="ahmadreza-avandi.ir"
echo -e "${BLUE}🌐 دامنه: $DOMAIN${NC}"

# نصب ابزارهای مورد نیاز
echo -e "${BLUE}📦 نصب ابزارهای مورد نیاز...${NC}"
apt-get update
apt-get install -y \
    curl \
    wget \
    git \
    docker.io \
    docker-compose \
    alsa-utils \
    pulseaudio \
    ffmpeg \
    sox

# تنظیم PulseAudio
echo -e "${BLUE}🔊 تنظیم PulseAudio...${NC}"
pulseaudio -D --system
pactl load-module module-null-sink sink_name=VPS_Audio
pactl set-default-sink VPS_Audio

# ایجاد دایرکتوری‌های مورد نیاز
echo -e "${BLUE}📁 ایجاد دایرکتوری‌ها...${NC}"
mkdir -p /root/RABIN-tejarat/audio-temp
mkdir -p /root/RABIN-tejarat/logs
mkdir -p /root/RABIN-tejarat/nginx/ssl
mkdir -p /root/RABIN-tejarat/data/certbot/conf
mkdir -p /root/RABIN-tejarat/data/certbot/www

# تنظیم فایل محیطی
echo -e "${BLUE}📝 ایجاد فایل‌های محیطی...${NC}"
cat > /root/RABIN-tejarat/.env << EOL
MYSQL_ROOT_PASSWORD=admin123
MYSQL_DATABASE=crm_db
MYSQL_USER=crm_user
MYSQL_PASSWORD=admin123
NEXT_PUBLIC_API_URL=https://${DOMAIN}
VPS_MODE=true
ENABLE_AUDIO=true
NEXT_PUBLIC_AUDIO_BACKEND=true
NEXT_PUBLIC_ENABLE_VPS_AUDIO=true
NEXT_PUBLIC_USE_CLIENT_AUDIO=true
EOL

# توقف سرویس‌های قبلی
echo -e "${BLUE}🛑 توقف سرویس‌های قبلی...${NC}"
cd /root/RABIN-tejarat
docker-compose down
docker system prune -af --volumes

# راه‌اندازی مجدد سرویس‌ها
echo -e "${BLUE}🚀 راه‌اندازی سرویس‌ها...${NC}"
docker-compose up -d --build

# انتظار برای آماده شدن سرویس‌ها
echo -e "${BLUE}⏳ انتظار برای آماده شدن سرویس‌ها...${NC}"
sleep 30

# تست سیستم صوتی
echo -e "${BLUE}🎤 تست سیستم صوتی...${NC}"
curl -X POST "https://${DOMAIN}/api/voice/test" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# نمایش وضعیت نهایی
echo -e "${BLUE}📊 وضعیت سرویس‌ها:${NC}"
docker-compose ps

echo -e "${GREEN}✅ نصب و راه‌اندازی کامل شد!${NC}"
echo -e "${BLUE}🌐 سیستم در آدرس زیر در دسترس است:${NC}"
echo -e "https://${DOMAIN}"
echo ""
echo -e "${BLUE}📋 دستورات مفید:${NC}"
echo "- مشاهده لاگ‌ها: docker-compose logs -f"
echo "- راه‌اندازی مجدد: docker-compose restart"
echo "- توقف سرویس‌ها: docker-compose down"
echo "- تست صدا: ./test-audio-vps.sh"
