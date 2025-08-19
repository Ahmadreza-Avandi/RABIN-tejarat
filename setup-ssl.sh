#!/bin/bash

# 🔒 SSL Certificate Setup Script
set -e

DOMAIN="ahmadreza-avandi.ir"
EMAIL="admin@ahmadreza-avandi.ir"

echo "🔒 Setting up SSL certificates for $DOMAIN..."

# بررسی وجود certbot
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    sudo apt update
    sudo apt install -y certbot
fi

# متوقف کردن nginx موقتاً
echo "🛑 Stopping nginx temporarily..."
docker-compose down nginx 2>/dev/null || true

# دریافت گواهی SSL
echo "📜 Obtaining SSL certificate..."
sudo certbot certonly \
    --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN,www.$DOMAIN

# بررسی موفقیت
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ SSL certificate obtained successfully!"
    
    # تنظیم دسترسی‌ها
    sudo chmod -R 755 /etc/letsencrypt/
    
    # راه‌اندازی مجدد nginx
    echo "🚀 Starting nginx with SSL..."
    docker-compose up -d nginx
    
    echo "🌐 Your site is now available at: https://$DOMAIN"
else
    echo "❌ Failed to obtain SSL certificate"
    exit 1
fi

# تنظیم تجدید خودکار
echo "⏰ Setting up automatic renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose restart nginx") | crontab -

echo "✅ SSL setup completed!"
echo "📋 Certificate will auto-renew every day at 12:00 PM"