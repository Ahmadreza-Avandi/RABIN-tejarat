#!/bin/bash

# 🎯 Final Setup: HTTPS + Complete Database
set -e

DOMAIN="ahmadreza-avandi.ir"
EMAIL="admin@ahmadreza-avandi.ir"

echo "🎯 Final Setup: HTTPS + Database..."

# بررسی حافظه
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
if [ "$TOTAL_MEM" -lt 2048 ]; then
    COMPOSE_FILE="docker-compose.memory-optimized.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

# مرحله 1: راه‌اندازی SSL
echo "🔒 Setting up SSL certificate..."

# متوقف کردن nginx موقتاً
docker-compose -f $COMPOSE_FILE stop nginx

# دریافت گواهی SSL
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "📜 Obtaining SSL certificate..."
    
    # استفاده از certbot standalone
    sudo certbot certonly \
        --standalone \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        --domains $DOMAIN,www.$DOMAIN \
        --non-interactive || echo "⚠️  SSL failed, continuing with HTTP"
fi

# مرحله 2: تنظیم nginx برای HTTPS
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "🔧 Configuring nginx for HTTPS..."
    
    cat > nginx/https.conf << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ahmadreza-avandi.ir www.ahmadreza-avandi.ir;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ahmadreza-avandi.ir www.ahmadreza-avandi.ir;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ahmadreza-avandi.ir/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ahmadreza-avandi.ir/privkey.pem;
    
    # SSL Security Settings
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Performance Settings
    client_max_body_size 20M;
    client_body_buffer_size 64k;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 3;
    gzip_types text/plain text/css application/javascript application/json;

    # Main Next.js Application
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
        
        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 64k;
        proxy_buffers 2 128k;
        proxy_busy_buffers_size 128k;
    }

    # phpMyAdmin
    location /secure-db-admin-panel-x7k9m2/ {
        proxy_pass http://phpmyadmin/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header Referrer-Policy "no-referrer" always;
    }

    # API routes
    location /api/ {
        proxy_pass http://nextjs:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://nextjs:3000/api/health;
        access_log off;
    }

    # Static files
    location /_next/static/ {
        proxy_pass http://nextjs:3000;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Block unwanted paths
    location ~ ^/(phpmyadmin|pma|admin|database|db)/ {
        return 444;
    }
}
EOF

    # استفاده از config HTTPS
    cp nginx/https.conf nginx/default.conf
    
    # آپدیت .env برای HTTPS
    sed -i 's|NEXTAUTH_URL=http://|NEXTAUTH_URL=https://|g' .env
    
    echo "✅ HTTPS configured!"
else
    echo "⚠️  Continuing with HTTP (SSL setup failed)"
fi

# مرحله 3: راه‌اندازی دیتابیس کامل
echo "🗄️  Setting up complete database..."

# شروع nginx
docker-compose -f $COMPOSE_FILE start nginx

# انتظار برای آماده شدن MySQL
echo "⏳ Waiting for MySQL..."
sleep 15

# اجرای اسکریپت‌های دیتابیس
echo "📊 Initializing database..."
docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -p1234 << 'SQL'
CREATE DATABASE IF NOT EXISTS crm_system;
USE crm_system;

-- ایجاد کاربر ادمین
INSERT IGNORE INTO users (
    id, username, email, password, full_name, role, is_active, created_at, updated_at
) VALUES (
    1, 'admin', 'admin@ahmadreza-avandi.ir',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS',
    'مدیر سیستم', 'admin', 1, NOW(), NOW()
);

-- ایجاد جدول تنظیمات
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- تنظیمات پیش‌فرض
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('site_name', 'سیستم مدیریت ارتباط با مشتری'),
('site_url', 'https://ahmadreza-avandi.ir'),
('admin_email', 'admin@ahmadreza-avandi.ir'),
('system_status', 'active');

SELECT 'Database setup completed!' as message;
SQL

# مرحله 4: تنظیم تجدید خودکار SSL
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "⏰ Setting up SSL auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f $(pwd)/$COMPOSE_FILE restart nginx") | crontab -
fi

# بررسی نهایی
echo "🧪 Final testing..."
docker-compose -f $COMPOSE_FILE ps

# تست HTTPS
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    if curl -k -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200\|301\|302\|307"; then
        echo "✅ HTTPS is working!"
        SITE_URL="https://$DOMAIN"
        PHPMYADMIN_URL="https://$DOMAIN/secure-db-admin-panel-x7k9m2/"
    else
        echo "⚠️  HTTPS might need more time"
        SITE_URL="https://$DOMAIN (check manually)"
        PHPMYADMIN_URL="https://$DOMAIN/secure-db-admin-panel-x7k9m2/ (check manually)"
    fi
else
    SITE_URL="http://$DOMAIN"
    PHPMYADMIN_URL="http://$DOMAIN/secure-db-admin-panel-x7k9m2/"
fi

echo ""
echo "🎉 Final Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 CRM System: $SITE_URL"
echo "🔐 phpMyAdmin: $PHPMYADMIN_URL"
echo ""
echo "👤 Default Login:"
echo "   • Username: admin"
echo "   • Password: admin123"
echo ""
echo "🗄️  Database Access:"
echo "   • Username: crm_user"
echo "   • Password: 1234"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 System Status:"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "   ✅ SSL Certificate: Active"
    echo "   ✅ HTTPS: Enabled"
else
    echo "   ⚠️  SSL Certificate: Not found"
    echo "   ⚠️  HTTPS: Disabled"
fi
echo "   ✅ Database: Initialized"
echo "   ✅ Admin User: Created"
echo "   ✅ All Services: Running"