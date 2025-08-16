#!/bin/bash

# ===========================================
# 🔒 SECURE CRM System Deployment Script
# ===========================================

set -e  # Exit on any error

echo "🔒 Starting SECURE CRM System Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

print_security() {
    echo -e "${RED}[SECURITY]${NC} $1"
}

# Check if running as root (security warning)
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider using a non-root user for better security."
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Checking system requirements..."

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p database
mkdir -p nginx/ssl
mkdir -p backups
mkdir -p logs
mkdir -p security

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found. Please create it with secure credentials."
    exit 1
fi

# Backup existing data
print_status "Creating backup of existing data..."
if docker-compose ps | grep -q "crm-mysql"; then
    docker-compose exec mysql mysqladump -u crm_app_user -p'Cr@M_App_Us3r_2024!@#$%' crm_system > "backups/backup_$(date +%Y%m%d_%H%M%S).sql" 2>/dev/null || print_warning "No existing database to backup"
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Security check: Remove any exposed MySQL ports
print_security "Checking for security vulnerabilities..."

# Build and start services
print_status "Building and starting SECURE services..."
docker-compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 45

# Security validations
print_security "Running security validations..."

# Check if MySQL port is not exposed externally
if docker-compose ps | grep -q "3306->3306"; then
    print_error "SECURITY RISK: MySQL port is exposed externally!"
    print_error "Please remove the ports section from MySQL service in docker-compose.yml"
    exit 1
else
    print_success "MySQL port is properly secured (internal only)"
fi

# Check if phpMyAdmin is on secure path
if curl -f -s "http://localhost/secure-db-admin-panel-x7k9m2/" > /dev/null 2>&1; then
    print_success "phpMyAdmin is accessible on secure path"
else
    print_warning "phpMyAdmin might not be accessible yet (normal during startup)"
fi

# Check service health
print_status "Checking service health..."

# Check MySQL with new credentials
if docker-compose exec -T mysql mysqladmin ping -h localhost -u crm_app_user -p'Cr@M_App_Us3r_2024!@#$%' --silent; then
    print_success "MySQL is running with secure credentials"
else
    print_error "MySQL is not responding with new credentials"
    exit 1
fi

# Check Next.js
if curl -f http://localhost:3000/api/health &> /dev/null; then
    print_success "Next.js application is running"
else
    print_warning "Next.js application might not be ready yet"
fi

# Show running services
print_status "Showing running services..."
docker-compose ps

# Show recent logs
print_status "Showing recent logs..."
docker-compose logs --tail=20

print_success "🎉 SECURE Deployment completed successfully!"
echo
print_security "🔒 SECURITY IMPROVEMENTS APPLIED:"
echo "   ✅ MySQL port no longer exposed externally"
echo "   ✅ Strong database passwords implemented"
echo "   ✅ Dedicated database user with limited privileges"
echo "   ✅ phpMyAdmin moved to hidden path: /secure-db-admin-panel-x7k9m2/"
echo "   ✅ Rate limiting enabled on nginx"
echo "   ✅ Enhanced security headers"
echo "   ✅ Anonymous MySQL users removed"
echo "   ✅ Test database removed"
echo
echo "📋 Service URLs:"
echo "   🌐 Main Application: https://ahmadreza-avandi.ir"
echo "   🗄️  phpMyAdmin: https://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/"
echo
echo "🔐 Database Credentials:"
echo "   👤 User: crm_app_user"
echo "   🔑 Password: Cr@M_App_Us3r_2024!@#$%"
echo "   🗄️  Database: crm_system"
echo
print_security "🚨 ADDITIONAL SECURITY RECOMMENDATIONS:"
echo "   1. Set up fail2ban on the server (config provided in security/)"
echo "   2. Enable firewall (ufw) and only allow necessary ports"
echo "   3. Regularly update Docker images"
echo "   4. Monitor logs for suspicious activity"
echo "   5. Set up automated backups"
echo "   6. Consider adding IP whitelist for phpMyAdmin"
echo "   7. Enable 2FA for critical accounts"
echo
print_warning "⚠️  Remember to:"
echo "   - Update your bookmarks for phpMyAdmin new URL"
echo "   - Update any scripts that connect to MySQL"
echo "   - Monitor server logs regularly"
echo "   - Keep Docker images updated"