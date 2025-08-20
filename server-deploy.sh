#!/bin/bash

# ===========================================
# 🚀 CRM Server Deployment Script
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "🚀 شروع فرآیند استقرار CRM روی سرور..."

# Step 1: Check if Docker is running
print_status "بررسی وضعیت Docker..."
if ! docker info > /dev/null 2>&1; then
  print_error "Docker در حال اجرا نیست. لطفا ابتدا Docker را راه‌اندازی کنید."
  exit 1
else
  print_success "Docker در حال اجرا است."
fi

# Step 2: Fix database root password and user
print_status "تنظیم کاربر و رمز عبور دیتابیس..."

# Create a temporary SQL script
cat > fix-db-root.sql << 'EOF'
-- Update root password if needed
ALTER USER 'root'@'localhost' IDENTIFIED BY '1234_ROOT';
ALTER USER 'root'@'%' IDENTIFIED BY '1234_ROOT';

-- Create application user with correct privileges
DROP USER IF EXISTS 'crm_app_user'@'%';
CREATE USER 'crm_app_user'@'%' IDENTIFIED BY '1234';
GRANT ALL PRIVILEGES ON crm_system.* TO 'crm_app_user'@'%';

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Show users to verify
SELECT User, Host FROM mysql.user;
EOF

# Try to execute the SQL script with different root password attempts
print_status "تلاش برای تنظیم دیتابیس با ترکیب‌های مختلف رمز عبور..."

if docker exec -i crm-mysql mysql -uroot -p1234_ROOT < fix-db-root.sql 2>/dev/null; then
  print_success "رمز عبور root و کاربر دیتابیس با رمز '1234_ROOT' تنظیم شد!"
  ROOT_PASSWORD="1234_ROOT"
elif docker exec -i crm-mysql mysql -uroot -p1234 < fix-db-root.sql 2>/dev/null; then
  print_success "رمز عبور root و کاربر دیتابیس با رمز '1234' تنظیم شد!"
  ROOT_PASSWORD="1234"
elif docker exec -i crm-mysql mysql -uroot < fix-db-root.sql 2>/dev/null; then
  print_success "رمز عبور root و کاربر دیتابیس با رمز خالی تنظیم شد!"
  ROOT_PASSWORD=""
else
  print_warning "امکان اتصال با رمزهای استاندارد وجود ندارد. در حال تلاش با روش جایگزین..."
  
  # Try to reset MySQL root password using Docker
  print_status "تلاش برای بازنشانی رمز عبور root در MySQL..."
  
  # Stop the MySQL container
  docker-compose stop mysql
  
  # Start MySQL with skip-grant-tables to reset password
  docker-compose run --rm --name mysql-temp -e MYSQL_ALLOW_EMPTY_PASSWORD=true mysql mysqld --skip-grant-tables &
  
  # Wait for MySQL to start
  sleep 10
  
  # Reset root password
  docker exec -i mysql-temp mysql << 'EOF'
USE mysql;
UPDATE user SET authentication_string=PASSWORD('1234_ROOT') WHERE User='root';
FLUSH PRIVILEGES;
EOF
  
  # Stop the temporary MySQL container
  docker stop mysql-temp
  
  # Start the regular MySQL container
  docker-compose up -d mysql
  
  # Wait for MySQL to start
  sleep 20
  
  # Try again with the new password
  if docker exec -i crm-mysql mysql -uroot -p1234_ROOT < fix-db-root.sql 2>/dev/null; then
    print_success "رمز عبور root بازنشانی شد و کاربر دیتابیس تنظیم شد!"
    ROOT_PASSWORD="1234_ROOT"
  else
    print_error "بازنشانی رمز عبور root ناموفق بود. نیاز به مداخله دستی است."
    exit 1
  fi
fi

# Remove temporary SQL file
rm fix-db-root.sql

# Step 3: Update .env file to ensure consistency
print_status "به‌روزرسانی فایل .env برای اطمینان از سازگاری..."
if grep -q "DATABASE_PASSWORD=" .env; then
  sed -i 's/DATABASE_PASSWORD=.*/DATABASE_PASSWORD="1234"/' .env
  print_success "DATABASE_PASSWORD در .env به‌روزرسانی شد"
else
  print_warning "DATABASE_PASSWORD در .env یافت نشد"
fi

if grep -q "DATABASE_USER=" .env; then
  sed -i 's/DATABASE_USER=.*/DATABASE_USER="crm_app_user"/' .env
  print_success "DATABASE_USER در .env به‌روزرسانی شد"
else
  print_warning "DATABASE_USER در .env یافت نشد"
fi

# Step 4: Restart services
print_status "راه‌اندازی مجدد سرویس‌ها..."

# Check what's using port 80
print_status "بررسی سرویس‌های استفاده‌کننده از پورت 80..."
sudo lsof -i :80 || print_warning "امکان بررسی پورت 80 وجود ندارد"

# Ask if user wants to stop the service using port 80
read -p "آیا می‌خواهید سرویس استفاده‌کننده از پورت 80 را متوقف کنید؟ (y/n): " stop_service
if [[ "$stop_service" == "y" ]]; then
  print_status "توقف سرویس استفاده‌کننده از پورت 80..."
  sudo systemctl stop nginx || print_warning "توقف سرویس nginx ناموفق بود"
  sudo systemctl stop apache2 || print_warning "توقف سرویس apache2 ناموفق بود"
fi

# Restart all services
print_status "راه‌اندازی مجدد همه سرویس‌ها..."
docker-compose down
docker-compose up -d

# Wait for services to be ready
print_status "⏳ در حال انتظار برای آماده‌سازی سرویس‌ها..."
sleep 20

# Check if services are running
print_status "📊 بررسی وضعیت..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Verify database access
print_status "تأیید دسترسی به دیتابیس..."
if docker exec -i crm-mysql mysql -ucrm_app_user -p1234 -e "USE crm_system; SHOW TABLES;" &>/dev/null; then
  print_success "تأیید دسترسی به دیتابیس با کاربر crm_app_user موفقیت‌آمیز بود"
  
  # Show available users
  print_status "کاربران موجود برای ورود:"
  docker exec -i crm-mysql mysql -ucrm_app_user -p1234 -e "USE crm_system; SELECT email, role FROM users WHERE status = 'active';" 2>/dev/null
else
  print_error "تأیید دسترسی به دیتابیس با کاربر crm_app_user ناموفق بود"
fi

print_success "✅ استقرار CRM با موفقیت انجام شد!"
print_status "شما اکنون می‌توانید با استفاده از اطلاعات زیر به سیستم دسترسی داشته باشید:"
print_status "  آدرس وب‌سایت: https://ahmadreza-avandi.ir"
print_status "  آدرس phpMyAdmin: https://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/"
print_status "  کاربر دیتابیس: crm_app_user"
print_status "  رمز عبور دیتابیس: 1234"
print_status "  رمز عبور root: ${ROOT_PASSWORD}"