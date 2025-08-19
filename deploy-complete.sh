#!/bin/bash

# 🚀 Complete CRM Deployment with SSL and phpMyAdmin
set -e

DOMAIN="ahmadreza-avandi.ir"
EMAIL="admin@ahmadreza-avandi.ir"

echo "🚀 Starting Complete CRM Deployment..."
echo "🌐 Domain: $DOMAIN"

# بررسی حافظه سیستم
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "💾 System Memory: ${TOTAL_MEM}MB"

if [ "$TOTAL_MEM" -lt 2048 ]; then
    echo "🔧 Using memory-optimized configuration"
    COMPOSE_FILE="docker-compose.memory-optimized.yml"
    NGINX_CONFIG="nginx/low-memory.conf"
else
    echo "🔧 Using standard configuration"
    COMPOSE_FILE="docker-compose.yml"
    NGINX_CONFIG="nginx/default.conf"
fi

# کپی nginx config مناسب
echo "📁 Setting up nginx configuration..."
cp $NGINX_CONFIG nginx/active.conf

# بررسی فایل .env
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your settings!"
    echo "⚠️  Make sure to set NEXTAUTH_URL=https://$DOMAIN"
    read -p "Press Enter after editing .env file..."
fi

# متوقف کردن کانتینرهای قدیمی
echo "🛑 Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down 2>/dev/null || true

# پاک کردن cache
echo "🧹 Cleaning Docker cache..."
docker system prune -f

# ایجاد دایرکتری SSL
echo "📁 Creating SSL directory..."
mkdir -p /etc/letsencrypt
mkdir -p /var/www/certbot

# شروع nginx بدون SSL برای دریافت گواهی
echo "🌐 Starting nginx for SSL certificate..."
cat > nginx/temp.conf << 'EOF'
server {
    listen 80;
    server_name ahmadreza-avandi.ir www.ahmadreza-avandi.ir;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://nextjs:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /secure-db-admin-panel-x7k9m2/ {
        proxy_pass http://phpmyadmin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# تنظیم docker-compose موقت برای SSL
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

  certbot:
    image: certbot/certbot
    container_name: certbot
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt
      - /var/www/certbot:/var/www/certbot
    depends_on:
      - nginx-temp
    networks:
      - crm_network

networks:
  crm_network:
    driver: bridge
EOF

# راه‌اندازی nginx موقت
echo "🔧 Starting temporary nginx..."
docker-compose -f docker-compose.temp.yml up -d nginx-temp

# انتظار برای آماده شدن nginx
sleep 5

# دریافت گواهی SSL
echo "📜 Obtaining SSL certificate..."
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    docker-compose -f docker-compose.temp.yml run --rm certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email $EMAIL --agree-tos --no-eff-email \
        -d $DOMAIN -d www.$DOMAIN
fi

# متوقف کردن nginx موقت
echo "🛑 Stopping temporary nginx..."
docker-compose -f docker-compose.temp.yml down

# پاک کردن فایل‌های موقت
rm -f nginx/temp.conf docker-compose.temp.yml

# بررسی وجود گواهی SSL
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ SSL certificate obtained successfully!"
else
    echo "⚠️  SSL certificate not found, continuing without HTTPS..."
    # ایجاد nginx config بدون SSL
    cat > nginx/default.conf << 'EOF'
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

# Build و اجرای سرویس‌ها
echo "🔨 Building and starting all services..."
docker-compose -f $COMPOSE_FILE up --build -d

# انتظار برای آماده شدن سرویس‌ها
echo "⏳ Waiting for services to start..."
sleep 30

# بررسی وضعیت سرویس‌ها
echo "📊 Service Status:"
docker-compose -f $COMPOSE_FILE ps

# تست سرویس‌ها
echo "🧪 Testing services..."

# تست NextJS
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ NextJS is running"
else
    echo "⚠️  NextJS might not be ready yet"
fi

# تست MySQL
if docker-compose -f $COMPOSE_FILE exec -T mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} >/dev/null 2>&1; then
    echo "✅ MySQL is running"
else
    echo "⚠️  MySQL might not be ready yet"
fi

# نمایش لاگ‌های اخیر
echo "📋 Recent logs:"
docker-compose -f $COMPOSE_FILE logs --tail=10

# تنظیم تجدید خودکار SSL
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "⏰ Setting up SSL auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f $(pwd)/$COMPOSE_FILE restart nginx") | crontab -
fi

echo ""
echo "🎉 Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "🌐 CRM System: https://$DOMAIN"
    echo "🔐 phpMyAdmin: https://$DOMAIN/secure-db-admin-panel-x7k9m2/"
else
    echo "🌐 CRM System: http://$DOMAIN"
    echo "🔐 phpMyAdmin: http://$DOMAIN/secure-db-admin-panel-x7k9m2/"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Useful Commands:"
echo "   • View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   • Restart: docker-compose -f $COMPOSE_FILE restart"
echo "   • Stop: docker-compose -f $COMPOSE_FILE down"
echo "   • Status: docker-compose -f $COMPOSE_FILE ps"
echo ""
echo "🔐 phpMyAdmin Login:"
echo "   • Username: ${MYSQL_USER:-crm_user}"
echo "   • Password: [from your .env file]"