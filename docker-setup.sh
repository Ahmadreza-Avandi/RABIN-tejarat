#!/bin/bash

# CRM System Docker Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Setting up CRM System with Docker..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

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

print_status "Docker and Docker Compose are installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_info "Creating .env file..."
    cat > .env << EOF
# Database Configuration
DATABASE_HOST=mysql
DATABASE_USER=root
DATABASE_PASSWORD=1234
DATABASE_NAME=crm_system
DATABASE_URL=mysql://root:1234@mysql:3306/crm_system

# Email Configuration (Optional - for testing)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# App Configuration
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    print_status ".env file created"
else
    print_info ".env file already exists"
fi

# Stop any existing containers
print_info "Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true

# Remove old volumes if requested
if [ "$1" = "--clean" ]; then
    print_warning "Cleaning up old data..."
    docker-compose -f docker-compose.dev.yml down -v
    docker volume prune -f
fi

# Build and start services
print_info "Building and starting services..."
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for services to be healthy
print_info "Waiting for services to start..."

# Wait for MySQL
echo -n "Waiting for MySQL to be ready"
for i in {1..30}; do
    if docker-compose -f docker-compose.dev.yml exec -T mysql mysqladmin ping -h localhost -uroot -p1234 --silent 2>/dev/null; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# Check if MySQL is ready
if docker-compose -f docker-compose.dev.yml exec -T mysql mysqladmin ping -h localhost -uroot -p1234 --silent 2>/dev/null; then
    print_status "MySQL is ready"
else
    print_error "MySQL failed to start"
    exit 1
fi

# Wait for Next.js
echo -n "Waiting for Next.js to be ready"
for i in {1..60}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# Check if Next.js is ready
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "Next.js is ready"
else
    print_warning "Next.js might still be starting up"
fi

# Show service status
echo ""
echo "🎉 Setup completed!"
echo "================================================"
print_status "Services are running:"
echo ""
print_info "📱 CRM Application: http://localhost:3000"
print_info "🗄️  phpMyAdmin: http://localhost:8080"
print_info "🔧 MySQL: localhost:3306"
echo ""
print_info "Database Credentials:"
echo "   Host: localhost (or mysql from containers)"
echo "   Port: 3306"
echo "   Database: crm_system"
echo "   Username: root"
echo "   Password: 1234"
echo ""
print_info "phpMyAdmin Credentials:"
echo "   Username: root"
echo "   Password: 1234"
echo ""

# Show logs command
print_info "To view logs: docker-compose -f docker-compose.dev.yml logs -f"
print_info "To stop services: docker-compose -f docker-compose.dev.yml down"
print_info "To restart: ./docker-setup.sh"
print_info "To clean and restart: ./docker-setup.sh --clean"

echo ""
print_status "🚀 CRM System is ready for development!"