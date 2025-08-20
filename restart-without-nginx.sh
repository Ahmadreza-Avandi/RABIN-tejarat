#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

print_status "Restarting CRM services without Nginx..."

# Check what's using port 80
print_status "Checking what's using port 80..."
sudo lsof -i :80 || print_warning "Could not check port 80 usage"

# Restart only MySQL and NextJS containers
print_status "Restarting MySQL and NextJS containers..."
docker-compose restart mysql
docker-compose restart nextjs

# Wait for services to be ready
print_status "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
print_status "📊 Checking status..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

print_success "✅ Database services restarted!"
print_status "You can now access the system with the following credentials:"
print_status "  Database User: crm_app_user"
print_status "  Database Password: 1234"
print_status "  Root Password: 1234_ROOT"
print_status ""
print_status "Note: Nginx was not restarted because port 80 is already in use."
print_status "You may need to manually configure Nginx or stop the service using port 80."