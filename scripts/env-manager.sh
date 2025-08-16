#!/bin/bash

# ===========================================
# 🔧 Environment Configuration Manager
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}============================================${NC}"
}

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

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [ENVIRONMENT]"
    echo ""
    echo "Commands:"
    echo "  setup [env]     - Setup environment configuration"
    echo "  switch [env]    - Switch to different environment"
    echo "  validate        - Validate current .env file"
    echo "  backup          - Backup current .env file"
    echo "  restore [file]  - Restore .env from backup"
    echo "  clean           - Clean up old .env files"
    echo "  list            - List all available environments"
    echo "  compare         - Compare environments"
    echo ""
    echo "Environments:"
    echo "  production      - Production environment (secure)"
    echo "  development     - Development environment"
    echo "  local           - Local development"
    echo "  master          - Master template (all options)"
    echo ""
    echo "Examples:"
    echo "  $0 setup production"
    echo "  $0 switch development"
    echo "  $0 validate"
    echo "  $0 backup"
}

# Function to setup environment
setup_environment() {
    local env=$1
    
    print_header "🔧 Setting up $env environment"
    
    case $env in
        "production")
            if [ -f ".env.master" ]; then
                cp .env.master .env
                print_success "Copied master configuration to .env"
                print_warning "Please edit .env file with your production values!"
            else
                print_error ".env.master file not found!"
                exit 1
            fi
            ;;
        "development")
            if [ -f ".env.local" ]; then
                cp .env.local .env
                print_success "Copied development configuration to .env"
            else
                print_error ".env.local file not found!"
                exit 1
            fi
            ;;
        "local")
            if [ -f ".env.example" ]; then
                cp .env.example .env
                print_success "Copied example configuration to .env"
                print_warning "Please edit .env file with your local values!"
            else
                print_error ".env.example file not found!"
                exit 1
            fi
            ;;
        "master")
            if [ -f ".env.master" ]; then
                cp .env.master .env
                print_success "Copied master template to .env"
                print_warning "This contains ALL options - customize as needed!"
            else
                print_error ".env.master file not found!"
                exit 1
            fi
            ;;
        *)
            print_error "Unknown environment: $env"
            show_usage
            exit 1
            ;;
    esac
    
    print_status "Environment setup completed!"
    print_warning "Remember to:"
    echo "  1. Edit .env with your actual values"
    echo "  2. Never commit .env to version control"
    echo "  3. Keep backups of your configuration"
}

# Function to validate .env file
validate_env() {
    print_header "🔍 Validating .env configuration"
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        exit 1
    fi
    
    local errors=0
    
    # Check required variables
    required_vars=(
        "DATABASE_URL"
        "DATABASE_HOST"
        "DATABASE_USER"
        "DATABASE_PASSWORD"
        "DATABASE_NAME"
        "JWT_SECRET"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "NODE_ENV"
    )
    
    print_status "Checking required variables..."
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            print_error "Missing required variable: $var"
            ((errors++))
        elif grep -q "^${var}=$" .env || grep -q "^${var}=YOUR_" .env || grep -q "^${var}=your_" .env; then
            print_warning "Variable $var appears to have placeholder value"
            ((errors++))
        else
            print_success "✓ $var is set"
        fi
    done
    
    # Check for security issues
    print_status "Checking security configuration..."
    
    if grep -q "DATABASE_PASSWORD=1234" .env; then
        print_error "Using default database password! Change it immediately!"
        ((errors++))
    fi
    
    if grep -q "JWT_SECRET=.*dev.*" .env; then
        print_warning "JWT_SECRET appears to be a development key"
        ((errors++))
    fi
    
    if grep -q "NODE_ENV=development" .env && grep -q "NEXTAUTH_URL=https://" .env; then
        print_warning "Development environment with HTTPS URL - is this correct?"
    fi
    
    # Check Docker Compose compatibility
    print_status "Checking Docker Compose compatibility..."
    
    if [ -f "docker-compose.yml" ]; then
        if grep -q "DATABASE_HOST=mysql" .env; then
            print_success "✓ Database host configured for Docker"
        else
            print_warning "Database host might not be compatible with Docker Compose"
        fi
    fi
    
    if [ $errors -eq 0 ]; then
        print_success "🎉 Configuration validation passed!"
    else
        print_error "❌ Found $errors issues in configuration"
        exit 1
    fi
}

# Function to backup .env file
backup_env() {
    print_header "💾 Backing up .env configuration"
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        exit 1
    fi
    
    local backup_dir="backups/env"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$backup_dir/.env.backup.$timestamp"
    
    mkdir -p "$backup_dir"
    cp .env "$backup_file"
    
    print_success "Backup created: $backup_file"
    
    # Keep only last 10 backups
    ls -t "$backup_dir"/.env.backup.* 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    
    print_status "Old backups cleaned up (keeping last 10)"
}

# Function to list environments
list_environments() {
    print_header "📋 Available Environment Configurations"
    
    echo ""
    if [ -f ".env" ]; then
        echo -e "${GREEN}[ACTIVE]${NC} .env (current configuration)"
    else
        echo -e "${RED}[MISSING]${NC} .env (no active configuration)"
    fi
    
    echo ""
    echo "Available templates:"
    
    if [ -f ".env.master" ]; then
        echo -e "${BLUE}[TEMPLATE]${NC} .env.master (complete configuration with all options)"
    fi
    
    if [ -f ".env.production" ]; then
        echo -e "${BLUE}[TEMPLATE]${NC} .env.production (production environment)"
    fi
    
    if [ -f ".env.local" ]; then
        echo -e "${BLUE}[TEMPLATE]${NC} .env.local (local development)"
    fi
    
    if [ -f ".env.example" ]; then
        echo -e "${BLUE}[TEMPLATE]${NC} .env.example (example configuration)"
    fi
    
    if [ -f ".env.complete" ]; then
        echo -e "${BLUE}[TEMPLATE]${NC} .env.complete (complete secure configuration)"
    fi
    
    if [ -f ".env.template" ]; then
        echo -e "${BLUE}[TEMPLATE]${NC} .env.template (basic template)"
    fi
    
    echo ""
    if [ -d "backups/env" ]; then
        local backup_count=$(ls backups/env/.env.backup.* 2>/dev/null | wc -l)
        if [ $backup_count -gt 0 ]; then
            echo -e "${YELLOW}[BACKUPS]${NC} Found $backup_count backup files in backups/env/"
        fi
    fi
}

# Function to clean up old .env files
clean_env() {
    print_header "🧹 Cleaning up environment files"
    
    print_status "Removing duplicate and old .env files..."
    
    # List files to be removed
    local files_to_remove=()
    
    # Check for duplicate files
    if [ -f ".env.example" ] && [ -f ".env.template" ]; then
        if cmp -s ".env.example" ".env.template"; then
            files_to_remove+=(".env.template")
        fi
    fi
    
    # Remove old backup files (older than 30 days)
    if [ -d "backups/env" ]; then
        find backups/env -name ".env.backup.*" -mtime +30 -type f | while read file; do
            files_to_remove+=("$file")
        done
    fi
    
    if [ ${#files_to_remove[@]} -eq 0 ]; then
        print_success "No files to clean up"
    else
        for file in "${files_to_remove[@]}"; do
            if [ -f "$file" ]; then
                rm "$file"
                print_success "Removed: $file"
            fi
        done
    fi
    
    print_success "Cleanup completed!"
}

# Function to switch environment
switch_environment() {
    local env=$1
    
    print_header "🔄 Switching to $env environment"
    
    # Backup current .env if it exists
    if [ -f ".env" ]; then
        backup_env
    fi
    
    # Setup new environment
    setup_environment "$env"
    
    print_success "Switched to $env environment"
}

# Main script logic
case "${1:-}" in
    "setup")
        if [ -z "${2:-}" ]; then
            print_error "Please specify environment"
            show_usage
            exit 1
        fi
        setup_environment "$2"
        ;;
    "switch")
        if [ -z "${2:-}" ]; then
            print_error "Please specify environment"
            show_usage
            exit 1
        fi
        switch_environment "$2"
        ;;
    "validate")
        validate_env
        ;;
    "backup")
        backup_env
        ;;
    "list")
        list_environments
        ;;
    "clean")
        clean_env
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        print_error "Unknown command: ${1:-}"
        show_usage
        exit 1
        ;;
esac