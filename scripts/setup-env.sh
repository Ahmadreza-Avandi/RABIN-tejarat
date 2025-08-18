#!/bin/bash

# ===========================================
# 🔧 CRM System Environment Setup Script
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===========================================${NC}"
}

# Function to setup local development environment
setup_local() {
    print_header "🏠 Setting up LOCAL development environment"
    
    # Copy .env.local to .env for local development
    if [ -f ".env.local" ]; then
        cp .env.local .env
        print_status "✅ Copied .env.local to .env"
    else
        print_error "❌ .env.local file not found!"
        exit 1
    fi
    
    # Verify local database connection settings
    print_status "📊 Database will connect to: localhost:3306"
    print_status "📧 Email configured with your Gmail settings"
    print_status "🔐 Using development JWT secret"
    
    print_warning "⚠️  Make sure you have MySQL running locally on port 3306"
    print_warning "⚠️  Database: crm_system, User: root, Password: 1234"
    
    echo ""
    print_status "🚀 Local development environment ready!"
    print_status "Run: npm run dev"
}

# Function to setup production environment
setup_production() {
    print_header "🚀 Setting up PRODUCTION environment"
    
    # Use the master .env file for production
    if [ -f ".env.master" ]; then
        cp .env.master .env
        print_status "✅ Copied .env.master to .env"
    else
        print_error "❌ .env.master file not found!"
        exit 1
    fi
    
    # Verify production database connection settings
    print_status "📊 Database will connect to: mysql container (Docker)"
    print_status "📧 Email configured with production Gmail settings"
    print_status "🔐 Using production JWT secret"
    
    print_warning "⚠️  Make sure Docker containers are running"
    print_warning "⚠️  Database: crm_system, User: crm_app_user"
    
    echo ""
    print_status "🚀 Production environment ready!"
    print_status "Run: docker-compose up -d"
}

# Function to setup Docker development environment
setup_docker_dev() {
    print_header "🐳 Setting up DOCKER development environment"
    
    # Create docker development env
    cat > .env << EOF
# ===========================================
# 🐳 Docker Development Configuration
# ===========================================

# Database Configuration (Docker)
DATABASE_URL=mysql://root:1234@mysql:3306/crm_system
DATABASE_HOST=mysql
DATABASE_USER=root
DATABASE_PASSWORD=1234
DATABASE_NAME=crm_system

# Application Configuration
NODE_ENV=development
NEXTAUTH_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NEXTAUTH_URL=http://localhost:3000

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EMAIL_FROM_NAME=CRM System Docker Dev
EMAIL_FROM_ADDRESS=noreply@localhost

# Google OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REFRESH_TOKEN=your-google-refresh-token

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
SESSION_TIMEOUT=24h
MAX_LOGIN_ATTEMPTS=10
MIN_PASSWORD_LENGTH=6
REQUIRE_STRONG_PASSWORD=false

# Company Information
COMPANY_NAME=شرکت تجارت رابین - Docker Dev
CEO_EMAIL=admin@localhost
ADMIN_EMAIL=admin@localhost
SUPPORT_EMAIL=support@localhost

# Development Settings
DEBUG=true
LOG_LEVEL=debug
EOF

    print_status "✅ Created Docker development .env file"
    print_status "📊 Database will connect to: mysql container"
    print_status "🐳 Ready for Docker development"
    
    echo ""
    print_status "🚀 Docker development environment ready!"
    print_status "Run: docker-compose up -d"
}

# Function to show current environment
show_current() {
    print_header "📋 Current Environment Configuration"
    
    if [ -f ".env" ]; then
        echo "Database Host: $(grep DATABASE_HOST .env | cut -d'=' -f2 | tr -d '"')"
        echo "Database User: $(grep DATABASE_USER .env | cut -d'=' -f2 | tr -d '"')"
        echo "Database Name: $(grep DATABASE_NAME .env | cut -d'=' -f2 | tr -d '"')"
        echo "Node Environment: $(grep NODE_ENV .env | cut -d'=' -f2 | tr -d '"')"
        echo "NextAuth URL: $(grep NEXTAUTH_URL .env | cut -d'=' -f2 | tr -d '"')"
    else
        print_warning "No .env file found"
    fi
}

# Main script logic
case "$1" in
    "local")
        setup_local
        ;;
    "production")
        setup_production
        ;;
    "docker-dev")
        setup_docker_dev
        ;;
    "show")
        show_current
        ;;
    *)
        print_header "🔧 CRM System Environment Setup"
        echo "Usage: $0 {local|production|docker-dev|show}"
        echo ""
        echo "Commands:"
        echo "  local       - Setup for local development (localhost MySQL)"
        echo "  production  - Setup for production deployment (Docker MySQL)"
        echo "  docker-dev  - Setup for Docker development environment"
        echo "  show        - Show current environment configuration"
        echo ""
        echo "Examples:"
        echo "  $0 local      # For local development with localhost MySQL"
        echo "  $0 production # For production deployment"
        echo "  $0 docker-dev # For Docker development"
        echo "  $0 show       # Show current settings"
        exit 1
        ;;
esac