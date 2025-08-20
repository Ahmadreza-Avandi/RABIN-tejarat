#!/bin/bash

# ===========================================
# 🚀 CRM System Server Deployment Script
# ===========================================

set -e

echo "🚀 Starting CRM System deployment on server..."

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

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. This is not recommended for production."
fi

# Step 1: Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Step 2: Copy server environment file
print_status "Setting up production environment..."
if [ -f ".env.server" ]; then
    cp .env.server .env
    print_success "Production environment configured"
else
    print_error ".env.server file not found!"
    exit 1
fi

# Step 3: Clean up old images and containers
print_status "Cleaning up old Docker resources..."
docker system prune -f
docker volume prune -f

# Step 4: Build and start services
print_status "Building and starting services..."
docker-compose build --no-cache
docker-compose up -d

# Step 5: Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Step 6: Check service health
print_status "Checking service health..."

# Check MySQL
if docker-compose exec -T mysql mysqladmin ping -h localhost -u root -p1234_ROOT --silent; then
    print_success "MySQL is running"
else
    print_error "MySQL is not responding"
fi

# Check Next.js app
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Next.js application is running"
else
    print_warning "Next.js application might not be ready yet"
fi

# Check Nginx
if curl -f http://localhost > /dev/null 2>&1; then
    print_success "Nginx is running"
else
    print_warning "Nginx might not be ready yet"
fi

# Step 7: Show running containers
print_status "Current running containers:"
docker-compose ps

# Step 8: Show logs for debugging
print_status "Recent logs:"
docker-compose logs --tail=20

print_success "Deployment completed!"
print_status "Your CRM system should be available at: https://ahmadreza-avandi.ir"
print_status "Database admin panel: https://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/"

echo ""
echo "🔧 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart services: docker-compose restart"
echo "  Stop services: docker-compose down"
echo "  Update and restart: ./deploy-server.sh"