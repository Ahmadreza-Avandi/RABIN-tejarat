#!/bin/bash

# ===========================================
# 🛠️ CRM Development Management Script
# ===========================================

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

show_help() {
    echo "🛠️ CRM Development Management Script"
    echo
    echo "Usage: ./dev.sh [COMMAND]"
    echo
    echo "Commands:"
    echo "  start       Start development environment"
    echo "  stop        Stop development environment"
    echo "  restart     Restart development environment"
    echo "  status      Show development services status"
    echo "  logs        Show development logs"
    echo "  db-reset    Reset development database"
    echo "  db-backup   Backup development database"
    echo "  db-restore  Restore development database"
    echo "  shell       Open shell in Next.js container"
    echo "  mysql       Open MySQL shell"
    echo "  clean       Clean development environment"
    echo "  help        Show this help message"
    echo
}

start_dev() {
    print_status "Starting development environment..."
    
    # Create .env.local if it doesn't exist
    if [ ! -f .env.local ]; then
        print_status "Creating .env.local file..."
        cp .env.local .env.local
    fi
    
    # Create necessary directories
    mkdir -p database backups logs
    
    # Copy SQL file to database directory
    if [ ! -f database/crm_system.sql ]; then
        cp crm_system.sql database/
    fi
    
    docker-compose -f docker-compose.dev.yml up -d --build
    
    print_success "Development environment started!"
    echo
    echo "📋 Development URLs:"
    echo "   🌐 Next.js App: http://localhost:3000"
    echo "   🗄️  phpMyAdmin: http://localhost:8080"
    echo "   🔍 Health Check: http://localhost:3000/api/health"
    echo
    echo "📊 Database Info:"
    echo "   Host: localhost:3307"
    echo "   User: root"
    echo "   Password: 1234"
    echo "   Database: crm_system"
}

stop_dev() {
    print_status "Stopping development environment..."
    docker-compose -f docker-compose.dev.yml down
    print_success "Development environment stopped"
}

restart_dev() {
    print_status "Restarting development environment..."
    docker-compose -f docker-compose.dev.yml restart
    print_success "Development environment restarted"
}

show_status() {
    print_status "Development Services Status:"
    docker-compose -f docker-compose.dev.yml ps
    echo
    print_status "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

show_logs() {
    if [ "$2" = "-f" ]; then
        docker-compose -f docker-compose.dev.yml logs -f
    else
        docker-compose -f docker-compose.dev.yml logs --tail=50
    fi
}

reset_database() {
    print_warning "This will reset the development database. Are you sure? (y/N)"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting development database..."
        
        # Stop and remove MySQL container
        docker-compose -f docker-compose.dev.yml stop mysql-dev
        docker-compose -f docker-compose.dev.yml rm -f mysql-dev
        
        # Remove MySQL volume
        docker volume rm crm-main_mysql_dev_data 2>/dev/null || true
        
        # Start MySQL again
        docker-compose -f docker-compose.dev.yml up -d mysql-dev
        
        # Wait for MySQL to be ready
        print_status "Waiting for MySQL to be ready..."
        sleep 30
        
        print_success "Development database reset completed"
    fi
}

backup_dev_db() {
    print_status "Creating development database backup..."
    BACKUP_FILE="backups/dev_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker-compose -f docker-compose.dev.yml exec -T mysql-dev mysqldump -u root -p1234 crm_system > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_success "Development database backup created: $BACKUP_FILE"
    else
        print_error "Development database backup failed"
    fi
}

restore_dev_db() {
    echo "Available development backups:"
    ls -la backups/dev_backup_*.sql 2>/dev/null || echo "No development backups found"
    echo
    read -p "Enter backup file name (without path): " backup_file
    
    if [ -f "backups/$backup_file" ]; then
        print_warning "This will overwrite the current development database. Are you sure? (y/N)"
        read -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Restoring development database from $backup_file..."
            docker-compose -f docker-compose.dev.yml exec -T mysql-dev mysql -u root -p1234 crm_system < "backups/$backup_file"
            
            if [ $? -eq 0 ]; then
                print_success "Development database restored successfully"
            else
                print_error "Development database restore failed"
            fi
        fi
    else
        print_error "Backup file not found: backups/$backup_file"
    fi
}

open_shell() {
    print_status "Opening shell in Next.js development container..."
    docker-compose -f docker-compose.dev.yml exec nextjs-dev /bin/sh
}

open_mysql() {
    print_status "Opening MySQL shell..."
    docker-compose -f docker-compose.dev.yml exec mysql-dev mysql -u root -p1234 crm_system
}

clean_dev() {
    print_warning "This will remove all development containers and volumes. Are you sure? (y/N)"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning development environment..."
        docker-compose -f docker-compose.dev.yml down -v --remove-orphans
        docker system prune -f
        print_success "Development environment cleaned"
    fi
}

# Main script logic
case "$1" in
    start)
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_dev
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    db-reset)
        reset_database
        ;;
    db-backup)
        backup_dev_db
        ;;
    db-restore)
        restore_dev_db
        ;;
    shell)
        open_shell
        ;;
    mysql)
        open_mysql
        ;;
    clean)
        clean_dev
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac