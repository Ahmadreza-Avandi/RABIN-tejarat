#!/bin/bash

# ===========================================
# 🚀 CRM System Deployment Script
# ===========================================

set -e  # Exit on any error

echo "🚀 Starting CRM System Deployment..."

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

# Copy environment file
if [ ! -f .env ]; then
    print_status "Creating .env file from .env.production..."
    cp .env.production .env
    print_warning "Please edit .env file with your actual configuration values!"
else
    print_status ".env file already exists"
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Remove old images (optional)
read -p "Do you want to remove old Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Removing old Docker images..."
    docker system prune -f
fi

# Build and start services
print_status "Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check MySQL
if docker-compose exec -T mysql mysqladmin ping -h localhost -u root -p1234 --silent; then
    print_success "MySQL is running"
else
    print_error "MySQL is not responding"
    exit 1
fi

# Check Next.js
if curl -f http://localhost:3000/api/health &> /dev/null; then
    print_success "Next.js application is running"
else
    print_warning "Next.js application might not be ready yet"
fi

# Check Nginx
if curl -f http://localhost &> /dev/null; then
    print_success "Nginx is running"
else
    print_warning "Nginx might not be ready yet"
fi

# SSL Certificate setup
print_status "Setting up SSL certificates..."
if [ ! -f /etc/letsencrypt/live/ahmadreza-avandi.ir/fullchain.pem ]; then
    print_warning "SSL certificates not found. Setting up Let's Encrypt..."
    
    # Create temporary nginx config without SSL
    cp nginx/default.conf nginx/default.conf.backup
    cat > nginx/temp.conf << 'EOF'
server {
    listen 80;
    server_name ahmadreza-avandi.ir www.ahmadreza-avandi.ir;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://nextjs:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /phpmyadmin/ {
        proxy_pass http://phpmyadmin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    
    # Replace nginx config temporarily
    cp nginx/temp.conf nginx/default.conf
    docker-compose restart nginx
    
    # Get SSL certificate
    docker-compose run --rm certbot
    
    # Restore original nginx config
    cp nginx/default.conf.backup nginx/default.conf
    rm nginx/temp.conf nginx/default.conf.backup
    
    # Restart nginx with SSL
    docker-compose restart nginx
    
    print_success "SSL certificates obtained"
else
    print_success "SSL certificates already exist"
fi

# Show running services
print_status "Showing running services..."
docker-compose ps

# Show logs
print_status "Showing recent logs..."
docker-compose logs --tail=20

print_success "🎉 Deployment completed successfully!"
echo
echo "📋 Service URLs:"
echo "   🌐 Main Application: https://ahmadreza-avandi.ir"
echo "   🗄️  phpMyAdmin: https://ahmadreza-avandi.ir/phpmyadmin"
echo
echo "📊 Monitoring Commands:"
echo "   📋 View logs: docker-compose logs -f"
echo "   📈 View status: docker-compose ps"
echo "   🔄 Restart services: docker-compose restart"
echo "   🛑 Stop services: docker-compose down"
echo
echo "⚠️  Important Notes:"
echo "   1. Make sure to edit .env file with your actual configuration"
echo "   2. Update DNS records to point to this server"
echo "   3. Configure email and SMS settings in .env"
echo "   4. Set up regular backups"
echo
print_warning "Don't forget to secure your server and update passwords!"