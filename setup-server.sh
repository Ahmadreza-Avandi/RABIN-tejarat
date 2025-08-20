#!/bin/bash

# ===========================================
# 🚀 CRM System Server Setup Script
# ===========================================

set -e

echo "🚀 Setting up CRM System on server..."

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

# Step 1: Pull latest changes
print_status "Pulling latest changes from repository..."
git pull

# Step 2: Create .env.server from template if it doesn't exist
print_status "Setting up environment configuration..."
if [ ! -f ".env.server" ]; then
    if [ -f ".env.server.template" ]; then
        cp .env.server.template .env.server
        print_success "Created .env.server from template"
        print_warning "Please edit .env.server with your actual credentials:"
        print_warning "  - EMAIL_USER and EMAIL_PASS for Gmail"
        print_warning "  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN"
        print_warning "  - KAVENEGAR_API_KEY for SMS"
        echo ""
        echo "Edit the file now? (y/n)"
        read -r edit_env
        if [ "$edit_env" = "y" ] || [ "$edit_env" = "Y" ]; then
            nano .env.server
        fi
    else
        print_error ".env.server.template not found!"
        exit 1
    fi
else
    print_success ".env.server already exists"
fi

# Step 3: Copy server environment to .env
cp .env.server .env
print_success "Environment configured for production"

# Step 4: Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Step 5: Clean up old resources
print_status "Cleaning up old Docker resources..."
docker system prune -f
docker volume prune -f

# Step 6: Build and start services
print_status "Building and starting services..."
docker-compose build --no-cache
docker-compose up -d

# Step 7: Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Step 8: Fix database user permissions
print_status "Setting up database user permissions..."
docker-compose exec -T mysql mysql -u root -p1234_ROOT -e "
CREATE USER IF NOT EXISTS 'crm_app_user'@'%' IDENTIFIED BY '1234';
GRANT ALL PRIVILEGES ON crm_system.* TO 'crm_app_user'@'%';
FLUSH PRIVILEGES;
SELECT User, Host FROM mysql.user WHERE User = 'crm_app_user';
" || print_warning "Database user setup might have failed"

# Step 9: Test database connection
print_status "Testing database connection..."
if docker-compose exec -T mysql mysql -u crm_app_user -p1234 -e "USE crm_system; SELECT COUNT(*) as user_count FROM users;" 2>/dev/null; then
    print_success "Database connection successful"
else
    print_error "Database connection failed"
    print_status "Trying to fix database permissions..."
    docker-compose exec -T mysql mysql -u root -p1234_ROOT -e "
    DROP USER IF EXISTS 'crm_app_user'@'%';
    CREATE USER 'crm_app_user'@'%' IDENTIFIED BY '1234';
    GRANT ALL PRIVILEGES ON crm_system.* TO 'crm_app_user'@'%';
    FLUSH PRIVILEGES;
    "
fi

# Step 10: Check service health
print_status "Checking service health..."

# Check MySQL
if docker-compose exec -T mysql mysqladmin ping -h localhost -u root -p1234_ROOT --silent 2>/dev/null; then
    print_success "MySQL is running"
else
    print_error "MySQL is not responding"
fi

# Check Next.js app
sleep 10
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

# Step 11: Show running containers
print_status "Current running containers:"
docker-compose ps

# Step 12: Show recent logs
print_status "Recent application logs:"
docker-compose logs --tail=10 nextjs

print_success "Setup completed!"
print_status "Your CRM system should be available at: https://ahmadreza-avandi.ir"
print_status "Database admin panel: https://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/"

echo ""
echo "🔧 Test login with these credentials:"
echo "  Email: Robintejarat@gmail.com"
echo "  Password: admin123"
echo ""
echo "🔧 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart services: docker-compose restart"
echo "  Stop services: docker-compose down"
echo "  Update and restart: ./deploy-server.sh"