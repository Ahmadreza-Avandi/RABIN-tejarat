#!/bin/bash

# ===========================================
# 🗄️ CRM Database Fix Script
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

print_status "Starting database fix process..."

# Step 1: Check if Docker is running
print_status "Checking if Docker is running..."
if ! docker info > /dev/null 2>&1; then
  print_error "Docker is not running. Please start Docker first."
  exit 1
else
  print_success "Docker is running."
fi

# Step 2: Check if containers are running
print_status "Checking container status..."
if ! docker ps | grep -q "crm-mysql"; then
  print_warning "MySQL container is not running!"
  print_status "Starting containers..."
  docker-compose up -d mysql
  sleep 20
else
  print_success "MySQL container is running."
fi

# Step 3: Fix database root password and user
print_status "Fixing database root password and user..."

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
print_status "Attempting to fix database with various root password combinations..."

if docker exec -i crm-mysql mysql -uroot -p1234_ROOT < fix-db-root.sql 2>/dev/null; then
  print_success "Database root password and user fixed with password '1234_ROOT'!"
  ROOT_PASSWORD="1234_ROOT"
elif docker exec -i crm-mysql mysql -uroot -p1234 < fix-db-root.sql 2>/dev/null; then
  print_success "Database root password and user fixed with password '1234'!"
  ROOT_PASSWORD="1234"
elif docker exec -i crm-mysql mysql -uroot < fix-db-root.sql 2>/dev/null; then
  print_success "Database root password and user fixed with empty password!"
  ROOT_PASSWORD=""
else
  print_warning "Could not connect with standard passwords. Trying alternative approach..."
  
  # Try to reset MySQL root password using Docker
  print_status "Attempting to reset MySQL root password..."
  
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
    print_success "Database root password reset and user fixed!"
    ROOT_PASSWORD="1234_ROOT"
  else
    print_error "Failed to reset root password. Manual intervention required."
    exit 1
  fi
fi

# Remove temporary SQL file
rm fix-db-root.sql

# Step 4: Check if tables already exist
print_status "Checking if database tables already exist..."
TABLE_COUNT=$(docker exec -i crm-mysql mysql -ucrm_app_user -p1234 -e "USE crm_system; SHOW TABLES;" 2>/dev/null | wc -l)

if [ "$TABLE_COUNT" -gt 0 ]; then
  print_success "Database tables already exist. Skipping import."
else
  # Step 5: Import database structure and data
  print_status "Importing database structure and data..."
  if [ -f "database/crm_system.sql" ]; then
    if docker exec -i crm-mysql mysql -ucrm_app_user -p1234 crm_system < database/crm_system.sql; then
      print_success "Database imported successfully with crm_app_user"
    else
      print_warning "Failed to import with crm_app_user. Trying with root..."
      if docker exec -i crm-mysql mysql -uroot -p${ROOT_PASSWORD} crm_system < database/crm_system.sql; then
        print_success "Database imported with root user"
      else
        print_error "Failed to import database"
        exit 1
      fi
    fi
  elif [ -f "crm_system.sql" ]; then
    if docker exec -i crm-mysql mysql -ucrm_app_user -p1234 crm_system < crm_system.sql; then
      print_success "Database imported successfully with crm_app_user"
    else
      print_warning "Failed to import with crm_app_user. Trying with root..."
      if docker exec -i crm-mysql mysql -uroot -p${ROOT_PASSWORD} crm_system < crm_system.sql; then
        print_success "Database imported with root user"
      else
        print_error "Failed to import database"
        exit 1
      fi
    fi
  else
    print_error "Database file crm_system.sql not found in current directory or database/ directory!"
    exit 1
  fi
fi

# Step 6: Verify database access
print_status "Verifying database access..."
if docker exec -i crm-mysql mysql -ucrm_app_user -p1234 -e "USE crm_system; SHOW TABLES;" &>/dev/null; then
  print_success "Database access verification successful with crm_app_user"
else
  print_error "Database access verification failed with crm_app_user"
  exit 1
fi

# Step 7: Update .env file to ensure consistency
print_status "Updating .env file to ensure consistency..."
if grep -q "DATABASE_PASSWORD=" .env; then
  sed -i 's/DATABASE_PASSWORD=.*/DATABASE_PASSWORD="1234"/' .env
  print_success "Updated DATABASE_PASSWORD in .env"
else
  print_warning "DATABASE_PASSWORD not found in .env"
fi

if grep -q "DATABASE_USER=" .env; then
  sed -i 's/DATABASE_USER=.*/DATABASE_USER="crm_app_user"/' .env
  print_success "Updated DATABASE_USER in .env"
else
  print_warning "DATABASE_USER not found in .env"
fi

# Step 8: Restart services
print_status "Restarting services..."
docker-compose restart

print_success "Database fix completed successfully!"
print_status "You can now access the system with the following credentials:"
print_status "  Database User: crm_app_user"
print_status "  Database Password: 1234"
print_status "  Root Password: ${ROOT_PASSWORD}"
print_status ""
print_status "phpMyAdmin URL: https://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/"