#!/bin/bash

# 🔧 Setup Environment and Database
set -e

echo "🔧 Setting up environment and database..."

# ایجاد فایل .env کامل
echo "📝 Creating complete .env file..."
cat > .env << 'EOF'
# Database Configuration
MYSQL_ROOT_PASSWORD=SecureRootPass123!
MYSQL_DATABASE=crm_system
MYSQL_USER=crm_user
MYSQL_PASSWORD=SecureDBPass456!

# NextAuth Configuration
NEXTAUTH_SECRET=your_very_long_secret_key_here_at_least_32_characters_long_random_string_12345
NEXTAUTH_URL=http://ahmadreza-avandi.ir

# Database URL
DATABASE_URL=mysql://crm_user:SecureDBPass456!@mysql:3306/crm_system

# Application Settings
NODE_ENV=production
DATABASE_HOST=mysql
DATABASE_USER=crm_user
DATABASE_PASSWORD=SecureDBPass456!
DATABASE_NAME=crm_system

# Email Settings (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# SMS Settings (optional)
SMS_API_KEY=your-sms-api-key
SMS_SENDER=your-sender-name
EOF

echo "✅ .env file created successfully!"

# بررسی حافظه
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
echo "💾 Memory: ${TOTAL_MEM}MB"

# انتخاب compose file
if [ "$TOTAL_MEM" -lt 2048 ]; then
    COMPOSE_FILE="docker-compose.memory-optimized.yml"
    echo "🔧 Using memory-optimized config"
else
    COMPOSE_FILE="docker-compose.yml"
    echo "🔧 Using standard config"
fi

# متوقف کردن سرویس‌ها
echo "🛑 Stopping services..."
docker-compose -f $COMPOSE_FILE down

# پاک کردن volumes قدیمی برای reset دیتابیس
echo "🗑️  Removing old database volumes..."
docker-compose -f $COMPOSE_FILE down -v

# شروع مجدد با تنظیمات جدید
echo "🚀 Starting services with new configuration..."
docker-compose -f $COMPOSE_FILE up -d

# انتظار برای آماده شدن MySQL
echo "⏳ Waiting for MySQL to be ready..."
sleep 30

# بررسی اتصال MySQL
echo "🔍 Checking MySQL connection..."
for i in {1..10}; do
    if docker-compose -f $COMPOSE_FILE exec -T mysql mysqladmin ping -h localhost -u root -pSecureRootPass123! >/dev/null 2>&1; then
        echo "✅ MySQL is ready!"
        break
    fi
    echo "⏳ Waiting for MySQL... ($i/10)"
    sleep 5
done

# ایجاد کاربر پیش‌فرض
echo "👤 Creating default admin user..."
docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -pSecureRootPass123! crm_system << 'SQL'
-- ایجاد کاربر ادمین پیش‌فرض
INSERT IGNORE INTO users (
    id, 
    username, 
    email, 
    password, 
    full_name, 
    role, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    1,
    'admin',
    'admin@ahmadreza-avandi.ir',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', -- password: admin123
    'مدیر سیستم',
    'admin',
    1,
    NOW(),
    NOW()
);

-- اطمینان از وجود جدول permissions
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT TRUE,
    can_create BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT TRUE,
    can_delete BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_module (user_id, module_name)
);

-- دادن تمام دسترسی‌ها به ادمین
INSERT IGNORE INTO permissions (user_id, module_name, can_view, can_create, can_edit, can_delete) VALUES
(1, 'dashboard', 1, 1, 1, 1),
(1, 'customers', 1, 1, 1, 1),
(1, 'contacts', 1, 1, 1, 1),
(1, 'deals', 1, 1, 1, 1),
(1, 'products', 1, 1, 1, 1),
(1, 'sales', 1, 1, 1, 1),
(1, 'reports', 1, 1, 1, 1),
(1, 'settings', 1, 1, 1, 1),
(1, 'users', 1, 1, 1, 1);

SELECT 'Default admin user created successfully!' as message;
SQL

# بررسی وضعیت نهایی
echo "📊 Final status check..."
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "🎉 Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 CRM System: http://ahmadreza-avandi.ir"
echo "🔐 phpMyAdmin: http://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/"
echo ""
echo "👤 Default Login:"
echo "   • Username: admin"
echo "   • Password: admin123"
echo ""
echo "🗄️  Database Access:"
echo "   • Username: crm_user"
echo "   • Password: SecureDBPass456!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"