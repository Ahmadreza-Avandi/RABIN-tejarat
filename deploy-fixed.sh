#!/bin/bash

# 🚀 Fixed Complete CRM Deployment Script
set -e

DOMAIN="ahmadreza-avandi.ir"
EMAIL="admin@ahmadreza-avandi.ir"

echo "🚀 شروع دیپلوی کامل CRM..."
echo "🌐 دامنه: $DOMAIN"

# بررسی حافظه سیستم
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "💾 حافظه سیستم: ${TOTAL_MEM}MB"

if [ "$TOTAL_MEM" -lt 2048 ]; then
    echo "🔧 استفاده از تنظیمات بهینه‌شده برای حافظه کم"
    COMPOSE_FILE="docker-compose.memory-optimized.yml"
    NGINX_CONFIG="nginx/low-memory.conf"
else
    echo "🔧 استفاده از تنظیمات استاندارد"
    COMPOSE_FILE="docker-compose.yml"
    NGINX_CONFIG="nginx/default.conf"
fi

# بررسی فایل .env
if [ ! -f ".env" ]; then
    echo "⚠️  فایل .env یافت نشد. کپی از template..."
    cp .env.example .env
    echo "📝 لطفاً فایل .env را ویرایش کنید!"
    echo "⚠️  حتماً NEXTAUTH_URL=https://$DOMAIN را تنظیم کنید"
    read -p "بعد از ویرایش فایل .env اینتر بزنید..."
fi

# متوقف کردن کانتینرهای قدیمی
echo "🛑 متوقف کردن کانتینرهای قدیمی..."
docker-compose -f $COMPOSE_FILE down 2>/dev/null || true
docker-compose down 2>/dev/null || true

# پاک کردن cache
echo "🧹 پاکسازی Docker cache..."
docker system prune -f

# ایجاد دایرکتری‌های مورد نیاز
echo "📁 ایجاد دایرکتری‌های مورد نیاز..."
mkdir -p /etc/letsencrypt
mkdir -p /var/www/certbot
mkdir -p nginx/ssl

# کپی nginx config مناسب
echo "📝 تنظیم nginx config..."
if [ -f "$NGINX_CONFIG" ]; then
    cp $NGINX_CONFIG nginx/active.conf
else
    echo "⚠️  فایل nginx config یافت نشد، استفاده از default"
    cp nginx/default.conf nginx/active.conf
fi

# تنظیم docker-compose موقت برای SSL
echo "🔧 تنظیم nginx موقت برای SSL..."
cat > docker-compose.temp.yml << EOF
version: '3.8'

services:
  nginx-temp:
    image: nginx:alpine
    container_name: nginx-temp
    ports:
      - "80:80"
    volumes:
      - ./nginx/temp.conf:/etc/nginx/conf.d/default.conf:ro
      - /var/www/certbot:/var/www/certbot
    networks:
      - crm_network

networks:
  crm_network:
    driver: bridge
EOF

# ایجاد nginx config موقت
cat > nginx/temp.conf << 'EOF'
server {
    listen 80;
    server_name ahmadreza-avandi.ir www.ahmadreza-avandi.ir;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
EOF

# راه‌اندازی nginx موقت
echo "🌐 راه‌اندازی nginx موقت..."
docker-compose -f docker-compose.temp.yml up -d

# انتظار برای آماده شدن nginx
sleep 10

# دریافت گواهی SSL
echo "📜 دریافت گواهی SSL..."
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    docker run --rm \
        -v /etc/letsencrypt:/etc/letsencrypt \
        -v /var/www/certbot:/var/www/certbot \
        certbot/certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email $EMAIL --agree-tos --no-eff-email \
        -d $DOMAIN -d www.$DOMAIN
fi

# متوقف کردن nginx موقت
echo "🛑 متوقف کردن nginx موقت..."
docker-compose -f docker-compose.temp.yml down

# پاک کردن فایل‌های موقت
rm -f nginx/temp.conf docker-compose.temp.yml

# بررسی وجود گواهی SSL و تنظیم nginx config نهایی
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ گواهی SSL با موفقیت دریافت شد!"
    # استفاده از config با SSL
    if [ "$TOTAL_MEM" -lt 2048 ]; then
        cp nginx/low-memory.conf nginx/active.conf
    else
        cp nginx/default.conf nginx/active.conf
    fi
else
    echo "⚠️  گواهی SSL یافت نشد، ادامه بدون HTTPS..."
    # ایجاد nginx config بدون SSL
    cat > nginx/active.conf << 'EOF'
server {
    listen 80;
    server_name ahmadreza-avandi.ir www.ahmadreza-avandi.ir;

    client_max_body_size 50M;

    location / {
        proxy_pass http://nextjs:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /secure-db-admin-panel-x7k9m2/ {
        proxy_pass http://phpmyadmin/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://nextjs:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
fi

# تنظیم docker-compose برای استفاده از nginx config فعال
echo "🔧 تنظیم docker-compose..."
# کپی فایل compose و تنظیم nginx config
if [ "$COMPOSE_FILE" = "docker-compose.memory-optimized.yml" ]; then
    cp docker-compose.memory-optimized.yml docker-compose.deploy.yml
else
    cp docker-compose.yml docker-compose.deploy.yml
fi

# تنظیم nginx volume در فایل deploy
sed -i 's|./nginx/default.conf:/etc/nginx/conf.d/default.conf|./nginx/active.conf:/etc/nginx/conf.d/default.conf|g' docker-compose.deploy.yml

COMPOSE_FILE="docker-compose.deploy.yml"

# Build و اجرای سرویس‌ها
echo "🔨 Build و راه‌اندازی سرویس‌ها..."
docker-compose -f $COMPOSE_FILE up --build -d

# انتظار برای آماده شدن سرویس‌ها
echo "⏳ انتظار برای آماده شدن سرویس‌ها..."
sleep 30

# بررسی وضعیت سرویس‌ها
echo "📊 وضعیت سرویس‌ها:"
docker-compose -f $COMPOSE_FILE ps

# تست سرویس‌ها
echo "🧪 تست سرویس‌ها..."

# تست NextJS
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ NextJS در حال اجراست"
else
    echo "⚠️  NextJS ممکن است هنوز آماده نباشد"
fi

# نمایش لاگ‌های اخیر
echo "📋 لاگ‌های اخیر:"
docker-compose -f $COMPOSE_FILE logs --tail=20

# تنظیم تجدید خودکار SSL
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "⏰ تنظیم تجدید خودکار SSL..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f $(pwd)/$COMPOSE_FILE restart nginx") | crontab -
fi

echo ""
echo "🎉 دیپلوی کامل شد!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "🌐 سیستم CRM: https://$DOMAIN"
    echo "🔐 phpMyAdmin: https://$DOMAIN/secure-db-admin-panel-x7k9m2/"
else
    echo "🌐 سیستم CRM: http://$DOMAIN"
    echo "🔐 phpMyAdmin: http://$DOMAIN/secure-db-admin-panel-x7k9m2/"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 دستورات مفید:"
echo "   • مشاهده لاگ‌ها: docker-compose -f $COMPOSE_FILE logs -f"
echo "   • راه‌اندازی مجدد: docker-compose -f $COMPOSE_FILE restart"
echo "   • توقف: docker-compose -f $COMPOSE_FILE down"
echo "   • وضعیت: docker-compose -f $COMPOSE_FILE ps"
echo ""