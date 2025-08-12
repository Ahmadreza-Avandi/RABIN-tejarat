#!/bin/bash

echo "🚀 Setting up MySQL for CRM System..."

# Stop any existing MySQL containers
echo "📦 Stopping existing MySQL containers..."
docker stop crm_mysql 2>/dev/null || true
docker rm crm_mysql 2>/dev/null || true

# Create MySQL init directory
mkdir -p mysql-init

# Create initial database schema
cat > mysql-init/01-init.sql << 'EOF'
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE crm_system;

-- Grant privileges
GRANT ALL PRIVILEGES ON crm_system.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- Create a basic users table for testing
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'manager') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert a test admin user
INSERT IGNORE INTO users (email, name, password, role) VALUES 
('admin@ahmadreza-avandi.ir', 'Admin User', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

EOF

# Start MySQL with Docker Compose
echo "🐳 Starting MySQL container..."
docker-compose -f docker-compose.mysql.yml up -d

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
sleep 30

# Test connection
echo "🔍 Testing MySQL connection..."
docker exec crm_mysql mysql -uroot -p1234 -e "SHOW DATABASES;"

if [ $? -eq 0 ]; then
    echo "✅ MySQL is running successfully!"
    echo "📊 Database: crm_system"
    echo "👤 User: root"
    echo "🔑 Password: 1234"
    echo "🌐 Host: localhost"
    echo "🔌 Port: 3306"
    echo ""
    echo "🔗 Connection URL: mysql://root:1234@localhost:3306/crm_system"
else
    echo "❌ Failed to connect to MySQL"
    echo "📋 Checking logs..."
    docker logs crm_mysql
fi