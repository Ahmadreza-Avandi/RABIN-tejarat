#!/bin/bash

# متغیرهای محیطی
DOMAIN="ahmadreza-avandi.ir"
EMAIL="your-email@example.com"  # ایمیل برای گواهی SSL

echo "🚀 شروع دیپلوی CRM با تنظیمات دامنه..."
echo "🌐 دامنه: $DOMAIN"

# توقف و پاکسازی کانتینرهای قبلی
echo "🧹 پاکسازی محیط..."
docker-compose down
docker system prune -f

# ایجاد شبکه Docker
echo "🔄 ایجاد شبکه Docker..."
docker network create crm_network || true

# نصب و پیکربندی Certbot
echo "📜 نصب Certbot..."
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# ایجاد فایل پیکربندی Nginx
echo "📝 ایجاد فایل پیکربندی Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# فعال‌سازی سایت در Nginx
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# دریافت گواهی SSL
echo "🔒 دریافت گواهی SSL..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL

# ساخت و اجرای Docker
echo "🏗️ ساخت و اجرای Docker..."
docker-compose -f docker-compose.production.yml up --build -d

echo "✅ دیپلوی کامل شد!"
echo "🌐 سایت در آدرس https://$DOMAIN در دسترس است"
echo "📝 برای مشاهده لاگ‌ها:"
echo "docker-compose -f docker-compose.production.yml logs -f"
